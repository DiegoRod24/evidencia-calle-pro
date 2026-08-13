# ONE SHOT v3.5.1 · SELECTION FIX

## Correcciones funcionales
- `Todas` selecciona inmediatamente todas las evidencias visibles del filtro actual.
- `Ninguna` limpia la selección inmediatamente.
- Cada evidencia puede seleccionarse o quitarse individualmente después de usar `Todas`.
- `Acciones` muestra el número de evidencias seleccionadas y abre el panel masivo cuando existe selección.
- El botón principal `Cancelar selección` sale del modo y limpia los checks.
- Persistencia por lote: IndexedDB guarda toda la selección en una sola transacción; ya no se serializa la base completa una vez por cada fotografía.
- Se elimina `SERV` / `SERVIDOR` de tarjetas, vista previa y marca visible. La fuente de hora se conserva internamente y en la ficha técnica.
- La marca visible muestra GPS sin el prefijo de fuente horaria.
