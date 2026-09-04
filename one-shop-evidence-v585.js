"use strict";
/* ONE SHOP v5.8.5 · selector de vistas estable + tarjetas consistentes */
(function(){
  if(window.ONE_SHOP_EVIDENCE_585)return;
  window.ONE_SHOP_EVIDENCE_585=true;
  const BUILD='one-shop-v5.8.5-evidence-switch-01';

  const css=`
/* El selector siempre queda por encima de las tarjetas y recibe el toque completo. */
#viewEvidence .evidenceHead{position:relative!important;z-index:20!important;isolation:isolate!important}
#viewEvidence .headActions{position:relative!important;z-index:25!important;pointer-events:auto!important}
#galleryViewSwitch{position:relative!important;z-index:40!important;pointer-events:auto!important;touch-action:manipulation!important;overflow:visible!important}
#galleryViewSwitch button{position:relative!important;z-index:41!important;pointer-events:auto!important;touch-action:manipulation!important;user-select:none!important;-webkit-user-select:none!important}
#galleryViewSwitch button:active{transform:scale(.96)!important}
#selectVisibleBtn{position:relative!important;z-index:30!important;pointer-events:auto!important;touch-action:manipulation!important}

/* Filtros completos: nada queda cortado en el borde derecho. */
#viewEvidence .filters{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:7px!important;overflow:visible!important;width:100%!important;padding:0!important}
#viewEvidence .filters button{min-width:0!important;width:100%!important;padding:10px 4px!important;text-align:center!important;white-space:nowrap!important;font-size:12px!important}

/* Tarjetas: las acciones conservan texto e icono en TODAS las vistas. */
#evidenceList .eActions{position:relative!important;z-index:6!important}
#evidenceList .eActions button{font-size:10px!important;line-height:1.05!important;min-height:38px!important;overflow:visible!important;color:#173a6b!important;opacity:1!important;visibility:visible!important;text-indent:0!important}
#evidenceList.gridView .eActions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
#evidenceList.gridView .eActions button{font-size:9px!important;height:38px!important;padding:0 4px!important;white-space:nowrap!important}
#evidenceList.gridView .eActions button::first-letter{font-size:inherit!important}
#evidenceList.gridView .eActions button[data-act="delete"]{grid-column:1/-1!important}
#evidenceList.gridView .eBody{min-width:0!important}
#evidenceList.gridView .eTitle b{font-size:14px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}

/* Vista grande: evita que una foto vertical convierta la tarjeta en una pantalla interminable. */
#evidenceList.cardsView .eMedia{height:min(56vh,520px)!important;aspect-ratio:auto!important}
#evidenceList.cardsView .eMedia img{object-fit:contain!important}
#evidenceList.cardsView .eActions{grid-template-columns:repeat(3,minmax(0,1fr))!important}
#evidenceList.cardsView .eActions button[data-act="delete"]{grid-column:auto!important}

/* Vista horizontal/lista: foto suficientemente grande y acciones siempre visibles. */
#evidenceList.listView .eActions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
#evidenceList.listView .eActions button[data-act="delete"]{grid-column:1/-1!important}
#evidenceList.listView .eMedia{position:relative!important;z-index:1!important}
#evidenceList.listView .eBody{position:relative!important;z-index:2!important}

/* Ninguna tarjeta puede formar una capa invisible por encima del encabezado. */
#evidenceList{position:relative!important;z-index:1!important;isolation:isolate!important}
#evidenceList .eCard{z-index:1!important}

@media(max-width:560px){
 #viewEvidence .filters{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}
 #viewEvidence .filters button{font-size:12px!important;padding:10px 3px!important}
 #evidenceList.cardsView .eMedia{height:min(52vh,460px)!important}
 #evidenceList.gridView{grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important}
 #evidenceList.gridView .eCard{align-self:start!important}
}
@media(max-width:360px){
 #galleryViewSwitch{grid-template-columns:repeat(3,46px)!important}
 #galleryViewSwitch button{width:46px!important;height:46px!important}
 #evidenceList.gridView{grid-template-columns:1fr!important}
}
`;
  const old=document.getElementById('oneShopEvidence585Css');if(old)old.remove();
  const style=document.createElement('style');style.id='oneShopEvidence585Css';style.textContent=css;document.head.appendChild(style);

  function setGalleryView(view){
    if(!['cards','grid','list'].includes(view))return;
    State.settings.galleryView=view;
    State.galleryView=view;
    try{Store.saveLite();}catch(_){}
    const host=document.getElementById('evidenceList');
    if(host){
      host.classList.remove('compact','cardsView','gridView','listView','viewChanging');
      host.classList.add(view+'View');
    }
    document.querySelectorAll('#galleryViewSwitch [data-gallery-view]').forEach(btn=>{
      const on=btn.dataset.galleryView===view;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-selected',String(on));
    });
    /* Un único render, fuera del evento táctil inmediato. */
    requestAnimationFrame(()=>{
      try{Gallery.render();}catch(err){console.warn('ONE SHOP gallery render',err);}
    });
  }

  Gallery.setView=setGalleryView;

  /*
   * Captura el toque antes que listeners antiguos. Así el selector no depende de
   * handlers duplicados ni de un render anterior y siempre puede cambiar 1→2→3→1.
   */
  const switcher=document.getElementById('galleryViewSwitch');
  if(switcher&&!switcher.dataset.stable585){
    switcher.dataset.stable585='1';
    const choose=e=>{
      const btn=e.target.closest('[data-gallery-view]');
      if(!btn||!switcher.contains(btn))return;
      e.preventDefault();
      e.stopPropagation();
      if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
      setGalleryView(btn.dataset.galleryView);
    };
    switcher.addEventListener('click',choose,true);
    switcher.addEventListener('pointerup',e=>{
      if(e.pointerType==='touch'||e.pointerType==='pen')choose(e);
    },true);
  }

  /* Evita doble disparo touch→click durante unos milisegundos. */
  let lastPointer=0;
  if(switcher){
    switcher.addEventListener('pointerup',()=>{lastPointer=performance.now();},true);
    switcher.addEventListener('click',e=>{
      if(performance.now()-lastPointer<260){e.preventDefault();e.stopImmediatePropagation();}
    },false);
  }

  try{
    const current=State.settings.galleryView||State.galleryView||'cards';
    setGalleryView(current);
    localStorage.setItem('oneshotRuntimeBuild',BUILD);
  }catch(_){}
  console.info('[ONE SHOP] v5.8.5 selector de Evidencias estable');
})();
