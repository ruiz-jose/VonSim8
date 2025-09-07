; Test de nueva funcionalidad ORG
; El programa principal debe comenzar en 08h automáticamente
; y la rutina específica debe ubicarse en 80h

; Programa principal (inicia automáticamente en 08h)
mov al, 5
int 7
call routine
hlt

; Rutina específica ubicada en 80h
org 80h
routine:
    mov bl, al
    add bl, 1
    ret

end
