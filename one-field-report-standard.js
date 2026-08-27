/* ONE SHOP · REPORTE TERRITORIAL ESTANDAR v5 */
(()=>{
'use strict';
if(window.ONE_FIELD_REPORT_STANDARD)return;
const BUILD='one-field-report-standard-v5';
const safe=v=>String(v??'').trim();
const clean=v=>safe(v).replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim();
const norm=v=>safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const textField=(v,fallback='')=>{const s=safe(v);if(!s||/^(PENDIENTE|UBIGEO PENDIENTE|UBICACION PENDIENTE|DIRECCION PENDIENTE)$/i.test(s)||/^\d{1,3}$/.test(s))return fallback;return s};
function nomenclature(r){if(r.nomenclature||r.nomenclatura)return r.nomenclature||r.nomenclatura;const party=clean(r.party||'PENDIENTE'),dep=clean(r.department||r.region||''),prov=clean(r.province||''),dist=clean(r.district||''),type=clean(r.type||'PENDIENTE');return `${safe(r.fecha||'').replaceAll('-','')}_${safe(r.hora||'').replaceAll(':','.')}_${party}_${dep}_${prov}_${dist}_${type}`}
function gpsOf(r){return r?.gps||r||null}
function maps(r){const g=gpsOf(r);if(!g||!Number.isFinite(Number(g.latitude))||!Number.isFinite(Number(g.longitude)))return'';return `https://www.google.com/maps?q=${g.latitude},${g.longitude}`}
function header(ws,color='FF0B2D5B'){const h=ws.getRow(1);h.height=30;h.font={bold:true,color:{argb:'FFFFFFFF'},size:10};h.fill={type:'pattern',pattern:'solid',fgColor:{argb:color}};h.alignment={vertical:'middle',horizontal:'center',wrapText:true};h.border={bottom:{style:'medium',color:{argb:'FFFFFFFF'}}}}
function addLink(cell,label,url){cell.value=url?{text:label,hyperlink:url}:'';if(url)cell.font={color:{argb:'FF1D4ED8'},underline:true,bold:true};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true}}
function corridors(){try{return Array.isArray(State?.settings?.propagandaCorridors)?State.settings.propagandaCorridors:[]}catch(_){return[]}}
function providerOf(r){return norm(r?.type)==='PANEL'?textField(r.panelProvider||r.provider||r.company||r.empresa||''):''}
function territoryOf(r){return{
 region:textField(r.department||r.region||'','PENDIENTE'),
 province:textField(r.province||'','PENDIENTE'),
 district:textField(r.district||'','PENDIENTE'),
 address:textField(r.address||r.captureAddress||r.addressStructured||'','Dirección pendiente')
}}
async function reportImage(r){if(r?.correctedStampedImage)return r.correctedStampedImage;if(r?.correctedImage){try{if(typeof Watermark!=='undefined'&&Watermark?.stamp)return await Watermark.stamp(r.correctedImage,r)}catch(_){}return r.correctedImage}return r?.rescuedImage||r?.stampedImage||r?.image||''}
function standardPhoto(dataUrl){return new Promise(resolve=>{if(!/^data:image\//i.test(dataUrl||''))return resolve(dataUrl||'');const img=new Image();img.onload=()=>{try{
  const W=1600,H=1200,c=document.createElement('canvas');c.width=W;c.height=H;
  const ctx=c.getContext('2d',{alpha:false});
  ctx.fillStyle='#F3F5F8';ctx.fillRect(0,0,W,H);
  const pad=22,innerW=W-pad*2,innerH=H-pad*2;
  const s=Math.min(innerW/Math.max(1,img.naturalWidth),innerH/Math.max(1,img.naturalHeight));
  const w=img.naturalWidth*s,h=img.naturalHeight*s,x=(W-w)/2,y=(H-h)/2;
  ctx.drawImage(img,x,y,w,h);
  ctx.strokeStyle='#D7DFEA';ctx.lineWidth=8;ctx.strokeRect(4,4,W-8,H-8);
  resolve(c.toDataURL('image/jpeg',0.93))
}catch(_){resolve(dataUrl)}};img.onerror=()=>resolve(dataUrl);img.src=dataUrl})}
function territorialSummary(data){
 const map=new Map();
 for(const r of data){
   const t=territoryOf(r),key=[t.region,t.province,t.district].join('|');
   if(!map.has(key))map.set(key,{region:t.region,province:t.province,district:t.district,total:0,panel:0,banner:0,pinta:0,local:0,pendiente:0,parties:new Set()});
   const x=map.get(key);x.total++;const type=norm(r.type||'PENDIENTE');
   if(type==='PANEL')x.panel++;else if(type==='BANNER')x.banner++;else if(type==='PINTA')x.pinta++;else if(type==='LOCAL PARTIDARIO')x.local++;else x.pendiente++;
   if(textField(r.party))x.parties.add(textField(r.party));
 }
 return [...map.values()].sort((a,b)=>`${a.region}|${a.province}|${a.district}`.localeCompare(`${b.region}|${b.province}|${b.district}`,'es'));
}
async function make(){
 const data=Evidence.selectedForReport();if(!data.length)throw new Error('No hay evidencias para exportar.');if(!window.ExcelJS)throw new Error('El motor Excel todavía no está disponible.');
 const wb=new ExcelJS.Workbook();wb.creator='ONE SHOP';wb.created=new Date();wb.subject='Evidencias georreferenciadas para control territorial y municipal';
 const ws=wb.addWorksheet('EVIDENCIAS',{views:[{state:'frozen',ySplit:1,xSplit:2}]});
 ws.columns=[
  {header:'N°',key:'id',width:6},{header:'FOTO',key:'foto',width:31},{header:'FECHA',key:'fecha',width:12},{header:'HORA',key:'hora',width:10},
  {header:'CÓDIGO',key:'code',width:22},{header:'TIPO',key:'type',width:19},{header:'ORGANIZACIÓN POLÍTICA',key:'party',width:31},{header:'CANDIDATO',key:'candidate',width:27},
  {header:'EMPRESA / PROVEEDOR (PANEL)',key:'provider',width:38},{header:'REGIÓN',key:'region',width:20},{header:'PROVINCIA',key:'province',width:22},{header:'DISTRITO',key:'district',width:22},
  {header:'DIRECCIÓN',key:'address',width:44},{header:'LATITUD',key:'lat',width:15},{header:'LONGITUD',key:'lon',width:15},{header:'GPS ±m',key:'accuracy',width:11},
  {header:'PROCESO',key:'process',width:13},{header:'ESTADO',key:'status',width:16},{header:'MAPA',key:'map',width:18}
 ];header(ws);
 for(let i=0;i<data.length;i++){
  const r=data[i],g=r.gps||{},url=maps(r),rowNo=i+2,t=territoryOf(r);
  ws.addRow({
   id:i+1,fecha:r.fecha||'',hora:r.hora||'',code:r.photoCode||r.id||'',type:r.type||'PENDIENTE',party:textField(r.party),
   candidate:textField(r.candidate),provider:providerOf(r),region:t.region,province:t.province,district:t.district,address:t.address,
   lat:Number.isFinite(Number(g.latitude))?Number(g.latitude):'',lon:Number.isFinite(Number(g.longitude))?Number(g.longitude):'',
   accuracy:r.accuracy??g.accuracy??'',process:r.electionProcess||r.process||'',status:r.status||r.reviewStatus||'PENDIENTE',map:url?'Abrir ubicación':''
  });
  const row=ws.getRow(rowNo);row.height=128;row.alignment={vertical:'middle',wrapText:true};row.font={size:9,color:{argb:'FF172033'}};
  row.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2===0?'FFF8FAFD':'FFFFFFFF'}};
  row.border={bottom:{style:'thin',color:{argb:'FFD9E2F0'}}};
  if(url)addLink(ws.getCell(rowNo,19),'📍 Abrir ubicación',url);
  const acc=Number(r.accuracy??g.accuracy);if(Number.isFinite(acc)){const c=ws.getCell(rowNo,16);c.fill={type:'pattern',pattern:'solid',fgColor:{argb:acc<=15?'FFDDF7E8':acc<=50?'FFFFF2C7':'FFFFDADA'}}}
  const rawImage=await reportImage(r),imageData=await standardPhoto(rawImage);
  if(/^data:image\//i.test(imageData))try{
    const ext=/^data:image\/png/i.test(imageData)?'png':'jpeg',imgId=wb.addImage({base64:imageData.split(',')[1],extension:ext});
    ws.addImage(imgId,{tl:{col:1.06,row:rowNo-0.97},ext:{width:220,height:165},editAs:'oneCell'})
  }catch(_){}
 }
 ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,data.length+1),column:19}};
 ws.getColumn(1).alignment={vertical:'middle',horizontal:'center'};ws.getColumn(2).alignment={vertical:'middle',horizontal:'center'};
 ws.getColumn(14).numFmt='0.000000';ws.getColumn(15).numFmt='0.000000';

 const summary=territorialSummary(data);
 const sw=wb.addWorksheet('RESUMEN_TERRITORIAL',{views:[{state:'frozen',ySplit:1}]});
 sw.columns=[
  {header:'REGIÓN',key:'region',width:22},{header:'PROVINCIA',key:'province',width:24},{header:'DISTRITO',key:'district',width:24},
  {header:'TOTAL EVIDENCIAS',key:'total',width:16},{header:'PANEL',key:'panel',width:11},{header:'BANNER',key:'banner',width:11},
  {header:'PINTA',key:'pinta',width:11},{header:'LOCAL PARTIDARIO',key:'local',width:18},{header:'PENDIENTE / OTRO',key:'pendiente',width:18},
  {header:'ORGANIZACIONES OBSERVADAS',key:'parties',width:55}
 ];header(sw,'FF164E63');
 summary.forEach(x=>sw.addRow({region:x.region,province:x.province,district:x.district,total:x.total,panel:x.panel,banner:x.banner,pinta:x.pinta,local:x.local,pendiente:x.pendiente,parties:[...x.parties].sort((a,b)=>a.localeCompare(b,'es')).join(' · ')}));
 sw.autoFilter={from:'A1',to:`J${Math.max(1,summary.length+1)}`};sw.eachRow((row,n)=>{if(n===1)return;row.alignment={vertical:'middle',wrapText:true};if(n%2===0)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F8FA'}}});

 const tramos=corridors();if(tramos.length){
  const tw=wb.addWorksheet('TRAMOS_PROPAGANDA',{views:[{state:'frozen',ySplit:1}]});
  tw.columns=[{header:'ID_TRAMO',key:'id',width:25},{header:'ORGANIZACIÓN',key:'party',width:32},{header:'TIPO',key:'type',width:22},{header:'VÍA / TRAMO',key:'road',width:42},{header:'DISTRIBUCIÓN',key:'distribution',width:22},{header:'CONTEO',key:'mode',width:16},{header:'CARTELES',key:'count',width:12},{header:'DISTANCIA M',key:'meters',width:14},{header:'PUNTOS TRAZO',key:'points',width:14},{header:'FOTOS MUESTRA',key:'samples',width:15},{header:'INICIO',key:'start',width:22},{header:'FIN',key:'end',width:22},{header:'MAPA A',key:'mapA',width:18},{header:'MAPA B',key:'mapB',width:18},{header:'FUENTE',key:'source',width:16}];header(tw,'FF7A4A13');
  tramos.forEach(c=>{const a=maps(c.startPoint),b=maps(c.endPoint),row=tw.addRow({id:c.id||'',party:c.party||'',type:c.type||c.repetitiveSubtype||'CARTEL_POSTE',road:c.road||'',distribution:String(c.distribution||'').replaceAll('_',' '),mode:c.countMode||'',count:c.posterCount??c.estimatedCount??c.observedCount??0,meters:Math.round(Number(c.distanceM||0)),points:(c.points||[]).length,samples:(c.evidenceIds||[]).length,start:c.startedAt||'',end:c.endedAt||'',mapA:a?'Abrir A':'',mapB:b?'Abrir B':'',source:c.sourceApp||'ONE SHOP'});addLink(tw.getCell(row.number,13),'📍 A',a);addLink(tw.getCell(row.number,14),'📍 B',b)});
  tw.autoFilter={from:'A1',to:'O1'}
 }

 const info=wb.addWorksheet('INFORMACIÓN');
 info.getCell('A1').value='ONE SHOP · REPORTE TERRITORIAL PARA CONTROL MUNICIPAL';info.getCell('A1').font={bold:true,size:16,color:{argb:'FF0B2D5B'}};
 info.getCell('A3').value='Evidencias';info.getCell('B3').value=data.length;info.getCell('A4').value='Distritos / grupos territoriales';info.getCell('B4').value=summary.length;info.getCell('A5').value='Tramos';info.getCell('B5').value=tramos.length;info.getCell('A6').value='Generado';info.getCell('B6').value=new Date();info.getCell('B6').numFmt='dd/mm/yyyy hh:mm';
 info.getCell('A8').value='Criterio fotográfico';info.getCell('B8').value='Todas las fotos se convierten a un marco 4:3 idéntico y se insertan con exactamente 220 × 165 px. Vertical y horizontal conservan proporción, se centran y no se deforman.';
 info.getCell('A9').value='Datos territoriales';info.getCell('B9').value='REGIÓN, PROVINCIA, DISTRITO y DIRECCIÓN se toman de la georreferenciación guardada por ONE SHOP. Si la geocodificación no estuvo disponible al capturar, el reporte marca el dato como PENDIENTE en vez de inventarlo.';
 info.getCell('A10').value='Empresa / proveedor';info.getCell('B10').value='Se registra únicamente cuando el tipo de evidencia es PANEL.';
 info.getCell('A11').value='Uso sugerido';info.getCell('B11').value='RESUMEN_TERRITORIAL agrupa por Región / Provincia / Distrito para apoyar la identificación de la jurisdicción municipal y priorizar comunicaciones, retiro o subsanación.';
 info.getColumn(1).width=28;info.getColumn(2).width=92;

 const buf=await wb.xlsx.writeBuffer();return new File([buf],`ONE_SHOP_REPORTE_TERRITORIAL_${typeof Dates!=='undefined'?Dates.date():new Date().toISOString().slice(0,10)}.xlsx`,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function patch(){try{if(typeof Reports==='undefined')return false;if(Reports.__territorialStandardV5)return true;Reports.__territorialStandardV5=true;Reports.__territorialStandard=true;Reports.makeExcel=make;Reports.invalidate?.();return true}catch(_){return false}}
let n=0;const t=setInterval(()=>{if(patch()||++n>80)clearInterval(t)},50);patch();window.ONE_FIELD_REPORT_STANDARD={BUILD,make,patch};
})();
