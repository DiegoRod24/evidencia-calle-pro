/* ONE SHOP v5.7.9 · MINIATURA EXCEL SUAVE TIPO TIMEMARK */
(()=>{
'use strict';
if(window.ONE_SHOP_EXCEL_THUMB_V579)return;
const BUILD='one-shop-v5.9.13-excel-ios-softfill-01';
const txt=v=>String(v??'').trim();
function loadImage(src){return new Promise((res,rej)=>{if(!src)return rej(new Error('Imagen vacía'));const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('No se pudo leer la imagen'));i.src=src;});}
function drawSoftCover(ctx,img,W,H){
  const low=document.createElement('canvas'),mid=document.createElement('canvas');
  low.width=80;low.height=60;mid.width=320;mid.height=240;
  const lx=low.getContext('2d',{alpha:false}),mx=mid.getContext('2d',{alpha:false});
  const cover=Math.max(low.width/Math.max(1,img.naturalWidth),low.height/Math.max(1,img.naturalHeight));
  const bw=img.naturalWidth*cover,bh=img.naturalHeight*cover;
  lx.imageSmoothingEnabled=true;lx.imageSmoothingQuality='high';lx.drawImage(img,(low.width-bw)/2,(low.height-bh)/2,bw,bh);
  mx.imageSmoothingEnabled=true;mx.imageSmoothingQuality='high';mx.drawImage(low,0,0,mid.width,mid.height);
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';try{ctx.filter='blur(18px)'}catch(_){}ctx.drawImage(mid,-24,-18,W+48,H+36);ctx.restore();
}
async function createSoftThumb(src){
  try{
    if(!/^data:image\//i.test(src||''))return src||'';
    const i=await loadImage(src),W=1600,H=1200,c=document.createElement('canvas'),x=c.getContext('2d',{alpha:false});
    c.width=W;c.height=H;
    x.fillStyle='#EEF1F5';x.fillRect(0,0,W,H);

    drawSoftCover(x,i,W,H);

    const wash=x.createLinearGradient(0,0,0,H);
    wash.addColorStop(0,'rgba(255,255,255,0.12)');
    wash.addColorStop(1,'rgba(255,255,255,0.05)');
    x.fillStyle=wash;x.fillRect(0,0,W,H);

    const pad=4;
    const fit=Math.min((W-pad*2)/Math.max(1,i.naturalWidth),(H-pad*2)/Math.max(1,i.naturalHeight));
    const fw=i.naturalWidth*fit,fh=i.naturalHeight*fit,fx=(W-fw)/2,fy=(H-fh)/2;

    x.save();
    x.shadowColor='rgba(0,0,0,0.10)';
    x.shadowBlur=10;
    x.shadowOffsetY=2;
    x.fillStyle='rgba(255,255,255,0.08)';
    x.fillRect(fx,fy,fw,fh);
    x.restore();

    x.drawImage(i,fx,fy,fw,fh);
    return c.toDataURL('image/jpeg',0.93);
  }catch(_){
    return src||'';
  }
}
async function prepareReportImage(r){
  const source=txt(r?.correctedImage)||txt(r?.image)||txt(r?.originalImage)||txt(r?.rescuedImage)||txt(r?.normalizedImage)||'';
  if(!source)return txt(r?.reportThumbnailImage)||txt(r?.stampedImage)||'';
  let thumb=await createSoftThumb(source);
  try{if(typeof Watermark!=='undefined'&&Watermark?.stamp)thumb=await Watermark.stamp(thumb,r);}catch(_){}
  r.reportThumbnailImage=thumb;
  r.reportThumbnailVersion='4:3-soft-fill-ios-v3';
  r.reportThumbnailWidth=1600;
  r.reportThumbnailHeight=1200;
  r.visualBuild=BUILD;
  r.visualUpdatedAt=new Date().toISOString();
  return thumb;
}
function patch(){
  const api=window.ONE_SHOP_FIELD_QUALITY_V578||window.ONE_SHOP_FIELD_QUALITY||{};
  api.reportThumbnail=createSoftThumb;
  api.prepareReportImage=prepareReportImage;
  window.ONE_SHOP_FIELD_QUALITY=api;
  window.ONE_SHOP_FIELD_QUALITY_V578=api;
  window.ONE_SHOP_EXCEL_THUMB_V579={BUILD,createSoftThumb,prepareReportImage,patch};
  try{window.Reports?.invalidate?.();}catch(_){}
  return true;
}
let tries=0;const timer=setInterval(()=>{if(patch()||++tries>200)clearInterval(timer);},50);patch();
})();
