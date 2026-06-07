# Llaves y luces

Las llaves o interruptores están conectados al puerto `PA`/`CA` del [PIO](../modules/pio) y son dispositivos de entrada. Al cambiar su estado, estos se reflejarán en `PA` (si el PIO está configurado correctamente). Si se altera `PA`, los cambios no se verán reflejados en las llaves (no se mueven solas, por así decirlo).


```vonsim
; Leer el valor de las llaves como una contraseña hasta que el usuario la adivine

clave db 15               ; Contraseña esperada: 00001111 (en decimal 15)
mensaje_ok db "Bienvenido!" ; Mensaje a mostrar si la contraseña es correcta

; Configurar PB como salida (LEDs) y PA como entrada (llaves)
MOV AL, 0                 ; 00000000b: todos los bits de PB como salida
OUT 33h, AL               ; Escribe en CB para configurar PB
MOV AL, 255               ; 11111111b: todos los bits de PA como entrada
OUT 32h, AL               ; Escribe en CA para configurar PA

bucle:
    in al, 30h            ; Lee el valor actual de las llaves desde PA
    cmp al, clave         ; Compara el valor leído con la contraseña
    jz Mostrar_Mensaje    ; Si coincide, salta a Mostrar_Mensaje
    jmp bucle             ; Si no coincide, vuelve a intentar

Mostrar_Mensaje:
    mov bl, offset mensaje_ok ; BL apunta al mensaje de éxito
    mov al, 11                ; Longitud del mensaje ("Bienvenido!" tiene 11 caracteres)
    int 7
    hlt                       ; Detiene la ejecución del programa

```

Las luces o LED están conectadas al puerto `PB`/`CB` del [PIO](../modules/pio) y son dispositivos de salida. La única forma de cambiar su estado es modificando `PB`. Estos cambios se reflejarán en las luces si el PIO está configurado correctamente, de lo contrario, las luces se verán apagadas.


```vonsim
; Enciende las luces (una sí, una no): 1010 1010b
; 31h = PB --> puerto de datos para las luces (LEDs)
; 33h = CB --> puerto de control para las luces

; Configura todos los bits de PB como salida para controlar las luces
mov al, 0                ; 0000 0000b: todos los bits de PB en modo salida
out 33h, al              ; Escribe en CB para configurar PB como salida

; Enciende las luces alternadas: 1010 1010b (170 decimal)
mov al, 170              ; 1010 1010b: enciende LEDs pares, apaga impares
out 31h, al              ; Escribe el valor en PB para actualizar las luces

hlt                      ; Detiene la ejecución del programa
```
