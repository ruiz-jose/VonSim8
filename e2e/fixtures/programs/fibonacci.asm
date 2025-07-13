; Programa Fibonacci para tests avanzados

; Calcula los primeros 10 números de Fibonacci
mov al, 0      ; F(0) = 0
mov bl, 1      ; F(1) = 1
mov cl, 10     ; Contador: 10 números
mov dl, 0      ; Índice actual

loop:
    ; Guardar F(n) en memoria
    mov [dl], al
    
    ; Calcular siguiente número: F(n+1) = F(n) + F(n-1)
    mov ah, al     ; Guardar F(n) temporalmente
    add al, bl     ; F(n+1) = F(n) + F(n-1)
    mov bl, ah     ; F(n-1) = F(n) anterior
    
    inc dl         ; Incrementar índice
    dec cl         ; Decrementar contador
    jnz loop       ; Si contador > 0, continuar
    
    hlt            ; Parar 