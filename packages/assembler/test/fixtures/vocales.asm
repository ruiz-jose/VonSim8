; =============================================================================
; CONTADOR DE VOCALES - Versión corregida
; =============================================================================
; Resultado: DL contiene las vocales de "Piruleta." = 4
; Las vocales son: i, u, e, a (el punto no es vocal)
; =============================================================================

               ORG 20h
               MOV BL, OFFSET Texto        ; BL = puntero al texto
               MOV CL, 9                   ; CL = longitud del texto
               MOV DL, 0                   ; DL = contador de vocales
               CALL Contar_vocales
               HLT

               ORG 40h
Vocales        DB "AEIOUaeiou"            ; Tabla de vocales
Texto          DB "Piruleta."             ; Texto a analizar

               ORG 80h
; Entrada: AL = carácter, Salida: ZF=1 si vocal
Es_vocal:      PUSH BL
               MOV BL, OFFSET Vocales      ; BL = inicio tabla vocales
               MOV CH, 10                  ; CH = 10 vocales
Es_vocal_loop: CMP AL, [BL]                ; ¿Es esta vocal?
               JZ Es_vocal_encontrada      ; Sí -> vocal encontrada
               INC BL                      ; Siguiente vocal
               DEC CH                      ; Contador--
               JNZ Es_vocal_loop           ; Continuar si quedan vocales
               
               ; No es vocal
               POP BL                      ; Restaurar BL
               OR AL, 1                    ; Limpiar ZF (ZF=0)
               RET
               
Es_vocal_encontrada:
               POP BL                      ; Restaurar BL
               CMP AL, AL                  ; Establecer ZF=1 (vocal encontrada)
               RET

; Entrada: BL=texto, CL=longitud, DL=contador
Contar_vocales:
               CMP CL, 0                   ; ¿Quedan caracteres?
               JZ Contar_fin               ; No -> terminar
               
               MOV AL, [BL]                ; AL = carácter actual
               CALL Es_vocal               ; ¿Es vocal?
               JNZ No_vocal                ; No -> saltar incremento
               INC DL                      ; Sí -> contar vocal
               
No_vocal:      INC BL                      ; Siguiente carácter
               DEC CL                      ; Longitud--
               JMP Contar_vocales          ; Continuar
               
Contar_fin:    RET