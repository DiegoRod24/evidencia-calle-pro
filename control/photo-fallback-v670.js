'use strict';
(()=>{
if(window.ONE_SHOT_PHOTO_FALLBACK_V670)return;window.ONE_SHOT_PHOTO_FALLBACK_V670=true;
const DB='one-shot-control-media',STORE='files';
let localRowsPromise=null;
const objectUrls=new WeakMap();
const norm=v=>String(v??'').trim();
const codeFromText=t=>{const m=norm(t).toUpperCase().match(/OS-(?:TRM-\d+|\d{8}-[A-Z0-9]+)/);return m?m[0]:''};
function score(r,code){const s=`${r?.path||''} ${r?.key||''}`.toUpperCase();let n=0;if(s.includes(code))n+=100;if(/FINAL|CORREGID|MARCADA|EDITAD/.test(s))n+=40;if(/ORIGINAL/.test(s))n+=15;if(/THUMB|MINIATURA/.test(s))n-=25;return n}
function openDb(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(new Error('IndexedDB no disponible'));const q=indexedDB.open(DB);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onupgradeneeded=()=>{try{q.transaction.abort()}catch(_){}reject(new Error('Sin copia multimedia local'))}})}
async function localRows(){if(localRowsPromise)return localRowsPromise;localRowsPromise=(async()=>{try{const db=await openDb();if(!db.objectStoreNames.contains(STORE)){db.close();return[]}const rows=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)});db.close();return rows.filter(r=>r?.blob instanceof Blob&&String(r.blob.type||'').startsWith('image/'))}catch(e){console.warn('[ONE SHOT photo fallback] sin IndexedDB multimedia',e);return[]}})();return localRowsPromise}
async function findLocal(code){code=norm(code).toUpperCase();if(!code)return null;const rows=await localRows(),hits=rows.filter(r=>`${r.path||''} ${r.key||''}`.toUpperCase().includes(code));if(!hits.length)return null;hits.sort((a,b)=>score(b,code)-score(a,code));return hits[0]}
function setChip(text,tone='local'){
 const host=document.querySelector('#evidencePreview .previewMedia');if(!host)return;
 let chip=host.querySelector('.photoFallbackChip');if(!chip){chip=document.createElement('div');chip.className='photoFallbackChip';chip.style.cssText='position:absolute;left:10px;top:10px;z-index:3;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900;box-shadow:0 2px 8px rgba(0,0,0,.18);pointer-events:none';host.style.position='relative';host.appendChild(chip)}
 chip.textContent=text;chip.style.background=tone==='local'?'#dcfce7':'#fff7d6';chip.style.color=tone==='local'?'#166534':'#8a5a00';chip.hidden=false;
}
function clearChip(){document.querySelector('.photoFallbackChip')?.remove()}
function release(img){const old=objectUrls.get(img);if(old){try{URL.revokeObjectURL(old)}catch(_){}objectUrls.delete(img)}}
function showMissing(img,code){release(img);img.removeAttribute('src');img.hidden=true;img.dataset.fallbackState='missing';if(img.id==='previewImg'){
 const empty=document.getElementById('previewEmpty');if(empty){empty.hidden=false;empty.innerHTML=`<b>📷 Foto temporalmente no disponible</b><br><span style="font-size:11px">${code||'Esta evidencia'} conserva su ruta en la central, pero Supabase Storage está restringido y esta PC no tiene una copia local de esa foto.</span>`}
 const open=document.getElementById('previewOpen');if(open){open.hidden=true;open.removeAttribute('href')}
 setChip('⚠ Foto central pendiente','warn');
}}
async function applyLocal(img,code){if(!img||img.dataset.fallbackBusy==='1')return false;img.dataset.fallbackBusy='1';try{const row=await findLocal(code);if(!row?.blob)return false;release(img);const url=URL.createObjectURL(row.blob);objectUrls.set(img,url);img.dataset.fallbackState='local';img.src=url;img.hidden=false;if(img.id==='previewImg'){
 const empty=document.getElementById('previewEmpty');if(empty)empty.hidden=true;
 const open=document.getElementById('previewOpen');if(open){open.href=url;open.hidden=false;open.textContent='Ver foto grande · copia local'}
 setChip('📦 Foto local de respaldo','local');
}
 return true}finally{img.dataset.fallbackBusy='0'}}
async function recoverPreview(force=false){const img=document.getElementById('previewImg');if(!img)return;const code=codeFromText(document.getElementById('previewCode')?.textContent||document.getElementById('eCode')?.textContent||img.src);if(!code)return;if(!force&&!window.ONE_SHOT_CENTRAL_FALLBACK_ACTIVE)return;const ok=await applyLocal(img,code);if(!ok&&window.ONE_SHOT_CENTRAL_FALLBACK_ACTIVE)showMissing(img,code)}
function onImageError(e){const img=e.target;if(!(img instanceof HTMLImageElement))return;if(img.dataset.fallbackState==='local'||img.dataset.fallbackState==='missing')return;const src=img.currentSrc||img.src||'';if(!/supabase\.co\/storage\/v1\/object\//i.test(src))return;const code=codeFromText(src)||codeFromText(document.getElementById('previewCode')?.textContent);(async()=>{const ok=await applyLocal(img,code);if(!ok)showMissing(img,code)})()}
function watch(){document.addEventListener('error',onImageError,true);const code=document.getElementById('previewCode');if(code)new MutationObserver(()=>setTimeout(()=>recoverPreview(true),30)).observe(code,{childList:true,subtree:true,characterData:true});const img=document.getElementById('previewImg');if(img)new MutationObserver(()=>{if(window.ONE_SHOT_CENTRAL_FALLBACK_ACTIVE&&/supabase\.co\/storage\/v1\/object\//i.test(img.src||''))setTimeout(()=>recoverPreview(true),20)}).observe(img,{attributes:true,attributeFilter:['src']});window.addEventListener('oneshot:photo-fallback-refresh',()=>recoverPreview(true));setTimeout(()=>recoverPreview(true),900);setTimeout(()=>recoverPreview(true),2200)}
function boot(){watch();console.info('[ONE SHOT CONTROL] photo fallback v6.70 · Supabase → IndexedDB → aviso limpio')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
