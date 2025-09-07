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
    contenido: `; Leer el valor de interruptores como una contraseña hasta que el usuario la adivine
clave DB 15               ; Contraseña esperada: 00001111 (en decimal 15)
mensaje_ok DB "Bienvenido!" ; Mensaje a mostrar si la contraseña es correcta

; Configurar PA (Puerto A) como entrada
MOV AL, 15                ; 00001111b: configura los primeros 4 bits de PA como entrada
OUT 32h, AL               ; Escribe en CA para configurar PA

bucle:
    IN AL, 30h            ; Lee el valor actual de las llaves desde PA
    CMP AL, clave         ; Compara el valor leído con la contraseña
    JZ Mostrar_Mensaje    ; Si coincide, salta a Mostrar_Mensaje
    JMP bucle             ; Si no coincide, vuelve a intentar

Mostrar_Mensaje:
    MOV BL, OFFSET mensaje_ok ; BL apunta al mensaje de éxito
    MOV AL, 11                ; Longitud del mensaje (Bienvenido! tiene 11 caracteres)
    INT 7
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
    iret                  ; Retorno de interrupción`,
  },
];
