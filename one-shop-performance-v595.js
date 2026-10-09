"use strict";
/* ONE SHOT v5.9.15 · rendimiento: metadatos primero, fotos bajo demanda */
(()=>{
if(window.ONE_SHOT_PERFORMANCE_595)return;window.ONE_SHOT_PERFORMANCE_595=true;
const BUILD='one-shop-v5.9.15-media-on-demand-01';
const hydrated=new Set(),inflight=new Map();
const idle=(fn,timeout=2200)=>window.requestIdleCallback?requestIdleCallback(fn,{timeout}):setTimeout(fn,Math.min(timeout,900));
const heavy=r=>!!(r&&(r.image||r.stampedImage||r.correctedImage||r.correctedStampedImage||r.reportImage4x3));
function fullById(id){return new Promise(resolve=>{if(!State.db||!id)return resolve(null);try{const tx=State.db.transaction('records','readonly'),q=tx.objectStore('records').get(id);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>resolve(null)}catch(_){resolve(null)}})}
function mergeLiteFull(lite,full){if(!full)return lite;return{...full,...lite,image:full.image||lite.image||'',stampedImage:full.stampedImage||lite.stampedImage||'',correctedImage:full.correctedImage||lite.correctedImage||'',correctedStampedImage:full.correctedStampedImage||lite.correctedStampedImage||'',reportImage4x3:full.reportImage4x3||lite.reportImage4x3||''}}
function paintCard(id,r){const card=document.querySelector(`#evidenceList .eCard[data-id="${CSS.escape(String(id))}"]`);if(!card||!r)return;const img=card.querySelector('img'),src=r.reportImage4x3||r.correctedStampedImage||r.stampedImage||r.image||'';if(img&&src&&img.src!==src)img.src=src}
async function hydrateOne(id,{last=false,card=true}={}){if(!id)return null;const idx=State.records.findIndex(r=>r.id===id);if(idx<0)return null;const current=State.records[idx];if(heavy(current)){hydrated.add(id);if(card)paintCard(id,current);return current}if(inflight.has(id))return inflight.get(id);const p=(async()=>{const full=await fullById(id);if(!full)return current;const liveIdx=State.records.findIndex(r=>r.id===id);if(liveIdx<0)return full;const merged=mergeLiteFull(State.records[liveIdx],full);State.records[liveIdx]=merged;hydrated.add(id);if(card)paintCard(id,merged);if(last&&State.records[0]?.id===id){try{State.lastShotId=id;Gallery.updateLastShot(merged)}catch(_){}}return merged})().finally(()=>inflight.delete(id));inflight.set(id,p);return p}
async function hydrateIds(ids,limit=12){const unique=[...new Set((ids||[]).filter(Boolean))].slice(0,limit);for(let i=0;i<unique.length;i+=3){if(document.hidden)break;await Promise.all(unique.slice(i,i+3).map(id=>hydrateOne(id)));await new Promise(r=>setTimeout(r,0))}}
function visibleIds(limit=16){try{return (Evidence.visible?.()||State.records||[]).filter(r=>!heavy(r)).slice(0,limit).map(r=>r.id)}catch(_){return(State.records||[]).filter(r=>!heavy(r)).slice(0,limit).map(r=>r.id)}}
let io=null;
function observeCards(){if(!('IntersectionObserver'in window))return;io?.disconnect();io=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;const id=e.target?.dataset?.id;if(id)hydrateOne(id);io.unobserve(e.target)}},{root:null,rootMargin:'500px 0px'});document.querySelectorAll('#evidenceList .eCard[data-id]').forEach(card=>io.observe(card))}
function warmLatest(){const id=State.records?.[0]?.id;if(id)hydrateOne(id,{last:true,card:false})}

const FIELDS_MEDIA_INDEX_595=new Set(['image','stampedImage','originalImage','correctedImage','correctedStampedImage','reportImage4x3','reportThumbnailImage','normalizedImage','rescuedImage','watermarkedImage','markedImage','evidenceImage']);
function onlyMetadata595(r){
 const out={};for(const [k,v] of Object.entries(r||{})){if(FIELDS_MEDIA_INDEX_595.has(k)||(typeof v==='string'&&v.startsWith('data:image/')))continue;out[k]=v}return out;
}
let indexRecovery595=null;
// La version anterior anulaba Store.hydrateFullRecords582. Cuando el indice
// lite estaba vacio, NUNCA recorria IndexedDB, aunque las fotos existieran.
function restoreMissingIndex595(){
 if(indexRecovery595)return indexRecovery595;
 if(!State.db)return Promise.resolve({restored:0,reason:'db_unavailable'});
 const old=(State.records||[]).length;
 if(old>0)return Promise.resolve({restored:0,reason:'index_present'});
 indexRecovery595=new Promise(resolve=>{
  const rows=[];let scanned=0,tx;
  let settled=false;
  const finish=(result)=>{if(settled)return;settled=true;resolve(result)};
  try{
   tx=State.db.transaction('records','readonly');
   const q=tx.objectStore('records').openCursor();
   q.onsuccess=e=>{
    const cur=e.target.result;if(!cur)return;
    scanned++;
    if(cur.value?.id)rows.push(onlyMetadata595(cur.value));
    cur.continue();
   };
   q.onerror=()=>finish({restored:0,reason:'cursor_error'});
   tx.onerror=tx.onabort=()=>finish({restored:0,reason:'transaction_error'});
   tx.oncomplete=()=>{
    const byId=new Map((State.records||[]).filter(r=>r?.id).map(r=>[String(r.id),r]));
    let restored=0;
    for(const r of rows)if(!byId.has(String(r.id))){byId.set(String(r.id),r);restored++}
    if(restored){
      State.records=[...byId.values()].sort((a,b)=>String(b.createdAt||b.updatedAt||'').localeCompare(String(a.createdAt||a.updatedAt||'')));
      try{Store.saveLite?.()}catch(e){console.warn('[ONE SHOT] fallo indice lite',e)}
      try{Reports?.invalidate?.();Reports?.renderSummary?.()}catch(_){}
      try{Gallery.render?.()}catch(e){console.warn('[ONE SHOT] fallo repintado evidencias',e)}
      console.info('[ONE SHOT] indice recuperado desde DB principal',restored);
    }
    finish({scanned,restored});
   };
  }catch(e){finish({restored:0,reason:String(e?.message||e)})}
 }).finally(()=>{indexRecovery595=null});
 return indexRecovery595;
}

try{
 if(Store?.hydrateFullRecords582){Store.__fullHydrateLegacy595=Store.hydrateFullRecords582;Store.hydrateFullRecords582=function(){if(!State.db)return;if(!(State.records||[]).length){idle(()=>restoreMissingIndex595().catch(e=>console.warn('[ONE SHOT] recuperacion del indice',e)),750);return}if(document.hidden)return;idle(()=>{warmLatest();if(document.getElementById('viewEvidence')?.classList.contains('active'))hydrateIds(visibleIds(10),10).then(observeCards)},1200)}}
}catch(e){console.warn('[ONE SHOT perf] hydrate patch',e)}
try{
 const baseRender=Gallery.render.bind(Gallery);Gallery.render=function(){const out=baseRender();requestAnimationFrame(observeCards);return out};
}catch(e){console.warn('[ONE SHOT perf] gallery patch',e)}
try{
 const baseView=UI.setView.bind(UI);UI.setView=function(name){const out=baseView(name);if(name==='Evidence'){requestAnimationFrame(observeCards);idle(()=>hydrateIds(visibleIds(12),12).then(observeCards),900)}return out};
}catch(e){console.warn('[ONE SHOT perf] view patch',e)}
try{
 if(typeof Viewer!=='undefined'&&Viewer.open){const baseOpen=Viewer.open.bind(Viewer);Viewer.open=async function(id){await hydrateOne(id,{card:false});return baseOpen(id)}}
}catch(e){console.warn('[ONE SHOT perf] viewer patch',e)}
document.addEventListener('pointerdown',e=>{const card=e.target.closest?.('#evidenceList .eCard[data-id]');if(card?.dataset?.id)hydrateOne(card.dataset.id,{card:false})},{capture:true,passive:true});
window.ONE_SHOT_MEDIA_LAZY_595={hydrateOne,hydrateIds,observeCards,restoreMissingIndex:restoreMissingIndex595,hydratedCount:()=>hydrated.size};
setTimeout(()=>idle(warmLatest,1200),700);
try{localStorage.setItem('oneshotRuntimeBuild',BUILD)}catch(_){}
console.info('[ONE SHOT]',BUILD,'fotos bajo demanda');
})();
