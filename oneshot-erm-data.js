window.ONE_SHOT_DATA={parties:["ALIANZA PARA EL PROGRESO","FUERZA POPULAR","PARTIDO MORADO","SOMOS PERÚ","RENOVACIÓN POPULAR"],candidates:[]};

(()=>{
'use strict';
const BUILD='one-shop-field-boot-20260829-02-fastcapture';
function load(src,key){if(key&&window[key])return Promise.resolve(window[key]);return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.dataset.oneShopBuild=BUILD;s.onload=()=>resolve(key?window[key]:true);s.onerror=()=>reject(new Error('No se pudo cargar '+src));document.head.appendChild(s)});}
function patchFastCapture(){
  try{
    if(typeof Camera==='undefined'||typeof State==='undefined'||Camera.__fastCapture20260829)return false;
    Camera.__fastCapture20260829=true;
    const frontRx=/(front|frontal|selfie|user facing|cara frontal)/i,rearRx=/(back|rear|trasera|environment|posterior)/i;
    const baseEnumerate=Camera.enumerate.bind(Camera);
    const rearIndex=()=>{let best=-1,score=999;(State.devices||[]).forEach((d,i)=>{const l=String(d.label||'');const s=frontRx.test(l)?99:rearRx.test(l)?0:/ultra|0\.5|0,5|gran angular/i.test(l)?3:8;if(s<score){score=s;best=i}});return best;};
    Camera.enumerate=async()=>{await baseEnumerate();const current=State.currentTrack?.getSettings?.().deviceId||'';if(current){const idx=State.devices.findIndex(d=>d.deviceId===current);if(idx>=0)State.deviceIndex=idx;}else{const idx=rearIndex();if(idx>=0&&rearRx.test(String(State.devices[idx]?.label||'')))State.deviceIndex=idx;}return State.devices;};
    Camera.attempts=()=>{const q=Camera.qualityConstraints(),list=[],idx=rearIndex(),d=idx>=0?State.devices[idx]:null;list.push({audio:false,video:{facingMode:{exact:'environment'},...q}});list.push({audio:false,video:{facingMode:{ideal:'environment'},...q}});if(d?.deviceId&&rearRx.test(String(d.label||''))&&!frontRx.test(String(d.label||'')))list.push({audio:false,video:{deviceId:{exact:d.deviceId},...q}});list.push({audio:false,video:{facingMode:'environment'}});list.push({audio:false,video:true});return list;};
    const baseStart=Camera.start.bind(Camera);let correcting=false;
    Camera.start=async(opts={})=>{State.cameraFacing='back';const ok=await baseStart(opts);if(!ok)return ok;try{const facing=Camera.detectFacing?.()||'back';State.cameraFacing=facing;if(facing==='front'&&!correcting){await Camera.enumerate();const idx=rearIndex(),target=idx>=0?State.devices[idx]:null,current=State.currentTrack?.getSettings?.().deviceId||'';if(target?.deviceId&&target.deviceId!==current&&rearRx.test(String(target.label||''))&&!frontRx.test(String(target.label||''))){correcting=true;State.deviceIndex=idx;const fixed=await baseStart({silent:true,force:true});correcting=false;if(fixed){State.cameraFacing=Camera.detectFacing?.()||'back';return fixed;}}}}catch(_){correcting=false;}return ok;};
    if(typeof UI!=='undefined'&&!UI.__fastCapture20260829){UI.__fastCapture20260829=true;const baseSet=UI.setView.bind(UI);UI.setView=(name,...args)=>{const out=baseSet(name,...args);if(name==='Camera')setTimeout(()=>{try{State.cameraWanted=true;if(State.cameraStatus!=='active')Camera.start({silent:true});else document.getElementById('video')?.play?.().catch(()=>{});}catch(_){}},40);return out;};}
    if(typeof QuickCapture!=='undefined'&&!QuickCapture.__fastCapture20260829){QuickCapture.__fastCapture20260829=true;const baseShow=QuickCapture.show.bind(QuickCapture);QuickCapture.show=r=>{const out=baseShow(r);clearTimeout(QuickCapture.timer);QuickCapture.timer=setTimeout(()=>QuickCapture.hide?.(),3200);return out;};}
    const prime=()=>{try{if(document.hidden||!document.getElementById('viewCamera')?.classList.contains('active'))return;State.cameraWanted=true;Sensors?.enable?.().catch(()=>{});GPS?.start?.();Camera.start({silent:true});}catch(_){}};
    setTimeout(prime,80);setTimeout(prime,650);window.addEventListener('pageshow',()=>setTimeout(prime,90));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(prime,80);});
    return true;
  }catch(e){console.warn('[ONE SHOP FAST CAPTURE]',e);return false;}
}
async function boot(){
  if(window.__ONE_SHOP_FIELD_BOOT===BUILD)return;window.__ONE_SHOP_FIELD_BOOT=BUILD;
  let n=0;const fast=setInterval(()=>{if(patchFastCapture()||++n>100)clearInterval(fast)},25);
  try{
    await load('/one-shop-stable-runtime.js?v=20260829-02-fastcapture','ONE_SHOP_STABLE_RUNTIME');
    await load('/one-shop-field-quality-v578.js?v=20260829-02-fastcapture','ONE_SHOP_FIELD_QUALITY_V578');
    await load('/one-shop-excel-thumb-v579.js?v=20260829-02-fastcapture','ONE_SHOP_EXCEL_THUMB_V579');
    await load('/one-shop-storage-lite-v578.js?v=20260829-02-fastcapture','ONE_SHOP_STORAGE_LITE_V578');
    await load('/one-field-report-standard.js?v=20260829-02-fastcapture','ONE_FIELD_REPORT_STANDARD_V8');
    patchFastCapture();
    try{window.ONE_SHOP_STABLE_RUNTIME?.patchBoot?.()}catch(_){}
    try{window.ONE_SHOP_FIELD_QUALITY_V578?.patchAll?.()}catch(_){}
    try{window.ONE_SHOP_EXCEL_THUMB_V579?.patch?.()}catch(_){}
    try{window.ONE_SHOP_STORAGE_LITE_V578?.patch?.()}catch(_){}
    try{window.ONE_FIELD_REPORT_STANDARD_V8?.patch?.()}catch(_){}
    console.info('[ONE SHOP] fast capture + trasera primero activos',BUILD);
  }catch(e){console.warn('[ONE SHOP] arranque parcial',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();