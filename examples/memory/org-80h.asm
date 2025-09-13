; Programa de prueba: solo tiene rutina en ORG 80h
; El programa principal debe empezar en 08h si tiene INT, sino en 00h
; No tiene INT, así que IP debe inicializar en 00h

        MOV AL, 05h
        CALL rutina
        HLT

ORG 80h
rutina:
        MOV BL, AL
        RET
