; Programa para probar la activación automática del PIC y flag I
; Este programa debería:
; 1. Activar automáticamente el PIC
; 2. Mostrar el flag I automáticamente
; 3. Cambiar la configuración de flags a IF_CF_ZF o IF_SF_OF_CF_ZF

org 20h

inicio:
    ; Configurar interrupciones (estas instrucciones activarán automáticamente el PIC)
    cli               ; Deshabilitar interrupciones (I=0)
    
    ; Configurar máscara del PIC
    mov al, 0FEh      ; Habilitar solo INT0 (bit 0 = 0)
    out 21h, al       ; Escribir al IMR (Interrupt Mask Register)
    
    ; Configurar línea INT0
    mov al, 01h       ; Valor para INT0
    out 24h, al       ; Escribir al puerto INT0 (24h)
    
    ; Habilitar interrupciones
    sti               ; Habilitar interrupciones (I=1) - debería verse el flag I iluminado
    
bucle:
    nop              ; Esperar interrupciones
    jmp bucle
    
    hlt

end
