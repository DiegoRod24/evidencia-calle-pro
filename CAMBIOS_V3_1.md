# ONE SHOT v3.1 FIELD FIX

## Objetivo
Versión de corrección y endurecimiento de la herramienta de evidencia en calle. Se priorizó estabilidad de cámara, reducción de superposiciones, selección masiva y metadatos verificables.

## Cámara
- Estados separados: `idle`, `starting`, `active`, `error`.
- Si no existe stream real, HUD, disparador, zoom y watermark live permanecen ocultos.
- Bloqueo de aperturas concurrentes para evitar carreras `getUserMedia`.
- Antes de abrir, se liberan tracks anteriores y se espera brevemente.
- Estrategia progresiva de apertura: dispositivo elegido -> cámara trasera ideal -> trasera simple -> cualquier video.
- Botones de error: Reintentar y Liberar cámara.
- Al salir de la app / pasarla a segundo plano se libera el stream; al regresar se recupera si correspondía.
- Tap de enfoque, pinch zoom, cambio de lente, linterna si el dispositivo la expone.
- HUD Normal / Sutil / Mínimo y auto-ocultado.
- Posición de controles izquierda / centro / derecha.
- Efecto de captura con mira, flash, congelación breve y código.

## Evidencia y marca de agua
- Captura del fotograma antes de llamadas de red/GPS para no perder el instante de disparo.
- Hora de servidor cuando el hosting expone cabecera HTTP `Date`; fallback explícito a hora local.
- La hora de servidor se marca como aproximada: HTTP `Date` tiene resolución de segundos, no se presenta como reloj atómico certificado.
- GPS: latitud, longitud, precisión, altitud y precisión de altitud cuando el dispositivo los entrega.
- Orientación de brújula mediante Device Orientation cuando el sistema/navegador lo permite.
- Dirección estructurada: calle, número, código postal, ciudad y país cuando reverse geocoding está disponible.
- SHA-256 de la imagen original + hash de evidencia sobre metadatos esenciales.
- Verificador corto visible en la foto.
- Botón Verificar en el visor para comprobar localmente que la imagen original coincide con el hash almacenado.
- Migración automática de evidencias de v3 a esquema de integridad v3.1 sin borrar la base IndexedDB existente.
- Watermark rediseñado para ocupar menos área de la propaganda.

## Evidencias / selección
- Vista compacta por defecto y alternativa de tarjetas grandes.
- Modo de selección explícito.
- Barra inferior con contador de seleccionadas.
- Hoja de acciones masivas:
  - Descargar imágenes seleccionadas en ZIP.
  - Compartir imágenes; usa multi-share cuando el navegador lo admite y ZIP como fallback/APK.
  - Descargar Excel.
  - Compartir Excel / WhatsApp.
  - Vista previa.
  - Seleccionar todas las visibles.

## Excel
- Mantiene fotografía sin deformación y anclaje de dos celdas.
- Añade fuente de hora, dirección estructurada, coordenadas, precisión, altitud, orientación, verificador y SHA-256.
- Hoja METADATOS con nota clara sobre el alcance del hash local.

## Offline
- Fotografías y registros permanecen en IndexedDB/local storage sin internet.
- Service Worker conserva los recursos de la app ya visitados.
- GPS puede funcionar sin datos móviles si el dispositivo obtiene posición.
- La dirección postal requiere reverse geocoding; sin red queda marcada como pendiente.
- La validación pública online y el sello de tiempo certificado NO se simulan: requieren backend.
