# Lenguaje ensamblador

El lenguaje ensamblador (o lenguaje _assembly_) utilizado por el simulador se escribe de la siguiente manera:

```vonsim
; Este es un comentario
; Empieza con un punto y coma y termina al final de la línea

; Todas las directivas y mnemónicos se pueden escribir en mayúsculas
; o minúsculas (MOV o mov).


db 24     ; DB es la directiva para escribir un byte en memoria.
          ; En este caso, se escribe el byte 24.

db 7  ; Dirección sin etiqueta 

etq db 7  ; 'etq' es una etiqueta. Se utiliza para referenciar una dirección
          ; de memoria.

x db 24h    ; Los números hexadecimales se escriben con un sufijo h.
          ; En este caso, se escribe el byte 24h (36).

y db 10b    ; Los números binarios se escriben con un sufijo b.
          ; En este caso, se escribe el byte 10b (2) .

z db '0'    ; Los caracteres se escriben entre comillas simples.
          ; En este caso, se escribe el byte 30h (48).

db ?      ; El símbolo ? indica que el valor del byte es desconocido. En
          ; este caso, no se escribe nada la dirección.

str db "Hola, Mundo!" ; También se pueden escribir cadenas de texto en ASCII,
                      ; (H=48h, o=6Fh, l=6Ch, a=61h, ...). En este caso, se
                      ; guardará la cadena.

v db 1, 2, 3, 4 ; Se pueden escribir varios bytes en una misma línea.

cinco equ 5 ; EQU es la directiva de equivalencia. Se utiliza para definir
            ; constantes. En este caso, se define la constante 'cinco' con
            ; el valor 5. No se reserva memoria para esta constante.


;Los datos se cargan en memoria despues del código.

mov al, bl ; Las instrucciones se escriben con mnemónicos. En este caso, se
           ; copia el contenido del registro BL en el registro AL.
           ; Los operandos van separados por coma.

inst: mov al, 5 ; Las etiquetas se pueden utilizar para referenciar una
                ; instrucción. La etiqueta 'inst' se puede utilizar para
                ; referenciar la ubicación en memoria de este MOV.

jmp inst        ; Aquí se salta a la dirección 'inst'.

hlt
; La instrucción HLT indica a la CPU que debe detenerse
```

## Operandos

Las instrucciones pueden recibir varios tipos de operandos.

### Registros

Los registros accesibles por el usuario de 8 bits son `AL`, `BL`, `CL` y `DL`. 

### Direcciones de memoria

Las direcciones de memoria se pueden expresar de varias formas:

```vonsim
; [12h] ; Dirección de memoria directa
; [bl]    ; Dirección de memoria indirecta
mov al, [12h]
mov al, [bl]
```

En el primer caso, se accede directamente a la dirección de memoria `12h`. En el segundo caso, se accede a la dirección de memoria almacenada en `BL`. Para el modo de direccionamiento indirecto solo se puede utilizar el registro `BL`.


### Valores inmediatos

Los valores inmediatos son valores que se pueden determinar al momento de ensamblar el programa. Por ejemplo, en `mov al, 5` se sabe que se debe copiar el número `5` en `AL`, por lo que el número `5` es un valor inmediato que se almacena en memoria. En cambio, en `mov al, [bl]` no se sabe qué valor se debe copiar en `AL`, ya que depende del contenido de `BL`. Por lo tanto, `[bl]` no es un valor inmediato.

Estos valores inmediatos son números, que se pueden escribir de la siguiente forma:

```vonsim
24      ; Decimal
18h     ; Hexadecimal
11000b  ; Binario
'0'     ; Carácter ASCII

F0h    ; Si el número empieza con una letra,
        ; se debe escribir un 0 antes.

13 + 8h       ; Operaciones aritméticas
13 * (7 - 2)
'A' + 5

cinco   ; Constantes definidas con la directiva EQU y etiquetas a instrucciones
offset etq ; Dirección de memoria de la etiqueta 'etq'
```

Tantos los caracteres (`'a'`) como las cadenas de texto (`"texto"`) se convierten a su valor ASCII según la [tabla ASCII utilizada por VonSim](../reference/ascii).

