'use strict';
const clean=v=>String(v??'').trim();
function valid(r){return Number.isFinite(+r.latitude)&&Number.isFinite(+r.longitude)&&Math.abs(+r.latitude)<=90&&Math.abs(+r.longitude)<=180&&(+r.latitude!==0||+r.longitude!==0)}
function mapRow(x,i,name){return {code:clean(x['CÓDIGO']||x.CODIGO||x.ID||`ROW-${i+1}`),verifier:clean(x['VERIFICADOR']),capture_date:clean(x['FECHA']),capture_time:clean(x['HORA']),latitude:+x['LATITUD'],longitude:+x['LONGITUD'],gps_accuracy:+x['GPS ±m']||null,altitude:+x['ALTITUD']||null,ubigeo:clean(x['UBIGEO']),region:clean(x['REGIÓN']),province:clean(x['PROVINCIA']),district:clean(x['DISTRITO']),address:clean(x['DIRECCIÓN CAPTURA']),type:clean(x['TIPO']||'PENDIENTE'),party:clean(x['PARTIDO']),provider:clean(x['EMPRESA / PROVEEDOR']),process:clean(x['PROCESO']),orientation:clean(x['ORIENTACIÓN CAPTURA']),pipeline:clean(x['PIPELINE']),sha_original:clean(x['SHA-256 ORIGINAL']),sha_marked:clean(x['SHA-256 MARCADA']),review_status:clean(x['TIPO'])==='PENDIENTE'?'PENDIENTE':'REVISADO',source_file:name,notes:''}}
self.onmessage=async e=>{
 try{
  const file=e.data?.file;if(!file)throw new Error('No se recibió el archivo');
  self.postMessage({type:'status',text:`Abriendo ${file.name}…`});
  if(typeof XLSX==='undefined'){
   self.postMessage({type:'status',text:'Cargando lector Excel en segundo plano…'});
   importScripts('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
  }
  self.postMessage({type:'status',text:'Leyendo DATOS_TECNICOS…'});
  const buf=await file.arrayBuffer();
  const wb=XLSX.read(buf,{type:'array',cellStyles:false,cellFormula:false,cellHTML:false,bookVBA:false,bookDeps:false,bookFiles:false});
  const sheetName=wb.Sheets['DATOS_TECNICOS']?'DATOS_TECNICOS':wb.SheetNames[0];
  if(!sheetName)throw new Error('El Excel no contiene hojas');
  const ws=wb.Sheets[sheetName];
  const raw=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false,blankrows:false});
  const rows=[];
  for(let i=0;i<raw.length;i++){
   const r=mapRow(raw[i],i,file.name);if(valid(r))rows.push(r);
   if(i&&i%250===0)self.postMessage({type:'progress',done:i,total:raw.length});
  }
  self.postMessage({type:'done',rows,totalRaw:raw.length,sheet:sheetName});
 }catch(err){self.postMessage({type:'error',message:err?.message||String(err)})}
};
