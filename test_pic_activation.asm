; Programa de prueba para la activación automática del PIC
; Este programa debería activar automáticamente el módulo PIC
; cuando intente acceder a las direcciones 20h-2Bh

; --- CONSTANTES DE INTERRUPCIONES ---
ID          EQU 2          ; ID de la interrupción para test
IMR         EQU 21h        ; Registro de máscara de interrupciones del PIC
EOI         EQU 20h        ; Puerto para enviar End Of Interrupt al PIC
INT2        EQU 26h        ; Puerto para configurar la línea INT2

inicio:
    ; Intentar configurar la máscara de interrupciones (esto debería activar el PIC automáticamente)
    mov al, 11111111b     ; Deshabilitar todas las interrupciones
    out IMR, al           ; Escribir al registro IMR (21h)
    
    ; Configurar la línea INT2
    mov al, ID            ; Cargar ID de interrupción
    out INT2, al          ; Escribir al puerto INT2 (26h)
    
    ; Enviar EOI al PIC
    mov al, 20h           ; Señal de fin de interrupción
    out EOI, al           ; Escribir al puerto EOI (20h)
    
    ; Terminar el programa
    hlt
