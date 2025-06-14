---
title: Teclado
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/io/devices/keyboard.png }
---

El teclado es un dispositivo de entrada que permite al usuario ingresar caracteres al sistema. La forma de comunicarse con el teclado es mediante una [llamada al sistema](/VonSim8/docs/cpu/#llamadas-al-sistema). Esto es así por simplicidad, ya que un teclado real es mucho más complejo.

Con la llamada `INT 6` se detiene la ejecución del código hasta que se presione una tecla en el teclado. El carácter que correspona será guardado en la dirección de memoria almacenada en `BL` según su representación en ASCII.

```vonsim
org 10h
car db 0

org 20h
mov bl, offset car
int 6
; El usuario escribe un carácter
hlt

; El carácter escrito se almacenó en 'car'.
; Por ejemplo, si el usuario presionó la tecla 'a', entonces
; se almacena el valor 61h en 'car'.
```

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
