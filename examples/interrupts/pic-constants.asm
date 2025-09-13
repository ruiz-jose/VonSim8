; Programa de prueba: Uso de constantes EQU para PIC
; Esto debería activar automáticamente el PIC

; Definir constantes EQU para registros PIC
IMR     EQU 21h    ; Interrupt Mask Register
EOI     EQU 20h    ; End Of Interrupt
INT2    EQU 26h    ; Interrupt line 2

org 20h

inicio:
    ; Configurar máscara de interrupciones
    mov al, 11111110b  ; Habilitar solo INT0
    out IMR, al        ; Usar constante EQU (21h)
    
    ; Configurar línea de interrupción
    mov al, 00000001b
    out INT2, al       ; Usar constante EQU (26h)
    
    ; Enviar EOI
    mov al, 20h
    out EOI, al        ; Usar constante EQU (20h)
    
bucle:
    nop               ; Esperar interrupciones
    jmp bucle
    
hlt

end
