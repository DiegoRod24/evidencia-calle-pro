"use strict";
/* ONE SHOP v5.9.0 · Evidencias: última toma primero */
(function(){
  if(window.ONE_SHOP_EVIDENCE_ORDER_590)return;
  window.ONE_SHOP_EVIDENCE_ORDER_590=true;
  const BUILD="one-shop-v5.9.0-evidence-latest-first-01";

  const captureTime=r=>{
    const direct=Date.parse(String(r?.createdAt||""));
    if(Number.isFinite(direct))return direct;
    const date=String(r?.fecha||"1970-01-01");
    const time=String(r?.hora||"00:00:00").slice(0,8);
    const pe=Date.parse(`${date}T${time}-05:00`);
    return Number.isFinite(pe)?pe:0;
  };

  // Mantiene los filtros existentes (Hoy, Semana, 15 días, Mes, Año, Todo),
  // pero la pantalla Evidencias SIEMPRE recibe los resultados desde la captura
  // más reciente hacia la más antigua. El Excel conserva su propia regla
  // cronológica antiguo -> nuevo mediante Evidence.selectedForReport().
  try{
    const baseVisible=Evidence.visible.bind(Evidence);
    Evidence.visible=function(){
      return [...baseVisible()].sort((a,b)=>
        captureTime(b)-captureTime(a) || String(b?.photoCode||"").localeCompare(String(a?.photoCode||""))
      );
    };
    Evidence.captureTimeLatestFirst=captureTime;
  }catch(e){console.warn("ONE SHOP evidence order",e);}

  // Indicador discreto para que el operador sepa qué orden está viendo.
  function paintOrderHint(){
    const count=document.getElementById("evidenceCount");
    if(!count||document.getElementById("evidenceOrderHint590"))return;
    const hint=document.createElement("span");
    hint.id="evidenceOrderHint590";
    hint.textContent="↓ Última toma primero";
    hint.style.cssText="display:inline-flex;margin-top:6px;padding:5px 8px;border-radius:999px;background:#eef5ff;color:#2057a6;font-size:10px;font-weight:900;line-height:1";
    count.insertAdjacentElement("afterend",hint);
  }

  const style=document.createElement("style");
  style.textContent=`#viewEvidence .sectionHead>div:first-child{min-width:0}#evidenceOrderHint590{white-space:nowrap}`;
  document.head.appendChild(style);

  // Re-render inmediato para que no haga falta cambiar de filtro para ver el orden correcto.
  try{paintOrderHint();Gallery.render();}catch(_){}
  const mo=new MutationObserver(()=>paintOrderHint());
  const head=document.querySelector("#viewEvidence .evidenceHead")||document.querySelector("#viewEvidence .sectionHead");
  if(head)mo.observe(head,{childList:true,subtree:true});

  try{localStorage.setItem("oneshotRuntimeBuild",BUILD);}catch(_){}
  console.info("[ONE SHOP] v5.9.0 Evidencias · última toma primero");
})();