; Programa de prueba: tiene rutina en ORG 80h Y tiene INT
; El programa principal debe empezar en 08h porque tiene INT
; IP debe inicializar en 08h

        MOV AL, 05h
        INT 7
        CALL rutina
        HLT

ORG 80h
rutina:
        MOV BL, AL
        RET
