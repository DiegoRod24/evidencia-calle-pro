"use strict";
/* ONE SHOT v5.9.20 · Local Media Vault
   Fuente principal de multimedia: almacenamiento local del propio teléfono.
   Duplica ORIGINAL/FINAL en una base separada para que cambios de metadatos no puedan borrarlas.
   Vigila cuota disponible y bloquea nuevas capturas cuando el navegador reporta espacio crítico.
*/
(()=>{
if(window.ONE_SHOT_LOCAL_MEDIA_VAULT_602)return;window.ONE_SHOT_LOCAL_MEDIA_VAULT_602=true;
const BUILD='one-shop-v5.9.20-local-media-vault-01';
const DB='oneshotMediaVault_v1',STORE='media';
const FIELDS=['image','stampedImage','originalImage','correctedImage','correctedStampedImage','reportImage4x3','rescuedImage','watermarkedImage','markedImage','evidenceImage'];
const isImage=v=>typeof v==='string'&&v.startsWith('data:image/');
const key=(id,field)=>String(id)+'::'+field;
function open(){return new Promise((resolve,reject)=>{try{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'key'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)}catch(e){reject(e)}})}
async function put(record){
 if(!record?.id)return 0;const rows=[];for(const field of FIELDS){const value=record[field];if(isImage(value))rows.push({key:key(record.id,field),id:String(record.id),photoCode:String(record.photoCode||''),field,value,savedAt:new Date().toISOString()})}
 if(!rows.length)return 0;let db;try{db=await open();await new Promise(resolve=>{const tx=db.transaction(STORE,'readwrite'),os=tx.objectStore(STORE);rows.forEach(x=>os.put(x));tx.oncomplete=tx.onerror=tx.onabort=()=>resolve()});return rows.length}catch(_){return 0}finally{try{db?.close()}catch(_){}}
}
async function getFor(record){
 if(!record?.id)return null;let db;try{db=await open();const all=await new Promise(resolve=>{const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([])});const mine=all.filter(x=>x.id===String(record.id)||(record.photoCode&&x.photoCode===String(record.photoCode)));if(!mine.length)return null;const out={...record};for(const x of mine)if(!out[x.field]&&isImage(x.value))out[x.field]=x.value;return out}catch(_){return null}finally{try{db?.close()}catch(_){}}
}
async function migrateCurrent(){let n=0;for(let i=0;i<(State.records||[]).length;i+=3){const part=State.records.slice(i,i+3);const rr=await Promise.all(part.map(put));n+=rr.reduce((a,b)=>a+b,0);await new Promise(r=>setTimeout(r,0))}try{localStorage.setItem('oneshotMediaVaultSeededAt',new Date().toISOString())}catch(_){}return n}
async function storageInfo(){
 try{if(!navigator.storage?.estimate)return null;const e=await navigator.storage.estimate(),usage=Number(e.usage||0),quota=Number(e.quota||0),free=Math.max(0,quota-usage),ratio=quota?usage/quota:0;return{usage,quota,free,ratio}}catch(_){return null}
}
function fmt(n){if(!Number.isFinite(n))return'?';const u=['B','KB','MB','GB'];let i=0,v=n;while(v>=1024&&i<u.length-1){v/=1024;i++}return(v>=10||i===0?v.toFixed(0):v.toFixed(1))+' '+u[i]}
async function ensureSpace(show=true){
 const s=await storageInfo();if(!s)return true;const critical=s.free<80*1024*1024||s.ratio>=.97,warn=s.free<250*1024*1024||s.ratio>=.90;
 try{localStorage.setItem('oneshotStorageLast',JSON.stringify({...s,at:new Date().toISOString()}))}catch(_){}
 if(critical&&show)UI?.toast?.('⚠ Espacio local crítico · libera espacio o exporta antes de tomar más fotos',4200,{placement:'top'});
 else if(warn&&show)UI?.toast?.('⚠ Poco espacio local · quedan aprox. '+fmt(s.free),3200,{placement:'top'});
 return !critical;
}
function patchStore(){
 if(!window.Store||Store.__localVault602)return false;Store.__localVault602=true;
 const save=Store.save?.bind(Store),batch=Store.saveBatch?.bind(Store),del=Store.delete?.bind(Store);
 if(save)Store.save=async function(r){try{await put(r)}catch(_){}return save(r)};
 if(batch)Store.saveBatch=async function(records=State.records){try{for(let i=0;i<(records||[]).length;i+=4)await Promise.all(records.slice(i,i+4).map(put))}catch(_){}return batch(records)};
 if(del)Store.delete=async function(id){let db;try{db=await open();const rows=await new Promise(resolve=>{const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([])});await new Promise(resolve=>{const tx=db.transaction(STORE,'readwrite'),os=tx.objectStore(STORE);rows.filter(x=>x.id===String(id)).forEach(x=>os.delete(x.key));tx.oncomplete=tx.onerror=tx.onabort=()=>resolve()})}catch(_){}finally{try{db?.close()}catch(_){}}return del(id)};
 return true;
}
function patchCamera(){
 if(!window.Camera||Camera.__localSpace602||!Camera.shoot)return false;Camera.__localSpace602=true;const base=Camera.shoot.bind(Camera);
 Camera.shoot=async function(...args){const ok=await ensureSpace(true);if(!ok){UI?.toast?.('Captura detenida para proteger tus evidencias · libera espacio en el celular',4500,{placement:'top'});return false}return base(...args)};
 return true;
}
function injectStatus(){
 const host=document.querySelector('#viewConfig .configCard')||document.getElementById('viewConfig');if(!host||document.getElementById('localStorageStatus602'))return;
 const el=document.createElement('div');el.id='localStorageStatus602';el.style.cssText='margin:10px 0;padding:11px 12px;border:1px solid #cbd9ee;border-radius:13px;background:#f8fbff;font-size:11px;font-weight:800;color:#173a6b';el.textContent='💾 Revisando almacenamiento local…';host.appendChild(el);
 const paint=async()=>{const s=await storageInfo();if(!s)return el.textContent='💾 Evidencias guardadas localmente';el.textContent='💾 Local · '+fmt(s.usage)+' usados · aprox. '+fmt(s.free)+' disponibles'};paint();setInterval(paint,60000);
}
async function boot(){patchStore();patchCamera();setTimeout(patchStore,80);setTimeout(patchCamera,120);injectStatus();try{await navigator.storage?.persist?.()}catch(_){}setTimeout(()=>migrateCurrent().catch(()=>{}),1800);setTimeout(()=>ensureSpace(false),2200);try{localStorage.setItem('oneshotLocalMediaVaultBuild',BUILD)}catch(_){}console.info('[ONE SHOT]',BUILD,'baúl local activo')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ONE_SHOT_LOCAL_MEDIA_VAULT={put,getFor,migrateCurrent,storageInfo,ensureSpace,BUILD};
})();