; Programa de prueba para INT 6 - Lectura de carácter del teclado
; Este programa demuestra la nueva funcionalidad de mostrar mensaje al usuario

car DB 0           ; Variable para almacenar el carácter ingresado

MOV BL, OFFSET car ; BL apunta a la dirección donde se guardará el carácter
INT 6              ; Llamada al sistema para leer un carácter del teclado
HLT                ; Detener la ejecución

; Cuando se ejecute INT 6, debería aparecer un mensaje al usuario
; indicando que debe ingresar un carácter por teclado
