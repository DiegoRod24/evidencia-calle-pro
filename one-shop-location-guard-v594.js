"use strict";
/* ONE SHOT v5.9.14 · asistente GPS para iPhone y Android */
(()=>{
  if(window.ONE_SHOP_LOCATION_GUARD_594)return;
  window.ONE_SHOP_LOCATION_GUARD_594=true;
  const $=id=>document.getElementById(id),freshMs=30000;
  let lastError=null,busy=false;
  const valid=g=>typeof GPS?.valid==="function"?GPS.valid(g):!!(g&&Number.isFinite(+g.latitude)&&Number.isFinite(+g.longitude));
  const fresh=g=>valid(g)&&Date.now()-Number(g.receivedAt||g.timestamp||0)<freshMs;
  function reason(err){if(err?.code===1)return"permission";if(err?.code===3)return"timeout";if(err?.code===2)return"unavailable";return"unknown"}
  function copy(){
    const r=reason(lastError),env=PermissionAssistant.env();
    if(r==="permission")return["Ubicación bloqueada",env.ios?"Toca Activar. Si no aparece el aviso, habilita Localización para ONE SHOT/Safari en Ajustes.":"Toca Activar. Si fue bloqueada, permite Ubicación para ONE SHOT o para este sitio."];
    if(r==="timeout")return["GPS sin responder","Enciende Ubicación, activa Ubicación precisa y vuelve a tocar Activar."];
    if(r==="unavailable")return["Sin señal de ubicación","Enciende el GPS y prueba cerca de una ventana o en una zona abierta."];
    return["Ubicación necesaria","Actívala antes de tomar la foto para guardar coordenadas y dirección."];
  }
  function inject(){
    if($("gpsGuard594"))return;
    const style=document.createElement("style");style.id="gpsGuard594Css";style.textContent=`
      .gpsGuard594{position:absolute;z-index:24;left:12px;right:12px;top:calc(122px + var(--safeTop));display:flex;align-items:center;gap:10px;padding:10px 11px;border:1px solid rgba(255,196,72,.62);border-radius:16px;background:rgba(7,20,46,.92);color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.28);backdrop-filter:blur(12px)}
      .gpsGuard594.isHidden{display:none!important}.gpsGuard594>div{min-width:0;flex:1}.gpsGuard594 b{display:block;font-size:12px}.gpsGuard594 small{display:block;margin-top:2px;font-size:9px;line-height:1.25;color:#d8e3f5}.gpsGuard594 button{flex:0 0 auto;min-height:40px;padding:8px 11px;border-radius:12px;background:#fff;color:#0a2e73;font-size:10px;font-weight:950}.gpsGuard594.waiting button{opacity:.65}.gpsGuard594.ready{border-color:#35d07f;background:rgba(5,91,61,.92)}
      @media(max-width:380px){.gpsGuard594{align-items:stretch;flex-direction:column}.gpsGuard594 button{width:100%}}
    `;document.head.appendChild(style);
    const box=document.createElement("div");box.id="gpsGuard594";box.className="gpsGuard594 isHidden";box.innerHTML='<div><b id="gpsGuardTitle594">📍 Ubicación necesaria</b><small id="gpsGuardText594">Actívala para guardar coordenadas.</small></div><button id="gpsGuardBtn594" type="button">Activar ubicación</button>';
    $("cameraStage")?.appendChild(box);$("gpsGuardBtn594")?.addEventListener("click",()=>LocationGuard.ensure(true));
  }
  function sync(){
    inject();const box=$("gpsGuard594");if(!box)return;
    if(fresh(State.gps)){box.classList.add("isHidden");box.classList.remove("waiting");PermissionAssistant.paintCheck();return;}
    const [title,text]=copy();box.classList.remove("isHidden","ready");$("gpsGuardTitle594").textContent=`📍 ${title}`;$("gpsGuardText594").textContent=text;$("gpsGuardBtn594").textContent=busy?"Buscando GPS…":"Activar ubicación";box.classList.toggle("waiting",busy);PermissionAssistant.paintCheck();
  }
  function showGuide(){
    const r=reason(lastError);PermissionAssistant.open("location",r==="permission"?"permission":"signal");
    if(r!=="permission"){
      $("permissionModalTitle").textContent=r==="timeout"?"GPS sin responder":"Ubicación no disponible";
      $("permissionModalText").textContent=r==="timeout"?"El teléfono no entregó coordenadas a tiempo. Enciende Ubicación y Ubicación precisa, espera unos segundos y vuelve a probar.":"El teléfono no está entregando señal GPS. Comprueba que Ubicación esté encendida y prueba en una zona con mejor señal.";
      $("permissionModalSteps").innerHTML='<li>Enciende <b>Ubicación/GPS</b> en el teléfono.</li><li>Activa <b>Ubicación precisa</b> para ONE SHOT o el navegador.</li><li>Regresa y toca “Probar ubicación”.</li>';
      $("permissionTestBtn").textContent="📍 Probar ubicación";
    }
  }
  const baseStart=GPS.start.bind(GPS);
  GPS.start=function(){baseStart();setTimeout(sync,900)};
  GPS.current=async function(timeout=12000,force=false){
    if(!force&&fresh(State.gps))return State.gps;
    if(!navigator.geolocation){lastError={code:0,message:"Geolocalización no disponible"};sync();return null;}
    return new Promise(resolve=>navigator.geolocation.getCurrentPosition(p=>{
      const next=GPS.norm(p);if(!valid(next)){lastError={code:2,message:"Coordenadas inválidas"};sync();resolve(null);return;}
      lastError=null;State.gps=next;GPS.water();GPS.setChip(`GPS ±${Math.round(next.accuracy)}m`);GPS.paintHealth();GPS.resolveLive(next);RouteCoverage.capture(next);SmartSectorCoverage.onGps(next);sync();resolve(next);
    },err=>{lastError=err;GPS.setChip(err.code===1?"GPS sin permiso":err.code===3?"GPS agotó espera":"GPS sin señal");GPS.paintHealth(err.code===1?"Sin permiso":err.code===3?"Tiempo agotado":"Sin señal");sync();resolve(null);},{enableHighAccuracy:true,maximumAge:0,timeout}));
  };
  const LocationGuard={
    sync,
    async ensure(interactive=false){
      if(fresh(State.gps)){sync();return State.gps}if(busy)return null;busy=true;sync();
      try{const g=await GPS.current(14000,true);if(valid(g)){lastError=null;await GPS.resolveLive(g,true);sync();UI.toast(`✓ Ubicación lista ±${Math.round(g.accuracy)}m`,2200,{placement:"top",tone:"soft"});return g}if(interactive)showGuide();return null}finally{busy=false;sync()}
    }
  };
  window.LocationGuard=LocationGuard;
  const baseShoot=Camera.shoot.bind(Camera);
  Camera.shoot=async function(){
    const g=await LocationGuard.ensure(true);if(!valid(g)){UI.toast("📍 Foto no tomada · activa ubicación para guardar evidencia válida",4200,{placement:"top",tone:"soft"});return false}
    if(+g.accuracy>100)UI.toast(`⚠ GPS con baja precisión ±${Math.round(g.accuracy)}m`,2600,{placement:"top",tone:"soft"});return baseShoot();
  };
  const baseRefresh=GPS.refresh.bind(GPS);
  GPS.refresh=async function(){const out=await baseRefresh();if(!fresh(State.gps))showGuide();sync();return out};
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){GPS.start();setTimeout(sync,1000)}});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{inject();setTimeout(sync,1200)},{once:true});else{inject();setTimeout(sync,1200)}
  setInterval(sync,2000);
  console.info("[ONE SHOP] v5.9.14 asistente GPS activo");
})();
