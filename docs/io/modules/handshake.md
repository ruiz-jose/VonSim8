# Handshake

El _handshake_ es un dispotivo diseñado con el fin de facilitar la comunicación con las [impresoras Centronics](../devices/printer). Está basado en el PPI 8255 de Intel en su modo "1", pero con algunas modificaciones para simplificar su funcionamiento.

Este cuenta con dos registros de 8 bits:

- el registro de datos (dirección `40h` de la [memoria E/S](./index)),
- y el registro de estado (dirección `41h` de la [memoria E/S](./index)).

Específicamente,

```
Datos  = DDDD DDDD
Estado = I___ __SB
```

En el registro de datos se almacenará carácter a imprimir, expresado en ASCII. Cada vez que la CPU escriba sobre ese registro, el _handshake_ se encargará de realizar un flanco ascendente en el _strobe_ para que el carácter se imprima automáticamente.

En el registro de estado, los dos bits menos significativos son el _strobe_ y _busy_ ([leer más sobre los mismos](../devices/printer)), análogamente a como se usan en una impresora conectada con un PIO. La diferencia es que el bit de _busy_ no puede ser modificado por la CPU y el bit de _strobe_ siempre es `0`. Si la CPU trata de escribir un `1` en el bit de _strobe_, este causará un flanco ascendente en el _strobe_, enviando lo almacenado en el registro de datos, y el handshake lo volverá a `0` automáticamente.

Además, el bit más significativo del registro de estado habilita/inhabilita las interrupciones. Si este bit es `1`, mientras la impresora no esté ocupada (`B=0`), el Handshake disparará una interrupción por hardware. Está conectado al puerto `INT2` del [PIC](./pic).


```vonsim
; Imprime el string "hola" en la impresora usando Handshake

dato db "Hola", 0         ; String a imprimir, terminado en 0 (carácter nulo)

HS_DATA   EQU 40h         ; Dirección del registro de datos del Handshake
HS_STATUS EQU 41h         ; Dirección del registro de estado del Handshake

; --- Deshabilita las interrupciones del Handshake (bit 7 en 0) ---
in  al, HS_STATUS
and al, 01111111b         ; Fuerza el bit 7 a 0 (sin interrupciones)
out HS_STATUS, al

; --- Inicializa el puntero al string ---
mov bl, offset dato       ; BL apunta al primer carácter del string

; --- Bucle principal: espera espacio en el buffer e imprime ---
sondeo:
    in  al, HS_STATUS
    and al, 00000001b     ; Lee el flag busy (bit 0): 1=lleno, 0=libre
    jz  imprimir_cadena   ; Si busy=0, hay espacio y puede imprimir
    jmp sondeo            ; Si busy=1, espera hasta que haya espacio

imprimir_cadena:
    mov al, [bl]          ; Carga el siguiente carácter del string
    cmp al, 0             ; ¿Es el final del string? (carácter nulo)
    jz fin                ; Si sí, termina el programa

    out HS_DATA, al       ; Envía el carácter al registro de datos del Handshake

    inc bl                ; Avanza al siguiente carácter del string
    jmp sondeo            ; Repite el proceso para el próximo carácter

fin:
    hlt                   ; Detiene la ejecución
```

Imprimir un string en la impresora a través del handshake en modo interrupciones

```vonsim
; ===============================================================================
; PROGRAMA: Impresión de string usando Handshake con interrupciones
; DESCRIPCIÓN: Imprime el string "hola" en la impresora utilizando el módulo
;              Handshake con interrupciones por hardware (INT2)
; ===============================================================================

; --- SECCIÓN DE DATOS ---
mensaje     db "Hola", 0    ; String a imprimir, terminado en carácter nulo
restantes   db 4           ; Contador de caracteres restantes por imprimir
puntero     db 0           ; Puntero al siguiente carácter (8 bits)

; --- CONSTANTES DE HANDSHAKE ---
HS_DATA     EQU 40h        ; Registro de datos del Handshake (puerto E/S)
HS_STATUS   EQU 41h        ; Registro de estado del Handshake (puerto E/S)

; --- CONSTANTES DE INTERRUPCIONES ---
ID          EQU 2          ; ID de la interrupción para Handshake (0-7)
IMR         EQU 21h        ; Registro de máscara de interrupciones del PIC
EOI         EQU 20h        ; Puerto para enviar End Of Interrupt al PIC
INT2        EQU 26h        ; Puerto para configurar la línea INT2
; ===============================================================================
; PROGRAMA PRINCIPAL
; ===============================================================================


; --- 1) CONFIGURACIÓN INICIAL ---
cli                        ; Deshabilitar interrupciones globales

; --- 2) CONFIGURACIÓN DEL HANDSHAKE ---
; Habilitar interrupciones del Handshake (bit 7 = 1)
in  al, HS_STATUS         ; Leer estado actual del Handshake
or  al, 10000000b         ; Activar bit 7 (habilitar interrupciones)
out HS_STATUS, al         ; Escribir configuración al Handshake

; --- 3) CONFIGURACIÓN DEL PIC (Controlador de Interrupciones) ---

; 3.1) Configurar máscara de interrupciones - Solo habilitar INT2
mov al, 11111011b         ; Máscara: habilita solo INT2 (bit 2=0), resto deshabilitado
out IMR, al               ; Aplicar máscara al PIC

; 3.2) Asignar ID de interrupción a la línea INT2
mov al, ID                ; Cargar ID de interrupción (2)
out INT2, al              ; Configurar línea INT2 con este ID

; 3.3) Configurar vector de interrupción en memoria
mov bl, ID                ; BL = posición en tabla de vectores (ID=2)
mov [bl], int2_handler    ; Almacenar dirección de rutina en vector[2]

; --- 4) INICIALIZACIÓN DE VARIABLES ---
mov al, offset mensaje    ; AL = dirección del primer carácter del string
mov puntero, al           ; Guardar en variable puntero

; --- 5) ENVIAR PRIMER CARÁCTER PARA INICIAR EL PROCESO ---
; Esperar que la impresora esté lista
esperar_listo:
    in al, HS_STATUS
    and al, 00000001b     ; Verificar bit busy
    jnz esperar_listo     ; Si busy=1, esperar

; Enviar primer carácter
mov bl, puntero           ; Cargar puntero
mov al, [bl]              ; Obtener primer carácter
cmp al, 0                 ; ¿Es string vacío?
jz fin                    ; Si está vacío, terminar

out HS_DATA, al           ; Enviar primer carácter
inc bl                    ; Avanzar puntero
mov puntero, bl           ; Guardar puntero actualizado
dec restantes             ; Decrementar contador

; --- 6) HABILITAR INTERRUPCIONES Y ESPERAR ---
sti                       ; Habilitar interrupciones globales

; --- 7) BUCLE DE ESPERA ---
; El programa principal espera hasta que se impriman todos los caracteres
bucle_espera:
    cmp restantes, 0      ; ¿Quedan caracteres por imprimir?
    jnz bucle_espera      ; Si quedan, seguir esperando

; --- 8) FINALIZACIÓN ---
fin:
hlt                       ; Detener ejecución del programa

; ===============================================================================
; RUTINA DE INTERRUPCIÓN INT2 - HANDSHAKE
; ===============================================================================
; DESCRIPCIÓN: Se ejecuta automáticamente cuando la impresora está lista
;              para recibir un nuevo carácter (busy = 0)
; ENTRADA: Variable puntero = dirección del siguiente carácter a imprimir
; SALIDA: Carácter enviado a la impresora, puntero actualizado
; ===============================================================================
org 80h
int2_handler:
    ; --- PRESERVAR CONTEXTO ---
    push al               ; Guardar registros que se van a modificar
    push bl

    ; --- VERIFICAR SI HAY MÁS CARACTERES ---
    cmp restantes, 0      ; ¿Quedan caracteres por imprimir?
    jz fin_interrupcion   ; Si no quedan, terminar

    ; --- OBTENER SIGUIENTE CARÁCTER ---
    mov bl, puntero       ; BL = puntero al siguiente carácter
    mov al, [bl]          ; AL = carácter apuntado por BL
    cmp al, 0             ; ¿Es el carácter nulo (fin de string)?
    jz fin_interrupcion   ; Si es 0, terminar

    ; --- ENVIAR CARÁCTER A LA IMPRESORA ---
    out HS_DATA, al       ; Escribir carácter al registro de datos del Handshake

    ; --- ACTUALIZAR PUNTEROS Y CONTADORES ---
    inc bl                ; Avanzar al siguiente carácter
    mov puntero, bl       ; Guardar puntero actualizado
    dec restantes         ; Decrementar contador de caracteres restantes

fin_interrupcion:
    ; --- ENVIAR EOI AL PIC ---
    mov al, 20h           ; Señal de fin de interrupción
    out EOI, al           ; Notificar al PIC

    ; --- RESTAURAR CONTEXTO ---
    pop bl                ; Restaurar registros preservados
    pop al

    ; --- RETORNO DE INTERRUPCIÓN ---
    iret                  ; Retorno de interrupción
```
