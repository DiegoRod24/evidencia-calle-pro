# ONE SHOT v3 FIELD PRO — errores observados y correcciones

## 1. Cámara demasiado ocupada
**Antes:** botones grandes de Iniciar / Reiniciar / Cambiar lente / GPS cubrían demasiado la escena.
**Ahora:** la cámara ocupa toda la pantalla y las acciones secundarias son iconos flotantes. El disparador, zoom y GPS quedan en un dock compacto.

## 2. La foto podía capturarse tarde
**Antes:** el flujo esperaba GPS y geocodificación antes de congelar el frame.
**Riesgo:** la escena podía cambiar entre el toque y la captura real.
**Ahora:** el frame se captura primero, inmediatamente. Después se enriquecen GPS, dirección, hash y marca sin detener la cámara.

## 3. Confirmación de disparo poco clara
**Ahora:** aparece la mira de captura, flash, vibración (si el dispositivo lo permite), miniatura temporal y código de evidencia.

## 4. Enfoque al tocar
**Ahora:** el toque muestra el punto de enfoque en la posición real tocada e intenta `focusMode=single-shot/continuous` cuando el navegador/dispositivo lo expone.
**Nota técnica:** la Web Camera API no garantiza enfoque por coordenadas en todos los iPhone/Android; el efecto visual siempre funciona y el ajuste de foco se solicita solo cuando el hardware lo permite.

## 5. Zoom y lente amplia
**Ahora:** pinch-to-zoom, slider, presets 1x/2x/4x y acceso 0.5x cuando el hardware o una cámara “ultra/wide/gran angular” está expuesta por el navegador. Si el navegador no expone esa lente, no se inventa zoom 0.5x digital.

## 6. Cámara negra/congelada
**Ahora:** recuperación al volver a la app, rotar la pantalla, terminar/mutearse el track de cámara y botón único `Reiniciar cámara + GPS`.

## 7. Marca de agua
**Ahora:**
- Marca superior ONE SHOT.
- ONE en azul y SHOT en blanco.
- Código único de evidencia.
- Verificador corto derivado de SHA-256 del frame original + instante + código.
- Banda inferior con fecha/hora Lima, GPS, precisión y ubicación.
- Posición inferior izquierda/centro/derecha configurable.

## 8. Fecha correcta para evidencia en Perú
**Antes:** se usaba una fecha ISO UTC que podía cambiar de día por la noche en Lima.
**Ahora:** FECHA y HORA se generan explícitamente con zona `America/Lima`.

## 9. Fotos verticales/horizontales en galería
**Antes:** `object-fit: cover` podía recortar la evidencia.
**Ahora:** se usa vista completa (`contain`) para no perder contenido de una toma vertical u horizontal.

## 10. Visor
**Antes:** visor simple y acciones poco confiables/claras.
**Ahora:** visor full-screen con navegación, doble toque para zoom, Guardar, Compartir y Editar en una barra clara.

## 11. Vista previa del reporte
**Antes:** abría `about:blank`, con una tabla diminuta y poco usable en celular.
**Ahora:** la vista previa vive dentro de ONE SHOT como modal responsive.

## 12. “Permission denied” al descargar/compartir
**Ahora:** se separaron rutas:
- APK Android: plugin nativo genérico para JPG/XLSX.
- Navegadores con File System Access: selector de guardado.
- PWA: descarga por Blob como fallback.
- Compartir PWA: Web Share API cuando acepta archivos.
- Si no acepta compartir, guarda el archivo para enviarlo manualmente.

## 13. Excel con fotos
**Ahora:**
- Foto en columna FOTO.
- Anclaje de dos puntos de celda (`twoCellAnchor`) y proporción visual preservada para tomas verticales/horizontales.
- Autofiltro, cabecera fija, código/verificador, GPS, mapa y datos de auditoría.

**Importante:** ExcelJS 4.4.0 todavía tiene incidencias abiertas con el comportamiento exacto de “Place in Cell / mover y cambiar tamaño con celdas” en Microsoft Excel. Esta versión deja el anclaje más correcto que permite la librería, pero la prueba final debe hacerse en el Excel de destino. Si se exige que borrar la fila borre físicamente la imagen como contenido de celda, eso requiere otra estrategia de generación XLSX y no debe darse por garantizado aquí.

## 14. Compatibilidad con evidencias de la v2
Se mantiene `oneshotEvidenceDB_v2`, evitando crear una base vacía solo por cambiar de versión visual.
