"use strict";
/* ONE SHOP v5.9.2 · barra de selección responsive */
(function(){
  if(window.ONE_SHOP_SELECTION_BAR_592)return;
  window.ONE_SHOP_SELECTION_BAR_592=true;
  const BUILD="one-shop-v5.9.2-selection-bar-01";
  const css=`
#selectionBar{left:10px!important;right:10px!important;bottom:calc(82px + env(safe-area-inset-bottom,0px))!important;display:none!important;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr) 54px!important;grid-template-areas:"summary summary close" "all actions actions"!important;gap:8px!important;align-items:center!important;min-height:0!important;padding:10px!important;border-radius:20px!important;overflow:hidden!important}
#selectionBar.open{display:grid!important}
#selectionBar .selectionSummary{grid-area:summary!important;min-width:0!important;width:100%!important;height:42px!important;display:flex!important;align-items:center!important;gap:8px!important;overflow:hidden!important}
#selectionBar .selectionSummary>span{flex:0 0 34px!important;width:34px!important;height:34px!important;display:grid!important;place-items:center!important}
#selectionBar .selectionSummary>div{min-width:0!important;overflow:hidden!important}
#selectionBar .selectionSummary b{display:block!important;max-width:100%!important;font-size:13px!important;line-height:1.1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#selectionBar .selectionSummary small{display:none!important}
#selectionAllBtn{grid-area:all!important}
#selectionActionsBtn{grid-area:actions!important}
#selectionCancelBtn{grid-area:close!important}
#selectionBar #selectionAllBtn,#selectionBar #selectionActionsBtn,#selectionBar #selectionCancelBtn{position:static!important;transform:none!important;order:initial!important;width:100%!important;max-width:none!important;min-width:0!important;height:50px!important;margin:0!important;padding:0 8px!important;border-radius:14px!important;box-sizing:border-box!important}
#selectionBar #selectionCancelBtn{width:54px!important;padding:0!important;align-self:start!important}
#selectionBar #selectionAllBtn b,#selectionBar #selectionActionsBtn b{font-size:10px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#selectionBar #selectionActionsBtn span,#selectionBar #selectionAllBtn span{font-size:18px!important}
#selectionBar #selectionCancelBtn span{font-size:22px!important}
@media(max-width:420px){
 #selectionBar{left:7px!important;right:7px!important;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr) 48px!important;gap:7px!important;padding:8px!important}
 #selectionBar #selectionCancelBtn{width:48px!important;height:46px!important}
 #selectionBar #selectionAllBtn,#selectionBar #selectionActionsBtn{height:48px!important}
 #selectionBar .selectionSummary{height:38px!important}.selectionPulse{width:30px!important;height:30px!important}
 #selectionBar .selectionSummary b{font-size:12px!important}
}
@media(max-width:340px){
 #selectionBar{grid-template-columns:1fr 48px!important;grid-template-areas:"summary close" "all all" "actions actions"!important}
}
`;
  const s=document.createElement('style');s.id='oneShopSelectionBar592Css';s.textContent=css;document.head.appendChild(s);

  function normalize(){
    const n=Evidence.selected().length;
    const actions=document.querySelector('#selectionActionsBtn b');
    if(actions)actions.textContent='Acciones';
    const all=document.querySelector('#selectionAllBtn b');
    if(all&&all.textContent!=='Limpiar')all.textContent='Todo';
    const count=document.getElementById('selectionCount');
    if(count)count.textContent=n?`${n} seleccionada${n===1?'':'s'}`:'Selecciona evidencias';
  }
  try{
    const base=Gallery.updateSelectionUI.bind(Gallery);
    Gallery.updateSelectionUI=function(){const out=base();normalize();return out;};
    normalize();
    localStorage.setItem('oneshotRuntimeBuild',BUILD);
  }catch(e){console.warn('[ONE SHOP] selection bar 5.9.2',e)}
  console.info('[ONE SHOP] v5.9.2 barra de selección responsive');
})();