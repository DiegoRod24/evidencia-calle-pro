# ONE SHOT 5.3 · CAMERA ORIENTATION FINAL FIX

## Objetivo
Cerrar el problema en el que la vista previa se veía correcta, pero la evidencia final podía quedar de cabeza.

## Cambio estructural
La orientación visual de la interfaz ya no decide cómo se rota el bitmap. ONE SHOT intenta capturar primero una fotografía real mediante `ImageCapture.takePhoto()` y la decodifica respetando la orientación del archivo. Si el navegador no soporta esa ruta, usa el frame del video como fallback.

## Pipeline 5.3
1. Congelar la orientación al disparar.
2. Intentar captura fotográfica nativa del track.
3. Decodificar respetando orientación física/EXIF.
4. Aplicar giro solo si la relación vertical/horizontal realmente no coincide.
5. Recortar al encuadre visual de la cámara.
6. Aplicar zoom digital.
7. Generar la evidencia y recién después colocar la marca ONE SHOT.

## Preview
El video ya no se gira por CSS para simular el movimiento del teléfono. Esto evita que preview, HUD y canvas sigan matrices diferentes.

## Diagnóstico guardado
Cada nueva evidencia conserva `capturePipeline`, `captureRotationApplied`, `sourceFrameWidth` y `sourceFrameHeight` para identificar exactamente qué ruta utilizó el teléfono.

## Prueba de campo
Tomar: vertical, horizontal hacia un lado y horizontal hacia el otro. Revisar la fotografía final desde Evidencias, no solamente el preview.
