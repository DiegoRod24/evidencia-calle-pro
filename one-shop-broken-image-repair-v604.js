"use strict";
/* ONE SHOT v5.9.22 · Broken image repair
   - La galería histórica solo pintaba stampedImage || image.
   - Si otra copia válida seguía en el registro (reportImage4x3, corrected*, original*)
     la tarjeta podía verse negra aunque la foto existiera.
   - Si un <img> falla, intenta recuperación local por ID y repinta la misma tarjeta.
*/
(()=>{
if(window.ONE_SHOT_BROKEN_IMAGE_REPAIR_604)return;
window.ONE_SHOT_BROKEN_IMAGE_REPAIR_604=true;
const BUILD='one-shop-v5.9.22-broken-image-repair-01';
const MEDIA=['reportImage4x3','correctedStampedImage','stampedImage','correctedImage','image','originalImage','rescuedImage','watermarkedImage','markedImage','evidenceImage'];
const attempts=new Map();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const dataImage=v=>typeof v==='string'&&v.startsWith('data:image/');
const liveUrl=v=>typeof v==='string'&&(/^(blob:|https?:\/\/|file:|capacitor:)/i.test(v));
function bestSource(r){
  if(!r)return'';
  for(const k of MEDIA)if(dataImage(r[k]))return r[k];
  for(const k of MEDIA)if(liveUrl(r[k]))return r[k];
  return'';
}
function recordById(id){return (window.State?.records||[]).find(r=>String(r.id)===String(id))||null}
function badge(card,text,tone='work'){
  const media=card?.querySelector?.('.eMedia');if(!media)return;
  let b=media.querySelector('.osPhotoRepairBadge');
  if(!b){b=document.createElement('span');b.className='osPhotoRepairBadge';media.appendChild(b)}
  b.dataset.tone=tone;b.textContent=text;
}
function clearBadge(card){card?.querySelector?.('.osPhotoRepairBadge')?.remove()}
function ensureCss(){
  if(document.getElementById('osPhotoRepair604Css'))return;
  const s=document.createElement('style');s.id='osPhotoRepair604Css';s.textContent=`
  .eMedia{position:relative}.osPhotoRepairBadge{position:absolute;left:10px;right:10px;bottom:10px;z-index:4;padding:7px 9px;border-radius:10px;background:rgba(8,22,42,.82);color:#fff;font:800 10px/1.25 system-ui;text-align:center;backdrop-filter:blur(4px);pointer-events:none}.osPhotoRepairBadge[data-tone="bad"]{background:rgba(127,29,29,.88)}.osPhotoRepairBadge[data-tone="ok"]{background:rgba(20,83,45,.86)}
  `;document.head.appendChild(s)
}
function paint(card,r){
  const img=card?.querySelector?.('.eMedia img, img');if(!img)return false;
  const src=bestSource(r);if(!src)return false;
  img.dataset.osRepairing='0';
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
  clearBadge(card);card.dataset.photoState='ok';return true;
}
async function rescue(card,id,{force=false}={}){
  if(!card||!id)return false;
  const key=String(id),now=Date.now(),last=attempts.get(key)||0;
  if(!force&&now-last<2500)return false;
  attempts.set(key,now);
  const img=card.querySelector('.eMedia img, img');
  if(img?.dataset.osRepairing==='1')return false;
  if(img)img.dataset.osRepairing='1';
  card.dataset.photoState='recovering';badge(card,'📷 Recuperando foto guardada…');

  let rec=recordById(id);
  if(paint(card,rec))return true;

  let result=null;
  try{
    result=await window.ONE_SHOT_PHOTO_RECOVERY?.recoverOne?.(id,{legacy:true,paint:false});
  }catch(e){console.warn('[ONE SHOT photo repair] recoverOne',id,e)}
  rec=recordById(id)||rec;
  if(paint(card,rec)){
    try{await window.ONE_SHOT_LOCAL_MEDIA_VAULT?.put?.(rec)}catch(_){}
    badge(card,'✓ Foto recuperada','ok');setTimeout(()=>clearBadge(card),1400);
    return true;
  }

  if(img)img.dataset.osRepairing='0';
  card.dataset.photoState='missing';
  const source=String(result?.source||'');
  badge(card,source==='not_found'?'📷 Foto no encontrada en el almacenamiento de este equipo':'📷 Foto pendiente de recuperar','bad');
  return false;
}
function reconcileCard(card){
  const id=card?.dataset?.id;if(!id)return;
  const rec=recordById(id);if(paint(card,rec))return;
  const img=card.querySelector('.eMedia img, img');
  const raw=img?.getAttribute('src')||'';
  if(!raw||raw==='undefined'||raw==='null')rescue(card,id).catch(()=>{});
}
function reconcileAll(){
  ensureCss();
  document.querySelectorAll('#evidenceList .eCard[data-id]').forEach(reconcileCard);
}
function hookGallery(){
  if(!window.Gallery||Gallery.__brokenImageRepair604)return false;
  Gallery.__brokenImageRepair604=true;
  const base=Gallery.render.bind(Gallery);
  Gallery.render=function(...args){const out=base(...args);setTimeout(reconcileAll,0);return out};
  return true;
}
function hookViewer(){
  if(!window.Viewer||Viewer.__brokenImageRepair604||!Viewer.open)return false;
  Viewer.__brokenImageRepair604=true;
  const base=Viewer.open.bind(Viewer);
  Viewer.open=async function(id,...rest){
    const card=[...document.querySelectorAll('#evidenceList .eCard[data-id]')].find(c=>String(c.dataset.id)===String(id));
    if(card&&!bestSource(recordById(id)))await rescue(card,id,{force:true});
    return base(id,...rest)
  };
  return true;
}
function bindErrors(){
  if(window.__OS_PHOTO_ERROR_BOUND_604)return;window.__OS_PHOTO_ERROR_BOUND_604=true;
  document.addEventListener('error',e=>{
    const img=e.target;if(!(img instanceof HTMLImageElement))return;
    const card=img.closest?.('#evidenceList .eCard[data-id]');if(!card)return;
    rescue(card,card.dataset.id,{force:true}).catch(()=>{});
  },true);
}
async function boot(){
  ensureCss();
  for(let i=0;i<20;i++){
    const g=hookGallery(),v=hookViewer();
    if(g){bindErrors();reconcileAll();break}
    await sleep(100);
  }
  bindErrors();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(reconcileAll,80)});
  window.addEventListener('pageshow',()=>setTimeout(reconcileAll,80));
  try{localStorage.setItem('oneshotBrokenImageRepairBuild',BUILD)}catch(_){}
  console.info('[ONE SHOT]',BUILD,'reparación de imágenes activa');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ONE_SHOT_BROKEN_IMAGE_REPAIR={reconcileAll,rescue,bestSource,BUILD};
})();
