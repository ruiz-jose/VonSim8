// Ejemplos de programas para VonSim
export const ejemplos = [
  {
    nombre: "Sumador simple",
    filename: "sumador.asm",
    contenido: `; Ejemplo: Sumador simple z = x + y\nx DB 3\ny DB 2\nz DB 0\nMOV AL, x\nADD AL, y\nMOV z, AL\nHLT`,
  },
  {
    nombre: "Sumar Si Iguales",
    filename: "sumarsiiguales.asm",
    contenido: `; Ejemplo: Sumar Si Iguales x = y\nx DB 1\ny DB 2\nz DB 0\n         MOV AL, x\n         SUB AL, y\n         JZ EsIgual\n         JMP Fin\nEsIgual: MOV DL, x\n         ADD y, DL\nFin:     HLT`,
  },
  {
    nombre: "Sumar Si Menor",
    filename: "sumarsimenor.asm",
    contenido: `; Ejemplo: Sumar Si Menor\nx DB 2\ny DB 3\nz DB 0\n          MOV AL, x\n          CMP AL, y\n          JC EsMenor\n          JMP Fin\nEsMenor:  ADD AL, y\n          MOV z, AL\nFin:      HLT`,
  },
  {
    nombre: "Bucle con Condición",
    filename: "bucle_condicion.asm",
    contenido: `; Ejemplo: Bucle que suma números del 1 al 9\nx     db 1\nsuma  DB 0\nCondicion:  CMP x, 10\n            JC Bucle\n            JMP FinBucle\nBucle:      MOV BL, x\n            ADD suma, BL\n            ADD x, 1\n            JMP Condicion\nFinBucle:   hlt`,
  },
  {
    nombre: "Máximo en Vector",
    filename: "maximo_vector.asm",
    contenido: `; Ejemplo: Encontrar el máximo en un vector\nmax     DB 0\nvector  DB 5, 2, 10, 4, 5, 0, 4, 8, 1, 9\n            MOV CL, 0\n            MOV BL, OFFSET vector\nCondicion:  CMP CL, 10\n            JC Bucle\n            JMP FinBucle\nBucle:      MOV AL, [BL]\n            CMP AL, max\n            JC Proximo\n            MOV max, AL\nProximo:    ADD BL, 1\n            ADD CL, 1\n            JMP Condicion\nFinBucle:   HLT`,
  },
  {
    nombre: "Hola Mundo",
    filename: "holamundo.asm",
    contenido: `; Ejemplo: Hola Mundo\ncadena DB "Hola!"\nMOV BL, OFFSET cadena\nMOV AL, 5\nINT 7\nHLT`,
  },
  {
    nombre: "Ingresar Carácter",
    filename: "ingresar_caracter.asm",
    contenido: `; Ejemplo: Ingresar un carácter por teclado\ncar DB 0\nMOV BL, OFFSET car\nINT 6\nHLT`,
  },
  {
    nombre: "Control de LEDs",
    filename: "control_leds.asm",
    contenido: `; Enciende las luces (una sí, una no): 1010 1010b\n; 31h = PB --> puerto de datos para las luces (LEDs)\n; 33h = CB --> puerto de control para las luces\n\n; Configura todos los bits de PB como salida para controlar las luces\nMOV AL, 0                ; 0000 0000b: todos los bits de PB en modo salida\nOUT 33h, AL              ; Escribe en CB para configurar PB como salida\n\n; Enciende las luces alternadas: 1010 1010b (170 decimal)\nMOV AL, 170              ; 1010 1010b: enciende LEDs pares, apaga impares\nOUT 31h, AL              ; Escribe el valor en PB para actualizar las luces\n\nHLT`,
  },
  {
    nombre: "Leer Contraseña",
    filename: "leer_contrasena.asm",
    contenido: `; Leer el valor de las llaves como contraseña hasta que el usuario la adivine
; Contraseña: 00001111b = 15 decimal (llaves 0-3 encendidas)
; Cuando se acierta, se encienden todos los LEDs como confirmación
clave DB 15               ; Contraseña esperada: 00001111b

; Configurar PB como salida (LEDs) y PA como entrada (llaves)
MOV AL, 0                 ; 00000000b: todos los bits de PB como salida
OUT 33h, AL               ; Escribe en CB para configurar PB
MOV AL, 255               ; 11111111b: todos los bits de PA como entrada
OUT 32h, AL               ; Escribe en CA para configurar PA

bucle:
    IN AL, 30h            ; Lee el valor actual de las llaves desde PA
    CMP AL, clave         ; Compara con la contraseña (15)
    JZ correcto           ; Si coincide, salta a correcto
    JMP bucle             ; Si no coincide, vuelve a intentar

correcto:
    MOV AL, 255           ; 11111111b: enciende todos los LEDs
    OUT 31h, AL           ; Escribe en PB para encender LEDs
    HLT`,
  },
  {
    nombre: "Impresora con sondeo",
    filename: "impresora_sondeo.asm",
    contenido: `; Imprime el string "Hola" en la impresora usando sondeo

dato DB "Hola", 0         ; String a imprimir, terminado en 0 (carácter nulo)

HS_DATA   EQU 40h         ; Dirección del registro de datos del Handshake
HS_STATUS EQU 41h         ; Dirección del registro de estado del Handshake

; --- Deshabilita las interrupciones del Handshake (bit 7 en 0) ---
IN  AL, HS_STATUS
AND AL, 01111111b         ; Fuerza el bit 7 a 0 (sin interrupciones)
OUT HS_STATUS, AL

; --- Inicializa el puntero al string ---
MOV BL, OFFSET dato       ; BL apunta al primer carácter del string

; --- Bucle principal: espera espacio en el buffer e imprime ---
Sondeo:
    IN  AL, HS_STATUS
    AND AL, 00000001b     ; Lee el flag busy (bit 0): 1=lleno, 0=libre
    JZ  ImprimirCadena   ; Si busy=0, hay espacio y puede imprimir
    JMP Sondeo            ; Si busy=1, espera hasta que haya espacio

ImprimirCadena:
    MOV AL, [BL]          ; Carga el siguiente carácter del string
    CMP AL, 0             ; ¿Es el final del string? (carácter nulo)
    JZ fin                ; Si sí, termina el programa

    OUT HS_DATA, AL       ; Envía el carácter al registro de datos del Handshake

    INC BL                ; Avanza al siguiente carácter del string
    JMP Sondeo            ; Repite el proceso para el próximo carácter

fin:
    HLT                   ; Detiene la ejecución`,
  },
  {
    nombre: "Impresora por interrupción",
    filename: "impresora_interrupcion.asm",
    contenido: `; ===============================================================================
; PROGRAMA: Impresión de string usando Handshake con interrupciones
; DESCRIPCIÓN: Imprime el string "hola" en la impresora utilizando el módulo
;              Handshake con interrupciones por hardware (IRQ2)
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
IRQ2        EQU 26h        ; Puerto para configurar la línea IRQ2
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

; 3.1) Configurar máscara de interrupciones - Solo habilitar IRQ2
mov al, 11111011b         ; Máscara: habilita solo IRQ2 (bit 2=0), resto deshabilitado
out IMR, al               ; Aplicar máscara al PIC

; 3.2) Asignar ID de interrupción a la línea IRQ2
mov al, ID                ; Cargar ID de interrupción (2)
out IRQ2, al              ; Configurar línea IRQ2 con este ID

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
; RUTINA DE INTERRUPCIÓN IRQ2 - HANDSHAKE
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
    iret                  ; Retorno de interrupción`,
  },
  {
    nombre: "Contador Press",
    filename: "contador_press.asm",
    contenido: `; Programa: Contador de pulsaciones de cualquier tecla usando interrupciones

;-----------------------------------------------
; 1) Definiciones y variables
;-----------------------------------------------

cantidad db 0          ; Variable: almacena la cantidad de veces que se presionó una tecla

ID   EQU 1             ; ID de la interrupción de teclado (puede ser 0-7)
IMR  EQU 21h           ; Dirección del registro IMR (máscara de interrupciones)
EOI  EQU 20h           ; Dirección para enviar End Of Interrupt al PIC
IRQ1 EQU 25h           ; Dirección para configurar la línea IRQ1 (teclado)

;-----------------------------------------------
; 2) Inicialización del PIC y vector de interrupción
;-----------------------------------------------

; 2.1) Habilitar solo la interrupción de teclado (IRQ1)
mov al, 11111101b      ; Habilita solo IRQ1 (bit 1 en 0), el resto deshabilitado
out IMR, al

; 2.2) Configurar el ID de la interrupción para IRQ1
mov al, ID             ; Cargar el ID elegido para teclado
out IRQ1, al

; 2.3) Asociar el vector de interrupción con la subrutina atenderPress
mov bl, ID             ; BL = ID de la interrupción
mov [bl], atenderPress ; Vector de interrupción: dirección de la rutina

;-----------------------------------------------
; 3) Bucle principal (espera activa)
;-----------------------------------------------

loop: jmp loop         ; Espera indefinida (el programa queda esperando interrupciones)

hlt                    ; (Opcional) Detiene la CPU si sale del bucle

;-----------------------------------------------
; 4) Rutina de atención de la interrupción de teclado
;-----------------------------------------------

org 50h                ; Dirección de la subrutina de atención

atenderPress:
    inc cantidad       ; Incrementa el contador cada vez que se presiona una tecla
    mov al, 20h        ; Código de End Of Interrupt (EOI)
    out EOI, al        ; Notifica al PIC que terminó la atención
    iret               ; Retorna de la interrupción`,
  },
  {
    nombre: "Timer con mensaje",
    filename: "timer_mensaje.asm",
    contenido: `; Programa: Imprime "Hola" a los 10 segundos de iniciado y luego termina.
; Utiliza la interrupción del TIMER (ID = 1).

mensaje db "hola"        ; Mensaje a imprimir
imprimio db 0            ; Flag para saber si ya imprimió

; Definición de direcciones de registros de dispositivos
CONT equ 10h             ; Registro de conteo del timer
COMP equ 11h             ; Registro de comparación del timer

EOI  equ 20h             ; End Of Interrupt (para PIC)
IMR  equ 21h             ; Interrupt Mask Register (PIC)
IRQ0 equ 24h             ; Registro de vector de interrupción 0
ID   equ 0               ; ID de la interrupción para el timer (puede ser 0-7)

; --- Habilitar interrupciones del timer ---
; IMR = 1111 1110b (solo habilita interrupciones del timer)
mov al, 11111110b        ; Habilita interrupciones del timer (bit 0 en 0)
out IMR, al

; --- Configurar vector de interrupción del timer ---
mov al, ID               ; ID de interrupción del timer
out IRQ0, al             ; Asigna rutina de atención a la posición ID

; --- Instalar rutina de interrupción en el vector ---
mov bl, ID               ; Vector de interrupción ID
mov [bl], imp_msj        ; Apunta a la rutina imp_msj

; --- Configurar timer para 3 segundos ---
mov al, 10                ; Valor de comparación (10 segundos)
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
         iret                  ; Retorna de la interrupción`,
  },
];
