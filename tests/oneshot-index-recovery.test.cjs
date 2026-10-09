"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("one-shop-performance-v595.js", "utf8");
function makeEnvironment(diskRecords,initialRecords=[]) {
  const persisted=JSON.parse(JSON.stringify(diskRecords));
  const metrics={writes:0,render:0,reads:0};
  const context={
    window:{ONE_SHOT_PERFORMANCE_595:false,requestIdleCallback:(fn)=>queueMicrotask(fn)},
    State:{db:null,records:[...initialRecords]},
    Store:{hydrateFullRecords582(){},saveLite(){metrics.writes++}},
    Gallery:{render(){metrics.render++},updateLastShot(){}},
    Reports:{invalidate(){},renderSummary(){}},
    Evidence:{visible(){return context.State.records}},
    UI:{setView(){}},
    document:{hidden:false,addEventListener(){},getElementById(){return {classList:{contains:()=>false}}},querySelectorAll(){return []}},
    console:{info(){},warn(){}},CSS:{escape:x=>x},
    requestIdleCallback:fn=>queueMicrotask(fn),
    setTimeout:fn=>{queueMicrotask(fn);return 1},
    requestAnimationFrame:fn=>{queueMicrotask(fn);return 1},
    performance:{now:()=>0}
  };
  const db={transaction(){
    const tx={oncomplete:null,onerror:null,onabort:null,objectStore(name){
      assert.equal(name,"records");
      return{
        getAllKeys(){
          const q={};queueMicrotask(()=>q.onsuccess?.({target:{result:persisted.map(r=>r.id)}}));return q;
        },
        openCursor(){
          let i=0;const req={};
          function next(){queueMicrotask(()=>{
            metrics.reads++;
            if(i<persisted.length){
              const value=persisted[i++];
              req.onsuccess?.({target:{result:{value,continue:next}}});
            }else{
              req.onsuccess?.({target:{result:null}});
              queueMicrotask(()=>tx.oncomplete?.());
            }
          })}
          next();return req;
        },
        get(id){
          const q={};queueMicrotask(()=>q.onsuccess?.({target:{result:persisted.find(r=>r.id===id)||null}}));return q;
        }
      };
    }};
    return tx;
  }};
  context.State.db=db;
  vm.runInNewContext(source,context,{filename:"one-shop-performance-v595.js"});
  return{context,metrics,persisted};
}
(async()=>{
 const photo="data:image/jpeg;base64,AAABBBCC";
 const a=makeEnvironment([{id:"foto-1",photoCode:"OS-001",createdAt:"2026-09-29T12:00:00Z",image:photo,stampedImage:photo}]);
 // Falla en v5.9.25: esta llamada anterior no recorria la base cuando no habia lite.
 a.context.Store.hydrateFullRecords582();
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(a.context.State.records.length,1,"Debe reconstruirse el indice ausente");
 assert.equal(a.context.State.records[0].photoCode,"OS-001");
 assert.equal(a.context.State.records[0].image,undefined,"No duplicar foto en el indice liviano");
 assert.equal(a.context.State.records[0].stampedImage,undefined);
 assert.equal(a.persisted[0].image,photo,"El original debe permanecer intacto");
 assert.ok(a.metrics.render>=1,"Debe refrescar la pantalla sin reiniciar");
 assert.ok(a.metrics.writes>=1,"Debe conservar metadatos recuperados");
 const b=makeEnvironment([{id:"foto-2",image:photo}],[]);
 const result=await b.context.window.ONE_SHOT_MEDIA_LAZY_595.restoreMissingIndex();
 assert.equal(result.restored,1,"Rescate manual de foto en base principal");
 assert.equal(b.context.State.records.length,1);
 assert.equal(b.persisted[0].image,photo);
 const partial=makeEnvironment([
    {id:"foto-1",photoCode:"OS-001",image:photo},
    {id:"foto-3",photoCode:"OS-003",image:photo}
 ],[{id:"foto-1",photoCode:"OS-001"}]);
 partial.context.Store.hydrateFullRecords582();
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(partial.context.State.records.length,2,"Debe incluir fotos que faltan incluso con indice parcial");
 assert.deepEqual([...partial.context.State.records.map(x=>x.id)].sort(),["foto-1","foto-3"]);
 assert.equal(partial.persisted[1].image,photo,"No modificar fotografías originales");
 assert.equal(partial.metrics.writes,1,"El indice se actualiza una sola vez");
 const present=makeEnvironment([{id:"foto-4",image:photo}],[{id:"foto-4",photoCode:"OS-004"}]);
 const stable=await present.context.window.ONE_SHOT_MEDIA_LAZY_595.restoreMissingIndex();
 assert.equal(stable.restored,0,"No duplicar registros ya presentes");
 assert.equal(present.metrics.writes,0,"No reescribir un indice completo");
 const c=makeEnvironment([],[]);
 const empty=await c.context.window.ONE_SHOT_MEDIA_LAZY_595.restoreMissingIndex();
 assert.equal(empty.restored,0,"No inventar evidencias si DB esta vacia");
 assert.equal(c.metrics.writes,0,"No sobrescribir el indice sin recuperar nada");
 console.log("OK: recupera registros desde IndexedDB al iniciar o manualmente, conserva fotos y no inventa datos.");
})().catch(err=>{console.error(err);process.exit(1)});
