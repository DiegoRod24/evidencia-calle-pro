"use strict";

/* ONE SHOP v5.8.3 · orientación reforzada Android/iOS */
(function(){
  if (window.ONE_SHOP_ORIENTATION_583) return;
  window.ONE_SHOP_ORIENTATION_583 = true;
  const BUILD = "one-shop-v5.8.3-orientation-01";

  const normAngle = value => {
    let n = Number(value);
    if (!Number.isFinite(n)) n = 0;
    n = ((n % 360) + 360) % 360;
    const snaps = [0,90,180,270];
    return snaps.reduce((a,b) => Math.abs(b-n) < Math.abs(a-n) ? b : a, 0);
  };
  const screenAngle = () => normAngle(screen.orientation?.angle ?? window.orientation ?? 0);
  const physicalKey = () => {
    const mode = State.settings.orientationMode || "auto";
    if (mode !== "auto") return mode;
    const a = screenAngle();
    if (a === 90) return "landscape-right";
    if (a === 270) return "landscape-left";
    if (a === 180) return "portrait-upside-down";
    const raw = Number(screen.orientation?.angle ?? window.orientation);
    if (Number.isFinite(raw)) return "portrait";
    const g = Number(State.gamma);
    if (Number.isFinite(g) && Math.abs(g) >= 55) return g >= 0 ? "landscape-right" : "landscape-left";
    return innerWidth > innerHeight ? "landscape-right" : "portrait";
  };
  const rotateDataUrl = (src, deg) => new Promise(resolve => {
    if (!src || !deg) return resolve(src);
    const img = new Image();
    img.onload = () => {
      try {
        const rad = deg * Math.PI / 180;
        const swap = Math.abs(deg) % 180 === 90;
        const c = document.createElement("canvas");
        c.width = swap ? img.naturalHeight : img.naturalWidth;
        c.height = swap ? img.naturalWidth : img.naturalHeight;
        const ctx = c.getContext("2d", {alpha:false});
        ctx.fillStyle = "#000"; ctx.fillRect(0,0,c.width,c.height);
        ctx.translate(c.width/2,c.height/2); ctx.rotate(rad);
        ctx.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);
        resolve(c.toDataURL("image/jpeg", State.settings.quality === "medium" ? .86 : .94));
      } catch (_) { resolve(src); }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
  try {
    Sensors.screenAngle = screenAngle;
    Sensors.physicalOrientation = physicalKey;
    Sensors.orientationFromSensors = function(){
      const key = physicalKey();
      return key === "portrait-upside-down" ? "portrait" : key;
    };
    Sensors.captureOrientation = function(){
      const physical = physicalKey();
      const capture = physical === "portrait-upside-down" ? "portrait" : physical;
      State.captureOrientationLocked = true;
      State.captureOrientationKey = capture;
      State.capturePhysicalOrientation = physical;
      State.captureScreenAngle = screenAngle();
      State.smartOrientation = capture;
      State.orientationSide = capture === "landscape-left" ? "left" : "right";
      try { Sensors.applyStageOrientation(false); Sensors.paintOrientationChip(); } catch (_) {}
      return capture;
    };
  } catch (e) { console.warn("ONE SHOP orientation sensors", e); }
  try {
    if (typeof Camera !== "undefined" && Camera.captureFrame && !Camera.__orientation583) {
      Camera.__orientation583 = Camera.captureFrame.bind(Camera);
      Camera.captureFrame = async function(orientationKey){
        const physical = State.capturePhysicalOrientation || physicalKey();
        const angle = Number(State.captureScreenAngle ?? screenAngle());
        const frame = await Camera.__orientation583(orientationKey || (physical === "portrait-upside-down" ? "portrait" : physical));
        if (!frame?.dataUrl) return frame;
        if (physical === "portrait-upside-down" || angle === 180) frame.dataUrl = await rotateDataUrl(frame.dataUrl, 180);
        frame.orientation = physical;
        frame.screenAngle = angle;
        return frame;
      };
    }
  } catch (e) { console.warn("ONE SHOP orientation capture", e); }
  try {
    const baseRelease = Sensors.releaseCaptureOrientation?.bind(Sensors);
    Sensors.releaseCaptureOrientation = function(){
      State.capturePhysicalOrientation = null;
      State.captureScreenAngle = null;
      if (baseRelease) return baseRelease();
      State.captureOrientationLocked = false;
    };
  } catch (_) {}
  const refresh = () => {
    if (State.captureOrientationLocked) return;
    const key = physicalKey();
    State.smartOrientation = key === "portrait-upside-down" ? "portrait" : key;
    State.orientationSide = State.smartOrientation === "landscape-left" ? "left" : "right";
    try { Sensors.applyStageOrientation(true); Sensors.paintOrientationChip(); LayoutManager.apply(); } catch (_) {}
  };
  try { screen.orientation?.addEventListener?.("change", refresh); } catch (_) {}
  window.addEventListener("orientationchange", () => setTimeout(refresh, 60), {passive:true});
  window.addEventListener("resize", () => setTimeout(refresh, 80), {passive:true});
  try { localStorage.setItem("oneshotRuntimeBuild", BUILD); } catch (_) {}
  setTimeout(refresh, 0);
  console.info("[ONE SHOP] v5.8.3 orientación reforzada activa", {angle:screenAngle()});
})();