"use strict";
/* ONE SHOP v5.8.4 · Evidencias UX + acciones recuperadas */
(function(){
  if(window.ONE_SHOP_EVIDENCE_584)return;
  window.ONE_SHOP_EVIDENCE_584=true;
  const BUILD='one-shop-v5.8.4-evidence-ux-01';
  const css=`
#viewEvidence .evidencePanel{padding:18px 14px 116px!important}
#viewEvidence .evidenceHead{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;margin-bottom:14px!important}
#viewEvidence .evidenceHead h2{margin:0!important;font-size:clamp(28px,7vw,38px)!important;line-height:1!important}
#viewEvidence .evidenceHead p{margin:5px 0 0!important;font-size:14px!important;color:#64748b!important;font-weight:800!important}
#viewEvidence .headActions{display:grid!important;grid-template-columns:auto!important;gap:10px!important;justify-items:end!important}
#galleryViewSwitch{display:grid!important;grid-template-columns:repeat(3,54px)!important;gap:4px!important;padding:4px!important;border-radius:18px!important;background:#edf3fb!important;box-shadow:inset 0 0 0 1px #d7e0ee!important}
#galleryViewSwitch button{width:54px!important;height:52px!important;border-radius:14px!important;padding:0!important;background:transparent!important;color:#32506f!important;box-shadow:none!important}
#galleryViewSwitch button.active{background:#fff!important;color:#2563eb!important;box-shadow:0 6px 16px rgba(37,99,235,.14)!important;transform:none!important}
#selectVisibleBtn{min-width:154px!important;height:48px!important;padding:0 18px!important;border-radius:16px!important;font-size:14px!important}
#viewEvidence .filters{display:flex!important;gap:8px!important;overflow-x:auto!important;padding:0 0 4px!important;scrollbar-width:none!important}
#viewEvidence .filters::-webkit-scrollbar{display:none!important}
#viewEvidence .filters button{flex:0 0 auto!important;min-width:auto!important;padding:10px 16px!important;border-radius:999px!important}
#viewEvidence .search{margin:8px 0 16px!important;height:58px!important;border-radius:18px!important}
#evidenceList{gap:14px!important}
#evidenceList .eCard{position:relative!important;overflow:hidden!important;border:1px solid #d9e3f0!important;border-radius:22px!important;background:#fff!important;box-shadow:0 10px 28px rgba(15,23,42,.07)!important}
#evidenceList .eCard.selected{border-color:#2563eb!important;box-shadow:0 0 0 2px rgba(37,99,235,.18),0 12px 30px rgba(37,99,235,.12)!important}
#evidenceList .eMedia{background:#071326!important;overflow:hidden!important;border:0!important}
#evidenceList .eMedia img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:#071326!important;display:block!important}
#evidenceList .eBody{padding:14px!important;min-width:0!important}
#evidenceList .eTitle{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:8px!important;margin-bottom:7px!important}
#evidenceList .eTitle b{font-size:16px!important;color:#123b78!important;line-height:1.15!important}
#evidenceList .eTitle code{font-size:10px!important;color:#64748b!important;white-space:nowrap!important}
#evidenceList .placeTag{display:inline-flex!important;max-width:100%!important;margin:0 0 8px!important;padding:5px 8px!important;border-radius:999px!important;background:#eff6ff!important;color:#1e40af!important;font-size:10px!important;font-weight:850!important}
#evidenceList .localTag{background:#f5f3ff!important;color:#6d28d9!important}
#evidenceList .eMeta{display:grid!important;gap:5px!important;min-width:0!important}
#evidenceList .eMeta span{display:block!important;font-size:12px!important;color:#64748b!important;line-height:1.25!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#evidenceList .eActions{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:7px!important;margin-top:12px!important}
#evidenceList .eActions button{min-width:0!important;height:39px!important;padding:0 5px!important;border-radius:11px!important;background:#eef4fb!important;color:#173a6b!important;font-size:10px!important;font-weight:900!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;white-space:nowrap!important}
#evidenceList .eActions button[data-act="edit"]{background:#eaf2ff!important;color:#1456c0!important}
#evidenceList .eActions button[data-act="local"]{background:#f1edff!important;color:#6d28d9!important}
#evidenceList .eActions button[data-act="delete"]{background:#fff0f0!important;color:#c62828!important}
#evidenceList .selectBadge{position:absolute!important;z-index:8!important;top:10px!important;left:10px!important;width:40px!important;height:40px!important;border-radius:50%!important;background:#fff!important;color:#1648bd!important;border:2px solid #dbe7f5!important;box-shadow:0 6px 18px rgba(0,0,0,.16)!important;font-size:20px!important;display:grid!important;place-items:center!important}
#evidenceList .selectBadge.on{background:#1d5dff!important;color:#fff!important;border-color:#1d5dff!important}
#evidenceList.cardsView{display:grid!important;grid-template-columns:1fr!important}
#evidenceList.cardsView .eMedia{width:100%!important;aspect-ratio:4/3!important;border-radius:0!important}
#evidenceList.gridView{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
#evidenceList.gridView .eCard{border-radius:18px!important}
#evidenceList.gridView .eMedia{aspect-ratio:4/3!important}
#evidenceList.gridView .eBody{padding:10px!important}
#evidenceList.gridView .eTitle code,#evidenceList.gridView .placeTag,#evidenceList.gridView .eMeta span:nth-child(n+2){display:none!important}
#evidenceList.gridView .eMeta span{font-size:10px!important}
#evidenceList.gridView .eActions{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;margin-top:8px!important}
#evidenceList.gridView .eActions button{height:34px!important;font-size:0!important}
#evidenceList.gridView .eActions button::first-letter{font-size:15px!important}
#evidenceList.listView{display:grid!important;grid-template-columns:1fr!important;gap:12px!important}
#evidenceList.listView .eCard{display:grid!important;grid-template-columns:142px minmax(0,1fr)!important;min-height:174px!important}
#evidenceList.listView .eMedia{height:100%!important;min-height:174px!important;aspect-ratio:auto!important}
#evidenceList.listView .eBody{padding:12px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
#evidenceList.listView .eActions{grid-template-columns:repeat(3,minmax(0,1fr))!important;margin-top:9px!important}
#selectionBar{position:fixed!important;left:10px!important;right:10px!important;bottom:calc(82px + env(safe-area-inset-bottom,0px))!important;z-index:90!important;min-height:72px!important;padding:10px!important;border-radius:20px!important;background:#082450!important;box-shadow:0 16px 36px rgba(2,12,30,.28)!important;display:none!important;grid-template-columns:minmax(0,1fr) auto auto auto!important;gap:8px!important;align-items:center!important}
#selectionBar.open{display:grid!important}
#selectionBar .selectionSummary{min-width:0!important;display:flex!important;align-items:center!important;gap:8px!important;color:#fff!important}
#selectionBar .selectionSummary b{display:block!important;font-size:13px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#selectionBar .selectionSummary small{display:block!important;font-size:9px!important;opacity:.72!important}
#selectionBar .selectionTool{position:static!important;transform:none!important;margin:0!important;width:58px!important;height:52px!important;min-width:58px!important;border-radius:14px!important;padding:0!important;display:grid!important;place-items:center!important;background:#fff!important;color:#123b78!important;box-shadow:none!important}
#selectionBar .selectionTool.primary{width:82px!important;background:#1d5dff!important;color:#fff!important}
#selectionBar .selectionTool span{font-size:18px!important;line-height:1!important}
#selectionBar .selectionTool b{font-size:9px!important;line-height:1!important}
#selectionBar .selectionTool.close{order:5!important;width:52px!important}
#selectionAllBtn{display:grid!important}
#selectionNoneBtn{display:none!important}
@media(max-width:560px){
 #viewEvidence .evidencePanel{padding:16px 12px 120px!important}
 #viewEvidence .evidenceHead{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important}
 #viewEvidence .headActions{gap:8px!important}
 #galleryViewSwitch{grid-template-columns:repeat(3,48px)!important}#galleryViewSwitch button{width:48px!important;height:48px!important}
 #selectVisibleBtn{min-width:146px!important;height:44px!important}
 #evidenceList.listView .eCard{grid-template-columns:126px minmax(0,1fr)!important;min-height:166px!important}
 #evidenceList.listView .eMedia{min-height:166px!important}
 #evidenceList.listView .eActions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 #selectionBar{grid-template-columns:minmax(0,1fr) 56px 78px 52px!important}
 #selectionBar .selectionSummary small{display:none!important}
}
@media(max-width:390px){
 #viewEvidence .evidenceHead{grid-template-columns:1fr!important}.headActions{justify-items:stretch!important}.headActions #galleryViewSwitch{justify-self:end!important}.headActions #selectVisibleBtn{width:100%!important}
 #evidenceList.gridView{grid-template-columns:1fr!important}
 #evidenceList.listView .eCard{grid-template-columns:112px minmax(0,1fr)!important}
 #selectionBar .selectionSummary{display:none!important}#selectionBar{grid-template-columns:1fr 1.2fr .9fr!important}#selectionAllBtn,#selectionActionsBtn,#selectionCancelBtn{width:100%!important}
}
`;
  const s=document.createElement('style');s.id='oneShopEvidence584Css';s.textContent=css;document.head.appendChild(s);

  const localOf=r=>r?.placeId?Places.get(r.placeId):null;
  Gallery.markLocalFromEvidence=async function(r){
    if(!r)return;
    let p=localOf(r);
    if(!p){
      if(!r.gps)return UI.toast('Esta evidencia necesita GPS para crear un local partidario');
      p=Places.createFromRecord(r,{name:r.party?`Local partidario · ${r.party}`:'Local partidario',type:'Local partidario'});
      if(!p)return;
    }
    const party=r.party||p.party||'';
    const current=p.type==='Local partidario'?(p.name||'Local partidario'):(party?`Local partidario · ${party}`:'Local partidario');
    const name=prompt('Nombre del local partidario',current);
    if(name===null)return;
    p.type='Local partidario';p.name=name.trim()||'Local partidario';p.party=party;
    r.placeId=p.id;r.type=r.type==='PENDIENTE'?'LOCAL PARTIDARIO':r.type;r.updatedAt=new Date().toISOString();
    await Store.save(r);Store.saveLite();Places.render();Gallery.render();
    UI.toast('🏢 Marcado como local partidario');
  };

  Gallery.render=function(){
    const list=Evidence.visible(),selected=Evidence.selected();
    const total=State.records.length,vis=list.length;
    const suffix=State.selectionMode&&selected.length?` · ${selected.length} seleccionada${selected.length===1?'':'s'}`:'';
    $('evidenceCount').textContent=`${total} registrada${total===1?'':'s'} · ${vis} visible${vis===1?'':'s'}${suffix}`;
    const view=State.settings.galleryView||State.galleryView||'cards';State.galleryView=view;
    $('evidenceList').classList.remove('compact','cardsView','gridView','listView');$('evidenceList').classList.add(view+'View');
    $$('[data-gallery-view]').forEach(b=>{const on=b.dataset.galleryView===view;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
    $('evidenceList').innerHTML=list.map(r=>{const p=localOf(r),isLocal=p?.type==='Local partidario'||r.type==='LOCAL PARTIDARIO';return `
      <article class="eCard ${r.selected?'selected':''}" data-id="${esc(r.id)}">
        ${State.selectionMode?`<button class="selectBadge ${r.selected?'on':''}" data-act="select" aria-label="Seleccionar">${r.selected?'✓':'○'}</button>`:''}
        <button class="eMedia" data-act="${State.selectionMode?'select':'view'}" aria-label="${State.selectionMode?'Seleccionar':'Ver evidencia'}"><img src="${r.stampedImage||r.image}" loading="lazy" alt="${esc(r.photoCode)}"></button>
        <div class="eBody">
          <div class="eTitle"><b>${esc(r.type||'PENDIENTE')}</b><code>${esc(r.photoCode)}</code></div>
          ${r.placeId?`<div class="placeTag ${isLocal?'localTag':''}">${isLocal?'🏢':'📍'} ${esc(p?.code||'Punto')} · ${esc(isLocal?'Local partidario':(r.placeRelation||'Registro'))}</div>`:''}
          <div class="eMeta"><span>🕒 ${esc(r.fecha)} ${esc(r.hora)} · ${r.gps?`GPS ±${Math.round(r.gps.accuracy)}m`:'GPS pendiente'}</span><span>📍 ${esc(r.address||'Ubicación pendiente')}</span><span>🏷 ${esc(r.party||'Partido pendiente')} · ${esc(r.candidate||'Candidato pendiente')}</span><span>🔐 ${esc(r.verifyCode||'PENDIENTE')}</span></div>
          ${State.selectionMode?'':`<div class="eActions"><button data-act="view">👁 Ver</button><button data-act="edit">✎ Editar</button><button data-act="map">📍 Mapa</button><button data-act="local">🏢 ${isLocal?'Local':'Local'}</button><button data-act="delete">⌫ Borrar</button></div>`}
        </div>
      </article>`}).join('')||'<div class="hint">No hay evidencias en este filtro.</div>';
    Gallery.updateSelectionUI();Reports.renderSummary();
  };

  const list=$('evidenceList');
  if(list&&!list.dataset.local584){
    list.dataset.local584='1';
    list.addEventListener('click',e=>{
      const b=e.target.closest('[data-act="local"]');if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();
      const card=b.closest('.eCard'),r=State.records.find(x=>x.id===card?.dataset.id);Gallery.markLocalFromEvidence(r);
    },true);
  }
  try{Gallery.render();localStorage.setItem('oneshotRuntimeBuild',BUILD);}catch(_){}
  console.info('[ONE SHOP] v5.8.4 Evidencias UX activa');
})();