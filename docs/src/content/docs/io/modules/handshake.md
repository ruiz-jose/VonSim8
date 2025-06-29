---
title: Handshake
head:
  - tag: meta
    attrs:
      { property: og:image, content: https://vonsim.github.io/docs/og/io/modules/handshake.png }
---

El _handshake_ es un dispotivo diseñado con el fin de facilitar la comunicación con las [impresoras Centronics](/VonSim8/docs/io/devices/printer/). Está basado en el PPI 8255 de Intel en su modo "1", pero con algunas modificaciones para simplificar su funcionamiento.

Este cuenta con dos registros de 8 bits:

- el registro de datos (dirección `40h` de la [memoria E/S](/VonSim8/docs/io/modules/)),
- y el registro de estado (dirección `41h` de la [memoria E/S](/VonSim8/docs/io/modules/)).

Específicamente,

```
Datos  = DDDD DDDD
Estado = I___ __SB
```

En el registro de datos se almacenará carácter a imprimir, expresado en ASCII. Cada vez que la CPU escriba sobre ese registro, el _handshake_ se encargará de realizar un flanco ascendente en el _strobe_ para que el carácter se imprima automáticamente.

En el registro de estado, los dos bits menos significativos son el _strobe_ y _busy_ ([leer más sobre los mismos](/VonSim8/docs/io/devices/printer/)), análogamente a como se usan en una impresora conectada con un PIO. La diferencia es que el bit de _busy_ no puede ser modificado por la CPU y el bit de _strobe_ siempre es `0`. Si la CPU trata de escribir un `1` en el bit de _strobe_, este causará un flanco ascendente en el _strobe_, enviando lo almacenado en el registro de datos, y el handshake lo volverá a `0` automáticamente.

Además, el bit más significativo del registro de estado habilita/inhabilita las interrupciones. Si este bit es `1`, mientras la impresora no esté ocupada (`B=0`), el Handshake disparará una interrupción por hardware. Está conectado al puerto `INT2` del [PIC](/VonSim8/docs/io/modules/pic/).


```vonsim
; Imprime el string "hola" en la impresora usando Handshake

dato db "hola", 0         ; String a imprimir, terminado en 0 (carácter nulo)

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
; AUTOR: VonSim
; ===============================================================================

; --- SECCIÓN DE DATOS ---
org 10h
mensaje     db "hola", 0    ; String a imprimir, terminado en carácter nulo
restantes   db 4           ; Contador de caracteres restantes por imprimir

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
org 20h

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
mov bl, offset mensaje    ; BL = puntero al primer carácter del string

; --- 5) HABILITAR INTERRUPCIONES Y ESPERAR ---
sti                       ; Habilitar interrupciones globales

; --- 6) BUCLE DE ESPERA ---
; El programa principal espera hasta que se impriman todos los caracteres
bucle_espera:
    cmp restantes, 0      ; ¿Quedan caracteres por imprimir?
    jnz bucle_espera      ; Si quedan, seguir esperando
    
; --- 7) FINALIZACIÓN ---
hlt                       ; Detener ejecución del programa

; ===============================================================================
; RUTINA DE INTERRUPCIÓN INT2 - HANDSHAKE
; ===============================================================================
; DESCRIPCIÓN: Se ejecuta automáticamente cuando la impresora está lista
;              para recibir un nuevo carácter (busy = 0)
; ENTRADA: BL = puntero al siguiente carácter a imprimir
; SALIDA: Carácter enviado a la impresora, puntero actualizado
; ===============================================================================
org 80h
int2_handler:
    ; --- PRESERVAR CONTEXTO ---
    push ax               ; Guardar registros que se van a modificar
    push bx               ; (el resto se preserva automáticamente en INT)

    ; --- OBTENER SIGUIENTE CARÁCTER ---
    mov al, [bl]          ; AL = carácter apuntado por BL
    cmp al, 0             ; ¿Es el carácter nulo (fin de string)?
    jz  fin_impresion     ; Si es 0, terminar impresión

    ; --- ENVIAR CARÁCTER A LA IMPRESORA ---
    out HS_DATA, al       ; Escribir carácter al registro de datos del Handshake
                          ; (esto automáticamente genera el pulso strobe)

    ; --- ACTUALIZAR PUNTEROS Y CONTADORES ---
    inc bl                ; Avanzar al siguiente carácter
    dec restantes         ; Decrementar contador de caracteres restantes

fin_impresion:
    ; --- RESTAURAR CONTEXTO ---
    pop bx                ; Restaurar registros preservados
    pop ax
    
    ; --- RETORNO DE INTERRUPCIÓN ---
    iret                  ; Retorno de interrupción (restaura FLAGS, IP automáticamente)

; ===============================================================================
; NOTAS TÉCNICAS:
; ===============================================================================
; 1. El Handshake genera una interrupción cuando la impresora no está ocupada
;    (bit busy = 0 en el registro de estado)
; 
; 2. Al escribir en HS_DATA, el Handshake automáticamente:
;    - Genera un pulso en la línea strobe
;    - La impresora procesa el carácter
;    - Cuando termina, pone busy = 0 y se genera nueva interrupción
;
; 3. El programa principal solo inicializa y espera, toda la lógica de 
;    impresión está en la rutina de interrupción
;
; 4. La variable 'restantes' permite al programa principal saber cuándo
;    ha terminado la impresión completa
; ===============================================================================
```
---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
