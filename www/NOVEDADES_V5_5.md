# ONE SHOT 5.5 · TEAM MISSIONS

## Objetivo
Permitir que una cobertura territorial pase de un trabajador a otro sin empezar de cero.

## Incluye
- Registro local de integrantes y rol.
- Asignaciones por sector y objetivo.
- Estados Pendiente / En curso / Pausada / Cerrada.
- Botón Iniciar/Continuar que reutiliza el Smart Sector activo.
- Responsable sincronizado con la cobertura.
- Nota de relevo con cobertura, autor, hora y GPS disponible.
- Exportación JSON de relevo de equipo.
- Importación por fusión: no reemplaza el progreso local y conserva el estado más avanzado de las celdas.
- Evidencias nuevas guardan assignmentId, memberId y sector.

## Flujo de prueba
1. Crear/cargar un Smart Sector 5.4.
2. Agregar Juan Gómez y Diego Rodríguez.
3. Asignar JM-A a Juan y comenzar.
4. Recorrer una parte, dejar una nota y exportar relevo.
5. Importar el archivo en otro dispositivo/copia del app.
6. Activar una asignación para Diego y pulsar Continuar pendiente.
7. Verificar que la cobertura anterior no se borra.
