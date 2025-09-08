# Impresora

El simulador cuenta con una impresora con un puerto paralelo tipo _Centronics_. Esta cuenta con papel y un _buffer_.

Esta impresora recibe un carácter por vez, y lo imprime en el papel. Como la impresora es lenta, el carácter no se imprime inmediatamente, sino que se almacena en un _buffer_ interno. Cuando la impresora termina de imprimir un carácter, imprime el siguiente, y así sucesivamente hasta que el _buffer_ se vacíe.

El tiempo que tarda la impresora en imprimir un carácter es configurable.

Si el _buffer_ se encuentra lleno y aún así se envía un carácter, este se pierde. Para evitar eso, la impresora provee el flag _busy_: cuando es `1`, el _buffer_ está lleno.

Cada vez que se envía un carácter, si el _buffer_ no está lleno, el flag _busy_ se pone en `1`. Luego, si el _buffer_ se llenó, este quedará en `1` hasta que se imprima algún carácter. De lo contrario, ni bien se agrege el carácter al _buffer_, el flag _busy_ volverá a `0`.


## Imprimir con Handshake

A diferencia del PIO, el [Handshake](../modules/handshake) es un módulo diseñado específicamente para las impresoras Centronics.

Con el Handshake no hay que preocuparse por el _strobe_, ya que este automatiza el flanco ascendente. Así, para imprimir basta con

1. verificar que el _buffer_ no esté lleno (flag _busy_),
2. escribir el carácter en el registro de datos.

Más información sobre el Handshake y sus funcionalidades [aquí](../modules/handshake).

## Caracteres especiales

Además de los caracteres ASCII comunes, hay otros dos que pueden resultar útiles:

- el carácter de salto de línea (`LF`, 10 en decimal) imprime, en efecto, un salto de línea — útil para no imprimir todo en una sola línea;
- el carácter de _form feed_ (`FF`, 12 en decimal) limpia la impresora (dicho de otra forma, arranca la hoja).


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

Más información sobre el Handshake y sus funcionalidades [aquí](/VonSim8/docs/io/modules/handshake).

## Caracteres especiales

Además de los caracteres ASCII comunes, hay otros dos que pueden resultar útiles:

- el carácter de salto de línea (`LF`, 10 en decimal) imprime, en efecto, un salto de línea — útil para no imprimir todo en una sola línea;
- el carácter de _form feed_ (`FF`, 12 en decimal) limpia la impresora (dicho de otra forma, arranca la hoja).
