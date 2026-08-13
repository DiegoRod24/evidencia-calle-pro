# ONE SHOT v3.5.2 · TOUCH + SELECTION FIX

- Selección temporal de UI: no se persiste en IndexedDB/localStorage.
- Al entrar en Seleccionar siempre inicia con 0 marcadas.
- Todas funciona en el primer toque y selecciona exactamente las evidencias visibles del filtro.
- Ninguna limpia inmediatamente; luego Todas vuelve a funcionar sin pasos intermedios.
- Se puede quitar una evidencia individual después de Todas.
- Acciones refleja el contador actual.
- Panel de cámara usa una capa exclusiva para evitar que controles de abajo intercepten toques.
- En horizontal el panel de opciones tiene scroll propio y límites seguros.
- Controles ocultos/atenuados mientras el panel está abierto.
