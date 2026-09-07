'use strict';
(()=>{
if(window.ONE_SHOT_AUDIT_LITE_V663)return;
window.ONE_SHOT_AUDIT_LITE_V663=true;
const $=id=>document.getElementById(id);
const norm=v=>String(v??'').trim();
let CFG=null,READY=new Map(),timer=0,loading=false;
async function config(){
  if(CFG)return CFG;
  const src=[...document.scripts].map(s=>s.src).find(s=>/\/control\/app\.js/.test(s))||'app.js';
  const text=await fetch(src,{cache:'force-cache'}).then(r=>r.text());
  const url=(text.match(/SUPA_URL='([^']+)'/)||[])[1];
  const key=(text.match(/SUPA_KEY='([^']+)'/)||[])[1];
  if(!url||!key)throw new Error('Configuración central no disponible');
  return CFG={url,key};
}
async function getReadiness(){
  const c=await config();
  const r=await fetch(`${c.url}/rest/v1/control_evidence_readiness?select=code,audit_state,audit_score,blocking_reasons,ready_for_export&order=code`,{cache:'no-store',headers:{apikey:c.key,Authorization:'Bearer '+c.key}});
  if(!r.ok)throw new Error(`Readiness HTTP ${r.status}`);
  return r.json();
}
const color=s=>s==='ACEPTADA'?'#16a34a':s==='LISTA'?'#2563eb':s==='BLOQUEADA'?'#dc2626':'#f59e0b';
const label=s=>s==='ACEPTADA'?'Aceptada':s==='LISTA'?'Lista para salida':s==='BLOQUEADA'?'Bloqueada':'En revisión';
function patchKpi(){
  if(!$('kPending'))return;
  const rows=[...READY.values()];
  $('kPending').textContent=rows.filter(r=>r.audit_state!=='ACEPTADA').length;
  const s=$('kPending').nextElementSibling;if(s)s.textContent='Por auditar';
}
function patchLegend(){
  const host=document.querySelector('.legend'); if(!host||host.dataset.v663)return;
  host.dataset.v663='1';
  const hint=$('mapHint');
  const items=[['#dc2626','Bloqueada'],['#f59e0b','En revisión'],['#2563eb','Lista'],['#16a34a','Aceptada']];
  items.forEach(([c,t])=>{const x=document.createElement('span');x.className='v663Legend';x.innerHTML=`<i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};margin-right:5px"></i>${t}`;host.insertBefore(x,hint||null)});
}
function patchMarkers(){
  document.querySelectorAll('.nm-marker[data-code]').forEach(m=>{
    const r=READY.get(m.dataset.code); if(!r)return;
    m.style.setProperty('--mc',color(r.audit_state));
    m.dataset.auditState=r.audit_state;
    m.title=`${m.dataset.code} · ${label(r.audit_state)}${r.blocking_reasons?.length?' · Falta: '+r.blocking_reasons.join(', '):''}`;
  });
}
function patchRows(){
  document.querySelectorAll('#rows .row[data-code]').forEach(row=>{
    const r=READY.get(row.dataset.code); if(!r)return;
    let tag=row.querySelector('.v663State');
    if(!tag){tag=document.createElement('em');tag.className='v663State';tag.style.cssText='display:inline-block;margin-top:4px;font-style:normal;font-size:8px;font-weight:900;border-radius:999px;padding:3px 6px;background:#eef2f6;color:#52677f';row.appendChild(tag)}
    tag.textContent=label(r.audit_state);
    tag.style.background=r.audit_state==='BLOQUEADA'?'#fee2e2':r.audit_state==='ACEPTADA'?'#dcfce7':r.audit_state==='LISTA'?'#dbeafe':'#fef3c7';
    tag.style.color=r.audit_state==='BLOQUEADA'?'#991b1b':r.audit_state==='ACEPTADA'?'#166534':r.audit_state==='LISTA'?'#1e40af':'#92400e';
  });
}
function modalCode(){return norm($('gaTitle')?.textContent)}
function patchModal(){
  const modal=$('geoAuditModal'); if(!modal?.classList.contains('open'))return;
  const r=READY.get(modalCode()); if(!r)return;
  const tabs=modal.querySelector('.gaTabs');
  let bar=$('v663AuditBar');
  if(!bar&&tabs){bar=document.createElement('div');bar.id='v663AuditBar';bar.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 16px;background:#fff;border-bottom:1px solid #dce5f0;font-size:10px';tabs.insertAdjacentElement('afterend',bar)}
  if(bar)bar.innerHTML=`<b style="color:${color(r.audit_state)}">${label(r.audit_state)} · ${r.audit_score}/100</b><span>${(r.blocking_reasons||[]).length?'Falta: '+r.blocking_reasons.join(' · '):'Sin bloqueos'}</span>`;
  const btn=modal.querySelector('#gaDeliveryReview [data-delivery-act="accept"]');
  if(btn){btn.disabled=!r.ready_for_export;btn.textContent=r.ready_for_export?'✓ Aceptar evidencia para salida':`🔒 Falta: ${(r.blocking_reasons||[]).slice(0,4).join(' · ')||'validaciones'}`}
}
function patch(){patchKpi();patchLegend();patchMarkers();patchRows();patchModal()}
async function refresh(){
  if(loading)return;
  loading=true;
  try{const rows=await getReadiness();READY=new Map(rows.map(r=>[r.code,r]));patch();}
  catch(e){console.warn('[ONE SHOT v663 audit-lite]',e)}
  finally{loading=false}
}
function schedule(ms=80,refetch=false){clearTimeout(timer);timer=setTimeout(async()=>{if(refetch)await refresh();else patch()},ms)}
function bind(){
  $('reloadBtn')?.addEventListener('click',()=>schedule(700,true));
  ['fProcess','fRegion','fDistrict','fType','fParty','fStatus'].forEach(id=>$(id)?.addEventListener('change',()=>schedule(120,false)));
  $('fSearch')?.addEventListener('input',()=>schedule(300,false));
  document.addEventListener('click',e=>{
    if(e.target.closest('#previewAuditBtn,#previewOpen,#previewImg,[data-ex-code],#rows .row[data-code]'))schedule(350,false);
    if(e.target.closest('#gaSave,[data-delivery-act="good"],[data-delivery-act="fix"],[data-delivery-act="accept"],#gaUseGps,#gaRefreshGeo'))schedule(650,true);
  },true);
}
async function boot(){
  bind();
  await refresh();
  setTimeout(patch,350);
  setTimeout(patch,1200);
  console.info('[ONE SHOT CONTROL] audit-lite v6.63 activo');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
