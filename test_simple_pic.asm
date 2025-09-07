; Programa simple para probar la activación automática del PIC
org 20h

mov al, 0FFh   ; Valor para deshabilitar todas las interrupciones
out 21h, al    ; Escribir al registro IMR del PIC (21h)

hlt            ; Detener el programa

end
