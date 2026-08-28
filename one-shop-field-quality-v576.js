/* ONE SHOP v5.7.6 · CAPTURA 4:3 + TERRITORIO LIMPIO + UBIGEO */
(()=>{
'use strict';
if(window.ONE_SHOP_FIELD_QUALITY)return;
const BUILD='one-shop-v5.7.6-field-quality-01';
const txt=v=>String(v??'').trim();
const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const pending=v=>!txt(v)||/pendiente|no disponible|sin dato/i.test(txt(v));
const numericGarbage=v=>/^\d{1,3}$/.test(txt(v));
const cleanText=v=>numericGarbage(v)?'':txt(v);
const LIMA_UBIGEO={
 'LIMA':'150101','CERCADO DE LIMA':'150101','ANCON':'150102','ATE':'150103','ATE VITARTE':'150103','BARRANCO':'150104','BRENA':'150105','CARABAYLLO':'150106','CHACLACAYO':'150107','CHORRILLOS':'150108','CIENEGUILLA':'150109','COMAS':'150110','EL AGUSTINO':'150111','INDEPENDENCIA':'150112','JESUS MARIA':'150113','LA MOLINA':'150114','LA VICTORIA':'150115','LINCE':'150116','LOS OLIVOS':'150117','LURIGANCHO':'150118','LURIGANCHO CHOSICA':'150118','CHOSICA':'150118','LURIN':'150119','MAGDALENA DEL MAR':'150120','PUEBLO LIBRE':'150121','MAGDALENA VIEJA':'150121','MIRAFLORES':'150122','PACHACAMAC':'150123','PUCUSANA':'150124','PUENTE PIEDRA':'150125','PUNTA HERMOSA':'150126','PUNTA NEGRA':'150127','RIMAC':'150128','SAN BARTOLO':'150129','SAN BORJA':'150130','SAN ISIDRO':'150131','SAN JUAN DE LURIGANCHO':'150132','SAN JUAN DE MIRAFLORES':'150133','SAN LUIS':'150134','SAN MARTIN DE PORRES':'150135','SAN MIGUEL':'150136','SANTA ANITA':'150137','SANTA MARIA DEL MAR':'150138','SANTA ROSA':'150139','SANTIAGO DE SURCO':'150140','SURCO':'150140','SURQUILLO':'150141','VILLA EL SALVADOR':'150142','VILLA MARIA DEL TRIUNFO':'150143'
};
const CALLAO_UBIGEO={'CALLAO':'070101','BELLAVISTA':'070102','CARMEN DE LA LEGUA REYNOSO':'070103','CARMEN DE LA LEGUA':'070103','LA PERLA':'070104','LA PUNTA':'070105','VENTANILLA':'070106','MI PERU':'070107'};
let mayorPromise=null,mayorMap=null;
function toast(m,ms=2200){try{UI?.toast?.(m,ms,{placement:'top',tone:'soft'})}catch(_){}}
function isLima(dep,province,city){const a=[dep,province,city].map(norm);return a.some(x=>x==='LIMA'||x==='LIMA METROPOLITANA'||x==='PROVINCIA DE LIMA')}
function isCallao(dep,province,city){return [dep,province,city].map(norm).some(x=>x==='CALLAO'||x==='PROVINCIA CONSTITUCIONAL DEL CALLAO')}
function normalizeTerritory(r){
 if(!r)return false;let changed=false;
 const set=(k,v)=>{v=cleanText(v);if(v&&txt(r[k])!==v){r[k]=v;changed=true}};
 if(numericGarbage(r.department))r.department='';if(numericGarbage(r.region))r.region='';if(numericGarbage(r.province))r.province='';if(numericGarbage(r.district))r.district='';
 let dep=cleanText(r.department||r.region),province=cleanText(r.province),district=cleanText(r.district),city=cleanText(r.city);
 if(norm(dep)==='LIMA METROPOLITANA'||norm(dep)==='PROVINCIA DE LIMA')dep='Lima';
 if(norm(dep)==='PROVINCIA CONSTITUCIONAL DEL CALLAO')dep='Callao';
 if(pending(dep)&&isLima('',province,city))dep='Lima';
 if(pending(dep)&&isCallao('',province,city))dep='Callao';
 if(pending(province)){
   if(isCallao(dep,'',city)||CALLAO_UBIGEO[norm(district)])province='Callao';
   else if(isLima(dep,'',city)||LIMA_UBIGEO[norm(district)])province='Lima';
   else if(city&&!numericGarbage(city))province=city;
 }
 if(pending(district)&&city&&!numericGarbage(city)&&norm(city)!==norm(province))district=city;
 if(dep)set('department',dep);if(dep)set('region',dep);if(province)set('province',province);if(district)set('district',district);
 const currentUbigeo=txt(r.ubigeo).replace(/\D/g,'');
 if(currentUbigeo.length!==6){
   let ub='';if(norm(province)==='LIMA'||norm(dep)==='LIMA')ub=LIMA_UBIGEO[norm(district)]||'';
   else if(norm(province)==='CALLAO'||norm(dep)==='CALLAO')ub=CALLAO_UBIGEO[norm(district)]||'';
   if(ub){r.ubigeo=ub;r.ubigeoSource='ONE_SHOP_TERRITORIO';changed=true}
 }
 if(changed){r.territoryNormalizedAt=new Date().toISOString();r.territoryNormalizationBuild=BUILD}
 return changed;
}
function sanitizeLabels(r){
 if(!r)return false;let changed=false;
 const candidates={party:['partyName','organizationName','politicalOrganization'],candidate:['candidateName'],type:['evidenceType'],panelProvider:['providerName','companyName','provider','company','empresa'],mayor:['alcalde','mayorName']};
 for(const [key,alts] of Object.entries(candidates)){
   if(!numericGarbage(r[key]))continue;const alt=alts.map(k=>cleanText(r[k])).find(v=>v&&!numericGarbage(v));r[key]=alt||'';changed=true;
 }
 if(numericGarbage(r.alcalde)){r.alcalde='';changed=true}
 if(numericGarbage(r.municipality)){r.municipality='';changed=true}
 if(changed)r.labelsSanitizedAt=new Date().toISOString();return changed;
}
async function loadMayors(){
 if(mayorMap)return mayorMap;if(mayorPromise)return mayorPromise;
 mayorPromise=fetch('/one-shop-data/alcaldes.json?v=20260827',{cache:'force-cache'}).then(r=>r.ok?r.json():null).then(j=>{mayorMap=j?.alcaldes||{};return mayorMap}).catch(()=>{mayorMap={};return mayorMap});return mayorPromise;
}
async function enrichMayor(r){const ub=txt(r?.ubigeo).replace(/\D/g,'');if(ub.length!==6||(!pending(r.mayor)&&!numericGarbage(r.mayor)))return false;const map=await loadMayors(),name=cleanText(map?.[ub]);if(!name)return false;r.mayor=name;r.alcalde=name;r.mayorSource='DIRECTORIO';return true}
function image43(dataUrl){
 return new Promise(resolve=>{
   if(!/^data:image\//i.test(dataUrl||''))return resolve(dataUrl||'');const img=new Image();
   img.onload=()=>{try{const W=1600,H=1200,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{alpha:false});x.fillStyle='#071326';x.fillRect(0,0,W,H);const bg=Math.max(W/img.naturalWidth,H/img.naturalHeight),bw=img.naturalWidth*bg,bh=img.naturalHeight*bg;x.save();x.globalAlpha=.26;try{x.filter='blur(30px) brightness(.68)'}catch(_){}x.drawImage(img,(W-bw)/2,(H-bh)/2,bw,bh);x.restore();const pad=16,fg=Math.min((W-pad*2)/img.naturalWidth,(H-pad*2)/img.naturalHeight),fw=img.naturalWidth*fg,fh=img.naturalHeight*fg;x.drawImage(img,(W-fw)/2,(H-fh)/2,fw,fh);resolve(c.toDataURL('image/jpeg',.92))}catch(_){resolve(dataUrl)}};img.onerror=()=>resolve(dataUrl);img.src=dataUrl;
 });
}
function patchReverse(){
 try{if(typeof GPS==='undefined'||GPS.__oneShop576Reverse)return false;GPS.__oneShop576Reverse=true;const base=GPS.reverse.bind(GPS);GPS.reverse=async g=>{const out=await base(g);normalizeTerritory(out);return out};return true}catch(_){return false}
}
function patchCapture(){
 try{if(typeof Camera==='undefined'||Camera.__oneShop576Capture)return false;Camera.__oneShop576Capture=true;const base=Camera.captureFrame.bind(Camera);Camera.captureFrame=async(...args)=>{const frame=await base(...args);if(!frame?.dataUrl)return frame;const originalDataUrl=frame.dataUrl,originalWidth=frame.width,originalHeight=frame.height;const normalized=await image43(originalDataUrl);return{...frame,originalDataUrl,originalWidth,originalHeight,dataUrl:normalized,width:1600,height:1200,aspect:4/3,normalizedWidth:1600,normalizedHeight:1200,normalizedFormat:'4:3',normalizedAt:new Date().toISOString(),normalizationBuild:BUILD}};return true}catch(_){return false}
}
function patchEvidence(){
 try{if(typeof Evidence==='undefined'||Evidence.__oneShop576Quality)return false;Evidence.__oneShop576Quality=true;
   const baseMake=Evidence.make.bind(Evidence);Evidence.make=(frame,...args)=>{const rec=baseMake(frame,...args);if(frame?.originalDataUrl){rec.image=frame.originalDataUrl;rec.originalImage=frame.originalDataUrl;rec.normalizedImage=frame.dataUrl;rec.stampedImage=frame.dataUrl;rec.sourceWidth=frame.originalWidth||frame.width;rec.sourceHeight=frame.originalHeight||frame.height;rec.normalizedWidth=1600;rec.normalizedHeight=1200;rec.reportImageWidth=1600;rec.reportImageHeight=1200;rec.captureNormalization='4:3';rec.captureNormalizationBuild=BUILD}normalizeTerritory(rec);sanitizeLabels(rec);return rec};
   const baseFinalize=Evidence.finalize.bind(Evidence);Evidence.finalize=async rec=>{await baseFinalize(rec);try{normalizeTerritory(rec);sanitizeLabels(rec);await enrichMayor(rec);if(rec.normalizedImage&&typeof Watermark!=='undefined'&&Watermark?.stamp){rec.stampedImage=await Watermark.stamp(rec.normalizedImage,rec);rec.stampedHash=await Evidence.imageHash(rec.stampedImage);rec.reportImage4x3=rec.stampedImage;rec.reportImageVersion='capture-4:3-v2';rec.reportImageWidth=1600;rec.reportImageHeight=1200;rec.reportImageSourceHash=rec.stampedHash;rec.reportImageUpdatedAt=new Date().toISOString()}rec.updatedAt=new Date().toISOString();if(typeof Store!=='undefined')await Store.save(rec);try{Reports?.invalidate?.()}catch(_){}}catch(e){console.warn('[ONE SHOP 5.7.6] finalize',e)}return rec};return true
 }catch(_){return false}
}
function patchEditor(){
 try{if(typeof Editor==='undefined'||Editor.__oneShop576Quality)return false;Editor.__oneShop576Quality=true;
   for(const name of ['updateGps','updateAddress']){if(typeof Editor[name]!=='function')continue;const base=Editor[name].bind(Editor);Editor[name]=async(...a)=>{const out=await base(...a),r=Editor.current;if(r){normalizeTerritory(r);sanitizeLabels(r);await enrichMayor(r);if(r.normalizedImage&&typeof Watermark!=='undefined'&&Watermark?.stamp){r.stampedImage=await Watermark.stamp(r.normalizedImage,r);r.stampedHash=await Evidence.imageHash(r.stampedImage);r.reportImage4x3=r.stampedImage}r.updatedAt=new Date().toISOString();await Store.save(r);try{Reports?.invalidate?.()}catch(_){}}return out}}
   return true}catch(_){return false}
}
async function repairExisting(){try{if(typeof State==='undefined'||!Array.isArray(State.records))return;let changed=0;for(const r of State.records){const c=normalizeTerritory(r)|sanitizeLabels(r);if(c){await enrichMayor(r);await Store.save(r);changed++}}if(changed){try{Reports?.invalidate?.();Gallery?.render?.()}catch(_){}console.info(`[ONE SHOP] ${changed} registros saneados`)}}catch(e){console.warn('[ONE SHOP] saneamiento',e)}}
function patchAll(){const ok=[patchReverse(),patchCapture(),patchEvidence(),patchEditor()].some(Boolean);return ok}
function boot(){patchAll();setTimeout(patchAll,200);setTimeout(()=>{patchAll();repairExisting()},900);try{localStorage.setItem('oneShopFieldQualityBuild',BUILD)}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ONE_SHOP_FIELD_QUALITY={BUILD,image43,normalizeTerritory,sanitizeLabels,enrichMayor,patchAll,repairExisting};
})();