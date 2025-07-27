; Programa de ejemplo para probar el despliegue de la memoria de control
; Este programa ejecuta diferentes tipos de instrucciones para mostrar
; cómo se despliega la memoria de control dentro del decodificador

      mov al, 10     ; Haz clic en + para ver la memoria de control desplegada
      add al, 5      ; La memoria de control se despliega dentro del decodificador
      sub al, 2      ; Con una animación suave y efectos visuales
      cmp al, 13     ; El botón cambia de + a - cuando está desplegado
      jz igual       ; Haz clic en - para ocultar la memoria de control
      mov al, 0      ; Esta línea se ejecuta si Z=0
igual: hlt           ; Detener CPU 