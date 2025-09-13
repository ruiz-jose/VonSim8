; Programa mínimo para probar detección PIC
; Esta constante está en el rango PIC (0x20-0x2B)
IMR EQU 21h

; Esta instrucción usa la constante PIC
mov al, 0FFh
out IMR, al
hlt
