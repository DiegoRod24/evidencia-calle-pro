"use strict";
/* ONE SHOT v5.9.16 · Evidencias: feedback + render progresivo + borrado masivo por lotes */
(()=>{
if(window.ONE_SHOT_EVIDENCE_PROGRESS_598)return;window.ONE_SHOT_EVIDENCE_PROGRESS_598=true;
const BUILD='one-shop-v5.9.16-evidence-progress-02';
const $=id=>document.getElementById(id);
const sleepFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
const deviceMem=Number(navigator.deviceMemory||4);
const PAGE=deviceMem<=2?16:(innerWidth<=480?24:32);
let limit=PAGE,lastFilterSig='',searchTimer=null,busyStarted=0,busyTick=null,busyHide=null;

function css(){if($('eProgress598Css'))return;const s=document.createElement('style');s.id='eProgress598Css';s.textContent=`
#viewEvidence .eWorkProgress598{position:sticky;top:4px;z-index:35;display:none;align-items:center;gap:10px;margin:8px 0;padding:9px 11px;border:1px solid #b8d0f5;border-radius:14px;background:rgba(239,246,255,.97);color:#123b78;box-shadow:0 8px 24px rgba(15,42,80,.09);backdrop-filter:blur(8px)}
#viewEvidence .eWorkProgress598.show{display:flex}.eWorkSpin598{width:20px;height:20px;flex:0 0 auto;border:3px solid #cbdcf7;border-top-color:#2563eb;border-radius:50%;animation:eSpin598 .75s linear infinite}.eWorkProgress598.done .eWorkSpin598{animation:none;border-color:#24a866;position:relative}.eWorkProgress598.done .eWorkSpin598:after{content:'✓';position:absolute;inset:-5px;display:grid;place-items:center;font-size:13px;font-weight:1000;color:#15803d}
.eWorkCopy598{min-width:0;flex:1;display:grid;gap:2px}.eWorkCopy598 b{font-size:11px;line-height:1.15}.eWorkCopy598 small{font-size:9px;color:#61758e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.eWorkTime598{font-size:9px;font-weight:900;white-space:nowrap;color:#64748b}
.eWorkTrack598{grid-column:1/-1;height:4px;overflow:hidden;border-radius:99px;background:#dbe7f7;margin-top:3px}.eWorkTrack598 i{display:block;width:35%;height:100%;border-radius:inherit;background:#2563eb;animation:eInd598 1.15s ease-in-out infinite}.eWorkProgress598.determinate .eWorkTrack598 i{animation:none;width:var(--p,0%);transition:width .16s ease}.eWorkProgress598.done .eWorkTrack598 i{animation:none;width:100%;background:#24a866}
.ePageFooter598{display:grid;gap:8px;justify-items:center;padding:14px 8px 4px;color:#64748b;font-size:10px;font-weight:800}.ePageFooter598 button{min-height:44px;padding:9px 16px;border:1px solid #a8c4ef;border-radius:13px;background:#eef5ff;color:#174b9a;font-size:11px;font-weight:950}.ePageFooter598 button:active{transform:scale(.98)}
#viewEvidence.eDeleting598{pointer-events:none}#viewEvidence.eDeleting598 .eWorkProgress598{pointer-events:auto}
#evidenceList img.eImgPending598{min-height:120px;background:linear-gradient(110deg,#eef3fa 28%,#f7faff 40%,#eef3fa 52%);background-size:220% 100%}
@keyframes eSpin598{to{transform:rotate(360deg)}}@keyframes eInd598{0%{transform:translateX(-110%)}50%{transform:translateX(120%)}100%{transform:translateX(310%)}}
@media(max-width:390px){#viewEvidence .eWorkProgress598{gap:8px;padding:8px 9px}.eWorkCopy598 b{font-size:10px}.eWorkTime598{font-size:8px}.ePageFooter598 button{width:100%}}
@media(prefers-reduced-motion:reduce){.eWorkSpin598,.eWorkTrack598 i{animation:none!important}}
`;document.head.appendChild(s)}
function injectBusy(){css();let box=$('eWorkProgress598');if(box)return box;const host=document.querySelector('#viewEvidence .evidencePanel')||$('viewEvidence');if(!host)return null;box=document.createElement('div');box.id='eWorkProgress598';box.className='eWorkProgress598';box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.innerHTML='<i class="eWorkSpin598"></i><div class="eWorkCopy598"><b id="eWorkTitle598">Procesando…</b><small id="eWorkDetail598">Espera un momento</small><div class="eWorkTrack598"><i></i></div></div><span id="eWorkTime598" class="eWorkTime598">0.0 s</span>';const list=$('evidenceList');if(list)list.insertAdjacentElement('beforebegin',box);else host.prepend(box);return box}
function busyStart(title='Procesando evidencias…',detail=''){const box=injectBusy();if(!box)return;clearTimeout(busyHide);clearInterval(busyTick);busyStarted=performance.now();box.classList.add('show');box.classList.remove('done','determinate');box.style.removeProperty('--p');$('eWorkTitle598').textContent=title;$('eWorkDetail598').textContent=detail||'ONE SHOT sigue trabajando';$('eWorkTime598').textContent='0.0 s';busyTick=setInterval(()=>{if(!$('eWorkTime598'))return;const sec=(performance.now()-busyStarted)/1000;$('eWorkTime598').textContent=`${sec.toFixed(1)} s`},120)}
function busyProgress(done,total,title='Procesando…'){const box=injectBusy();if(!box)return;if(!box.classList.contains('show'))busyStart(title);box.classList.add('determinate');box.classList.remove('done');const pct=total?Math.max(0,Math.min(100,done/total*100)):0;box.style.setProperty('--p',`${pct}%`);$('eWorkTitle598').textContent=title;$('eWorkDetail598').textContent=total?`${done} de ${total}`:`${done}`}
function busyDone(detail='Listo',ms=650){const box=injectBusy();if(!box)return;clearInterval(busyTick);box.classList.add('show','done','determinate');box.style.setProperty('--p','100%');$('eWorkTitle598').textContent='✓ Listo';$('eWorkDetail598').textContent=detail;const sec=(performance.now()-busyStarted)/1000;if($('eWorkTime598'))$('eWorkTime598').textContent=`${Math.max(0,sec).toFixed(1)} s`;clearTimeout(busyHide);busyHide=setTimeout(()=>box.classList.remove('show','done','determinate'),ms)}
function busyError(detail='No se pudo completar'){const box=injectBusy();if(!box)return;clearInterval(busyTick);box.classList.add('show');box.classList.remove('done','determinate');$('eWorkTitle598').textContent='⚠ Revisa';$('eWorkDetail598').textContent=detail;clearTimeout(busyHide);busyHide=setTimeout(()=>box.classList.remove('show'),2200)}
function filterSig(){return JSON.stringify([State.settings?.evidenceRange||'',State.settings?.evidenceReviewFilter||'',State.filter||'',State.search||'',State.settings?.galleryView||State.galleryView||'cards'])}

const originalVisible=Evidence.visible.bind(Evidence),baseRender=Gallery.render.bind(Gallery);
function footer(total,shown){const host=$('evidenceList');if(!host)return;host.querySelector('#ePageFooter598')?.remove();if(total<=shown)return;const left=total-shown,next=Math.min(PAGE,left),f=document.createElement('div');f.id='ePageFooter598';f.className='ePageFooter598';f.innerHTML=`<span>Mostrando ${shown} de ${total} · las demás fotos aún no se cargan</span><button type="button">Cargar ${next} más (${left} pendientes)</button>`;f.querySelector('button').onclick=()=>{limit=Math.min(total,limit+PAGE);busyStart('Cargando más evidencias…',`${shown} → ${Math.min(total,limit)} de ${total}`);requestAnimationFrame(()=>setTimeout(()=>Gallery.render({reason:'more'}),0));};host.appendChild(f)}
Gallery.render=function(meta={}){
  const sig=filterSig(),changed=sig!==lastFilterSig;if(changed){lastFilterSig=sig;limit=PAGE;busyStart(State.search?'Buscando evidencias…':'Aplicando filtro…','Calculando coincidencias sin cargar todas las fotos');}
  const t0=performance.now(),all=originalVisible(),shown=Math.min(limit,all.length),realVisible=Evidence.visible;
  Evidence.visible=()=>all.slice(0,shown);
  let out;try{out=baseRender()}finally{Evidence.visible=realVisible}
  try{Gallery.updateSelectionUI?.();Reports.renderSummary?.()}catch(_){}
  const count=$('evidenceCount');if(count)count.textContent=`${State.records.length} registradas · ${all.length} filtradas · ${shown} mostradas`;
  document.querySelectorAll('#evidenceList .eCard img').forEach(img=>{if(!img.getAttribute('src')){img.removeAttribute('src');img.classList.add('eImgPending598')}});
  footer(all.length,shown);
  const took=Math.round(performance.now()-t0);
  if(changed)busyDone(`${all.length} coincidencia${all.length===1?'':'s'} · ${shown} en pantalla · ${took} ms`,Math.max(500,Math.min(950,took+300)));
  else if(meta?.reason==='more')busyDone(`${shown} de ${all.length} mostradas`,500);
  return out
};

function bindFilterFeedback(){
  const range=$('eRange591'),review=$('eReview591');
  for(const el of [range,review])if(el&&!el.__progress598){el.__progress598=true;el.addEventListener('change',()=>{limit=PAGE;busyStart('Aplicando filtro…','Preparando resultados');},{capture:true})}
  const search=$('searchInput');if(search&&!search.__progress598){search.__progress598=true;search.oninput=e=>{State.search=e.target.value;limit=PAGE;clearTimeout(searchTimer);busyStart(e.target.value.trim()?'Buscando evidencias…':'Actualizando evidencias…',e.target.value.trim()?`Buscando “${e.target.value.trim()}”`:'Quitando búsqueda');searchTimer=setTimeout(()=>Gallery.render({reason:'search'}),180)}}
}

async function deleteBatch(ids){const total=ids.length;if(!total)return;const set=new Set(ids);State.records=State.records.filter(r=>!set.has(r.id));if(State.db){const CHUNK=24;for(let i=0;i<ids.length;i+=CHUNK){const part=ids.slice(i,i+CHUNK);await new Promise(resolve=>{try{const tx=State.db.transaction('records','readwrite'),os=tx.objectStore('records');part.forEach(id=>os.delete(id));tx.oncomplete=tx.onerror=tx.onabort=()=>resolve()}catch(_){resolve()}});busyProgress(Math.min(i+CHUNK,total),total,'Eliminando evidencias…');await sleepFrame()}}
  Store.saveLite();Reports.invalidate();
}
Bulk.deleteSelected=async function(){const data=Bulk.data();if(!data.length)return;if(!confirm(`¿Eliminar ${data.length} evidencia${data.length===1?'':'s'}? Esta acción no se puede deshacer.`))return;const ids=data.map(r=>r.id);const view=$('viewEvidence');view?.classList.add('eDeleting598');busyStart('Eliminando evidencias…',`Preparando ${ids.length} registro${ids.length===1?'':'s'}`);busyProgress(0,ids.length,'Eliminando evidencias…');try{await deleteBatch(ids);State.selectionMode=false;State.records.forEach(r=>r.selected=false);Bulk.close();limit=PAGE;Gallery.render();busyDone(`${ids.length} evidencia${ids.length===1?'':'s'} eliminada${ids.length===1?'':'s'}`,850);UI.toast(`✓ ${ids.length} evidencia${ids.length===1?'':'s'} eliminada${ids.length===1?'':'s'}`,2200)}catch(e){console.error(e);busyError(e.message||'No se pudo completar el borrado');UI.toast('No se pudo completar la eliminación',3000)}finally{view?.classList.remove('eDeleting598')}};
function bindDelete(){const b=$('bulkDeleteSelected');if(!b)return;b.onclick=e=>{e.preventDefault();e.stopPropagation();Bulk.deleteSelected()}}

function boot(){css();injectBusy();bindDelete();bindFilterFeedback();let tries=0;const t=setInterval(()=>{tries++;bindFilterFeedback();bindDelete();if(tries>20)clearInterval(t)},300);try{localStorage.setItem('oneshotRuntimeBuild',BUILD)}catch(_){}console.info('[ONE SHOT]',BUILD,'render progresivo',PAGE,'por lote')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
