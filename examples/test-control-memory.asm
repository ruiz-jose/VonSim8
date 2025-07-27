; Programa de ejemplo para probar la memoria de control
; Este programa ejecuta diferentes tipos de instrucciones para mostrar
; cómo funciona la memoria de control

      mov al, 5      ; Cargar valor en AL
      mov bl, 3      ; Cargar valor en BL
      add al, bl     ; Sumar AL + BL
      sub al, 2      ; Restar 2 de AL
      cmp al, 5      ; Comparar AL con 5
      jz igual       ; Saltar si es igual
      mov al, 0      ; Si no es igual, poner AL en 0
igual: hlt           ; Detener CPU 