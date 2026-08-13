# ONE SHOT v3.5.7 · MAPS HYPERLINK + EXCEL FIX

## Regla permanente del Excel
- **Dirección**: texto visible con hipervínculo directo a Google Maps.
- **GPS / Coordenadas**: coordenadas y precisión visibles, con hipervínculo al mismo punto exacto en Google Maps.
- **MAPA**: botón/celda `📍 Abrir ubicación` con hipervínculo funcional.
- En `DATOS_TECNICOS`, también son clicables **Dirección, Latitud, Longitud y MAPA**.
- Si existe GPS, la URL se construye de forma robusta con `https://www.google.com/maps/search/?api=1&query=LAT,LON`.
- Si no existe GPS, la celda queda sin enlace y no se inventan coordenadas.

## Presentación
Se mantiene el Excel visual de v3.5.5: fotos grandes, hoja principal limpia, datos técnicos separados y metadatos.
