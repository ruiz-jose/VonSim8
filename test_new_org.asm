; Programa de prueba para la nueva funcionalidad de ORG
; Este programa debería comenzar automáticamente en 08h
; sin necesidad de especificar ORG 10h y ORG 20h

; Datos y código principal (comienza en 08h automáticamente)
mov al, 5
int 7
mov bl, al
hlt

; Rutina específica en posición 80h
org 80h
routine:
    mov cl, al
    add cl, bl
    ret

end
