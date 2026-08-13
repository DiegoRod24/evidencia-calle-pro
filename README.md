## ONE SHOT v5.0 · TERRITORY PLANNER

# ONE SHOT v3.1 · FIELD FIX

Herramienta web/PWA + APK Android para levantar evidencia fotográfica de propaganda electoral en calle.

## Qué corrige esta versión
- El HUD de cámara ya no se mezcla con la pantalla `Cámara lista` ni con el estado de error.
- Apertura de cámara serializada: evita varios `getUserMedia()` al mismo tiempo.
- Recuperación de `NotReadableError / Could not start video source` con liberación de tracks y estrategias progresivas de apertura.
- Al ir a otra vista o mandar la app al fondo se libera la cámara; al regresar se recupera cuando corresponde.
- HUD normal / sutil / mínimo, auto-ocultado y posición del dock configurable.
- Tap para enfoque, pinch zoom, cambio de lente y linterna cuando el dispositivo los expone.
- Mira + flash + congelación breve al capturar.
- Captura instantánea antes de operaciones de GPS/red.

## Evidencia v3.1
Cada registro puede contener:
- fecha y hora de captura;
- fuente de hora: `SERVIDOR` o `LOCAL`;
- latitud / longitud y precisión;
- dirección estructurada cuando hay geocodificación;
- altitud cuando el dispositivo la entrega;
- orientación / rumbo cuando Device Orientation está disponible;
- código `OS-...`;
- SHA-256 de la imagen original;
- hash de evidencia y verificador corto;
- fotografía estampada con marca ONE SHOT.

### Sobre la hora confiable
Cuando hay internet, ONE SHOT intenta anclar la hora a la cabecera HTTP `Date` del servidor que aloja la aplicación y continúa esa referencia con `performance.now()` durante la sesión. Esto ayuda a detectar/evitar cambios manuales del reloj del dispositivo durante una sesión abierta.

No se presenta como sello de tiempo atómico certificado: HTTP `Date` tiene resolución aproximada de segundos. Para validación pública fuerte y sello de tiempo de terceros se requiere backend/servicio de timestamping.

## Selección masiva
Evidencias -> **Seleccionar** -> marcar fotos -> **Acciones**:
- Descargar imágenes en ZIP.
- Compartir imágenes (multi-share si el navegador lo soporta; ZIP como fallback/APK).
- Descargar Excel.
- Compartir Excel / WhatsApp.
- Vista previa.
- Seleccionar todas las visibles.

## Excel
Incluye foto, fecha, hora, fuente de hora, dirección, calle/número/código postal/ciudad/país cuando existan, coordenadas, precisión, altitud, orientación, código, verificador, SHA-256 y datos de auditoría.

Las fotos se insertan preservando proporción y con anclaje `twoCell`. El comportamiento exacto de `Place in Cell` depende de Microsoft Excel y debe verificarse con la versión de Excel usada por el área.

## Offline
- Captura y almacenamiento local funcionan sin internet después de cargar la app.
- GPS puede seguir funcionando según el hardware del equipo.
- La dirección postal puede quedar pendiente sin conexión.
- Excel usa ExcelJS cargado desde CDN en esta edición, por lo que conviene generar reportes con conexión; las fotografías permanecen seguras en IndexedDB aunque no haya red.

## Publicar en GitHub
```bash
git status
git add .
git commit -m "one shot v3.1 field fix: camera, bulk actions and evidence integrity"
git push origin main
```

## Generar APK Android
En una carpeta limpia del proyecto:
```bash
npm install
npm run web:prepare
npx cap add android
npm run android:prepare-native
npm run android:verify-native
npm run android:sync
```

En Windows / Git Bash (ajusta rutas si tu Android Studio o SDK están en otra ubicación):
```bash
export JAVA_HOME="/d/Android/jbr"
export ANDROID_HOME="/d/AndroidSDK"
export ANDROID_SDK_ROOT="/d/AndroidSDK"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

cd android
./gradlew.bat assembleDebug
```

APK esperado:
`android/app/build/outputs/apk/debug/app-debug.apk`

> Cámara y geolocalización web requieren HTTPS o APK. iPhone funciona como PWA desde Safari / Agregar a pantalla de inicio.

Revisa también `CAMBIOS_V3_1.md` y `PRUEBAS_V3_1.md`.


## v3.3 EVIDENCE UX
Ver `NOVEDADES_V3_3.md` y `PRUEBAS_V3_3.md`. Incluye marca institucional configurable, verificador lateral, Maps, editor responsivo, tamaños/colores persistentes y corrección de arrastre del watermark.
