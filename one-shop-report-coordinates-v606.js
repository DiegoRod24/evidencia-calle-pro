"use strict";
/* ONE SHOT v5.9.23 · coordenadas Excel estilo TimeMark */
(()=>{
if(window.ONE_SHOT_REPORT_COORDINATES_606)return;
window.ONE_SHOT_REPORT_COORDINATES_606=true;
const BUILD='one-shop-v5.9.23-signed-cardinal-coordinates-01';
const signedCardinal=(value,axis,digits=5)=>{
  const n=Number(value);
  if(!Number.isFinite(n))return '';
  const hemi=axis==='lat'?(n<0?'S':'N'):(n<0?'W':'E');
  return `${n.toFixed(digits)}°${hemi}`;
};
const formatPair=(lat,lon)=>`${signedCardinal(lat,'lat')},\n${signedCardinal(lon,'lon')}`;
function parsePair(text){
  const nums=String(text??'').match(/-?\d+(?:\.\d+)?/g)||[];
  if(nums.length<2)return null;
  const lat=Number(nums[0]),lon=Number(nums[1]);
  return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon}:null;
}
async function rewrite(file){
  if(!file||!window.ExcelJS)return file;
  try{
    const wb=new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws=wb.getWorksheet('EVIDENCIAS');
    if(!ws)return file;
    let col=0;
    ws.getRow(1).eachCell((cell,n)=>{if(String(cell.value??'').trim().toUpperCase()==='LAT/LONG')col=n});
    if(!col)return file;
    for(let rn=2;rn<=ws.rowCount;rn++){
      const cell=ws.getCell(rn,col),value=cell.value;
      const text=value&&typeof value==='object'&&'text'in value?value.text:value;
      const pair=parsePair(text);
      if(!pair)continue;
      const label=formatPair(pair.lat,pair.lon);
      if(value&&typeof value==='object'&&value.hyperlink){cell.value={...value,text:label};}
      else cell.value=label;
      cell.alignment={...(cell.alignment||{}),vertical:'middle',horizontal:'center',wrapText:true};
    }
    const buf=await wb.xlsx.writeBuffer();
    return new File([buf],file.name,{type:file.type||'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',lastModified:Date.now()});
  }catch(err){console.warn('[ONE SHOT] no se pudo reformatear Lat/Long',err);return file;}
}
function wrap(){
  try{
    if(typeof Reports==='undefined'||typeof Reports.makeExcel!=='function')return false;
    const current=Reports.makeExcel;
    if(current.__oneshotSignedCoords606)return true;
    const wrapped=async function(...args){return rewrite(await current.apply(this,args))};
    wrapped.__oneshotSignedCoords606=true;
    wrapped.__oneshotBase=current;
    Reports.makeExcel=wrapped;
    console.info('[ONE SHOT]',BUILD);
    return true;
  }catch(_){return false;}
}
let tries=0;
const timer=setInterval(()=>{wrap();if(++tries>240)clearInterval(timer)},250);
wrap();
window.addEventListener('load',()=>setTimeout(wrap,700),{once:true});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-view="Reports"],#bulkDownloadExcel,#previewDownloadBtn,#bulkShareExcel,#previewShareBtn'))setTimeout(wrap,80)},{capture:true,passive:true});
window.ONE_SHOT_REPORT_COORDINATES={BUILD,signedCardinal,formatPair,rewrite,wrap};
})();
