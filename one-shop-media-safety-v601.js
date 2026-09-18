"use strict";
/* ONE SHOT v5.9.19 · blindaje de multimedia local
   Nunca permite que un registro lite borre fotos ya guardadas en IndexedDB.
*/
(()=>{
if(window.ONE_SHOT_MEDIA_SAFETY_601)return;window.ONE_SHOT_MEDIA_SAFETY_601=true;
const BUILD='one-shop-v5.9.19-media-safety-01';
const MEDIA=['image','stampedImage','correctedImage','correctedStampedImage','reportImage4x3','originalImage','normalizedImage','rescuedImage','watermarkedImage','markedImage','evidenceImage'];
const hasMedia=r=>!!(r&&MEDIA.some(k=>typeof r[k]==='string'&&r[k].startsWith('data:image/')));
function getFull(id){
  return new Promise(resolve=>{
    if(!window.State?.db||!id)return resolve(null);
    try{
      const tx=State.db.transaction('records','readonly');
      const q=tx.objectStore('records').get(id);
      q.onsuccess=()=>resolve(q.result||null);
      q.onerror=()=>resolve(null);
    }catch(_){resolve(null)}
  });
}
function mergeMedia(target,full){
  if(!target||!full)return target;
  for(const k of MEDIA)if(!target[k]&&full[k])target[k]=full[k];
  for(const k of ['sourceHash','stampedHash','sourceWidth','sourceHeight','aspectRatio']){
    if((target[k]===undefined||target[k]===null||target[k]==='')&&full[k]!==undefined)target[k]=full[k];
  }
  return target;
}
async function protectRecord(r){
  if(!r?.id||hasMedia(r)||!State?.db)return r;
  const full=await getFull(r.id);
  if(full&&hasMedia(full))mergeMedia(r,full);
  return r;
}
async function protectList(list){
  const rows=Array.from(list||[]);
  for(let i=0;i<rows.length;i+=4)await Promise.all(rows.slice(i,i+4).map(protectRecord));
  return rows;
}
function patch(){
  if(!window.Store||Store.__mediaSafety601)return false;
  Store.__mediaSafety601=true;
  const save=Store.save?.bind(Store);
  const batch=Store.saveBatch?.bind(Store);
  if(save)Store.save=async function(r){await protectRecord(r);return save(r)};
  if(batch)Store.saveBatch=async function(records=State.records){const safe=await protectList(records);return batch(safe)};
  if(Store.saveAll)Store.saveAll=async function(){return Store.saveBatch(State.records)};
  return true;
}
async function requestPersistence(){
  try{
    if(!navigator.storage?.persist)return;
    const already=await navigator.storage.persisted?.().catch(()=>false);
    if(already)return;
    const granted=await navigator.storage.persist();
    try{localStorage.setItem('oneshotStoragePersistent',granted?'1':'0')}catch(_){}
  }catch(_){}
}
function boot(){
  patch();
  setTimeout(patch,80);
  setTimeout(patch,500);
  requestPersistence();
  try{localStorage.setItem('oneshotMediaSafetyBuild',BUILD)}catch(_){}
  console.info('[ONE SHOT]',BUILD,'blindaje multimedia activo');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ONE_SHOT_MEDIA_SAFETY={protectRecord,protectList,getFull};
})();