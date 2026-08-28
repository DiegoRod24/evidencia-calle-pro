/* ONE SHOP v5.7.8 · RESPALDO LITE SIN DERIVADAS PESADAS */
(()=>{
'use strict';
if(window.ONE_SHOP_STORAGE_LITE_V578)return;
const BUILD='one-shop-storage-lite-v578-01';
const HEAVY=['reportThumbnailImage','reportImage4x3','normalizedImage','originalImage','rescuedImage','correctedImage','correctedStampedImage','watermarkedImage','markedImage','evidenceImage'];
function patch(){
  try{
    if(typeof Store==='undefined'||typeof State==='undefined'||Store.__oneShopLite578)return false;
    Store.__oneShopLite578=true;
    Store.saveLite=()=>{
      try{
        const lite=(State.records||[]).map(r=>{
          const x={...r};
          for(const k of HEAVY)delete x[k];
          if(!r.image||r.image.length>900000)delete x.image;
          if(!r.stampedImage||r.stampedImage.length>900000)delete x.stampedImage;
          return x;
        });
        localStorage.setItem('oneshotRecordsLite',JSON.stringify(lite));
        localStorage.setItem('oneshotSettings',JSON.stringify(State.settings));
        localStorage.setItem('oneshotPlacesV4',JSON.stringify(State.places||[]));
        localStorage.setItem('oneshotFieldBasesV44',JSON.stringify(State.fieldBases||[]));
      }catch(_){}
    };
    return true;
  }catch(_){return false}
}
function boot(){patch();setTimeout(patch,120);setTimeout(patch,650);try{localStorage.setItem('oneShopStorageLiteBuild',BUILD)}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ONE_SHOP_STORAGE_LITE_V578={BUILD,patch};
})();