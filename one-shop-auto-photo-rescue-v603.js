"use strict";
/* ONE SHOT v5.9.21 · Auto Photo Rescue
   - Revisa todas las evidencias existentes al abrir la versión corregida.
   - Recupera SOLO multimedia de registros que ya existen; no revive evidencias borradas.
   - Prioriza almacenamiento local: memoria/IndexedDB -> baúl local -> bases antiguas -> Drive configurado.
   - Si encuentra una foto, la vuelve a sembrar en el baúl independiente para próximas aperturas.
*/
(()=>{
if(window.ONE_SHOT_AUTO_PHOTO_RESCUE_603)return;
window.ONE_SHOT_AUTO_PHOTO_RESCUE_603=true;

const BUILD='one-shop-v5.9.21-auto-photo-rescue-01';
const MEDIA=['image','stampedImage','correctedImage','correctedStampedImage','reportImage4x3','originalImage','rescuedImage','watermarkedImage','markedImage','evidenceImage'];
const hasPhoto=r=>!!(r&&MEDIA.some(k=>typeof r[k]==='string'&&r[k].startsWith('data:image/')));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let running=false;

function runtimeReady(){
  return !!(
    window.State && Array.isArray(State.records) &&
    window.ONE_SHOT_PHOTO_RECOVERY?.recoverOne &&
    window.ONE_SHOT_LOCAL_MEDIA_VAULT?.put
  );
}

async function waitReady(timeoutMs=15000){
  const start=Date.now();
  while(Date.now()-start<timeoutMs){
    if(runtimeReady())return true;
    await sleep(250);
  }
  return runtimeReady();
}

async function run({silent=false}={}){
  if(running)return null;
  if(!(await waitReady()))return null;
  running=true;

  const rows=[...(State.records||[])];
  let available=0,recovered=0,missing=0,seeded=0;
  const sources={memory:0,indexeddb:0,vault:0,legacy:0,drive:0,other:0};

  try{
    for(let i=0;i<rows.length;i+=2){
      const part=rows.slice(i,i+2);
      await Promise.all(part.map(async row=>{
        if(!row?.id)return;
        let live=(State.records||[]).find(x=>String(x.id)===String(row.id))||row;
        if(hasPhoto(live)){
          available++;
          sources.memory++;
          try{seeded+=await ONE_SHOT_LOCAL_MEDIA_VAULT.put(live)}catch(_){}
          return;
        }

        let result=null;
        try{result=await ONE_SHOT_PHOTO_RECOVERY.recoverOne(row.id,{legacy:true,paint:false})}catch(_){}
        live=(State.records||[]).find(x=>String(x.id)===String(row.id))||live;
        if(result?.ok&&hasPhoto(live)){
          available++;
          recovered++;
          const src=String(result.source||'other').toLowerCase();
          if(Object.prototype.hasOwnProperty.call(sources,src))sources[src]++;else sources.other++;
          try{seeded+=await ONE_SHOT_LOCAL_MEDIA_VAULT.put(live)}catch(_){}
        }else{
          missing++;
        }
      }));
      if(i%12===0)await sleep(0);
    }

    try{Store?.saveLite?.();Reports?.invalidate?.()}catch(_){}
    try{Gallery?.render?.()}catch(_){}

    const audit={
      build:BUILD,
      at:new Date().toISOString(),
      total:rows.length,
      available,
      recovered,
      missing,
      seeded,
      sources
    };
    try{localStorage.setItem('oneshotPhotoRescue603Last',JSON.stringify(audit))}catch(_){}

    if(!silent&&recovered>0){
      UI?.toast?.(`📷 ${recovered} foto${recovered===1?'':'s'} recuperada${recovered===1?'':'s'} y protegida${recovered===1?'':'s'} en el celular`,4200,{placement:'top'});
    }else if(!silent&&rows.length&&missing>0){
      UI?.toast?.(`📷 ${available}/${rows.length} evidencias conservan foto local · ${missing} requieren respaldo externo`,4200,{placement:'top'});
    }

    console.info('[ONE SHOT]',BUILD,'rescate automático',audit);
    return audit;
  }finally{
    running=false;
  }
}

async function boot(){
  // Da tiempo al núcleo para abrir IndexedDB y cargar State.records.
  await sleep(1800);
  const last=(()=>{try{return JSON.parse(localStorage.getItem('oneshotPhotoRescue603Last')||'null')}catch(_){return null}})();
  // Ejecutar siempre al menos una vez por nueva carga/build. Si la revisión anterior dejó
  // faltantes, repetir silenciosamente porque Drive/almacenamiento puede estar disponible ahora.
  const shouldRun=!last||last.build!==BUILD||Number(last.missing||0)>0;
  if(shouldRun)await run({silent:false});
  else{
    // Aunque ya se recuperó todo, resembra el baúl si la app fue actualizada/reanudada.
    try{for(const r of State.records||[])if(hasPhoto(r))await ONE_SHOT_LOCAL_MEDIA_VAULT.put(r)}catch(_){}
  }
  try{localStorage.setItem('oneshotAutoPhotoRescueBuild',BUILD)}catch(_){}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

window.ONE_SHOT_AUTO_PHOTO_RESCUE={run,BUILD};
})();
