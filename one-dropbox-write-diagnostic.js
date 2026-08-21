"use strict";

(() => {
  const API_BASE = "https://one-shot-2.pages.dev";

  function install() {
    const Bridge = window.OneShotLegacyCloud;
    if (!Bridge || Bridge.__writeDiagnosticInstalled) return false;
    Bridge.__writeDiagnosticInstalled = true;

    Bridge.writeTest = async function () {
      if (!this.key) {
        this.setProgress("❌ Falta ONE_SHOT_SYNC_KEY en este celular.");
        return { ok: false, message: "Falta ONE_SHOT_SYNC_KEY" };
      }
      this.setProgress("🔎 Probando clave + OAuth + escritura real en Dropbox…");
      try {
        const res = await fetch(`${API_BASE}/api/dropbox/write-test`, {
          method: "POST",
          headers: this.auth(),
        });
        const raw = await res.text();
        let data = {};
        try { data = raw ? JSON.parse(raw) : {}; }
        catch (_) { data = { raw: raw.slice(0, 1000) }; }

        if (!res.ok || data.ok === false) {
          const detail = data.message || data?.dropboxError?.error_summary || data?.dropboxError?.error?.[".tag"] || data.raw || `HTTP ${res.status}`;
          this.setProgress(`❌ Diagnóstico: ${data.stage || "servidor"} · ${detail}`);
          return { ...data, ok: false, httpStatus: res.status };
        }

        this.setProgress("✅ Diagnóstico completo: clave válida · OAuth OK · escritura Dropbox OK.");
        return data;
      } catch (e) {
        const msg = e?.message || String(e);
        this.setProgress(`❌ No se pudo llegar al backend: ${msg}`);
        return { ok: false, stage: "network/cors", message: msg };
      }
    };

    const oldRender = Bridge.renderDiagnostics?.bind(Bridge);
    if (oldRender) Bridge.renderDiagnostics = function (...args) {
      const out = oldRender(...args);
      queueMicrotask(() => {
        const rows = document.querySelectorAll("#legacyDiagList .legacyDiagItem");
        rows.forEach((row, i) => {
          const d = this.diagnostics?.[i];
          const err = d?.record?.cloudSyncError;
          row.querySelector(".legacySyncError")?.remove();
          if (err) {
            const p = document.createElement("div");
            p.className = "legacySyncError";
            p.textContent = `❌ ${err}`;
            p.style.cssText = "margin-top:6px;padding:7px 9px;border-radius:8px;background:#3a1018;color:#ffd6dc;font-size:12px;line-height:1.3;word-break:break-word;";
            row.querySelector(".legacyDiagInfo")?.appendChild(p);
          }
        });
      });
      return out;
    };

    const oldSyncDiagnostic = Bridge.syncDiagnostic?.bind(Bridge);
    if (oldSyncDiagnostic) Bridge.syncDiagnostic = async function (diag, force = true) {
      try {
        const result = await oldSyncDiagnostic(diag, force);
        if (diag?.record) diag.record.cloudSyncError = "";
        this.renderDiagnostics?.();
        return result;
      } catch (e) {
        if (diag?.record) diag.record.cloudSyncError = e?.message || String(e);
        this.renderDiagnostics?.();
        throw e;
      }
    };

    const oldSyncSelected = Bridge.syncSelected?.bind(Bridge);
    if (oldSyncSelected) Bridge.syncSelected = async function (...args) {
      const test = await this.writeTest();
      if (!test?.ok) {
        this.renderDiagnostics?.();
        return;
      }
      return oldSyncSelected(...args);
    };

    const oldOpen = Bridge.open?.bind(Bridge);
    if (oldOpen) Bridge.open = function (...args) {
      const out = oldOpen(...args);
      setTimeout(() => {
        const actions = document.querySelector("#legacyCloudModal .legacyCloudActions");
        if (actions && !document.getElementById("legacyWriteTest")) {
          const btn = document.createElement("button");
          btn.id = "legacyWriteTest";
          btn.type = "button";
          btn.textContent = "🔎 Probar conexión y escritura";
          btn.onclick = async () => {
            btn.disabled = true;
            const before = btn.textContent;
            btn.textContent = "Probando…";
            await this.writeTest();
            btn.disabled = false;
            btn.textContent = before;
          };
          actions.insertBefore(btn, actions.querySelector("#legacyAnalyze"));
        }
      }, 0);
      return out;
    };

    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (install() || tries > 60) clearInterval(timer);
  }, 200);
})();
