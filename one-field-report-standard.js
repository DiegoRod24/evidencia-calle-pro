/* ONE SHOP · REPORTE MODELO SGVC v6 */
(()=>{
'use strict';
if(window.ONE_FIELD_REPORT_STANDARD)return;
const BUILD='one-field-report-standard-v6';
const safe=v=>String(v??'').trim();
const norm=v=>safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const pending=v=>!safe(v)||/pendiente|no disponible/i.test(safe(v));
function gpsOf(r){return r?.gps||r||null}
function maps(r){const g=gpsOf(r);if(!g||!Number.isFinite(Number(g.latitude))||!Number.isFinite(Number(g.longitude)))return'';return `https://www.google.com/maps?q=${g.latitude},${g.longitude}`}
function header(ws){const h=ws.getRow(1);h.height=25;h.font={bold:true,color:{argb:'FFFFFFFF'},size:10};h.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF4F8ED1'}};h.alignment={vertical:'middle',horizontal:'center',wrapText:true};h.border={top:{style:'thin',color:{argb:'FF2D609B'}},bottom:{style:'thin',color:{argb:'FF2D609B'}},left:{style:'thin',color:{argb:'FF2D609B'}},right:{style:'thin',color:{argb:'FF2D609B'}}}}
function link(cell,text,url){cell.value=url?{text,hyperlink:url}:text;if(url)cell.font={color:{argb:'FF0563C1'},underline:true};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true}}
function territory(r){
 let region=safe(r.department||r.region),province=safe(r.province),district=safe(r.district),city=safe(r.city);
 if(pending(region))region='PENDIENTE';
 if(pending(province)){if(city)province=city;else if(norm(region)==='LIMA'&&district)province='Lima';else province='PENDIENTE'}
 if(pending(district)){district=city||'PENDIENTE'}
 return{region,province,district};
}
function streetAddress(r){const s=[safe(r.street),safe(r.houseNumber)].filter(Boolean).join(' ').trim();return s||safe(r.address)||'PENDIENTE'}
async function rawReportImage(r){
 if(r?.reportImage4x3)return r.reportImage4x3;
 const source=r?.correctedStampedImage||r?.stampedImage||r?.correctedImage||r?.image||'';
 if(window.ONE_SHOP_STABLE_RUNTIME?.report43)return await window.ONE_SHOP_STABLE_RUNTIME.report43(source);
 return source;
}
function corridors(){try{return Array.isArray(State?.settings?.propagandaCorridors)?State.settings.propagandaCorridors:[]}catch(_){return[]}}
async function make(){
 const data=Evidence.selectedForReport();if(!data.length)throw new Error('No hay evidencias para exportar.');if(!window.ExcelJS)throw new Error('El motor Excel todavía no está disponible.');
 const wb=new ExcelJS.Workbook();wb.creator='ONE SHOP · ONPE-SGVC';wb.created=new Date();wb.subject='Reporte de evidencias de campo';
 const ws=wb.addWorksheet('EVIDENCIAS',{views:[{state:'frozen',ySplit:1,xSplit:2}]});
 ws.columns=[
  {header:'ID',key:'id',width:6},{header:'Foto',key:'foto',width:18},{header:'Fecha',key:'fecha',width:13},{header:'Hora',key:'hora',width:12},
  {header:'Ubicación',key:'ubicacion',width:28},{header:'Empresa',key:'empresa',width:14},{header:'Nota',key:'nota',width:24},{header:'Lat/Long',key:'latlon',width:18},
  {header:'Clima',key:'clima',width:11},{header:'Altitud',key:'altitud',width:11},{header:'Zona',key:'zona',width:14},{header:'RegiOn',key:'region',width:15},
  {header:'Provincia',key:'provincia',width:15},{header:'Distrito',key:'distrito',width:15},{header:'DirecciOn',key:'direccion',width:24},{header:'Alcalde',key:'alcalde',width:30},
  {header:'Tipo',key:'tipo',width:14},{header:'Proceso',key:'proceso',width:12}
 ];
 header(ws);
 for(let i=0;i<data.length;i++){
   const r=data[i],g=r.gps||{},url=maps(r),t=territory(r),rowNo=i+2;
   const lat=Number(g.latitude),lon=Number(g.longitude),acc=Number(r.accuracy??g.accuracy),alt=Number(r.altitude??g.altitude);
   const locationText=safe(r.address)||'Ubicación pendiente';
   const latlon=Number.isFinite(lat)&&Number.isFinite(lon)?`${lat.toFixed(6)},\n${lon.toFixed(6)}`:'PENDIENTE';
   ws.addRow({
     id:i+1,fecha:r.fecha||'',hora:r.hora||'',ubicacion:locationText,empresa:'ONPE-SGVC',nota:safe(r.party),latlon,
     clima:Number.isFinite(acc)?`±${Math.round(acc)} m`:'-',altitud:Number.isFinite(alt)?`${Math.round(alt)} m`:'-',zona:safe(r.teamSector||r.zone||r.missionName)||'-',
     region:t.region,provincia:t.province,distrito:t.district,direccion:streetAddress(r),alcalde:safe(r.mayor||r.alcalde)||'PENDIENTE',
     tipo:safe(r.type)||'PENDIENTE',proceso:safe(r.electionProcess||r.process)||''
   });
   const row=ws.getRow(rowNo);row.height=92;row.alignment={vertical:'middle',wrapText:true};row.font={size:9,color:{argb:'FF0E1B2B'}};
   row.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2===0?'FFDCE9F7':'FFFFFFFF'}};
   row.border={top:{style:'thin',color:{argb:'FFB7CCE5'}},bottom:{style:'thin',color:{argb:'FFB7CCE5'}},left:{style:'thin',color:{argb:'FFD4DFEC'}},right:{style:'thin',color:{argb:'FFD4DFEC'}}};
   link(ws.getCell(rowNo,5),locationText,url);link(ws.getCell(rowNo,8),latlon,url);
   const imageData=await rawReportImage(r);
   if(/^data:image\//i.test(imageData))try{
     const ext=/^data:image\/png/i.test(imageData)?'png':'jpeg';
     const imgId=wb.addImage({base64:imageData.split(',')[1],extension:ext});
     ws.addImage(imgId,{tl:{col:1.02,row:rowNo-0.88},ext:{width:128,height:96},editAs:'oneCell'});
   }catch(_){}
 }
 ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,data.length+1),column:18}};
 ws.getColumn(1).alignment={vertical:'middle',horizontal:'center'};ws.getColumn(2).alignment={vertical:'middle',horizontal:'center'};

 const tramos=corridors();if(tramos.length){
   const tw=wb.addWorksheet('TRAMOS_PROPAGANDA',{views:[{state:'frozen',ySplit:1}]});
   tw.columns=[{header:'ID_TRAMO',key:'id',width:24},{header:'ORGANIZACIÓN',key:'party',width:30},{header:'VÍA / TRAMO',key:'road',width:38},{header:'DISTRIBUCIÓN',key:'distribution',width:20},{header:'CONTEO',key:'mode',width:16},{header:'CARTELES',key:'count',width:11},{header:'DISTANCIA M',key:'meters',width:13},{header:'PUNTOS',key:'points',width:10},{header:'MAPA A',key:'mapA',width:18},{header:'MAPA B',key:'mapB',width:18}];
   const th=tw.getRow(1);th.font={bold:true,color:{argb:'FFFFFFFF'}};th.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF7A4A13'}};th.alignment={vertical:'middle',horizontal:'center'};
   tramos.forEach(c=>{const a=maps(c.startPoint),b=maps(c.endPoint),row=tw.addRow({id:c.id||'',party:c.party||'',road:c.road||'',distribution:String(c.distribution||'').replaceAll('_',' '),mode:c.countMode||'',count:c.posterCount??c.estimatedCount??c.observedCount??0,meters:Math.round(Number(c.distanceM||0)),points:(c.points||[]).length,mapA:a?'Abrir A':'',mapB:b?'Abrir B':''});link(tw.getCell(row.number,9),'📍 A',a);link(tw.getCell(row.number,10),'📍 B',b)});
 }
 const info=wb.addWorksheet('INFORMACIÓN');
 info.getCell('A1').value='ONE SHOP · ONPE-SGVC · REPORTE DE EVIDENCIAS';info.getCell('A1').font={bold:true,size:15,color:{argb:'FF0B2D5B'}};
 info.getCell('A3').value='Criterio de foto';info.getCell('B3').value='Cada evidencia conserva el original y una derivada 4:3 de 1600×1200 para reporte. En Excel todas se insertan a exactamente 128×96 px, sin importar si la toma original fue vertical u horizontal.';
 info.getCell('A4').value='Territorio';info.getCell('B4').value='Región/Provincia/Distrito se guardan con la evidencia. Si Nominatim omite Provincia, ONE SHOP usa la ciudad administrativa como fallback; en Lima Metropolitana usa Lima.';
 info.getCell('A5').value='Empresa';info.getCell('B5').value='ONPE-SGVC';info.getCell('A6').value='Nota';info.getCell('B6').value='Organización política / partido.';
 info.getColumn(1).width=24;info.getColumn(2).width=95;
 const buf=await wb.xlsx.writeBuffer();return new File([buf],`ONE_SHOP_REPORTE_${typeof Dates!=='undefined'?Dates.date():new Date().toISOString().slice(0,10)}.xlsx`,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function patch(){try{if(typeof Reports==='undefined')return false;Reports.__territorialStandardV5=false;Reports.__territorialStandardV6=true;Reports.__territorialStandard=true;Reports.makeExcel=make;Reports.invalidate?.();return true}catch(_){return false}}
let n=0;const t=setInterval(()=>{if(patch()||++n>80)clearInterval(t)},50);patch();window.ONE_FIELD_REPORT_STANDARD={BUILD,make,patch};
})();
