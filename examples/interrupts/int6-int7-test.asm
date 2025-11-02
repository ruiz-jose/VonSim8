; Test combinado INT 6 e INT 7
; Este programa lee un carácter del teclado con INT 6
; y luego lo muestra en pantalla usando INT 7
; Ambas rutinas de interrupción deberían aparecer coloreadas

org 2000h

inicio:
    ; Leer un carácter del teclado usando INT 6
    mov bx, offset buffer
    int 6
    
    ; Mostrar el carácter leído en pantalla usando INT 7
    mov bx, offset mensaje1
    mov al, 17          ; Longitud del mensaje1
    int 7
    
    ; Mostrar el carácter ingresado
    mov bx, offset buffer
    mov al, 1           ; Un solo carácter
    int 7
    
    ; Mostrar mensaje final
    mov bx, offset mensaje2
    mov al, 1           ; Salto de línea
    int 7
    
    hlt

mensaje1 db 'Tecla presionada: '
buffer   db 0
mensaje2 db 10  ; Salto de línea (line feed)

end
