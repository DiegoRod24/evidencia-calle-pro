/* ONE SHOT / ONE SHOP · REPORTE TERRITORIAL ESTANDAR */
(()=>{
'use strict';
if(window.ONE_FIELD_REPORT_STANDARD)return;
const BUILD='one-field-report-standard-v1';
const safe=v=>String(v??'').trim();
const clean=v=>safe(v).replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim();
const pad=n=>String(n).padStart(2,'0');
function nomenclature(r){if(r.nomenclature||r.nomenclatura)return r.nomenclature||r.nomenclatura;const party=clean(r.party||'PENDIENTE'),dep=clean(r.department||r.region||''),prov=clean(r.province||''),dist=clean(r.district||''),type=clean(r.type||'PENDIENTE');return `${safe(r.fecha||'').replaceAll('-','')}_${safe(r.hora||'').replaceAll(':','.')}_${party}_${dep}_${prov}_${dist}_${type}`}
function imageSize(dataUrl){return new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({w:i.naturalWidth||1,h:i.naturalHeight||1});i.onerror=()=>resolve({w:1,h:1});i.src=dataUrl})}
function maps(r){const g=r?.gps;if(!g||!Number.isFinite(Number(g.latitude))||!Number.isFinite(Number(g.longitude)))return'';return `https://www.google.com/maps?q=${g.latitude},${g.longitude}`}
async function make(){
  const data=Evidence.selectedForReport();if(!data.length)throw new Error('No hay evidencias para exportar.');if(!window.ExcelJS)throw new Error('El motor Excel todavía no está disponible.');
  const wb=new ExcelJS.Workbook();wb.creator='ONE SHOT';wb.created=new Date();wb.subject='Evidencias georreferenciadas';
  const ws=wb.addWorksheet('EVIDENCIAS',{views:[{state:'frozen',ySplit:1,xSplit:2}]});
  ws.columns=[
    {header:'ID',key:'id',width:7},{header:'FOTO',key:'foto',width:25.7},{header:'FECHA',key:'fecha',width:13},{header:'HORA',key:'hora',width:11},
    {header:'UBICACIÓN',key:'ubicacion',width:34},{header:'ORGANIZACIÓN',key:'party',width:30},{header:'CANDIDATO',key:'candidate',width:28},{header:'LAT/LONG',key:'latlong',width:23},
    {header:'ALTITUD',key:'altitude',width:12},{header:'CÓDIGO',key:'code',width:22},{header:'NOMENCLATURA',key:'nomen',width:48},{header:'LATITUD',key:'lat',width:15},
    {header:'LONGITUD',key:'lon',width:15},{header:'REGIÓN',key:'region',width:18},{header:'PROVINCIA',key:'province',width:20},{header:'DISTRITO',key:'district',width:20},
    {header:'DIRECCIÓN',key:'address',width:42},{header:'MUNICIPALIDAD',key:'municipality',width:34},{header:'TIPO',key:'type',width:18},{header:'ESTADO',key:'status',width:16},
    {header:'PROCESO',key:'process',width:14},{header:'GPS ±m',key:'accuracy',width:11},{header:'MAPA',key:'map',width:18}
  ];
  const head=ws.getRow(1);head.height=28;head.font={bold:true,color:{argb:'FFFFFFFF'},size:10};head.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0B2D5B'}};head.alignment={vertical:'middle',horizontal:'center',wrapText:true};
  for(let i=0;i<data.length;i++){
    const r=data[i],g=r.gps||{},url=maps(r),rowNo=i+2;
    ws.addRow({id:i+1,fecha:r.fecha||'',hora:r.hora||'',ubicacion:r.address||r.captureAddress||'Dirección pendiente',party:r.party||'',candidate:r.candidate||'',latlong:Number.isFinite(Number(g.latitude))?`${Number(g.latitude).toFixed(6)}, ${Number(g.longitude).toFixed(6)}`:'',altitude:r.altitude??g.altitude??'',code:r.photoCode||r.id||'',nomen:nomenclature(r),lat:Number.isFinite(Number(g.latitude))?Number(g.latitude):'',lon:Number.isFinite(Number(g.longitude))?Number(g.longitude):'',region:r.department||r.region||'',province:r.province||'',district:r.district||'',address:r.address||r.captureAddress||'',municipality:r.municipalityName||r.municipality||r.municipalidad||'',type:r.type||'PENDIENTE',status:r.status||r.reviewStatus||'PENDIENTE',process:r.electionProcess||r.process||'',accuracy:r.accuracy??g.accuracy??'',map:url?'Abrir ubicación':''});
    const row=ws.getRow(rowNo);row.height=120;row.alignment={vertical:'middle',wrapText:true};row.font={size:9,color:{argb:'FF172033'}};row.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2===0?'FFF8FAFD':'FFFFFFFF'}};row.border={bottom:{style:'thin',color:{argb:'FFD9E2F0'}}};
    if(url){const c=ws.getCell(rowNo,23);c.value={text:'📍 Abrir ubicación',hyperlink:url};c.font={color:{argb:'FF1D4ED8'},underline:true};c.alignment={vertical:'middle',horizontal:'center'}}
    const imageData=r.stampedImage||r.correctedImage||r.image||'';
    if(/^data:image\//i.test(imageData))try{const ext=/^data:image\/png/i.test(imageData)?'png':'jpeg',imgId=wb.addImage({base64:imageData.split(',')[1],extension:ext}),dim=await imageSize(imageData),aspect=Math.max(.15,Math.min(7,dim.w/dim.h)),boxW=180,boxH=150;let w=boxW,h=w/aspect;if(h>boxH){h=boxH;w=h*aspect}const x=(boxW-w)/2,y=(boxH-h)/2;ws.addImage(imgId,{tl:{col:1+(.5*x/boxW),row:rowNo-1+(.5*y/boxH)},ext:{width:w,height:h},editAs:'oneCell'})}catch(_){ }
  }
  ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,data.length+1),column:23}};ws.getColumn(1).alignment={vertical:'middle',horizontal:'center'};ws.getColumn(2).alignment={vertical:'middle',horizontal:'center'};ws.getColumn(12).numFmt='0.000000';ws.getColumn(13).numFmt='0.000000';
  const info=wb.addWorksheet('INFORMACIÓN');info.getCell('A1').value='ONE SHOT · REPORTE TERRITORIAL';info.getCell('A1').font={bold:true,size:16,color:{argb:'FF0B2D5B'}};info.getCell('A3').value='Evidencias';info.getCell('B3').value=data.length;info.getCell('A4').value='Generado';info.getCell('B4').value=new Date();info.getCell('B4').numFmt='dd/mm/yyyy hh:mm';info.getCell('A6').value='Criterio fotográfico';info.getCell('B6').value='Vertical y horizontal usan el mismo marco; la imagen conserva proporción y no se deforma.';info.getColumn(1).width=24;info.getColumn(2).width=72;
  const buf=await wb.xlsx.writeBuffer();return new File([buf],`ONE_SHOT_EVIDENCIAS_${typeof Dates!=='undefined'?Dates.date():new Date().toISOString().slice(0,10)}.xlsx`,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function patch(){try{if(typeof Reports==='undefined'||Reports.__territorialStandard)return false;Reports.__territorialStandard=true;Reports.makeExcel=make;Reports.invalidate?.();return true}catch(_){return false}}
let n=0;const t=setInterval(()=>{if(patch()||++n>80)clearInterval(t)},50);patch();
window.ONE_FIELD_REPORT_STANDARD={BUILD,make,patch};
})();
