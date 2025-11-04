; Programa de prueba para INT 0
; INT 0 es una rutina que ejecuta HLT para detener el programa
org 1000h

mov al, 5
mov bl, 10

; Llamar a la interrupción 0, que ejecutará HLT
int 0

; Estas instrucciones no deberían ejecutarse
mov al, 99
mov bl, 99

end
