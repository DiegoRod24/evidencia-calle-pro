"use strict";
// Ejecuta la lógica real de persistVerified extraída del módulo, sin teléfono.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const durable=fs.readFileSync('one-shot-durable-capture-v607.js','utf8');
const start=durable.indexOf('const EDIT_FIELDS='),end=durable.indexOf('\nfunction mergeFallback(){',start);
assert(start>0&&end>start,'No se encontró el bloque de verificación real');
const verifyCode=durable.slice(start,end);
const pic='data:image/jpeg;base64,ORIGINAL';
function simulate(oldRecord,opts={}){
 let persisted=structuredClone(oldRecord||null),putCount=0,lite=0;
 const ctx={
   MEDIA:['image','stampedImage','correctedImage','correctedStampedImage','reportImage4x3','originalImage'],
   writeJournal(){},safeLite(){lite++},
   hasMedia:r=>!!(r&&['image','stampedImage','correctedImage','correctedStampedImage'].some(k=>String(r[k]||'').startsWith('data:image/'))),
   primaryGet:async()=>persisted&&structuredClone(persisted),
   primaryPut:async record=>{putCount++;if(opts.blockPut)throw new Error('QuotaExceededError');persisted=structuredClone(record);return true},
   vaultVerified:async()=>true,
   sleep:async()=>{},
   Date,JSON,String,console,Error
 };
 vm.runInNewContext(verifyCode+'\nthis.runVerified=persistVerified;',ctx,{filename:'one-shot-durable-capture-v607.js'});
 return{
   ctx,verify:r=>ctx.runVerified(r,async _r=>{if(opts.baseWrites)persisted=structuredClone(_r)}),
   state:()=>({persisted,putCount,lite})
 };
}
(async()=>{
 // Editor antiguo: baseSave resolvía aunque la escritura no hubiera ocurrido.
 {
   const db=simulate({id:'OS-1',type:'PENDIENTE',party:'',image:pic});
   const edited={id:'OS-1',type:'BANNER',party:'PARTIDO DEMOCRATICO SOMOS PERU',updatedAt:'2026-10-09T00:00:00Z'};
   const result=await db.verify(edited);
   assert(result.ok&&result.primaryOk);
   assert.equal(db.state().persisted.type,'BANNER');
   assert.equal(db.state().persisted.party,edited.party);
   assert.equal(db.state().persisted.image,pic,'El original no debe perderse al guardar un registro lite');
   assert(db.state().putCount>0,'Debe reintentar escritura de metadatos');
 }
 // Si la base está llena/bloqueada, tener la foto en el baúl NO permite mostrar éxito.
 {
   const db=simulate({id:'OS-2',type:'PENDIENTE',image:pic},{blockPut:true});
   await assert.rejects(()=>db.verify({id:'OS-2',type:'PANEL',party:'TEST'}),/QuotaExceededError/);
   assert.equal(db.state().persisted.type,'PENDIENTE','La base NO ha guardado la edición');
 }
 // El editor de marco debe conservar la foto original y la derivada corregida.
 {
   const corrected='data:image/jpeg;base64,CORREGIDA';
   const db=simulate({id:'OS-3',type:'BANNER',image:pic,correctedImage:'data:image/jpeg;base64,ANTIGUA'});
   const rec={id:'OS-3',type:'BANNER',image:pic,correctedImage:corrected,correctedStampedImage:'',frameEdited:true,frameTransform:{rotation:90,format:'4:3'}};
   await db.verify(rec);
   assert.equal(db.state().persisted.image,pic);
   assert.equal(db.state().persisted.correctedImage,corrected);
   assert.deepEqual(JSON.parse(JSON.stringify(db.state().persisted.frameTransform)),{rotation:90,format:'4:3'});
 }
 // Una captura nueva sí debe persistir, no puede bastar con un toast.
 {
   const db=simulate(null,{baseWrites:true});
   await db.verify({id:'OS-4',type:'BANNER',image:pic});
   assert.equal(db.state().persisted.image,pic);
 }
 const field=fs.readFileSync('one-shop-field-tools-v571.js','utf8');
 const perf=fs.readFileSync('one-shop-performance-v595.js','utf8');
 const repair=fs.readFileSync('one-shop-broken-image-repair-v604.js','utf8');
 assert(field.includes('NO SE GUARDÓ: '),'El editor debe avisar si falla guardar');
 assert(field.includes('await api.primaryGet(r.id)'),'El editor debe comprobar la base');
 assert(field.includes("r.reportImage4x3=''"),'Invalidar imagen vieja de reporte cuando se corrige marco');
 assert(perf.includes("src=r.correctedStampedImage||r.correctedImage||r.stampedImage"),'La galería debe mostrar la corrección primero');
 assert(repair.includes("const MEDIA=['correctedStampedImage','correctedImage'"),'El reparador debe mostrar la corrección primero');
 console.log('OK: edición verificada, fallo real rechazado, original conservado, corrección visible y confirmación de UI protegida.');
})().catch(e=>{console.error(e);process.exitCode=1});
