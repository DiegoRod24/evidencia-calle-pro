const fs = require("fs");
const path = require("path");

const root = process.cwd();
const out = path.join(root, "www");

// Archivos base que siempre necesita ONE SHOT.
const fixed = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "service-worker.js",
  "version.json",
  "oneshot-erm-data.js",
  "oneshot-logo.svg",
  "icon-192.png",
  "icon-512.png",
  "oneshot-mark.png",
  "oneshot-mark-transparent.png"
];

// El runtime moderno está modularizado. No mantener una lista manual de versiones:
// cualquier hotfix/módulo nuevo debe viajar automáticamente dentro del APK.
const runtimePatterns = [
  /^app-core-.*\.js$/i,
  /^one-shop-.*\.js$/i,
  /^one-shot-.*\.js$/i,
  /^one-field-.*\.js$/i,
  /^one-migrate-.*\.js$/i,
  /^one-dropbox-.*\.(?:js|css)$/i,
  /^one-phase.*\.js$/i
];

const runtimeFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isFile() && runtimePatterns.some(re => re.test(entry.name)))
  .map(entry => entry.name);

const files = [...new Set([...fixed, ...runtimeFiles])];

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) continue;
  fs.copyFileSync(source, path.join(out, file));
}

// Fallar el build antes de crear un APK incompleto. Estos módulos son los que
// garantizan persistencia de fotos y recuperación de evidencias existentes.
const critical = [
  "app.js",
  "app-core-v5.6.3.js",
  "one-shop-media-safety-v601.js",
  "one-shop-local-media-v602.js",
  "one-shop-photo-recovery-v600.js",
  "service-worker.js",
  "version.json"
];

const missing = critical.filter(file => !fs.existsSync(path.join(out, file)));
if (missing.length) {
  throw new Error(`[ONE SHOT] WebDir incompleto. Faltan: ${missing.join(", ")}`);
}

// También valida todos los scripts locales que app.js carga de forma explícita.
const loader = fs.readFileSync(path.join(out, "app.js"), "utf8");
const referenced = [...loader.matchAll(/src=["']([^"']+\.js)["']/g)]
  .map(match => match[1])
  .filter(src => !/^https?:/i.test(src));
const missingReferenced = referenced.filter(src => !fs.existsSync(path.join(out, src)));
if (missingReferenced.length) {
  throw new Error(`[ONE SHOT] app.js referencia módulos ausentes en www/: ${missingReferenced.join(", ")}`);
}

console.log(`[ONE SHOT] WebDir listo en www/ · ${files.length} archivos · runtime local-first incluido`);
