; Programa de prueba para INT 5
; INT 5 es una rutina que ejecuta HLT para detener el programa
org 1000h

mov al, 5
mov bl, 10

; Llamar a la interrupción 5, que ejecutará HLT
int 5

; Estas instrucciones no deberían ejecutarse
mov al, 99
mov bl, 99

end
