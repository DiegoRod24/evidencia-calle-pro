"use strict";

/* ONE SHOP v5.8.2 · arranque rápido / UI no bloqueante */
(function(){
  if (window.ONE_SHOP_FAST_BOOT_582) return;
  window.ONE_SHOP_FAST_BOOT_582 = true;

  const BUILD = "one-shop-v5.8.2-fast-ui-01";
  const idle = (cb, timeout=5000) => {
    if ("requestIdleCallback" in window) return requestIdleCallback(cb, {timeout});
    return setTimeout(cb, Math.min(timeout, 1800));
  };

  try { localStorage.setItem("oneshotRuntimeBuild", BUILD); } catch (_) {}

  try {
    if (typeof bind === "function" && !bind.__fastOnce) {
      const originalBind = bind;
      let done = false;
      const once = function(){
        if (done) return;
        done = true;
        return originalBind();
      };
      once.__fastOnce = true;
      bind = once;
      setTimeout(() => { try { bind(); } catch (e) { console.warn("ONE SHOP fast bind", e); } }, 0);
    }
  } catch (_) {}

  try {
    if (typeof Store !== "undefined" && !Store.__fastLoad582) {
      Store.__fastLoad582 = true;
      Store.load = async function(){
        try {
          State.settings = {...State.settings, ...JSON.parse(localStorage.getItem("oneshotSettings") || "{}")};
          State.settings.layouts = State.settings.layouts || {portrait:{},landscape:{}};
        } catch (_) {}
        try {
          State.places = JSON.parse(localStorage.getItem("oneshotPlacesV4") || "[]");
          if (!Array.isArray(State.places)) State.places = [];
        } catch (_) { State.places = []; }
        try {
          State.fieldBases = JSON.parse(localStorage.getItem("oneshotFieldBasesV44") || "[]");
          if (!Array.isArray(State.fieldBases)) State.fieldBases = [];
        } catch (_) { State.fieldBases = []; }
        try {
          const lite = JSON.parse(localStorage.getItem("oneshotRecordsLite") || "[]");
          State.records = Array.isArray(lite) ? lite : [];
        } catch (_) { State.records = []; }

        if (!State.db) return;
        setTimeout(() => Store.hydrateFullRecords582?.(), 850);
      };

      Store.hydrateFullRecords582 = function(){
        if (!State.db || Store.__hydrating582) return;
        Store.__hydrating582 = true;
        const byId = new Map((State.records || []).map(r => [r.id, r]));
        let tx, req;
        try {
          tx = State.db.transaction("records", "readonly");
          req = tx.objectStore("records").openCursor();
        } catch (_) { Store.__hydrating582 = false; return; }
        req.onsuccess = e => {
          const cur = e.target.result;
          if (!cur) return;
          const full = cur.value;
          if (full?.id) byId.set(full.id, full);
          cur.continue();
        };
        req.onerror = () => { Store.__hydrating582 = false; };
        tx.oncomplete = () => {
          Store.__hydrating582 = false;
          State.records = Array.from(byId.values()).sort((a,b) =>
            String(b.createdAt || `${b.fecha||""} ${b.hora||""}`).localeCompare(String(a.createdAt || `${a.fecha||""} ${a.hora||""}`))
          );
          try {
            if (State.records[0]) {
              State.lastShotId = State.records[0].id;
              Gallery.updateLastShot(State.records[0]);
            }
            if (document.getElementById("viewEvidence")?.classList.contains("active")) Gallery.render();
            Reports.invalidate();
            Reports.renderSummary();
          } catch (_) {}
        };
        tx.onerror = tx.onabort = () => { Store.__hydrating582 = false; };
      };

      Store.saveLite = function(){
        try {
          const stripAllImages = !!State.db;
          const lite = (State.records || []).map(r => ({
            ...r,
            image: stripAllImages ? "" : (r.image?.length > 900000 ? "" : r.image),
            stampedImage: stripAllImages ? "" : (r.stampedImage?.length > 900000 ? "" : r.stampedImage),
            correctedImage: "",
            correctedStampedImage: "",
            reportImage4x3: ""
          }));
          localStorage.setItem("oneshotRecordsLite", JSON.stringify(lite));
          localStorage.setItem("oneshotSettings", JSON.stringify(State.settings));
          localStorage.setItem("oneshotPlacesV4", JSON.stringify(State.places || []));
          localStorage.setItem("oneshotFieldBasesV44", JSON.stringify(State.fieldBases || []));
        } catch (_) {}
      };
    }
  } catch (e) { console.warn("ONE SHOP fast storage", e); }

  try {
    if (typeof LegacyVault !== "undefined" && LegacyVault.recover && !LegacyVault.__fastRecover582) {
      LegacyVault.__fastRecover582 = LegacyVault.recover.bind(LegacyVault);
      LegacyVault.recover = async function(auto=false){
        if (auto) return {found:0,added:0,updated:0,deferred:true};
        return LegacyVault.__fastRecover582(false);
      };
    }
  } catch (_) {}

  try {
    if (typeof Places !== "undefined" && Places.migrate && !Places.__fastMigrate582) {
      Places.__fastMigrate582 = Places.migrate.bind(Places);
      Places.migrate = async () => 0;
    }
  } catch (_) {}

  try {
    if (typeof Evidence !== "undefined" && Evidence.migrateLegacy && !Evidence.__fastLegacy582) {
      Evidence.__fastLegacy582 = Evidence.migrateLegacy.bind(Evidence);
      Evidence.migrateLegacy = async () => 0;
    }
  } catch (_) {}

  try {
    if (typeof UI !== "undefined" && UI.setView && !UI.__fastSetView582) {
      UI.__fastSetView582 = UI.setView.bind(UI);
      UI.setView = function(name){
        const wasCamera = document.getElementById("viewCamera")?.classList.contains("active");
        if (wasCamera && name !== "Camera" && State.cameraStatus === "active") Camera.pauseForView();
        document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
        document.getElementById("view" + name)?.classList.add("active");
        document.querySelectorAll(".bottomNav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
        document.body.classList.toggle("cameraMode", name === "Camera");
        if (name === "Evidence") Gallery.render();
        if (name === "Places") {
          Places.render();
          idle(() => { try { SmartSectorCoverage.render(); TeamMissions.render(); SmartRoute.render(); } catch (_) {} }, 2500);
        }
        if (name === "Reports") Reports.renderSummary();
        if (name === "Camera") setTimeout(() => Camera.ensureHealthy(), 80);
      };
    }
  } catch (_) {}

  try {
    if (typeof Reports !== "undefined" && Reports.prepare) {
      Reports.invalidate();
      const chip = document.getElementById("reportReadyChip");
      if (chip) chip.textContent = "Listo al solicitar";
    }
  } catch (_) {}

  idle(() => {
    try { Offline?.paint?.(); PermissionAssistant?.refresh?.(); } catch (_) {}
  }, 3500);

  console.info("[ONE SHOP] v5.8.2 fast boot activo");
})();
