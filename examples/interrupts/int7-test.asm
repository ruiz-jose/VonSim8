; Test de INT 7 - Escritura en pantalla
; Este programa demuestra el uso de INT 7 para escribir un mensaje en pantalla
; La rutina de interrupción INT 7 (direcciones 0xD0-0xE6) debería aparecer coloreada
; del mismo color que el vector de interrupciones

org 20h

inicio:
    ; Configurar el mensaje a mostrar
    mov bx, offset mensaje
    mov al, 5          ; Longitud del mensaje
    
    ; Llamar a INT 7 para escribir en pantalla
    int 7
    
    ; Fin del programa
    hlt

mensaje db 'Hola!'

end
