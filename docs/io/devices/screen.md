# Pantalla

La pantalla es un dispositivo de salida que permite mostrar caracteres. La forma de comunicarse con la pantalla es mediante una [llamada al sistema](../../computer/cpu#llamadas-al-sistema). Esto es así por simplicidad, ya que una pantalla real es mucho más compleja.

Con la llamada `INT 7` se escribe una cadena de caracteres en la pantalla. Recibe dos parámetros:

- `AL`: longitud de la cadena a imprimir
- `BL`: dirección de memoria donde empieza la cadena

```vonsim
org 10h
cadena db "Hola!"

org 20h
mov BL, offset cadena
mov AL, 5
int 7
; Se imprime "Hola!" (sin las comillas) en la pantalla.
hlt
```

Hay tres caracteres especiales:

- el carácter de retroceso (`BS`, 8 en decimal) borra el carácter previo;
- el carácter de salto de línea (`LF`, 10 en decimal) imprime, en efecto, un salto de línea — útil para no imprimir todo en una sola línea;
- el carácter de _form feed_ (`FF`, 12 en decimal) limpia la pantalla.
