# ONE SHOT 5.6.2 · TERRITORY UX

## Objetivo
Ordenar y robustecer la experiencia territorial antes de LIVE SYNC.

## Mejoras
- El recorrido activo permanece guardado hasta que el usuario pulse **Finalizar**.
- Si ONE SHOT pasa a segundo plano o se cierra, el recorrido se marca como interrumpido, no como terminado. Al volver se reanuda y queda trazabilidad del corte.
- Advertencia del navegador cuando se intenta cerrar con un recorrido activo.
- Cobertura territorial principal sobre mapa Leaflet/OpenStreetMap; la vista técnica antigua queda como diagnóstico.
- Perímetro Smart Sector, ruta GPS, evidencias y Smart Route se superponen en el mismo mapa de cobertura.
- Team Missions responsive: formularios apilados en celular y sin desbordes laterales.
- Flujo visual de cuatro pasos: Planifica → Asigna → Recorre → Continúa.
- Ayuda contextual para explicar Planificación Territorial, Team Missions, Cobertura y Smart Route.
- Smart Route explica claramente que ordena únicamente las zonas pendientes.

## Regla de trazabilidad
Una PWA no puede garantizar GPS continuo con la app completamente cerrada. ONE SHOT conserva la misión y registra la interrupción; al volver continúa sin dar por finalizado el recorrido.
