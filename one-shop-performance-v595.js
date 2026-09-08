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
try{
 if(Store?.hydrateFullRecords582){Store.__fullHydrateLegacy595=Store.hydrateFullRecords582;Store.hydrateFullRecords582=function(){if(!State.db||document.hidden)return;idle(()=>{warmLatest();if(document.getElementById('viewEvidence')?.classList.contains('active'))hydrateIds(visibleIds(10),10).then(observeCards)},1200)}}
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
window.ONE_SHOT_MEDIA_LAZY_595={hydrateOne,hydrateIds,observeCards,hydratedCount:()=>hydrated.size};
setTimeout(()=>idle(warmLatest,1200),700);
try{localStorage.setItem('oneshotRuntimeBuild',BUILD)}catch(_){}
console.info('[ONE SHOT]',BUILD,'fotos bajo demanda');
})();
