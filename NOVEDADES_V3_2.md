# ONE SHOT v3.2 FIELD UX

## Cambios implementados

- Selección individual, seleccionar todas las evidencias visibles y deseleccionar todo.
- Acciones masivas: ZIP de imágenes, compartir imágenes, Excel, compartir Excel, vista previa y eliminación con confirmación.
- Agenda de destinatarios WhatsApp: nombre, cargo, teléfono y predeterminado.
- Selector de destinatario antes de compartir archivos cuando hay más de uno.
- Botón `Actualizar ONE SHOT`.
  - PWA: comprueba `version.json`, actualiza Service Worker/cachés y conserva IndexedDB/localStorage.
  - APK Android: consulta el feed público del repositorio. Si una versión futura publica `apkUrl`, descarga el APK y abre el instalador de Android para actualizar encima de la app actual (misma firma/paquete; Android siempre pide confirmación).
- Editor de disposición de cámara: arrastrar marca ONE SHOT, grupo de herramientas, marca de agua y controles de captura.
- Disposición independiente para vertical y horizontal.
- Safe zones para que los grupos no queden bajo bordes/notch/navigation bar.
- Modo pantalla limpia y autoocultado.
- Iconos de cámara con acabado glass/3D y respuesta táctil.
- Encuadre `Exacto · sin recorte` por defecto (`object-fit: contain`).
- Captura usando `video.videoWidth × video.videoHeight`, nunca el tamaño CSS de la pantalla.
- Zoom hardware cuando el dispositivo lo expone.
- Zoom digital coherente: si el navegador no ofrece zoom físico, el canvas aplica el mismo recorte central que el preview.
- 0.5x solo se muestra cuando hay zoom real menor de 1x o un lente amplio identificable; no se inventa 0.5x digital.
- Pinch zoom.
- Tap-to-focus cuando el navegador expone capacidades de foco.
- Mantener pulsado el disparador: ráfaga de 3 tomas.
- Indicador de horizonte/inclinación aproximada.
- Barra de confianza: cámara, GPS, hora y conexión.
- Registro de resolución, relación de aspecto, orientación de fotografía, orientación del equipo, ángulo de pantalla, lente y zoom.
- Se conserva la fotografía original y la fotografía marcada.
- SHA-256 del original y SHA-256 de la versión marcada.
- Ficha técnica desde el visor.
- Comprobación básica de nitidez después de capturar; solo avisa, nunca elimina una evidencia.
- Excel conserva proporción de la imagen y agrega los nuevos metadatos.
- Modo offline sigue capturando; al volver internet intenta completar direcciones pendientes.

## Importante sobre 0.5x

Los navegadores móviles no siempre exponen todos los lentes físicos. ONE SHOT no simula un ultra gran angular. El botón 0.5x solo se habilita si la API del dispositivo permite identificar una capacidad/lente compatible.

## Importante sobre actualización APK

Android no permite reemplazar silenciosamente una app. ONE SHOT puede descargar una versión nueva y abrir el instalador del sistema, pero el usuario confirma la actualización. Para instalar encima sin desinstalar, el APK nuevo debe mantener el mismo `appId` (`pe.oneshot.evidence`) y estar firmado con la misma clave.

Para activar la actualización APK futura, publica en `version.json` algo como:

```json
{
  "version": "v3.3",
  "build": "oneshot-v3.3-01",
  "apkUrl": "https://.../ONE_SHOT_v3.3.apk",
  "apkFilename": "ONE_SHOT_v3.3.apk"
}
```
