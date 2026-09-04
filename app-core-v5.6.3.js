"use strict";

const VERSION = "oneshot-v5.6.3-permission-assistant-01";
const UPDATE_FEED_URL = "https://raw.githubusercontent.com/DiegoRod24/evidencia-calle-pro/main/version.json";
const $ = id => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const State = {
  records: [], places: [], fieldBases: [], filter: "today", search: "", placeSearch: "", placeMode: "current", galleryView: "cards", pendingRelationId: "", pendingPreviousId: "", pendingBaseItem: null, stream: null, currentTrack: null,
  devices: [], deviceIndex: 0, zoom: 1, zoomMin: 1, zoomMax: 4, cameraFacing: "back",
  gps: null, gpsWatchId: null, liveLocation: null, liveLocationAt: 0,
  viewerIndex: 0, db: null, restarting: false, torch: false,
  cameraStatus: "idle", cameraWanted: false, startPromise: null, resumeCamera: false, cameraErrorKind: "", cameraErrorName: "", cameraPermissionState: "unknown", locationPermissionState: "unknown",
  pinchStartDistance: 0, pinchStartZoom: 1, viewerPinchStart: 0, viewerPinchZoom: 1,
  lastShotId: null, selectionMode: false, controlsHidden: false, controlsHiddenPersistent: false, controlsTimer: null,
  heading: null, beta: null, gamma: null, roll: 0, smartOrientation: "portrait", orientationPermission: "unknown", orientationCandidate: "portrait", orientationCandidateSince: 0, orientationCooldownUntil: 0, orientationSide: "right", captureOrientationLocked: false, captureOrientationKey: "portrait",
  hardwareZoom: false, digitalZoomScale: 1, wideActive: false, mainDeviceId: null, wideDeviceId: null, layoutEditing: false, layoutDraft: null, suppressShootClick: false, toolsCollapsed: false,
  reportCache: { key: "", file: null, promise: null },
  time: {source:"LOCAL", offsetMs:0, syncedAt:0, rttMs:null, serverDate:null, baseServerMs:null, basePerfMs:null, uncertaintyMs:null},
  settings: {
    phone: "51989680038", reviewer: "", quality: "high",
    watermarkPosition: "left", dockPosition: "center", hudMode: "compact",
    autoHideControls: true, autoHideDelayMs: 8000, galleryMode: "compact", sensorWatermark: true,
    integrityWatermark: true, framing: "exact", watermarkScale: 1, watermarkTextScale: 1,
    institutionBrand: "oneshot", institutionLogoData: "", accentColor: "#2f6bff", uiScale: 1, controlsVisible: true, fieldMode: true,
    activeProcess: "ERM", workMode: "mixed", nearbyHistoryEnabled: true, activeFieldBaseId: "", smartOrientation: true, orientationMode: "auto", orientationHoldMs: 900, orientationCooldownMs: 1800, cameraOrientationCalibration: "auto", frontCameraLandscapeFix: true, nearbyRadiusM: 20, hudVisible: true, liveWatermarkVisible: true, controlTone: "subtle", galleryView: "cards", presetEnabled: false, presetParty: "", presetCandidate: "", presetType: "PENDIENTE", presetCandidateType: "", currentMission: null, currentRoute: null, routeHistory: [], routeRecordMinM: 20, routeRecordMaxSec: 25, plannerCampaigns: [], activePlannerId: "", plannerRoute: null, smartSectorCoverage: null, teamMembers: [], teamAssignments: [], activeTeamAssignmentId: "", teamFieldNotes: [], smartRoute: null, smartRouteStrategy: "nearest", smartRouteMaxPoints: 40,
    recipients: [{id:"default",name:"Fernando",role:"Encargado",phone:"51989680038",isDefault:true}],
    defaultRecipientId: "default",
    layouts: { portrait:{}, landscape:{} }
  }
};

const Dates = {
  date(d = new Date()) { return new Intl.DateTimeFormat("en-CA", {timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"}).format(d); },
  time(d = new Date()) { return new Intl.DateTimeFormat("es-PE", {timeZone:"America/Lima",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(d); },
  stamp(d = new Date()) { return `${Dates.date(d)} · ${Dates.time(d)}`; }
};

const TimeTrust = {
  nowMs(){if(State.time.source==="SERVIDOR"&&Number.isFinite(State.time.baseServerMs)&&Number.isFinite(State.time.basePerfMs))return State.time.baseServerMs+(performance.now()-State.time.basePerfMs);return Date.now();},
  now(){return new Date(TimeTrust.nowMs());},
  label(){return State.time.source==="SERVIDOR"?`SERVIDOR ~±${Math.round((State.time.uncertaintyMs||1000)/1000)}s`:"LOCAL";},
  async sync(){
    if(!navigator.onLine){if(State.time.source!=="SERVIDOR")TimeTrust.local("Sin conexión");else TimeTrust.paint("offline");return false;}
    const startedWall=Date.now(),startedPerf=performance.now();
    try{
      const sep=location.href.includes("?")?"&":"?",url=`${location.href.split("#")[0]}${sep}timecheck=${Date.now()}`;
      const response=await fetch(url,{method:"HEAD",cache:"no-store",credentials:"same-origin"});const endedPerf=performance.now(),endedWall=Date.now(),header=response.headers.get("date");if(!header)throw new Error("El servidor no expone Date");const serverMs=Date.parse(header);if(!Number.isFinite(serverMs))throw new Error("Fecha inválida");
      const rtt=Math.max(0,endedPerf-startedPerf),uncertainty=Math.max(1000,1000+rtt/2),basePerf=endedPerf,baseServer=serverMs;const estimatedNow=baseServer;
      State.time={source:"SERVIDOR",offsetMs:estimatedNow-endedWall,syncedAt:Date.now(),rttMs:rtt,serverDate:header,baseServerMs:baseServer,basePerfMs:basePerf,uncertaintyMs:uncertainty};TimeTrust.paint();return true;
    }catch(e){if(State.time.source!=="SERVIDOR")TimeTrust.local(e.message||"Sin hora servidor");else TimeTrust.paint("sin resincronizar");return false;}
  },
  local(reason=""){State.time={source:"LOCAL",offsetMs:0,syncedAt:Date.now(),rttMs:null,serverDate:null,baseServerMs:null,basePerfMs:null,uncertaintyMs:null};TimeTrust.paint(reason);},
  paint(reason=""){
    const delta=State.time.source==="SERVIDOR"?Date.now()-TimeTrust.nowMs():0,deltaText=Math.abs(delta)>=60000?` · reloj equipo difiere ${Math.round(delta/60000)} min`:"";
    const text=State.time.source==="SERVIDOR"?`Servidor ${TimeTrust.label().replace("SERVIDOR ","")}${deltaText}`:`Local${reason?` · ${reason}`:""}`;
    if($("healthTime"))$("healthTime").textContent=text;if($("healthTimeDot"))$("healthTimeDot").className=`healthDot ${State.time.source==="SERVIDOR"?"ok":"warn"}`;
    if($("trustTime")){ $("trustTime").textContent=State.time.source==="SERVIDOR"?"HORA ✓":"HORA LOCAL";$("trustTime").className=State.time.source==="SERVIDOR"?"ok":"warn";}if($("trustedTimeConfig"))$("trustedTimeConfig").textContent=State.time.source==="SERVIDOR"?`Hora anclada al servidor y continuada con reloj monotónico durante esta sesión. Incertidumbre aproximada ${Math.round((State.time.uncertaintyMs||1000)/1000)} s.${deltaText}`:"Sin sincronización de servidor: las nuevas capturas se marcarán como HORA LOCAL.";
  },
  capture(){const ms=TimeTrust.nowMs(),d=new Date(ms);return{date:d,iso:d.toISOString(),source:State.time.source,label:TimeTrust.label(),offsetMs:ms-Date.now(),syncedAt:State.time.syncedAt,rttMs:State.time.rttMs,uncertaintyMs:State.time.uncertaintyMs};}
};

const Sensors = {
  async enable() {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        if (State.orientationPermission !== "granted") {
          const result = await DeviceOrientationEvent.requestPermission(); State.orientationPermission=result;
          if (result !== "granted") return false;
        }
      }
      window.removeEventListener("deviceorientation", Sensors.onOrientation, true);
      window.addEventListener("deviceorientation", Sensors.onOrientation, true);
      return true;
    } catch (_) { return false; }
  },
  onOrientation(e) {
    let heading = Number.isFinite(e.webkitCompassHeading) ? e.webkitCompassHeading : (Number.isFinite(e.alpha) ? (360 - e.alpha) % 360 : null);
    if (heading != null) State.heading = Math.round((heading + 360) % 360);
    State.beta = Number.isFinite(e.beta) ? e.beta : State.beta; State.gamma = Number.isFinite(e.gamma) ? e.gamma : State.gamma;
    const angle = Number(screen.orientation?.angle ?? window.orientation ?? 0); let roll = Number(State.gamma||0);
    if (Math.abs(angle)===90 && Number.isFinite(State.beta)) roll = State.beta - (angle>0?90:-90);
    State.roll = Math.max(-45,Math.min(45,roll)); Sensors.paintLevel(); Sensors.smartRotate();
  },
  orientationFromSensors(){
    const mode=State.settings.orientationMode||"auto";
    if(mode==="portrait")return "portrait";
    if(mode==="landscape-right")return "landscape-right";
    if(mode==="landscape-left")return "landscape-left";
    const angle=Number(screen.orientation?.angle ?? window.orientation ?? 0);
    if(Math.abs(angle)===90)return angle>0?"landscape-right":"landscape-left";
    const b=Number(State.beta),g=Number(State.gamma);
    if(Number.isFinite(b)&&Number.isFinite(g)){
      const absG=Math.abs(g);
      if(absG>=70)return g>=0?"landscape-right":"landscape-left";
      if(absG<=24)return "portrait";
      return null;
    }
    return innerWidth>innerHeight?"landscape-right":"portrait";
  },
  uiOrientationKey(key=State.smartOrientation||"portrait"){
    return String(key||"portrait").startsWith("landscape")?"landscape":"portrait";
  },
  applyStageOrientation(animate=false){
    const stage=$("cameraStage");
    if(!stage)return;
    const captureKey=State.smartOrientation||Sensors.orientationFromSensors()||"portrait";
    const uiKey=Sensors.uiOrientationKey(captureKey);
    stage.dataset.smartOrientation=uiKey;
    stage.dataset.captureOrientation=captureKey;
    stage.dataset.orientationSide=captureKey==="landscape-left"?"left":"right";
    if(animate){
      stage.classList.add("smartRotating");
      clearTimeout(Sensors.rotateTimer);
      Sensors.rotateTimer=setTimeout(()=>stage.classList.remove("smartRotating"),220);
    }
  },
  smartRotate(force=false){
    if(State.captureOrientationLocked)return;
    const mode=State.settings.orientationMode||"auto";
    if(State.settings.smartOrientation===false&&mode==="auto"){
      Sensors.applyStageOrientation(false);
      return;
    }
    const candidate=Sensors.orientationFromSensors();
    if(!candidate){
      Sensors.applyStageOrientation(false);
      return;
    }
    const now=performance.now();
    if(!force&&now<(State.orientationCooldownUntil||0))return;
    if(candidate!==State.orientationCandidate){State.orientationCandidate=candidate;State.orientationCandidateSince=now;if(!force)return;}
    const hold=mode==="auto"?Number(State.settings.orientationHoldMs||900):0;
    if(!force&&now-(State.orientationCandidateSince||now)<hold)return;
    if(candidate===State.smartOrientation){Sensors.applyStageOrientation(false);return;}
    State.smartOrientation=candidate;State.orientationSide=candidate==="landscape-left"?"left":"right";
    State.orientationCooldownUntil=now+Number(State.settings.orientationCooldownMs||1800);
    Sensors.applyStageOrientation(true);
    Sensors.paintOrientationChip();LayoutManager.apply();
    if(force)UI.toast(candidate==="portrait"?"Vertical listo":candidate==="landscape-left"?"Horizontal izquierda listo":"Horizontal derecha listo",1200,{placement:"top",tone:"soft"});
  },
  captureOrientation(){const key=State.smartOrientation||Sensors.orientationFromSensors()||"portrait";State.captureOrientationLocked=true;State.captureOrientationKey=key;Sensors.applyStageOrientation(false);return key;},
  releaseCaptureOrientation(){State.captureOrientationLocked=false;setTimeout(()=>Sensors.smartRotate(),120);},
  paintOrientationChip(){const chip=$("orientationChip");if(!chip)return;const mode=State.settings.orientationMode||"auto",key=State.smartOrientation||"portrait";if(mode==="auto")chip.textContent=key==="portrait"?"↕ Auto · Vertical":key==="landscape-left"?"↔ Auto · Horizontal ◀":"↔ Auto · Horizontal ▶";else chip.textContent=mode==="portrait"?"🔒 Vertical":mode==="landscape-left"?"🔒 Horizontal ◀":"🔒 Horizontal ▶";chip.classList.toggle("locked",mode!=="auto");},
  cycleOrientationMode(){const modes=["auto","portrait","landscape-right","landscape-left"],cur=State.settings.orientationMode||"auto",next=modes[(modes.indexOf(cur)+1)%modes.length];State.settings.orientationMode=next;Store.saveLite();Sensors.smartRotate(true);Sensors.paintOrientationChip();Sensors.applyStageOrientation(true);UI.applyLayout();},
  paintLevel(){ /* v3.3: sin regla/horizonte visible; se conserva rumbo como metadato */ },
  cardinal(deg) { if (deg==null || !Number.isFinite(Number(deg))) return ""; return ["N","NE","E","SE","S","SO","O","NO"][Math.round(Number(deg)/45)%8]; }
};


const EasyInstall = {
  deferredPrompt:null,
  dismissed:false,
  isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;},
  ua(){const ua=navigator.userAgent||'';return{ios:/iPhone|iPad|iPod/i.test(ua),android:/Android/i.test(ua),samsung:/SamsungBrowser/i.test(ua),chrome:/Chrome|CriOS/i.test(ua),safari:/Safari/i.test(ua)&&!/Chrome|CriOS|Android/i.test(ua)};},
  installUrl(){return `${location.origin}${location.pathname}`;},
  platformLabel(){const d=EasyInstall.ua();if(d.ios)return 'iPhone / iPad';if(d.samsung)return 'Samsung Internet';if(d.android)return 'Android';return 'Navegador';},
  steps(){
    const d=EasyInstall.ua();
    if(EasyInstall.isStandalone())return [['✓','ONE SHOT ya está instalada','Ábrela desde el icono de tu pantalla de inicio.']];
    if(d.ios)return [['1','Toca Compartir','En Safari pulsa el botón Compartir (cuadro con flecha hacia arriba).'],['2','Añadir a pantalla de inicio','Desliza el menú y elige “Añadir a pantalla de inicio”.'],['3','Confirma Añadir','ONE SHOT quedará como icono y abrirá a pantalla completa.']];
    if(d.samsung)return [['1','Abre el menú','Toca ☰ en Samsung Internet.'],['2','Añadir página a','Elige “Añadir página a” y luego “Pantalla de inicio”.'],['3','Confirma','ONE SHOT quedará disponible como aplicación.']];
    if(EasyInstall.deferredPrompt)return [['1','Toca Instalar ahora','Android abrirá el diálogo de instalación de ONE SHOT.'],['2','Confirma Instalar','No necesitas descargar APK ni ZIP.'],['3','Abre desde el icono','ONE SHOT funcionará a pantalla completa.']];
    return [['1','Abre el menú del navegador','Busca “Instalar aplicación” o “Añadir a pantalla principal”.'],['2','Confirma la instalación','El navegador creará el icono de ONE SHOT.'],['3','Abre desde tu pantalla','Las futuras actualizaciones llegarán desde la misma web.']];
  },
  render(){
    const installed=EasyInstall.isStandalone(),d=EasyInstall.ua(),badge=$("installStatusBadge"),status=$("installStatusText"),btn=$("installAppBtn"),title=$("installMainTitle"),help=$("installHelpText");
    if(badge){badge.className='installStatusBadge '+(installed?'installed':d.ios?'ios':'ready');badge.textContent=installed?'INSTALADA':d.ios?'IPHONE / IPAD':'LISTA';}
    if(status)status.textContent=installed?'ONE SHOT está ejecutándose como aplicación instalada.':`Modo navegador · ${EasyInstall.platformLabel()}`;
    if(title)title.textContent=installed?'✓ ONE SHOT ya está instalada':'ONE SHOT en tu pantalla de inicio';
    if(help)help.textContent=installed?'Puedes seguir usándola desde el icono del celular. Las actualizaciones se aplican sin reinstalar.':d.ios?'En iPhone te guiamos para añadirla a la pantalla de inicio desde Safari.':'Instálala sin APK: un toque abre el instalador compatible cuando el navegador lo permite.';
    if(btn){btn.textContent=installed?'✓ Aplicación instalada':d.ios?'📲 Cómo instalar en iPhone':'📲 Instalar ONE SHOT';btn.disabled=installed;}
  },
  open(){
    const d=EasyInstall.ua(),installed=EasyInstall.isStandalone(),steps=$("installSteps");
    $("installDeviceTitle").textContent=installed?'ONE SHOT ya está instalada':d.ios?'Instalar ONE SHOT en iPhone / iPad':d.samsung?'Instalar desde Samsung Internet':d.android?'Instalar ONE SHOT en Android':'Instalar ONE SHOT';
    $("installDeviceDescription").textContent=installed?'La estás usando en modo aplicación.':d.ios?'Apple requiere añadirla desde el menú Compartir de Safari. ONE SHOT te muestra exactamente qué tocar.':EasyInstall.deferredPrompt?'Tu navegador permite abrir directamente el instalador de la aplicación.':'Te mostramos el método compatible con tu navegador.';
    if(steps)steps.innerHTML=EasyInstall.steps().map(([n,t,x])=>`<div class="installStep"><i>${n}</i><div><b>${t}</b><span>${x}</span></div></div>`).join('');
    const url=EasyInstall.installUrl();$("installUrlText").textContent=url;
    const qr=$("installQrImage");if(qr)qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(url)}`;
    const action=$("installModalAction");if(action){action.disabled=installed;action.textContent=installed?'✓ Ya instalada':d.ios?'Ver pasos de iPhone':EasyInstall.deferredPrompt?'📲 Instalar ahora':'Abrir instrucciones';}
    $("installModal")?.classList.add('open');
  },
  close(){$("installModal")?.classList.remove('open');},
  async install(){
    if(EasyInstall.isStandalone()){EasyInstall.render();return;}
    const d=EasyInstall.ua();
    if(d.ios||!EasyInstall.deferredPrompt){EasyInstall.open();return;}
    try{const p=EasyInstall.deferredPrompt;EasyInstall.deferredPrompt=null;await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted'){UI.toast('ONE SHOT instalada · busca el icono en tu pantalla',3200);localStorage.setItem('oneshotInstallDismissed','1');}else UI.toast('Instalación cancelada');}catch(_){EasyInstall.open();}finally{EasyInstall.render();}
  },
  async share(){const url=EasyInstall.installUrl(),data={title:'ONE SHOT',text:'Instala ONE SHOT en tu celular',url};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(url);UI.toast('Enlace de instalación copiado');}}catch(_){}},
  async copy(){try{await navigator.clipboard.writeText(EasyInstall.installUrl());UI.toast('Enlace copiado');}catch(_){UI.toast('No se pudo copiar el enlace');}},
  maybePrompt(){if(EasyInstall.isStandalone()||localStorage.getItem('oneshotInstallDismissed')==='1')return;setTimeout(()=>EasyInstall.open(),1800);}
};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();EasyInstall.deferredPrompt=e;EasyInstall.render();});
window.addEventListener('appinstalled',()=>{EasyInstall.deferredPrompt=null;localStorage.setItem('oneshotInstallDismissed','1');EasyInstall.close();EasyInstall.render();UI.toast('✓ ONE SHOT instalada correctamente',3200);});

const UI = {
  toast(message, ms = 2200, opts = {}) {
    const t = $("toast"); if (!t) return;
    const placement = opts.placement || (document.body.classList.contains("cameraMode") ? "top" : "bottom");
    const tone = opts.tone || (document.body.classList.contains("cameraMode") ? "soft" : "default");
    if (UI.lastToastMessage === message && t.classList.contains("show")) clearTimeout(UI.toastTimer);
    UI.lastToastMessage = message;
    t.textContent = message;
    t.classList.toggle("top", placement === "top");
    t.classList.toggle("soft", tone === "soft");
    t.classList.add("show");
    clearTimeout(UI.toastTimer);
    UI.toastTimer = setTimeout(() => {
      t.classList.remove("show");
      t.classList.remove("soft");
    }, ms);
  },
  status(message) { if ($("debugStatus")) $("debugStatus").textContent = message; },
  setView(name) {
    const wasCamera=$("viewCamera")?.classList.contains("active");
    if(wasCamera&&name!=="Camera"&&State.cameraStatus==="active")Camera.pauseForView();
    $$(".view").forEach(v => v.classList.remove("active"));
    $("view" + name)?.classList.add("active");
    $$(".bottomNav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    document.body.classList.toggle("cameraMode", name === "Camera");
    if (name === "Evidence") Gallery.render();
    if (name === "Places") { Places.render(); setTimeout(()=>{SmartSectorCoverage.render();TeamMissions.render();SmartRoute.render();},80); }
    if (name === "Reports") { Reports.renderSummary(); Reports.prepare(); }
    if (name === "Camera") setTimeout(()=>Camera.ensureHealthy(),180);
  },
  clearOverlays() {
    $$(".modal").forEach(m => m.classList.remove("open"));
    $("cameraOptions")?.classList.remove("open");$("cameraStage")?.classList.remove("optionsOpen");
    document.documentElement.style.setProperty("--viewerZoom", "1");
    UI.toast("Interfaz actualizada");
  },
  updateClock() {
    const d=TimeTrust.now();
    if ($("wmTime")) $("wmTime").textContent = Dates.time(d).slice(0,5);
    if ($("wmDateLabel")) $("wmDateLabel").textContent = new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",day:"2-digit",month:"short",year:"numeric"}).format(d).replace(".","");
    if ($("wmDayLabel")) $("wmDayLabel").textContent = new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",weekday:"short"}).format(d).replace(".","")+".";
  },
  platform() {
    const native = APKBridge.isNative();
    $("platformChip").textContent = native ? "APK" : (/iphone|ipad|ipod/i.test(navigator.userAgent) ? "iPhone PWA" : "PWA");
  },
  applyLayout() {
    if(State.settings.institutionBrand==="onpe")State.settings.institutionBrand="oneshot";
    const wm = State.settings.watermarkPosition || "left";
    const dock = State.settings.dockPosition || "center";
    const hud = State.settings.hudMode || "compact";
    $("cameraStage").dataset.framing = State.settings.framing || "exact";
    $("watermarkLive").dataset.pos = wm;
    $("cameraDock").dataset.pos = dock;
    $("cameraStage").dataset.hud = hud;
    document.documentElement.style.setProperty("--accent", State.settings.accentColor || "#2f6bff");
    document.documentElement.style.setProperty("--uiScale", String(Number(State.settings.uiScale || 1)));
    document.documentElement.style.setProperty("--wmScale", String(Number(State.settings.watermarkScale || 1)));
    document.documentElement.style.setProperty("--wmTextScale", String(Number(State.settings.watermarkTextScale || 1)));
    $("evidenceList")?.classList.toggle("compact", (State.settings.galleryMode||"compact") === "compact");
    if ($("watermarkPositionInput")) $("watermarkPositionInput").value = wm;
    if ($("watermarkScaleInput")) $("watermarkScaleInput").value = String(State.settings.watermarkScale || 1);
    if ($("watermarkTextScaleInput")) $("watermarkTextScaleInput").value = String(State.settings.watermarkTextScale || 1);
    if ($("institutionBrandInput")) $("institutionBrandInput").value = State.settings.institutionBrand || "oneshot";
    if ($("accentColorInput")) $("accentColorInput").value = State.settings.accentColor || "#2f6bff";
    if ($("uiScaleInput")) $("uiScaleInput").value = String(State.settings.uiScale || 1);
    if ($("dockPositionInput")) $("dockPositionInput").value = dock;
    if ($("hudModeInput")) $("hudModeInput").value = hud;
    if ($("autoHideInput")) $("autoHideInput").value = State.settings.autoHideControls ? "yes" : "no";
    if ($("autoHideDelayInput")) $("autoHideDelayInput").value = String(State.settings.autoHideDelayMs ?? 8000);
    if ($("galleryModeInput")) $("galleryModeInput").value = State.settings.galleryMode || "compact";
    if ($("sensorWatermarkInput")) $("sensorWatermarkInput").value = State.settings.sensorWatermark ? "yes" : "no";
    if ($("integrityWatermarkInput")) $("integrityWatermarkInput").value = State.settings.integrityWatermark ? "yes" : "no";
    if ($("framingInput")) $("framingInput").value = State.settings.framing || "exact";

    if ($("controlsVisibleInput")) $("controlsVisibleInput").checked = State.settings.controlsVisible !== false;
    if ($("fieldModeInput")) $("fieldModeInput").checked = State.settings.fieldMode !== false;
    if ($("hudVisibleInput")) $("hudVisibleInput").checked = State.settings.hudVisible !== false;
    if ($("liveWatermarkVisibleInput")) $("liveWatermarkVisibleInput").checked = State.settings.liveWatermarkVisible !== false;
    if ($("orientationModeInput")) $("orientationModeInput").value = State.settings.orientationMode || "auto";
    if ($("controlToneInput")) $("controlToneInput").value = State.settings.controlTone || "subtle";
    if ($("workModeInput")) $("workModeInput").value = State.settings.workMode || "mixed";
    if ($("nearbyHistoryInput")) $("nearbyHistoryInput").checked = State.settings.nearbyHistoryEnabled !== false;
    $("cameraStage")?.classList.toggle("fieldMode",State.settings.fieldMode!==false);
    $("cameraStage")?.classList.toggle("hudHidden",State.settings.hudVisible===false);
    $("cameraStage")?.classList.toggle("liveWatermarkHidden",State.settings.liveWatermarkVisible===false);
    if($("cameraStage"))$("cameraStage").dataset.controlTone=State.settings.controlTone||"subtle";
    Sensors.paintOrientationChip();
    Branding.apply();
    setTimeout(()=>LayoutManager.apply(),0);
    $$('[data-wm-pos]').forEach(b => b.classList.toggle("active", b.dataset.wmPos === wm));
    $$('[data-dock-pos]').forEach(b => b.classList.toggle("active", b.dataset.dockPos === dock));
    $$('[data-hud-mode]').forEach(b => b.classList.toggle("active", b.dataset.hudMode === hud));
    $$('[data-orient-mode]').forEach(b=>b.classList.toggle('active',b.dataset.orientMode===(State.settings.orientationMode||'auto')));
  }
};

const Store = {
  open() {
    return new Promise(resolve => {
      const q = indexedDB.open("oneshotEvidenceDB_v2", 1);
      q.onupgradeneeded = () => q.result.createObjectStore("records", {keyPath:"id"});
      q.onsuccess = () => { State.db = q.result; resolve(); };
      q.onerror = () => resolve();
    });
  },
  tx(mode = "readonly") { return State.db.transaction("records", mode).objectStore("records"); },
  async save(record) {
    record.updatedAt = new Date().toISOString();
    if (State.db) await new Promise(resolve => { const q = Store.tx("readwrite").put(record); q.onsuccess = q.onerror = () => resolve(); });
    Store.saveLite(); Reports.invalidate();
  },
  async saveAll() { return Store.saveBatch(State.records); },
  async saveBatch(records = State.records) {
    const list = Array.from(records || []);
    if (State.db && list.length) {
      await new Promise(resolve => {
        try {
          const tx = State.db.transaction("records", "readwrite"), os = tx.objectStore("records");
          const now = new Date().toISOString();
          for (const r of list) { r.updatedAt = now; os.put(r); }
          tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => resolve();
        } catch (_) { resolve(); }
      });
    }
    Store.saveLite(); Reports.invalidate();
  },
  async load() {
    try { State.settings = {...State.settings, ...JSON.parse(localStorage.getItem("oneshotSettings") || "{}")}; State.settings.layouts=State.settings.layouts||{portrait:{},landscape:{}}; } catch (_) {}
    try { State.places = JSON.parse(localStorage.getItem("oneshotPlacesV4") || "[]"); if(!Array.isArray(State.places))State.places=[]; } catch (_) { State.places=[]; }
    try { State.fieldBases = JSON.parse(localStorage.getItem("oneshotFieldBasesV44") || "[]"); if(!Array.isArray(State.fieldBases))State.fieldBases=[]; } catch (_) { State.fieldBases=[]; }
    if (!State.db) {
      try { State.records = JSON.parse(localStorage.getItem("oneshotRecordsLite") || "[]"); } catch (_) { State.records = []; }
      return;
    }
    await new Promise(resolve => {
      const q = Store.tx().getAll();
      q.onsuccess = () => { State.records = q.result || []; resolve(); };
      q.onerror = () => resolve();
    });
  },
  async delete(id) {
    State.records = State.records.filter(r => r.id !== id);
    if (State.db) Store.tx("readwrite").delete(id);
    Store.saveLite(); Reports.invalidate();
  },
  saveLite() {
    try {
      // Las fotos grandes viven en IndexedDB. El respaldo lite evita romper localStorage.
      const lite = State.records.map(r => ({...r, image: r.image?.length > 900000 ? "" : r.image, stampedImage: r.stampedImage?.length > 900000 ? "" : r.stampedImage}));
      localStorage.setItem("oneshotRecordsLite", JSON.stringify(lite));
      localStorage.setItem("oneshotSettings", JSON.stringify(State.settings));
      localStorage.setItem("oneshotPlacesV4", JSON.stringify(State.places||[]));
      localStorage.setItem("oneshotFieldBasesV44", JSON.stringify(State.fieldBases||[]));
    } catch (_) {}
  }
};


const LegacyVault = {
  normalize(raw, source="import") {
    if (!raw || typeof raw !== "object") return null;
    const r = {...raw};
    r.id = r.id || r.evidenceId || r.codigo || r.photoCode || `legacy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    r.photoCode = r.photoCode || r.codigoFoto || r.codigo || r.code || r.id;
    r.verifyCode = r.verifyCode || r.verifier || r.codigoVerificacion || r.verificationCode || "";
    r.image = r.image || r.originalImage || r.original || r.photo || r.dataUrl || r.imageData || "";
    r.stampedImage = r.stampedImage || r.evidenceImage || r.watermarkedImage || r.markedImage || r.imageMarked || "";
    r.fecha = r.fecha || r.date || (r.createdAt ? String(r.createdAt).slice(0,10) : "");
    r.hora = r.hora || r.time || "";
    r.address = r.address || r.direccion || r.location || "Ubicación no disponible (versión anterior)";
    r.district = r.district || r.distrito || "";
    r.ubigeo = r.ubigeo || "";
    r.process = r.process || r.proceso || "";
    r.evidenceType = r.evidenceType || r.tipoEvidencia || r.type || "PENDIENTE";
    r.status = r.status || r.estado || "PENDIENTE";
    r.party = r.party || r.partido || "";
    r.candidate = r.candidate || r.candidato || "";
    r.role = r.role || r.cargo || "";
    r.observation = r.observation || r.observacion || "";
    r.legacySource = r.legacySource || source;
    r.legacyRecoveredAt = r.legacyRecoveredAt || new Date().toISOString();
    r.legacyRecord = true;
    return r;
  },
  score(r) {
    if (!r) return 0;
    let s=0;
    if (r.image) s+=100;
    if (r.stampedImage) s+=70;
    if (r.sourceHash) s+=20;
    if (r.stampedHash) s+=15;
    if (r.gps?.latitude != null) s+=15;
    if (r.address && !/pendiente|no disponible/i.test(r.address)) s+=10;
    for (const k of ["party","candidate","role","district","process","evidenceType","observation"]) if (r[k]) s+=2;
    return s;
  },
  key(r) {
    return String(r?.id || r?.photoCode || r?.sourceHash || r?.verifyCode || "");
  },
  findMatch(list, r) {
    if (!r) return null;
    return list.find(x =>
      (r.id && x.id===r.id) ||
      (r.photoCode && x.photoCode===r.photoCode) ||
      (r.sourceHash && x.sourceHash===r.sourceHash) ||
      (r.verifyCode && x.verifyCode===r.verifyCode)
    ) || null;
  },
  mergeOne(list, incoming) {
    const r=LegacyVault.normalize(incoming, incoming?.legacySource||"legacy");
    if (!r) return {added:0,updated:0};
    const cur=LegacyVault.findMatch(list,r);
    if (!cur) { list.push(r); return {added:1,updated:0}; }
    const before=LegacyVault.score(cur), after=LegacyVault.score(r);
    const preferred=after>before?r:cur, secondary=after>before?cur:r;
    const merged={...secondary,...preferred};
    // Nunca perder una foto completa por un registro lite.
    merged.image = preferred.image || secondary.image || "";
    merged.stampedImage = preferred.stampedImage || secondary.stampedImage || "";
    merged.sourceHash = preferred.sourceHash || secondary.sourceHash || "";
    merged.stampedHash = preferred.stampedHash || secondary.stampedHash || "";
    Object.keys(merged).forEach(k=>{ if ((merged[k]===null||merged[k]===undefined||merged[k]==="") && secondary[k]!==undefined) merged[k]=secondary[k]; });
    const idx=list.indexOf(cur); list[idx]=merged;
    return {added:0,updated:1};
  },
  async importRecords(records, source="backup") {
    const arr=Array.isArray(records)?records:[];
    let added=0,updated=0;
    for (const raw of arr) {
      const n=LegacyVault.normalize(raw,source); if(!n) continue;
      const m=LegacyVault.mergeOne(State.records,n); added+=m.added; updated+=m.updated;
    }
    // Orden más reciente primero, sin romper registros sin fecha.
    State.records.sort((a,b)=>String(b.createdAt||b.iso||`${b.fecha||""} ${b.hora||""}`).localeCompare(String(a.createdAt||a.iso||`${a.fecha||""} ${a.hora||""}`)));
    await Store.saveBatch(State.records);
    Reports.invalidate(); Gallery.render(); Reports.renderSummary();
    if(State.records[0]) Gallery.updateLastShot(State.records[0]);
    return {added,updated,total:State.records.length};
  },
  async readDb(name) {
    if (!name || name==="oneshotEvidenceDB_v2") return [];
    return new Promise(resolve=>{
      let req;
      try{req=indexedDB.open(name);}catch(_){return resolve([])}
      req.onerror=()=>resolve([]);
      req.onsuccess=()=>{
        const db=req.result, stores=Array.from(db.objectStoreNames||[]);
        const candidates=["records","evidences","evidence","photos"].filter(s=>stores.includes(s));
        if(!candidates.length){db.close();return resolve([])}
        let out=[],pending=candidates.length;
        for(const storeName of candidates){
          try{
            const q=db.transaction(storeName,"readonly").objectStore(storeName).getAll();
            q.onsuccess=()=>{if(Array.isArray(q.result))out.push(...q.result);if(--pending===0){db.close();resolve(out)}};
            q.onerror=()=>{if(--pending===0){db.close();resolve(out)}};
          }catch(_){if(--pending===0){db.close();resolve(out)}}
        }
      };
    });
  },
  async discover() {
    const batches=[];
    // Registros lite antiguos del mismo origen (útiles para completar metadatos).
    for (const key of ["oneshotRecordsLite","oneshotRecords","ONE_SHOT_EVIDENCIAS","evidenciasOneShot"]) {
      try{const v=JSON.parse(localStorage.getItem(key)||"null");if(Array.isArray(v)&&v.length)batches.push({source:`localStorage:${key}`,records:v});}catch(_){ }
    }
    // Bases IndexedDB antiguas si el navegador permite enumerarlas.
    if(indexedDB.databases){
      try{
        const dbs=await indexedDB.databases();
        for(const info of dbs||[]){
          const name=info?.name||"";
          if(!name || name==="oneshotEvidenceDB_v2" || !/one.?shot|eviden/i.test(name)) continue;
          const rows=await LegacyVault.readDb(name); if(rows.length)batches.push({source:`IndexedDB:${name}`,records:rows});
        }
      }catch(_){ }
    }
    return batches;
  },
  async recover(auto=false) {
    const batches=await LegacyVault.discover();
    let added=0,updated=0,found=0;
    for(const b of batches){found+=b.records.length;const result=await LegacyVault.importRecords(b.records,b.source);added+=result.added;updated+=result.updated;}
    if(!auto || added>0){
      UI.toast(added?`✓ Recuperadas ${added} evidencias anteriores`:(found?"Evidencias anteriores ya estaban integradas":"No se encontraron evidencias adicionales"),3200);
    }
    return {found,added,updated};
  },
  async exportMaster() {
    const payload={
      format:"ONE_SHOT_MASTER_BACKUP",
      schema:2,
      createdAt:new Date().toISOString(),
      appVersion:VERSION,
      recordCount:State.records.length,
      settings:State.settings,
      records:State.records
    };
    const file=new File([JSON.stringify(payload)],`ONE_SHOT_RESPALDO_MAESTRO_${Dates.date()}.json`,{type:"application/json"});
    await Share.downloadFile(file);
    UI.toast(`Respaldo maestro listo · ${State.records.length} evidencias`,3200);
  },
  async importFile(file) {
    if(!file) return;
    try{
      const parsed=JSON.parse(await file.text());
      const records=Array.isArray(parsed)?parsed:(Array.isArray(parsed.records)?parsed.records:[]);
      if(!records.length) throw new Error("El respaldo no contiene evidencias");
      const result=await LegacyVault.importRecords(records,`archivo:${file.name}`);
      if(parsed.settings && typeof parsed.settings==="object"){
        State.settings={...State.settings,...parsed.settings,layouts:parsed.settings.layouts||State.settings.layouts};Store.saveLite();UI.applyLayout();
      }
      UI.toast(`Importación lista · ${result.added} nuevas · ${result.updated} consolidadas`,4200);
      setTimeout(()=>Evidence.migrateLegacy(),500);
    }catch(e){UI.toast(`No se pudo importar: ${e.message||e}`,4200)}
  }
};

const GPS = {
  start() {
    if (!navigator.geolocation) { GPS.setChip("GPS no disponible"); return; }
    if (State.gpsWatchId != null) navigator.geolocation.clearWatch(State.gpsWatchId);
    State.gpsWatchId = navigator.geolocation.watchPosition(
      p => {
        State.gps = GPS.norm(p); GPS.setChip(`GPS ±${Math.round(State.gps.accuracy || 0)}m`); GPS.water(); GPS.paintHealth(); RouteCoverage.capture(State.gps); SmartSectorCoverage.onGps(State.gps);
        GPS.resolveLive(State.gps);
      },
      e => { GPS.setChip(e.code === 1 ? "GPS sin permiso" : "GPS pendiente"); GPS.paintHealth(e.code===1?"Sin permiso":"Sin señal"); },
      {enableHighAccuracy:true, maximumAge:2500, timeout:15000}
    );
  },
  norm(p) {
    const c = p.coords; const a = Number(c.accuracy || 999);
    const quality = a <= 15 ? "Alta" : a <= 35 ? "Media" : a <= 80 ? "Baja" : "Muy baja";
    return {latitude:c.latitude, longitude:c.longitude, accuracy:a, altitude:c.altitude, altitudeAccuracy:c.altitudeAccuracy, heading:c.heading, speed:c.speed, timestamp:Number(p.timestamp)||Date.now(), receivedAt:Date.now(), quality};
  },
  setChip(text) { if ($("gpsChip")) $("gpsChip").textContent = text;if($("trustGps")&&!State.gps){$("trustGps").textContent="GPS …";$("trustGps").className="warn";} },
  water() {
    if (!State.gps) { $("wmGps").textContent = "GPS pendiente"; return; }
    const sensor=[];const h=State.heading??State.gps.heading;if(h!=null)sensor.push(`${Math.round(h)}° ${Sensors.cardinal(h)}`);if(State.gps.altitude!=null)sensor.push(`${Math.round(State.gps.altitude)}m`);$("wmGps").textContent = `${State.gps.latitude.toFixed(6)}, ${State.gps.longitude.toFixed(6)} · ±${Math.round(State.gps.accuracy)}m${sensor.length?` · ${sensor.join(" · ")}`:""}`;if($("trustGps")){$("trustGps").textContent=`GPS ±${Math.round(State.gps.accuracy)}m`;$("trustGps").className=State.gps.accuracy<=35?"ok":"warn";}
  },
  maps(g) { return g ? `https://www.google.com/maps/search/?api=1&query=${g.latitude},${g.longitude}` : ""; },
  async current(timeout = 10000, force = false) {
    if (!force && State.gps && Date.now() - State.gps.timestamp < 15000) return State.gps;
    if (!navigator.geolocation) return State.gps;
    return new Promise(resolve => navigator.geolocation.getCurrentPosition(
      p => { State.gps = GPS.norm(p); GPS.water(); GPS.setChip(`GPS ±${Math.round(State.gps.accuracy)}m`); GPS.paintHealth(); GPS.resolveLive(State.gps); RouteCoverage.capture(State.gps); SmartSectorCoverage.onGps(State.gps); resolve(State.gps); },
      () => resolve(State.gps),
      {enableHighAccuracy:true, maximumAge:0, timeout}
    ));
  },
  async reverse(g) {
    if (!g) return {address:"Ubicación pendiente", addressStructured:"", street:"", houseNumber:"", postcode:"", city:"", country:"", ubigeo:"UBIGEO pendiente", district:"", department:"", province:""};
    if (!navigator.onLine) return {address:"Dirección pendiente · sin conexión", addressStructured:"", street:"", houseNumber:"", postcode:"", city:"", country:"", ubigeo:"UBIGEO pendiente", district:"", department:"", province:""};
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=es&addressdetails=1&lat=${encodeURIComponent(g.latitude)}&lon=${encodeURIComponent(g.longitude)}`;
      const r = await fetch(url, {headers:{"Accept":"application/json"}}); if (!r.ok) throw new Error("reverse");
      const j = await r.json(), a = j.address || {};
      const street=a.road||a.pedestrian||a.footway||a.residential||"", houseNumber=a.house_number||"", postcode=a.postcode||"";
      const district=a.city_district||a.suburb||a.district||a.town||a.city||a.county||"";
      const city=a.city||a.town||a.municipality||a.village||district||"", province=a.county||a.province||"", department=a.state||"", country=a.country||"";
      const structured=[street&&houseNumber?`${street} ${houseNumber}`:street,district&&district!==city?district:"",city,province,department,postcode,country].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join(", ");
      return {address:structured||j.display_name||"Ubicación pendiente",addressStructured:structured,street,houseNumber,postcode,city,country,ubigeo:"UBIGEO pendiente",district,department,province};
    } catch (_) { return {address:"Ubicación pendiente",addressStructured:"",street:"",houseNumber:"",postcode:"",city:"",country:"",ubigeo:"UBIGEO pendiente",district:"",department:"",province:""}; }
  },
  paintHealth(extra="") {
    if (!$('healthGps')) return;
    if (State.gps) { $('healthGps').textContent=`±${Math.round(State.gps.accuracy)}m · ${State.gps.quality}`; $('healthGpsDot').className=`healthDot ${State.gps.accuracy<=35?"ok":"warn"}`; }
    else { $('healthGps').textContent=extra||"Buscando…"; $('healthGpsDot').className="healthDot warn"; }
  },
  async resolveLive(g, force = false) {
    if (!g || (!force && Date.now() - State.liveLocationAt < 45000)) return;
    State.liveLocationAt = Date.now();
    const meta = await GPS.reverse(g); State.liveLocation = meta;
    $("wmAddr").textContent = meta.address || "Ubicación pendiente";
  },
  async refresh() {
    UI.toast("Actualizando ubicación…"); $("wmAddr").textContent = "Actualizando ubicación…";
    const g = await GPS.current(16000, true);
    if (g) { await GPS.resolveLive(g, true); UI.toast(`GPS actualizado ±${Math.round(g.accuracy)}m`); }
    else UI.toast("No se pudo actualizar GPS");
  }
};


const PermissionAssistant = {
  env(){
    const ua=navigator.userAgent||"";
    const ios=/iPad|iPhone|iPod/i.test(ua) || (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    const samsung=/SamsungBrowser/i.test(ua);
    const android=/Android/i.test(ua);
    const standalone=window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone===true;
    return{ios,samsung,android,standalone};
  },
  async query(name){
    try{if(!navigator.permissions?.query)return"unknown";const p=await navigator.permissions.query({name});return p.state||"unknown";}catch(_){return"unknown";}
  },
  async refresh(){
    State.cameraPermissionState=await PermissionAssistant.query('camera');
    State.locationPermissionState=await PermissionAssistant.query('geolocation');
    PermissionAssistant.paintCheck();
    return{camera:State.cameraPermissionState,location:State.locationPermissionState};
  },
  classify(err){
    const name=err?.name||"";
    if(name==='NotAllowedError'||name==='PermissionDeniedError'||name==='SecurityError')return'permission';
    if(name==='NotReadableError'||name==='TrackStartError'||name==='AbortError')return'busy';
    if(name==='NotFoundError'||name==='DevicesNotFoundError'||name==='OverconstrainedError')return'notfound';
    if(!navigator.mediaDevices?.getUserMedia)return'unsupported';
    return'generic';
  },
  guide(kind='camera'){
    const e=PermissionAssistant.env();
    if(kind==='location'){
      if(e.ios)return['Ubicación en iPhone/iPad','Abre Ajustes → Privacidad y seguridad → Localización → Safari/ONE SHOT y permite ubicación mientras usas la app. Luego vuelve y toca “Ya di permiso · Probar”.'];
      if(e.samsung)return['Ubicación en Samsung','Abre Ajustes del teléfono → Aplicaciones → Samsung Internet (o ONE SHOT si está instalada) → Permisos → Ubicación → Permitir mientras se usa.'];
      if(e.android)return['Ubicación en Android','Mantén presionado ONE SHOT → Información de la aplicación → Permisos → Ubicación → Permitir mientras se usa. Si no aparece como app, abre el sitio en Chrome → Configuración del sitio → Ubicación → Permitir.'];
      return['Permiso de ubicación','Abre la configuración de permisos del navegador para este sitio y habilita Ubicación.'];
    }
    if(e.ios)return['Cámara en iPhone/iPad','Abre Ajustes → Safari (o el navegador usado) → Cámara y permite acceso. Si ONE SHOT está añadida a inicio, revisa también Ajustes → Privacidad y seguridad → Cámara. Luego vuelve y toca “Ya di permiso · Probar”.'];
    if(e.samsung)return['Cámara en Samsung','Abre Ajustes → Aplicaciones → Samsung Internet (o ONE SHOT si aparece instalada) → Permisos → Cámara → Permitir mientras se usa. También puedes abrir el sitio en Samsung Internet → permisos del sitio.'];
    if(e.android)return['Cámara en Android','Mantén presionado el icono ONE SHOT → Información de la aplicación → Permisos → Cámara → Permitir mientras se usa. Si no aparece Cámara allí, abre ONE SHOT en Chrome → icono de sitio/candado → Permisos → Cámara → Permitir.'];
    return['Permiso de cámara','Abre los permisos del sitio en tu navegador, habilita Cámara y regresa a ONE SHOT.'];
  },
  open(kind='camera',reason='permission'){
    const modal=$("permissionModal");if(!modal)return;
    const [title,help]=PermissionAssistant.guide(kind);
    const isCam=kind==='camera';
    $("permissionModalIcon").textContent=isCam?'📷':'📍';
    $("permissionModalTitle").textContent=reason==='busy'?'Cámara ocupada':reason==='notfound'?'Cámara no disponible':reason==='unsupported'?'Navegador no compatible':title;
    $("permissionModalText").textContent=reason==='busy'?'Otra aplicación puede estar usando la cámara. Cierra Cámara, WhatsApp, Instagram, videollamadas u otra app que use video; después vuelve y prueba de nuevo.':reason==='notfound'?'ONE SHOT no encontró una cámara utilizable en este dispositivo. Revisa que exista una cámara activa y que el navegador tenga acceso.':reason==='unsupported'?'Este navegador no expone la cámara web necesaria para ONE SHOT. Abre la aplicación con Chrome, Safari o Samsung Internet actualizado.':help;
    $("permissionModalSteps").innerHTML= reason==='busy' ? '<li>Cierra aplicaciones que estén usando cámara.</li><li>Vuelve a ONE SHOT.</li><li>Toca “Liberar y probar”.</li>' : reason==='permission' ? '<li>Abre los permisos del dispositivo o del sitio.</li><li>Cambia el permiso a <b>Permitir</b>.</li><li>Regresa a ONE SHOT y toca “Ya di permiso · Probar”.</li>' : '<li>Revisa el dispositivo y navegador.</li><li>Regresa a ONE SHOT.</li><li>Prueba nuevamente.</li>';
    $("permissionTestBtn").textContent=reason==='busy'?'♻ Liberar y probar':'✓ Ya di permiso · Probar';
    $("permissionTestBtn").dataset.kind=kind;$("permissionTestBtn").dataset.reason=reason;
    modal.classList.add('open');
  },
  close(){$("permissionModal")?.classList.remove('open');},
  async testCamera(){
    PermissionAssistant.close();
    await Camera.stop({keepWanted:true});await sleep(250);
    const ok=await Camera.start({silent:false,force:true});
    if(ok){UI.toast('✓ Cámara lista');PermissionAssistant.refresh();}
  },
  async requestLocation(){
    UI.toast('Solicitando ubicación…');
    try{
      const g=await GPS.current(12000,true);
      if(g){UI.toast(`✓ Ubicación lista ±${Math.round(g.accuracy)}m`);PermissionAssistant.close();}
      else PermissionAssistant.open('location','permission');
    }catch(_){PermissionAssistant.open('location','permission');}
    PermissionAssistant.refresh();
  },
  paintCheck(){
    const c=$("deviceCheckCamera"),g=$("deviceCheckGps");
    if(c){const s=State.cameraStatus==='active'?'granted':State.cameraPermissionState;c.textContent=s==='granted'?'✓ Lista':s==='denied'?'✕ Bloqueada':s==='prompt'?'• Por autorizar':'• Revisar';c.dataset.state=s;}
    if(g){const s=State.gps?'granted':State.locationPermissionState;g.textContent=s==='granted'?'✓ Lista':s==='denied'?'✕ Bloqueada':s==='prompt'?'• Por autorizar':'• Revisar';g.dataset.state=s;}
  },
  async prepare(){
    await PermissionAssistant.refresh();
    if(State.cameraPermissionState==='denied')return PermissionAssistant.open('camera','permission');
    if(State.cameraStatus!=='active'){const ok=await Camera.start({silent:false});if(!ok)return;}
    const g=await GPS.current(10000,true);if(!g)return PermissionAssistant.open('location','permission');
    await PermissionAssistant.refresh();UI.toast('✓ Dispositivo listo para ONE SHOT');
  }
};

const Camera = {
  setStatus(status, detail="") {
    State.cameraStatus=status;if(status!=="error"){State.cameraErrorKind="";State.cameraErrorName="";}
    const stage=$("cameraStage"), fb=$("cameraFallback"), title=$("cameraStateTitle"), text=$("cameraStateText"), err=$("cameraErrorDetail");
    stage.classList.toggle("cameraActive", status==="active"); stage.classList.toggle("cameraError", status==="error");
    if (status === "active") { fb.style.display="none"; }
    else {
      fb.style.display="grid"; fb.dataset.state=status;
      let pair={idle:["Cámara lista","Abre la cámara para comenzar a registrar evidencia."],starting:["Abriendo cámara…","Liberando recursos y buscando la mejor cámara disponible."],error:["No se pudo abrir la cámara","Revisa el diagnóstico y sigue la acción recomendada."]}[status]||["Cámara lista",""];
      if(status==="error"&&State.cameraErrorKind==="permission")pair=["Acceso a cámara bloqueado","ONE SHOT no tiene permiso para usar la cámara en este dispositivo."];
      if(status==="error"&&State.cameraErrorKind==="busy")pair=["La cámara está ocupada","Otra aplicación o el sistema mantiene ocupado el sensor de cámara."];
      if(status==="error"&&State.cameraErrorKind==="notfound")pair=["Cámara no disponible","ONE SHOT no encontró una cámara utilizable."];
      if(status==="error"&&State.cameraErrorKind==="unsupported")pair=["Navegador no compatible","Este navegador no permite iniciar la cámara necesaria para ONE SHOT."];
      const [a,b]=pair; title.textContent=a; text.textContent=b; err.textContent=detail||"";
      $("startCameraBtn").classList.toggle("isHidden", status!=="idle");
      $("retryCameraBtn").classList.toggle("isHidden", status!=="error"||State.cameraErrorKind==="permission");
      $("releaseCameraBtn").classList.toggle("isHidden", status!=="error"||State.cameraErrorKind==="permission");
      $("permissionHelpBtn")?.classList.toggle("isHidden", status!=="error");
    }
    if($("trustCamera")){ $("trustCamera").textContent=status==="active"?"CAM ✓":status==="error"?"CAM ✕":"CAM …";$("trustCamera").className=status==="active"?"ok":status==="error"?"bad":"warn";}if ($("healthCamera")) $("healthCamera").textContent=status==="active"?"Activa":status==="error"?"Error":status==="starting"?"Abriendo…":"En espera";
    if ($("healthCameraDot")) $("healthCameraDot").className=`healthDot ${status==="active"?"ok":status==="error"?"bad":"warn"}`;
    if(detail) UI.status(`Cámara: ${detail}`); else UI.status(`Cámara: ${status}`);PermissionAssistant.paintCheck();
  },
  async enumerate() { try { State.devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"); } catch(_){State.devices=[];} },
  qualityConstraints() { return State.settings.quality === "medium" ? {width:{ideal:1280},height:{ideal:720}} : {width:{ideal:1920},height:{ideal:1080}}; },
  attempts() {
    const q=Camera.qualityConstraints(), d=State.devices[State.deviceIndex]; const list=[];
    if(d?.deviceId) list.push({audio:false,video:{deviceId:{exact:d.deviceId},...q}});
    list.push({audio:false,video:{facingMode:{ideal:"environment"},...q}});
    list.push({audio:false,video:{facingMode:"environment"}});
    list.push({audio:false,video:true});
    return list;
  },
  waitReady(video, timeout=5500) {
    return new Promise((resolve,reject)=>{
      if(video.videoWidth>0&&video.readyState>=2)return resolve();
      const done=()=>{cleanup();video.videoWidth>0?resolve():reject(new Error("Video sin fotogramas"));};
      const fail=()=>{cleanup();reject(new Error("Tiempo agotado al iniciar video"));};
      const cleanup=()=>{clearTimeout(t);video.removeEventListener("loadedmetadata",done);video.removeEventListener("canplay",done)};
      const t=setTimeout(fail,timeout);video.addEventListener("loadedmetadata",done,{once:true});video.addEventListener("canplay",done,{once:true});
    });
  },
  async start({silent=false, force=false}={}) {
    State.cameraWanted=true;
    if(State.startPromise)return State.startPromise;
    State.startPromise=(async()=>{
      if(!navigator.mediaDevices?.getUserMedia){State.cameraErrorKind="unsupported";State.cameraErrorName="Unsupported";Camera.setStatus("error","getUserMedia no disponible");if(!silent)UI.toast("Este navegador no permite cámara");return false;}
      Camera.setStatus("starting"); await Camera.stop({keepWanted:true}); await sleep(260); await Camera.enumerate();
      let lastError=null;
      for(const constraints of Camera.attempts()){
        try{
          const stream=await navigator.mediaDevices.getUserMedia(constraints); const track=stream.getVideoTracks()[0];
          if(!track){stream.getTracks().forEach(t=>t.stop());throw new Error("No se recibió pista de video");}
          State.stream=stream;State.currentTrack=track;const video=$("video");video.srcObject=stream;await video.play();await Camera.waitReady(video);
          await Camera.enumerate();const currentId=track.getSettings?.().deviceId;if(currentId){const idx=State.devices.findIndex(d=>d.deviceId===currentId);if(idx>=0)State.deviceIndex=idx;}Camera.readCapabilities();Camera.renderLensOptions();Camera.armRecovery();await Camera.applyZoom(Math.max(State.zoomMin,Math.min(State.zoomMax,State.zoom)));
          Camera.setStatus("active");Camera.touchControls();Sensors.enable().catch(()=>{});Sensors.smartRotate(true);Sensors.applyStageOrientation(false);
          const st=track.getSettings?.()||{};UI.status(`Cámara activa · ${st.width||"?"}×${st.height||"?"} · ${track.label||"lente"}`);if(!silent)UI.toast("Cámara activa");return true;
        }catch(e){lastError=e;await Camera.stop({keepWanted:true});if(PermissionAssistant.classify(e)==="permission")break;await sleep(180);}
      }
      State.cameraErrorKind=PermissionAssistant.classify(lastError);State.cameraErrorName=lastError?.name||"Error";
      const msg=State.cameraErrorKind==="permission"?"Permiso de cámara denegado":State.cameraErrorKind==="busy"?"Cámara ocupada · cierra otras apps que usen video":State.cameraErrorKind==="notfound"?"No se encontró una cámara disponible":State.cameraErrorKind==="unsupported"?"El navegador no expone getUserMedia":`${lastError?.name||"Error"} · ${lastError?.message||"No se pudo iniciar video"}`;
      Camera.setStatus("error",msg);
      if(!silent){
        if(State.cameraErrorKind==="permission")UI.toast("Cámara bloqueada · abre el asistente de permisos",3200);
        else if(State.cameraErrorKind==="busy")UI.toast("Cámara ocupada · libera y vuelve a probar",3200);
        else UI.toast("No se pudo iniciar la cámara · revisa el asistente",3200);
      }
      return false;
    })();
    try{return await State.startPromise;}finally{State.startPromise=null;}
  },
  async stop({keepWanted=false}={}) {
    if(State.stream){State.stream.getTracks().forEach(t=>{try{t.onended=null;t.onmute=null;t.stop()}catch(_){}})}
    State.stream=null;State.currentTrack=null;const v=$("video");try{v.pause()}catch(_){}v.srcObject=null;State.torch=false;$("torchBtn")?.classList.remove("on");document.documentElement.style.setProperty("--videoZoom","1");
    if(!keepWanted)State.cameraWanted=false;
  },
  async release() { State.cameraWanted=false;await Camera.stop();Camera.setStatus("idle");UI.toast("Cámara liberada"); },
  async pauseForView() { if(State.cameraStatus!=="active")return;State.cameraWanted=true;await Camera.stop({keepWanted:true});Camera.setStatus("idle"); },
  async restart() {
    if(State.restarting)return;State.restarting=true;UI.status("Liberando cámara y renovando GPS…");
    try{State.gps=null;State.liveLocation=null;State.liveLocationAt=0;$("wmGps").textContent="GPS pendiente";$("wmAddr").textContent="Actualizando ubicación…";await Camera.stop({keepWanted:true});await sleep(420);const ok=await Camera.start({silent:true,force:true});GPS.start();GPS.current(9000,true).then(async g=>{if(g)await GPS.resolveLive(g,true)});UI.toast(ok?"Cámara y GPS reiniciados":"Cámara sigue sin disponible",3000);}finally{State.restarting=false;}
  },
  async ensureHealthy(){if(document.hidden||!State.cameraWanted)return;const t=State.currentTrack,v=$("video");if(State.cameraStatus!=="active"||!t||t.readyState!=="live"||!v.srcObject){await Camera.start({silent:true});}else v.play().catch(()=>{});},
  armRecovery(){const t=State.currentTrack;if(!t)return;t.onended=()=>{Camera.setStatus("error","La pista de cámara terminó");};t.onmute=()=>setTimeout(()=>{if(!document.hidden&&State.currentTrack===t&&t.muted)Camera.ensureHealthy()},1200);},
  detectFacing(track=State.currentTrack){
    const st=track?.getSettings?.()||{},label=String(track?.label||"").toLowerCase(),fm=String(st.facingMode||"").toLowerCase();
    if(fm==="user"||/(front|frontal|selfie|user facing|cara frontal)/i.test(label))return "front";
    if(fm==="environment"||/(back|rear|trasera|environment)/i.test(label))return "back";
    const currentId=st.deviceId||"",dev=State.devices.find(d=>d.deviceId===currentId),devLabel=String(dev?.label||"");
    return /(front|frontal|selfie|user)/i.test(devLabel)?"front":"back";
  },
  applyFacingUI(){
    State.cameraFacing=Camera.detectFacing();
    const stage=$("cameraStage");if(stage)stage.dataset.cameraFacing=State.cameraFacing;
  },
  readCapabilities(){
    const caps=State.currentTrack?.getCapabilities?.()||{},st=State.currentTrack?.getSettings?.()||{},currentId=st.deviceId||"",label=State.currentTrack?.label||"";
    Camera.applyFacingUI();
    State.wideActive=!!(State.wideDeviceId&&currentId===State.wideDeviceId);if(!State.wideActive&&!/(front|user|frontal)/i.test(label)&&currentId)State.mainDeviceId=currentId;
    const wideIndex=Camera.findWideDeviceIndex(),hasWideDevice=wideIndex>=0,hasNativeHalf=!!caps.zoom&&Number(caps.zoom.min)<=.55;
    State.hardwareZoom=!!caps.zoom;State.digitalZoomScale=1;
    State.zoomMin=(State.wideActive||hasWideDevice||hasNativeHalf)?.5:1;State.zoomMax=10;
    if(State.wideActive){if(State.zoom<.5||State.zoom>=1)State.zoom=.5;}else if(State.zoom<1)State.zoom=1;
    $("zoomSlider").min=State.zoomMin;$("zoomSlider").max=10;$("zoomSlider").value=State.zoom;$("zoomLabel").textContent=`${State.zoom.toFixed(1)}x`;
    $("torchBtn").classList.toggle("isHidden",!caps.torch);const wide=hasNativeHalf||hasWideDevice||State.wideActive;
    $("zoomPresets").querySelector('[data-zoom="0.5"]').classList.toggle("isHidden",!wide);
    $$('.zoomPresets button').forEach(b=>b.classList.toggle("active",Math.abs(Number(b.dataset.zoom)-State.zoom)<.12));
  },
  findWideDeviceIndex(){return State.devices.findIndex((d,i)=>i!==State.deviceIndex&&/(ultra|0\.5|0,5|gran angular|ultrawide|ultra wide|wide angle|triple camera|dual wide)/i.test(d.label||""));},
  findDeviceIndexById(id){return State.devices.findIndex(d=>d.deviceId===id);},
  renderLensOptions(){const sel=$("cameraLensSelect");if(!sel)return;const back=State.devices.filter(d=>!/front|user|frontal/i.test(d.label||""));sel.innerHTML=(back.length?back:State.devices).map(d=>`<option value="${esc(d.deviceId)}" ${State.currentTrack?.getSettings?.().deviceId===d.deviceId?"selected":""}>${esc(d.label||`Cámara ${State.devices.indexOf(d)+1}`)}</option>`).join("");},
  async chooseLens(deviceId){const idx=Camera.findDeviceIndexById(deviceId);if(idx<0)return;State.deviceIndex=idx;State.wideActive=false;State.wideDeviceId=null;State.zoom=1;await Camera.start({silent:true,force:true});Camera.renderLensOptions();UI.toast("Lente seleccionado",1300,{placement:"top",tone:"soft"});},
  async switchLens(preferWide=false){if(State.cameraStatus!=="active")return Camera.start();await Camera.enumerate();if(State.devices.length<2)return UI.toast("El navegador no expone otro lente");if(preferWide){const wide=Camera.findWideDeviceIndex();if(wide<0)return UI.toast("Este navegador no expone un lente 0.5x identificable");const currentId=State.currentTrack?.getSettings?.().deviceId||"";if(currentId)State.mainDeviceId=currentId;State.wideDeviceId=State.devices[wide].deviceId;State.deviceIndex=wide;State.zoom=.5;await Camera.start({silent:true,force:true});await Camera.applyZoom(.5,{skipLensSwitch:true});UI.toast("Lente ultra gran angular activo");return;}State.wideActive=false;State.wideDeviceId=null;State.deviceIndex=(State.deviceIndex+1)%State.devices.length;State.zoom=1;await Camera.start({silent:true,force:true});UI.toast("Lente cambiado");},
  async switchToMain(target=1){const idx=Camera.findDeviceIndexById(State.mainDeviceId);if(idx<0){State.wideActive=false;State.zoom=1;return Camera.switchLens(false);}State.deviceIndex=idx;State.wideActive=false;State.zoom=Math.max(1,target);await Camera.start({silent:true,force:true});return Camera.applyZoom(target,{skipLensSwitch:true});},
  async applyZoom(value,{skipLensSwitch=false}={}){
    if(State.cameraStatus!=="active")return;let z=Number(value);if(!Number.isFinite(z))z=1;
    const caps=State.currentTrack?.getCapabilities?.()||{},nativeHalf=!!caps.zoom&&Number(caps.zoom.min)<=.55;
    if(!skipLensSwitch&&!State.wideActive&&!nativeHalf&&z<.95){if(Camera.findWideDeviceIndex()>=0)return Camera.switchLens(true);z=1;}
    if(!skipLensSwitch&&State.wideActive&&z>=.95&&State.mainDeviceId)return Camera.switchToMain(z);
    if(State.wideActive)z=Math.max(.5,Math.min(.9,z));else z=Math.max(1,Math.min(10,z));
    State.zoom=z;$("zoomSlider").value=z;$("zoomLabel").textContent=`${z.toFixed(1)}x`;
    $$('.zoomPresets button').forEach(b=>b.classList.toggle("active",Math.abs(Number(b.dataset.zoom)-z)<.12));
    let hwApplied=false,digitalScale=State.wideActive?z/.5:z;
    try{
      if(caps.zoom){const hwMin=Number(caps.zoom.min||1),hwMax=Number(caps.zoom.max||1);let hwTarget=State.wideActive?Math.max(hwMin,Math.min(hwMax,z/.5)):Math.max(hwMin,Math.min(hwMax,z));await State.currentTrack.applyConstraints({advanced:[{zoom:hwTarget}]});hwApplied=true;digitalScale=State.wideActive?Math.max(1,(z/.5)/hwTarget):Math.max(1,z/hwTarget);}
    }catch(_){hwApplied=false;digitalScale=State.wideActive?z/.5:z;}
    State.hardwareZoom=hwApplied;State.digitalZoomScale=Math.max(1,digitalScale);document.documentElement.style.setProperty("--videoZoom",String(State.digitalZoomScale));Camera.touchControls();
  },
  async focusAt(clientX,clientY){if(State.cameraStatus!=="active")return;const stage=$("cameraStage"),rect=stage.getBoundingClientRect(),ring=$("focusRing");ring.style.left=`${clientX-rect.left}px`;ring.style.top=`${clientY-rect.top}px`;ring.classList.remove("show");void ring.offsetWidth;ring.classList.add("show");try{const caps=State.currentTrack?.getCapabilities?.()||{};if(Array.isArray(caps.focusMode)&&caps.focusMode.includes("single-shot")){await State.currentTrack.applyConstraints({advanced:[{focusMode:"single-shot"}]});setTimeout(()=>State.currentTrack?.applyConstraints?.({advanced:[{focusMode:"continuous"}]}).catch(()=>{}),900);}else if(Array.isArray(caps.focusMode)&&caps.focusMode.includes("continuous"))await State.currentTrack.applyConstraints({advanced:[{focusMode:"continuous"}]});}catch(_){}$("video").play().catch(()=>{});Camera.touchControls();},
  async toggleTorch(){if(State.cameraStatus!=="active")return;try{const caps=State.currentTrack?.getCapabilities?.()||{};if(!caps.torch)return UI.toast("Linterna no disponible");State.torch=!State.torch;await State.currentTrack.applyConstraints({advanced:[{torch:State.torch}]});$("torchBtn").classList.toggle("on",State.torch);}catch(_){State.torch=false;UI.toast("No se pudo activar la linterna");}},
  async captureFrame(orientationKey=State.smartOrientation||"portrait"){
    const v=$("video"),c=$("captureCanvas"),ctx=c.getContext("2d",{alpha:false});
    if(State.cameraStatus!=="active"||!v.videoWidth||!v.videoHeight)return null;
    const key=String(orientationKey||"portrait"),targetLandscape=key.startsWith("landscape");
    const quality=State.settings.quality==="medium"?.86:.94;
    const digital=Math.max(1,Number(State.digitalZoomScale||1));
    const cameraFacing=Camera.detectFacing(),front=cameraFacing==="front";
    let source=null,sourceW=0,sourceH=0,pipeline="video-preview";
    try{
      if(typeof ImageCapture!=="undefined"&&State.currentTrack){
        const ic=new ImageCapture(State.currentTrack);
        if(typeof ic.takePhoto==="function"){
          const blob=await Promise.race([ic.takePhoto(),new Promise((_,reject)=>setTimeout(()=>reject(new Error("still timeout")),2400))]);
          if(blob&&blob.size){
            source=await createImageBitmap(blob,{imageOrientation:"from-image"});
            sourceW=source.width;sourceH=source.height;pipeline="imagecapture-photo";
          }
        }
      }
    }catch(_){source=null;}
    if(!source){source=v;sourceW=v.videoWidth;sourceH=v.videoHeight;pipeline="video-preview";}

    // 5.3 mantiene intacta la corrección de cámara trasera.
    // 5.3.1 identifica frontal por facingMode/label y le da un pipeline independiente.
    const sourceLandscape=sourceW>=sourceH;
    let rotateDeg=0;
    if(targetLandscape!==sourceLandscape){
      if(targetLandscape)rotateDeg=key==="landscape-left"?-90:90;
      else rotateDeg=(State.orientationSide||"right")==="left"?90:-90;
    }else if(!front&&pipeline==="video-preview"&&targetLandscape&&Number(screen.orientation?.angle??window.orientation??0)===0){
      // Calibración heredada: SOLO cámara trasera.
      const calibration=State.settings.cameraOrientationCalibration||"auto";
      const flip=(calibration==="always-180")||(calibration==="left-180"&&key==="landscape-left")||(calibration==="right-180"&&key==="landscape-right");
      if(flip)rotateDeg=180;
    }

    const raw=document.createElement("canvas"),rctx=raw.getContext("2d",{alpha:false});
    if(Math.abs(rotateDeg)===90){raw.width=sourceH;raw.height=sourceW;rctx.save();if(rotateDeg===90){rctx.translate(raw.width,0);rctx.rotate(Math.PI/2);}else{rctx.translate(0,raw.height);rctx.rotate(-Math.PI/2);}rctx.drawImage(source,0,0,sourceW,sourceH);rctx.restore();}
    else if(rotateDeg===180){raw.width=sourceW;raw.height=sourceH;rctx.save();rctx.translate(raw.width,raw.height);rctx.rotate(Math.PI);rctx.drawImage(source,0,0,sourceW,sourceH);rctx.restore();}
    else{raw.width=sourceW;raw.height=sourceH;rctx.drawImage(source,0,0,sourceW,sourceH);}
    if(source!==v&&source?.close)try{source.close()}catch(_){}

    // FRONT CAMERA HOTFIX: varios Android entregan la foto frontal horizontal 180° opuesta
    // aunque el preview esté derecho. Se corrige exclusivamente en selfie horizontal.
    let normalized=raw,frontCorrectionApplied=0;
    if(front&&targetLandscape&&State.settings.frontCameraLandscapeFix!==false){
      const fix=document.createElement("canvas"),fctx=fix.getContext("2d",{alpha:false});
      fix.width=raw.width;fix.height=raw.height;fctx.save();fctx.translate(fix.width,fix.height);fctx.rotate(Math.PI);fctx.drawImage(raw,0,0);fctx.restore();
      normalized=fix;frontCorrectionApplied=180;
    }

    // La evidencia frontal NO se espeja: el espejo es solo de preview para encuadrar.
    const stage=$("cameraStage"),rect=stage?.getBoundingClientRect?.();
    let targetAspect=targetLandscape?16/9:9/16;
    if(rect&&rect.width>30&&rect.height>30){const visualAspect=rect.width/rect.height;if((visualAspect>=1)===targetLandscape)targetAspect=visualAspect;}
    let sx=0,sy=0,sw=normalized.width,sh=normalized.height;
    if(digital>1.001){sw/=digital;sh/=digital;sx=(normalized.width-sw)/2;sy=(normalized.height-sh)/2;}
    const currentAspect=sw/sh;
    if(currentAspect>targetAspect){const nw=sh*targetAspect;sx+=(sw-nw)/2;sw=nw;}
    else if(currentAspect<targetAspect){const nh=sw/targetAspect;sy+=(sh-nh)/2;sh=nh;}
    const longSide=Math.min(2560,Math.max(normalized.width,normalized.height));
    if(targetLandscape){c.width=longSide;c.height=Math.max(1,Math.round(longSide/targetAspect));}
    else{c.height=longSide;c.width=Math.max(1,Math.round(longSide*targetAspect));}
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#000";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(normalized,sx,sy,sw,sh,0,0,c.width,c.height);
    return{dataUrl:c.toDataURL("image/jpeg",quality),width:c.width,height:c.height,aspect:c.width/c.height,orientationKey:key,orientationSide:key==="landscape-left"?"left":key==="landscape-right"?"right":"",orientationMode:State.settings.orientationMode||"auto",capturePipeline:pipeline,cameraFacing,previewMirrored:front,frontCorrectionApplied,sourceFrameWidth:sourceW,sourceFrameHeight:sourceH,rotationApplied:rotateDeg+frontCorrectionApplied};
  },
  shotEffect(raw,code){$("captureReticle").classList.remove("active");void $("captureReticle").offsetWidth;$("captureReticle").classList.add("active");$("captureFlash").classList.remove("on");void $("captureFlash").offsetWidth;$("captureFlash").classList.add("on");$("captureCode").textContent=code;$("captureConfirm").classList.remove("show");void $("captureConfirm").offsetWidth;$("captureConfirm").classList.add("show");$("captureFreeze").src=raw;$("captureFreeze").classList.remove("show");void $("captureFreeze").offsetWidth;$("captureFreeze").classList.add("show");if(navigator.vibrate)navigator.vibrate([28,22,38]);},
  touchControls(force=false){if(State.controlsHiddenPersistent&&!force){State.controlsHidden=true;$("cameraStage").classList.add("controlsHidden");clearTimeout(State.controlsTimer);return;}State.controlsHidden=false;$("cameraStage").classList.remove("controlsHidden");clearTimeout(State.controlsTimer);const delay=Number(State.settings.autoHideDelayMs??8000);if(!State.layoutEditing&&State.settings.autoHideControls&&delay>0&&State.cameraStatus==="active")State.controlsTimer=setTimeout(()=>Camera.hideControls(false),delay);},
  hideControls(persistent=true){if(State.cameraStatus!=="active")return;State.controlsHidden=true;State.controlsHiddenPersistent=!!persistent;$("cameraStage").classList.add("controlsHidden");$("cameraOptions").classList.remove("open");$("cameraStage")?.classList.remove("optionsOpen");clearTimeout(State.controlsTimer);},
  toggleControls(){if(State.controlsHidden||State.controlsHiddenPersistent){State.controlsHiddenPersistent=false;Camera.touchControls(true);UI.toast("Controles visibles",1100,{placement:"top",tone:"soft"});}else{Camera.hideControls(true);UI.toast("Controles ocultos",1100,{placement:"top",tone:"soft"});}},
  toggleToolTray(){const stage=$("cameraStage"),panel=$("cameraOptions");if(stage?.classList.contains("optionsOpen")){panel?.classList.remove("open");stage.classList.remove("optionsOpen");}State.toolsCollapsed=!State.toolsCollapsed;stage?.classList.toggle("toolsCollapsed",State.toolsCollapsed);$("toolMenuBtn")?.classList.toggle("on",State.toolsCollapsed);Camera.touchControls();UI.toast(State.toolsCollapsed?"Herramientas ocultas":"Herramientas visibles",1300,{placement:"top",tone:"soft"});},
  async shoot(){if(State.cameraStatus!=="active"){const ok=await Camera.start();if(!ok)return;}const captureOrientation=Sensors.captureOrientation();const frame=await Camera.captureFrame(captureOrientation);if(!frame){Sensors.releaseCaptureOrientation();return UI.toast("Cámara aún no está lista");}const captured=TimeTrust.capture();const fresh=State.gps&&Date.now()-(State.gps.receivedAt||State.gps.timestamp)<20000?{...State.gps}:null;const meta=State.liveLocation||{address:"Ubicación pendiente",ubigeo:"UBIGEO pendiente",district:"",department:"",province:""};const rec=Evidence.make(frame,fresh,meta,captured);State.records.unshift(rec);State.lastShotId=rec.id;$("wmCode").textContent=rec.photoCode;Branding.updateVerifier("PENDIENTE");Camera.shotEffect(frame.dataUrl,rec.photoCode);Gallery.updateLastShot(rec);Reports.invalidate();Store.save(rec);Quality.check(rec).then(()=>{});UI.toast("✓ Evidencia capturada",1800,{placement:"top",tone:"soft"});QuickCapture.show(rec);GhostOverlay.close();Camera.touchControls();Places.afterCapture(rec);SmartSectorCoverage.onEvidence(rec);TerritoryPlanner.afterCapture(rec);TeamMissions.render();Jornada.render();Mission.paint();Evidence.finalize(rec).catch(()=>{});Sensors.releaseCaptureOrientation();},
  async burst(){if(State.cameraStatus!=="active")return;UI.toast("Ráfaga · 3 tomas");for(let i=0;i<3;i++){await Camera.shoot();await sleep(260);}}
};

const QuickCapture={
  timer:null,currentId:"",nearby:[],
  show(r){const bar=$("quickCaptureBar");if(!bar)return;QuickCapture.currentId=r.id;QuickCapture.nearby=r.gps?Places.nearbyAll(r.gps,Number(State.settings.nearbyRadiusM||20),r.id):[];$("quickCaptureCode").textContent=r.photoCode||"Evidencia";const ctx=$("quickCaptureContext");const review=$("quickCaptureReview");if(ctx){if(QuickCapture.nearby.length){const first=QuickCapture.nearby[0];ctx.textContent=`📍 ${QuickCapture.nearby.length} antecedente${QuickCapture.nearby.length===1?"":"s"} cerca · primero a ${Math.round(first.distance)} m${first.source==='base'?' · base cargada':''}`;ctx.classList.add("hasNearby");}else{ctx.textContent="Punto nuevo · sin antecedentes cercanos";ctx.classList.remove("hasNearby");}}if(review)review.classList.toggle("isHidden",!QuickCapture.nearby.length);bar.classList.add("show");clearTimeout(QuickCapture.timer);QuickCapture.timer=setTimeout(()=>bar.classList.remove("show"),7800);},
  hide(){$("quickCaptureBar")?.classList.remove("show");clearTimeout(QuickCapture.timer);},
  view(){const id=QuickCapture.currentId;if(!id)return;QuickCapture.hide();UI.setView("Evidence");setTimeout(()=>Viewer.open(id),80);},
  edit(){const id=QuickCapture.currentId;if(!id)return;QuickCapture.hide();UI.setView("Evidence");setTimeout(()=>Editor.open(id),80);},
  review(){const r=State.records.find(x=>x.id===QuickCapture.currentId);if(!r)return;QuickCapture.hide();Places.promptRelation(r,true);}
};

const Evidence = {
  make(frame,gps,meta,captured){const image=frame.dataUrl,d=captured.date,date=Dates.date(d),time=Dates.time(d),rnd=crypto.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0].toString(16).slice(-6).toUpperCase():String(Date.now()).slice(-6),code=`OS-${date.replaceAll("-","")}-${rnd.padStart(6,"0")}`;const heading=State.heading??gps?.heading??null,screenAngle=Number(screen.orientation?.angle??window.orientation??0),deviceOrientation=innerWidth>innerHeight?"Landscape":"Portrait";return{id:crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${rnd}`,photoCode:code,verifyCode:"PENDIENTE",sourceHash:"",stampedHash:"",evidenceHash:"",integrityStatus:"Procesando",integrityVersion:"3.2",createdAt:captured.iso,fecha:date,hora:time,timeSource:captured.source,timeLabel:captured.label,timeOffsetMs:captured.offsetMs,timeSyncAt:captured.syncedAt,timeRttMs:captured.rttMs,timeUncertaintyMs:captured.uncertaintyMs,image,stampedImage:image,sourceWidth:frame.width,sourceHeight:frame.height,aspectRatio:frame.aspect,photoOrientation:frame.width>=frame.height?"Horizontal":"Vertical",captureOrientationKey:frame.orientationKey||"portrait",captureOrientationSide:frame.orientationSide||"",captureOrientationMode:frame.orientationMode||State.settings.orientationMode||"auto",capturePipeline:frame.capturePipeline||"video-preview",captureRotationApplied:Number(frame.rotationApplied||0),cameraFacing:frame.cameraFacing||Camera.detectFacing(),previewMirrored:frame.previewMirrored===true,frontCorrectionApplied:Number(frame.frontCorrectionApplied||0),sourceFrameWidth:frame.sourceFrameWidth||frame.width,sourceFrameHeight:frame.sourceFrameHeight||frame.height,deviceOrientation,screenAngle,cameraLabel:State.currentTrack?.label||"",cameraZoom:State.zoom,hardwareZoom:State.hardwareZoom,watermarkAnchor:LayoutManager.captureAnchor("watermark"),gps,gpsCapturedAt:gps?.timestamp||null,accuracy:gps?.accuracy||"",gpsQuality:gps?.quality||"Pendiente",altitude:gps?.altitude??null,altitudeAccuracy:gps?.altitudeAccuracy??null,heading,cardinal:Sensors.cardinal(heading),address:meta.address||"Ubicación pendiente",addressStructured:meta.addressStructured||"",street:meta.street||"",houseNumber:meta.houseNumber||"",postcode:meta.postcode||"",city:meta.city||"",country:meta.country||"",ubigeo:meta.ubigeo||"UBIGEO pendiente",department:meta.department||"",province:meta.province||"",district:meta.district||"",googleMapsUrl:GPS.maps(gps),electionProcess:State.settings.activeProcess||"ERM",electionType:"",type:State.settings.presetEnabled?(State.settings.presetType||"PENDIENTE"):"PENDIENTE",status:"Activo",party:State.settings.presetEnabled?(State.settings.presetParty||""):"",candidate:State.settings.presetEnabled?(State.settings.presetCandidate||""):"",candidateType:State.settings.presetEnabled?(State.settings.presetCandidateType||""):"",observation:"",placeId:"",placeRelation:"Nueva",previousEvidenceId:"",reviewer:State.settings.reviewer||"",missionId:State.settings.currentMission?.id||"",missionName:State.settings.currentMission?.name||"",teamAssignmentId:State.settings.activeTeamAssignmentId||"",teamMemberId:(State.settings.teamAssignments||[]).find(a=>a.id===State.settings.activeTeamAssignmentId)?.memberId||"",teamSector:(State.settings.teamAssignments||[]).find(a=>a.id===State.settings.activeTeamAssignmentId)?.sector||"",selected:false,updatedAt:d.toISOString()};},
  async sha256(value){try{const bytes=typeof value==="string"?new TextEncoder().encode(value):value,digest=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();}catch(_){return Math.random().toString(16).slice(2).padEnd(64,"0").slice(0,64).toUpperCase();}},
  async imageHash(dataUrl){const base64=String(dataUrl).split(",")[1]||"",bin=atob(base64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return Evidence.sha256(bytes);},
  canonical(r){const g=r.gps||{};return JSON.stringify({photoCode:r.photoCode,createdAt:r.createdAt,timeSource:r.timeSource,latitude:g.latitude??null,longitude:g.longitude??null,accuracy:g.accuracy??null,altitude:r.altitude??null,heading:r.heading??null,imageHash:r.sourceHash});},
  async finalize(rec){if(!rec.sourceHash)rec.sourceHash=await Evidence.imageHash(rec.image);let g=rec.gps;if(!g){g=await GPS.current(6500,true);if(g){rec.gps={...g};rec.gpsCapturedAt=g.timestamp;rec.accuracy=g.accuracy;rec.gpsQuality=g.quality;rec.altitude=g.altitude??null;rec.altitudeAccuracy=g.altitudeAccuracy??null;if(rec.heading==null)rec.heading=g.heading??State.heading??null;rec.cardinal=Sensors.cardinal(rec.heading);rec.googleMapsUrl=GPS.maps(g);}}if(g){const loc=await GPS.reverse(g);Object.assign(rec,loc);}rec.evidenceHash=await Evidence.sha256(Evidence.canonical(rec));rec.verifyCode=rec.evidenceHash.slice(0,12);rec.integrityStatus="SHA-256 local";rec.integrityVersion="3.2";rec.stampedImage=await Watermark.stamp(rec.image,rec);rec.stampedHash=await Evidence.imageHash(rec.stampedImage);await Store.save(rec);if(!rec.placeId)Places.promptRelation(rec);Gallery.updateLastShot(rec);Branding.updateVerifier(rec.verifyCode);if($("viewEvidence")?.classList.contains("active"))Gallery.render();},
  visible(){const now=new Date();let list=[...State.records],days={today:1,week:7,"15d":15,month:31,year:366};if(State.filter!=="all"){const n=days[State.filter]||1;list=list.filter(r=>(now-new Date(r.createdAt))<=n*86400000&&(State.filter!=="today"||Dates.date(new Date(r.createdAt))===Dates.date(now)));}const q=State.search.trim().toLowerCase();if(q)list=list.filter(r=>JSON.stringify([r.party,r.candidate,r.district,r.type,r.observation,r.photoCode,r.verifyCode,r.address]).toLowerCase().includes(q));return list;},
  selected(){return State.records.filter(r=>r.selected);},
  selectedForReport(){const selected=Evidence.selected();return selected.length?selected:Evidence.visible();},
  async verify(r){if(!r?.image)return{ok:false,message:"No existe imagen original"};const imageHash=await Evidence.imageHash(r.image),evidenceHash=await Evidence.sha256(Evidence.canonical({...r,sourceHash:imageHash}));return{ok:imageHash===r.sourceHash&&(!r.evidenceHash||evidenceHash===r.evidenceHash),imageHash,evidenceHash};},
  async migrateLegacy(){let changed=0;for(const r of State.records){if(r.integrityVersion==="3.2"||!r.image)continue;try{r.timeSource=r.timeSource||"LOCAL";r.timeLabel=r.timeLabel||"LOCAL · registro previo";r.altitude=r.altitude??r.gps?.altitude??null;r.altitudeAccuracy=r.altitudeAccuracy??r.gps?.altitudeAccuracy??null;r.heading=r.heading??r.gps?.heading??null;r.cardinal=r.cardinal||Sensors.cardinal(r.heading);r.sourceHash=await Evidence.imageHash(r.image);r.evidenceHash=await Evidence.sha256(Evidence.canonical(r));r.verifyCode=r.evidenceHash.slice(0,12);r.integrityStatus="SHA-256 local · migrado";r.integrityVersion="3.2";r.sourceWidth=r.sourceWidth||0;r.sourceHeight=r.sourceHeight||0;r.aspectRatio=r.aspectRatio||null;r.photoOrientation=r.photoOrientation||"Desconocida";r.deviceOrientation=r.deviceOrientation||"Desconocida";r.stampedImage=await Watermark.stamp(r.image,r);r.stampedHash=await Evidence.imageHash(r.stampedImage);await Store.save(r);changed++;}catch(_){}}if(changed){Gallery.render();if(State.records[0])Gallery.updateLastShot(State.records[0]);UI.toast(`${changed} evidencia${changed===1?"":"s"} actualizada${changed===1?"":"s"} a v3.2`);}}
};



const FieldBases = {
  normalizeHeader(v){return String(v??"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");},
  allActive(){return (State.fieldBases||[]).filter(b=>b.enabled!==false);},
  rows(){return FieldBases.allActive().flatMap(b=>(b.items||[]).map(x=>({...x,baseId:b.id,baseName:b.name})));},
  parseCoords(row){const latKeys=["LATITUD","LAT","GPS_LATITUD"],lonKeys=["LONGITUD","LONG","LON","LNG","GPS_LONGITUD"];let lat=latKeys.map(k=>row[k]).find(v=>v!==undefined&&v!==null&&v!==""),lon=lonKeys.map(k=>row[k]).find(v=>v!==undefined&&v!==null&&v!=="");const ll=row["LAT_LONG"]??row["LATLONG"]??row["GPS"]??row["COORDENADAS"];if((lat==null||lon==null)&&ll){const m=String(ll).match(/(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)/);if(m){lat=m[1];lon=m[2];}}lat=Number(String(lat??"").replace(",","."));lon=Number(String(lon??"").replace(",","."));return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?{latitude:lat,longitude:lon}:null;},
  pick(row,...keys){for(const k of keys){const v=row[k];if(v!==undefined&&v!==null&&String(v).trim()!=="")return String(v).trim();}return "";},
  async importExcel(file){if(!window.ExcelJS)return UI.toast("Conéctate una vez para cargar el motor Excel");const buf=await file.arrayBuffer(),wb=new ExcelJS.Workbook();await wb.xlsx.load(buf);const ws=wb.getWorksheet("EVIDENCIAS")||wb.worksheets[0];if(!ws)return UI.toast("El Excel no contiene hojas legibles");const headers={};ws.getRow(1).eachCell((c,col)=>headers[col]=FieldBases.normalizeHeader(c.text||c.value));const items=[];let withoutGps=0;ws.eachRow((r,n)=>{if(n===1)return;const obj={};r.eachCell({includeEmpty:true},(c,col)=>{const h=headers[col];if(h)obj[h]=c.text||((c.value&&typeof c.value==='object'&&c.value.text)?c.value.text:c.value);});const gps=FieldBases.parseCoords(obj);if(!gps){withoutGps++;return;}items.push({id:`baseitem-${Date.now()}-${n}-${Math.random().toString(16).slice(2)}`,latitude:gps.latitude,longitude:gps.longitude,code:FieldBases.pick(obj,"CODIGO","CODIGO_FOTO","ID","N"),process:FieldBases.pick(obj,"PROCESO","TIPO_ELECCION"),date:FieldBases.pick(obj,"FECHA"),time:FieldBases.pick(obj,"HORA"),address:FieldBases.pick(obj,"UBICACION","DIRECCION"),party:FieldBases.pick(obj,"PARTIDO"),candidate:FieldBases.pick(obj,"CANDIDATO"),type:FieldBases.pick(obj,"TIPO_EVIDENCIA","TIPO"),status:FieldBases.pick(obj,"ESTADO"),district:FieldBases.pick(obj,"DISTRITO"),photo:""});});const base={id:`base-${Date.now()}-${Math.random().toString(16).slice(2)}`,name:file.name.replace(/\.xlsx?$/i,""),sourceFile:file.name,createdAt:new Date().toISOString(),enabled:true,items,withoutGps};State.fieldBases.unshift(base);State.settings.activeFieldBaseId=base.id;Store.saveLite();FieldBases.render();FieldBases.paintStatus();UI.toast(`Base cargada · ${items.length} puntos${withoutGps?` · ${withoutGps} sin GPS`:""}`,3200);},
  nearby(gps,radius=Number(State.settings.nearbyRadiusM||20)){if(!gps||State.settings.nearbyHistoryEnabled===false||State.settings.workMode==="free")return [];return FieldBases.rows().map(x=>({source:"base",item:x,distance:Places.distance(gps,{latitude:x.latitude,longitude:x.longitude})})).filter(x=>x.distance<=radius).sort((a,b)=>a.distance-b.distance);},
  toggle(id){const b=(State.fieldBases||[]).find(x=>x.id===id);if(!b)return;b.enabled=!b.enabled;Store.saveLite();FieldBases.render();FieldBases.paintStatus();},
  remove(id){State.fieldBases=(State.fieldBases||[]).filter(x=>x.id!==id);Store.saveLite();FieldBases.render();FieldBases.paintStatus();},
  render(){const box=$("fieldBaseList");if(!box)return;box.innerHTML=(State.fieldBases||[]).map(b=>`<article class="fieldBaseCard ${b.enabled===false?'off':''}" data-base-id="${esc(b.id)}"><div><b>${esc(b.name)}</b><span>${(b.items||[]).length} puntos · ${new Date(b.createdAt).toLocaleDateString('es-PE')}</span><small>${b.withoutGps||0} filas sin GPS · ${b.enabled===false?'Desactivada':'Activa'}</small></div><div><button data-base-act="toggle">${b.enabled===false?'Activar':'Desactivar'}</button><button data-base-act="delete">Eliminar</button></div></article>`).join('')||'<div class="hint">No hay bases de campo cargadas. Captura Libre sigue disponible.</div>';},
  paintStatus(){const el=$("fieldBaseStatus");if(!el)return;const active=FieldBases.allActive(),pts=active.reduce((n,b)=>n+(b.items||[]).length,0);el.textContent=active.length?`${active.length} base${active.length===1?'':'s'} activa${active.length===1?'':'s'} · ${pts} puntos`:'Sin base activa · captura libre disponible';},
  bind(){$("fieldBaseExcelInput")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)FieldBases.importExcel(f).catch(err=>UI.toast(`No se pudo importar: ${err.message}`,3200));e.target.value="";});$("fieldBaseList")?.addEventListener("click",e=>{const card=e.target.closest('[data-base-id]');if(!card)return;const act=e.target.closest('[data-base-act]')?.dataset.baseAct;if(act==='toggle')FieldBases.toggle(card.dataset.baseId);if(act==='delete')FieldBases.remove(card.dataset.baseId);});}
};

const Jornada = {
  today(){const d=Dates.date();return State.records.filter(r=>r.fecha===d);},
  summary(){const rows=Jornada.today(),rel=k=>rows.filter(r=>String(r.placeRelation||'').toLowerCase()===k.toLowerCase()).length,places=new Set(rows.map(r=>r.placeId).filter(Boolean));return{total:rows.length,stay:rel('Permanece'),modified:rel('Modificada'),removed:rel('Retirada'),places:places.size};},
  render(){const s=Jornada.summary();if($("journeySummary"))$("journeySummary").innerHTML=`<div><b>${s.total}</b><span>capturas hoy</span></div><div><b>${s.stay}</b><span>permanecen</span></div><div><b>${s.modified}</b><span>modificadas</span></div><div><b>${s.removed}</b><span>retiradas</span></div><div><b>${s.places}</b><span>lugares</span></div>`;}
};

const Places = {
  distance(a,b){if(!a||!b)return Infinity;const lat1=Number(a.latitude),lon1=Number(a.longitude),lat2=Number(b.latitude),lon2=Number(b.longitude);if(![lat1,lon1,lat2,lon2].every(Number.isFinite))return Infinity;const R=6371000,p1=lat1*Math.PI/180,p2=lat2*Math.PI/180,dp=(lat2-lat1)*Math.PI/180,dl=(lon2-lon1)*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));},
  records(placeId){return State.records.filter(r=>r.placeId===placeId).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));},
  get(id){return State.places.find(p=>p.id===id);},
  nearest(gps,radius=Number(State.settings.nearbyRadiusM||20)){if(!gps)return null;let best=null;for(const p of State.places){const d=Places.distance(gps,{latitude:p.latitude,longitude:p.longitude});if(d<=radius&&(!best||d<best.distance))best={place:p,distance:d};}return best;},
  code(){const max=State.places.reduce((m,p)=>Math.max(m,Number(String(p.code||'').match(/(\d+)$/)?.[1]||0)),0);return `OS-PNT-${String(max+1).padStart(6,'0')}`;},
  createFromRecord(r,{name,type='Punto de evidencia'}={}){if(!r?.gps)return null;const p={id:crypto.randomUUID?crypto.randomUUID():`place-${Date.now()}-${Math.random().toString(16).slice(2)}`,code:Places.code(),name:name||r.address||'Punto de evidencia',type,latitude:Number(r.gps.latitude),longitude:Number(r.gps.longitude),address:r.address||'',district:r.district||'',province:r.province||'',department:r.department||'',party:r.party||'',firstSeen:r.createdAt||new Date().toISOString(),lastSeen:r.createdAt||new Date().toISOString(),createdAt:new Date().toISOString(),status:'Activo'};State.places.unshift(p);r.placeId=p.id;r.placeRelation=r.placeRelation||'Nueva';Store.saveLite();Store.save(r);return p;},
  async migrate(){let changed=0;if(!Array.isArray(State.places))State.places=[];const records=[...State.records].filter(r=>r.gps).sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));for(const r of records){if(r.placeId&&Places.get(r.placeId))continue;const near=Places.nearest(r.gps,8);if(near){r.placeId=near.place.id;r.placeRelation=r.placeRelation||'Histórica';near.place.lastSeen=r.createdAt||near.place.lastSeen;}else Places.createFromRecord(r,{name:r.address||'Punto histórico'});changed++;}if(changed){await Store.saveBatch(records);Store.saveLite();}return changed;},
  nearbyRecords(gps,radius=Number(State.settings.nearbyRadiusM||20),excludeId=''){return State.records.filter(r=>r.id!==excludeId&&r.gps).map(r=>({source:'local',record:r,distance:Places.distance(gps,r.gps)})).filter(x=>x.distance<=radius).sort((a,b)=>a.distance-b.distance);},
  nearbyAll(gps,radius=Number(State.settings.nearbyRadiusM||20),excludeId=''){if(State.settings.nearbyHistoryEnabled===false||State.settings.workMode==='free')return [];return [...Places.nearbyRecords(gps,radius,excludeId),...FieldBases.nearby(gps,radius)].sort((a,b)=>a.distance-b.distance);},
  afterCapture(r){if(!r?.gps){setTimeout(()=>Places.tryAfterFinalize(r),1800);return;}const near=Places.nearbyAll(r.gps,Number(State.settings.nearbyRadiusM||20),r.id)[0];if(!near){const p=Places.createFromRecord(r);if(p)UI.toast(`Nuevo punto · ${p.code}`,1700,{placement:'top',tone:'soft'});}else{r.placeRelation=r.placeRelation||'Pendiente de revisar';Store.save(r);}},
  tryAfterFinalize(r){const live=State.records.find(x=>x.id===r.id);if(!live?.gps||live.placeId)return;const near=Places.nearbyAll(live.gps,Number(State.settings.nearbyRadiusM||20),live.id)[0];if(!near)Places.createFromRecord(live);else{live.placeRelation=live.placeRelation||'Pendiente de revisar';Store.save(live);}},
  promptRelation(r,forceOpen=false){if(!r?.gps||r.placeId||State.settings.workMode==='free'||State.settings.nearbyHistoryEnabled===false)return;const near=Places.nearbyAll(r.gps,Number(State.settings.nearbyRadiusM||20),r.id)[0];if(!near){if(State.settings.workMode!=='follow'){const p=Places.createFromRecord(r);if(p&&forceOpen)UI.toast(`Nuevo punto · ${p.code}`,1600,{placement:'top',tone:'soft'});}return;}State.pendingRelationId=r.id;State.pendingPreviousId=near.source==='local'?near.record.id:'';State.pendingBaseItem=near.source==='base'?near.item:null;const prev=near.source==='local'?near.record:near.item;$("relationPrevImg").src=near.source==='local'?(prev.stampedImage||prev.image):'oneshot-mark.png';$("relationDistance").textContent=`${Math.round(near.distance)} m · ${prev.electionProcess||prev.process||'Proceso previo'} · ${prev.fecha||prev.date||''}${near.source==='base'?' · Base de campo':''}`;$("relationTitle").textContent=prev.party||prev.type||'Evidencia cercana';$("relationMeta").textContent=`${prev.candidate||'Sin candidato'} · ${prev.type||'Sin tipo'} · ${prev.address||''}`;$("relationModal").classList.add('open');},
  async relate(kind){const r=State.records.find(x=>x.id===State.pendingRelationId),prev=State.records.find(x=>x.id===State.pendingPreviousId),base=State.pendingBaseItem;if(!r)return Places.closeRelation();let p=prev?.placeId?Places.get(prev.placeId):null;if(!p&&prev)p=Places.createFromRecord(prev);if(!p&&base){p={id:crypto.randomUUID?crypto.randomUUID():`place-${Date.now()}`,code:Places.code(),name:base.address||base.party||'Punto histórico importado',type:'Punto histórico',latitude:Number(base.latitude),longitude:Number(base.longitude),address:base.address||'',district:base.district||'',province:'',department:'',party:base.party||'',firstSeen:base.date||new Date().toISOString(),lastSeen:r.createdAt||new Date().toISOString(),createdAt:new Date().toISOString(),status:'Activo',fieldBaseId:base.baseId,historicalCode:base.code||''};State.places.unshift(p);}if(kind==='Nueva'){p=Places.createFromRecord(r,{name:r.address||'Nuevo punto'});r.previousEvidenceId='';r.previousHistoricalKey='';}else if(p){r.placeId=p.id;r.previousEvidenceId=prev?.id||'';r.previousHistoricalKey=base?`${base.baseId}:${base.id}`:'';r.placeRelation=kind;p.lastSeen=r.createdAt||new Date().toISOString();if(kind==='Retirada')p.status='Retirada';if(kind==='Modificada')p.status='Modificada';}await Store.save(r);Store.saveLite();Places.closeRelation();Gallery.render();Places.render();Jornada.render();UI.toast(kind==='Nueva'?'Nueva evidencia independiente':`Seguimiento: ${kind}`,1700,{placement:'top',tone:'soft'});},
  closeRelation(){$("relationModal")?.classList.remove('open');State.pendingRelationId='';State.pendingPreviousId='';State.pendingBaseItem=null;},
  currentPlaceIds(){return new Set(State.records.map(r=>r.placeId).filter(Boolean));},
  currentPlaces(){const ids=Places.currentPlaceIds();return (State.places||[]).filter(p=>ids.has(p.id));},
  orphanPlaces(){const ids=Places.currentPlaceIds();return (State.places||[]).filter(p=>!ids.has(p.id));},
  cleanupOrphans(){const orphans=Places.orphanPlaces();if(!orphans.length)return UI.toast('No hay puntos huérfanos para limpiar');if(!confirm(`¿Eliminar ${orphans.length} punto${orphans.length===1?'':'s'} sin evidencia actual? Las evidencias guardadas no se borrarán.`))return;const keepIds=Places.currentPlaceIds();State.places=(State.places||[]).filter(p=>keepIds.has(p.id));Store.saveLite();Places.render();Radar.close();UI.toast(`✓ ${orphans.length} punto${orphans.length===1?'':'s'} huérfano${orphans.length===1?'':'s'} eliminado${orphans.length===1?'':'s'}`,2200);},
  render(){const box=$("placesList");if(!box)return;const q=String(State.placeSearch||'').toLowerCase(),current=Places.currentPlaces(),memory=State.places||[],source=State.placeMode==='memory'?memory:current,list=source.filter(p=>!q||JSON.stringify([p.code,p.name,p.type,p.address,p.party,p.district]).toLowerCase().includes(q));const orphanCount=Math.max(0,memory.length-current.length);$("placesCount").textContent=State.placeMode==='memory'?`${memory.length} en memoria · ${list.length} visibles`:`${current.length} lugares actuales · ${orphanCount} históricos`;$$('[data-place-mode]').forEach(b=>b.classList.toggle('active',b.dataset.placeMode===State.placeMode));const note=$("placesModeNote");if(note)note.textContent=State.placeMode==='memory'?`Memoria territorial completa · incluye ${orphanCount} punto${orphanCount===1?'':'s'} sin evidencia actual`:`Solo lugares vinculados a las ${State.records.length} evidencia${State.records.length===1?'':'s'} guardada${State.records.length===1?'':'s'}`;const clean=$("placesCleanupBtn");if(clean){clean.hidden=State.placeMode!=='memory'||!orphanCount;clean.textContent=`Limpiar sin evidencia (${orphanCount})`;}box.innerHTML=list.map(p=>{const rs=Places.records(p.id),last=rs[0],counts=[...new Set(rs.map(r=>r.electionProcess).filter(Boolean))].join(' · '),isOrphan=rs.length===0;return `<article class="placeCard ${isOrphan?'placeOrphan':''}" data-place-id="${esc(p.id)}"><div class="placePin">${p.type==='Local partidario'?'🏢':'📍'}</div><div class="placeBody"><div class="placeHead"><b>${esc(p.name||p.code)}</b><code>${esc(p.code)}</code></div><span>${esc(p.address||'Sin dirección')}</span><small>${rs.length} evidencia${rs.length===1?'':'s'}${counts?` · ${esc(counts)}`:''}</small><div class="placeStatus"><em>${isOrphan?'Histórico':esc(p.status||'Activo')}</em>${last?`<span>Última: ${esc(last.fecha||'')}</span>`:'<span>Sin evidencia actual</span>'}</div></div><button data-place-act="open" ${isOrphan?'disabled':''}>${isOrphan?'Solo memoria':'Ver historial'}</button></article>`}).join('')||`<div class="hint">${State.placeMode==='memory'?'No hay puntos en memoria.':'No hay lugares con evidencias actuales.'}</div>`;},
  open(id){const p=Places.get(id),rs=Places.records(id);if(!p)return;$("placeDetailModal").dataset.placeId=p.id;$("placeDetailTitle").textContent=p.name||p.code;$("placeDetailCode").textContent=`${p.code} · ${p.type||'Punto'}`;$("placeDetailMeta").textContent=`${p.address||'Sin dirección'} · ${rs.length} evidencias`;$("placeTimeline").innerHTML=rs.map(r=>`<button class="timelineItem" data-evidence-id="${esc(r.id)}"><img src="${r.stampedImage||r.image}"><div><b>${esc(r.placeRelation||'Registro')}</b><span>${esc(r.fecha||'')} ${esc(r.hora||'')} · ${esc(r.electionProcess||'')}</span><small>${esc(r.party||'Partido pendiente')} · ${esc(r.type||'Tipo pendiente')}</small></div></button>`).join('');$("placeDetailModal").classList.add('open');},
  makeLocal(){const r=State.records.find(x=>x.id===State.pendingRelationId)||State.records[0];if(!r?.gps)return UI.toast('Necesitas una evidencia con GPS para crear el local');const name=prompt('Nombre del local partidario',r.party?`Local partidario · ${r.party}`:'Local partidario');if(name===null)return;const p=Places.createFromRecord(r,{name:name||'Local partidario',type:'Local partidario'});if(p){p.party=r.party||'';Store.saveLite();Places.render();UI.toast('Local partidario guardado');}},
  markLocal(){const id=$("placeDetailModal")?.dataset.placeId,p=Places.get(id);if(!p)return;const rs=Places.records(id),party=rs.find(r=>r.party)?.party||p.party||'';const name=prompt('Nombre del local partidario',p.name&&p.name!=='Punto de evidencia'?p.name:(party?`Local partidario · ${party}`:'Local partidario'));if(name===null)return;p.type='Local partidario';p.name=name||'Local partidario';p.party=party;Store.saveLite();$("placeDetailModal").classList.remove('open');Places.render();UI.toast('Punto guardado como local partidario');},
  bind(){$("placesSearch").oninput=e=>{State.placeSearch=e.target.value;Places.render();};$$('[data-place-mode]').forEach(b=>b.onclick=()=>{State.placeMode=b.dataset.placeMode||'current';Places.render();});$("placesCleanupBtn")?.addEventListener('click',Places.cleanupOrphans);$("placesList").addEventListener('click',e=>{const card=e.target.closest('.placeCard');if(card&&!card.classList.contains('placeOrphan'))Places.open(card.dataset.placeId);});$("placeDetailClose").onclick=()=>$("placeDetailModal").classList.remove('open');$("placeMarkLocalBtn").onclick=Places.markLocal;$("placeTimeline").addEventListener('click',e=>{const b=e.target.closest('[data-evidence-id]');if(b){$("placeDetailModal").classList.remove('open');UI.setView('Evidence');setTimeout(()=>Viewer.open(b.dataset.evidenceId),80);}});$$('[data-relation]').forEach(b=>b.onclick=()=>Places.relate(b.dataset.relation));$("relationClose").onclick=Places.closeRelation;$("relationNewPoint").onclick=()=>Places.relate('Nueva');}
};

const Branding = {
  institutionSrc(){const mode=State.settings.institutionBrand||"oneshot";if(mode==="none"||mode==="oneshot"||mode==="onpe")return "";if(mode==="custom")return State.settings.institutionLogoData||"";return "";},
  verifierChunks(code){const raw=String(code||"PENDIENTE").replace(/[^A-Z0-9]/gi,"").toUpperCase();return (raw.match(/.{1,4}/g)||["PEND","IENT","E"]).slice(0,4);},
  updateVerifier(code){const box=$("wmVerifyChunks");if(box){const raw=String(code||"PENDIENTE").replace(/[^A-Z0-9]/gi,"").toUpperCase();box.textContent=`${raw} · ONE SHOT VERIFIED`;box.title=raw;}},
  apply(){const src=Branding.institutionSrc(),live=$("wmInstitutionLogo"),preview=$("previewInstitutionLogo");for(const img of [live,preview]){if(!img)continue;if(src){img.src=src;img.closest(".wmInstitutionGhost,.previewInstitution")?.classList.remove("hiddenBrand");}else img.closest(".wmInstitutionGhost,.previewInstitution")?.classList.add("hiddenBrand");}const pre=$("watermarkConfigPreview");if(pre){pre.style.setProperty("--previewAccent",State.settings.accentColor||"#2f6bff");pre.style.setProperty("--previewWmScale",String(Number(State.settings.watermarkScale||1)));pre.style.setProperty("--previewWmText",String(Number(State.settings.watermarkTextScale||1)));}},
  async loadCustom(file){if(!file)return;try{if(!/^image\//.test(file.type))throw new Error("Selecciona una imagen");const raw=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(file)}),img=await Watermark.load(raw),max=520,ratio=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement("canvas"),ctx=c.getContext("2d");c.width=Math.max(1,Math.round(img.naturalWidth*ratio));c.height=Math.max(1,Math.round(img.naturalHeight*ratio));ctx.drawImage(img,0,0,c.width,c.height);State.settings.institutionLogoData=c.toDataURL("image/png",.92);State.settings.institutionBrand="custom";Store.saveLite();UI.applyLayout();UI.toast("Logo institucional personalizado guardado");}catch(e){UI.toast(e.message||String(e),3500)}},
  async restampAll(){if(!State.records.length)return UI.toast("No hay evidencias guardadas");if(!confirm(`¿Aplicar la marca actual a ${State.records.length} evidencia${State.records.length===1?"":"s"}? La foto ORIGINAL y su hash no se modifican.`))return;const btn=$("restampAllBtn");if(btn){btn.disabled=true;btn.textContent="Aplicando marca…";}try{let n=0;for(const r of State.records){if(!r.image)continue;r.stampedImage=await Watermark.stamp(r.image,r);r.stampedHash=await Evidence.imageHash(r.stampedImage);await Store.save(r);n++;if(n%4===0)UI.toast(`Marca actualizada ${n}/${State.records.length}`,900);}Gallery.render();Reports.invalidate();UI.toast(`✓ Marca aplicada a ${n} evidencias`,3500);}finally{if(btn){btn.disabled=false;btn.textContent="↻ Aplicar marca a evidencias guardadas";}}}
};

const Maps = {
  openRecord(r){if(!r?.gps)return UI.toast("Esta evidencia todavía no tiene GPS");const url=r.googleMapsUrl||GPS.maps(r.gps);if(!url)return UI.toast("No hay coordenadas para abrir el mapa");const w=window.open(url,"_blank","noopener,noreferrer");if(!w)location.href=url;}
};

const Watermark = {
  async load(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});},
  rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();},
  reticle(ctx,x,y,size){ctx.save();ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(2,size*.07);ctx.beginPath();ctx.arc(x,y,size*.31,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=State.settings.accentColor||"#2f6bff";ctx.lineWidth=Math.max(2,size*.08);[[0,-.5,0,-.25],[0,.25,0,.5],[-.5,0,-.25,0],[.25,0,.5,0]].forEach(a=>{ctx.beginPath();ctx.moveTo(x+a[0]*size,y+a[1]*size);ctx.lineTo(x+a[2]*size,y+a[3]*size);ctx.stroke();});ctx.fillStyle=State.settings.accentColor||"#2f6bff";ctx.beginPath();ctx.arc(x,y,size*.10,0,Math.PI*2);ctx.fill();ctx.restore();},
  wrap(ctx,text,maxWidth,maxLines=2){const words=String(text||"").split(/\s+/),lines=[];let line="";for(const word of words){const test=(line+" "+word).trim();if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;if(lines.length===maxLines-1)break;}else line=test;}if(line&&lines.length<maxLines)lines.push(line);if(lines.join(" ").length<String(text||"").length&&lines.length)lines[lines.length-1]=lines[lines.length-1].replace(/[.…]*$/,"…");return lines;},
  async stamp(src,r){
    const img=await Watermark.load(src),c=document.createElement("canvas"),ctx=c.getContext("2d",{alpha:false});
    c.width=img.naturalWidth;c.height=img.naturalHeight;ctx.drawImage(img,0,0);
    const W=c.width,H=c.height,short=Math.min(W,H),landscape=W>H;
    const scale=Math.max(.72,Math.min(1.55,Number(State.settings.watermarkScale||1)));
    const textScale=Math.max(.78,Math.min(1.55,Number(State.settings.watermarkTextScale||1)));
    const accent=State.settings.accentColor||"#f3c52f";
    const pad=Math.max(18,Math.round(short*.018*scale));
    const safeRight=pad;
    const radius=Math.max(10,Math.round(short*.010*scale));
    const shadow=(a=.72)=>{ctx.shadowColor=`rgba(0,0,0,${a})`;ctx.shadowBlur=Math.max(7,short*.014);ctx.shadowOffsetY=Math.max(2,short*.003)};
    const clearShadow=()=>{ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0};
    const months=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    const days=["Dom.","Lun.","Mar.","Mié.","Jue.","Vie.","Sáb."];
    const [yy,mm,dd]=String(r.fecha||"").split("-").map(v=>Number(v)||0);
    const jsDate=(yy&&mm&&dd)?new Date(yy,mm-1,dd):new Date();
    const prettyDate=`${String(dd||jsDate.getDate()).padStart(2,"0")} de ${months[(mm||jsDate.getMonth()+1)-1]} ${yy||jsDate.getFullYear()}`;
    const weekday=days[jsDate.getDay()]||"";
    const timeText=String(r.hora||"--:--:--").slice(0,5);
    const timeSource="";
    const verifier=String(r.verifyCode||"PENDIENTE").replace(/[^A-Z0-9]/gi,"").toUpperCase();

    // --- readability gradient, kept subtle so evidence remains visible ---
    const gradH=Math.max(landscape?H*.38:H*.34,short*.31);
    const grad=ctx.createLinearGradient(0,H-gradH,0,H);
    grad.addColorStop(0,"rgba(0,0,0,0)");grad.addColorStop(.26,"rgba(0,0,0,.04)");grad.addColorStop(1,"rgba(0,0,0,.55)");
    ctx.fillStyle=grad;ctx.fillRect(0,H-gradH,W,gradH);

    // --- top-left product + institution signature ---
    const topH=Math.max(44,Math.round(short*.052*scale));
    const topW=Math.min(landscape?W*.30:W*.44,Math.max(225,short*.42*scale));
    ctx.fillStyle="rgba(7,11,18,.72)";Watermark.rounded(ctx,pad,pad,topW,topH,radius);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=Math.max(1,short*.0012);ctx.stroke();
    Watermark.reticle(ctx,pad+topH*.48,pad+topH*.50,topH*.50);
    const brandX=pad+topH*.90,brandY=pad+topH*.57;
    ctx.font=`900 ${Math.max(14,topH*.34*textScale)}px system-ui`;shadow(.55);ctx.fillStyle="#5c82ff";ctx.fillText("ONE",brandX,brandY);const oneW=ctx.measureText("ONE").width;ctx.fillStyle="#fff";ctx.fillText(" SHOT",brandX+oneW,brandY);clearShadow();
    ctx.font=`700 ${Math.max(8,topH*.17*textScale)}px system-ui`;ctx.fillStyle="rgba(255,255,255,.72)";ctx.fillText("EVIDENCIA DE CAMPO",brandX,pad+topH*.82);
    const institution=Branding.institutionSrc();
    if(institution){try{
      const li=await Watermark.load(institution),maxW=Math.min(topW*.23,short*.12*scale),maxH=topH*.55,ir=Math.min(maxW/li.naturalWidth,maxH/li.naturalHeight),iw=li.naturalWidth*ir,ih=li.naturalHeight*ir;
      ctx.save();ctx.globalAlpha=.72;ctx.globalCompositeOperation=(State.settings.institutionBrand||"onpe")==="onpe"?"multiply":"source-over";ctx.drawImage(li,pad+topW-iw-pad*.40,pad+(topH-ih)/2,iw,ih);ctx.restore();
    }catch(_){}}

    // --- Timemark-style right verifier: one continuous rotated label, not stacked text ---
    if(State.settings.integrityWatermark){
      const railW=Math.max(42,Math.round(short*.052*scale));
      const railH=Math.min(H*.48,Math.max(short*.40,230));
      const railX=W-safeRight-railW,railY=Math.max(pad+topH+pad,(H-railH)/2);
      ctx.fillStyle="rgba(8,12,18,.58)";Watermark.rounded(ctx,railX,railY,railW,railH,radius);ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=Math.max(1,short*.0011);ctx.stroke();
      const railLabel=`${verifier}  ·  ONE SHOT VERIFIED`;
      ctx.save();ctx.translate(railX+railW*.55,railY+railH-pad*.55);ctx.rotate(-Math.PI/2);
      ctx.textAlign="left";ctx.textBaseline="middle";ctx.font=`700 ${Math.max(11,short*.018*textScale)}px system-ui`;ctx.fillStyle="rgba(255,255,255,.94)";shadow(.45);ctx.fillText(railLabel,0,0);clearShadow();ctx.restore();
      ctx.fillStyle=accent;ctx.fillRect(railX+railW*.24,railY+pad*.55,railW*.52,Math.max(2,short*.0024));
    }

    // --- bottom hierarchy ---
    const availableRight=W-pad-(State.settings.integrityWatermark?Math.max(52,short*.052*scale)+pad*.75:0);
    const maxBottomW=Math.min(landscape?W*.58:W*.82,availableRight-pad);
    const bigTime=Math.max(54,Math.round(short*(landscape?.085:.112)*scale*textScale));
    const dateSize=Math.max(18,Math.round(short*.036*scale*textScale));
    const addrSize=Math.max(17,Math.round(short*.031*scale*textScale));
    const metaSize=Math.max(12,Math.round(short*.020*scale*textScale));
    const codeSize=Math.max(12,Math.round(short*.021*scale*textScale));
    const rowGap=Math.max(8,Math.round(short*.010*scale));
    const addrWidth=maxBottomW;

    // calculate address using actual font before laying out vertical positions
    ctx.font=`560 ${addrSize}px system-ui`;
    const rawAddress=String(r.address||"Ubicación pendiente");
    const addressLines=Watermark.wrap(ctx,rawAddress,addrWidth,3);
    const timeRowH=Math.max(bigTime,dateSize*2.25);
    const addressH=Math.max(addrSize*1.15,addressLines.length*addrSize*1.18);
    const metaH=metaSize*1.35;
    const codeH=codeSize*1.25;
    const totalH=timeRowH+rowGap+addressH+rowGap+metaH+rowGap+codeH;
    const baseY=H-pad-totalH;

    // time + date row
    shadow(.68);ctx.textBaseline="alphabetic";ctx.fillStyle="#fff";ctx.font=`300 ${bigTime}px system-ui`;ctx.fillText(timeText,pad,baseY+bigTime*.88);clearShadow();
    const timeW=ctx.measureText(timeText).width;
    const sepX=pad+timeW+Math.max(12,short*.012*scale);
    ctx.fillStyle=accent;ctx.fillRect(sepX,baseY+bigTime*.11,Math.max(3,short*.0035),bigTime*.82);
    const dateX=sepX+Math.max(13,short*.014*scale);
    shadow(.60);ctx.font=`700 ${dateSize}px system-ui`;ctx.fillStyle="#fff";ctx.fillText(prettyDate,dateX,baseY+timeRowH*.43);ctx.font=`600 ${Math.max(16,dateSize*.92)}px system-ui`;ctx.fillText(weekday,dateX,baseY+timeRowH*.84);clearShadow();

    // address, deliberately separated from time row
    const addrY=baseY+timeRowH+rowGap;
    ctx.font=`560 ${addrSize}px system-ui`;ctx.fillStyle="#fff";shadow(.62);addressLines.forEach((line,i)=>ctx.fillText(line,pad,addrY+addrSize*(1+i*1.18)));clearShadow();

    // technical metadata gets its own quieter row
    const metaY=addrY+addressH+rowGap;
    const gpsText=r.gps?`${Number(r.gps.latitude).toFixed(6)}, ${Number(r.gps.longitude).toFixed(6)} · ±${Math.round(r.gps.accuracy)}m`:`GPS pendiente`;
    ctx.font=`550 ${metaSize}px system-ui`;ctx.fillStyle="rgba(255,255,255,.86)";shadow(.48);ctx.fillText(`GPS ${gpsText}`,pad,metaY+metaSize);clearShadow();

    // code line has its own separator and spacing
    const lineY=metaY+metaH+rowGap*.60;
    ctx.strokeStyle="rgba(255,255,255,.34)";ctx.lineWidth=Math.max(1,short*.0012);ctx.beginPath();ctx.moveTo(pad,lineY);ctx.lineTo(pad+maxBottomW,lineY);ctx.stroke();
    const codeY=lineY+rowGap+codeSize;
    ctx.font=`620 ${codeSize}px system-ui`;ctx.fillStyle="rgba(255,255,255,.90)";shadow(.45);ctx.fillText(`Código de Foto: ${verifier}`,pad,codeY);clearShadow();

    return c.toDataURL("image/jpeg",State.settings.quality==="medium"?.88:.94);
  }};


const CapturePreset={
  paint(){const on=State.settings.presetEnabled===true,b=$("presetActiveBadge");if(!b)return;b.classList.toggle("on",on);b.textContent=on?`⚡ ${State.settings.activeProcess||"ERM"} · ${State.settings.presetParty||"Sin partido"} · ${State.settings.presetCandidate||"Sin candidato"} · ${State.settings.presetType||"PENDIENTE"}`:"Preset desactivado";},
  sync(){State.settings.presetEnabled=$("presetEnabledInput")?.checked===true;State.settings.presetParty=$("presetPartyInput")?.value.trim()||"";State.settings.presetCandidate=$("presetCandidateInput")?.value.trim()||"";State.settings.presetType=$("presetTypeInput")?.value||"PENDIENTE";State.settings.presetCandidateType=$("presetCandidateTypeInput")?.value.trim()||"";Store.saveLite();CapturePreset.paint();}
};

const Mission={
  active(){return State.settings.currentMission||null;},
  start(){const name=$("missionNameInput")?.value.trim()||FieldBases.allActive()[0]?.name||`Jornada ${Dates.date()}`;State.settings.currentMission={id:`mission-${Date.now()}`,name,startedAt:new Date().toISOString(),startCount:State.records.length};Store.saveLite();Mission.paint();UI.toast(`🎯 Misión iniciada · ${name}`,2200,{placement:"top",tone:"soft"});},
  end(){const m=Mission.active();if(!m)return UI.toast("No hay misión activa");m.endedAt=new Date().toISOString();m.endCount=State.records.length;State.settings.lastMission={...m};State.settings.currentMission=null;Store.saveLite();Mission.paint();RouteCoverage.paint();RouteCoverage.renderSummary();Jornada.render();UI.toast(`✓ Misión finalizada · ${m.name}`,2400,{placement:"top",tone:"soft"});},
  paint(){const m=Mission.active(),st=$("missionStatus"),prog=$("missionProgress");if(!st||!prog)return;if(!m){st.textContent="Sin misión activa · puedes capturar normalmente";prog.innerHTML="";return;}const made=Math.max(0,State.records.length-(m.startCount||0)),base=FieldBases.allActive()[0],target=base?.items?.length||0;st.textContent=`ACTIVA · ${m.name}`;prog.innerHTML=`<b>${made}</b><span>capturas en misión</span>${target?`<b>${target}</b><span>antecedentes en base activa</span>`:""}<small>Inicio ${new Date(m.startedAt).toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</small>`;}
};

const GhostOverlay={
  activate(record){if(!record?.image&&!record?.stampedImage)return UI.toast("El antecedente no tiene fotografía disponible");$("ghostOverlayImg").src=record.stampedImage||record.image;$("ghostOverlay").classList.add("show");$("ghostOverlay").setAttribute("aria-hidden","false");Places.closeRelation();UI.setView("Camera");UI.toast("👻 Alinea la escena y dispara · la guía no se guarda",3200,{placement:"top",tone:"soft"});},
  close(){$("ghostOverlay")?.classList.remove("show");$("ghostOverlay")?.setAttribute("aria-hidden","true");}
};


const RouteCoverage={
  map:null,mapTile:null,mapLayers:[],
  history(){return Array.isArray(State.settings.routeHistory)?State.settings.routeHistory:[];},
  active(){return State.settings.currentRoute||null;},
  distance(a,b){if(!a||!b)return 0;const R=6371000,p1=Number(a.latitude)*Math.PI/180,p2=Number(b.latitude)*Math.PI/180,dp=(Number(b.latitude)-Number(a.latitude))*Math.PI/180,dl=(Number(b.longitude)-Number(a.longitude))*Math.PI/180;const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));},
  start(){if(RouteCoverage.active())return UI.toast('Ya hay un recorrido activo');const m=Mission.active(),name=$('routeNameInput')?.value.trim()||m?.name||`Recorrido ${Dates.date()}`;const g=State.gps;State.settings.currentRoute={id:`route-${Date.now()}`,name,missionId:m?.id||'',startedAt:new Date().toISOString(),points:[],startEvidenceCount:State.records.length,lastPointAt:0,distanceM:0,pausedBySystem:false,interruptedAt:'',interruptions:[],lastResumedAt:new Date().toISOString()};Store.saveLite();if(g)RouteCoverage.capture(g,true);RouteCoverage.paint();UI.toast(`🟢 Recorrido iniciado · ${name}`,2200,{placement:'top',tone:'soft'});},
  stop(){const r=RouteCoverage.active();if(!r)return UI.toast('No hay recorrido activo');r.endedAt=new Date().toISOString();r.endEvidenceCount=State.records.length;r.evidenceCount=Math.max(0,r.endEvidenceCount-(r.startEvidenceCount||0));const done={...r};delete done.lastPointAt;State.settings.routeHistory=[done,...RouteCoverage.history()].slice(0,30);State.settings.lastRoute=done;State.settings.currentRoute=null;Store.saveLite();RouteCoverage.paint();RouteCoverage.renderSummary();UI.toast(`✓ Recorrido finalizado · ${(done.distanceM/1000).toFixed(2)} km`,2500,{placement:'top',tone:'soft'});},
  capture(g,force=false){const r=RouteCoverage.active();if(!r||!g||r.pausedBySystem)return;const p={latitude:Number(g.latitude),longitude:Number(g.longitude),accuracy:Number(g.accuracy||0),timestamp:Number(g.timestamp||Date.now())};const last=r.points?.[r.points.length-1];const dist=last?RouteCoverage.distance(last,p):0,elapsed=last?(p.timestamp-Number(last.timestamp||0))/1000:999,minM=Number(State.settings.routeRecordMinM||20),maxS=Number(State.settings.routeRecordMaxSec||25);if(!force&&last&&dist<minM&&elapsed<maxS)return;if(!Array.isArray(r.points))r.points=[];r.points.push(p);if(r.points.length>2500)r.points=r.points.slice(-2500);if(last&&dist<300)r.distanceM=Number(r.distanceM||0)+dist;r.lastPointAt=Date.now();Store.saveLite();RouteCoverage.paint();},
  suspend(reason='app-background'){const r=RouteCoverage.active();if(!r||r.pausedBySystem)return;r.pausedBySystem=true;r.interruptedAt=new Date().toISOString();r.interruptReason=reason;Store.saveLite();RouteCoverage.paint();},
  resume(){const r=RouteCoverage.active();if(!r)return false;if(r.pausedBySystem){const now=new Date(),start=r.interruptedAt?new Date(r.interruptedAt):now;const seconds=Math.max(0,Math.round((now-start)/1000));r.interruptions=Array.isArray(r.interruptions)?r.interruptions:[];r.interruptions.push({from:r.interruptedAt||now.toISOString(),to:now.toISOString(),seconds,reason:r.interruptReason||'app-background'});r.pausedBySystem=false;r.interruptedAt='';r.interruptReason='';r.lastResumedAt=now.toISOString();Store.saveLite();RouteCoverage.paint();UI.toast(`▶ Recorrido reanudado${seconds?` · pausa ${Math.round(seconds/60)} min`:''}`,2400,{placement:'top',tone:'soft'});return true;}return false;},
  recover(){const r=RouteCoverage.active(),banner=$('routeRecoveryBanner');if(!banner)return;if(!r){banner.classList.add('isHidden');return;}banner.classList.remove('isHidden');const t=$('routeRecoveryText'),ints=Array.isArray(r.interruptions)?r.interruptions:[];if(t)t.textContent=`${r.name} · ${(Number(r.distanceM||0)/1000).toFixed(2)} km · ${ints.length} interrupción${ints.length===1?'':'es'}. Solo se cierra al pulsar Finalizar.`;},
  currentEvidence(){const r=RouteCoverage.active();if(!r)return 0;return State.records.filter(x=>x.missionId&&r.missionId&&x.missionId===r.missionId).length||Math.max(0,State.records.length-(r.startEvidenceCount||0));},
  paint(){const r=RouteCoverage.active(),chip=$('routeActiveChip'),status=$('routeStatus'),btn=$('routeStartBtn'),stop=$('routeStopBtn');if(chip){chip.classList.toggle('on',!!r);chip.textContent=r?`🟢 ${r.name}`:'Recorrido inactivo';}if(status){status.innerHTML=r?`<b>${r.pausedBySystem?'⏸ ':''}${esc(r.name)}</b><span>${r.pausedBySystem?'GPS pausado mientras ONE SHOT estuvo fuera de pantalla · ':''}${(Number(r.distanceM||0)/1000).toFixed(2)} km · ${(r.points||[]).length} puntos GPS · ${RouteCoverage.currentEvidence()} evidencias</span>`:'<b>Sin recorrido activo</b><span>Inicia uno para registrar por dónde ya pasaste. El recorrido solo finaliza cuando tú pulses Finalizar.</span>';RouteCoverage.recover();}if(btn)btn.disabled=!!r;if(stop)stop.disabled=!r;},
  selected(){const filter=$('coveragePeriod')?.value||'today',now=new Date(),today=Dates.date(now);let routes=[];const active=RouteCoverage.active();if(active)routes.push(active);routes.push(...RouteCoverage.history());if(filter==='today')routes=routes.filter(r=>String(r.startedAt||'').slice(0,10)===today);else if(filter==='mission'){const mid=Mission.active()?.id||State.settings.lastMission?.id||'';routes=mid?routes.filter(r=>r.missionId===mid):routes.slice(0,1);}else if(filter==='last')routes=routes.slice(0,1);return routes;},
  renderSummary(){const box=$('routeHistoryList');if(!box)return;const hist=RouteCoverage.history().slice(0,8);box.innerHTML=hist.map(r=>`<button class="routeHistoryItem" data-route-id="${esc(r.id)}"><b>${esc(r.name)}</b><span>${String(r.startedAt||'').slice(0,10)} · ${(Number(r.distanceM||0)/1000).toFixed(2)} km · ${r.evidenceCount||0} evidencias</span></button>`).join('')||'<div class="hint">Aún no hay recorridos finalizados.</div>';},
  openMap(){const modal=$('coverageModal'),c=$('coverageCanvas');if(!modal)return;modal.classList.add('open');setTimeout(()=>{RouteCoverage.drawRealMap();if(c)RouteCoverage.draw(c);},100);},
  closeMap(){$('coverageModal')?.classList.remove('open');},
  drawRealMap(){const el=$('coverageRealMap');if(!el)return;const routes=RouteCoverage.selected(),pts=routes.flatMap(r=>r.points||[]).filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))),ev=Evidence.visible().filter(r=>r.gps);if(!window.L){$('coverageMapFallback')?.classList.remove('isHidden');return;}if(!RouteCoverage.map){RouteCoverage.map=L.map(el,{zoomControl:true,attributionControl:true}).setView(State.gps?[State.gps.latitude,State.gps.longitude]:[-12.0731,-77.0365],15);RouteCoverage.mapTile=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'}).addTo(RouteCoverage.map);RouteCoverage.mapTile.on('tileerror',()=>{$('coverageMapFallback')?.classList.remove('isHidden')});}RouteCoverage.mapLayers.forEach(x=>{try{RouteCoverage.map.removeLayer(x)}catch(_){}});RouteCoverage.mapLayers=[];for(const r of routes){const ps=(r.points||[]).filter(p=>Number.isFinite(Number(p.latitude)));if(ps.length>1)RouteCoverage.mapLayers.push(L.polyline(ps.map(p=>[p.latitude,p.longitude]),{color:'#2979ff',weight:5,opacity:.9}).addTo(RouteCoverage.map));}for(const r of ev){RouteCoverage.mapLayers.push(L.circleMarker([r.gps.latitude,r.gps.longitude],{radius:6,color:'#7a5600',weight:1,fillColor:'#f7c948',fillOpacity:1}).addTo(RouteCoverage.map));}const ssc=SmartSectorCoverage.data?.();if(ssc?.polygon?.length)RouteCoverage.mapLayers.push(L.polygon(ssc.polygon.map(p=>[p.latitude,p.longitude]),{color:'#ef4444',weight:3,fillColor:'#ef4444',fillOpacity:.04,dashArray:'8 6'}).addTo(RouteCoverage.map));const sr=SmartRoute.route?.();if(sr){const cells=(sr.cellIds||[]).slice(Number(sr.index||0)).map(id=>SmartRoute.cellById(id)).filter(Boolean);if(cells.length){const start=SmartSectorCoverage.validGps(State.gps)?[State.gps.latitude,State.gps.longitude]:[cells[0].latitude,cells[0].longitude];RouteCoverage.mapLayers.push(L.polyline([start,...cells.map(c=>[c.latitude,c.longitude])],{color:'#7c3aed',weight:4,opacity:.8,dashArray:'8 7'}).addTo(RouteCoverage.map));}}if(State.gps)RouteCoverage.mapLayers.push(L.circleMarker([State.gps.latitude,State.gps.longitude],{radius:7,color:'#2f78ff',weight:4,fillColor:'#fff',fillOpacity:1}).addTo(RouteCoverage.map));const all=[...pts,...ev.map(x=>x.gps),...(ssc?.polygon||[])];if(all.length){const bounds=L.latLngBounds(all.map(p=>[Number(p.latitude),Number(p.longitude)]));RouteCoverage.map.fitBounds(bounds,{padding:[25,25],maxZoom:18});}setTimeout(()=>RouteCoverage.map.invalidateSize(),80);const total=routes.reduce((a,r)=>a+Number(r.distanceM||0),0);if($('coverageLegend'))$('coverageLegend').textContent=`${(total/1000).toFixed(2)} km · ${pts.length} puntos GPS · ${ev.length} evidencias · azul recorrido · amarillo evidencia · rojo perímetro · violeta ruta pendiente`;},
  draw(c){const ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#071326';ctx.fillRect(0,0,w,h);const routes=RouteCoverage.selected(),pts=routes.flatMap(r=>r.points||[]).filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)));const ev=Evidence.visible().filter(r=>r.gps);if(!pts.length){ctx.fillStyle='#fff';ctx.font='24px system-ui';ctx.fillText('Sin recorrido GPS para este filtro',40,70);if($('coverageLegend'))$('coverageLegend').textContent='Inicia un recorrido para visualizar cobertura.';return;}const all=[...pts,...ev.map(r=>r.gps)],lat0=all.reduce((a,p)=>a+Number(p.latitude),0)/all.length,lon0=all.reduce((a,p)=>a+Number(p.longitude),0)/all.length,mLon=111320*Math.cos(lat0*Math.PI/180),xy=all.map(p=>({x:(Number(p.longitude)-lon0)*mLon,y:(Number(p.latitude)-lat0)*111320})),xs=xy.map(p=>p.x),ys=xy.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),pad=55,s=Math.min((w-pad*2)/Math.max(80,maxX-minX),(h-pad*2)/Math.max(80,maxY-minY));const proj=p=>({x:w/2+(Number(p.longitude)-lon0)*mLon*s,y:h/2-(Number(p.latitude)-lat0)*111320*s});
    // heat/cobertura: círculos translúcidos sobre puntos de recorrido
    for(const p of pts){const q=proj(p);const grad=ctx.createRadialGradient(q.x,q.y,2,q.x,q.y,22);grad.addColorStop(0,'rgba(47,107,255,.24)');grad.addColorStop(1,'rgba(47,107,255,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(q.x,q.y,22,0,Math.PI*2);ctx.fill();}
    // trazas por recorrido
    ctx.lineWidth=5;ctx.lineCap='round';ctx.strokeStyle='rgba(95,170,255,.9)';for(const r of routes){const ps=(r.points||[]).filter(p=>Number.isFinite(Number(p.latitude)));if(ps.length<2)continue;ctx.beginPath();ps.forEach((p,i)=>{const q=proj(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke();}
    // hallazgos
    for(const r of ev){const q=proj(r.gps);ctx.fillStyle='#f7c948';ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=2;ctx.stroke();}
    if(State.gps){const q=proj(State.gps);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,9,0,Math.PI*2);ctx.fill();}
    const total=routes.reduce((a,r)=>a+Number(r.distanceM||0),0),uniqueEv=ev.length;if($('coverageLegend'))$('coverageLegend').textContent=`${(total/1000).toFixed(2)} km registrados · ${pts.length} puntos de ruta · ${uniqueEv} hallazgos visibles · azul cobertura/ruta · amarillo evidencia · blanco tú`;
  }
};


const TerritoryPlanner={
  campaigns(){return Array.isArray(State.settings.plannerCampaigns)?State.settings.plannerCampaigns:[];},
  active(){const id=State.settings.activePlannerId||'';return TerritoryPlanner.campaigns().find(x=>x.id===id)||null;},
  route(){return State.settings.plannerRoute||null;},
  pointDistance(a,b){return RouteCoverage.distance({latitude:a.latitude,longitude:a.longitude},{latitude:b.latitude,longitude:b.longitude});},
  weekLabel(){const d=new Date(),onejan=new Date(d.getFullYear(),0,1),week=Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7);return `SEMANA ${String(week).padStart(2,'0')}`;},
  sourcePoints(){
    const raw=[];
    for(const x of FieldBases.rows())raw.push({source:'base',sourceId:`${x.baseId}:${x.id}`,latitude:Number(x.latitude),longitude:Number(x.longitude),address:x.address||'',party:x.party||'',candidate:x.candidate||'',type:x.type||'',process:x.process||'',date:x.date||'',district:x.district||'',code:x.code||''});
    for(const p of Places.currentPlaces())raw.push({source:'local',sourceId:p.id,latitude:Number(p.latitude),longitude:Number(p.longitude),address:p.address||p.name||'',party:p.party||'',candidate:'',type:p.type||'Punto de evidencia',process:'',date:p.lastSeen||p.firstSeen||'',district:p.district||'',code:p.code||''});
    const out=[];
    for(const p of raw){if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))continue;const near=out.find(q=>TerritoryPlanner.pointDistance(p,q)<=12);if(near){if(!near.party&&p.party)near.party=p.party;if(!near.address&&p.address)near.address=p.address;near.sources=(near.sources||1)+1;continue;}out.push({...p,id:`tp-${Date.now()}-${out.length}-${Math.random().toString(16).slice(2)}`,status:'pending',sector:'S-01',reviewedAt:'',reviewer:'',evidenceId:'',sources:1});}
    return out;
  },
  sectorize(points,count){if(!points.length)return points;const n=Math.max(1,Number(count||4)),cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),lats=points.map(p=>p.latitude),lons=points.map(p=>p.longitude),minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons),latSpan=Math.max(.000001,maxLat-minLat),lonSpan=Math.max(.000001,maxLon-minLon);for(const p of points){let cx=Math.min(cols-1,Math.floor((p.longitude-minLon)/lonSpan*cols)),ry=Math.min(rows-1,Math.floor((maxLat-p.latitude)/latSpan*rows)),idx=Math.min(n-1,ry*cols+cx);p.sector=`S-${String(idx+1).padStart(2,'0')}`;}return points;},
  create(){const points=TerritoryPlanner.sourcePoints();if(!points.length)return UI.toast('Carga una Base de Campo o registra lugares con GPS antes de crear el plan',3200);const name=$('plannerNameInput')?.value.trim()||`${$('plannerDistrictInput')?.value.trim()||'TERRITORIO'} · ${TerritoryPlanner.weekLabel()}`,district=$('plannerDistrictInput')?.value.trim()||'',assignee=$('plannerAssigneeInput')?.value.trim()||State.settings.reviewer||'',sectorCount=Number($('plannerSectorCount')?.value||4);TerritoryPlanner.sectorize(points,sectorCount);const c={id:`planner-${Date.now()}`,name,district,assignee,sectorCount,createdAt:new Date().toISOString(),points};State.settings.plannerCampaigns=[c,...TerritoryPlanner.campaigns()].slice(0,20);State.settings.activePlannerId=c.id;State.settings.plannerRoute=null;Store.saveLite();TerritoryPlanner.render();UI.toast(`🧭 Plan creado · ${points.length} puntos · ${sectorCount} sectores`,2800,{placement:'top',tone:'soft'});},
  filteredPoints(c=TerritoryPlanner.active()){if(!c)return[];const sector=$('plannerSectorFilter')?.value||'all';return (c.points||[]).filter(p=>sector==='all'||p.sector===sector);},
  pending(c=TerritoryPlanner.active()){return TerritoryPlanner.filteredPoints(c).filter(p=>!['reviewed','retired','closed'].includes(p.status));},
  setActive(id){if(!TerritoryPlanner.campaigns().some(x=>x.id===id))return;State.settings.activePlannerId=id;State.settings.plannerRoute=null;Store.saveLite();TerritoryPlanner.render();},
  sectorStats(c){const map={};for(const p of c?.points||[]){const s=p.sector||'S-01';map[s]??={total:0,reviewed:0,pending:0};map[s].total++;if(['reviewed','retired','closed'].includes(p.status))map[s].reviewed++;else map[s].pending++;}return map;},
  buildRoute(){const c=TerritoryPlanner.active();if(!c)return UI.toast('Primero crea o activa una campaña territorial');let pts=TerritoryPlanner.pending(c);if(!pts.length)return UI.toast('No quedan puntos pendientes en este filtro');const max=Math.max(1,Number($('plannerMaxPoints')?.value||40)),strategy=$('plannerStrategy')?.value||'nearest';if(strategy==='oldest')pts.sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999')));else if(strategy==='sector')pts.sort((a,b)=>String(a.sector).localeCompare(String(b.sector))||String(a.address).localeCompare(String(b.address)));else{const rest=[...pts],ordered=[];let cur=State.gps?{latitude:Number(State.gps.latitude),longitude:Number(State.gps.longitude)}:rest[0];while(rest.length&&ordered.length<max){rest.sort((a,b)=>TerritoryPlanner.pointDistance(cur,a)-TerritoryPlanner.pointDistance(cur,b));const n=rest.shift();ordered.push(n);cur=n;}pts=ordered;}pts=pts.slice(0,max);State.settings.plannerRoute={id:`pr-${Date.now()}`,campaignId:c.id,createdAt:new Date().toISOString(),pointIds:pts.map(p=>p.id),index:0,skipped:[]};Store.saveLite();TerritoryPlanner.render();UI.toast(`🚗 Ruta generada · ${pts.length} puntos pendientes`,2300,{placement:'top',tone:'soft'});},
  currentRoutePoint(){const c=TerritoryPlanner.active(),r=TerritoryPlanner.route();if(!c||!r||r.campaignId!==c.id)return null;const id=r.pointIds?.[r.index||0];return (c.points||[]).find(p=>p.id===id)||null;},
  routeNext(){const r=TerritoryPlanner.route();if(!r)return;const max=r.pointIds?.length||0;r.index=Math.min(max,Number(r.index||0)+1);if(r.index>=max){UI.toast('✓ Ruta completada',2000,{placement:'top',tone:'soft'});State.settings.plannerRoute=null;}Store.saveLite();TerritoryPlanner.render();},
  markReviewed(){const p=TerritoryPlanner.currentRoutePoint(),c=TerritoryPlanner.active();if(!p||!c)return;p.status='reviewed';p.reviewedAt=new Date().toISOString();p.reviewer=c.assignee||State.settings.reviewer||'';Store.saveLite();TerritoryPlanner.routeNext();},
  skip(){const r=TerritoryPlanner.route(),p=TerritoryPlanner.currentRoutePoint();if(!r||!p)return;r.skipped=Array.isArray(r.skipped)?r.skipped:[];r.skipped.push(p.id);TerritoryPlanner.routeNext();},
  closeRoute(){State.settings.plannerRoute=null;Store.saveLite();TerritoryPlanner.render();UI.toast('Ruta cerrada · los pendientes se conservan');},
  navigate(){const p=TerritoryPlanner.currentRoutePoint();if(!p)return UI.toast('No hay siguiente punto');window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.latitude},${p.longitude}`)}`,'_blank','noopener');},
  afterCapture(rec){const c=TerritoryPlanner.active();if(!c||!rec?.gps)return;const candidates=(c.points||[]).filter(p=>!['reviewed','retired','closed'].includes(p.status)).map(p=>({p,d:TerritoryPlanner.pointDistance(rec.gps,p)})).filter(x=>x.d<=25).sort((a,b)=>a.d-b.d);if(!candidates.length)return;const hit=candidates[0].p;hit.status='reviewed';hit.reviewedAt=rec.createdAt||new Date().toISOString();hit.reviewer=c.assignee||State.settings.reviewer||'';hit.evidenceId=rec.id;rec.plannerCampaignId=c.id;rec.plannerPointId=hit.id;Store.save(rec);Store.saveLite();TerritoryPlanner.render();UI.toast(`✓ Punto ${hit.sector} revisado · ${Math.round(candidates[0].d)} m`,2200,{placement:'top',tone:'soft'});},
  exportPackage(){const c=TerritoryPlanner.active();if(!c)return UI.toast('No hay campaña activa para exportar');const payload={app:'ONE SHOT',kind:'territory-progress',version:'5.0',exportedAt:new Date().toISOString(),campaign:c,routeHistory:RouteCoverage.history()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ONE_SHOT_AVANCE_${(c.name||'TERRITORIO').replace(/[^a-z0-9]+/gi,'_')}_${Dates.date()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);},
  async importPackage(file){try{const raw=JSON.parse(await file.text()),incoming=raw.campaign;if(!incoming?.points?.length)throw new Error('El archivo no contiene una campaña territorial válida');let c=TerritoryPlanner.campaigns().find(x=>x.id===incoming.id)||TerritoryPlanner.campaigns().find(x=>x.name===incoming.name);if(!c){c=incoming;State.settings.plannerCampaigns=[c,...TerritoryPlanner.campaigns()];}else{for(const ip of incoming.points){let p=(c.points||[]).find(x=>x.id===ip.id)||(c.points||[]).find(x=>TerritoryPlanner.pointDistance(x,ip)<=8);if(!p){c.points.push(ip);continue;}const rank={pending:0,new:1,reviewed:2,retired:3,closed:4};if((rank[ip.status]||0)>=(rank[p.status]||0))Object.assign(p,{status:ip.status,reviewedAt:ip.reviewedAt||p.reviewedAt,reviewer:ip.reviewer||p.reviewer,evidenceId:ip.evidenceId||p.evidenceId});}}State.settings.activePlannerId=c.id;Store.saveLite();TerritoryPlanner.render();UI.toast(`✓ Avance fusionado · ${incoming.points.length} puntos`,2600,{placement:'top',tone:'soft'});}catch(e){UI.toast(`No se pudo importar avance: ${e.message}`,3600);}},
  pointStatusLabel(p){return p.status==='reviewed'?'Revisado':p.status==='retired'?'Retirado':p.status==='new'?'Nuevo':'Pendiente';},
  draw(){const c=TerritoryPlanner.active(),canvas=$('plannerCanvas');if(!c||!canvas)return;const pts=TerritoryPlanner.filteredPoints(c).filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#071326';ctx.fillRect(0,0,w,h);if(!pts.length){ctx.fillStyle='#fff';ctx.font='22px system-ui';ctx.fillText('Sin puntos para el sector seleccionado',36,60);return;}const lats=pts.map(p=>p.latitude),lons=pts.map(p=>p.longitude),minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons),pad=54,latSpan=Math.max(.00002,maxLat-minLat),lonSpan=Math.max(.00002,maxLon-minLon),proj=p=>({x:pad+(p.longitude-minLon)/lonSpan*(w-pad*2),y:pad+(maxLat-p.latitude)/latSpan*(h-pad*2)});ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;for(let i=1;i<6;i++){ctx.beginPath();ctx.moveTo(pad,(h/6)*i);ctx.lineTo(w-pad,(h/6)*i);ctx.stroke();ctx.beginPath();ctx.moveTo((w/6)*i,pad);ctx.lineTo((w/6)*i,h-pad);ctx.stroke();}const route=TerritoryPlanner.route();if(route?.campaignId===c.id){const rpts=(route.pointIds||[]).map(id=>pts.find(p=>p.id===id)).filter(Boolean);if(rpts.length>1){ctx.strokeStyle='rgba(91,164,255,.72)';ctx.lineWidth=4;ctx.beginPath();rpts.forEach((p,i)=>{const q=proj(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke();}}for(const p of pts){const q=proj(p);ctx.fillStyle=p.status==='reviewed'?'#22c55e':p.status==='retired'?'#ef4444':p.status==='new'?'#f59e0b':'#8aa0bf';ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=2;ctx.stroke();}if(State.gps){const q=proj({latitude:Number(State.gps.latitude),longitude:Number(State.gps.longitude)});ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,9,0,Math.PI*2);ctx.fill();}const pending=pts.filter(p=>!['reviewed','retired','closed'].includes(p.status)).length;if($('plannerLegend'))$('plannerLegend').textContent=`${pts.length} puntos visibles · ${pending} pendientes · verde revisado · gris pendiente · rojo retirado · amarillo nuevo · línea azul ruta sugerida`;},
  render(){const c=TerritoryPlanner.active(),empty=$('plannerEmpty'),work=$('plannerWorkspace');if(!empty||!work)return;empty.classList.toggle('isHidden',!!c);work.classList.toggle('isHidden',!c);if(!c)return;const pts=c.points||[],reviewed=pts.filter(p=>['reviewed','retired','closed'].includes(p.status)).length,pending=pts.length-reviewed,newN=pts.filter(p=>p.status==='new').length;$('plannerTotalKpi').textContent=pts.length;$('plannerReviewedKpi').textContent=reviewed;$('plannerPendingKpi').textContent=pending;$('plannerNewKpi').textContent=newN;const sectors=TerritoryPlanner.sectorStats(c),filter=$('plannerSectorFilter');if(filter){const current=filter.value;filter.innerHTML='<option value="all">Todos</option>'+Object.keys(sectors).sort().map(s=>`<option value="${s}">${s}</option>`).join('');filter.value=Object.prototype.hasOwnProperty.call(sectors,current)?current:'all';}const board=$('plannerSectorBoard');if(board)board.innerHTML=Object.entries(sectors).sort().map(([s,v])=>`<button type="button" class="plannerSectorCard ${filter?.value===s?'active':''}" data-planner-sector="${s}"><b>${s}</b><span>${v.reviewed}/${v.total} revisados · ${v.pending} pendientes</span><div class="plannerSectorBar"><i style="width:${v.total?Math.round(v.reviewed/v.total*100):0}%"></i></div></button>`).join('');const visible=TerritoryPlanner.filteredPoints(c);const list=$('plannerPointList');if(list)list.innerHTML=visible.slice(0,180).map(p=>`<article class="plannerPoint ${esc(p.status)}"><span class="plannerPointDot"></span><div><strong>${esc(p.address||p.code||'Punto sin dirección')}</strong><small>${esc(p.sector)} · ${esc(p.party||'Sin partido')} · ${esc(p.type||'Evidencia')} ${p.reviewer?`· ${esc(p.reviewer)}`:''}</small></div><em>${TerritoryPlanner.pointStatusLabel(p)}</em></article>`).join('');const r=TerritoryPlanner.route(),next=TerritoryPlanner.currentRoutePoint(),card=$('plannerNextCard');card?.classList.toggle('isHidden',!next);if(next){$('plannerRouteProgress').textContent=`${Number(r.index||0)+1} / ${r.pointIds.length}`;$('plannerNextAddress').textContent=next.address||next.code||'Punto pendiente';const dist=State.gps?TerritoryPlanner.pointDistance(State.gps,next):null;$('plannerNextMeta').textContent=`${next.sector} · ${next.party||'Sin partido'} · ${next.type||'Evidencia'}${dist!=null?` · ${Math.round(dist)} m desde tu GPS`:''}`;}TerritoryPlanner.draw();},
  bind(){$('plannerCreateBtn')?.addEventListener('click',TerritoryPlanner.create);$('plannerBuildRouteBtn')?.addEventListener('click',TerritoryPlanner.buildRoute);$('plannerNavigateBtn')?.addEventListener('click',TerritoryPlanner.navigate);$('plannerReviewedBtn')?.addEventListener('click',TerritoryPlanner.markReviewed);$('plannerSkipBtn')?.addEventListener('click',TerritoryPlanner.skip);$('plannerCloseRouteBtn')?.addEventListener('click',TerritoryPlanner.closeRoute);$('plannerExportBtn')?.addEventListener('click',TerritoryPlanner.exportPackage);$('plannerImportInput')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)TerritoryPlanner.importPackage(f);e.target.value='';});$('plannerSectorFilter')?.addEventListener('change',TerritoryPlanner.render);$('plannerStrategy')?.addEventListener('change',TerritoryPlanner.render);$('plannerSectorBoard')?.addEventListener('click',e=>{const b=e.target.closest('[data-planner-sector]');if(!b)return;$('plannerSectorFilter').value=b.dataset.plannerSector;TerritoryPlanner.render();});}
};


const SmartSectorCoverage={
  map:null,tile:null,polygonLayer:null,routeLayer:null,currentMarker:null,cellLayer:null,evidenceLayer:null,drawLayer:null,drawing:false,drawPoints:[],
  data(){return State.settings.smartSectorCoverage||null;},
  ensureData(){if(!State.settings.smartSectorCoverage)State.settings.smartSectorCoverage={id:`ssc-${Date.now()}`,name:'SECTOR DE CAMPO',district:'',assignee:State.settings.reviewer||'',polygon:[],cells:[],gridSizeM:40,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return State.settings.smartSectorCoverage;},
  validGps(g){return g&&Number.isFinite(Number(g.latitude))&&Number.isFinite(Number(g.longitude));},
  boundsCenter(poly){if(!poly?.length)return null;return{latitude:poly.reduce((a,p)=>a+Number(p.latitude),0)/poly.length,longitude:poly.reduce((a,p)=>a+Number(p.longitude),0)/poly.length};},
  pointInPolygon(lat,lon,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const yi=Number(poly[i].latitude),xi=Number(poly[i].longitude),yj=Number(poly[j].latitude),xj=Number(poly[j].longitude);const hit=((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/((yj-yi)||1e-12)+xi);if(hit)inside=!inside;}return inside;},
  sectorShape(n){n=Number(n||4);if(n===6)return[2,3];if(n===8)return[2,4];if(n===9)return[3,3];return[2,2];},
  generateGrid(){const d=SmartSectorCoverage.data();if(!d?.polygon?.length)return;const poly=d.polygon,center=SmartSectorCoverage.boundsCenter(poly),mLat=111320,mLon=111320*Math.cos(center.latitude*Math.PI/180),grid=Math.max(20,Math.min(100,Number(d.gridSizeM||40))),lats=poly.map(p=>p.latitude),lons=poly.map(p=>p.longitude),minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons),dLat=grid/mLat,dLon=grid/mLon;const cols=Math.max(1,Math.ceil((maxLon-minLon)/dLon)),rows=Math.max(1,Math.ceil((maxLat-minLat)/dLat)),[sr,sc]=SmartSectorCoverage.sectorShape($('plannerSectorCount')?.value||4),cells=[];let id=0;for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){const lat=minLat+(r+.5)*dLat,lon=minLon+(c+.5)*dLon;if(!SmartSectorCoverage.pointInPolygon(lat,lon,poly))continue;const rr=Math.min(sr-1,Math.floor(r/Math.max(1,rows/sr))),cc=Math.min(sc-1,Math.floor(c/Math.max(1,cols/sc))),sector=`S-${String(rr*sc+cc+1).padStart(2,'0')}`;cells.push({id:`cell-${++id}`,latitude:lat,longitude:lon,dLat,dLon,sector,status:'pending',coveredAt:'',coveredBy:'',evidenceCount:0});}}d.cells=cells;d.updatedAt=new Date().toISOString();Store.saveLite();SmartSectorCoverage.render();},
  stats(){const d=SmartSectorCoverage.data(),cells=d?.cells||[],valid=cells.filter(c=>c.status!=='inaccessible'),covered=valid.filter(c=>c.status==='covered'||c.status==='evidence'||c.status==='verified'),ev=valid.filter(c=>c.evidenceCount>0);return{total:valid.length,covered:covered.length,pending:Math.max(0,valid.length-covered.length),evidence:ev.length,pct:valid.length?Math.round(covered.length/valid.length*100):0};},
  markNear(g,kind='covered'){const d=SmartSectorCoverage.data();if(!d?.cells?.length||!SmartSectorCoverage.validGps(g))return false;const acc=Number(g.accuracy||0);if(acc>55&&kind!=='evidence')return false;let changed=false;const radius=Math.max(28,Number(d.gridSizeM||40)*.78);for(const c of d.cells){const dist=RouteCoverage.distance({latitude:c.latitude,longitude:c.longitude},g);if(dist<=radius){if(c.status==='pending')c.status=kind==='evidence'?'evidence':'covered';if(kind==='evidence'){c.status='evidence';c.evidenceCount=Number(c.evidenceCount||0)+1;}if(!c.coveredAt)c.coveredAt=new Date().toISOString();c.coveredBy=d.assignee||State.settings.reviewer||'';changed=true;}}if(changed){d.updatedAt=new Date().toISOString();Store.saveLite();SmartSectorCoverage.render(false);}return changed;},
  onGps(g){const d=SmartSectorCoverage.data();if(!d?.polygon?.length||!RouteCoverage.active())return;SmartSectorCoverage.markNear(g,'covered');SmartSectorCoverage.paintCurrent(g);SmartSectorCoverage.paintRoute();if(typeof SmartRoute!=='undefined')SmartRoute.onGps(g);},
  onEvidence(r){if(!r?.gps)return;SmartSectorCoverage.markNear(r.gps,'evidence');},
  initMap(){const el=$('sscMap');if(!el)return false;if(!window.L){el.classList.add('noMap');$('sscMapFallback')?.classList.remove('isHidden');return false;}if(SmartSectorCoverage.map){setTimeout(()=>SmartSectorCoverage.map.invalidateSize(),80);return true;}const fallback=State.gps&&SmartSectorCoverage.validGps(State.gps)?[State.gps.latitude,State.gps.longitude]:[-12.0731,-77.0365];const map=L.map(el,{zoomControl:true,attributionControl:true}).setView(fallback,15);SmartSectorCoverage.map=map;try{SmartSectorCoverage.tile=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'}).addTo(map);SmartSectorCoverage.tile.on('tileerror',()=>{$('sscMapFallback')?.classList.remove('isHidden')});}catch(_){$('sscMapFallback')?.classList.remove('isHidden')}map.on('click',e=>{if(!SmartSectorCoverage.drawing)return;SmartSectorCoverage.drawPoints.push({latitude:e.latlng.lat,longitude:e.latlng.lng});SmartSectorCoverage.paintDraft();});setTimeout(()=>map.invalidateSize(),120);return true;},
  startDraw(){SmartSectorCoverage.initMap();SmartSectorCoverage.drawing=true;SmartSectorCoverage.drawPoints=[];$('smartSectorCard')?.classList.add('sscDrawing');$('sscFinishDrawBtn').disabled=false;UI.toast('Toca el mapa siguiendo el borde del sector. Mínimo 3 puntos.',3200);SmartSectorCoverage.paintDraft();},
  paintDraft(){if(!SmartSectorCoverage.map||!window.L)return;if(SmartSectorCoverage.drawLayer)SmartSectorCoverage.map.removeLayer(SmartSectorCoverage.drawLayer);if(!SmartSectorCoverage.drawPoints.length)return;const pts=SmartSectorCoverage.drawPoints.map(p=>[p.latitude,p.longitude]);SmartSectorCoverage.drawLayer=L.polyline([...pts,pts.length>2?pts[0]:pts[pts.length-1]],{color:'#ff4b55',weight:4,dashArray:'8 7'}).addTo(SmartSectorCoverage.map);},
  finishDraw(){if(SmartSectorCoverage.drawPoints.length<3)return UI.toast('Marca por lo menos 3 esquinas');const d=SmartSectorCoverage.ensureData();d.polygon=SmartSectorCoverage.drawPoints.map(p=>({...p}));d.name=$('plannerNameInput')?.value.trim()||d.name||'SECTOR DE CAMPO';d.district=$('plannerDistrictInput')?.value.trim()||d.district||'';d.assignee=$('plannerAssigneeInput')?.value.trim()||State.settings.reviewer||d.assignee||'';SmartSectorCoverage.drawing=false;SmartSectorCoverage.drawPoints=[];$('smartSectorCard')?.classList.remove('sscDrawing');$('sscFinishDrawBtn').disabled=true;if(SmartSectorCoverage.drawLayer){SmartSectorCoverage.map?.removeLayer(SmartSectorCoverage.drawLayer);SmartSectorCoverage.drawLayer=null;}SmartSectorCoverage.generateGrid();SmartSectorCoverage.fit();UI.toast('✓ Perímetro guardado · cobertura lista',2400);},
  gpsSquare(){if(!SmartSectorCoverage.validGps(State.gps))return UI.toast('Actualiza GPS antes de crear el perímetro');const g=State.gps,r=150,dLat=r/111320,dLon=r/(111320*Math.cos(Number(g.latitude)*Math.PI/180)),d=SmartSectorCoverage.ensureData();d.polygon=[{latitude:g.latitude-dLat,longitude:g.longitude-dLon},{latitude:g.latitude-dLat,longitude:g.longitude+dLon},{latitude:g.latitude+dLat,longitude:g.longitude+dLon},{latitude:g.latitude+dLat,longitude:g.longitude-dLon}];d.name=$('plannerNameInput')?.value.trim()||'SECTOR GPS 300M';d.district=$('plannerDistrictInput')?.value.trim()||d.district||'';d.assignee=$('plannerAssigneeInput')?.value.trim()||State.settings.reviewer||'';SmartSectorCoverage.generateGrid();SmartSectorCoverage.fit();UI.toast('Perímetro 300 m creado alrededor de tu GPS');},
  async importGeoJSON(file){try{const obj=JSON.parse(await file.text());let geom=obj.type==='Feature'?obj.geometry:obj.type==='FeatureCollection'?obj.features?.find(f=>f.geometry?.type==='Polygon')?.geometry:obj;if(!geom||geom.type!=='Polygon')throw new Error('Se requiere un Polygon GeoJSON');const ring=geom.coordinates?.[0]||[];if(ring.length<4)throw new Error('Polígono incompleto');const d=SmartSectorCoverage.ensureData();d.polygon=ring.slice(0,-1).map(([lon,lat])=>({latitude:Number(lat),longitude:Number(lon)}));d.name=$('plannerNameInput')?.value.trim()||obj.properties?.name||'SECTOR IMPORTADO';d.district=$('plannerDistrictInput')?.value.trim()||d.district||'';d.assignee=$('plannerAssigneeInput')?.value.trim()||State.settings.reviewer||'';SmartSectorCoverage.generateGrid();SmartSectorCoverage.fit();UI.toast('✓ GeoJSON importado');}catch(e){UI.toast(`No se pudo importar: ${e.message}`,3500);}},
  fit(){SmartSectorCoverage.initMap();const d=SmartSectorCoverage.data();if(!SmartSectorCoverage.map||!d?.polygon?.length||!window.L)return;SmartSectorCoverage.map.fitBounds(L.latLngBounds(d.polygon.map(p=>[p.latitude,p.longitude])),{padding:[22,22]});SmartSectorCoverage.paintMap();},
  paintCurrent(g=State.gps){if(!SmartSectorCoverage.map||!window.L||!SmartSectorCoverage.validGps(g))return;if(SmartSectorCoverage.currentMarker)SmartSectorCoverage.map.removeLayer(SmartSectorCoverage.currentMarker);SmartSectorCoverage.currentMarker=L.circleMarker([g.latitude,g.longitude],{radius:7,color:'#2f78ff',weight:4,fillColor:'#fff',fillOpacity:1}).addTo(SmartSectorCoverage.map);},
  paintRoute(){if(!SmartSectorCoverage.map||!window.L)return;if(SmartSectorCoverage.routeLayer)SmartSectorCoverage.map.removeLayer(SmartSectorCoverage.routeLayer);const r=RouteCoverage.active()||State.settings.lastRoute,pts=(r?.points||[]).filter(SmartSectorCoverage.validGps);if(pts.length>1)SmartSectorCoverage.routeLayer=L.polyline(pts.map(p=>[p.latitude,p.longitude]),{color:'#2979ff',weight:5,opacity:.82}).addTo(SmartSectorCoverage.map);},
  paintMap(){if(!SmartSectorCoverage.initMap()||!window.L)return;const map=SmartSectorCoverage.map,d=SmartSectorCoverage.data();for(const key of ['polygonLayer','cellLayer','evidenceLayer']){if(SmartSectorCoverage[key]){map.removeLayer(SmartSectorCoverage[key]);SmartSectorCoverage[key]=null;}}if(d?.polygon?.length)SmartSectorCoverage.polygonLayer=L.polygon(d.polygon.map(p=>[p.latitude,p.longitude]),{color:'#ef4444',weight:3,fillColor:'#ef4444',fillOpacity:.05}).addTo(map);if(d?.cells?.length){const group=[];for(const c of d.cells){const color=c.evidenceCount>0?'#f5b82e':c.status==='covered'||c.status==='verified'?'#2f78ff':'#8390a0';group.push(L.rectangle([[c.latitude-c.dLat/2,c.longitude-c.dLon/2],[c.latitude+c.dLat/2,c.longitude+c.dLon/2]],{color,weight:.55,fillColor:color,fillOpacity:c.status==='pending'?.10:.28,interactive:false}));}SmartSectorCoverage.cellLayer=L.layerGroup(group).addTo(map);}const ev=State.records.filter(r=>r.gps&&d?.polygon?.length&&SmartSectorCoverage.pointInPolygon(Number(r.gps.latitude),Number(r.gps.longitude),d.polygon));if(ev.length)SmartSectorCoverage.evidenceLayer=L.layerGroup(ev.map(r=>L.circleMarker([r.gps.latitude,r.gps.longitude],{radius:4,color:'#8a5a00',weight:1,fillColor:'#ffc233',fillOpacity:1}).bindTooltip(r.photoCode||'Evidencia'))).addTo(map);SmartSectorCoverage.paintCurrent();SmartSectorCoverage.paintRoute();if(typeof SmartRoute!=='undefined')SmartRoute.paintMap();},
  nearestPending(){const d=SmartSectorCoverage.data(),cells=(d?.cells||[]).filter(c=>c.status==='pending');if(!cells.length)return null;if(!SmartSectorCoverage.validGps(State.gps))return cells[0];return cells.sort((a,b)=>RouteCoverage.distance(State.gps,a)-RouteCoverage.distance(State.gps,b))[0];},
  continuePending(){const p=SmartSectorCoverage.nearestPending(),st=SmartSectorCoverage.stats();if(!p)return UI.toast(st.total?'Sector sin celdas pendientes ✓':'Crea un perímetro primero');SmartSectorCoverage.initMap();SmartSectorCoverage.map?.setView([p.latitude,p.longitude],18);if(window.L&&SmartSectorCoverage.map)L.circle([p.latitude,p.longitude],{radius:22,color:'#fff',weight:2,fillColor:'#64748b',fillOpacity:.3}).addTo(SmartSectorCoverage.map).bindPopup(`Siguiente zona pendiente · ${p.sector}`).openPopup();$('sscPendingHint').innerHTML=`<strong>${st.pending} celdas pendientes (${100-st.pct}%).</strong> Siguiente sugerencia: ${p.sector}. ${State.gps?`${Math.round(RouteCoverage.distance(State.gps,p))} m desde tu posición.`:'Actualiza GPS para calcular distancia.'}`;},
  reset(){if(!confirm('¿Reiniciar el perímetro y la cobertura Smart Sector? No borra evidencias ni recorridos.'))return;State.settings.smartSectorCoverage=null;Store.saveLite();SmartSectorCoverage.render();SmartSectorCoverage.paintMap();UI.toast('Sector Smart Coverage reiniciado');},
  render(paint=true){const d=SmartSectorCoverage.data(),st=SmartSectorCoverage.stats();if($('sscPercent'))$('sscPercent').textContent=`${st.pct}%`;if($('sscMeta'))$('sscMeta').innerHTML=`<span>${esc(d?.name||'Sin sector activo')}</span><span>${st.covered}/${st.total} celdas cubiertas · ${st.pending} pendientes</span><span>${esc(d?.assignee||State.settings.reviewer||'Responsable pendiente')}</span>`;if($('sscPendingHint'))$('sscPendingHint').innerHTML=d?.polygon?.length?(st.pending?`Cobertura registrada: <strong>${st.pct}%</strong>. Faltan <strong>${st.pending}</strong> celdas por recorrer.`:`<strong>100% de cobertura territorial registrada.</strong> Puedes iniciar una misión de revisión sin borrar el histórico.`):'Crea o importa un perímetro para comenzar.';if(paint)SmartSectorCoverage.paintMap();},
  bind(){$('sscDrawBtn')?.addEventListener('click',SmartSectorCoverage.startDraw);$('sscFinishDrawBtn')?.addEventListener('click',SmartSectorCoverage.finishDraw);$('sscGpsSquareBtn')?.addEventListener('click',SmartSectorCoverage.gpsSquare);$('sscContinueBtn')?.addEventListener('click',SmartSectorCoverage.continuePending);$('sscResetBtn')?.addEventListener('click',SmartSectorCoverage.reset);$('sscGeoJsonInput')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)SmartSectorCoverage.importGeoJSON(f);e.target.value='';});}
};


const TeamMissions={
  members(){State.settings.teamMembers=Array.isArray(State.settings.teamMembers)?State.settings.teamMembers:[];return State.settings.teamMembers;},
  assignments(){State.settings.teamAssignments=Array.isArray(State.settings.teamAssignments)?State.settings.teamAssignments:[];return State.settings.teamAssignments;},
  notes(){State.settings.teamFieldNotes=Array.isArray(State.settings.teamFieldNotes)?State.settings.teamFieldNotes:[];return State.settings.teamFieldNotes;},
  active(){const id=State.settings.activeTeamAssignmentId||'';return TeamMissions.assignments().find(a=>a.id===id)||null;},
  member(id){return TeamMissions.members().find(m=>m.id===id)||null;},
  addMember(){const name=$('tmMemberName')?.value.trim(),role=$('tmMemberRole')?.value.trim()||'Brigada';if(!name)return UI.toast('Escribe el nombre del integrante');const exists=TeamMissions.members().find(m=>m.name.toLowerCase()===name.toLowerCase());if(exists)return UI.toast('Ese integrante ya existe');TeamMissions.members().push({id:`tm-${Date.now()}-${Math.random().toString(16).slice(2)}`,name,role,createdAt:new Date().toISOString(),active:true});$('tmMemberName').value='';$('tmMemberRole').value='';Store.saveLite();TeamMissions.render();UI.toast(`✓ ${name} agregado al equipo`);},
  createAssignment(){const memberId=$('tmAssignMember')?.value||'',m=TeamMissions.member(memberId);if(!m)return UI.toast('Selecciona un responsable');const d=SmartSectorCoverage.data(),sector=$('tmAssignSector')?.value.trim()||'SECTOR GENERAL',objective=$('tmAssignObjective')?.value.trim()||'Completar cobertura pendiente';const a={id:`asg-${Date.now()}-${Math.random().toString(16).slice(2)}`,memberId:m.id,memberName:m.name,role:m.role,sector,objective,coverageId:d?.id||'',coverageName:d?.name||'',status:'pending',createdAt:new Date().toISOString(),startedAt:'',pausedAt:'',finishedAt:'',startCoveragePct:SmartSectorCoverage.stats().pct,lastCoveragePct:SmartSectorCoverage.stats().pct,notes:[]};TeamMissions.assignments().unshift(a);Store.saveLite();TeamMissions.render();UI.toast(`Asignado ${sector} a ${m.name}`);},
  activate(id){const a=TeamMissions.assignments().find(x=>x.id===id);if(!a)return;const prev=TeamMissions.active();if(prev&&prev.id!==id&&prev.status==='in_progress'){prev.status='paused';prev.pausedAt=new Date().toISOString();prev.lastCoveragePct=SmartSectorCoverage.stats().pct;}State.settings.activeTeamAssignmentId=a.id;a.status='in_progress';a.startedAt=a.startedAt||new Date().toISOString();a.pausedAt='';a.lastCoveragePct=SmartSectorCoverage.stats().pct;const d=SmartSectorCoverage.ensureData();d.assignee=a.memberName;d.assignmentId=a.id;d.assignmentSector=a.sector;if($('plannerAssigneeInput'))$('plannerAssigneeInput').value=a.memberName;if($('routeNameInput'))$('routeNameInput').value=`${a.sector} · ${a.memberName}`;if(!Mission.active())State.settings.currentMission={id:`mission-${Date.now()}`,name:`${a.sector} · ${a.memberName}`,startedAt:new Date().toISOString(),startCount:State.records.length,teamAssignmentId:a.id};Store.saveLite();Mission.paint();SmartSectorCoverage.render();TeamMissions.render();SmartSectorCoverage.continuePending();UI.toast(`▶ ${a.memberName} continúa ${a.sector}`,2200,{placement:'top',tone:'soft'});},
  pause(id){const a=TeamMissions.assignments().find(x=>x.id===id);if(!a)return;a.status='paused';a.pausedAt=new Date().toISOString();a.lastCoveragePct=SmartSectorCoverage.stats().pct;if(State.settings.activeTeamAssignmentId===id)State.settings.activeTeamAssignmentId='';Store.saveLite();TeamMissions.render();UI.toast('Asignación pausada · avance conservado');},
  finish(id){const a=TeamMissions.assignments().find(x=>x.id===id);if(!a)return;a.status='done';a.finishedAt=new Date().toISOString();a.lastCoveragePct=SmartSectorCoverage.stats().pct;if(State.settings.activeTeamAssignmentId===id)State.settings.activeTeamAssignmentId='';Store.saveLite();TeamMissions.render();UI.toast(`✓ ${a.sector} cerrado por ${a.memberName}`);},
  saveNote(){const text=$('tmHandoffText')?.value.trim();if(!text)return UI.toast('Escribe la nota de relevo');const a=TeamMissions.active()||TeamMissions.assignments()[0],m=a?TeamMissions.member(a.memberId):null;TeamMissions.notes().unshift({id:`note-${Date.now()}-${Math.random().toString(16).slice(2)}`,assignmentId:a?.id||'',sector:a?.sector||SmartSectorCoverage.data()?.name||'',memberId:m?.id||'',author:m?.name||State.settings.reviewer||'Equipo',text,createdAt:new Date().toISOString(),gps:State.gps?{latitude:State.gps.latitude,longitude:State.gps.longitude,accuracy:State.gps.accuracy}:null,coveragePct:SmartSectorCoverage.stats().pct});$('tmHandoffText').value='';Store.saveLite();TeamMissions.render();UI.toast('📝 Nota de relevo guardada');},
  stats(){const as=TeamMissions.assignments();return{members:TeamMissions.members().length,active:as.filter(a=>a.status==='in_progress').length,pending:as.filter(a=>['pending','paused'].includes(a.status)).length,done:as.filter(a=>a.status==='done').length};},
  exportProgress(){const payload={app:'ONE SHOT',kind:'team-mission-handoff',version:'5.6',exportedAt:new Date().toISOString(),smartSectorCoverage:State.settings.smartSectorCoverage,teamMembers:TeamMissions.members(),teamAssignments:TeamMissions.assignments(),teamFieldNotes:TeamMissions.notes(),smartRoute:State.settings.smartRoute,routeHistory:RouteCoverage.history(),lastRoute:State.settings.lastRoute||null};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ONE_SHOT_RELEVO_EQUIPO_${Dates.date()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);UI.toast('Avance de equipo exportado');},
  mergeCoverage(incoming){if(!incoming?.polygon?.length)return;const local=SmartSectorCoverage.data();if(!local||local.id===incoming.id||local.name===incoming.name){if(!local){State.settings.smartSectorCoverage=incoming;return;}const rank={pending:0,covered:1,verified:2};const byId=new Map((local.cells||[]).map(c=>[c.id,c]));for(const ic of incoming.cells||[]){let c=byId.get(ic.id)||(local.cells||[]).find(x=>Math.abs(Number(x.latitude)-Number(ic.latitude))<1e-7&&Math.abs(Number(x.longitude)-Number(ic.longitude))<1e-7);if(!c){local.cells.push(ic);continue;}if((rank[ic.status]||0)>(rank[c.status]||0))c.status=ic.status;c.evidenceCount=Math.max(Number(c.evidenceCount||0),Number(ic.evidenceCount||0));c.coveredAt=c.coveredAt||ic.coveredAt||'';}local.updatedAt=new Date().toISOString();}},
  async importProgress(file){try{const raw=JSON.parse(await file.text());if(raw.kind!=='team-mission-handoff'&&!raw.teamAssignments)throw new Error('No es un relevo ONE SHOT 5.6 válido');const merge=(local,incoming)=>{const map=new Map(local.map(x=>[x.id,x]));for(const item of incoming||[]){const old=map.get(item.id);if(old)Object.assign(old,{...item});else local.push(item);}};merge(TeamMissions.members(),raw.teamMembers||[]);merge(TeamMissions.assignments(),raw.teamAssignments||[]);merge(TeamMissions.notes(),raw.teamFieldNotes||[]);TeamMissions.mergeCoverage(raw.smartSectorCoverage);const localRoutes=RouteCoverage.history(),known=new Set(localRoutes.map(r=>r.id));for(const r of raw.routeHistory||[])if(!known.has(r.id))localRoutes.push(r);State.settings.routeHistory=localRoutes;if(raw.smartRoute?.cellIds)State.settings.smartRoute=raw.smartRoute;Store.saveLite();SmartSectorCoverage.render();RouteCoverage.paint();TeamMissions.render();SmartRoute.render();UI.toast(`✓ Relevo fusionado · ${raw.teamAssignments?.length||0} asignaciones`,2800,{placement:'top',tone:'soft'});}catch(e){UI.toast(`No se pudo importar relevo: ${e.message}`,3600);}},
  render(){const st=TeamMissions.stats();if($('tmMemberCount'))$('tmMemberCount').textContent=st.members;if($('tmActiveCount'))$('tmActiveCount').textContent=st.active;if($('tmPendingCount'))$('tmPendingCount').textContent=st.pending;if($('tmDoneCount'))$('tmDoneCount').textContent=st.done;const sel=$('tmAssignMember');if(sel){const cur=sel.value;sel.innerHTML='<option value="">Seleccionar…</option>'+TeamMissions.members().filter(m=>m.active!==false).map(m=>`<option value="${m.id}">${esc(m.name)} · ${esc(m.role||'Brigada')}</option>`).join('');sel.value=TeamMissions.member(cur)?cur:'';}const active=TeamMissions.active(),banner=$('tmActiveBanner');if(banner){banner.classList.toggle('isHidden',!active);if(active){const cov=SmartSectorCoverage.stats();banner.innerHTML=`<div><b>🟢 ${esc(active.memberName)}</b><span>${esc(active.sector)} · ${esc(active.objective)}</span></div><strong>${cov.pct}%</strong><button type="button" data-tm-action="pause" data-id="${active.id}">Pausar</button>`;}}const list=$('tmAssignmentList');if(list)list.innerHTML=TeamMissions.assignments().map(a=>{const label=a.status==='done'?'Cerrada':a.status==='in_progress'?'En curso':a.status==='paused'?'Pausada':'Pendiente',delta=Math.max(0,Number(a.lastCoveragePct||0)-Number(a.startCoveragePct||0));return `<article class="tmAssignment ${a.status}"><div><b>${esc(a.sector)}</b><span>${esc(a.memberName)} · ${esc(a.role||'Brigada')}</span><small>${esc(a.objective)} · inicio ${a.startCoveragePct||0}%${delta?` · +${delta}%`:''}</small></div><em>${label}</em><div class="tmAssignmentActions">${a.status!=='done'?`<button type="button" data-tm-action="activate" data-id="${a.id}">${a.status==='in_progress'?'Continuar':'▶ Iniciar'}</button>`:''}${a.status==='in_progress'?`<button type="button" data-tm-action="pause" data-id="${a.id}">Pausar</button>`:''}${a.status!=='done'?`<button type="button" data-tm-action="finish" data-id="${a.id}">Cerrar</button>`:''}</div></article>`}).join('')||'<div class="tmEmpty">Aún no hay asignaciones. Agrega miembros y asigna un sector.</div>';const notes=$('tmNotesList');if(notes)notes.innerHTML=TeamMissions.notes().slice(0,8).map(n=>`<article><b>${esc(n.author)}</b><span>${esc(n.sector||'Relevo')} · ${new Date(n.createdAt).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span><p>${esc(n.text)}</p><small>${n.coveragePct!=null?`Cobertura al dejar nota: ${n.coveragePct}%`:''}</small></article>`).join('');},
  bind(){$('tmAddMemberBtn')?.addEventListener('click',TeamMissions.addMember);$('tmCreateAssignBtn')?.addEventListener('click',TeamMissions.createAssignment);$('tmSaveNoteBtn')?.addEventListener('click',TeamMissions.saveNote);$('tmExportBtn')?.addEventListener('click',TeamMissions.exportProgress);$('tmImportInput')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)TeamMissions.importProgress(f);e.target.value='';});$('teamMissionCard')?.addEventListener('click',e=>{const b=e.target.closest('[data-tm-action]');if(!b)return;const id=b.dataset.id,act=b.dataset.tmAction;if(act==='activate')TeamMissions.activate(id);if(act==='pause')TeamMissions.pause(id);if(act==='finish')TeamMissions.finish(id);});}
};


const SmartRoute={
  layer:null,markers:null,autoAdvanceAt:0,
  route(){const r=State.settings.smartRoute;return r&&Array.isArray(r.cellIds)?r:null;},
  data(){return SmartSectorCoverage.data();},
  pendingCells(){return (SmartRoute.data()?.cells||[]).filter(c=>c.status==='pending');},
  cellById(id){return (SmartRoute.data()?.cells||[]).find(c=>c.id===id)||null;},
  activeAssignment(){return TeamMissions.active();},
  scorePriority(cell){
    let score=0;
    const d=SmartRoute.data();
    const ev=State.records.filter(r=>r.gps&&(!d?.polygon?.length||SmartSectorCoverage.pointInPolygon(Number(r.gps.latitude),Number(r.gps.longitude),d.polygon)));
    for(const r of ev){const dist=RouteCoverage.distance(cell,r.gps);if(dist<=70)score+=5;else if(dist<=140)score+=2;}
    const places=(State.places||[]).filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)));
    for(const p of places){const dist=RouteCoverage.distance(cell,p);if(dist<=80)score+=3;}
    return score;
  },
  orderedCells(strategy='nearest',max=40){
    let cells=SmartRoute.pendingCells();if(!cells.length)return[];
    const active=SmartRoute.activeAssignment();
    if(active?.sector&&active.sector!=='GENERAL'){
      const same=cells.filter(c=>c.sector===active.sector);if(same.length)cells=same;
    }
    if(strategy==='priority')cells.sort((a,b)=>SmartRoute.scorePriority(b)-SmartRoute.scorePriority(a)||String(a.sector).localeCompare(String(b.sector)));
    else if(strategy==='sector')cells.sort((a,b)=>String(a.sector).localeCompare(String(b.sector))||Number(a.latitude)-Number(b.latitude)||Number(a.longitude)-Number(b.longitude));
    else {
      const rest=[...cells],ordered=[];
      const last=RouteCoverage.active()?.points?.slice(-1)[0]||State.settings.lastRoute?.points?.slice(-1)[0];
      let cur=(strategy==='continue'&&last)?last:(SmartSectorCoverage.validGps(State.gps)?State.gps:rest[0]);
      while(rest.length&&ordered.length<max){rest.sort((a,b)=>RouteCoverage.distance(cur,a)-RouteCoverage.distance(cur,b));const n=rest.shift();ordered.push(n);cur=n;}
      cells=ordered;
    }
    return cells.slice(0,max);
  },
  build(){
    const d=SmartRoute.data();if(!d?.cells?.length)return UI.toast('Primero crea un perímetro Smart Sector');
    const strategy=$('srStrategy')?.value||State.settings.smartRouteStrategy||'nearest',max=Math.max(5,Number($('srMaxPoints')?.value||State.settings.smartRouteMaxPoints||40));
    const cells=SmartRoute.orderedCells(strategy,max);if(!cells.length)return UI.toast('No quedan celdas pendientes en el sector seleccionado');
    State.settings.smartRouteStrategy=strategy;State.settings.smartRouteMaxPoints=max;
    State.settings.smartRoute={id:`sr-${Date.now()}`,coverageId:d.id||'',assignmentId:TeamMissions.active()?.id||'',strategy,createdAt:new Date().toISOString(),cellIds:cells.map(c=>c.id),index:0,skipped:[],visited:[],startedFrom:SmartSectorCoverage.validGps(State.gps)?{latitude:State.gps.latitude,longitude:State.gps.longitude}:null};
    Store.saveLite();SmartRoute.render();SmartRoute.focusCurrent();SmartRoute.paintMap();UI.toast(`⚡ Ruta inteligente creada · ${cells.length} zonas pendientes`,2500,{placement:'top',tone:'soft'});
  },
  current(){const r=SmartRoute.route();if(!r)return null;return SmartRoute.cellById(r.cellIds[r.index||0]);},
  progress(){const r=SmartRoute.route();if(!r)return{index:0,total:0,left:0};const total=r.cellIds.length,index=Math.min(total,Number(r.index||0));return{index,total,left:Math.max(0,total-index)};},
  remainingDistance(){const r=SmartRoute.route();if(!r)return 0;const ids=r.cellIds.slice(Number(r.index||0));const pts=ids.map(id=>SmartRoute.cellById(id)).filter(Boolean);if(!pts.length)return 0;let total=0,cur=SmartSectorCoverage.validGps(State.gps)?State.gps:pts[0];for(const p of pts){total+=RouteCoverage.distance(cur,p);cur=p;}return total;},
  next(auto=false){const r=SmartRoute.route();if(!r)return;const cur=SmartRoute.current();if(cur)r.visited=[...(r.visited||[]),cur.id];r.index=Number(r.index||0)+1;if(r.index>=r.cellIds.length){State.settings.smartRoute=null;Store.saveLite();SmartRoute.render();SmartRoute.paintMap();UI.toast('✓ Ruta inteligente completada',2200,{placement:'top',tone:'soft'});return;}Store.saveLite();SmartRoute.render();SmartRoute.focusCurrent();if(!auto)UI.toast('Siguiente zona pendiente');},
  markReviewed(){const c=SmartRoute.current();if(!c)return;c.status='covered';c.coveredAt=c.coveredAt||new Date().toISOString();c.coveredBy=TeamMissions.active()?.memberName||SmartRoute.data()?.assignee||State.settings.reviewer||'';Store.saveLite();SmartSectorCoverage.render(false);SmartRoute.next();},
  skip(){const r=SmartRoute.route(),c=SmartRoute.current();if(!r||!c)return;r.skipped=[...(r.skipped||[]),c.id];Store.saveLite();SmartRoute.next();},
  close(){if(!SmartRoute.route())return;State.settings.smartRoute=null;Store.saveLite();SmartRoute.render();SmartRoute.paintMap();UI.toast('Ruta cerrada · las zonas pendientes se conservan');},
  navigate(){const c=SmartRoute.current();if(!c)return UI.toast('No hay destino pendiente');window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${c.latitude},${c.longitude}`)}`,'_blank','noopener');},
  focusCurrent(){const c=SmartRoute.current();SmartSectorCoverage.initMap();if(!c||!SmartSectorCoverage.map)return;SmartSectorCoverage.map.setView([c.latitude,c.longitude],18);if(window.L){if(SmartRoute.focusCircle)SmartSectorCoverage.map.removeLayer(SmartRoute.focusCircle);SmartRoute.focusCircle=L.circle([c.latitude,c.longitude],{radius:22,color:'#7c3aed',weight:3,fillColor:'#a78bfa',fillOpacity:.20}).addTo(SmartSectorCoverage.map).bindPopup(`Siguiente · ${c.sector}`).openPopup();}},
  onGps(g){const c=SmartRoute.current();if(!c||!SmartSectorCoverage.validGps(g))return;const dist=RouteCoverage.distance(g,c);if(dist<=Math.max(28,Number(SmartRoute.data()?.gridSizeM||40)*.75)&&Date.now()-SmartRoute.autoAdvanceAt>2500){SmartRoute.autoAdvanceAt=Date.now();c.status='covered';c.coveredAt=c.coveredAt||new Date().toISOString();c.coveredBy=TeamMissions.active()?.memberName||SmartRoute.data()?.assignee||State.settings.reviewer||'';Store.saveLite();SmartSectorCoverage.render(false);SmartRoute.next(true);}},
  paintMap(){const map=SmartSectorCoverage.map;if(!map||!window.L)return;if(SmartRoute.layer){map.removeLayer(SmartRoute.layer);SmartRoute.layer=null;}if(SmartRoute.markers){map.removeLayer(SmartRoute.markers);SmartRoute.markers=null;}const r=SmartRoute.route();if(!r)return;const cells=r.cellIds.slice(Number(r.index||0)).map(id=>SmartRoute.cellById(id)).filter(Boolean);if(!cells.length)return;const start=SmartSectorCoverage.validGps(State.gps)?[State.gps.latitude,State.gps.longitude]:[cells[0].latitude,cells[0].longitude];SmartRoute.layer=L.polyline([start,...cells.map(c=>[c.latitude,c.longitude])],{color:'#7c3aed',weight:4,opacity:.82,dashArray:'8 7'}).addTo(map);SmartRoute.markers=L.layerGroup(cells.slice(0,15).map((c,i)=>L.circleMarker([c.latitude,c.longitude],{radius:i===0?7:4,color:i===0?'#fff':'#6d28d9',weight:i===0?3:1,fillColor:'#8b5cf6',fillOpacity:.95}).bindTooltip(i===0?`Siguiente · ${c.sector}`:`${i+1} · ${c.sector}`))).addTo(map);},
  render(){
    const r=SmartRoute.route(),p=SmartRoute.progress(),c=SmartRoute.current(),st=SmartSectorCoverage.stats(),distance=SmartRoute.remainingDistance();
    if($('srStrategy'))$('srStrategy').value=State.settings.smartRouteStrategy||'nearest';if($('srMaxPoints'))$('srMaxPoints').value=String(State.settings.smartRouteMaxPoints||40);
    if($('srStatus'))$('srStatus').innerHTML=r?`<b>Ruta activa · ${p.index+1}/${p.total}</b><span>${p.left} zonas restantes · aprox. ${(distance/1000).toFixed(distance>=1000?1:2)} km en línea operativa</span>`:`<b>Sin ruta inteligente activa</b><span>${st.pending} celdas pendientes · ${100-st.pct}% por cubrir</span>`;
    const card=$('srNextCard');if(card){card.classList.toggle('isHidden',!r||!c);if(r&&c){$('srProgress').textContent=`${p.index+1} / ${p.total}`;$('srNextTitle').textContent=`${c.sector} · zona pendiente`;$('srNextMeta').textContent=`${SmartSectorCoverage.validGps(State.gps)?Math.round(RouteCoverage.distance(State.gps,c))+' m desde ti · ':''}prioridad ${SmartRoute.scorePriority(c)} · cobertura general ${st.pct}%`;}}
    if($('srBuildBtn'))$('srBuildBtn').disabled=!st.pending;SmartRoute.paintMap();
  },
  bind(){
    $('srBuildBtn')?.addEventListener('click',SmartRoute.build);$('srNavigateBtn')?.addEventListener('click',SmartRoute.navigate);$('srReviewedBtn')?.addEventListener('click',SmartRoute.markReviewed);$('srSkipBtn')?.addEventListener('click',SmartRoute.skip);$('srCloseBtn')?.addEventListener('click',SmartRoute.close);$('srFocusBtn')?.addEventListener('click',SmartRoute.focusCurrent);
  }
};

const Radar={
  open(){const c=$("radarCanvas");if(!c)return;$("radarModal").classList.add("open");const ctx=c.getContext("2d"),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="#071326";ctx.fillRect(0,0,w,h);const gps=State.gps,pts=(State.placeMode==='memory'?(State.places||[]):Places.currentPlaces()).filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)));if(!gps){ctx.fillStyle="#fff";ctx.font="24px system-ui";ctx.fillText("GPS pendiente · actualiza ubicación",40,70);return;}const lat0=Number(gps.latitude),lon0=Number(gps.longitude),metersPerLon=111320*Math.cos(lat0*Math.PI/180),range=250,rad=Math.min(w,h)*.42;ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=2;for(const r of [50,100,150,200,250]){ctx.beginPath();ctx.arc(w/2,h/2,rad*(r/range),0,Math.PI*2);ctx.stroke();}ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(w/2,h/2,9,0,Math.PI*2);ctx.fill();let shown=0;for(const p of pts){const dx=(Number(p.longitude)-lon0)*metersPerLon,dy=(Number(p.latitude)-lat0)*111320,d=Math.hypot(dx,dy);if(d>range)continue;const scale=rad/range,x=w/2+dx*scale,y=h/2-dy*scale;ctx.fillStyle=p.status==="Retirada"?"#ef4444":/local/i.test(p.type||"")?"#a855f7":"#2f6bff";ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();shown++;}$("radarLegend").textContent=`${shown} puntos a ≤ ${range} m · ● tú · azul activos · rojo retirados · violeta locales`;},
  close(){$("radarModal")?.classList.remove("open");}
};

const Gallery = {
  updateLastShot(record){if(!record)return;const btn=$("lastShotBtn");btn.style.backgroundImage=`url(${record.stampedImage||record.image})`;btn.style.backgroundSize="cover";btn.style.backgroundPosition="center";btn.querySelector("span").style.opacity="0";},
  render(){const list=Evidence.visible(),selected=Evidence.selected();$("evidenceCount").textContent=`${State.records.length} registradas · ${list.length} visibles`;const view=State.settings.galleryView||State.galleryView||"cards";State.galleryView=view;$("evidenceList").classList.remove("compact","cardsView","gridView","listView");$("evidenceList").classList.add(view+"View");$$(`[data-gallery-view]`).forEach(b=>{const on=b.dataset.galleryView===view;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});$("evidenceList").innerHTML=list.map(r=>`
    <article class="eCard ${r.selected?"selected":""}" data-id="${esc(r.id)}">
      ${State.selectionMode?`<button class="selectBadge ${r.selected?"on":""}" data-act="select" aria-label="Seleccionar">${r.selected?"✓":"○"}</button>`:""}
      <button class="eMedia" data-act="${State.selectionMode?"select":"view"}" aria-label="${State.selectionMode?"Seleccionar":"Ver evidencia"}"><img src="${r.stampedImage||r.image}" loading="lazy" alt="${esc(r.photoCode)}"></button>
      <div class="eBody">
        <div class="eTitle"><b>${esc(r.type||"PENDIENTE")}</b><code>${esc(r.photoCode)}</code></div>${r.placeId?`<div class="placeTag">📍 ${esc(Places.get(r.placeId)?.code||"Punto")} · ${esc(r.placeRelation||"Registro")}</div>`:""}
        <div class="eMeta"><span>🕒 ${esc(r.fecha)} ${esc(r.hora)} · ${r.gps?`GPS ±${Math.round(r.gps.accuracy)}m`:"GPS pendiente"}</span><span>📍 ${esc(r.address||"Ubicación pendiente")}</span><span>🏷 ${esc(r.party||"Partido pendiente")} · ${esc(r.candidate||"Candidato pendiente")}</span><span>🔐 ${esc(r.verifyCode||"PENDIENTE")}${r.heading!=null?` · ${Math.round(r.heading)}° ${esc(r.cardinal||"")}`:""}${r.altitude!=null?` · ${Math.round(r.altitude)}m`:""}</span></div>
        ${State.selectionMode?"":`<div class="eActions"><button data-act="view">👁 Ver</button><button data-act="edit">✎ Editar</button><button data-act="map">📍 Mapa</button><button data-act="select">○ Elegir</button><button data-act="delete">⌫</button></div>`}
      </div>
    </article>`).join("")||`<div class="hint">No hay evidencias en este filtro.</div>`;Gallery.updateSelectionUI();Reports.renderSummary();},
  updateSelectionUI(){
    const n=Evidence.selected().length,visible=Evidence.visible(),selectedVisible=visible.filter(r=>r.selected).length,allVisible=visible.length>0&&selectedVisible===visible.length;
    $("selectionBar").classList.toggle("open",State.selectionMode);
    $("selectionCount").textContent=n?`${n} seleccionada${n===1?"":"s"}`:"Selecciona evidencias";
    $("selectVisibleBtn").textContent=State.selectionMode?"✕ Cancelar":"Seleccionar";
    const allBtn=$("selectionAllBtn");if(allBtn){allBtn.classList.toggle("on",allVisible);allBtn.setAttribute("aria-pressed",String(allVisible));const b=allBtn.querySelector("b");if(b)b.textContent=allVisible?"Limpiar":"Todo";}
    const act=$("selectionActionsBtn");if(act){act.disabled=n===0;const b=act.querySelector("b");if(b)b.textContent=n?`Acciones · ${n}`:"Acciones";}
    if($("bulkSelectionText"))$("bulkSelectionText").textContent=`${n} evidencia${n===1?"":"s"} seleccionada${n===1?"":"s"}`;
  },
  setView(view){
    if(!["cards","grid","list"].includes(view))view="cards";
    State.settings.galleryView=view;State.galleryView=view;Store.saveLite();
    const list=$("evidenceList");if(list){list.classList.add("viewChanging");setTimeout(()=>list.classList.remove("viewChanging"),220);}
    Gallery.render();
  },
  toggleAllVisible(){
    if(!State.selectionMode)Gallery.enterSelection();
    const visible=Evidence.visible();
    const allSelected=visible.length>0&&visible.every(r=>r.selected===true);
    const ids=new Set(visible.map(r=>r.id));
    State.records.forEach(r=>{if(ids.has(r.id))r.selected=!allSelected;});
    Gallery.render();
    UI.toast(allSelected?"Selección visible limpiada":`✓ ${visible.length} evidencias seleccionadas`,1500,{placement:"top",tone:"soft"});
  },
  toggleSelection(id){
    const r=State.records.find(x=>x.id===id);if(!r)return;
    r.selected=!r.selected;
    Gallery.render();
  },
  enterSelection(){
    // La selección es temporal de UI: siempre entra limpia y no se persiste.
    State.records.forEach(r=>r.selected=false);
    State.selectionMode=true;
    Gallery.render();
    UI.toast("Selecciona evidencias o toca Todas");
  },
  exitSelection(){
    State.records.forEach(r=>r.selected=false);
    State.selectionMode=false;
    Gallery.render();
  },
  toggleMode(){
    if(!State.selectionMode)return Gallery.enterSelection();
    Gallery.exitSelection();
    UI.toast("Selección cancelada");
  },
  selectVisible(){
    const visible=Evidence.visible();
    const ids=new Set(visible.map(r=>r.id));
    // Limpiamos primero cualquier selección ajena al filtro y marcamos todo lo visible en un solo paso.
    State.records.forEach(r=>r.selected=ids.has(r.id));
    Gallery.render();
    UI.toast(`✓ ${visible.length} evidencias seleccionadas`,1800);
  },
  deselectAll(){
    State.records.forEach(r=>r.selected=false);
    Gallery.render();
    UI.toast("Ninguna evidencia seleccionada",1400);
  },
  bind(){
    $("evidenceList").addEventListener("click",async e=>{if(State.suppressGalleryClick){State.suppressGalleryClick=false;return;}const card=e.target.closest(".eCard");if(!card)return;const id=card.dataset.id,r=State.records.find(x=>x.id===id);if(!r)return;if(State.selectionMode){Gallery.toggleSelection(id);if(navigator.vibrate)navigator.vibrate(12);return;}const action=e.target.closest("[data-act]")?.dataset.act;if(!action)return;if(action==="view")Viewer.open(id);if(action==="edit")Editor.open(id);if(action==="map")Maps.openRecord(r);if(action==="select")Gallery.toggleSelection(id);if(action==="delete"&&confirm("¿Eliminar esta evidencia?")){await Store.delete(id);Gallery.render();}});
    $("evidenceList").addEventListener("touchstart",e=>{if(State.selectionMode)return;const card=e.target.closest(".eCard");if(!card)return;clearTimeout(Gallery.longPressTimer);Gallery.longPressTimer=setTimeout(()=>{State.suppressGalleryClick=true;State.records.forEach(r=>r.selected=false);State.selectionMode=true;const r=State.records.find(x=>x.id===card.dataset.id);if(r)r.selected=true;Gallery.render();if(navigator.vibrate)navigator.vibrate(28);UI.toast("Selección múltiple",900);},480);},{passive:true});
    $("evidenceList").addEventListener("touchend",()=>clearTimeout(Gallery.longPressTimer),{passive:true});$("evidenceList").addEventListener("touchmove",()=>clearTimeout(Gallery.longPressTimer),{passive:true});
    $("galleryViewSwitch")?.addEventListener("click",e=>{const b=e.target.closest("[data-gallery-view]");if(!b)return;e.preventDefault();e.stopPropagation();Gallery.setView(b.dataset.galleryView);});
    $("selectVisibleBtn").onclick=Gallery.toggleMode;
    $("selectionCancelBtn").onclick=e=>{e.preventDefault();e.stopPropagation();Gallery.exitSelection();};$("selectionActionsBtn").onclick=e=>{e.preventDefault();Bulk.open();};
  }
};

const SimpleZip = {
  table:null,
  crc32(bytes){if(!SimpleZip.table){SimpleZip.table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;SimpleZip.table[n]=c>>>0;}}let c=0xFFFFFFFF;for(const b of bytes)c=SimpleZip.table[(c^b)&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;},
  dos(d=new Date()){let year=Math.max(1980,d.getFullYear());return{time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((year-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};},
  u16(v){const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,v,true);return b;},u32(v){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,v>>>0,true);return b;},
  concat(parts){const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;},
  async make(items,name){const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;for(const item of items){const filename=enc.encode(item.name),bytes=new Uint8Array(await item.blob.arrayBuffer()),crc=SimpleZip.crc32(bytes),dt=SimpleZip.dos(item.date||new Date());const local=SimpleZip.concat([SimpleZip.u32(0x04034b50),SimpleZip.u16(20),SimpleZip.u16(0),SimpleZip.u16(0),SimpleZip.u16(dt.time),SimpleZip.u16(dt.date),SimpleZip.u32(crc),SimpleZip.u32(bytes.length),SimpleZip.u32(bytes.length),SimpleZip.u16(filename.length),SimpleZip.u16(0),filename,bytes]);locals.push(local);const central=SimpleZip.concat([SimpleZip.u32(0x02014b50),SimpleZip.u16(20),SimpleZip.u16(20),SimpleZip.u16(0),SimpleZip.u16(0),SimpleZip.u16(dt.time),SimpleZip.u16(dt.date),SimpleZip.u32(crc),SimpleZip.u32(bytes.length),SimpleZip.u32(bytes.length),SimpleZip.u16(filename.length),SimpleZip.u16(0),SimpleZip.u16(0),SimpleZip.u16(0),SimpleZip.u16(0),SimpleZip.u32(0),SimpleZip.u32(offset),filename]);centrals.push(central);offset+=local.length;}const centralOffset=offset,centralSize=centrals.reduce((n,p)=>n+p.length,0),end=SimpleZip.concat([SimpleZip.u32(0x06054b50),SimpleZip.u16(0),SimpleZip.u16(0),SimpleZip.u16(items.length),SimpleZip.u16(items.length),SimpleZip.u32(centralSize),SimpleZip.u32(centralOffset),SimpleZip.u16(0)]);return new File([SimpleZip.concat([...locals,...centrals,end])],name,{type:"application/zip"});}
};

const Bulk = {
  data(){return Evidence.selected();},
  openEdit(){const d=Bulk.data();if(!d.length)return UI.toast("Selecciona evidencias");Bulk.close();$("bulkEditCount").textContent=`${d.length} evidencia${d.length===1?"":"s"}`;$("bulkEditModal").classList.add("open");},
  closeEdit(){$("bulkEditModal")?.classList.remove("open");},
  async applyEdit(){const d=Bulk.data();if(!d.length)return;const rules=[["bulkUseProcess","electionProcess","bulkProcess"],["bulkUseType","type","bulkType"],["bulkUseParty","party","bulkParty"],["bulkUseCandidate","candidate","bulkCandidate"],["bulkUseStatus","status","bulkStatus"]];let touched=0;for(const r of d){let changed=false;for(const [check,key,input] of rules){if($(check)?.checked){r[key]=String($(input)?.value||"").trim();changed=true;}}if(changed){r.updatedAt=new Date().toISOString();touched++;}}if(!touched)return UI.toast("Marca al menos un campo para aplicar");await Store.saveBatch(d);Bulk.closeEdit();Gallery.render();UI.toast(`✓ ${touched} evidencias actualizadas`,2500);},
  open(){const data=Bulk.data();if(!data.length){UI.toast("Selecciona una evidencia o toca Todas",3200);$("selectionBar")?.classList.add("attention");setTimeout(()=>$("selectionBar")?.classList.remove("attention"),850);return;}$("bulkSelectionText").textContent=`${data.length} evidencia${data.length===1?"":"s"} seleccionada${data.length===1?"":"s"}`;$("bulkModal").classList.add("open");},
  close(){$("bulkModal").classList.remove("open");},
  imageFiles(){return Bulk.data().map((r,i)=>Share.dataUrlToFile(r.stampedImage||r.image,`${String(i+1).padStart(3,"0")}_${r.photoCode}.jpg`));},
  async zipImages(){const files=Bulk.imageFiles();if(!files.length)throw new Error("No hay imágenes seleccionadas");const items=files.map(f=>({name:f.name,blob:f,date:new Date()}));return SimpleZip.make(items,`ONE_SHOT_IMAGENES_${Dates.date()}.zip`);},
  async downloadImages(){try{UI.toast("Preparando imágenes…");const zip=await Bulk.zipImages();await Share.downloadFile(zip);UI.toast("ZIP de imágenes listo");}catch(e){UI.toast(e.message||String(e),3500)}},
  async shareImages(){try{const files=Bulk.imageFiles(),recipient=await Recipients.choose();if(recipient===false)return;const text=`ONE SHOT · ${files.length} evidencias seleccionadas · Para ${recipient.name}${recipient.role?` (${recipient.role})`:""}`;if(!APKBridge.isNative()&&navigator.share&&navigator.canShare?.({files})&&files.length<=20){try{await navigator.share({title:"ONE SHOT",text,files});return;}catch(e){if(e.name==="AbortError")return;}}const zip=await Bulk.zipImages();await Share.shareFile(zip,text,recipient);}catch(e){UI.toast(e.message||String(e),3500)}},
  async downloadExcel(){Bulk.close();await Reports.download();},async shareExcel(){Bulk.close();await Reports.share();},preview(){Bulk.close();Reports.preview();},
  async deselectAll(){Bulk.close();await Gallery.deselectAll();},
  async deleteSelected(){const data=Bulk.data();if(!data.length)return;if(!confirm(`¿Eliminar ${data.length} evidencia${data.length===1?"":"s"}? Esta acción no se puede deshacer.`))return;for(const r of [...data])await Store.delete(r.id);Bulk.close();Gallery.render();UI.toast("Evidencias eliminadas");}
};

const Viewer = {
  list: () => Evidence.visible(),
  open(id) { const list=Viewer.list();State.viewerIndex=Math.max(0,list.findIndex(r=>r.id===id));$("viewerModal").classList.add("open");document.documentElement.style.setProperty("--viewerZoom","1");Viewer.render(); },
  render() { const r=Viewer.list()[State.viewerIndex];if(!r)return Viewer.close();$("viewerImg").src=r.stampedImage||r.image;$("viewerTitle").textContent=`${r.type||"Evidencia"} · ${r.photoCode}`;$("viewerCaption").textContent=`${State.viewerIndex+1}/${Viewer.list().length} · ${r.address||"Ubicación pendiente"} · Verificador ${r.verifyCode||"PENDIENTE"}`; },
  move(delta){const l=Viewer.list();if(!l.length)return;State.viewerIndex=(State.viewerIndex+delta+l.length)%l.length;Viewer.render();},
  close(){$("viewerModal").classList.remove("open");},
  current(){return Viewer.list()[State.viewerIndex]},
  async download(){const r=Viewer.current();if(!r)return;try{await Share.downloadFile(Share.dataUrlToFile(r.stampedImage||r.image,`${r.photoCode}.jpg`));UI.toast("Foto guardada");}catch(e){UI.toast(`No se pudo guardar: ${e.message||e}`,3500)}},
  maps(){Maps.openRecord(Viewer.current());},
  async share(){const r=Viewer.current();if(!r)return;try{await Share.shareFile(Share.dataUrlToFile(r.stampedImage||r.image,`${r.photoCode}.jpg`),`ONE SHOT · ${r.photoCode}\n${r.address||""}`);}catch(e){UI.toast(`No se pudo compartir: ${e.message||e}`,3500)}},
  async verify(){const r=Viewer.current();if(!r)return;UI.toast("Verificando integridad…");const v=await Evidence.verify(r);let stampedOk=true;if(r.stampedHash&&r.stampedImage)stampedOk=(await Evidence.imageHash(r.stampedImage))===r.stampedHash;UI.toast(v.ok&&stampedOk?"✓ Original y evidencia marcada íntegros":"⚠ La evidencia no coincide con los hashes registrados",3800);}
};

const Editor = {
  current:null,
  option(el,value,label=value){if(!el)return;const val=String(value||"");if(!val)return;if(!Array.from(el.options||[]).some(o=>o.value===val)){const o=document.createElement("option");o.value=val;o.textContent=label||val;el.appendChild(o);}},
  populateLists(r){const party=$("editParty"),parties=new Set([...(window.ONE_SHOT_DATA?.parties||[]),...State.records.map(x=>x.party).filter(Boolean)]);party.innerHTML='<option value="">Partido pendiente</option>'+[...parties].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");Editor.option(party,r.party);const candidates=new Set([...(window.ONE_SHOT_DATA?.candidates||[]),...State.records.map(x=>x.candidate).filter(Boolean)]),districts=new Set(State.records.map(x=>x.district).filter(Boolean));$("candidateList").innerHTML=[...candidates].sort().map(x=>`<option value="${esc(x)}"></option>`).join("");$("districtList").innerHTML=[...districts].sort().map(x=>`<option value="${esc(x)}"></option>`).join("");Editor.option($("editElectionType"),r.electionType);Editor.option($("editType"),r.type);Editor.option($("editCandidateType"),r.candidateType);},
  open(id){const r=State.records.find(x=>x.id===id);if(!r)return;Editor.current=r;Editor.populateLists(r);$("editModal").classList.add("open");$("editCodeLabel").textContent=`${r.photoCode} · V ${r.verifyCode||"PENDIENTE"}`;const set=(id,v)=>{const el=$(id);if(el)el.value=v||""};set("editId",r.id);set("editProcess",r.electionProcess||"ERM");set("editElectionType",r.electionType);set("editType",r.type||"PENDIENTE");set("editStatus",r.status||"Activo");set("editParty",r.party);set("editCandidate",r.candidate);set("editCandidateType",r.candidateType);set("editDistrict",r.district);set("editUbigeo",r.ubigeo);set("editObservation",r.observation);setTimeout(()=>$("editProcess")?.focus({preventScroll:true}),80);},
  close(){$("editModal").classList.remove("open");Editor.current=null;},
  maps(){Maps.openRecord(Editor.current);},
  async save(){const r=Editor.current;if(!r)return;const g=id=>String($(id)?.value||"").trim();Object.assign(r,{electionProcess:g("editProcess"),electionType:g("editElectionType"),type:g("editType"),status:g("editStatus"),party:g("editParty"),candidate:g("editCandidate"),candidateType:g("editCandidateType"),district:g("editDistrict"),ubigeo:g("editUbigeo"),observation:g("editObservation"),updatedAt:new Date().toISOString()});await Store.save(r);Reports.invalidate();Editor.close();Gallery.render();UI.toast("Evidencia actualizada");},
  async updateGps(){const r=Editor.current;if(!r)return;if(!confirm("Actualizar GPS reemplaza la ubicación vinculada a esta evidencia. Úsalo solo si sigues en el mismo punto de captura. ONE SHOT conservará un historial de la ubicación anterior. ¿Continuar?"))return;const g=await GPS.current(15000,true);if(!g)return UI.toast("No se pudo actualizar GPS");r.gpsHistory=Array.isArray(r.gpsHistory)?r.gpsHistory:[];r.gpsHistory.push({changedAt:new Date().toISOString(),gps:r.gps?{...r.gps}:null,address:r.address||"",verifyCode:r.verifyCode||"",evidenceHash:r.evidenceHash||""});r.gps={...g};r.gpsCapturedAt=g.timestamp;r.accuracy=g.accuracy;r.gpsQuality=g.quality;r.altitude=g.altitude??null;r.altitudeAccuracy=g.altitudeAccuracy??null;r.heading=State.heading??g.heading??r.heading??null;r.cardinal=Sensors.cardinal(r.heading);r.googleMapsUrl=GPS.maps(g);Object.assign(r,await GPS.reverse(g));r.evidenceHash=await Evidence.sha256(Evidence.canonical(r));r.verifyCode=r.evidenceHash.slice(0,12);r.stampedImage=await Watermark.stamp(r.image,r);r.stampedHash=await Evidence.imageHash(r.stampedImage);r.updatedAt=new Date().toISOString();await Store.save(r);$("editDistrict").value=r.district||"";$("editUbigeo").value=r.ubigeo||"";$("editCodeLabel").textContent=`${r.photoCode} · V ${r.verifyCode||"PENDIENTE"}`;Branding.updateVerifier(r.verifyCode);Reports.invalidate();UI.toast("GPS actualizado · ubicación anterior conservada en historial");},
  async updateAddress(){const r=Editor.current;if(!r)return;if(!r.gps)return UI.toast("Primero actualiza o registra GPS");Object.assign(r,await GPS.reverse(r.gps));$("editDistrict").value=r.district||"";$("editUbigeo").value=r.ubigeo||"";r.stampedImage=await Watermark.stamp(r.image,r);r.stampedHash=await Evidence.imageHash(r.stampedImage);r.updatedAt=new Date().toISOString();await Store.save(r);Reports.invalidate();UI.toast("Dirección actualizada");}
};

const Reports = {
  mapsUrl(record){
    const lat=Number(record?.gps?.latitude),lon=Number(record?.gps?.longitude);
    if(Number.isFinite(lat)&&Number.isFinite(lon))return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
    return record?.googleMapsUrl||"";
  },
  hyperlinkCell(cell,text,url,{center=false}={}){
    if(!cell)return;
    if(url){cell.value={text:String(text||"Abrir ubicación"),hyperlink:url,tooltip:"Abrir ubicación en Google Maps"};cell.font={...(cell.font||{}),color:{argb:"FF1565C0"},underline:true,bold:true};}
    else cell.value=text||"Sin ubicación";
    cell.alignment={vertical:"middle",horizontal:center?"center":"left",wrapText:true};
  },
  key(){return Evidence.selectedForReport().map(r=>`${r.id}:${r.updatedAt||r.createdAt}`).join("|");},
  invalidate(){State.reportCache={key:"",file:null,promise:null};$("reportReadyChip")?.classList.remove("ready");if($("reportReadyChip"))$("reportReadyChip").textContent="Preparando…";},
  renderSummary(){const data=Evidence.selectedForReport(),visible=Evidence.visible(),selected=Evidence.selected();$("sumExport").textContent=data.length;$("sumGps").textContent=data.filter(r=>r.gps).length;$("sumSelected").textContent=selected.length;$("sumPeriod").textContent=visible.length;},
  async prepare(){const key=Reports.key();if(!key)return;if(State.reportCache.key===key&&State.reportCache.file){Reports.readyUI();return State.reportCache.file;}if(State.reportCache.promise)return State.reportCache.promise;State.reportCache.key=key;State.reportCache.promise=Reports.makeExcel().then(file=>{State.reportCache.file=file;State.reportCache.promise=null;Reports.readyUI();return file;}).catch(e=>{State.reportCache.promise=null;if($("reportReadyChip"))$("reportReadyChip").textContent="Error al preparar";throw e;});return State.reportCache.promise;},
  readyUI(){if(!$("reportReadyChip"))return;$("reportReadyChip").textContent="✓ Excel listo";$("reportReadyChip").classList.add("ready");},
  async makeExcel(){
    const data=Evidence.selectedForReport();
    if(!data.length)throw new Error("No hay evidencias para exportar.");
    if(!window.ExcelJS)throw new Error("No se cargó el motor XLSX. Conéctate una vez a internet antes de generar Excel.");

    const wb=new ExcelJS.Workbook();
    wb.creator="ONE SHOT";wb.created=new Date();wb.subject="Evidencia fotográfica en calle";
    wb.description="Reporte visual y datos técnicos de evidencias generadas por ONE SHOT.";

    // =========================================================
    // 1) HOJA PRINCIPAL: limpia, visual, filtrable y entregable
    // =========================================================
    const ws=wb.addWorksheet("EVIDENCIAS",{views:[{state:"frozen",ySplit:1,xSplit:2}]});
    ws.properties.defaultRowHeight=22;
    ws.columns=[
      {header:"N°",key:"n",width:6},
      {header:"FOTO",key:"foto",width:30},
      {header:"FECHA",key:"fecha",width:13},
      {header:"HORA",key:"hora",width:12},
      {header:"UBICACIÓN",key:"address",width:40},
      {header:"LAT/LONG",key:"latlong",width:24},
      {header:"PRECISIÓN",key:"precision",width:12},
      {header:"ALTITUD",key:"altitude",width:12},
      {header:"CÓDIGO",key:"code",width:23},
      {header:"VERIFICADOR",key:"verify",width:18},
      {header:"PROCESO",key:"process",width:12},
      {header:"TIPO EVIDENCIA",key:"type",width:18},
      {header:"ESTADO",key:"status",width:13},
      {header:"PARTIDO",key:"party",width:24},
      {header:"CANDIDATO",key:"candidate",width:24},
      {header:"CARGO",key:"candidateType",width:19},
      {header:"DISTRITO",key:"district",width:18},
      {header:"OBSERVACIÓN",key:"observation",width:34},
      {header:"MAPA",key:"maps",width:15},
      {header:"REVISOR",key:"reviewer",width:20}
    ];

    const head=ws.getRow(1);head.height=34;
    head.font={bold:true,color:{argb:"FFFFFFFF"},size:11};
    head.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF082B64"}};
    head.alignment={vertical:"middle",horizontal:"center",wrapText:true};
    head.border={bottom:{style:"medium",color:{argb:"FF2F6BFF"}}};
    ws.autoFilter={from:"A1",to:"T1"};

    for(let i=0;i<data.length;i++){
      const r=data[i],rowNo=i+2,mapsUrl=Reports.mapsUrl(r);
      const latlongText=r.gps?`${Number(r.gps.latitude).toFixed(6)}, ${Number(r.gps.longitude).toFixed(6)}`:"";
      const precisionText=r.gps?`±${Math.round(r.accuracy??r.gps.accuracy??0)} m`:"";
      const altitudeText=r.altitude!=null?`${Math.round(r.altitude)} m`:"-";
      ws.addRow({
        n:i+1,fecha:r.fecha||"",hora:r.hora||"",address:r.address||"Ubicación pendiente",latlong:latlongText,precision:precisionText,altitude:altitudeText,code:r.photoCode||"",verify:r.verifyCode||"",
        process:r.electionProcess||"",type:r.type||"",status:r.status||"",party:r.party||"",candidate:r.candidate||"",candidateType:r.candidateType||"",
        district:r.district||"",observation:r.observation||"",maps:mapsUrl?"Abrir ubicación":"",reviewer:r.reviewer||""
      });

      const row=ws.getRow(rowNo);row.height=168;
      row.alignment={vertical:"middle",wrapText:true};
      row.font={size:10,color:{argb:"FF172033"}};
      if(i%2===0)row.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF8FAFD"}};
      else row.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFFFFFF"}};
      row.border={bottom:{style:"thin",color:{argb:"FFD9E2F0"}}};

      // Jerarquía visual en columnas clave
      ws.getCell(rowNo,1).font={bold:true,size:12,color:{argb:"FF0A2E73"}};
      ws.getCell(rowNo,3).font={bold:true,size:10,color:{argb:"FF0A2E73"}};
      ws.getCell(rowNo,4).font={bold:true,size:10,color:{argb:"FF0A2E73"}};
      ws.getCell(rowNo,9).font={bold:true,size:10,color:{argb:"FF0A2E73"}};
      ws.getCell(rowNo,10).font={bold:true,size:10,color:{argb:"FF2F6BFF"}};
      ws.getCell(rowNo,13).font={bold:true,size:10,color:{argb:r.status==="Activo"?"FF15803D":"FF92400E"}};
      ws.getCell(rowNo,5).alignment={vertical:"middle",wrapText:true};
      ws.getCell(rowNo,8).alignment={vertical:"middle",wrapText:true};
      ws.getCell(rowNo,18).alignment={vertical:"middle",wrapText:true};
      // Hipervínculos funcionales a Google Maps: DIRECCIÓN + LAT/LONG + MAPA
      Reports.hyperlinkCell(ws.getCell(rowNo,5),r.address||"Ubicación pendiente",mapsUrl);
      Reports.hyperlinkCell(ws.getCell(rowNo,6),latlongText,mapsUrl,{center:true});
      Reports.hyperlinkCell(ws.getCell(rowNo,19),mapsUrl?"📍 Abrir ubicación":"Sin ubicación",mapsUrl,{center:true});

      // FOTO: grande, centrada, sin deformar. El anclaje cubre una sola fila.
      try{
        const imageData=r.stampedImage||r.image,base64=imageData.split(",")[1];
        const imgId=wb.addImage({base64,extension:"jpeg"});
        const dim=await Reports.imageSize(imageData),aspect=Math.max(.18,Math.min(6,dim.width/dim.height));
        const boxW=198,boxH=212;
        let drawW=boxW,drawH=drawW/aspect;
        if(drawH>boxH){drawH=boxH;drawW=drawH*aspect;}
        const xPad=(boxW-drawW)/2,yPad=(boxH-drawH)/2;
        // ExcelJS ext usa píxeles y conserva proporción. editAs oneCell mantiene la imagen asociada a su fila/celda.
        ws.addImage(imgId,{tl:{col:1,row:rowNo-1},ext:{width:drawW,height:drawH},editAs:"oneCell"});
      }catch(_){ }
    }

    ws.getColumn(1).alignment={vertical:"middle",horizontal:"center"};
    ws.getColumn(2).alignment={vertical:"middle",horizontal:"center"};
    ws.getColumn(3).alignment={vertical:"middle",horizontal:"center"};
    ws.getColumn(4).alignment={vertical:"middle",horizontal:"center"};
    ws.getColumn(6).alignment={vertical:"middle",horizontal:"center",wrapText:true};
    ws.getColumn(7).alignment={vertical:"middle",horizontal:"center",wrapText:true};
    ws.getColumn(8).alignment={vertical:"middle",horizontal:"center",wrapText:true};
    ws.getColumn(9).alignment={vertical:"middle",horizontal:"center",wrapText:true};
    ws.getColumn(10).alignment={vertical:"middle",horizontal:"center",wrapText:true};
    ws.getColumn(11).alignment={vertical:"middle",horizontal:"center"};
    ws.getColumn(12).alignment={vertical:"middle",horizontal:"center",wrapText:true};
    ws.getColumn(13).alignment={vertical:"middle",horizontal:"center"};
    ws.getColumn(19).alignment={vertical:"middle",horizontal:"center"};
    ws.pageSetup={orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:.25,right:.25,top:.45,bottom:.45,header:.2,footer:.2}};
    ws.headerFooter={oddHeader:"&L&14&BONE SHOT&RReporte de evidencias",oddFooter:"&LUna toma. Evidencia real.&C&P de &N&R&D &T"};

    // =========================================================
    // 2) DATOS TÉCNICOS: todo lo auditable sin ensuciar la hoja visual
    // =========================================================
    const tech=wb.addWorksheet("DATOS_TECNICOS",{views:[{state:"frozen",ySplit:1}]});
    tech.columns=[
      {header:"N°",key:"n",width:6},{header:"CÓDIGO",key:"code",width:24},{header:"VERIFICADOR",key:"verify",width:18},
      {header:"FECHA",key:"fecha",width:13},{header:"HORA",key:"hora",width:13},{header:"FUENTE HORARIA",key:"timeSource",width:22},
      {header:"DIRECCIÓN",key:"address",width:44},{header:"CALLE",key:"street",width:24},{header:"NÚMERO",key:"houseNumber",width:10},{header:"CÓDIGO POSTAL",key:"postcode",width:14},{header:"CIUDAD",key:"city",width:18},{header:"PAÍS",key:"country",width:14},
      {header:"LATITUD",key:"lat",width:17},{header:"LONGITUD",key:"lon",width:17},{header:"PRECISIÓN",key:"accuracy",width:12},{header:"ALTITUD",key:"altitude",width:12},{header:"ORIENTACIÓN",key:"heading",width:16},{header:"UBIGEO",key:"ubigeo",width:16},
      {header:"RESOLUCIÓN",key:"resolution",width:18},{header:"ORIENTACIÓN FOTO",key:"photoOrientation",width:18},{header:"ORIENTACIÓN EQUIPO",key:"deviceOrientation",width:18},{header:"LENTE",key:"cameraLabel",width:26},{header:"ZOOM",key:"cameraZoom",width:10},
      {header:"SHA-256 ORIGINAL",key:"hash",width:68},{header:"SHA-256 MARCADA",key:"stampedHash",width:68},
      {header:"PROCESO",key:"process",width:12},{header:"TIPO ELECCIÓN",key:"etype",width:17},{header:"TIPO EVIDENCIA",key:"type",width:18},{header:"ESTADO",key:"status",width:13},{header:"PARTIDO",key:"party",width:24},{header:"CANDIDATO",key:"candidate",width:24},{header:"CARGO",key:"candidateType",width:18},{header:"DISTRITO",key:"district",width:18},{header:"OBSERVACIÓN",key:"observation",width:32},{header:"REVISOR",key:"reviewer",width:22},{header:"MAPA",key:"maps",width:16}
    ];
    const techHead=tech.getRow(1);techHead.height=30;techHead.font={bold:true,color:{argb:"FFFFFFFF"}};techHead.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF13264A"}};techHead.alignment={vertical:"middle",horizontal:"center",wrapText:true};tech.autoFilter={from:"A1",to:`${tech.getColumn(tech.columnCount).letter}1`};
    data.forEach((r,i)=>{
      const heading=r.heading!=null?`${Math.round(r.heading)}° ${r.cardinal||""}`:"";
      const mapsUrl=Reports.mapsUrl(r);
      tech.addRow({n:i+1,code:r.photoCode,verify:r.verifyCode,fecha:r.fecha,hora:r.hora,timeSource:r.timeSource==="SERVIDOR"?"Servidor sincronizado":"Reloj local",address:r.address,street:r.street,houseNumber:r.houseNumber,postcode:r.postcode,city:r.city,country:r.country,lat:r.gps?.latitude??"",lon:r.gps?.longitude??"",accuracy:r.accuracy!=null?`±${Math.round(r.accuracy)} m`:"",altitude:r.altitude!=null?`${Math.round(r.altitude)} m`:"",heading,ubigeo:r.ubigeo,resolution:r.sourceWidth&&r.sourceHeight?`${r.sourceWidth} × ${r.sourceHeight}`:"",photoOrientation:r.photoOrientation||"",deviceOrientation:r.deviceOrientation||"",cameraLabel:r.cameraLabel||"",cameraZoom:r.cameraZoom?`${Number(r.cameraZoom).toFixed(1)}x`:"",hash:r.sourceHash||"",stampedHash:r.stampedHash||"",process:r.electionProcess||"",etype:r.electionType||"",type:r.type||"",status:r.status||"",party:r.party||"",candidate:r.candidate||"",candidateType:r.candidateType||"",district:r.district||"",observation:r.observation||"",reviewer:r.reviewer||"",maps:mapsUrl?"Abrir ubicación":""});
      const rn=i+2;tech.getRow(rn).alignment={vertical:"middle",wrapText:true};if(i%2===0)tech.getRow(rn).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF8FAFC"}};
      // En datos técnicos también se puede abrir Maps desde dirección, latitud, longitud o botón MAPA.
      Reports.hyperlinkCell(tech.getCell(rn,7),r.address||"Ubicación pendiente",mapsUrl);
      Reports.hyperlinkCell(tech.getCell(rn,13),r.gps?.latitude??"",mapsUrl,{center:true});
      Reports.hyperlinkCell(tech.getCell(rn,14),r.gps?.longitude??"",mapsUrl,{center:true});
      Reports.hyperlinkCell(tech.getCell(rn,36),mapsUrl?"📍 Abrir ubicación":"Sin ubicación",mapsUrl,{center:true});
    });

    // =========================================================
    // 3) LUGARES + HISTORIAL (ONE SHOT 4.0)
    // =========================================================
    const placesWs=wb.addWorksheet("LUGARES",{views:[{state:"frozen",ySplit:1}]});
    placesWs.columns=[{header:"CÓDIGO PUNTO",key:"code",width:18},{header:"TIPO",key:"type",width:18},{header:"NOMBRE",key:"name",width:30},{header:"DIRECCIÓN",key:"address",width:40},{header:"LAT/LONG",key:"coords",width:27},{header:"ESTADO",key:"status",width:15},{header:"PRIMERA VISITA",key:"first",width:20},{header:"ÚLTIMA VISITA",key:"last",width:20},{header:"EVIDENCIAS",key:"count",width:12},{header:"PROCESOS",key:"processes",width:24},{header:"MAPA",key:"maps",width:16}];
    const ph=placesWs.getRow(1);ph.font={bold:true,color:{argb:"FFFFFFFF"}};ph.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0A2E73"}};ph.alignment={vertical:"middle",horizontal:"center"};
    const usedPlaceIds=new Set(data.map(r=>r.placeId).filter(Boolean));
    (State.places||[]).filter(p=>usedPlaceIds.has(p.id)).forEach((p,i)=>{const rs=State.records.filter(r=>r.placeId===p.id),coords=`${Number(p.latitude).toFixed(6)}, ${Number(p.longitude).toFixed(6)}`,url=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.latitude},${p.longitude}`)}`;placesWs.addRow({code:p.code,type:p.type,name:p.name,address:p.address,coords,status:p.status,first:p.firstSeen,last:p.lastSeen,count:rs.length,processes:[...new Set(rs.map(r=>r.electionProcess).filter(Boolean))].join(", "),maps:"Abrir ubicación"});const rn=i+2;Reports.hyperlinkCell(placesWs.getCell(rn,4),p.address||"Sin dirección",url);Reports.hyperlinkCell(placesWs.getCell(rn,5),coords,url,{center:true});Reports.hyperlinkCell(placesWs.getCell(rn,11),"📍 Abrir ubicación",url,{center:true});});
    placesWs.autoFilter={from:"A1",to:"K1"};

    const historyWs=wb.addWorksheet("HISTORIAL",{views:[{state:"frozen",ySplit:1}]});
    historyWs.columns=[{header:"PUNTO",key:"place",width:18},{header:"FECHA",key:"date",width:13},{header:"HORA",key:"time",width:12},{header:"PROCESO",key:"process",width:14},{header:"RELACIÓN",key:"relation",width:18},{header:"TIPO",key:"type",width:18},{header:"PARTIDO",key:"party",width:24},{header:"CANDIDATO",key:"candidate",width:24},{header:"CÓDIGO FOTO",key:"photo",width:24},{header:"OBSERVACIÓN",key:"obs",width:34}];
    const hh=historyWs.getRow(1);hh.font={bold:true,color:{argb:"FFFFFFFF"}};hh.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF13264A"}};hh.alignment={vertical:"middle",horizontal:"center"};
    data.filter(r=>r.placeId).sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0)).forEach(r=>historyWs.addRow({place:Places.get(r.placeId)?.code||r.placeId,date:r.fecha,time:r.hora,process:r.electionProcess,relation:r.placeRelation||"Registro",type:r.type,party:r.party,candidate:r.candidate,photo:r.photoCode,obs:r.observation}));
    historyWs.autoFilter={from:"A1",to:"J1"};

    // =========================================================
    // 4) METADATOS DEL REPORTE
    // =========================================================
    const meta=wb.addWorksheet("METADATOS");
    meta.addRows([
      ["ONE SHOT","v4.0 BASE"],
      ["Generado",new Date().toISOString()],
      ["Registros",data.length],
      ["Hoja EVIDENCIAS","Vista principal, visual y filtrable. Dirección, Lat/Long y MAPA abren Google Maps."],
      ["Hoja DATOS_TECNICOS","Metadatos completos, hashes SHA-256 y parámetros de captura."],
      ["Nota","El verificador SHA-256 se genera localmente. La validación pública/online requiere backend de registro y sello de tiempo."]
    ]);
    meta.getColumn(1).width=26;meta.getColumn(2).width=92;meta.getColumn(1).font={bold:true,color:{argb:"FF0A2E73"}};meta.getColumn(2).alignment={wrapText:true,vertical:"top"};

    const buf=await wb.xlsx.writeBuffer();
    return new File([buf],`ONE_SHOT_EVIDENCIAS_${Dates.date()}.xlsx`,{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  },
  imageSize(dataUrl){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth||1,height:img.naturalHeight||1});img.onerror=()=>resolve({width:1,height:1});img.src=dataUrl;});},
  makeCsvBlob(data){const h=["N","Fecha","Hora","FuenteHora","Ubicacion","Coordenadas","Precision","Altitud","Orientacion","UBIGEO","Codigo","Verificador","SHA256","Proceso","Tipo","Estado","Partido","Candidato","Distrito","Observacion"],rows=data.map((r,i)=>[i+1,r.fecha,r.hora,r.timeSource,r.address,r.gps?`${r.gps.latitude},${r.gps.longitude}`:"",r.accuracy,r.altitude,r.heading!=null?`${r.heading} ${r.cardinal||""}`:"",r.ubigeo,r.photoCode,r.verifyCode,r.sourceHash,r.electionProcess,r.type,r.status,r.party,r.candidate,r.district,r.observation]),csv=[h,...rows].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");return new File(["\uFEFF",csv],`ONE_SHOT_${Dates.date()}.csv`,{type:"text/csv;charset=utf-8"});},
  preview(){const data=Evidence.selectedForReport();$("reportPreviewList").innerHTML=data.map((r,i)=>`<article class="previewItem"><img src="${r.stampedImage||r.image}" alt="${esc(r.photoCode)}"><div><b>${i+1}. ${esc(r.type||"PENDIENTE")} · ${esc(r.party||"Partido pendiente")}</b><p>${esc(r.address||"Ubicación pendiente")}</p><p>${esc(r.fecha)} ${esc(r.hora)} · ${r.gps?`GPS ±${Math.round(r.gps.accuracy)}m`:"GPS pendiente"}${r.heading!=null?` · ${Math.round(r.heading)}° ${esc(r.cardinal||"")}`:""}${r.altitude!=null?` · ${Math.round(r.altitude)}m`:""}</p><code>${esc(r.photoCode)} · V ${esc(r.verifyCode||"PENDIENTE")}</code></div></article>`).join("")||"Sin evidencias";$("reportPreviewModal").classList.add("open");},
  async getFile(){const key=Reports.key();if(State.reportCache.key===key&&State.reportCache.file)return State.reportCache.file;return Reports.prepare();},
  async download(){try{UI.toast("Preparando Excel…");const f=await Reports.getFile();await Share.downloadFile(f);UI.toast("Excel listo para guardar");}catch(e){UI.toast(e.message||String(e),3800)}},
  async share(){try{const f=await Reports.getFile();await Share.shareFile(f,"ONE SHOT · Se remite reporte de evidencia fotográfica.");}catch(e){UI.toast(e.message||String(e),3800)}},
  async csv(){try{await Share.downloadFile(Reports.makeCsvBlob(Evidence.selectedForReport()));}catch(e){UI.toast(e.message||String(e),3500)}}
};

const APKBridge = {
  isNative(){try{return!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())}catch(_){return false}},
  plugin(){return window.Capacitor?.Plugins?.OneShotShare}
};

const Share = {
  dataUrlToFile(dataUrl, name){const [head,data]=dataUrl.split(","),mime=(head.match(/data:([^;]+)/)||[])[1]||"application/octet-stream",bin=atob(data),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new File([arr],name,{type:mime});},
  async fileBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",").pop());r.onerror=reject;r.readAsDataURL(file);});},
  async downloadFile(file){
    const p=APKBridge.plugin();
    if(APKBridge.isNative()&&p){const b=await Share.fileBase64(file);if(p.saveFileToDownloads)return p.saveFileToDownloads({filename:file.name,mimeType:file.type,base64:b});if(p.saveExcelToDownloads)return p.saveExcelToDownloads({filename:file.name,mimeType:file.type,base64:b});}
    if(window.showSaveFilePicker){
      try{const handle=await window.showSaveFilePicker({suggestedName:file.name,types:[{description:"ONE SHOT",accept:{[file.type||"application/octet-stream"]:[`.${file.name.split(".").pop()}`]}}]});const writable=await handle.createWritable();await writable.write(file);await writable.close();return;}catch(e){if(e.name==="AbortError")return;}
    }
    const url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download=file.name;a.rel="noopener";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},2500);
  },
  async shareFile(file,text="ONE SHOT · Una toma. Evidencia real.",recipient=null){
    recipient=recipient||await Recipients.choose();if(recipient===false)return;const phone=recipient?.phone||State.settings.phone||"";const named=recipient?`${text}
Destinatario: ${recipient.name}${recipient.role?` · ${recipient.role}`:""}`:text;
    const p=APKBridge.plugin();
    if(APKBridge.isNative()&&p){const b=await Share.fileBase64(file);if(p.shareFileToWhatsApp){await p.shareFileToWhatsApp({phone,message:named,filename:file.name,mimeType:file.type,base64:b});UI.toast("Compartir abierto");return;}if(p.shareExcelToWhatsApp){await p.shareExcelToWhatsApp({phone,message:named,filename:file.name,mimeType:file.type,base64:b});UI.toast("WhatsApp abierto");return;}}
    if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({title:"ONE SHOT",text:named,files:[file]});return;}catch(e){if(e.name==="AbortError")return;}}
    await Share.downloadFile(file);UI.toast("Archivo guardado. Compártelo desde Descargas.",3500);
  },
  async msgFernando(){const r=await Recipients.choose();if(r===false)return;const t=encodeURIComponent(`ONE SHOT · Una toma, evidencia real.\nSe remite reporte de evidencia fotográfica.\nDestinatario: ${r.name}${r.role?` · ${r.role}`:""}`);window.open(`https://wa.me/${r.phone}?text=${t}`,"_blank","noopener");}
};


const LayoutManager = {
  orientation(){return innerWidth>innerHeight?"landscape":"portrait";},
  current(){State.settings.layouts=State.settings.layouts||{portrait:{},landscape:{}};return State.settings.layouts[LayoutManager.orientation()]||(State.settings.layouts[LayoutManager.orientation()]={});},
  videoRect(){const stage=$("cameraStage"),v=$("video"),b=stage?.getBoundingClientRect();if(!b)return null;if((State.settings.framing||"exact")!=="exact"||!v?.videoWidth||!v?.videoHeight)return{left:b.left,top:b.top,width:b.width,height:b.height,right:b.right,bottom:b.bottom};const ar=v.videoWidth/v.videoHeight,sar=b.width/b.height;let width,height;if(ar>sar){width=b.width;height=width/ar;}else{height=b.height;width=height*ar;}const left=b.left+(b.width-width)/2,top=b.top+(b.height-height)/2;return{left,top,width,height,right:left+width,bottom:top+height};},
  captureAnchor(key){const el=document.querySelector(`[data-layout-key="${key}"]`),vr=key==="watermark"?LayoutManager.videoRect():$("cameraStage")?.getBoundingClientRect();if(!el||!vr)return null;const a=el.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(a.left+a.width/2-vr.left)/vr.width)),y:Math.max(0,Math.min(1,(a.top+a.height/2-vr.top)/vr.height))};},
  apply(){const stage=$("cameraStage");if(!stage)return;const lay=LayoutManager.current(),keys=["tools","dock","watermark","brand"];let any=false;for(const key of keys){const el=document.querySelector(`[data-layout-key="${key}"]`),pos=lay[key];if(!el)continue;if(pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.y)){any=true;el.classList.add("layoutPlaced");el.style.setProperty("--layout-left",`${pos.x*100}%`);el.style.setProperty("--layout-top",`${pos.y*100}%`);}else{el.classList.remove("layoutPlaced");el.style.removeProperty("--layout-left");el.style.removeProperty("--layout-top");el.style.left="";el.style.top="";el.style.right="";el.style.bottom="";el.style.transform="";}}stage.classList.toggle("customLayout",any);if($("layoutOrientationLabel"))$("layoutOrientationLabel").textContent=LayoutManager.orientation()==="portrait"?"VERTICAL":"HORIZONTAL";},
  enter(){if(State.cameraStatus!=="active")return UI.toast("Abre la cámara antes de mover controles");State.layoutEditing=true;State.controlsHidden=false;State.controlsHiddenPersistent=false;$("cameraStage").classList.remove("controlsHidden");State.layoutDraft=JSON.parse(JSON.stringify(LayoutManager.current()));$("cameraStage").classList.add("layoutEditing");$("cameraOptions").classList.remove("open");$("cameraStage")?.classList.remove("optionsOpen");Camera.touchControls();UI.toast("Arrastra los grupos y guarda el diseño");},
  exit(save=true){if(!State.layoutEditing)return;if(!save&&State.layoutDraft){State.settings.layouts[LayoutManager.orientation()]=State.layoutDraft;}State.layoutEditing=false;State.layoutDraft=null;$("cameraStage").classList.remove("layoutEditing");LayoutManager.apply();Store.saveLite();UI.toast(save?"Diseño guardado":"Cambios descartados");},
  reset(){State.settings.layouts=State.settings.layouts||{portrait:{},landscape:{}};State.settings.layouts[LayoutManager.orientation()]={};Store.saveLite();LayoutManager.apply();UI.toast(`Diseño ${LayoutManager.orientation()==="portrait"?"vertical":"horizontal"} restablecido`);},
  bindDrag(){for(const el of $$(".draggableGroup")){let active=false,dx=0,dy=0;el.addEventListener("pointerdown",e=>{if(!State.layoutEditing)return;active=true;el.setPointerCapture?.(e.pointerId);const r=el.getBoundingClientRect();dx=e.clientX-(r.left+r.width/2);dy=e.clientY-(r.top+r.height/2);e.preventDefault();});el.addEventListener("pointermove",e=>{if(!active||!State.layoutEditing)return;const stage=$("cameraStage"),sr=stage.getBoundingClientRect(),er=el.getBoundingClientRect(),safe=12;let cx=e.clientX-dx,cy=e.clientY-dy;cx=Math.max(sr.left+er.width/2+safe,Math.min(sr.right-er.width/2-safe,cx));cy=Math.max(sr.top+er.height/2+safe+50,Math.min(sr.bottom-er.height/2-safe-60,cy));const x=(cx-sr.left)/sr.width,y=(cy-sr.top)/sr.height;const key=el.dataset.layoutKey;LayoutManager.current()[key]={x,y};el.classList.add("layoutPlaced");el.style.setProperty("--layout-left",`${x*100}%`);el.style.setProperty("--layout-top",`${y*100}%`);stage.classList.add("customLayout");e.preventDefault();});const up=()=>active=false;el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);}},
  rotate(){if(State.layoutEditing)LayoutManager.exit(true);setTimeout(()=>{LayoutManager.apply();Sensors.paintLevel();},220);}
};

const Recipients = {
  normalize(){let list=Array.isArray(State.settings.recipients)?State.settings.recipients:[];if(!list.length&&State.settings.phone)list=[{id:"default",name:"Encargado",role:"",phone:State.settings.phone,isDefault:true}];if(!list.length)list=[{id:"default",name:"Destinatario",role:"",phone:"",isDefault:true}];State.settings.recipients=list;let d=list.find(x=>x.id===State.settings.defaultRecipientId)||list.find(x=>x.isDefault)||list[0];State.settings.defaultRecipientId=d?.id||"";list.forEach(x=>x.isDefault=x.id===State.settings.defaultRecipientId);State.settings.phone=d?.phone||State.settings.phone||"";return list;},
  render(){const list=Recipients.normalize(),box=$("recipientList");if(!box)return;box.innerHTML=list.map(r=>`<div class="recipientRow" data-id="${esc(r.id)}"><div><strong>${esc(r.name)}${r.isDefault?'<span class="defaultBadge">PREDET.</span>':''}</strong><small>${esc(r.role||"Sin cargo")} · +${esc(r.phone||"sin número")}</small></div><button data-rec-act="default">Usar</button><button data-rec-act="edit">Editar</button><button data-rec-act="delete">Borrar</button></div>`).join("");},
  openEdit(id=""){const r=Recipients.normalize().find(x=>x.id===id);$("recipientId").value=r?.id||"";$("recipientName").value=r?.name||"";$("recipientRole").value=r?.role||"";$("recipientPhone").value=r?.phone||"";$("recipientDefault").checked=r?.isDefault||!id;$("recipientEditModal").classList.add("open");},
  async saveForm(){const id=$("recipientId").value||`rec-${Date.now()}`,name=$("recipientName").value.trim(),role=$("recipientRole").value.trim(),phone=$("recipientPhone").value.replace(/\D/g,"");if(!name||!phone)return UI.toast("Completa nombre y WhatsApp");let list=Recipients.normalize(),r=list.find(x=>x.id===id);if(r)Object.assign(r,{name,role,phone});else list.push(r={id,name,role,phone,isDefault:false});if($("recipientDefault").checked){State.settings.defaultRecipientId=id;list.forEach(x=>x.isDefault=x.id===id);}Recipients.normalize();Store.saveLite();Recipients.render();$("recipientEditModal").classList.remove("open");UI.toast("Destinatario guardado");},
  setDefault(id){State.settings.defaultRecipientId=id;Recipients.normalize();Store.saveLite();Recipients.render();UI.toast("Destinatario predeterminado actualizado");},
  remove(id){let list=Recipients.normalize();if(list.length<=1)return UI.toast("Debes conservar al menos un destinatario");const r=list.find(x=>x.id===id);if(!r||!confirm(`¿Eliminar a ${r.name} de destinatarios?`))return;State.settings.recipients=list.filter(x=>x.id!==id);if(State.settings.defaultRecipientId===id)State.settings.defaultRecipientId=State.settings.recipients[0]?.id||"";Recipients.normalize();Store.saveLite();Recipients.render();},
  choose(){return new Promise(resolve=>{const list=Recipients.normalize();if(list.length===1){resolve(list[0]);return;}const box=$("recipientChoiceList");box.innerHTML=list.map(r=>`<button class="recipientChoice" data-id="${esc(r.id)}"><i>${esc((r.name||"?").slice(0,1).toUpperCase())}</i><span><b>${esc(r.name)}</b><small>${esc(r.role||"Sin cargo")} · +${esc(r.phone)}</small></span><em>${r.isDefault?"PREDET.":"ELEGIR"}</em></button>`).join("");$("recipientModal").classList.add("open");State.recipientResolver=resolve;});},
  chooseDone(id){const r=Recipients.normalize().find(x=>x.id===id)||false;$("recipientModal").classList.remove("open");const fn=State.recipientResolver;State.recipientResolver=null;fn?.(r);},
  cancelChoose(){ $("recipientModal").classList.remove("open");const fn=State.recipientResolver;State.recipientResolver=null;fn?.(false); }
};

const AppUpdater = {
  resolver:null,
  async feed(){const url=APKBridge.isNative()?`${UPDATE_FEED_URL}?t=${Date.now()}`:`version.json?t=${Date.now()}`;const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("No se pudo leer la versión publicada");return r.json();},
  prompt(remote){return new Promise(resolve=>{AppUpdater.resolver=resolve;if($("updateModalVersion"))$("updateModalVersion").textContent=`${remote.version||remote.build} · lista para instalar`;$("updateModal")?.classList.add("open");});},
  promptDone(ok){$("updateModal")?.classList.remove("open");const fn=AppUpdater.resolver;AppUpdater.resolver=null;fn?.(!!ok);},
  async check(force=false){
    if(!navigator.onLine)return UI.toast("Sin internet: no se puede buscar actualización");
    const btn=$("toolUpdateApp"),txt=$("updateAppText");btn?.classList.add("busy");if(txt)txt.textContent="Buscando versión nueva…";
    try{
      const remote=await AppUpdater.feed();
      const appliedBuild=localStorage.getItem("oneshotAppliedBuild")||"";
      const dismissedBuild=localStorage.getItem("oneshotDismissedBuild")||"";
      const same=remote.build===VERSION||remote.build===appliedBuild;
      if(same&&!force){if(txt)txt.textContent=`Actualizado · ${remote.version||VERSION}`;return;}
      if(remote.build===dismissedBuild&&!force){if(txt)txt.textContent=`Disponible · ${remote.version||remote.build}`;return;}
      if(same&&force){
        if(APKBridge.isNative()){if(txt)txt.textContent="Ya tienes la última versión";UI.toast(`ONE SHOT ${remote.version||VERSION} está actualizado`);return;}
        if(txt)txt.textContent="Recargando archivos publicados…";await AppUpdater.refreshPwa(remote);return;
      }
      const accept=await AppUpdater.prompt(remote);
      if(!accept){localStorage.setItem("oneshotDismissedBuild",remote.build||"");if(txt)txt.textContent="Actualización disponible";return;}
      localStorage.setItem("oneshotAppliedBuild",remote.build||VERSION);
      localStorage.removeItem("oneshotDismissedBuild");
      await AppUpdater.install(remote);
    }catch(e){if(txt)txt.textContent="No se pudo comprobar actualización";UI.toast(e.message||String(e),3500);}finally{btn?.classList.remove("busy");}
  },
  async refreshPwa(remote){
    UI.toast("Actualizando archivos de ONE SHOT…",3500);
    if(remote?.build)localStorage.setItem("oneshotAppliedBuild",remote.build);
    const regs=await navigator.serviceWorker?.getRegistrations?.()||[];
    for(const reg of regs){try{await reg.update();if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});}catch(_){}}
    const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith("oneshot-")).map(k=>caches.delete(k)));
    sessionStorage.setItem("oneshotUpdatedFrom",VERSION);
    location.replace(`${location.pathname}?refresh=${Date.now()}&v=${encodeURIComponent(remote?.build||VERSION)}`);
  },
  async install(remote){if(APKBridge.isNative()){const p=APKBridge.plugin();if(!remote.apkUrl)return UI.toast("Actualización detectada, pero la versión publicada todavía no tiene APK enlazado.",4200);if(!p?.installApkUpdate)return UI.toast("Este APK no incluye el instalador de actualización. Instala esta versión una vez; las siguientes podrán actualizarse encima.",4500);UI.toast("Descargando actualización APK…",5000);try{await p.installApkUpdate({url:remote.apkUrl,filename:remote.apkFilename||"ONE_SHOT_update.apk"});UI.toast("Android abrirá el instalador. No desinstales ONE SHOT.",5000);}catch(e){UI.toast(e.message||String(e),4500);}return;}return AppUpdater.refreshPwa(remote);}
};

const Quality = {
  async check(r){try{const img=await Watermark.load(r.image),c=document.createElement("canvas"),ctx=c.getContext("2d",{willReadFrequently:true}),w=64,h=Math.max(40,Math.round(64*img.naturalHeight/img.naturalWidth));c.width=w;c.height=h;ctx.drawImage(img,0,0,w,h);const d=ctx.getImageData(0,0,w,h).data;let sum=0,n=0;for(let y=1;y<h;y++)for(let x=1;x<w;x++){const i=(y*w+x)*4,j=(y*w+x-1)*4,k=((y-1)*w+x)*4;const lum=(d[i]*.299+d[i+1]*.587+d[i+2]*.114),l1=(d[j]*.299+d[j+1]*.587+d[j+2]*.114),l2=(d[k]*.299+d[k+1]*.587+d[k+2]*.114);sum+=Math.abs(lum-l1)+Math.abs(lum-l2);n+=2;}r.sharpnessScore=Math.round(sum/Math.max(1,n));let lumSum=0,pix=0;for(let i=0;i<d.length;i+=4){lumSum+=d[i]*.299+d[i+1]*.587+d[i+2]*.114;pix++;}r.brightnessScore=Math.round(lumSum/Math.max(1,pix));const warnings=[];if(r.sharpnessScore<5)warnings.push("posible desenfoque");if(r.brightnessScore<38)warnings.push("muy oscura");if(r.brightnessScore>225)warnings.push("muy clara");r.sharpnessStatus=warnings.length?"Revisar":"OK";r.qualityWarnings=warnings;await Store.save(r);if(warnings.length){UI.toast(`⚠ Calidad: ${warnings.join(" · ")}`,5000,{placement:"top",tone:"soft"});if(QuickCapture.currentId===r.id&&$("quickCaptureContext")){$("quickCaptureContext").textContent=`⚠ ${warnings.join(" · ")} · Ver para revisar`;$("quickCaptureBar")?.classList.add("show");clearTimeout(QuickCapture.timer);QuickCapture.timer=setTimeout(()=>$("quickCaptureBar")?.classList.remove("show"),10000);}}}catch(_){} }
};


const Offline = {
  paint(){const el=$("trustOnline");if(!el)return;el.textContent=navigator.onLine?"ONLINE":"OFFLINE";el.className=navigator.onLine?"ok":"warn";const pending=State.records.filter(r=>r.gps&&(!r.address||/pendiente|sin conexión/i.test(r.address))).length;if($("healthStore"))$("healthStore").textContent=navigator.onLine?(pending?`${pending} por completar`:"Local · al día"):`Offline · ${pending} pendiente${pending===1?"":"s"}`;},
  async completePending(){Offline.paint();if(!navigator.onLine)return;for(const r of State.records.filter(x=>x.gps&&(!x.address||/pendiente|sin conexión/i.test(x.address))).slice(0,20)){try{Object.assign(r,await GPS.reverse(r.gps));r.stampedImage=await Watermark.stamp(r.image,r);r.stampedHash=await Evidence.imageHash(r.stampedImage);await Store.save(r);}catch(_){}}Offline.paint();}
};

const Tech = {
  open(){const r=Viewer.current();if(!r)return;$("techCode").textContent=`${r.photoCode} · V ${r.verifyCode||"PENDIENTE"}`;const items=[
    ["Fecha / hora",`${r.fecha||""} ${r.hora||""}`],["Fuente horaria",r.timeSource==="SERVIDOR"?"Servidor sincronizado":"Reloj local"],["GPS",r.gps?`${r.gps.latitude}, ${r.gps.longitude}`:"Pendiente"],["Precisión",r.accuracy?`±${Math.round(r.accuracy)} m`:"—"],["Altitud",r.altitude!=null?`${Math.round(r.altitude)} m`:"—"],["Rumbo",r.heading!=null?`${Math.round(r.heading)}° ${r.cardinal||""}`:"—"],["Resolución",r.sourceWidth&&r.sourceHeight?`${r.sourceWidth} × ${r.sourceHeight}`:"—"],["Foto",r.photoOrientation||"—"],["Equipo",`${r.deviceOrientation||"—"} · pantalla ${r.screenAngle??"—"}°`],["Lente",r.cameraLabel||"No expuesto"],["Zoom",r.cameraZoom?`${Number(r.cameraZoom).toFixed(1)}x${r.hardwareZoom?" · óptico/hardware":" · digital"}`:"—"],["Nitidez",r.sharpnessScore!=null?`${r.sharpnessScore} · ${r.sharpnessStatus||""}`:"—"],["Dirección",r.address||"Pendiente","full"],["Revisiones GPS",String(Array.isArray(r.gpsHistory)?r.gpsHistory.length:0)],["SHA-256 original",r.sourceHash||"Pendiente","full","code"],["SHA-256 marcada",r.stampedHash||"Pendiente","full","code"]];$("techBody").innerHTML=items.map(([k,v,cl="",tag="span"])=>`<div class="techItem ${cl}"><b>${esc(k)}</b><${tag}>${esc(v)}</${tag}></div>`).join("");$("techModal").classList.add("open");}
};

function bind(){
  UI.platform();UI.updateClock();setInterval(UI.updateClock,1000);setInterval(()=>{if(navigator.onLine)TimeTrust.sync();},600000);UI.applyLayout();TimeTrust.paint();GPS.paintHealth();Camera.setStatus("idle");
  $$(".bottomNav button").forEach(b=>b.onclick=()=>UI.setView(b.dataset.view));
  $("startCameraBtn").onclick=async()=>{Sensors.enable().catch(()=>{});TimeTrust.sync().catch(()=>{});await Camera.start();};
  $("retryCameraBtn").onclick=async()=>{Sensors.enable().catch(()=>{});await Camera.start({force:true});};$("releaseCameraBtn").onclick=Camera.release;$("permissionHelpBtn")?.addEventListener("click",()=>PermissionAssistant.open("camera",State.cameraErrorKind||"permission"));
  $("resetCaptureBtn").onclick=Camera.restart;$("switchCameraBtn").onclick=()=>Camera.switchLens(false);$("torchBtn").onclick=Camera.toggleTorch;$("refreshGpsBtn").onclick=GPS.refresh;$("gpsChip").onclick=GPS.refresh;
  $("orientationChip").onclick=e=>{e.preventDefault();e.stopPropagation();Sensors.cycleOrientationMode();};
  $("quickCaptureView")?.addEventListener("click",QuickCapture.view);$("quickCaptureEdit")?.addEventListener("click",QuickCapture.edit);$("quickCaptureReview")?.addEventListener("click",QuickCapture.review);$("quickCaptureClose")?.addEventListener("click",QuickCapture.hide);$("ghostOverlayClose")?.addEventListener("click",GhostOverlay.close);$("relationGhostBtn")?.addEventListener("click",()=>{const prev=State.records.find(x=>x.id===State.pendingPreviousId);if(prev)GhostOverlay.activate(prev);else UI.toast("La base importada no incluye una fotografía local para superponer");});$("bulkEditSelected")?.addEventListener("click",Bulk.openEdit);$("bulkEditClose")?.addEventListener("click",Bulk.closeEdit);$("bulkEditApply")?.addEventListener("click",Bulk.applyEdit);$("missionStartBtn")?.addEventListener("click",Mission.start);$("missionEndBtn")?.addEventListener("click",Mission.end);$("placesRadarBtn")?.addEventListener("click",Radar.open);$("radarClose")?.addEventListener("click",Radar.close);$("routeStartBtn")?.addEventListener("click",RouteCoverage.start);$("routeStopBtn")?.addEventListener("click",RouteCoverage.stop);$("coverageMapBtn")?.addEventListener("click",RouteCoverage.openMap);$("coverageClose")?.addEventListener("click",RouteCoverage.closeMap);$("coveragePeriod")?.addEventListener("change",()=>{if($("coverageModal")?.classList.contains("open")){RouteCoverage.drawRealMap();RouteCoverage.draw($("coverageCanvas"));}});
  $("toolMenuBtn").onclick=e=>{e.preventDefault();e.stopPropagation();Camera.toggleToolTray();};$("layoutCameraBtn").onclick=e=>{e.preventDefault();e.stopPropagation();State.controlsHiddenPersistent=false;Camera.touchControls(true);const panel=$("cameraOptions"),stage=$("cameraStage");const opening=!panel.classList.contains("open");panel.classList.toggle("open",opening);stage?.classList.toggle("optionsOpen",opening);};$("cleanScreenBtn").onclick=e=>{e.stopPropagation();Camera.toggleControls();};$("editLayoutBtn").onclick=LayoutManager.enter;$("resetLayoutBtn").onclick=LayoutManager.reset;$("saveLayoutBtn").onclick=()=>LayoutManager.exit(true);$("cancelLayoutBtn").onclick=()=>LayoutManager.exit(false);$("refreshAllBtn").onclick=Camera.restart;$("toggleHudBtn").onclick=Camera.toggleControls;
  $$('[data-wm-pos]').forEach(b=>b.onclick=()=>{State.settings.watermarkPosition=b.dataset.wmPos;UI.applyLayout();Store.saveLite();});
  $$('[data-dock-pos]').forEach(b=>b.onclick=()=>{State.settings.dockPosition=b.dataset.dockPos;UI.applyLayout();Store.saveLite();});
  $$('[data-hud-mode]').forEach(b=>b.onclick=()=>{State.settings.hudMode=b.dataset.hudMode;UI.applyLayout();Store.saveLite();Camera.touchControls();});
  $$('[data-orient-mode]').forEach(b=>b.onclick=()=>{State.settings.orientationMode=b.dataset.orientMode||'auto';Store.saveLite();Sensors.smartRotate(true);Sensors.paintOrientationChip();$$('[data-orient-mode]').forEach(x=>x.classList.toggle('active',x.dataset.orientMode===State.settings.orientationMode));});
  let burstTimer=null,burstTriggered=false;$("shootBtn").addEventListener("pointerdown",e=>{e.stopPropagation();burstTriggered=false;burstTimer=setTimeout(()=>{burstTriggered=true;Camera.burst();},650)});$("shootBtn").addEventListener("pointerup",e=>{e.stopPropagation();clearTimeout(burstTimer);if(!burstTriggered)Camera.shoot();});$("shootBtn").addEventListener("pointercancel",()=>clearTimeout(burstTimer));
  $("lastShotBtn").onclick=e=>{e.stopPropagation();const r=State.records.find(x=>x.id===State.lastShotId)||State.records[0];if(r)Viewer.open(r.id);else UI.setView("Evidence")};
  $("cameraStage").addEventListener("click",e=>{
    if(e.target.closest("button,input,.cameraOptions"))return;
    const panel=$("cameraOptions"),stage=$("cameraStage");
    if(panel?.classList.contains("open")){
      panel.classList.remove("open");stage?.classList.remove("optionsOpen");Camera.touchControls();return;
    }
    Camera.focusAt(e.clientX,e.clientY);Camera.touchControls();
  });
  $$(".zoomPresets button").forEach(b=>b.onclick=e=>{e.stopPropagation();Camera.applyZoom(b.dataset.zoom)});$("zoomSlider").oninput=e=>Camera.applyZoom(e.target.value);
  $("cameraStage").addEventListener("touchstart",e=>{Camera.touchControls();if(e.touches.length===2){State.pinchStartDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);State.pinchStartZoom=State.zoom;}},{passive:true});
  $("cameraStage").addEventListener("touchmove",e=>{if(e.touches.length===2&&State.pinchStartDistance){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),ratio=d/State.pinchStartDistance;Camera.applyZoom(State.pinchStartZoom*ratio);e.preventDefault();}},{passive:false});$("cameraStage").addEventListener("touchend",()=>{State.pinchStartDistance=0},{passive:true});

  $$(".filters button").forEach(b=>b.onclick=()=>{State.filter=b.dataset.filter;$$('.filters button').forEach(x=>x.classList.toggle("active",x===b));Gallery.render()});$("searchInput").oninput=e=>{State.search=e.target.value;Gallery.render()};Gallery.bind();Places.bind();FieldBases.bind();TerritoryPlanner.bind();SmartSectorCoverage.bind();TeamMissions.bind();SmartRoute.bind();
  $('routeRecoveryContinue')?.addEventListener('click',()=>{RouteCoverage.resume();RouteCoverage.recover();$('routeCoverageCard')?.scrollIntoView({behavior:'smooth',block:'center'});});
  $('tuxHelpBtn')?.addEventListener('click',()=>{$('tuxHelpPanel')?.classList.toggle('isHidden');});
  $$('[data-tux-focus]').forEach(b=>b.addEventListener('click',()=>{const map={planner:'territoryPlanner',team:'teamMissionCard',coverage:'routeCoverageCard',route:'smartRouteCard'},id=map[b.dataset.tuxFocus];$(id)?.scrollIntoView({behavior:'smooth',block:'start'});}));
  $("selectionAllBtn").onclick=e=>{e.preventDefault();e.stopPropagation();Gallery.toggleAllVisible();};$("selectionNoneBtn").onclick=e=>{e.preventDefault();e.stopPropagation();Gallery.deselectAll();};$("bulkClose").onclick=Bulk.close;$("bulkDownloadImages").onclick=Bulk.downloadImages;$("bulkShareImages").onclick=Bulk.shareImages;$("bulkDownloadExcel").onclick=Bulk.downloadExcel;$("bulkShareExcel").onclick=Bulk.shareExcel;$("bulkPreview").onclick=Bulk.preview;$("bulkSelectAll").onclick=()=>{Gallery.selectVisible();Bulk.open();};$("bulkSelectNone").onclick=Bulk.deselectAll;$("bulkDeleteSelected").onclick=Bulk.deleteSelected;
  $("viewerClose").onclick=Viewer.close;$("viewerPrev").onclick=()=>Viewer.move(-1);$("viewerNext").onclick=()=>Viewer.move(1);$("viewerDownload").onclick=Viewer.download;$("viewerShare").onclick=Viewer.share;$("viewerVerify").onclick=Viewer.verify;$("viewerMaps").onclick=Viewer.maps;$("viewerInfoBtn").onclick=Tech.open;$("viewerEdit").onclick=()=>{const r=Viewer.current();Viewer.close();if(r)Editor.open(r.id)};
  let sx=0;const vi=$("viewerImg");vi.addEventListener("touchstart",e=>{if(e.touches.length===1)sx=e.touches[0].clientX;if(e.touches.length===2){State.viewerPinchStart=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);State.viewerPinchZoom=Number(getComputedStyle(document.documentElement).getPropertyValue("--viewerZoom").trim())||1;}},{passive:true});vi.addEventListener("touchmove",e=>{if(e.touches.length===2&&State.viewerPinchStart){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),z=Math.max(1,Math.min(4,State.viewerPinchZoom*d/State.viewerPinchStart));document.documentElement.style.setProperty("--viewerZoom",String(z));e.preventDefault();}},{passive:false});vi.addEventListener("touchend",e=>{if(State.viewerPinchStart){State.viewerPinchStart=0;return;}const dx=(e.changedTouches?.[0]?.clientX||sx)-sx;if(Math.abs(dx)>60)Viewer.move(dx>0?-1:1);},{passive:true});vi.ondblclick=()=>{const z=Number(getComputedStyle(document.documentElement).getPropertyValue("--viewerZoom").trim())||1;document.documentElement.style.setProperty("--viewerZoom",z>1?"1":"2")};
  $("editClose").onclick=Editor.close;$("editForm").onsubmit=e=>{e.preventDefault();Editor.save()};$("editOpenMaps").onclick=Editor.maps;$("editUpdateGps").onclick=Editor.updateGps;$("editUpdateAddress").onclick=Editor.updateAddress;
  $("previewReportBtn").onclick=Reports.preview;$("reportPreviewClose").onclick=()=>$("reportPreviewModal").classList.remove("open");$("previewDownloadBtn").onclick=Reports.download;$("previewShareBtn").onclick=Reports.share;$("downloadXlsxBtn").onclick=Reports.download;$("shareXlsxBtn").onclick=Reports.share;$("downloadCsvBtn").onclick=Reports.csv;$("msgFernandoBtn").onclick=Share.msgFernando;
  $("toolRestartCam").onclick=Camera.restart;$("toolRefreshGps").onclick=GPS.refresh;$("toolClearOverlays").onclick=UI.clearOverlays;$("toolUpdateApp").onclick=()=>AppUpdater.check(true);$("quickUpdateBtn").onclick=()=>AppUpdater.check(true);$("toolBackup").onclick=()=>Share.downloadFile(new File([JSON.stringify(State.records,null,2)],"ONE_SHOT_backup.json",{type:"application/json"}));if($("updateNowBtn"))$("updateNowBtn").onclick=()=>AppUpdater.promptDone(true);if($("updateLaterBtn"))$("updateLaterBtn").onclick=()=>AppUpdater.promptDone(false);if($("updateModalClose"))$("updateModalClose").onclick=()=>AppUpdater.promptDone(false);
  $("exportJsonBtn").onclick=LegacyVault.exportMaster;$("importJsonInput").onchange=async e=>{const f=e.target.files?.[0];if(f)await LegacyVault.importFile(f);e.target.value="";};
  ["presetEnabledInput","presetPartyInput","presetCandidateInput","presetTypeInput","presetCandidateTypeInput"].forEach(id=>$(id)?.addEventListener(id==="presetEnabledInput"?"change":"input",CapturePreset.sync));
  ["controlsVisibleInput","fieldModeInput","hudVisibleInput","liveWatermarkVisibleInput"].forEach(id=>$(id)?.addEventListener("change",()=>{if(id==="controlsVisibleInput")State.settings.controlsVisible=$(id).checked;else if(id==="fieldModeInput")State.settings.fieldMode=$(id).checked;else if(id==="hudVisibleInput")State.settings.hudVisible=$(id).checked;else if(id==="liveWatermarkVisibleInput")State.settings.liveWatermarkVisible=$(id).checked;UI.applyLayout();Store.saveLite();if(id==="controlsVisibleInput"){if($(id).checked){State.controlsHiddenPersistent=false;Camera.touchControls(true);}else Camera.hideControls(true);}}));
  $("orientationModeInput")?.addEventListener("change",e=>{State.settings.orientationMode=e.target.value;Store.saveLite();Sensors.smartRotate(true);UI.applyLayout();});$("cameraLensSelect")?.addEventListener("change",e=>Camera.chooseLens(e.target.value));
  $("controlToneInput")?.addEventListener("change",e=>{State.settings.controlTone=e.target.value;Store.saveLite();UI.applyLayout();});
  $("workModeInput")?.addEventListener("change",e=>{State.settings.workMode=e.target.value;Store.saveLite();FieldBases.paintStatus();});
  $("nearbyHistoryInput")?.addEventListener("change",e=>{State.settings.nearbyHistoryEnabled=e.target.checked;Store.saveLite();});
  $("saveConfigBtn").onclick=()=>{State.settings.reviewer=$("reviewerInput").value.trim();State.settings.quality=$("qualityInput").value;State.settings.framing=$("framingInput").value;State.settings.watermarkPosition=$("watermarkPositionInput").value;State.settings.watermarkScale=Number($("watermarkScaleInput").value||1);State.settings.watermarkTextScale=Number($("watermarkTextScaleInput").value||1);State.settings.institutionBrand=$("institutionBrandInput").value;State.settings.accentColor=$("accentColorInput").value||"#2f6bff";State.settings.uiScale=Number($("uiScaleInput").value||1);State.settings.dockPosition=$("dockPositionInput").value;State.settings.hudMode=$("hudModeInput").value;State.settings.autoHideControls=$("autoHideInput").value==="yes";State.settings.autoHideDelayMs=Number($("autoHideDelayInput").value||0);State.settings.galleryMode=$("galleryModeInput").value;State.settings.sensorWatermark=$("sensorWatermarkInput").value==="yes";State.settings.integrityWatermark=$("integrityWatermarkInput").value==="yes";if($("activeProcessInput"))State.settings.activeProcess=$("activeProcessInput").value||"ERM";if($("smartOrientationInput"))State.settings.smartOrientation=$("smartOrientationInput").checked;State.settings.controlsVisible=$("controlsVisibleInput")?.checked!==false;State.settings.fieldMode=$("fieldModeInput")?.checked!==false;State.settings.hudVisible=$("hudVisibleInput")?.checked!==false;State.settings.liveWatermarkVisible=$("liveWatermarkVisibleInput")?.checked!==false;State.settings.orientationMode=$("orientationModeInput")?.value||"auto";State.settings.controlTone=$("controlToneInput")?.value||"subtle";State.settings.workMode=$("workModeInput")?.value||"mixed";State.settings.nearbyHistoryEnabled=$("nearbyHistoryInput")?.checked!==false;UI.applyLayout();Store.saveLite();Gallery.render();if(State.settings.controlsVisible===false)Camera.hideControls(true);else{State.controlsHiddenPersistent=false;Camera.touchControls(true);}UI.toast("Configuración guardada · se conserva al actualizar")};$("institutionLogoInput").onchange=e=>Branding.loadCustom(e.target.files?.[0]);$("restampAllBtn").onclick=Branding.restampAll;[$("watermarkScaleInput"),$("watermarkTextScaleInput"),$("institutionBrandInput"),$("accentColorInput"),$("uiScaleInput")].filter(Boolean).forEach(el=>el.addEventListener("input",()=>{State.settings.watermarkScale=Number($("watermarkScaleInput").value||1);State.settings.watermarkTextScale=Number($("watermarkTextScaleInput").value||1);State.settings.institutionBrand=$("institutionBrandInput").value;State.settings.accentColor=$("accentColorInput").value||"#2f6bff";State.settings.uiScale=Number($("uiScaleInput").value||1);UI.applyLayout();}));
  $("addRecipientBtn").onclick=()=>Recipients.openEdit();$("recipientList").addEventListener("click",e=>{const btn=e.target.closest("[data-rec-act]"),row=e.target.closest(".recipientRow");if(!btn||!row)return;if(btn.dataset.recAct==="edit")Recipients.openEdit(row.dataset.id);else if(btn.dataset.recAct==="delete")Recipients.remove(row.dataset.id);else Recipients.setDefault(row.dataset.id);});$("recipientForm").onsubmit=e=>{e.preventDefault();Recipients.saveForm()};$("recipientEditClose").onclick=()=>$("recipientEditModal").classList.remove("open");$("recipientChoiceList").addEventListener("click",e=>{const b=e.target.closest(".recipientChoice");if(b)Recipients.chooseDone(b.dataset.id)});$("recipientModalClose").onclick=Recipients.cancelChoose;$("techClose").onclick=()=>$("techModal").classList.remove("open");LayoutManager.bindDrag();
  $("installAppBtn")?.addEventListener("click",()=>EasyInstall.install());$("installGuideBtn")?.addEventListener("click",()=>EasyInstall.open());$("shareInstallBtn")?.addEventListener("click",()=>EasyInstall.share());$("installModalClose")?.addEventListener("click",()=>EasyInstall.close());$("installModalAction")?.addEventListener("click",()=>EasyInstall.install());$("copyInstallLinkBtn")?.addEventListener("click",()=>EasyInstall.copy());$("dismissInstallBtn")?.addEventListener("click",()=>{localStorage.setItem("oneshotInstallDismissed","1");EasyInstall.close();UI.toast("Puedes instalar ONE SHOT después desde Configuración");});
  $("permissionModalClose")?.addEventListener("click",PermissionAssistant.close);$("permissionTestBtn")?.addEventListener("click",e=>{const kind=e.currentTarget.dataset.kind||"camera";if(kind==="location")PermissionAssistant.requestLocation();else PermissionAssistant.testCamera();});$("permissionCameraBtn")?.addEventListener("click",()=>{if(State.cameraPermissionState==="denied")PermissionAssistant.open("camera","permission");else Camera.start({silent:false,force:true});});$("permissionGpsBtn")?.addEventListener("click",()=>PermissionAssistant.requestLocation());$("prepareDeviceBtn")?.addEventListener("click",()=>PermissionAssistant.prepare());$("deviceCheckHelpBtn")?.addEventListener("click",()=>PermissionAssistant.open("camera",State.cameraErrorKind||"permission"));
  window.addEventListener("online",()=>{TimeTrust.sync();if(State.gps)GPS.resolveLive(State.gps,true);Offline.completePending();});window.addEventListener("offline",()=>{TimeTrust.local("Sin conexión");Offline.paint();});window.addEventListener("orientationchange",()=>{LayoutManager.rotate();Sensors.smartRotate();Sensors.applyStageOrientation(false);setTimeout(Camera.ensureHealthy,650)});window.addEventListener("resize",()=>{LayoutManager.apply();Sensors.smartRotate();Sensors.applyStageOrientation(false);});window.addEventListener("pageshow",()=>setTimeout(Camera.ensureHealthy,450));
  document.addEventListener("visibilitychange",async()=>{if(document.hidden){RouteCoverage.suspend('app-background');State.resumeCamera=State.cameraStatus==="active"||State.cameraWanted;if(State.resumeCamera){await Camera.stop({keepWanted:true});Camera.setStatus("idle");}await Store.saveAll();}else{RouteCoverage.resume();RouteCoverage.recover();if(State.resumeCamera){State.resumeCamera=false;setTimeout(()=>Camera.start({silent:true}),450);}}});window.addEventListener("pagehide",()=>{RouteCoverage.suspend('pagehide');Store.saveAll();});window.addEventListener("beforeunload",e=>{if(RouteCoverage.active()){e.preventDefault();e.returnValue='';}});
}

async function autoOpenGrantedCamera(){try{await PermissionAssistant.refresh();if(State.cameraPermissionState==="granted"){State.cameraWanted=true;setTimeout(()=>Camera.start({silent:true}),450);}}catch(_){} }

(async function init(){
  await Store.open();await Store.load();await LegacyVault.recover(true);await Places.migrate();
  $("reviewerInput").value=State.settings.reviewer||"";$("qualityInput").value=State.settings.quality||"high";$("watermarkPositionInput").value=State.settings.watermarkPosition||"left";$("watermarkScaleInput").value=String(State.settings.watermarkScale||1);$("watermarkTextScaleInput").value=String(State.settings.watermarkTextScale||1);$("institutionBrandInput").value=State.settings.institutionBrand||"oneshot";$("accentColorInput").value=State.settings.accentColor||"#2f6bff";$("uiScaleInput").value=String(State.settings.uiScale||1);$("dockPositionInput").value=State.settings.dockPosition||"center";$("hudModeInput").value=State.settings.hudMode||"compact";$("autoHideInput").value=State.settings.autoHideControls?"yes":"no";$("autoHideDelayInput").value=String(State.settings.autoHideDelayMs??8000);$("galleryModeInput").value=State.settings.galleryMode||"compact";$("sensorWatermarkInput").value=State.settings.sensorWatermark?"yes":"no";$("integrityWatermarkInput").value=State.settings.integrityWatermark?"yes":"no";$("framingInput").value=State.settings.framing||"exact";if($("activeProcessInput"))$("activeProcessInput").value=State.settings.activeProcess||"ERM";if($("smartOrientationInput"))$("smartOrientationInput").checked=State.settings.smartOrientation!==false;if($("orientationModeInput"))$("orientationModeInput").value=State.settings.orientationMode||"auto";if($("hudVisibleInput"))$("hudVisibleInput").checked=State.settings.hudVisible!==false;if($("liveWatermarkVisibleInput"))$("liveWatermarkVisibleInput").checked=State.settings.liveWatermarkVisible!==false;if($("controlToneInput"))$("controlToneInput").value=State.settings.controlTone||"subtle";if($("workModeInput"))$("workModeInput").value=State.settings.workMode||"mixed";if($("nearbyHistoryInput"))$("nearbyHistoryInput").checked=State.settings.nearbyHistoryEnabled!==false;if($("presetEnabledInput"))$("presetEnabledInput").checked=State.settings.presetEnabled===true;if($("presetPartyInput"))$("presetPartyInput").value=State.settings.presetParty||"";if($("presetCandidateInput"))$("presetCandidateInput").value=State.settings.presetCandidate||"";if($("presetTypeInput"))$("presetTypeInput").value=State.settings.presetType||"PENDIENTE";if($("presetCandidateTypeInput"))$("presetCandidateTypeInput").value=State.settings.presetCandidateType||"";Recipients.normalize();Recipients.render();Branding.apply();CapturePreset.paint();Mission.paint();RouteCoverage.paint();RouteCoverage.renderSummary();
  bind();GPS.start();TimeTrust.sync();Gallery.render();Places.render();FieldBases.render();FieldBases.paintStatus();Jornada.render();Mission.paint();RouteCoverage.paint();RouteCoverage.renderSummary();RouteCoverage.recover();TerritoryPlanner.render();SmartSectorCoverage.render();TeamMissions.render();SmartRoute.render();Reports.renderSummary();EasyInstall.render();PermissionAssistant.refresh();Sensors.smartRotate();if(State.records[0]){State.lastShotId=State.records[0].id;Gallery.updateLastShot(State.records[0]);Branding.updateVerifier(State.records[0].verifyCode)}
  if("serviceWorker" in navigator)navigator.serviceWorker.register("service-worker.js").then(()=>setTimeout(()=>AppUpdater.check(false),2500)).catch(()=>{});if(sessionStorage.getItem("oneshotUpdatedFrom")){sessionStorage.removeItem("oneshotUpdatedFrom");UI.toast("ONE SHOT actualizado · evidencias conservadas",3500);}LayoutManager.apply();Offline.paint();EasyInstall.render();EasyInstall.maybePrompt();autoOpenGrantedCamera();setTimeout(()=>Evidence.migrateLegacy(),900);
})();
