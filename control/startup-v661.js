'use strict';
(()=>{
if(window.ONE_SHOT_STARTUP_V661)return;
window.ONE_SHOT_STARTUP_V661=true;
const $=id=>document.getElementById(id);
let recovered=false,reported=false;
function setBadge(text,color){const b=$('syncBadge');if(b){b.textContent=text;if(color)b.style.color=color}}
function notice(text,tone='warn'){const n=$('bootNotice');if(!n)return;n.hidden=false;n.textContent=text;n.dataset.tone=tone}
function healthy(){return !!document.querySelector('#map .nm-tiles') && !/Iniciando/i.test($('syncBadge')?.textContent||'')}
function report(msg){if(reported)return;reported=true;console.error('[ONE SHOT STARTUP]',msg);setBadge('● Error de arranque','#fca5a5');notice('CONTROL no pudo iniciar el núcleo del mapa. '+msg,'error')}
function rescue(){
  if(healthy()||recovered)return;
  recovered=true;
  setBadge('● Recuperando…','#facc15');
  notice('Reintentando el núcleo de CONTROL con caché limpia…','warn');
  const s=document.createElement('script');
  s.src='app.js?v=661-rescue-'+Date.now();
  s.async=true;
  s.onload=()=>setTimeout(()=>{if(healthy()){notice('');console.info('[ONE SHOT STARTUP] recuperación completada')}else report('El archivo base cargó, pero no inicializó el mapa.')},900);
  s.onerror=()=>report('No se pudo volver a cargar app.js.');
  document.head.appendChild(s);
}
window.addEventListener('error',e=>{
  const src=String(e.filename||'');
  if(/\/control\//.test(src))console.warn('[ONE SHOT CONTROL error]',e.message,src,e.lineno||'');
});
window.addEventListener('unhandledrejection',e=>console.warn('[ONE SHOT CONTROL promise]',e.reason));
function arm(){setTimeout(()=>{if(!healthy())rescue()},1600);setTimeout(()=>{if(!healthy()&&!recovered)rescue();else if(!healthy())report('El reintento no respondió.')},5200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arm,{once:true});else arm();
})();
