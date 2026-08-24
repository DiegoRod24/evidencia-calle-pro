/* ONE SHOP · SAFE HANDOFF TO ONE SHOT 2 */
(()=>{
'use strict';
if(window.ONE_SHOP_TO_ONE_SHOT2)return;
const BUILD='one-shop-v5.6.4-migrate-to-one-shot2-01';
const NEW_APP='https://one-shot-2.pages.dev/';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let running=false,lastResult=null;
function bridge(){return window.OneShotLegacyCloud||null}
function toast(m,ms=3000){try{UI?.toast?.(m,ms,{placement:'top',tone:'soft'})}catch(_){}}
function css(){if($('oneShopUpgradeCss'))return;const s=document.createElement('style');s.id='oneShopUpgradeCss';s.textContent=`
#oneShopUpgradeBanner{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:2147482500;display:flex;align-items:center;gap:10px;background:#071b37;color:#fff;border:1px solid #315781;border-radius:17px;padding:10px 12px;box-shadow:0 16px 45px rgba(0,0,0,.38)}#oneShopUpgradeBanner div{flex:1;display:grid;gap:2px}#oneShopUpgradeBanner b{font-size:13px}#oneShopUpgradeBanner small{color:#bed0e7;font-size:10px;line-height:1.3}#oneShopUpgradeBanner button{border:0;border-radius:12px;background:#2f6bff;color:#fff;padding:10px 12px;font-weight:900;white-space:nowrap}
#oneShopUpgradeModal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:flex-end;justify-content:center;background:rgba(2,8,23,.78);padding:10px}#oneShopUpgradeModal.open{display:flex}.oneShopUpgradeCard{width:min(680px,100%);max-height:92dvh;overflow:auto;background:#f8fbff;color:#10233e;border-radius:24px;padding:17px;display:grid;gap:12px}.oneShopUpgradeHead{display:flex;justify-content:space-between;gap:10px}.oneShopUpgradeHead h3{margin:0}.oneShopUpgradeHead p{margin:4px 0 0;color:#5f728b}.oneShopUpgradeHead button{width:40px;height:40px;border:0;border-radius:50%;font-size:21px}.oneShopUpgradeSteps{display:grid;gap:8px}.oneShopUpgradeSteps div{padding:10px 12px;border-radius:14px;background:#eef4fb}.oneShopUpgradeProgress{padding:11px;border-radius:14px;background:#071b37;color:#fff;font-size:12px;line-height:1.4;min-height:42px}.oneShopUpgradeActions{display:grid;grid-template-columns:1.4fr 1fr;gap:8px}.oneShopUpgradeActions button{min-height:48px;border-radius:14px;border:1px solid #cbd8e7;background:#fff;color:#164172;font-weight:900}.oneShopUpgradeActions .primary{background:#2563eb;color:#fff;border:0}.oneShopUpgradeActions button:disabled{opacity:.45}@media(max-width:520px){#oneShopUpgradeBanner small{display:none}.oneShopUpgradeActions{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
function build(){
  if($('oneShopUpgradeModal'))return;
  const banner=document.createElement('div');banner.id='oneShopUpgradeBanner';banner.innerHTML='<div><b>ONE SHOT 2 ya está listo para campo</b><small>Antes de cambiar, respalda las evidencias de este equipo.</small></div><button id="oneShopUpgradeOpen">Cambiar app</button>';document.body.appendChild(banner);
  const modal=document.createElement('div');modal.id='oneShopUpgradeModal';modal.innerHTML=`<div class="oneShopUpgradeCard"><div class="oneShopUpgradeHead"><div><h3>↗ Pasar de ONE SHOP a ONE SHOT 2</h3><p>El cambio es seguro: primero sincronizamos lo recuperable y no borramos nada de este teléfono.</p></div><button id="oneShopUpgradeClose">×</button></div><div class="oneShopUpgradeSteps"><div><b>1 · Revisar</b><br><small>Detectamos originales/copias válidas del almacenamiento antiguo.</small></div><div><b>2 · Respaldar</b><br><small>Enviamos las evidencias recuperables al backend central/Dropbox.</small></div><div><b>3 · Cambiar</b><br><small>Abrimos ONE SHOT 2. La clave de sincronización se configura una sola vez en el nuevo dominio.</small></div></div><div id="oneShopUpgradeProgress" class="oneShopUpgradeProgress">Listo para revisar este dispositivo.</div><div class="oneShopUpgradeActions"><button id="oneShopUpgradeSync" class="primary">☁ Respaldar y preparar cambio</button><button id="oneShopUpgradeGo" disabled>↗ Abrir ONE SHOT 2</button></div><small>Importante: ONE SHOP y ONE SHOT 2 usan dominios distintos, por eso no pueden compartir directamente IndexedDB. Esta migración usa el respaldo central como puente. La app antigua queda intacta.</small></div>`;document.body.appendChild(modal);
  $('oneShopUpgradeOpen').onclick=open;$('oneShopUpgradeClose').onclick=close;$('oneShopUpgradeSync').onclick=run;$('oneShopUpgradeGo').onclick=go;modal.addEventListener('click',e=>{if(e.target===modal)close()});
}
function open(){build();$('oneShopUpgradeModal').classList.add('open');const total=window.State?.records?.length||0;$('oneShopUpgradeProgress').textContent=`Este dispositivo tiene ${total} evidencias locales. ${lastResult?`Último respaldo: ${lastResult.ok} OK · ${lastResult.err} error.`:'Aún no se ejecutó la preparación.'}`}
function close(){$('oneShopUpgradeModal')?.classList.remove('open')}
function progress(t){const p=$('oneShopUpgradeProgress');if(p)p.textContent=t}
async function run(){
  if(running)return;const B=bridge();if(!B)return progress('El módulo de rescate todavía está cargando. Vuelve a tocar en un momento.');B.load?.();
  if(!B.key){progress('Falta la clave de sincronización. Se abrirá el panel de respaldo para guardarla.');B.open?.('Guarda la clave de sincronización y vuelve a “Cambiar app”.');return}
  running=true;const btn=$('oneShopUpgradeSync'),goBtn=$('oneShopUpgradeGo');if(btn){btn.disabled=true;btn.textContent='Preparando…'}if(goBtn)goBtn.disabled=true;
  try{
    if(!Array.isArray(B.diagnostics)||!B.diagnostics.length){progress('Analizando fotos antiguas y buscando originales recuperables…');await B.analyzeAll()}
    const safe=(B.diagnostics||[]).filter(d=>d.status!=='BROKEN'),broken=(B.diagnostics||[]).filter(d=>d.status==='BROKEN').length;let ok=0,err=0;
    for(let i=0;i<safe.length;i++){progress(`Respaldando ${i+1}/${safe.length} · OK ${ok} · error ${err}${broken?` · ${broken} no recuperables`:''}`);try{if(await B.syncDiagnostic(safe[i],true))ok++;else err++}catch(e){err++;safe[i].record.cloudSyncError=e.message||String(e)}}
    lastResult={ok,err,broken,total:safe.length+broken};
    if(err===0){progress(`✓ Preparación lista · ${ok} respaldadas${broken?` · ${broken} evidencias no recuperables permanecen solo en ONE SHOP`:''}. Ya puedes abrir ONE SHOT 2.`);if(goBtn)goBtn.disabled=false;toast('✓ Dispositivo listo para pasar a ONE SHOT 2',3200)}
    else{progress(`⚠ No cambies todavía · ${ok} respaldadas · ${err} con error. Reintenta el respaldo. Nada fue borrado.`);toast(`${err} evidencias aún no pudieron respaldarse`,3600)}
  }catch(err){progress(`⚠ Preparación detenida · ${err.message||err}. Nada fue borrado.`)}finally{running=false;if(btn){btn.disabled=false;btn.textContent='☁ Respaldar y preparar cambio'}}
}
function go(){if(!lastResult||lastResult.err>0)return progress('Primero termina el respaldo sin errores.');const q=new URLSearchParams({from:'one-shop',legacySynced:String(lastResult.ok),legacyBroken:String(lastResult.broken||0)});location.href=`${NEW_APP}?${q.toString()}`}
function init(){css();build()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.ONE_SHOP_TO_ONE_SHOT2={BUILD,open,run,go};
})();
