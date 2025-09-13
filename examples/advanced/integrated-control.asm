; Programa de ejemplo para probar la funcionalidad integrada
; Este programa ejecuta diferentes tipos de instrucciones para mostrar
; cómo se despliegan tanto la memoria de control como el secuenciador

      mov al, 15     ; Haz clic en + para ver memoria de control y secuenciador
      add al, 5      ; Ambos componentes se despliegan juntos
      sub al, 3      ; Con barras de progreso sincronizadas
      cmp al, 17     ; El botón cambia de + a - cuando está desplegado
      jz igual       ; Haz clic en - para ocultar ambos componentes
      mov al, 0      ; Esta línea se ejecuta si Z=0
igual: hlt           ; Detener CPU 