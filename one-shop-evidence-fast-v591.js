"use strict";
/* ONE SHOP v5.9.1 · Evidencias rápidas + filtros compactos + tramo desde foto */
(function(){
  if(window.ONE_SHOP_EVIDENCE_FAST_591)return;
  window.ONE_SHOP_EVIDENCE_FAST_591=true;
  const BUILD="one-shop-v5.9.1-evidence-fast-tramo-01";

  const captureTime=r=>{
    const t=Date.parse(String(r?.createdAt||""));
    if(Number.isFinite(t))return t;
    const d=String(r?.fecha||"1970-01-01"),h=String(r?.hora||"00:00:00").slice(0,8);
    const pe=Date.parse(`${d}T${h}-05:00`);
    return Number.isFinite(pe)?pe:0;
  };
  const isPending=r=>String(r?.type||"PENDIENTE").trim().toUpperCase()==="PENDIENTE";
  const validGps=g=>g&&Number.isFinite(+g.latitude)&&Number.isFinite(+g.longitude)&&Math.abs(+g.latitude)>1e-6&&Math.abs(+g.longitude)>1e-6;

  State.settings.evidenceRange=State.settings.evidenceRange||(["today","week","15d","month","year","all"].includes(State.filter)?State.filter:"today");
  State.settings.evidenceReviewFilter=State.settings.evidenceReviewFilter||"all";

  function visible(){
    const now=Date.now(),today=Dates.date(new Date(now));
    const range=State.settings.evidenceRange||"today",review=State.settings.evidenceReviewFilter||"all";
    let list=[...State.records];
    if(range==="24h")list=list.filter(r=>now-captureTime(r)<=24*3600000);
    else if(range==="48h")list=list.filter(r=>now-captureTime(r)<=48*3600000);
    else if(range==="today")list=list.filter(r=>Dates.date(new Date(captureTime(r)))===today);
    else if(range!=="all"){
      const days={week:7,"15d":15,month:31,year:366}[range]||1;
      list=list.filter(r=>now-captureTime(r)<=days*86400000);
    }
    if(review==="pending")list=list.filter(isPending);
    else if(review==="complete")list=list.filter(r=>!isPending(r));
    const q=String(State.search||"").trim().toLowerCase();
    if(q)list=list.filter(r=>JSON.stringify([r.party,r.candidate,r.district,r.type,r.observation,r.photoCode,r.verifyCode,r.address,r.tramoId]).toLowerCase().includes(q));
    return list.sort((a,b)=>captureTime(b)-captureTime(a)||String(b.photoCode||"").localeCompare(String(a.photoCode||"")));
  }
  Evidence.visible=visible;
  Evidence.captureTimeLatestFirst=captureTime;

  const css=`
#viewEvidence .filters{display:none!important}
.eQuickFilters591{display:grid;grid-template-columns:1.15fr .9fr;gap:8px;margin:8px 0 10px}
.eQuickFilter591{position:relative;display:grid;gap:4px;padding:8px 10px;border:1px solid #d9e4f1;border-radius:15px;background:#fff;box-shadow:0 5px 16px rgba(15,42,80,.05)}
.eQuickFilter591 span{font-size:8px;font-weight:950;letter-spacing:.08em;color:#6b7d92;text-transform:uppercase}
.eQuickFilter591 select{width:100%;height:38px;padding:0 30px 0 0;border:0;background:transparent;color:#123b78;font-size:12px;font-weight:900;outline:0}
#eQuickCount591{grid-column:1/-1;margin:-2px 2px 0;color:#64748b;font-size:9px;font-weight:800}
#selectionBar{left:12px!important;right:12px!important;bottom:calc(82px + env(safe-area-inset-bottom,0px))!important;min-height:66px!important;padding:9px 10px!important;grid-template-columns:minmax(0,1fr) 62px 92px 50px!important;gap:6px!important;align-items:center!important;border-radius:18px!important}
#selectionBar .selectionSummary{min-width:0!important;overflow:hidden!important}
#selectionBar .selectionSummary b{font-size:12px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#selectionBar .selectionSummary small{display:none!important}
#selectionBar #selectionAllBtn,#selectionBar #selectionActionsBtn,#selectionBar #selectionCancelBtn{position:static!important;transform:none!important;order:initial!important;width:100%!important;min-width:0!important;height:48px!important;margin:0!important;padding:0 4px!important;border-radius:12px!important}
#selectionBar #selectionAllBtn{grid-column:2!important}#selectionBar #selectionActionsBtn{grid-column:3!important}#selectionBar #selectionCancelBtn{grid-column:4!important}
#selectionBar .selectionTool span{font-size:17px!important}#selectionBar .selectionTool b{font-size:8px!important;white-space:nowrap!important}
#selectionBar #selectionActionsBtn b{white-space:normal!important;line-height:1.05!important}
.tramoEvidenceOrigin591{padding:9px 10px;margin:8px 0;border-radius:12px;background:#eaf2ff;color:#174b9a;font-size:10px;font-weight:850;line-height:1.35}
@media(max-width:390px){.eQuickFilters591{grid-template-columns:1fr 1fr}.eQuickFilter591{padding:7px 8px}.eQuickFilter591 select{font-size:11px}#selectionBar{grid-template-columns:minmax(0,1fr) 54px 80px 44px!important;left:7px!important;right:7px!important;padding:7px!important}#selectionBar .selectionSummary b{font-size:10px!important}}
`;
  const style=document.createElement("style");style.id="oneShopEvidenceFast591Css";style.textContent=css;document.head.appendChild(style);

  function injectFilters(){
    const panel=document.querySelector("#viewEvidence .evidencePanel"),search=document.getElementById("searchInput");
    if(!panel||!search||document.getElementById("eQuickFilters591"))return;
    const box=document.createElement("div");box.id="eQuickFilters591";box.className="eQuickFilters591";
    box.innerHTML=`<label class="eQuickFilter591"><span>Período</span><select id="eRange591"><option value="24h">Últimas 24 horas</option><option value="48h">Últimas 48 horas</option><option value="today">Hoy</option><option value="week">Últimos 7 días</option><option value="15d">Últimos 15 días</option><option value="month">Último mes</option><option value="year">Último año</option><option value="all">Todo</option></select></label><label class="eQuickFilter591"><span>Revisión</span><select id="eReview591"><option value="all">Todas</option><option value="pending">Solo pendientes</option><option value="complete">Clasificadas</option></select></label><div id="eQuickCount591">Última toma primero</div>`;
    search.insertAdjacentElement("beforebegin",box);
    $("eRange591").value=State.settings.evidenceRange||"today";
    $("eReview591").value=State.settings.evidenceReviewFilter||"all";
    $("eRange591").onchange=e=>{State.settings.evidenceRange=e.target.value;State.filter=e.target.value;Store.saveLite();Gallery.render();paintQuickCount();};
    $("eReview591").onchange=e=>{State.settings.evidenceReviewFilter=e.target.value;Store.saveLite();Gallery.render();paintQuickCount();};
    paintQuickCount();
  }
  function paintQuickCount(){const x=$("eQuickCount591");if(!x)return;const n=Evidence.visible().length,p=Evidence.visible().filter(isPending).length;x.textContent=`↓ Última toma primero · ${n} visibles${p?` · ${p} pendientes`:""}`;}

  // Seleccionar una foto ya no reconstruye las 100+ tarjetas ni vuelve a cargar imágenes.
  function paintCardSelection(r){
    const card=document.querySelector(`#evidenceList .eCard[data-id="${CSS.escape(String(r.id))}"]`);if(!card)return;
    card.classList.toggle("selected",!!r.selected);
    const badge=card.querySelector('.selectBadge');if(badge){badge.classList.toggle('on',!!r.selected);badge.textContent=r.selected?'✓':'○';}
  }
  Gallery.toggleSelection=function(id){
    const r=State.records.find(x=>x.id===id);if(!r)return;
    r.selected=!r.selected;paintCardSelection(r);Gallery.updateSelectionUI();
  };
  Gallery.toggleAllVisible=function(){
    if(!State.selectionMode&&typeof Gallery.enterSelection==='function')Gallery.enterSelection();
    const vis=Evidence.visible(),all=vis.length>0&&vis.every(r=>r.selected===true);
    vis.forEach(r=>{r.selected=!all;paintCardSelection(r)});Gallery.updateSelectionUI();
    UI.toast(all?"Selección visible limpiada":`✓ ${vis.length} evidencias seleccionadas`,1100,{placement:"top",tone:"soft"});
  };

  // Mantiene el contador compacto actualizado tras renders normales.
  const baseRender=Gallery.render.bind(Gallery);
  Gallery.render=function(){const out=baseRender();requestAnimationFrame(()=>{paintQuickCount();});return out;};

  async function reverseLabel(p,fallback=""){
    try{
      if(window.GPS?.reverse){const loc=await GPS.reverse({latitude:+p.latitude,longitude:+p.longitude,accuracy:+p.accuracy||20,timestamp:Date.now()});
        const street=[loc?.street,loc?.houseNumber].filter(Boolean).join(" ").trim();return street||loc?.address||fallback;}
    }catch(_){}
    return fallback||`${(+p.latitude).toFixed(6)}, ${(+p.longitude).toFixed(6)}`;
  }
  function clearOriginLayers(T){
    if(!T?.map||!Array.isArray(T._originLayers591))return;
    T._originLayers591.forEach(x=>{try{T.map.removeLayer(x)}catch(_){}});T._originLayers591=[];
  }
  function showOriginMarkers(T,r){
    if(!T?.map||!window.L)return;clearOriginLayers(T);T._originLayers591=[];
    const a=L.circleMarker([+r.gps.latitude,+r.gps.longitude],{radius:9,color:'#ffffff',weight:3,fillColor:'#2563eb',fillOpacity:1}).addTo(T.map).bindPopup(`<b>A · Foto</b><br>${esc(r.photoCode||'Evidencia')}`);T._originLayers591.push(a);
    if(validGps(State.gps)){
      const me=L.circleMarker([+State.gps.latitude,+State.gps.longitude],{radius:8,color:'#2563eb',weight:4,fillColor:'#ffffff',fillOpacity:1}).addTo(T.map).bindPopup('<b>Tú estás aquí</b>');T._originLayers591.push(me);
    }
    T.map.setView([+r.gps.latitude,+r.gps.longitude],17,{animate:false});
  }
  function ensureOriginNote(){
    const map=$("tmap");if(!map)return;let note=$("tramoOrigin591");if(!note){note=document.createElement('div');note.id='tramoOrigin591';note.className='tramoEvidenceOrigin591';map.insertAdjacentElement('beforebegin',note);}return note;
  }

  function patchTramos(){
    const T=window.PropagandaTramos;if(!T||T.__evidence591)return false;T.__evidence591=true;
    const baseAssign=T.assign.bind(T),baseSave=T.save.bind(T);
    T.assign=async function(id){
      const r=State.records.find(x=>x.id===id);if(!r)return;
      if(!validGps(r.gps))return UI.toast('Esta evidencia no tiene un GPS válido para iniciar el tramo');
      T._sourceEvidenceId591=r.id;
      if(r.tramoId&&T.get(r.tramoId)){
        await T.open(r.tramoId);showOriginMarkers(T,r);const n=ensureOriginNote();if(n)n.textContent=`📍 Foto ${r.photoCode} · ya vinculada a este tramo. Puedes ajustar la línea y guardar.`;return;
      }
      await T.open('');
      T.editId='';T.pts=[{latitude:+r.gps.latitude,longitude:+r.gps.longitude,accuracy:+r.gps.accuracy||null}];T.drawing=true;
      if($("tv"))$("tv").value=r.street||String(r.address||'').split(',')[0]||'Tramo de propaganda';
      if($("td"))$("td").value=r.district||'';
      if($("tf"))$("tf").value=r.address||'';
      if($("tt"))$("tt").value='';
      if($("tp"))$("tp").value=r.party||'';
      if($("tr"))$("tr").value=`Iniciado desde ${r.photoCode||'evidencia'}`;
      if($("tdraw"))$("tdraw").textContent='✓ Dibujando · marca B';
      T.paint();showOriginMarkers(T,r);const n=ensureOriginNote();if(n)n.textContent=`🔵 A = lugar exacto de la foto (${r.photoCode}). Toca el mapa para marcar B. El punto blanco/azul muestra dónde estás tú.`;
      UI.toast('A = foto. Toca el mapa para marcar el final B',2600,{placement:'top',tone:'soft'});
    };
    T.save=async function(){
      const sourceId=T._sourceEvidenceId591,r=State.records.find(x=>x.id===sourceId),before=new Set(T.list().map(x=>x.id));
      if(sourceId&&T.pts?.length>=2){
        try{
          if($("tf")&&!$("tf").value.trim())$("tf").value=await reverseLabel(T.pts[0],r?.address||'Punto A');
          if($("tt")&&!$("tt").value.trim())$("tt").value=await reverseLabel(T.pts[T.pts.length-1],'Punto B');
          if($("tv")&&!$("tv").value.trim())$("tv").value=r?.street||String(r?.address||'Tramo de propaganda').split(',')[0];
        }catch(_){}
      }
      const out=await baseSave();
      if(sourceId){
        const created=T.list().find(x=>!before.has(x.id));
        if(created&&r){r.tramoId=created.id;r.findingSubtype=created.subtype||'PROPAGANDA_REPETITIVA';r.supportType=created.subtype||'PROPAGANDA_REPETITIVA';r.segmentOrder=1;r.updatedAt=new Date().toISOString();try{await Store.save(r)}catch(_){}Store.saveLite();T._sourceEvidenceId591='';requestAnimationFrame(()=>Gallery.render());UI.toast(`✓ Foto vinculada al tramo · ${created.distanceM||0} m`,2200,{placement:'top',tone:'soft'});}
      }
      return out;
    };
    return true;
  }

  function boot(){injectFilters();patchTramos();try{Gallery.render();localStorage.setItem('oneshotRuntimeBuild',BUILD);}catch(_){};let n=0;const t=setInterval(()=>{if(patchTramos()||++n>30)clearInterval(t)},100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
  console.info('[ONE SHOP] v5.9.1 selección rápida + filtros + tramo desde foto');
})();
