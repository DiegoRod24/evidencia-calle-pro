# Checklist de prueba de campo — ONE SHOT v3

## Cámara
- Autorizar cámara y GPS.
- Verificar que la cámara aparezca full-screen.
- Tocar distintas zonas: debe aparecer el indicador de enfoque donde se tocó.
- Probar pinch-to-zoom y 1x / 2x / 4x.
- Probar 0.5x: solo debe activarse si el teléfono/navegador expone lente amplia.
- Cambiar lente.
- Rotar vertical/horizontal y volver a la app: la cámara debe recuperarse.
- Probar `↻` para reiniciar cámara + GPS.

## Evidencia
- Tomar una foto vertical y otra horizontal.
- Confirmar mira + flash + mensaje de captura.
- Abrir ambas desde la miniatura/galería.
- Confirmar que ninguna está recortada.
- Revisar marca ONE SHOT, fecha/hora, GPS, ubicación, código y verificador.
- Editar Partido / Candidato / Tipo y guardar.

## Archivos
- Guardar una foto desde el visor.
- Compartir una foto.
- Generar Vista previa del reporte.
- Descargar XLSX.
- Compartir XLSX/WhatsApp.
- Abrir Excel y aplicar filtro: comprobar cómo responde la imagen en la versión exacta de Microsoft Excel usada por el área.
- Cambiar alto de una fila/columna FOTO: comprobar el anclaje `twoCellAnchor`.
- El comportamiento “Place in Cell” de Excel 365 (incluido borrar fila = borrar imagen) no se da por aprobado hasta esta prueba, porque ExcelJS 4.4.0 tiene limitaciones conocidas en ese punto.

## PWA iPhone
- Abrir por HTTPS en Safari.
- Agregar a pantalla de inicio.
- Autorizar Cámara y Ubicación.
- Compartir XLSX mediante menú nativo de iOS.

## APK Android
- Generar APK con los scripts del proyecto.
- Autorizar Cámara y Ubicación.
- Probar Guardar JPG/XLSX en Descargas.
- Probar Compartir a WhatsApp.
