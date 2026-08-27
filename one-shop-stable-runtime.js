/* ONE SHOP v5.7.0 · CAMPO ESTABLE · PRODUCCION */
(()=>{
'use strict';
if(window.ONE_SHOP_STABLE_RUNTIME)return;
const BUILD='one-shop-v5.7.0-campo-estable-01';
const $=id=>document.getElementById(id);
const idle=cb=>('requestIdleCallback'in window?requestIdleCallback(cb,{timeout:7000}):setTimeout(cb,3500));
const loaded=new Map();
function toast(m,ms=2400){try{UI?.toast?.(m,ms,{placement:'top',tone:'soft'})}catch(_){}}
function loadScript(src,key){if(key&&window[key])return Promise.resolve(window[key]);if(loaded.has(src))return loaded.get(src);const p=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>resolve(key?window[key]:true);s.onerror=()=>reject(new Error('No se pudo cargar '+src));document.head.appendChild(s)});loaded.set(src,p);return p}
function loadCss(href){if(document.querySelector(`link[data-one-shop-css="${href}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.oneShopCss=href;document.head.appendChild(l)}
async function excel(){await loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js','ExcelJS');await loadScript('/one-field-report-standard.js','ONE_FIELD_REPORT_STANDARD');try{window.ONE_FIELD_REPORT_STANDARD?.patch?.()}catch(_){}return window.ExcelJS}
function leaflet(){loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');return loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','L')}
function replay(el,type='click'){const ev=type==='click'?new MouseEvent('click',{bubbles:true,cancelable:true,view:window}):new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(ev,'__oneShopReplay',{value:true});el.dispatchEvent(ev)}
const excelIds=new Set(['previewReportBtn','downloadXlsxBtn','shareXlsxBtn','previewDownloadBtn','previewShareBtn','bulkDownloadExcel','bulkShareExcel']);
const mapIds=new Set(['coverageOpenBtn','placesRadarBtn','editOpenMaps','viewerMaps','sscStartDrawBtn','sscGpsSquareBtn']);
document.addEventListener('click',e=>{if(e.__oneShopReplay)return;const el=e.target?.closest?.('button,a,label');if(!el)return;const id=el.id||'';const txt=(el.textContent||'').toLowerCase();let dep=null,label='';if(excelIds.has(id)||/excel|xlsx/.test(txt)){dep=excel();label='Excel'}else if(mapIds.has(id)||/cobertura territorial|mapa real|dibujar sector/.test(txt)){dep=leaflet();label='mapa'}if(!dep)return;e.preventDefault();e.stopImmediatePropagation();const old=el.disabled;el.disabled=true;toast(`Preparando ${label}…`,1300);dep.then(()=>{el.disabled=old;replay(el)}).catch(err=>{el.disabled=old;toast(err.message||String(err),3200)})},true);
document.addEventListener('change',e=>{if(e.__oneShopReplay)return;const el=e.target;if(!el)return;if(el.id==='fieldBaseExcelInput'){e.stopImmediatePropagation();excel().then(()=>replay(el,'change')).catch(err=>toast(err.message||String(err),3200))}},true);

function patchBoot(){
  try{localStorage.setItem('oneshotAppliedBuild',BUILD);localStorage.setItem('oneshotRuntimeBuild',BUILD)}catch(_){}
  try{if(typeof AppUpdater!=='undefined'&&!AppUpdater.__oneShopStable){AppUpdater.__oneShopStable=true;const base=AppUpdater.check.bind(AppUpdater);AppUpdater.check=async(force=false)=>{if(!force){const t=$('updateAppText');if(t)t.textContent='Actualización manual · app operativa';return}return base(true)}}}catch(_){}
  try{if(typeof EasyInstall!=='undefined')EasyInstall.maybePrompt=()=>{}}catch(_){}
  try{if(typeof Places!=='undefined'&&Places.promptRelation&&!Places.__stablePrompt){const base=Places.promptRelation.bind(Places);Places.__stablePrompt=base;Places.promptRelation=()=>null}}catch(_){}
  try{if(typeof State!=='undefined'&&State.settings){if(localStorage.getItem('oneShopStablePrefs570')!=='1'||State.settings.nearbyHistoryEnabled!==false){State.settings.nearbyHistoryEnabled=false;localStorage.setItem('oneShopStablePrefs570','1');try{Store?.saveLite?.()}catch(_){}}}}catch(_){}
  try{if(typeof LegacyVault!=='undefined'&&LegacyVault.recover&&!LegacyVault.__stableDeferred){LegacyVault.__stableDeferred=true;const base=LegacyVault.recover.bind(LegacyVault);let scheduled=false;LegacyVault.recover=async(auto=false)=>{if(!auto)return base(false);if(!scheduled){scheduled=true;idle(()=>base(true).catch(()=>{}) )}return{found:0,added:0,updated:0,deferred:true}}}}catch(_){}
  try{if(typeof Places!=='undefined'&&Places.migrate&&!Places.__stableDeferredMigrate){Places.__stableDeferredMigrate=true;const base=Places.migrate.bind(Places);let scheduled=false;Places.migrate=async()=>{if(!scheduled){scheduled=true;idle(()=>base().catch(()=>{}))}return 0}}}catch(_){}
  const deferNames=[['TerritoryPlanner','render'],['SmartSectorCoverage','render'],['TeamMissions','render'],['SmartRoute','render'],['FieldBases','render'],['Reports','renderSummary']];
  for(const [objName,method] of deferNames){try{const obj=globalThis[objName]||eval(objName);if(!obj||typeof obj[method]!=='function'||obj[`__stable_${method}`])continue;const base=obj[method].bind(obj);obj[`__stable_${method}`]=base;let first=true;obj[method]=(...a)=>{if(first){first=false;idle(()=>{try{base(...a)}catch(_){}});return}return base(...a)}}catch(_){}}
  try{navigator.permissions?.query?.({name:'camera'}).then(p=>{if(p?.state!=='granted')return;setTimeout(()=>{try{if(typeof State!=='undefined'&&State.cameraStatus!=='active')Camera?.start?.({silent:true})}catch(_){}},120)}).catch(()=>{})}catch(_){}
}

function injectOptionalCloud(){const grid=document.querySelector('.toolGrid');if(!grid||$('oneShopOptionalCloud'))return;const b=document.createElement('button');b.id='oneShopOptionalCloud';b.className='toolAction';b.innerHTML='<span>☁</span><b>Respaldo nube / migrar</b><small>Opcional · solo responsable</small>';grid.appendChild(b);b.onclick=async()=>{b.disabled=true;const old=b.innerHTML;b.innerHTML='<span>☁</span><b>Preparando respaldo…</b><small>No afecta la captura local</small>';try{loadCss('/one-dropbox-legacy-sync.css');for(const src of ['/one-dropbox-legacy-sync.js','/one-dropbox-write-diagnostic.js','/one-dropbox-same-origin-proxy.js','/one-phase1-batch-migration.js','/one-migrate-to-one-shot2.js'])await loadScript(src);window.ONE_SHOP_TO_ONE_SHOT2?.open?.()||window.OneShotLegacyCloud?.open?.('Respaldo opcional');}catch(err){toast('No se pudo abrir respaldo · '+(err.message||err),3600)}finally{b.disabled=false;b.innerHTML=old}}}
function styleEvidence(){if($('oneShopStableCss'))return;const s=document.createElement('style');s.id='oneShopStableCss';s.textContent=`#evidenceList .eThumb,#evidenceList .eImage,.reportPreviewList img{aspect-ratio:4/3!important;object-fit:contain!important;background:#071326!important}#oneShopOptionalCloud small{color:inherit;opacity:.72}`;document.head.appendChild(s)}
function boot(){patchBoot();styleEvidence();injectOptionalCloud();setTimeout(()=>{patchBoot();injectOptionalCloud()},500);setTimeout(()=>{patchBoot();injectOptionalCloud()},1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ONE_SHOP_STABLE_RUNTIME={BUILD,excel,leaflet,patchBoot};
})();
