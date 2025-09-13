; Programa de prueba para verificar animación simultánea de left y right
; Este programa ejecuta una instrucción ADD que debería mostrar la animación simultánea

; Cargar valores en registros
MOV AL, 5    ; AL = 5
MOV BL, 3    ; BL = 3

; Instrucción ALU que debería mostrar animación simultánea de left y right
ADD AL, BL   ; AL = AL + BL (5 + 3 = 8)

; Halt para detener la ejecución
HLT 