; Test de INT 6 - Lectura de carácter del teclado
; Este programa lee un carácter del teclado usando INT 6
; y lo guarda en la dirección de memoria 50h

org 20h

; Configurar BX para que apunte a la dirección donde guardar el carácter
mov BX, 50h

; Llamar a INT 6 para leer un carácter del teclado
int 6

; Detener la ejecución
hlt

end
