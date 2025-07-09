; Programa: Imprime "Hola" a los 3 segundos de iniciado y luego termina.
; Utiliza la interrupción del TIMER (ID = 5).

org 10h
mensaje db "hola"        ; Mensaje a imprimir
imprimio db 0            ; Flag para saber si ya imprimió

; Definición de direcciones de registros de dispositivos
CONT equ 10h             ; Registro de conteo del timer
COMP equ 11h             ; Registro de comparación del timer

EOI  equ 20h             ; End Of Interrupt (para PIC)
IMR  equ 21h             ; Interrupt Mask Register (PIC)
INT1 equ 25h             ; Registro de vector de interrupción 1

org 20h                  ; Comienzo del código principal

; --- Habilitar interrupciones del timer ---
; IMR = 1111 1101b (solo habilita interrupciones del timer y teclado)
mov al, 11111101b        ; Habilita interrupciones del timer (bit 1 en 0)
out IMR, al

; --- Configurar vector de interrupción del timer ---
mov al, 5                ; ID de interrupción del timer
out INT1, al             ; Asigna rutina de atención a la posición 5

; --- Instalar rutina de interrupción en el vector ---
mov bl, 5                ; Vector de interrupción 5
mov [bl], imp_msj        ; Apunta a la rutina imp_msj

; --- Configurar timer para 3 segundos ---
mov al, 3                ; Valor de comparación (3 segundos)
out COMP, al

mov al, 0                ; Reinicia el contador del timer
out CONT, al

; --- Esperar a que se imprima el mensaje ---
loopinf: cmp imprimio, 0 ; ¿Ya imprimió?
         jz loopinf      ; Si no, sigue esperando

hlt                      ; Termina el programa

; --- Rutina de interrupción del timer ---
org 50h
imp_msj:
         mov bl, offset mensaje ; Dirección del mensaje
         mov al, 4             ; Servicio de impresión
         int 7                 ; Llama a la interrupción de impresión
         mov imprimio, 1       ; Marca que ya imprimió
         mov al, 20h           ; Señal de fin de interrupción
         out EOI, al           ; Notifica al PIC
         iret                  ; Retorna de la interrupción