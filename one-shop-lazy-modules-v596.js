"use strict";
/* ONE SHOT v5.9.15 · módulos secundarios después del primer render */
(()=>{
if(window.ONE_SHOT_LAZY_MODULES_596)return;window.ONE_SHOT_LAZY_MODULES_596=true;
const loaded=new Map();
const idle=(fn,timeout=2500)=>window.requestIdleCallback?requestIdleCallback(fn,{timeout}):setTimeout(fn,Math.min(timeout,1000));
function load(src){if(loaded.has(src))return loaded.get(src);const existing=[...document.scripts].find(s=>s.src&&s.src.endsWith('/'+src));if(existing)return Promise.resolve(true);const p=new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>resolve(true);s.onerror=()=>{console.warn('[ONE SHOT lazy] no cargó',src);resolve(false)};document.body.appendChild(s)});loaded.set(src,p);return p}
async function seq(list){for(const s of list)await load(s)}
const groups={
 catalogs:['one-shot-party-fallback-v597.js','one-shot-catalog-sync-v620.js'],
 territory:['one-shop-tramos-v587.js','one-shop-tramo-media-v588.js'],
 reports:['one-shop-dashboard-packages-v593.js','one-shop-dashboard-packages-v640.js']
};
function loadGroup(name){return seq(groups[name]||[])}
document.addEventListener('click',e=>{const nav=e.target.closest?.('.bottomNav button[data-view]');if(nav?.dataset.view==='Places')loadGroup('territory');if(nav?.dataset.view==='Reports')loadGroup('reports');if(e.target.closest?.('#viewerEdit,#quickCaptureEdit,#editForm'))loadGroup('catalogs')},{capture:true,passive:true});
const start=()=>{
 idle(()=>loadGroup('catalogs'),1600);
 idle(()=>loadGroup('territory'),3200);
 idle(()=>loadGroup('reports'),5200);
};
if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
window.ONE_SHOT_LAZY_596={load,loadGroup};
console.info('[ONE SHOT] v5.9.15 módulos secundarios en diferido');
})();
