; Test de escritura directa en 0xE5 para mostrar en pantalla
; Este programa escribe caracteres directamente en la dirección 0xE5
; y deberían aparecer automáticamente en la pantalla

org 2000h

; Escribir 'H' en pantalla
mov al, 'H'
mov [0E5h], al

; Escribir 'o' en pantalla
mov al, 'o'
mov [0E5h], al

; Escribir 'l' en pantalla
mov al, 'l'
mov [0E5h], al

; Escribir 'a' en pantalla
mov al, 'a'
mov [0E5h], al

; Escribir '!' en pantalla
mov al, '!'
mov [0E5h], al

; Fin del programa
hlt

end
