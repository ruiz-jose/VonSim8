# Teclado

El teclado es un dispositivo de entrada que permite al usuario ingresar caracteres al sistema. La forma de comunicarse con el teclado es mediante una [llamada al sistema](../../computer/cpu#llamadas-al-sistema). Esto es así por simplicidad, ya que un teclado real es mucho más complejo.

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
