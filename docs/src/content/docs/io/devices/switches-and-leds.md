---
title: Llaves y luces
head:
  - tag: meta
    attrs:
      {
        property: og:image,
        content: https://vonsim.github.io/VonSim8/docs/og/io/devices/switches-and-leds.png,
      }
---

Las llaves o interruptores están conectados al puerto `PA`/`CA` del [PIO](/VonSim8/docs/io/modules/pio/) y son dispositivos de entrada. Al cambiar su estado, estos se reflejarán en `PA` (si el PIO está configurado correctamente). Si se altera `PA`, los cambios no se verán reflejados en las llaves (no se mueven solas, por así decirlo).

```vonsim
; Leer el valor de las llaves como una contraseña hasta que el usuario la adivine

clave db 15               ; Contraseña esperada: 00001111
mensaje_ok db "Bienvenido!"

; Configurar PA (Puerto A) como entrada
mov al, 15                ; 00001111b → primeros 4 bits del puerto PA en modo entrada
out 32h, al               ; CA controla PA

bucle:      in al, 30h            ; Leer el valor actual de las llaves
    	      cmp al, clave         ; Comparar con la contraseña
            jz Mostrar_Mensaje
            jmp bucle             ; Volver a intentar si no coincide

Mostrar_Mensaje:      mov bl, offset mensaje_ok
                      mov al, 11            ; Longitud del mensaje
                      hlt

```

Las luces o LED están conectadas al puerto `PB`/`CB` del [PIO](/VonSim8/docs/io/modules/pio/) y son dispositivos de salida. La única forma de cambiar su estado es modificando `PB`. Estos cambios se reflejarán en las luces si el PIO está configurado correctamente, de lo contrario, las luces se verán apagadas.

```vonsim
; Enciende las luces (una si una no): 1010 1010b
; 31h = PB --> puertos luces
; 33h = CB --> Control luces

org 20h
; 0000 0000b habilito todas las luces
mov al, 0 
out 33h, al

; enciendo una si una no= 170: 1010 1010b
mov al, 170
out 31h, al

hlt
```

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
