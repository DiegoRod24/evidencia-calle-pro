/* ONE SHOP v5.7.5 · CAMPO ESTABLE + CAPTURA 4:3 + TERRITORIO */
(()=>{
'use strict';
if(window.ONE_SHOP_STABLE_RUNTIME)return;
const BUILD='one-shop-v5.7.5-capture-report-01';
const $=id=>document.getElementById(id);
const idle=cb=>('requestIdleCallback'in window?requestIdleCallback(cb,{timeout:7000}):setTimeout(cb,3500));
const loaded=new Map();
const txt=v=>String(v??'').trim();
const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function toast(m,ms=2400){try{UI?.toast?.(m,ms,{placement:'top',tone:'soft'})}catch(_){}}
function loadScript(src,key){if(key&&window[key])return Promise.resolve(window[key]);if(loaded.has(src))return loaded.get(src);const p=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>resolve(key?window[key]:true);s.onerror=()=>{loaded.delete(src);reject(new Error('No se pudo cargar '+src))};document.head.appendChild(s)});loaded.set(src,p);return p}
function loadCss(href){if(document.querySelector(`link[data-one-shop-css="${href}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.oneShopCss=href;document.head.appendChild(l)}
async function excel(){await loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js','ExcelJS');await loadScript('/one-field-report-standard.js','ONE_FIELD_REPORT_STANDARD');try{window.ONE_FIELD_REPORT_STANDARD?.patch?.()}catch(_){}return window.ExcelJS}
function leaflet(){loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');return loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','L')}
function fieldTools(){return loadScript('/one-shop-field-tools-v571.js','ONE_SHOP_FIELD_TOOLS')}
function replay(el,type='click'){const ev=type==='click'?new MouseEvent('click',{bubbles:true,cancelable:true,view:window}):new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(ev,'__oneShopReplay',{value:true});el.dispatchEvent(ev)}
const excelIds=new Set(['previewReportBtn','downloadXlsxBtn','shareXlsxBtn','previewDownloadBtn','previewShareBtn','bulkDownloadExcel','bulkShareExcel']);
const mapIds=new Set(['coverageOpenBtn','placesRadarBtn','editOpenMaps','viewerMaps','sscStartDrawBtn','sscGpsSquareBtn']);

document.addEventListener('click',e=>{
  if(e.__oneShopReplay)return;
  const el=e.target?.closest?.('button,a,label,[data-view],[data-nav]');if(!el)return;
  const id=el.id||'',t=((el.textContent||'')+' '+id+' '+(el.dataset?.view||'')+' '+(el.dataset?.nav||'')).toLowerCase();
  if(/evidencia|editar|lugares|territorio|tramo|cartel|pancarta/.test(t))fieldTools().then(()=>{try{if(/lugares|territorio|tramo|cartel|pancarta/.test(t))window.ONE_SHOP_FIELD_TOOLS?.injectTramo?.();if(/editar/.test(t)&&document.getElementById('editModal')?.classList.contains('open'))window.ONE_SHOP_FIELD_TOOLS?.injectEditor?.()}catch(_){}}).catch(()=>{});
  let dep=null,label='';
  if(excelIds.has(id)||/excel|xlsx/.test(t)){dep=excel();label='Excel'}
  else if(mapIds.has(id)||/cobertura territorial|mapa real|dibujar sector/.test(t)){dep=leaflet();label='mapa'}
  if(!dep)return;
  e.preventDefault();e.stopImmediatePropagation();const old=el.disabled;el.disabled=true;toast(`Preparando ${label}…`,1300);dep.then(()=>{el.disabled=old;replay(el)}).catch(err=>{el.disabled=old;toast(err.message||String(err),3200)});
},true);

document.addEventListener('change',e=>{if(e.__oneShopReplay)return;const el=e.target;if(!el)return;if(el.id==='fieldBaseExcelInput'){e.stopImmediatePropagation();excel().then(()=>replay(el,'change')).catch(err=>toast(err.message||String(err),3200))}},true);

function report43(dataUrl){
  return new Promise(resolve=>{
    if(!/^data:image\//i.test(dataUrl||''))return resolve(dataUrl||'');
    const img=new Image();
    img.onload=()=>{try{
      const W=1600,H=1200,c=document.createElement('canvas');c.width=W;c.height=H;
      const ctx=c.getContext('2d',{alpha:false});
      ctx.fillStyle='#0B1320';ctx.fillRect(0,0,W,H);
      const bg=Math.max(W/Math.max(1,img.naturalWidth),H/Math.max(1,img.naturalHeight));
      const bw=img.naturalWidth*bg,bh=img.naturalHeight*bg;
      ctx.save();ctx.globalAlpha=.34;try{ctx.filter='blur(28px) brightness(.72)'}catch(_){};
      ctx.drawImage(img,(W-bw)/2,(H-bh)/2,bw,bh);ctx.restore();
      const pad=18,fg=Math.min((W-pad*2)/Math.max(1,img.naturalWidth),(H-pad*2)/Math.max(1,img.naturalHeight));
      const fw=img.naturalWidth*fg,fh=img.naturalHeight*fg;
      ctx.drawImage(img,(W-fw)/2,(H-fh)/2,fw,fh);
      ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4);
      resolve(c.toDataURL('image/jpeg',.91));
    }catch(_){resolve(dataUrl)}};
    img.onerror=()=>resolve(dataUrl);img.src=dataUrl;
  });
}

function normalizeTerritory(rec){
  if(!rec)return false;
  let changed=false;
  const pending=v=>!txt(v)||/pendiente|no disponible/i.test(txt(v));
  if(pending(rec.department)&&!pending(rec.region)){rec.department=rec.region;changed=true}
  if(pending(rec.province)){
    const city=txt(rec.city),dep=txt(rec.department),dist=txt(rec.district);
    if(city){rec.province=city;changed=true}
    else if(norm(dep)==='LIMA'&&dist){rec.province='Lima';changed=true}
  }
  if(pending(rec.district)){
    const city=txt(rec.city);
    if(city){rec.district=city;changed=true}
  }
  if(rec.department)rec.region=rec.department;
  return changed;
}

function patchCaptureStandard(){
  try{
    if(typeof Evidence==='undefined'||typeof Store==='undefined'||Evidence.__oneShop575Capture)return;
    Evidence.__oneShop575Capture=true;
    const baseFinalize=Evidence.finalize.bind(Evidence);
    Evidence.finalize=async rec=>{
      await baseFinalize(rec);
      try{
        const changed=normalizeTerritory(rec);
        const source=rec.correctedStampedImage||rec.stampedImage||rec.correctedImage||rec.image||'';
        if(source&&(!rec.reportImage4x3||rec.reportImageSourceHash!==rec.stampedHash)){
          rec.reportImage4x3=await report43(source);
          rec.reportImageVersion='4:3-v1';
          rec.reportImageWidth=1600;rec.reportImageHeight=1200;
          rec.reportImageSourceHash=rec.stampedHash||rec.sourceHash||'';
          rec.reportImageUpdatedAt=new Date().toISOString();
        }
        if(changed||rec.reportImage4x3){
          rec.updatedAt=rec.updatedAt||new Date().toISOString();
          await Store.save(rec);try{Store.saveLite?.()}catch(_){};try{Reports?.invalidate?.()}catch(_){};
          if(document.getElementById('viewEvidence')?.classList.contains('active'))try{Gallery?.render?.()}catch(_){}
        }
      }catch(err){console.warn('ONE SHOP estándar 4:3/territorio',err)}
      return rec;
    };
  }catch(_){}
}

function patchBoot(){
  try{if(typeof State!=='undefined'&&!window.State)window.State=State}catch(_){}
  try{localStorage.setItem('oneshotAppliedBuild',BUILD);localStorage.setItem('oneshotRuntimeBuild',BUILD)}catch(_){}
  patchCaptureStandard();
  try{if(typeof AppUpdater!=='undefined'&&!AppUpdater.__oneShopStable){AppUpdater.__oneShopStable=true;const base=AppUpdater.check.bind(AppUpdater);AppUpdater.check=async(force=false)=>{if(!force){const t=$('updateAppText');if(t)t.textContent='Actualización manual · app operativa';return}return base(true)}}}catch(_){}
  try{if(typeof EasyInstall!=='undefined')EasyInstall.maybePrompt=()=>{}}catch(_){}
  try{if(typeof Places!=='undefined'&&Places.promptRelation&&!Places.__stablePrompt){const base=Places.promptRelation.bind(Places);Places.__stablePrompt=base;Places.promptRelation=()=>null}}catch(_){}
  try{if(typeof State!=='undefined'&&State.settings){if(localStorage.getItem('oneShopStablePrefs575')!=='1'||State.settings.nearbyHistoryEnabled!==false){State.settings.nearbyHistoryEnabled=false;localStorage.setItem('oneShopStablePrefs575','1');try{Store?.saveLite?.()}catch(_){}}}}catch(_){}
  try{if(typeof LegacyVault!=='undefined'&&LegacyVault.recover&&!LegacyVault.__stableDeferred){LegacyVault.__stableDeferred=true;const base=LegacyVault.recover.bind(LegacyVault);let scheduled=false;LegacyVault.recover=async(auto=false)=>{if(!auto)return base(false);if(!scheduled){scheduled=true;idle(()=>base(true).catch(()=>{}))}return{found:0,added:0,updated:0,deferred:true}}}}catch(_){}
  try{if(typeof Places!=='undefined'&&Places.migrate&&!Places.__stableDeferredMigrate){Places.__stableDeferredMigrate=true;const base=Places.migrate.bind(Places);let scheduled=false;Places.migrate=async()=>{if(!scheduled){scheduled=true;idle(()=>base().catch(()=>{}))}return 0}}}catch(_){}
  const deferNames=[['TerritoryPlanner','render'],['SmartSectorCoverage','render'],['TeamMissions','render'],['SmartRoute','render'],['FieldBases','render'],['Reports','renderSummary']];
  for(const [objName,method] of deferNames){try{const obj=globalThis[objName]||eval(objName);if(!obj||typeof obj[method]!=='function'||obj[`__stable_${method}`])continue;const base=obj[method].bind(obj);obj[`__stable_${method}`]=base;let first=true;obj[method]=(...a)=>{if(first){first=false;idle(()=>{try{base(...a)}catch(_){}});return}return base(...a)}}catch(_){}}
  try{navigator.permissions?.query?.({name:'camera'}).then(p=>{if(p?.state!=='granted')return;setTimeout(()=>{try{if(typeof State!=='undefined'&&State.cameraStatus!=='active')Camera?.start?.({silent:true})}catch(_){}},120)}).catch(()=>{})}catch(_){}
}
function injectOptionalCloud(){const grid=document.querySelector('.toolGrid');if(!grid||$('oneShopOptionalCloud'))return;const b=document.createElement('button');b.id='oneShopOptionalCloud';b.className='toolAction';b.innerHTML='<span>☁</span><b>Respaldo nube / migrar</b><small>Opcional · solo responsable</small>';grid.appendChild(b);b.onclick=async()=>{b.disabled=true;const old=b.innerHTML;b.innerHTML='<span>☁</span><b>Preparando respaldo…</b><small>No afecta la captura local</small>';try{loadCss('/one-dropbox-legacy-sync.css');for(const src of ['/one-dropbox-legacy-sync.js','/one-dropbox-write-diagnostic.js','/one-dropbox-same-origin-proxy.js','/one-phase1-batch-migration.js','/one-migrate-to-one-shot2.js'])await loadScript(src);window.ONE_SHOP_TO_ONE_SHOT2?.open?.()||window.OneShotLegacyCloud?.open?.('Respaldo opcional')}catch(err){toast('No se pudo abrir respaldo · '+(err.message||err),3600)}finally{b.disabled=false;b.innerHTML=old}}}
function styleEvidence(){if($('oneShopStableCss'))return;const s=document.createElement('style');s.id='oneShopStableCss';s.textContent=`#evidenceList .eMedia{background:#071326!important;overflow:hidden!important;aspect-ratio:4/3!important}#evidenceList .eMedia img,.reportPreviewList img{object-fit:contain!important;object-position:center!important;background:#071326!important}#oneShopOptionalCloud small{color:inherit;opacity:.72}`;document.head.appendChild(s)}
function boot(){patchBoot();styleEvidence();injectOptionalCloud();setTimeout(()=>{patchBoot();injectOptionalCloud()},500);setTimeout(()=>{patchBoot();injectOptionalCloud()},1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ONE_SHOP_STABLE_RUNTIME={BUILD,excel,leaflet,fieldTools,patchBoot,report43,normalizeTerritory};
})();
