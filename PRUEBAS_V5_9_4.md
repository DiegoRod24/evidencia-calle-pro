# Pruebas ONE SHOP v5.9.4

## Lugares

1. Tomar una foto con GPS, abrir Evidencias y pulsar “Crear tramo”.
2. Confirmar que Lugares muestra la foto como A y completa la organización si ya estaba registrada.
3. Iniciar el tramo y comprobar que el mapa muestra A y la ubicación actual.
4. Marcar B tocando el mapa y verificar distancia, vía, distrito, Desde y Hasta.
5. Repetir usando “B = mi GPS” y “B = otra foto”.
6. Activar “Dibujar recorrido”, tocar varios puntos y comprobar la línea curva y la suma de distancia.
7. Trabajar sin internet y confirmar que A/B y la geometría se guardan con coordenadas aunque no aparezca una dirección textual.
8. Guardar un segundo tramo y confirmar que no hereda vía, distrito, Desde ni Hasta del anterior.

## Descarga

1. Agregar foto y video opcionales al tramo finalizado.
2. Descargar Carteles desde Reportes.
3. Confirmar que el ZIP contiene `manifest.json`, `CARTELERIA.xlsx`, `CARTELERIA.geojson`, las fotos A/B en `multimedia/<tramo>/muestras` y la multimedia adicional.
4. Subir el ZIP al cargador Carteles de ONE SHOT CONTROL y comprobar que se visualiza como línea A-B.
