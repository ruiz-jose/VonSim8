; Ejemplo de escritura directa en 0xE5 - Mostrar mensaje
; Este programa demuestra cómo escribir caracteres directamente en la
; dirección 0xE5 de memoria para mostrarlos en pantalla sin usar INT 7

org 2000h

; Inicializar BX para apuntar al mensaje
mov bx, offset mensaje

escribir_loop:
    ; Cargar el carácter actual
    mov al, [bx]
    
    ; Verificar si es fin de cadena (0)
    cmp al, 0
    jz fin
    
    ; Escribir el carácter en 0xE5 (pantalla)
    mov [0E5h], al
    
    ; Avanzar al siguiente carácter
    inc bx
    
    ; Repetir
    jmp escribir_loop

fin:
    hlt

mensaje db 'VonSim8 - Escritura directa en 0xE5!', 0

end
