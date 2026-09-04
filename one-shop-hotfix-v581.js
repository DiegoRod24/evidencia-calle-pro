"use strict";

(function(){
  const HOTFIX_BUILD = "one-shop-v5.8.1-excel-gps-dedup-01";
  try { localStorage.setItem("oneshotAppliedBuild", HOTFIX_BUILD); } catch (_) {}

  GPS.valid = function(g) {
    if (!g) return false;
    const lat = Number(g.latitude), lon = Number(g.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) &&
      Math.abs(lat) <= 90 && Math.abs(lon) <= 180 &&
      Math.abs(lat) > 0.000001 && Math.abs(lon) > 0.000001;
  };

  GPS.norm = function(p) {
    const c = p?.coords || {};
    const latitude = Number(c.latitude), longitude = Number(c.longitude);
    if (!GPS.valid({latitude, longitude})) return null;
    const aRaw = Number(c.accuracy), accuracy = Number.isFinite(aRaw) && aRaw >= 0 ? aRaw : 999;
    const quality = accuracy <= 15 ? "Alta" : accuracy <= 35 ? "Media" : accuracy <= 80 ? "Baja" : "Muy baja";
    return {
      latitude, longitude, accuracy,
      altitude: Number.isFinite(Number(c.altitude)) ? Number(c.altitude) : null,
      altitudeAccuracy: Number.isFinite(Number(c.altitudeAccuracy)) ? Number(c.altitudeAccuracy) : null,
      heading: Number.isFinite(Number(c.heading)) ? Number(c.heading) : null,
      speed: Number.isFinite(Number(c.speed)) ? Number(c.speed) : null,
      timestamp: Number(p?.timestamp) || Date.now(),
      receivedAt: Date.now(),
      quality
    };
  };

  GPS.start = function() {
    if (!navigator.geolocation) { GPS.setChip("GPS no disponible"); return; }
    if (State.gpsWatchId != null) navigator.geolocation.clearWatch(State.gpsWatchId);
    State.gpsWatchId = navigator.geolocation.watchPosition(
      p => {
        const next = GPS.norm(p);
        if (!next) {
          GPS.setChip("GPS inválido · reintentando");
          GPS.paintHealth("Coordenadas inválidas");
          return;
        }
        State.gps = next;
        GPS.setChip(`GPS ±${Math.round(next.accuracy)}m`);
        GPS.water(); GPS.paintHealth(); RouteCoverage.capture(next); SmartSectorCoverage.onGps(next);
        GPS.resolveLive(next);
      },
      e => {
        GPS.setChip(e.code === 1 ? "GPS sin permiso" : "GPS pendiente");
        GPS.paintHealth(e.code === 1 ? "Sin permiso" : "Sin señal");
      },
      {enableHighAccuracy:true, maximumAge:2500, timeout:15000}
    );
  };

  GPS.current = async function(timeout = 10000, force = false) {
    if (!force && GPS.valid(State.gps) && Date.now() - Number(State.gps.receivedAt || State.gps.timestamp || 0) < 15000) return State.gps;
    if (!navigator.geolocation) return GPS.valid(State.gps) ? State.gps : null;
    return new Promise(resolve => navigator.geolocation.getCurrentPosition(
      p => {
        const next = GPS.norm(p);
        if (!next) {
          GPS.setChip("GPS inválido · reintentando");
          GPS.paintHealth("Coordenadas inválidas");
          resolve(GPS.valid(State.gps) ? State.gps : null);
          return;
        }
        State.gps = next;
        GPS.water(); GPS.setChip(`GPS ±${Math.round(next.accuracy)}m`); GPS.paintHealth();
        GPS.resolveLive(next); RouteCoverage.capture(next); SmartSectorCoverage.onGps(next);
        resolve(next);
      },
      () => resolve(GPS.valid(State.gps) ? State.gps : null),
      {enableHighAccuracy:true, maximumAge:0, timeout}
    ));
  };

  GPS.maps = g => GPS.valid(g) ? `https://www.google.com/maps/search/?api=1&query=${g.latitude},${g.longitude}` : "";

  const originalGpsWater = GPS.water.bind(GPS);
  GPS.water = function() {
    if (State.gps && !GPS.valid(State.gps)) {
      const previous = State.gps;
      State.gps = null;
      try { return originalGpsWater(); } finally { State.gps = previous; }
    }
    return originalGpsWater();
  };

  Evidence.captureTime = function(r) {
    const direct = Date.parse(String(r?.createdAt || r?.iso || ""));
    if (Number.isFinite(direct)) return direct;
    const date = String(r?.fecha || "1970-01-01");
    const time = String(r?.hora || "00:00:00").padEnd(8, "0");
    const pe = Date.parse(`${date}T${time}-05:00`);
    return Number.isFinite(pe) ? pe : 0;
  };

  Evidence.uniqueForExport = function(list) {
    const out = [], seenHash = new Set(), seenIdentity = new Set();
    for (const r of Array.from(list || [])) {
      const hash = String(r?.sourceHash || "").trim().toUpperCase();
      const identity = String(r?.id || r?.photoCode || "");
      if (hash) {
        if (seenHash.has(hash)) continue;
        seenHash.add(hash);
      } else if (identity) {
        if (seenIdentity.has(identity)) continue;
        seenIdentity.add(identity);
      }
      out.push(r);
    }
    return out;
  };

  Evidence.sortOldestFirst = list => Evidence.uniqueForExport(list).sort((a,b) =>
    Evidence.captureTime(a) - Evidence.captureTime(b) ||
    String(a?.photoCode || "").localeCompare(String(b?.photoCode || ""))
  );

  Evidence.selectedForReport = function() {
    const selected = Evidence.selected();
    return Evidence.sortOldestFirst(selected.length ? selected : Evidence.visible());
  };

  Evidence.findDuplicate = function(sourceHash, image, excludeId = "") {
    const hash = String(sourceHash || "").toUpperCase();
    return State.records.find(r => r.id !== excludeId && (
      (hash && String(r.sourceHash || "").toUpperCase() === hash) ||
      (!r.sourceHash && image && r.image === image)
    )) || null;
  };

  Evidence.cleanupExactDuplicates = async function() {
    const ordered = [...State.records].sort((a,b) => Evidence.captureTime(a) - Evidence.captureTime(b));
    const seen = new Map(), duplicates = [];
    for (const r of ordered) {
      const hash = String(r?.sourceHash || "").trim().toUpperCase();
      if (!hash) continue;
      if (!seen.has(hash)) { seen.set(hash, r); continue; }
      const keep = seen.get(hash);
      for (const k of ["party","candidate","candidateType","type","status","district","ubigeo","observation","reviewer"]) {
        const bad = keep[k] == null || keep[k] === "" || keep[k] === "PENDIENTE";
        const good = r[k] != null && r[k] !== "" && r[k] !== "PENDIENTE";
        if (bad && good) keep[k] = r[k];
      }
      if (!keep.stampedImage && r.stampedImage) keep.stampedImage = r.stampedImage;
      if (!keep.stampedHash && r.stampedHash) keep.stampedHash = r.stampedHash;
      duplicates.push(r);
    }
    if (!duplicates.length) return 0;
    const touched = new Set(duplicates.map(r => String(r.sourceHash || "").toUpperCase()));
    for (const hash of touched) {
      const keep = seen.get(hash);
      if (keep) await Store.save(keep);
    }
    for (const r of duplicates) await Store.delete(r.id);
    Gallery.render(); Reports.invalidate();
    UI.toast(`✓ ${duplicates.length} foto${duplicates.length === 1 ? "" : "s"} repetida${duplicates.length === 1 ? "" : "s"} eliminada${duplicates.length === 1 ? "" : "s"}`, 3600);
    return duplicates.length;
  };

  const originalMigrateLegacy = Evidence.migrateLegacy.bind(Evidence);
  Evidence.migrateLegacy = async function() {
    const result = await originalMigrateLegacy();
    await Evidence.cleanupExactDuplicates();
    return result;
  };

  Evidence.finalize = async function(rec) {
    if (!rec.sourceHash) rec.sourceHash = await Evidence.imageHash(rec.image);
    const duplicate = Evidence.findDuplicate(rec.sourceHash, rec.image, rec.id);
    if (duplicate) {
      await Store.delete(rec.id);
      if (State.lastShotId === rec.id) State.lastShotId = duplicate.id;
      Gallery.render();
      UI.toast(`⚠ Foto repetida · ya existe ${duplicate.photoCode}`, 3600, {placement:"top",tone:"soft"});
      return duplicate;
    }

    let g = GPS.valid(rec.gps) ? rec.gps : null;
    if (!g) {
      rec.gps = null;
      g = await GPS.current(6500, true);
      if (GPS.valid(g)) {
        rec.gps = {...g}; rec.gpsCapturedAt = g.timestamp; rec.accuracy = g.accuracy; rec.gpsQuality = g.quality;
        rec.altitude = g.altitude ?? null; rec.altitudeAccuracy = g.altitudeAccuracy ?? null;
        if (rec.heading == null) rec.heading = g.heading ?? State.heading ?? null;
        rec.cardinal = Sensors.cardinal(rec.heading); rec.googleMapsUrl = GPS.maps(g);
      }
    }
    if (GPS.valid(g)) {
      const loc = await GPS.reverse(g);
      Object.assign(rec, loc);
    } else {
      rec.gps = null; rec.gpsCapturedAt = null; rec.accuracy = ""; rec.gpsQuality = "Pendiente"; rec.googleMapsUrl = "";
    }

    rec.evidenceHash = await Evidence.sha256(Evidence.canonical(rec));
    rec.verifyCode = rec.evidenceHash.slice(0,12);
    rec.integrityStatus = "SHA-256 local";
    rec.integrityVersion = "3.2";
    rec.stampedImage = await Watermark.stamp(rec.image, rec);
    rec.stampedHash = await Evidence.imageHash(rec.stampedImage);
    await Store.save(rec);
    if (!rec.placeId) Places.promptRelation(rec);
    Gallery.updateLastShot(rec); Branding.updateVerifier(rec.verifyCode);
    if ($("viewEvidence")?.classList.contains("active")) Gallery.render();
    return rec;
  };

  Camera.shoot = async function() {
    if (State.cameraStatus !== "active") {
      const ok = await Camera.start();
      if (!ok) return;
    }
    const captureOrientation = Sensors.captureOrientation();
    try {
      const frame = await Camera.captureFrame(captureOrientation);
      if (!frame) return UI.toast("Cámara aún no está lista");

      const sourceHash = await Evidence.imageHash(frame.dataUrl);
      const duplicate = Evidence.findDuplicate(sourceHash, frame.dataUrl);
      if (duplicate) {
        Camera.shotEffect(frame.dataUrl, duplicate.photoCode);
        UI.toast(`⚠ Foto repetida · ya existe ${duplicate.photoCode}`, 3800, {placement:"top",tone:"soft"});
        return;
      }

      const captured = TimeTrust.capture();
      const fresh = GPS.valid(State.gps) && Date.now() - Number(State.gps.receivedAt || State.gps.timestamp || 0) < 20000 ? {...State.gps} : null;
      const meta = State.liveLocation || {address:"Ubicación pendiente",ubigeo:"UBIGEO pendiente",district:"",department:"",province:""};
      const rec = Evidence.make(frame, fresh, meta, captured);
      rec.sourceHash = sourceHash;

      State.records.unshift(rec); State.lastShotId = rec.id;
      $("wmCode").textContent = rec.photoCode; Branding.updateVerifier("PENDIENTE");
      Camera.shotEffect(frame.dataUrl, rec.photoCode); Gallery.updateLastShot(rec);
      Reports.invalidate(); await Store.save(rec); Quality.check(rec).then(()=>{});
      UI.toast("✓ Evidencia capturada", 1800, {placement:"top",tone:"soft"});
      QuickCapture.show(rec); GhostOverlay.close(); Camera.touchControls();
      Places.afterCapture(rec); SmartSectorCoverage.onEvidence(rec); TerritoryPlanner.afterCapture(rec);
      TeamMissions.render(); Jornada.render(); Mission.paint();
      Evidence.finalize(rec).catch(()=>{});
    } finally {
      Sensors.releaseCaptureOrientation();
    }
  };

  Reports.mapsUrl = function(record) {
    const g = record?.gps;
    if (GPS.valid(g)) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(g.latitude)},${Number(g.longitude)}`)}`;
    return "";
  };

  Reports.excelImage = async function(dataUrl) {
    const img = await Watermark.load(dataUrl);
    const W = 600, H = 642;
    const c = document.createElement("canvas"), ctx = c.getContext("2d", {alpha:false});
    c.width = W; c.height = H;
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,W,H);

    const cover = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const bw = img.naturalWidth * cover, bh = img.naturalHeight * cover;
    ctx.save();
    try { ctx.filter = "blur(24px) brightness(0.72) saturate(0.92)"; } catch (_) {}
    ctx.globalAlpha = 0.96;
    ctx.drawImage(img, (W-bw)/2 - 12, (H-bh)/2 - 12, bw + 24, bh + 24);
    ctx.restore();
    ctx.filter = "none";
    ctx.fillStyle = "rgba(0,0,0,.13)"; ctx.fillRect(0,0,W,H);

    const contain = Math.min((W*0.96)/img.naturalWidth, (H*0.96)/img.naturalHeight);
    const fw = img.naturalWidth * contain, fh = img.naturalHeight * contain;
    const fx = (W-fw)/2, fy = (H-fh)/2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    ctx.drawImage(img, fx, fy, fw, fh);
    ctx.restore();

    return c.toDataURL("image/jpeg", 0.58);
  };

  const originalMakeExcel = Reports.makeExcel.bind(Reports);
  Reports.makeExcel = async function() {
    const data = Evidence.selectedForReport();
    const restore = data.map(r => ({r, stampedImage:r.stampedImage, gps:r.gps, googleMapsUrl:r.googleMapsUrl}));
    const cache = new Map();
    try {
      for (let i=0; i<data.length; i++) {
        const r = data[i];
        if (!GPS.valid(r.gps)) { r.gps = null; r.googleMapsUrl = ""; }
        const src = r.stampedImage || r.image;
        if (!src) continue;
        const key = String(r.stampedHash || r.sourceHash || r.id || i);
        let optimized = cache.get(key);
        if (!optimized) {
          optimized = await Reports.excelImage(src);
          cache.set(key, optimized);
        }
        r.stampedImage = optimized;
        if (i && i % 20 === 0) UI.toast(`Optimizando Excel ${i}/${data.length}…`, 900);
      }
      return await originalMakeExcel();
    } finally {
      for (const x of restore) {
        x.r.stampedImage = x.stampedImage; x.r.gps = x.gps; x.r.googleMapsUrl = x.googleMapsUrl;
      }
    }
  };

  Bulk.imageFiles = function() {
    const sorted = Evidence.sortOldestFirst(Bulk.data());
    return sorted.map((r,i) => Share.dataUrlToFile(r.stampedImage || r.image, `${String(i+1).padStart(3,"0")}_${r.photoCode}.jpg`));
  };

  const originalWatermarkStamp = Watermark.stamp.bind(Watermark);
  Watermark.stamp = async function(src, r) {
    if (r?.gps && !GPS.valid(r.gps)) {
      const badGps = r.gps, badUrl = r.googleMapsUrl;
      r.gps = null; r.googleMapsUrl = "";
      try { return await originalWatermarkStamp(src, r); }
      finally { r.gps = badGps; r.googleMapsUrl = badUrl; }
    }
    return originalWatermarkStamp(src, r);
  };

  Maps.openRecord = function(r) {
    if (!GPS.valid(r?.gps)) return UI.toast("Esta evidencia no tiene coordenadas GPS válidas");
    const url = GPS.maps(r.gps);
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) location.href = url;
  };

  Reports.preview = function() {
    const data = Evidence.selectedForReport();
    $("reportPreviewList").innerHTML = data.map((r,i)=>`<article class="previewItem"><img src="${r.stampedImage||r.image}" alt="${esc(r.photoCode)}"><div><b>${i+1}. ${esc(r.type||"PENDIENTE")} · ${esc(r.party||"Partido pendiente")}</b><p>${esc(r.address||"Ubicación pendiente")}</p><p>${esc(r.fecha)} ${esc(r.hora)} · ${GPS.valid(r.gps)?`GPS ±${Math.round(r.gps.accuracy)}m`:"GPS pendiente"}${r.heading!=null?` · ${Math.round(r.heading)}° ${esc(r.cardinal||"")}`:""}${r.altitude!=null?` · ${Math.round(r.altitude)}m`:""}</p><code>${esc(r.photoCode)} · V ${esc(r.verifyCode||"PENDIENTE")}</code></div></article>`).join("") || "Sin evidencias";
    $("reportPreviewModal").classList.add("open");
  };

  console.info("[ONE SHOP] v5.8.1 hotfix activo: Excel liviano + orden + blur + dedupe + GPS válido");
})();
