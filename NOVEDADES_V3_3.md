# ONE SHOT v3.3 EVIDENCE UX

## Cambios principales

- Se retira la regla/horizonte de la cámara. El rumbo se conserva solo como metadato de la evidencia.
- Marca de evidencia rediseñada: fecha/hora, fuente temporal, GPS, precisión, rumbo/altitud cuando existen, dirección, código de evidencia y verificador.
- Verificador en una columna lateral que nace desde la parte inferior; los grupos de caracteres permanecen horizontales y se leen de abajo hacia arriba.
- Marca institucional ONPE predeterminada con transparencia visual. En Configuración puede usarse solo ONE SHOT, ocultarse o cargar un logo personalizado.
- Tamaño de marca y tamaño de texto configurables por separado.
- Color principal de la interfaz configurable y persistente.
- Tamaño de interfaz configurable: compacta, normal, grande y muy grande.
- Auto-ocultado de controles configurable: 5, 8, 12, 20 segundos o desactivado. El modo Editar diseño nunca auto-oculta los controles.
- Corrección del arrastre de la marca de agua en modo Editar diseño (`pointer-events` habilitado únicamente durante la edición).
- Visor responsivo: las acciones se reorganizan en 3x2 en teléfonos pequeños.
- Botón Maps recuperado en galería, visor y editor.
- Editor con selects reales para Proceso, Tipo elección, Tipo evidencia, Estado, Partido y Cargo; listas de sugerencias para candidato y distrito.
- Botones del editor reorganizados para teclado móvil y safe area.
- Botón principal Seleccionar ahora actúa como toggle: al pulsarlo nuevamente cancela el modo y limpia toda la selección.
- Botón rápido de actualización ONE SHOT en la cabecera además de Herramientas. Las configuraciones y evidencias continúan en IndexedDB/localStorage.
- Botón para regenerar la marca de las evidencias guardadas sin tocar la foto ORIGINAL ni su hash.

## Regla de integridad

Cambiar diseño, color, tamaño o marca institucional modifica solamente la imagen marcada (`stampedImage`). La foto ORIGINAL (`image`) y `SHA256_ORIGINAL` se conservan.

## Importante

El código verificador actual sigue siendo SHA-256 local. No se presenta como certificación pública/externa hasta que exista un backend de verificación y sello temporal.
