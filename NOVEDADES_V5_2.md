# ONE SHOT 5.2 · CAMERA ORIENTATION REWORK

## Objetivo
Corregir el comportamiento del modo horizontal para que la cámara no se “aloque”, reducir los casos en que la vista previa gira de forma extraña y evitar capturas que salgan de cabeza.

## Cambios principales
- Se separó la orientación de captura de la orientación visual de la interfaz.
- La UI usa un estado visual estable: `portrait` u `landscape`.
- La captura rota solo cuando el frame realmente lo necesita.
- Si el video ya llega en horizontal, ya no se vuelve a rotar innecesariamente.
- Se refresca el estado visual al iniciar cámara, al cambiar de modo y al redimensionar/orientar la pantalla.

## Resultado esperado
- Menos giros bruscos del preview.
- Menos riesgo de foto final al revés.
- Modo horizontal más cercano al comportamiento de una cámara normal.

## Siguiente prueba sugerida
1. Probar Vertical, Horizontal ▶ y Horizontal ◀.
2. Tomar una foto en cada modo.
3. Verificar preview, foto guardada y visor final.
4. Si algún equipo sigue saliendo al revés, registrar marca/modelo del teléfono para ajustar una matriz específica.
