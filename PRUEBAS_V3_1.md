# Pruebas de campo ONE SHOT v3.1

## 1. Cámara
1. Abrir la app con cámara cerrada.
2. Confirmar que NO aparecen disparador, zoom ni watermark encima de "Cámara lista".
3. Pulsar Abrir cámara.
4. Tomar 5 fotos seguidas.
5. Ir a Evidencias y volver a Cámara.
6. Mandar la app al fondo 10 segundos y regresar.
7. Girar vertical -> horizontal -> vertical.
8. Si aparece error, probar Reintentar. Luego Liberar cámara y abrir otra vez.

Resultado esperado: nunca debe existir más de un intento de apertura simultáneo ni mezclarse pantalla de error con HUD activo.

## 2. Enfoque y zoom
- Tocar tres zonas de la escena y observar la mira de foco.
- Probar pinch zoom.
- Probar 1x/2x/4x.
- 0.5x solo debe funcionar si el navegador expone un lente/zoom compatible.

## 3. Captura
- Verificar flash + mira + confirmación.
- Confirmar que la foto corresponde al instante del toque y no al final de una consulta GPS.
- Probar una foto vertical y una horizontal.

## 4. Metadatos
Revisar una evidencia nueva:
- hora y fuente `SERVIDOR` o `LOCAL`;
- lat/lon y precisión;
- dirección;
- altitud cuando exista;
- orientación cuando exista;
- código OS;
- verificador de 12 caracteres.

## 5. Verificación
Abrir foto -> Verificar.
Resultado esperado: `Integridad correcta`.

## 6. Selección masiva
- Evidencias -> Seleccionar.
- Marcar 3 fotos.
- Acciones -> Descargar imágenes.
- Confirmar ZIP con 3 JPG.
- Acciones -> Descargar Excel.
- Acciones -> Compartir imágenes / Excel.

## 7. Excel
- Confirmar vertical/horizontal sin deformar.
- Filtrar filas y comprobar comportamiento de las imágenes en Microsoft Excel.
- Confirmar columnas de GPS, altitud, orientación, fuente de hora, SHA-256 y verificador.

## 8. Offline
- Cargar la app una vez con internet.
- Activar modo avión.
- Tomar 2 evidencias.
- Confirmar que quedan guardadas.
- La dirección puede quedar pendiente hasta volver a tener internet.
