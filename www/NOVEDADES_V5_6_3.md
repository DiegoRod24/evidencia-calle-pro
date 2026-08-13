# ONE SHOT 5.6.3 · PERMISSION ASSISTANT

## Objetivo
Evitar que el usuario quede atrapado en “No se pudo abrir la cámara” sin saber qué hacer.

## Mejoras
- Diferencia permiso denegado, cámara ocupada, cámara no encontrada y navegador incompatible.
- Si el permiso está denegado, deja de insistir con getUserMedia y abre un flujo de recuperación.
- Guía adaptada para Android/Chrome, Samsung Internet e iPhone/iPad.
- Botón “Ya di permiso · Probar”.
- Chequeo previo de Cámara + GPS desde Configuración.
- Recuperación al volver desde segundo plano.
- Resolver permisos no finaliza un recorrido activo.
- Mensajes humanos, manteniendo el nombre técnico del error en el estado interno.

## Importante
Una PWA no puede abrir de forma universal la pantalla exacta de permisos del sistema en todos los teléfonos. Por eso ONE SHOT detecta el entorno y guía al usuario con los pasos adecuados.
