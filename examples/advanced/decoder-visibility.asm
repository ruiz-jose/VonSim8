; Programa de ejemplo para probar la visibilidad del decodificador
; Este programa ejecuta diferentes tipos de instrucciones para mostrar
; cómo el decodificador se vuelve más visible durante la ejecución

      mov al, 5      ; El decodificador debería estar visible y activo
      add al, 3      ; Continuar viendo la actividad del decodificador
      sub al, 1      ; El decodificador sigue procesando
      cmp al, 7      ; Comparación - decodificador activo
      jz igual       ; Salto condicional - decodificador activo
      mov al, 0      ; Esta línea se ejecuta si Z=0
igual: hlt           ; Detener CPU - decodificador se detiene 