; Programa de prueba completo para verificar animación simultánea de left y right
; Este programa ejecuta múltiples instrucciones ALU para ver el flujo completo

; Cargar valores en registros
MOV AL, 10   ; AL = 10
MOV BL, 5    ; BL = 5
MOV CL, 3    ; CL = 3

; Instrucción ALU 1: ADD AL, BL (debería mostrar animación simultánea)
ADD AL, BL   ; AL = AL + BL (10 + 5 = 15)

; Instrucción ALU 2: SUB CL, BL (debería mostrar animación simultánea)
SUB CL, BL   ; CL = CL - BL (3 - 5 = -2)

; Instrucción ALU 3: AND AL, CL (debería mostrar animación simultánea)
AND AL, CL   ; AL = AL & CL

; Halt para detener la ejecución
HLT 