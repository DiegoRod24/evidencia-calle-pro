"use strict";
/* ONE SHOT v5.9.22 · Runtime bridge
   Los bindings top-level declarados con const (State, Store, Camera, etc.) no se
   publican automáticamente en window. Los módulos modernos de persistencia y
   recuperación necesitan una referencia estable al runtime del núcleo.
*/
(()=>{
  if(window.ONE_SHOT_RUNTIME_BRIDGE_605)return;
  window.ONE_SHOT_RUNTIME_BRIDGE_605=true;
  const BUILD='one-shop-v5.9.22-runtime-bridge-01';

  const expose=()=>{
    try{ if(typeof State!=='undefined') window.State=State; }catch(_){}
    try{ if(typeof Store!=='undefined') window.Store=Store; }catch(_){}
    try{ if(typeof Camera!=='undefined') window.Camera=Camera; }catch(_){}
    try{ if(typeof Gallery!=='undefined') window.Gallery=Gallery; }catch(_){}
    try{ if(typeof Evidence!=='undefined') window.Evidence=Evidence; }catch(_){}
    try{ if(typeof LegacyVault!=='undefined') window.LegacyVault=LegacyVault; }catch(_){}
    try{ if(typeof Reports!=='undefined') window.Reports=Reports; }catch(_){}
    try{ if(typeof UI!=='undefined') window.UI=UI; }catch(_){}
    try{ if(typeof Viewer!=='undefined') window.Viewer=Viewer; }catch(_){}

    const ok=!!(window.State&&window.Store&&window.Gallery&&window.UI);
    try{localStorage.setItem('oneshotRuntimeBridgeBuild',BUILD)}catch(_){}
    console.info('[ONE SHOT]',BUILD,ok?'runtime expuesto':'runtime parcial');
    return ok;
  };

  expose();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',expose,{once:true});
  setTimeout(expose,0);
  setTimeout(expose,250);
  window.ONE_SHOT_RUNTIME_BRIDGE={expose,BUILD};
})();
