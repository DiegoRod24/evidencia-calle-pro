'use strict';
importScripts('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
const norm=v=>String(v??'').trim();
const valid=r=>Number.isFinite(+r.latitude)&&Number.isFinite(+r.longitude)&&Math.abs(+r.latitude)<=90&&Math.abs(+r.longitude)<=180&&(+r.latitude!==0||+r.longitude!==0);
const unescapeXml=s=>String(s||'').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function isoDate(v){
 if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);
 if(typeof v==='number'){const d=XLSX.SSF.parse_date_code(v);if(d)return `${String(d.y).padStart(4,'0')}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`}
 const s=norm(v);if(!s)return null;
 let m=s.match(/^(\d{4})[-\/]([01]?\d)[-\/]([0-3]?\d)/);if(m)return `${m[1]}-${String(+m[2]).padStart(2,'0')}-${String(+m[3]).padStart(2,'0')}`;
 m=s.match(/^([0-3]?\d)[-\/]([01]?\d)[-\/](\d{4})/);if(m)return `${m[3]}-${String(+m[2]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`;
 return null;
}
function mapRow(x,i,name){return {code:norm(x['CÓDIGO']||x.CODIGO||x.ID||`ROW-${i+1}`),verifier:norm(x['VERIFICADOR']),capture_date:isoDate(x['FECHA']),capture_time:norm(x['HORA']),latitude:+x['LATITUD'],longitude:+x['LONGITUD'],gps_accuracy:+x['GPS ±m']||null,altitude:+x['ALTITUD']||null,ubigeo:norm(x['UBIGEO']),region:norm(x['REGIÓN']),province:norm(x['PROVINCIA']),district:norm(x['DISTRITO']),address:norm(x['DIRECCIÓN CAPTURA']),type:norm(x['TIPO']||'PENDIENTE'),party:norm(x['PARTIDO']),provider:norm(x['EMPRESA / PROVEEDOR']),process:norm(x['PROCESO']),orientation:norm(x['ORIENTACIÓN CAPTURA']),pipeline:norm(x['PIPELINE']),sha_original:norm(x['SHA-256 ORIGINAL']),sha_marked:norm(x['SHA-256 MARCADA']),review_status:norm(x['TIPO']).toUpperCase()==='PENDIENTE'?'PENDIENTE':'REVISADO',source_file:name,notes:''}}
function relMap(xml){const out={};for(const m of String(xml||'').matchAll(/<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?>(?:<\/Relationship>)?/g))out[m[1]]=unescapeXml(m[2]);return out}
function joinPath(base,target){const parts=(base+'/'+target).split('/'),out=[];for(const p of parts){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/')}
async function extractMedia(zip){
 const wbXml=await zip.file('xl/workbook.xml')?.async('text');const wbRels=await zip.file('xl/_rels/workbook.xml.rels')?.async('text');if(!wbXml||!wbRels)return[];
 const sheetMatch=[...wbXml.matchAll(/<sheet\b([^>]*)\/?>(?:<\/sheet>)?/g)].map(m=>m[1]).map(a=>({name:(a.match(/\bname="([^"]+)"/)||[])[1],rid:(a.match(/\br:id="([^"]+)"/)||[])[1]})).find(s=>String(s.name||'').toUpperCase()==='EVIDENCIAS');if(!sheetMatch?.rid)return[];
 const wm=relMap(wbRels),sheetTarget=wm[sheetMatch.rid];if(!sheetTarget)return[];const sheetPath=joinPath('xl',sheetTarget),sheetXml=await zip.file(sheetPath)?.async('text');if(!sheetXml)return[];
 const drawingRid=(sheetXml.match(/<drawing\b[^>]*\br:id="([^"]+)"/)||[])[1];if(!drawingRid)return[];
 const sheetDir=sheetPath.slice(0,sheetPath.lastIndexOf('/')),sheetName=sheetPath.slice(sheetPath.lastIndexOf('/')+1),sheetRelPath=`${sheetDir}/_rels/${sheetName}.rels`,sheetRels=await zip.file(sheetRelPath)?.async('text');if(!sheetRels)return[];
 const sm=relMap(sheetRels),drawingTarget=sm[drawingRid];if(!drawingTarget)return[];const drawingPath=joinPath(sheetDir,drawingTarget),drawingXml=await zip.file(drawingPath)?.async('text');if(!drawingXml)return[];
 const drawDir=drawingPath.slice(0,drawingPath.lastIndexOf('/')),drawName=drawingPath.slice(drawingPath.lastIndexOf('/')+1),drawRelPath=`${drawDir}/_rels/${drawName}.rels`,drawRels=await zip.file(drawRelPath)?.async('text');if(!drawRels)return[];const dm=relMap(drawRels);
 const anchors=[...drawingXml.matchAll(/<xdr:(?:oneCellAnchor|twoCellAnchor)\b[\s\S]*?<\/xdr:(?:oneCellAnchor|twoCellAnchor)>/g)],media=[];let done=0;
 for(const a of anchors){const xml=a[0],from=(xml.match(/<xdr:from>[\s\S]*?<\/xdr:from>/)||[])[0]||'',row=+(from.match(/<xdr:row>(\d+)<\/xdr:row>/)||[])[1],rid=(xml.match(/<a:blip\b[^>]*\br:embed="([^"]+)"/)||[])[1];if(!rid||!Number.isFinite(row))continue;const target=dm[rid];if(!target)continue;const mediaPath=joinPath(drawDir,target),file=zip.file(mediaPath);if(!file)continue;const buffer=await file.async('arraybuffer'),name=mediaPath.split('/').pop()||`image-${row}.jpg`,ext=(name.split('.').pop()||'jpg').toLowerCase(),mime=ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';media.push({dataIndex:Math.max(0,row-1),name,ext,mime,buffer});done++;if(done%10===0)postMessage({type:'progress',stage:'photos',done,total:anchors.length})}
 return media;
}
self.onmessage=async e=>{try{const {buffer,name}=e.data||{};postMessage({type:'progress',stage:'excel',message:'Abriendo libro…'});const wb=XLSX.read(buffer,{type:'array',cellDates:true,cellStyles:false,cellFormula:false,cellHTML:false}),ws=wb.Sheets['DATOS_TECNICOS']||wb.Sheets[wb.SheetNames[0]];if(!ws)throw new Error('No se encontró DATOS_TECNICOS');const raw=XLSX.utils.sheet_to_json(ws,{defval:'',raw:true}),rows=raw.map((x,i)=>mapRow(x,i,name)).filter(valid);postMessage({type:'progress',stage:'rows',done:rows.length,total:raw.length,message:`${rows.length} ubicaciones válidas`});const zip=await JSZip.loadAsync(buffer),media=await extractMedia(zip);const transfers=media.map(x=>x.buffer);postMessage({type:'done',rows,media,summary:{rows:rows.length,photos:media.length,sheets:wb.SheetNames}},transfers)}catch(err){postMessage({type:'error',message:err?.message||String(err)})}};
