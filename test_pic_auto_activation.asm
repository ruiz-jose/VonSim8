; Programa para probar la activación automática del PIC
; Este programa debería activar automáticamente el PIC antes de ejecutarse

IMR EQU 21h    ; Registro de máscara de interrupciones del PIC
EOI EQU 20h    ; Puerto para enviar End Of Interrupt al PIC

inicio:
    ; Configurar PIC - estas instrucciones deberían activar automáticamente el PIC
    mov al, 11111110b  ; Habilitar solo INT0 (deshabilitar el resto)
    out IMR, al        ; Escribir al registro IMR (21h)
    
    ; Enviar EOI
    mov al, 20h
    out EOI, al        ; Escribir al puerto EOI (20h)
    
    ; Programa principal
    mov ax, 1234h
    hlt

end
