# ONE SHOP v5.9.3 · Paquetes para CONTROL

## Aplicación de campo

- Reportes incorpora tres descargas excluyentes: **Carteles**, **Locales partidarios** y **Evidencias**.
- Carteles exporta tramos A-B con Excel, GeoJSON, fotografía y video marcado.
- Locales partidarios exporta únicamente `LOCAL PARTIDARIO`.
- Evidencias exporta únicamente `BANNER`, `PANEL` y `PINTA`.
- Empresa/proveedor se conserva solo cuando el tipo es `PANEL`.
- Cada ZIP contiene `manifest.json` para que CONTROL valide la categoría antes de importar.
- El video de un tramo puede grabarse o elegirse del teléfono. El video elegido se procesa localmente para incorporar la marca ONE SHOT.
- Límite de video: 90 segundos y 80 MB. El original y la copia marcada permanecen en IndexedDB; el paquete operativo lleva la copia marcada.

## ONE SHOT CONTROL

- La portada tiene tres cargadores independientes para Carteles, Locales partidarios y Evidencias.
- Un archivo colocado en el cargador incorrecto es rechazado sin mezclar datos.
- Los carteles se dibujan como líneas y los demás registros como puntos.
- Los tramos se consolidan en la base central mediante un registro compatible y también se conservan localmente como respaldo.
- Las fotos y videos incluidos en cada ZIP se conservan en IndexedDB del navegador de CONTROL sin contratar almacenamiento adicional.
- Si la base central no responde, el paquete sigue abriéndose en modo local.
- Leaflet se carga bajo demanda para evitar bloquear la primera pintura del dashboard.

## Compatibilidad

- Se conserva el Excel histórico como salida operativa.
- CONTROL recibe los ZIP generados por la aplicación; el Excel histórico permanece dentro de cada paquete como salida operativa.
- No se modifica ni elimina evidencia histórica, fotografías recuperadas ni geometrías existentes.
