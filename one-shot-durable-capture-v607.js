"use strict";
/* ONE SHOT v5.9.25 · CAPTURA DURABLE VERIFICADA
   - No da por persistida una foto solo porque está en memoria.
   - Verifica lectura real desde IndexedDB y/o el baúl local.
   - Mantiene un diario liviano de metadatos para reconstruir evidencias.
   - Recupera fotos huérfanas que quedaron en oneshotMediaVault_v1.
*/
(()=>{
if(window.ONE_SHOT_DURABLE_CAPTURE_607)return;
window.ONE_SHOT_DURABLE_CAPTURE_607=true;

const BUILD='one-shot-v5.9.25-durable-capture-01';
const MAIN_DB='oneshotEvidenceDB_v2', MAIN_STORE='records';
const VAULT_DB='oneshotMediaVault_v1', VAULT_STORE='media';
const JOURNAL='oneshotCaptureJournalV1';
const MEDIA=['image','stampedImage','originalImage','correctedImage','correctedStampedImage','reportImage4x3','reportThumbnailImage','normalizedImage','rescuedImage','watermarkedImage','markedImage','evidenceImage'];
const pending=new Map();
const isImage=v=>typeof v==='string'&&v.startsWith('data:image/');
const hasMedia=r=>!!(r&&MEDIA.some(k=>isImage(r[k])));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function compact(r){
  const out={};
  for(const [k,v] of Object.entries(r||{})){
    if(MEDIA.includes(k)||isImage(v))continue;
    out[k]=v;
  }
  return out;
}
function minimal(r){
  return {
    id:r?.id||'',photoCode:r?.photoCode||'',verifyCode:r?.verifyCode||'',createdAt:r?.createdAt||'',fecha:r?.fecha||'',hora:r?.hora||'',
    address:r?.address||'',district:r?.district||'',province:r?.province||'',department:r?.department||'',ubigeo:r?.ubigeo||'',
    electionProcess:r?.electionProcess||'',type:r?.type||'PENDIENTE',status:r?.status||'Activo',party:r?.party||'',candidate:r?.candidate||'',candidateType:r?.candidateType||'',
    observation:r?.observation||'',gps:r?.gps||null,accuracy:r?.accuracy??'',altitude:r?.altitude??null,updatedAt:r?.updatedAt||'',persistenceStatus:r?.persistenceStatus||''
  };
}
function readJson(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch(_){return fallback}}
function writeJournal(record){
  if(!record?.id)return;
  try{
    const list=readJson(JOURNAL,[]);const arr=Array.isArray(list)?list:[];
    const row=minimal(record),idx=arr.findIndex(x=>String(x?.id)===String(row.id));
    if(idx>=0)arr[idx]={...arr[idx],...row};else arr.unshift(row);
    arr.sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')));
    localStorage.setItem(JOURNAL,JSON.stringify(arr.slice(0,800)));
  }catch(_){}
}
function safeLite(){
  try{
    const rows=(State.records||[]).map(compact);
    localStorage.setItem('oneshotRecordsLite',JSON.stringify(rows));
  }catch(_){
    try{localStorage.setItem('oneshotRecordsLite',JSON.stringify((State.records||[]).map(minimal).slice(0,1200)))}catch(__){}
  }
  try{localStorage.setItem('oneshotSettings',JSON.stringify(State.settings||{}))}catch(_){}
  try{localStorage.setItem('oneshotPlacesV4',JSON.stringify(State.places||[]))}catch(_){}
  try{localStorage.setItem('oneshotFieldBasesV44',JSON.stringify(State.fieldBases||[]))}catch(_){}
}
function openMain(){
  if(State.db)return Promise.resolve(State.db);
  return new Promise((resolve,reject)=>{
    try{
      const q=indexedDB.open(MAIN_DB);
      q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(MAIN_STORE))q.result.createObjectStore(MAIN_STORE,{keyPath:'id'})};
      q.onsuccess=()=>{State.db=q.result;resolve(q.result)};q.onerror=()=>reject(q.error||new Error('No se pudo abrir IndexedDB'));
    }catch(e){reject(e)}
  });
}
async function primaryGet(id){
  try{const db=await openMain();return await new Promise(resolve=>{const tx=db.transaction(MAIN_STORE,'readonly'),q=tx.objectStore(MAIN_STORE).get(id);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>resolve(null)})}catch(_){return null}
}
async function primaryPut(record){
  const db=await openMain();
  return new Promise((resolve,reject)=>{
    try{
      const tx=db.transaction(MAIN_STORE,'readwrite');tx.objectStore(MAIN_STORE).put(record);
      tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Error al guardar evidencia'));tx.onabort=()=>reject(tx.error||new Error('Guardado abortado'));
    }catch(e){reject(e)}
  });
}
function openVault(){
  return new Promise((resolve,reject)=>{
    try{
      const q=indexedDB.open(VAULT_DB);
      q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(VAULT_STORE))q.result.createObjectStore(VAULT_STORE,{keyPath:'key'})};
      q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||new Error('No se pudo abrir baúl local'));
    }catch(e){reject(e)}
  });
}
async function vaultRows(){
  let db;try{db=await openVault();return await new Promise(resolve=>{const tx=db.transaction(VAULT_STORE,'readonly'),q=tx.objectStore(VAULT_STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([])})}catch(_){return[]}finally{try{db?.close()}catch(_){}}
}
async function vaultVerified(record){
  try{
    const vault=window.ONE_SHOT_LOCAL_MEDIA_VAULT;
    if(!vault?.put||!vault?.getFor)return false;
    await vault.put(record);const recovered=await vault.getFor(record);return hasMedia(recovered);
  }catch(_){return false}
}
async function persistVerified(record,baseSave){
  if(!record?.id)return baseSave(record);
  writeJournal(record);
  let lastError=null,primaryOk=false,vaultOk=false;
  for(let attempt=1;attempt<=3;attempt++){
    try{await baseSave(record)}catch(e){lastError=e}
    let full=await primaryGet(record.id);primaryOk=hasMedia(full);
    if(!primaryOk){try{await primaryPut(record)}catch(e){lastError=e};full=await primaryGet(record.id);primaryOk=hasMedia(full)}
    vaultOk=await vaultVerified(record);
    if(primaryOk||vaultOk)break;
    await sleep(160*attempt);
  }
  if(!(primaryOk||vaultOk)){
    record.persistenceStatus='ERROR_NO_PERSISTIDO';record.persistenceVerifiedAt=new Date().toISOString();writeJournal(record);safeLite();
    throw lastError||new Error('La foto quedó en memoria pero el almacenamiento local no confirmó el guardado');
  }
  record.persistenceStatus=primaryOk&&vaultOk?'VERIFICADA_DOBLE':primaryOk?'VERIFICADA_INDEXEDDB':'VERIFICADA_BAUL';
  record.persistenceVerifiedAt=new Date().toISOString();writeJournal(record);safeLite();
  return {ok:true,primaryOk,vaultOk,status:record.persistenceStatus};
}
function mergeFallback(){
  const fallback=[];
  const lite=readJson('oneshotRecordsLite',[]),journal=readJson(JOURNAL,[]);
  if(Array.isArray(lite))fallback.push(...lite);if(Array.isArray(journal))fallback.push(...journal);
  const byId=new Map((State.records||[]).filter(r=>r?.id).map(r=>[String(r.id),r]));let added=0;
  for(const row of fallback){
    if(!row?.id)continue;const id=String(row.id),cur=byId.get(id);
    if(!cur){const r={...row,selected:false};State.records.push(r);byId.set(id,r);added++;continue}
    for(const [k,v] of Object.entries(row))if((cur[k]===undefined||cur[k]===null||cur[k]==='')&&v!==undefined&&v!==null&&v!=='')cur[k]=v;
  }
  if(added)State.records.sort((a,b)=>String(b.createdAt||b.updatedAt||'').localeCompare(String(a.createdAt||a.updatedAt||'')));
  return added;
}
function localDateParts(iso){
  const d=new Date(iso||Date.now());
  try{
    const fecha=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
    const hora=new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
    return{fecha,hora};
  }catch(_){return{fecha:d.toISOString().slice(0,10),hora:d.toTimeString().slice(0,8)}}
}
// Rescate progresivo: leer claves livianas, solo abrir fotos de IDs huerfanos.
// No elimina ni sobrescribe fotos existentes. Los registros con metadatos
// siguen usando el recuperador de fotos tradicional si les falta la imagen.
async function vaultKeys(){
 let db;try{
  db=await openVault();
  return await new Promise(resolve=>{
   try{const q=db.transaction(VAULT_STORE,'readonly').objectStore(VAULT_STORE).getAllKeys();
    q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([])}
   catch(_){resolve([])}
  });
 }catch(_){return []}finally{try{db?.close()}catch(_){}}
}
async function vaultForId(id){
 let db;try{
  db=await openVault();
  return await new Promise(resolve=>{
   try{
    const start=String(id)+'::',end=start+String.fromCharCode(0xffff);
    const q=db.transaction(VAULT_STORE,'readonly').objectStore(VAULT_STORE).getAll(IDBKeyRange.bound(start,end));
    q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([]);
   }catch(_){resolve([])}
  });
 }catch(_){return []}finally{try{db?.close()}catch(_){}}
}
async function primaryKeys(){
 try{
  const db=await openMain();
  return await new Promise(resolve=>{
   try{const q=db.transaction(MAIN_STORE,'readonly').objectStore(MAIN_STORE).getAllKeys();
    q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([])}
   catch(_){resolve([])}
  });
 }catch(_){return []}
}
async function rescueVaultOrphans(){
 const known=new Set((State.records||[]).filter(r=>r?.id).map(r=>String(r.id)));
 let added=0,hydrated=0;
 // Recuperar metadatos desde la base principal cuando se perdio el indice lite.
 const mainIds=await primaryKeys();
 for(let i=0;i<mainIds.length;i++){
  const id=String(mainIds[i]);if(known.has(id))continue;
  const full=await primaryGet(id);if(!full?.id)continue;
  State.records.push(compact(full));known.add(id);added++;writeJournal(full);
  if(i%3===2)await sleep(0);
 }
 // Luego buscar fotos que solo sobrevivieron en el baul independiente.
 const keys=await vaultKeys();
 const ids=[...new Set(keys.map(k=>{const txt=String(k),i=txt.lastIndexOf('::');return i>0?txt.slice(0,i):''}).filter(Boolean))];
 const missing=ids.filter(id=>!known.has(id));
 const count=document.getElementById('evidenceCount');
 if(missing.length&&count)count.textContent='Revisando '+missing.length+' fotos del baul local…';
 for(let i=0;i<missing.length;i++){
  const id=missing[i];if(known.has(id))continue;
  // Si IndexedDB principal conserva el registro, recuperar sus metadatos completos.
  const fromMain=await primaryGet(id);
  let rec=fromMain?.id?{...fromMain}:null;
  if(!hasMedia(rec)){
   const media=await vaultForId(id);
   const valid=media.filter(x=>x?.id&&isImage(x.value));
   if(!valid.length)continue;
   if(!rec){
    const savedAt=valid.map(x=>x.savedAt).filter(Boolean).sort()[0]||new Date().toISOString(),p=localDateParts(savedAt);
    rec={id,photoCode:valid.find(x=>x.photoCode)?.photoCode||`OS-RECUPERADA-${id.slice(0,8)}`,createdAt:savedAt,updatedAt:savedAt,fecha:p.fecha,hora:p.hora,type:'PENDIENTE',status:'Activo',address:'Evidencia recuperada del almacenamiento local',observation:'Recuperada automaticamente del baul local; revisar metadatos.',integrityStatus:'RECUPERADA · METADATOS PARCIALES',recoveryMetadataPartial:true,recoveredAt:new Date().toISOString(),selected:false};
   }
   let changed=false;for(const x of valid)if(!rec[x.field]&&isImage(x.value)){rec[x.field]=x.value;changed=true}
   if(changed){hydrated++;try{await primaryPut(rec)}catch(err){console.warn('[ONE SHOT] respaldo de foto recuperada pendiente',err)}}
  }
  if(!hasMedia(rec))continue;
  State.records.push(rec);known.add(id);added++;writeJournal(rec);
  if(i%3===2)await sleep(0);
 }
 if(added){
  State.records.sort((a,b)=>String(b.createdAt||b.updatedAt||'').localeCompare(String(a.createdAt||a.updatedAt||'')));
  safeLite();
  try{Reports?.invalidate?.();Reports?.renderSummary?.()}catch(_){}
  try{if(document.getElementById('viewEvidence')?.classList.contains('active'))Gallery?.render?.()}catch(_){}
 }
 return{added,hydrated,checked:mainIds.length+missing.length};
}
let recoveryScheduled=false;
function scheduleVaultRecovery(merged){
 if(recoveryScheduled)return;
 recoveryScheduled=true;
 const run=async()=>{
  try{
   const rescued=await rescueVaultOrphans();
   safeLite();
   try{localStorage.setItem('oneshotDurableRecoveryLast',JSON.stringify({at:new Date().toISOString(),merged,...rescued,total:(State.records||[]).length}))}catch(_){}
   if(rescued.added)console.info('[ONE SHOT] Fotos huerfanas recuperadas',rescued);
  }catch(e){console.warn('[ONE SHOT] recuperacion en segundo plano',e)}
 };
 setTimeout(()=>{
  if(window.requestIdleCallback)requestIdleCallback(()=>{run()},{timeout:3000});
  else setTimeout(run,0);
 },1600);
}
function patchStore(){
  if(!window.Store||Store.__durableCapture607)return false;
  Store.__durableCapture607=true;
  const baseSave=Store.save?.bind(Store),baseBatch=Store.saveBatch?.bind(Store),baseLoad=Store.load?.bind(Store);
  Store.saveLite=safeLite;
  if(baseSave)Store.save=function(record){
    const p=persistVerified(record,baseSave);if(record?.id){pending.set(String(record.id),p);p.finally(()=>{if(pending.get(String(record.id))===p)pending.delete(String(record.id))}).catch(()=>{})}return p;
  };
  if(baseBatch)Store.saveBatch=async function(records=State.records){for(const r of records||[])writeJournal(r);const out=await baseBatch(records);safeLite();return out};
  if(baseLoad)Store.load=async function(){await baseLoad();const merged=mergeFallback();safeLite();scheduleVaultRecovery(merged);return State.records};
  return true;
}
function patchCamera(){
  if(!window.Camera||Camera.__durableCapture607||!Camera.shoot)return false;
  Camera.__durableCapture607=true;const base=Camera.shoot.bind(Camera);
  Camera.shoot=async function(...args){
    const before=String(State.lastShotId||'');const result=await base(...args);const id=String(State.lastShotId||'');
    if(id&&id!==before){
      const p=pending.get(id);if(p){
        try{const s=await p;UI?.toast?.(`💾 ✓ Evidencia guardada en el dispositivo${s?.primaryOk&&s?.vaultOk?' · doble copia local':''}`,2600,{placement:'top',tone:'soft'})}
        catch(e){const rec=(State.records||[]).find(x=>String(x.id)===id);if(rec){rec.persistenceStatus='REINTENTO_PENDIENTE';writeJournal(rec)}UI?.toast?.('⚠ Foto tomada, pero el teléfono no confirmó el guardado. NO cierres ONE SHOT; se reintentará automáticamente.',6500,{placement:'top'});if(rec)setTimeout(()=>Store.save(rec).catch(()=>{}),1200)}
      }
    }
    return result;
  };
  return true;
}
async function audit(){
  const rows=await vaultRows(),ids=new Set(rows.filter(x=>isImage(x?.value)).map(x=>String(x.id))),records=State.records||[];
  return{build:BUILD,records:records.length,recordsWithMedia:records.filter(hasMedia).length,vaultEvidenceIds:ids.size,pending:[...pending.keys()],journal:(readJson(JOURNAL,[])||[]).length};
}
function boot(){
  patchStore();patchCamera();setTimeout(patchStore,40);setTimeout(patchCamera,60);setTimeout(patchStore,350);setTimeout(patchCamera,400);
  try{navigator.storage?.persist?.()}catch(_){}
  try{localStorage.setItem('oneshotDurableCaptureBuild',BUILD)}catch(_){}
  console.info('[ONE SHOT]',BUILD,'persistencia verificada activa');
}
boot();
window.ONE_SHOT_DURABLE_CAPTURE={BUILD,pending,audit,rescueVaultOrphans,primaryGet,primaryPut,safeLite};
})();
