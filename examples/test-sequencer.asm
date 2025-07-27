; Programa de ejemplo para probar el secuenciador
; Este programa ejecuta diferentes tipos de instrucciones para mostrar
; las diferentes fases del ciclo de instrucción

      mov al, 10     ; Fase 1: Captación - obtener instrucción
                     ; Fase 2: Decodificación - interpretar MOV
                     ; Fase 3: Ejecución - cargar valor en AL
                     ; Fase 4: Escritura - guardar en registro AL

      add al, 5      ; Fase 1: Captación - obtener instrucción ADD
                     ; Fase 2: Decodificación - interpretar ADD
                     ; Fase 3: Ejecución - sumar en ALU
                     ; Fase 4: Escritura - actualizar AL y flags

      cmp al, 15     ; Fase 1: Captación - obtener instrucción CMP
                     ; Fase 2: Decodificación - interpretar CMP
                     ; Fase 3: Ejecución - comparar en ALU
                     ; Fase 4: Escritura - actualizar flags

      jz igual       ; Fase 1: Captación - obtener instrucción JZ
                     ; Fase 2: Decodificación - interpretar JZ
                     ; Fase 3: Ejecución - evaluar condición
                     ; Fase 4: Escritura - actualizar IP si Z=1

      mov al, 0      ; Esta instrucción se ejecuta si Z=0
igual: hlt           ; Detener CPU 