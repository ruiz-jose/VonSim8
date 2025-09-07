; Programa de prueba: tiene ORG 20h al inicio
; El programa principal debe empezar en 20h
; IP debe inicializar en 20h

ORG 20h
        MOV AL, 05h
        CALL rutina
        HLT

ORG 80h
rutina:
        MOV BL, AL
        RET
