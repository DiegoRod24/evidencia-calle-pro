'use strict';
(()=>{
const SUPA_URL='https://jdupbwkbitkcwhnsslkk.supabase.co';
const SUPA_KEY='sb_publishable_j8mj7pLl_Bt713wzmG0oKg_lKfphiO3';
const $=id=>document.getElementById(id);
function notice(text,tone='info'){const n=$('bootNotice');if(!n)return;n.hidden=!text;n.textContent=text;n.dataset.tone=tone}
function msg(text){const el=$('importMsg');if(el)el.textContent=text}
function rest(path,opts={}){return fetch(SUPA_URL+'/rest/v1/'+path,{...opts,headers:{apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY,'Content-Type':'application/json',...(opts.headers||{})}})}
function parseInWorker(file){return new Promise((resolve,reject)=>{
 const w=new Worker('excel-worker.js?v=595');
 const timer=setTimeout(()=>{w.terminate();reject(new Error('El Excel tardó demasiado en procesarse'))},120000);
 w.onmessage=e=>{
  const d=e.data||{};
  if(d.type==='status')notice(d.text);
  if(d.type==='progress')notice(`Leyendo filas… ${d.done} / ${d.total}`);
  if(d.type==='done'){clearTimeout(timer);w.terminate();resolve(d)}
  if(d.type==='error'){clearTimeout(timer);w.terminate();reject(new Error(d.message||'Error leyendo Excel'))}
 };
 w.onerror=e=>{clearTimeout(timer);w.terminate();reject(new Error(e.message||'Falló el procesador de Excel'))};
 w.postMessage({file});
})}
async function upload(rows,name){const chunk=150;for(let i=0;i<rows.length;i+=chunk){const end=Math.min(i+chunk,rows.length);notice(`Consolidando ${end} de ${rows.length}…`);msg(`Subiendo ${end} / ${rows.length}`);const body=rows.slice(i,end).map(r=>({...r,updated_at:new Date().toISOString()}));const res=await rest('control_evidences?on_conflict=code',{method:'POST',body:JSON.stringify(body),headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});if(!res.ok)throw new Error(`Supabase respondió HTTP ${res.status}`);await new Promise(r=>setTimeout(r,0))}await rest('control_imports',{method:'POST',body:JSON.stringify({file_name:name,row_count:rows.length}),headers:{Prefer:'return=minimal'}})}
function install(){const input=$('fileInput');if(!input||input.dataset.workerFix==='1')return;input.dataset.workerFix='1';input.addEventListener('change',async e=>{
  e.preventDefault();e.stopImmediatePropagation();
  const f=e.target.files?.[0];if(!f)return;
  input.disabled=true;
  try{
    notice(`Procesando ${f.name} en segundo plano…`);msg('La página seguirá respondiendo mientras se lee el Excel.');
    const out=await parseInWorker(f),rows=out.rows||[];
    if(!rows.length)throw new Error(`No se encontraron filas válidas con coordenadas en ${out.sheet||'el Excel'}`);
    notice(`✓ ${rows.length} evidencias válidas detectadas. Consolidando…`);
    await upload(rows,f.name);
    notice(`✓ ${rows.length} evidencias procesadas correctamente.`,'success');
    msg(`✓ ${rows.length} evidencias procesadas · actualizando mapa…`);
    $('reloadBtn')?.click();
    setTimeout(()=>notice(''),1800);
  }catch(err){console.error('[ONE SHOT CONTROL upload worker]',err);notice('No se pudo procesar el Excel.','error');msg(err.message||'Error al importar');alert(err.message||'No se pudo importar el Excel')}
  finally{input.value='';input.disabled=false}
 },true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
