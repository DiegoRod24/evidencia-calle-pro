# ONE SHOT 5.3.1 · FRONT CAMERA ORIENTATION FIX

## Objetivo
Corregir exclusivamente la cámara frontal/selfie en horizontal sin alterar el pipeline trasero que quedó estable en 5.3.

## Cambios
- Detección de `facingMode` frontal/trasera con fallback por etiqueta del dispositivo.
- Preview frontal espejado solo visualmente.
- Evidencia final frontal sin espejo.
- Corrección de 180° aplicada solo en `front + landscape`.
- La calibración heredada de cámara trasera ya no se aplica a la frontal.
- Nuevos metadatos: `cameraFacing`, `previewMirrored`, `frontCorrectionApplied`.

## Regla de seguridad
La cámara trasera conserva el comportamiento 5.3 sin cambios funcionales.
