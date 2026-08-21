"use strict";

(() => {
  const IDENTITY_KEY = "oneshotFieldIdentity_v1";
  const BATCH_SIZE = 15;

  function safeParse(raw, fallback = {}) {
    try { return JSON.parse(raw || "") || fallback; } catch (_) { return fallback; }
  }

  function stableDeviceId() {
    const current = safeParse(localStorage.getItem(IDENTITY_KEY));
    if (current.deviceId) return current.deviceId;
    const id = (crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ ...current, deviceId: id }));
    return id;
  }

  function loadIdentity() {
    return { deviceId: stableDeviceId(), teamId: "", reviewer: "", ...safeParse(localStorage.getItem(IDENTITY_KEY)) };
  }

  function saveIdentity(next = {}) {
    const value = { ...loadIdentity(), ...next, deviceId: loadIdentity().deviceId };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(value));
    return value;
  }

  function install() {
    const Bridge = window.OneShotLegacyCloud;
    if (!Bridge || Bridge.__batchMigrationInstalled) return false;
    Bridge.__batchMigrationInstalled = true;
    Bridge.batchPaused = false;

    const baseMetadata = Bridge.metadata?.bind(Bridge);
    if (baseMetadata) Bridge.metadata = function(record, diag = null) {
      const out = baseMetadata(record, diag);
      const identity = loadIdentity();
      out.fieldIdentity = {
        teamId: identity.teamId || "",
        reviewer: identity.reviewer || "",
        deviceId: identity.deviceId,
      };
      out.teamId = out.teamId || identity.teamId || "";
      out.reviewer = out.reviewer || identity.reviewer || "";
      out.deviceId = out.deviceId || identity.deviceId;
      return out;
    };

    Bridge.pendingDiagnostics = function({ onlyErrors = false } = {}) {
      const all = (this.diagnostics || []).filter(d => d.status !== "BROKEN");
      return all.filter(d => {
        const r = d.record || {};
        if (onlyErrors) return r.cloudSyncStatus === "ERROR";
        if (r.cloudSyncStatus !== "SYNCED") return true;
        const changedAt = Date.parse(r.updatedAt || r.createdAt || 0);
        const syncedAt = Date.parse(r.cloudSyncedLocalAt || 0);
        return Number.isFinite(changedAt) && changedAt > syncedAt;
      });
    };

    Bridge.runBatchMigration = async function({ onlyErrors = false } = {}) {
      if (this.running) return;
      if (!this.key) return this.open("Primero guarda la clave de sincronización.");
      if (!this.diagnostics.length) await this.analyzeAll();

      const rows = this.pendingDiagnostics({ onlyErrors });
      if (!rows.length) {
        this.setProgress(onlyErrors ? "✅ No quedan errores por reintentar." : "✅ No quedan evidencias pendientes por migrar.");
        this.paint();
        return;
      }

      const total = rows.length;
      const batches = Math.ceil(total / BATCH_SIZE);
      this.running = true;
      this.batchPaused = false;
      let ok = 0, err = 0, done = 0;

      try {
        for (let b = 0; b < batches; b++) {
          if (this.batchPaused) break;
          const chunk = rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
          for (let i = 0; i < chunk.length; i++) {
            if (this.batchPaused) break;
            if (!navigator.onLine) {
              this.batchPaused = true;
              this.setProgress(`⏸ Sin internet · ${done}/${total} procesadas. Cuando vuelva la conexión pulsa Reanudar.`);
              break;
            }
            const d = chunk[i];
            this.setProgress(`Lote ${b + 1}/${batches} · ${done + 1}/${total} · OK ${ok} · error ${err}`);
            try {
              if (await this.syncDiagnostic(d, false)) ok++;
            } catch (_) {
              err++;
            }
            done++;
            this.paint();
          }
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      } finally {
        this.running = false;
        const remaining = this.pendingDiagnostics().length;
        if (this.batchPaused) {
          this.setProgress(`⏸ Migración pausada · ${done}/${total} procesadas · ${remaining} pendientes.`);
        } else {
          this.setProgress(`✅ Migración por lotes terminada · ${ok} OK · ${err} error · ${remaining} pendientes · ${this.summary().BROKEN} no recuperables.`);
        }
        this.paint();
        this.renderDiagnostics?.();
      }
    };

    Bridge.syncSafeAll = async function() {
      if (!this.diagnostics.length) await this.analyzeAll();
      const count = this.pendingDiagnostics().length;
      if (!count) return this.setProgress("✅ No quedan evidencias pendientes por migrar.");
      if (!confirm(`Se migrarán ${count} evidencias pendientes en lotes internos de ${BATCH_SIZE}. Las ya sincronizadas no se repiten. ¿Continuar?`)) return;
      return this.runBatchMigration({ onlyErrors: false });
    };

    const oldOpen = Bridge.open?.bind(Bridge);
    if (oldOpen) Bridge.open = function(...args) {
      const result = oldOpen(...args);
      setTimeout(() => {
        const modal = document.getElementById("legacyCloudModal");
        const actions = modal?.querySelector(".legacyCloudActions");
        if (!modal || !actions) return;

        let identityBox = document.getElementById("legacyFieldIdentity");
        if (!identityBox) {
          identityBox = document.createElement("div");
          identityBox.id = "legacyFieldIdentity";
          identityBox.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;";
          identityBox.innerHTML = `
            <label style="display:grid;gap:5px">Equipo / Brigada<input id="legacyTeamId" placeholder="Ej. CAJ-03"></label>
            <label style="display:grid;gap:5px">Verificador / Alias<input id="legacyReviewer" placeholder="Ej. Maria"></label>`;
          actions.parentElement.insertBefore(identityBox, actions);
          const identity = loadIdentity();
          identityBox.querySelector("#legacyTeamId").value = identity.teamId || "";
          identityBox.querySelector("#legacyReviewer").value = identity.reviewer || "";
          const save = () => saveIdentity({
            teamId: identityBox.querySelector("#legacyTeamId").value.trim(),
            reviewer: identityBox.querySelector("#legacyReviewer").value.trim(),
          });
          identityBox.querySelectorAll("input").forEach(el => el.addEventListener("change", save));
        }

        const migrate = modal.querySelector("#legacySyncSafe");
        if (migrate) migrate.textContent = "☁ Migrar todas las pendientes";

        if (!document.getElementById("legacyPauseBatch")) {
          const pause = document.createElement("button");
          pause.id = "legacyPauseBatch";
          pause.type = "button";
          pause.textContent = "⏸ Pausar";
          pause.onclick = () => { this.batchPaused = true; this.setProgress("⏸ Pausa solicitada; terminaré la evidencia actual."); };
          actions.appendChild(pause);
        }

        if (!document.getElementById("legacyResumeBatch")) {
          const resume = document.createElement("button");
          resume.id = "legacyResumeBatch";
          resume.type = "button";
          resume.textContent = "▶ Reanudar pendientes";
          resume.onclick = () => this.runBatchMigration({ onlyErrors: false });
          actions.appendChild(resume);
        }

        if (!document.getElementById("legacyRetryErrors")) {
          const retry = document.createElement("button");
          retry.id = "legacyRetryErrors";
          retry.type = "button";
          retry.textContent = "↻ Reintentar errores";
          retry.onclick = () => this.runBatchMigration({ onlyErrors: true });
          actions.appendChild(retry);
        }
      }, 0);
      return result;
    };

    window.addEventListener("online", () => {
      if (!Bridge.running && Bridge.key && Bridge.diagnostics?.length && Bridge.pendingDiagnostics().length) {
        Bridge.setProgress("🟢 Internet recuperado · pulsa Reanudar pendientes para continuar.");
      }
    });

    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (install() || tries > 80) clearInterval(timer);
  }, 200);
})();
