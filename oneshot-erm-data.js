window.ONE_SHOT_DATA={parties:["ALIANZA PARA EL PROGRESO","FUERZA POPULAR","PARTIDO MORADO","SOMOS PERÚ","RENOVACIÓN POPULAR"],candidates:[]};

(()=>{
'use strict';
const BUILD='one-shop-field-boot-20260827-01';
function load(src,key){
  if(key&&window[key])return Promise.resolve(window[key]);
  return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>resolve(key?window[key]:true);s.onerror=()=>reject(new Error('No se pudo cargar '+src));document.head.appendChild(s)});
}
async function boot(){
  if(window.__ONE_SHOP_FIELD_BOOT===BUILD)return;window.__ONE_SHOP_FIELD_BOOT=BUILD;
  try{
    await load('/one-shop-stable-runtime.js?v=20260827-01','ONE_SHOP_STABLE_RUNTIME');
    await load('/one-shop-field-quality-v576.js?v=20260827-01','ONE_SHOP_FIELD_QUALITY');
    await load('/one-field-report-standard.js?v=20260827-01','ONE_FIELD_REPORT_STANDARD');
    try{window.ONE_SHOP_STABLE_RUNTIME?.patchBoot?.()}catch(_){}
    try{window.ONE_SHOP_FIELD_QUALITY?.patchAll?.()}catch(_){}
    try{window.ONE_FIELD_REPORT_STANDARD?.patch?.()}catch(_){}
    console.info('[ONE SHOP] flujo de campo activo',BUILD);
  }catch(e){console.warn('[ONE SHOP] no se pudo completar el arranque de campo',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();