# ONE SHOT 5.6.1 · EASY INSTALL

## Objetivo
Simplificar la instalación de la PWA para usuarios de campo sin descargar APK ni ZIP.

## Funciones
- Botón **Instalar ONE SHOT** en Configuración.
- Android/Chrome: usa el prompt nativo de instalación cuando el navegador lo expone.
- iPhone/iPad: guía paso a paso para **Compartir → Añadir a pantalla de inicio**.
- Samsung Internet: guía específica de instalación.
- Detección automática de `display-mode: standalone` para saber si ONE SHOT ya está instalada.
- QR de instalación y opción para compartir/copiar el enlace.
- Aviso inicial opcional; si el usuario elige “Ahora no”, siempre puede instalar después desde Configuración.
- No altera evidencias ni IndexedDB.

## Importante
El prompt directo depende del navegador y de que la web se sirva por HTTPS con manifest y Service Worker válidos. En iOS la instalación sigue requiriendo la acción manual de Apple desde Safari.
