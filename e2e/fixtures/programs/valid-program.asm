; Programa de ejemplo válido para tests E2E

; Programa simple que suma dos números
lda num1      ; Cargar primer número
add num2      ; Sumar segundo número
sta result    ; Guardar resultado
hlt           ; Parar

; Datos
num1:   db 5      ; Primer número
num2:   db 3      ; Segundo número
result: db 0      ; Resultado 