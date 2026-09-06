# Pruebas ONE SHOP v5.9.3

## Campo

1. Crear un tramo con dos o más puntos y guardar una foto.
2. Grabar un video y comprobar que la marca aparece dentro del archivo.
3. Elegir un video del teléfono menor a 90 segundos y 80 MB.
4. Confirmar que el progreso llega a 100 %, conserva el original y genera la copia marcada.
5. Intentar elegir un archivo mayor a los límites y verificar que se rechaza sin reemplazar el video anterior.
6. Descargar Carteles y comprobar `manifest.json`, `CARTELERIA.xlsx`, `CARTELERIA.geojson` y multimedia.
7. Descargar Locales partidarios y confirmar que no contiene Banner, Panel ni Pinta.
8. Descargar Evidencias y confirmar que solo contiene Banner, Panel y Pinta; proveedor solo en Panel.

## CONTROL

1. Subir cada ZIP en su cargador correcto.
2. Intentar cruzar los tres paquetes y confirmar el rechazo por categoría.
3. Verificar que Carteles aparece como línea A-B y los otros registros como puntos.
4. Recargar el dashboard y comprobar que los tramos locales permanecen.
5. Desconectar la base central, importar un paquete y comprobar el modo local.
6. Conectar nuevamente y usar `Cargar central` para recuperar puntos y tramos consolidados.
