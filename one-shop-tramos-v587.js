"use strict";
/* ONE SHOP v5.9.4 · compatibilidad de tramos + acceso desde Evidencias */
(()=>{
if(window.ONE_SHOP_TRAMOS_587)return;
window.ONE_SHOP_TRAMOS_587=true;
const BUILD="one-shop-v5.9.4-tramos-compat-01",BLOCK=/^(PANEL|BANNER|PINTA|LOCAL PARTIDARIO)$/i;
State.settings.propagandaSegments=Array.isArray(State.settings.propagandaSegments)?State.settings.propagandaSegments:[];
const style=document.createElement("style");
style.textContent='.tramoTagEvidence{display:inline-block;padding:4px 7px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:9px;font-weight:900;margin:4px 0}.eActions button[data-act="tramo"]{background:#ecfdf5!important;color:#047857!important}';
document.head.appendChild(style);
const T={watching:false,
 list(){return State.settings.propagandaSegments||[]},
 get(id){return T.list().find(x=>x.id===id)},
 recs(id){return (State.records||[]).filter(r=>r.tramoId===id)},
 inject(){window.ONE_SHOP_STABLE_RUNTIME?.fieldTools?.().then(api=>api?.injectTramo?.()).catch(()=>{})},
 render(){window.ONE_SHOP_FIELD_TOOLS?.paintTramoHistory?.()},
 assign(id){const r=(State.records||[]).find(x=>x.id===id);if(!r)return;if(BLOCK.test(r.type||""))return UI.toast(`${r.type} se mantiene como evidencia individual`);if(window.ONE_SHOP_FIELD_TOOLS?.startFromEvidence)return window.ONE_SHOP_FIELD_TOOLS.startFromEvidence(id);window.ONE_SHOP_STABLE_RUNTIME?.fieldTools?.().then(api=>api?.startFromEvidence?.(id)).catch(()=>UI.toast("No se pudo abrir Lugares"))},
 watch(){const host=document.getElementById("evidenceList");if(!host)return;if(!T.watching){T.watching=true;new MutationObserver(()=>T.decorate()).observe(host,{childList:true,subtree:true});document.addEventListener("click",e=>{const button=e.target.closest('[data-act="tramo"]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();T.assign(button.closest(".eCard")?.dataset.id)},true)}T.decorate()},
 decorate(){document.querySelectorAll("#evidenceList .eCard").forEach(card=>{const r=(State.records||[]).find(x=>x.id===card.dataset.id),actions=card.querySelector(".eActions");if(actions&&!actions.querySelector('[data-act="tramo"]')&&!State.selectionMode){const button=document.createElement("button");button.dataset.act="tramo";button.textContent="🛣 Crear tramo";actions.appendChild(button)}const body=card.querySelector(".eBody");let tag=body?.querySelector(".tramoTagEvidence");if(r?.tramoId){const segment=T.get(r.tramoId);if(!tag&&body){tag=document.createElement("div");tag.className="tramoTagEvidence";body.insertBefore(tag,body.querySelector(".eMeta"))}tag.textContent=`🛣 ${segment?.via||"Tramo"} · #${r.segmentOrder||"-"}`}else tag?.remove()})}
};
window.PropagandaTramos=T;
setTimeout(()=>{try{T.inject();T.watch();localStorage.setItem("oneshotRuntimeBuild",BUILD)}catch(e){console.warn("Tramos",e)}},100);
})();
