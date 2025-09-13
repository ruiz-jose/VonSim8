; Programa que usa el PIC para probar la nueva funcionalidad
org 2000h

; Configurar PIC
mov al, 0FCh    ; Enmascarar todas las interrupciones excepto INT0 e INT1  
out 21h, al     ; Escribir al IMR (Interrupt Mask Register)

mov al, 20h     ; EOI (End Of Interrupt)
out 20h, al     ; Escribir al EOI

; Leer estado del PIC
in al, 20h      ; Leer desde el puerto de comando del PIC

hlt

end
