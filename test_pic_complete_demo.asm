; ===================================================================
; Programa completo para demostrar la activación automática del PIC
; y la visualización del flag I de interrupciones
; ===================================================================

; Constantes para el PIC
IMR     EQU 21h    ; Interrupt Mask Register (Registro de máscara)
EOI     EQU 20h    ; End Of Interrupt (Fin de interrupción)
INT0    EQU 24h    ; Línea de interrupción INT0
INT1    EQU 25h    ; Línea de interrupción INT1

org 20h            ; Código en 20h (automáticamente detectado)

inicio:
    ; ======== CONFIGURACIÓN INICIAL ========
    cli                 ; Deshabilitar interrupciones (I=0) - flag I debe verse apagado
    
    ; ======== CONFIGURACIÓN DEL PIC ========
    ; Esta sección debería activar automáticamente el PIC y mostrar el flag I
    
    ; Configurar máscara de interrupciones
    mov al, 11111100b   ; Habilitar INT0 e INT1 (bits 0 y 1 = 0)
    out IMR, al         ; Escribir al IMR (esto activa automáticamente el PIC)
    
    ; Configurar líneas de interrupción
    mov al, 55h         ; Valor para INT0
    out INT0, al        ; Configurar INT0 (24h)
    
    mov al, AAh         ; Valor para INT1
    out INT1, al        ; Configurar INT1 (25h)
    
    ; ======== HABILITAR INTERRUPCIONES ========
    sti                 ; Habilitar interrupciones (I=1) - flag I debe verse iluminado
    
    ; ======== PROGRAMA PRINCIPAL ========
bucle:
    mov ax, 1234h       ; Operación de ejemplo
    mov bx, 5678h       ; Otra operación
    add ax, bx          ; Operación aritmética (debe actualizar flags C y Z)
    
    nop                 ; Punto de pausa para interrupciones
    jmp bucle           ; Bucle infinito esperando interrupciones
    
    ; Si alguna vez llega aquí (no debería)
    hlt

; ======== RUTINA DE INTERRUPCIÓN DE EJEMPLO ========
; (Esta rutina debería estar en las direcciones del vector de interrupciones)
rutina_int0:
    ; Enviar EOI al PIC
    mov al, 20h
    out EOI, al         ; Confirmar fin de interrupción
    
    iret                ; Retorno de interrupción (debería restaurar I=1)

end
