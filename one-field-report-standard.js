/* ONE SHOP · REPORTE MODELO CAMPO v8 */
(()=>{
'use strict';
if(window.ONE_FIELD_REPORT_STANDARD_V8)return;
const BUILD='one-field-report-standard-v8';
const safe=v=>String(v??'').trim();
const norm=v=>safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const numericGarbage=v=>/^\d{1,3}$/.test(safe(v));
const clean=(v,fallback='')=>{const s=safe(v);return !s||numericGarbage(s)||/pendiente|no disponible/i.test(s)?fallback:s};
function firstLabel(r,keys,fallback=''){for(const k of keys){const v=clean(r?.[k]);if(v)return v}return fallback}
function gpsOf(r){return r?.gps||r||null}
function maps(r){const g=gpsOf(r);if(!g||!Number.isFinite(Number(g.latitude))||!Number.isFinite(Number(g.longitude)))return'';return `https://www.google.com/maps?q=${g.latitude},${g.longitude}`}
function header(ws){const h=ws.getRow(1);h.height=27;h.font={bold:true,color:{argb:'FFFFFFFF'},size:10};h.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF4F8ED1'}};h.alignment={vertical:'middle',horizontal:'center',wrapText:true};h.border={top:{style:'thin',color:{argb:'FF2D609B'}},bottom:{style:'thin',color:{argb:'FF2D609B'}},left:{style:'thin',color:{argb:'FF2D609B'}},right:{style:'thin',color:{argb:'FF2D609B'}}}}
function link(cell,text,url){cell.value=url?{text,hyperlink:url,tooltip:'Abrir ubicación en Google Maps'}:text;if(url)cell.font={color:{argb:'FF0563C1'},underline:true,bold:true};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true}}
function territory(r){
 let region=clean(r.department||r.region),province=clean(r.province),district=clean(r.district);
 if(!region&&norm(province)==='LIMA')region='Lima';
 if(!province){if(norm(region)==='LIMA')province='Lima';else if(norm(region)==='CALLAO')province='Callao'}
 if(r?.districtStatus==='REVISAR'||r?.districtConfidence==='LOW')district='FALTA CONFIRMAR DISTRITO';
 return{region:region||'PENDIENTE',province:province||'PENDIENTE',district:district||'FALTA CONFIRMAR DISTRITO'};
}
function captureAddress(r){return clean(r.captureAddress)||clean(r.address)||[clean(r.street),clean(r.houseNumber)].filter(Boolean).join(' ')||'PENDIENTE'}
function administrativeAddress(r){return firstLabel(r,['municipalAddress','municipalityAddress','addressMunicipal','direccionMunicipal','destinationAddress'])||[clean(r.street),clean(r.houseNumber)].filter(Boolean).join(' ')||captureAddress(r)}
function provider(r){const type=norm(r?.type);if(type!=='PANEL')return'';return firstLabel(r,['panelProvider','providerName','companyName','provider','company','empresa'])}
function party(r){return firstLabel(r,['partyName','organizationName','politicalOrganization','party'])}
function mayor(r){return firstLabel(r,['mayor','alcalde','mayorName'],'PENDIENTE')}
function weather(r){return firstLabel(r,['weather','clima','weatherText','conditions'],'-')}
async function rawReportImage(r){
 try{if(window.ONE_SHOP_FIELD_QUALITY?.prepareReportImage)return await window.ONE_SHOP_FIELD_QUALITY.prepareReportImage(r)}catch(_){}
 if(r?.reportImage4x3)return r.reportImage4x3;
 const source=r?.correctedStampedImage||r?.stampedImage||r?.correctedImage||r?.normalizedImage||r?.image||'';
 if(window.ONE_SHOP_FIELD_QUALITY?.image43)return await window.ONE_SHOP_FIELD_QUALITY.image43(source);
 if(window.ONE_SHOP_STABLE_RUNTIME?.report43)return await window.ONE_SHOP_STABLE_RUNTIME.report43(source);
 return source;
}
function corridors(){try{return Array.isArray(State?.settings?.propagandaCorridors)?State.settings.propagandaCorridors:[]}catch(_){return[]}}
async function make(){
 const data=Evidence.selectedForReport();if(!data.length)throw new Error('No hay evidencias para exportar.');if(!window.ExcelJS)throw new Error('El motor Excel todavía no está disponible.');
 try{for(const r of data){window.ONE_SHOP_FIELD_QUALITY?.normalizeTerritory?.(r);window.ONE_SHOP_FIELD_QUALITY?.sanitizeLabels?.(r);await window.ONE_SHOP_FIELD_QUALITY?.enrichMayor?.(r)}}catch(_){}
 const wb=new ExcelJS.Workbook();wb.creator='ONE SHOP · ONPE-SGVC';wb.created=new Date();wb.subject='Reporte de evidencias de campo';wb.description='Evidencias con orientación corregida, marco 4:3 uniforme y territorio saneado.';
 const ws=wb.addWorksheet('EVIDENCIAS',{views:[{state:'frozen',ySplit:1,xSplit:2}]});
 ws.columns=[
  {header:'ID',key:'id',width:6},{header:'Foto',key:'foto',width:18},{header:'Fecha',key:'fecha',width:13},{header:'Hora',key:'hora',width:12},
  {header:'Ubicación',key:'ubicacion',width:29},{header:'Empresa',key:'empresa',width:24},{header:'Nota',key:'nota',width:27},{header:'Lat/Long',key:'latlon',width:20},
  {header:'Clima',key:'clima',width:12},{header:'Altitud',key:'altitud',width:11},{header:'Zona',key:'zona',width:16},{header:'Región',key:'region',width:16},
  {header:'Provincia',key:'provincia',width:16},{header:'Distrito',key:'distrito',width:24},{header:'Dirección',key:'direccion',width:29},{header:'Alcalde',key:'alcalde',width:31},
  {header:'Tipo',key:'tipo',width:16},{header:'Proceso',key:'proceso',width:12}
 ];
 header(ws);
 for(let i=0;i<data.length;i++){
   const r=data[i],g=r.gps||{},url=maps(r),t=territory(r),rowNo=i+2;
   const lat=Number(g.latitude),lon=Number(g.longitude),alt=Number(r.altitude??g.altitude);
   const locationText=captureAddress(r),latlon=Number.isFinite(lat)&&Number.isFinite(lon)?`${lat.toFixed(6)},\n${lon.toFixed(6)}`:'PENDIENTE';
   ws.addRow({id:i+1,fecha:clean(r.fecha),hora:clean(r.hora),ubicacion:locationText,empresa:provider(r),nota:party(r),latlon,clima:weather(r),altitud:Number.isFinite(alt)?`${Math.round(alt)} m`:'-',zona:firstLabel(r,['teamSector','zone','missionName'],'-'),region:t.region,provincia:t.province,distrito:t.district,direccion:administrativeAddress(r),alcalde:mayor(r),tipo:firstLabel(r,['type','evidenceType'],'PENDIENTE'),proceso:firstLabel(r,['electionProcess','process'],'')});
   const row=ws.getRow(rowNo);row.height=92;row.alignment={vertical:'middle',wrapText:true};row.font={size:9,color:{argb:'FF0E1B2B'}};row.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2===0?'FFDCE9F7':'FFFFFFFF'}};row.border={top:{style:'thin',color:{argb:'FFB7CCE5'}},bottom:{style:'thin',color:{argb:'FFB7CCE5'}},left:{style:'thin',color:{argb:'FFD4DFEC'}},right:{style:'thin',color:{argb:'FFD4DFEC'}}};
   link(ws.getCell(rowNo,5),locationText,url);link(ws.getCell(rowNo,8),latlon,url);
   const imageData=await rawReportImage(r);if(/^data:image\//i.test(imageData))try{const ext=/^data:image\/png/i.test(imageData)?'png':'jpeg',imgId=wb.addImage({base64:imageData.split(',')[1],extension:ext});ws.addImage(imgId,{tl:{col:1.02,row:rowNo-0.88},ext:{width:128,height:96},editAs:'oneCell'})}catch(_){}
 }
 ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,data.length+1),column:18}};ws.getColumn(1).alignment={vertical:'middle',horizontal:'center'};ws.getColumn(2).alignment={vertical:'middle',horizontal:'center'};ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:.2,right:.2,top:.35,bottom:.35,header:.15,footer:.15}};
 const tech=wb.addWorksheet('DATOS_TECNICOS',{views:[{state:'frozen',ySplit:1}]});
 tech.columns=[{header:'ID',key:'id',width:6},{header:'CÓDIGO',key:'code',width:24},{header:'VERIFICADOR',key:'verify',width:18},{header:'FECHA',key:'fecha',width:13},{header:'HORA',key:'hora',width:12},{header:'LATITUD',key:'lat',width:16},{header:'LONGITUD',key:'lon',width:16},{header:'GPS ±m',key:'accuracy',width:12},{header:'ALTITUD',key:'altitude',width:11},{header:'UBIGEO',key:'ubigeo',width:12},{header:'REGIÓN',key:'region',width:16},{header:'PROVINCIA',key:'province',width:16},{header:'DISTRITO',key:'district',width:24},{header:'DIRECCIÓN CAPTURA',key:'address',width:40},{header:'ALCALDE',key:'mayor',width:31},{header:'TIPO',key:'type',width:16},{header:'PARTIDO',key:'party',width:28},{header:'EMPRESA / PROVEEDOR',key:'provider',width:28},{header:'PROCESO',key:'process',width:12},{header:'RESOLUCIÓN ORIGINAL',key:'originalSize',width:20},{header:'RESOLUCIÓN NORMALIZADA',key:'normalizedSize',width:22},{header:'NORMALIZACIÓN',key:'normalization',width:18},{header:'ORIENTACIÓN CAPTURA',key:'orientation',width:22},{header:'PIPELINE',key:'pipeline',width:26},{header:'SHA-256 ORIGINAL',key:'sourceHash',width:68},{header:'SHA-256 MARCADA',key:'stampedHash',width:68},{header:'MAPA',key:'map',width:17}];
 header(tech);
 data.forEach((r,i)=>{const g=r.gps||{},t=territory(r),url=maps(r),rn=i+2;tech.addRow({id:i+1,code:clean(r.photoCode),verify:clean(r.verifyCode),fecha:clean(r.fecha),hora:clean(r.hora),lat:Number.isFinite(Number(g.latitude))?Number(g.latitude):'',lon:Number.isFinite(Number(g.longitude))?Number(g.longitude):'',accuracy:Number.isFinite(Number(r.accuracy??g.accuracy))?Math.round(Number(r.accuracy??g.accuracy)):'',altitude:Number.isFinite(Number(r.altitude??g.altitude))?Math.round(Number(r.altitude??g.altitude)):'',ubigeo:/^\d{6}$/.test(safe(r.ubigeo))?safe(r.ubigeo):'',region:t.region,province:t.province,district:t.district,address:captureAddress(r),mayor:mayor(r),type:firstLabel(r,['type','evidenceType'],'PENDIENTE'),party:party(r),provider:provider(r),process:firstLabel(r,['electionProcess','process']),originalSize:r.sourceWidth&&r.sourceHeight?`${r.sourceWidth} × ${r.sourceHeight}`:'',normalizedSize:'1600 × 1200',normalization:r.captureNormalization||r.reportImageVersion||'4:3',orientation:firstLabel(r,['deviceOrientation','captureOrientationKey'],'-'),pipeline:firstLabel(r,['capturePipeline'],'-'),sourceHash:clean(r.sourceHash),stampedHash:clean(r.stampedHash),map:url?'Abrir ubicación':''});tech.getRow(rn).alignment={vertical:'middle',wrapText:true};if(i%2===0)tech.getRow(rn).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF7FAFD'}};link(tech.getCell(rn,27),url?'📍 Abrir ubicación':'Sin ubicación',url)});tech.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,data.length+1),column:27}};
 const tramos=corridors();if(tramos.length){const tw=wb.addWorksheet('TRAMOS_PROPAGANDA',{views:[{state:'frozen',ySplit:1}]});tw.columns=[{header:'ID_TRAMO',key:'id',width:24},{header:'ORGANIZACIÓN',key:'party',width:30},{header:'VÍA / TRAMO',key:'road',width:38},{header:'DISTRIBUCIÓN',key:'distribution',width:20},{header:'CONTEO',key:'mode',width:16},{header:'CARTELES',key:'count',width:11},{header:'DISTANCIA M',key:'meters',width:13},{header:'PUNTOS',key:'points',width:10},{header:'MAPA A',key:'mapA',width:18},{header:'MAPA B',key:'mapB',width:18}];header(tw);tramos.forEach(c=>{const a=maps(c.startPoint),b=maps(c.endPoint),row=tw.addRow({id:c.id||'',party:clean(c.party),road:clean(c.road),distribution:String(c.distribution||'').replaceAll('_',' '),mode:c.countMode||'',count:c.posterCount??c.estimatedCount??c.observedCount??0,meters:Math.round(Number(c.distanceM||0)),points:(c.points||[]).length,mapA:a?'Abrir A':'',mapB:b?'Abrir B':''});link(tw.getCell(row.number,9),'📍 A',a);link(tw.getCell(row.number,10),'📍 B',b)})}
 const info=wb.addWorksheet('INFORMACIÓN');info.getCell('A1').value='ONE SHOP · ONPE-SGVC · REPORTE DE EVIDENCIAS';info.getCell('A1').font={bold:true,size:15,color:{argb:'FF0B2D5B'}};info.getCell('A3').value='Foto';info.getCell('B3').value='La foto se recompone desde el original, se corrige de orientación antes de colocar la marca y luego se centra en un marco fijo 4:3 de 1600×1200. No se estira ni se deforma.';info.getCell('A4').value='Provincia';info.getCell('B4').value='Lima Metropolitana se reporta Región=Lima y Provincia=Lima. El distrito no se inventa: si el geocodificador no entrega un nivel distrital confiable, se muestra FALTA CONFIRMAR DISTRITO.';info.getCell('A5').value='Empresa';info.getCell('B5').value='Proveedor identificado únicamente cuando la evidencia es PANEL.';info.getCell('A6').value='Nota';info.getCell('B6').value='Organización política / partido.';info.getColumn(1).width=24;info.getColumn(2).width=110;
 const buf=await wb.xlsx.writeBuffer();return new File([buf],`ONE_SHOP_REPORTE_TERRITORIAL_${typeof Dates!=='undefined'?Dates.date():new Date().toISOString().slice(0,10)}.xlsx`,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function patch(){try{if(typeof Reports==='undefined')return false;Reports.__territorialStandardV8=true;Reports.__territorialStandard=true;Reports.makeExcel=make;Reports.invalidate?.();return true}catch(_){return false}}
let n=0;const t=setInterval(()=>{if(patch()||++n>120)clearInterval(t)},50);patch();window.ONE_FIELD_REPORT_STANDARD_V8={BUILD,make,patch,territory,provider,party};window.ONE_FIELD_REPORT_STANDARD=window.ONE_FIELD_REPORT_STANDARD_V8;
})();