; =============================================================================
; CONTADOR DE VOCALES - Versión corregida
; =============================================================================
; Resultado: DL contiene las vocales de "Piruleta." = 4
; Las vocales son: i, u, e, a (el punto no es vocal)
; =============================================================================

               ORG 20h
               MOV BL, OFFSET texto        ; BL = puntero al texto
               MOV CL, 9                   ; CL = longitud del texto
               MOV DL, 0                   ; DL = contador de vocales
               CALL CONTAR_VOCALES
               HLT

               ORG 40h
vocales        DB "AEIOUaeiou"            ; Tabla de vocales
texto          DB "Piruleta."             ; Texto a analizar

               ORG 80h
; Entrada: AL = carácter, Salida: ZF=1 si vocal
ES_VOCAL:      PUSH BL
               MOV BL, OFFSET vocales      ; BL = inicio tabla vocales
               MOV CH, 10                  ; CH = 10 vocales
ES_VOCAL_LOOP: CMP AL, [BL]                ; ¿Es esta vocal?
               JZ ES_VOCAL_ENCONTRADA      ; Sí -> vocal encontrada
               INC BL                      ; Siguiente vocal
               DEC CH                      ; Contador--
               JNZ ES_VOCAL_LOOP           ; Continuar si quedan vocales
               
               ; No es vocal
               POP BL                      ; Restaurar BL
               OR AL, 1                    ; Limpiar ZF (ZF=0)
               RET
               
ES_VOCAL_ENCONTRADA:
               POP BL                      ; Restaurar BL
               CMP AL, AL                  ; Establecer ZF=1 (vocal encontrada)
               RET

; Entrada: BL=texto, CL=longitud, DL=contador
CONTAR_VOCALES:
               CMP CL, 0                   ; ¿Quedan caracteres?
               JZ CONTAR_FIN               ; No -> terminar
               
               MOV AL, [BL]                ; AL = carácter actual
               CALL ES_VOCAL               ; ¿Es vocal?
               JNZ NO_VOCAL                ; No -> saltar incremento
               INC DL                      ; Sí -> contar vocal
               
NO_VOCAL:      INC BL                      ; Siguiente carácter
               DEC CL                      ; Longitud--
               JMP CONTAR_VOCALES          ; Continuar
               
CONTAR_FIN:    RET