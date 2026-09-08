# ONE SHOT · Google Drive Bridge

Este puente permite que ONE SHOT y ONE SHOT CONTROL guarden la multimedia en el Drive del propietario sin exponer credenciales de Google dentro del frontend.

## Autorización única

1. Abre https://script.google.com/ con la cuenta propietaria del Drive.
2. Crea un proyecto nuevo llamado `ONE SHOT DRIVE BRIDGE`.
3. Copia el contenido de `Code.gs` de esta carpeta al archivo `Code.gs` del proyecto.
4. Ejecuta manualmente la función `setupOneShotDriveBridge` una vez y autoriza Drive/Sheets cuando Google lo solicite.
5. En `Registro de ejecución` copia el valor `ONE SHOT TOKEN`.
6. Ve a **Implementar → Nueva implementación → Aplicación web**.
7. Ejecutar como: **Yo**. Acceso: **Cualquier usuario** (el token ONE SHOT sigue siendo obligatorio para toda acción).
8. Copia la URL terminada en `/exec`.
9. En ONE SHOT: **Config → Google Drive · ONE SHOT CENTRAL**. Pega URL + token y pulsa **Probar Drive**.
10. En CONTROL aparecerá la misma configuración porque ambos usan el mismo origen `one-shop.pages.dev`.

## Reglas de integridad

- `ORIGINAL` nunca se sobrescribe silenciosamente.
- `FINAL` puede tener versiones históricas.
- Mismo `code + kind + SHA-256`: idempotente, no crea otro archivo.
- Mismo SHA-256 con otro código: no duplica bytes; crea una referencia `DUPLICATE_EXACT` al archivo canónico.
- Mismo punto geográfico con hash diferente: no se elimina automáticamente. Debe revisarse porque en una misma ubicación pueden coexistir varias propagandas del mismo o de distintos partidos.
- Al eliminar una evidencia, se marca su referencia como `DELETED`. El archivo físico solo va a papelera cuando ningún otro código activo lo reutiliza.

## Carpetas ya configuradas

- `ONE SHOT CENTRAL`: `11w54EN71nh8UHZZ6yB0Ps-hBrcB0Vi1M`
- `ORIGINAL`: `1fEQ_3GCtI9sWix5n931x8oe9wdRxUGic`
- `FINAL_CON_MARCO`: `1yEt1ZkfqmgSs9MPUzQvgXK1BRig-XJYz`

El script crea automáticamente un Google Sheet `ONE_SHOT_MEDIA_INDEX` dentro de `ONE SHOT CENTRAL` para conservar código, tipo de versión, SHA-256, file ID, estado, alias de duplicado y metadatos territoriales básicos.
