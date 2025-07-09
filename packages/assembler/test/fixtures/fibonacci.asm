; =============================================================================
; SECUENCIA DE FIBONACCI 
; =============================================================================
; Descripción: Calcula los primeros N números de la secuencia de Fibonacci
; Algoritmo: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2) para n≥2
; Secuencia: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233...
; Entrada: Constante N define cuántos números calcular
; Salida: Números almacenados consecutivamente desde dirección 10h
; =============================================================================

; === ÁREA DE DATOS ===
               ORG 10h                     ; Inicio del área de datos (dirección base)
Fibonacci      DB 0, 1                     ; F(0)=0, F(1)=1 (valores iniciales)
               DB 0,0,0,0,0,0,0,0          ; Espacio para F(2) hasta F(9)
N              EQU 10                      ; Cantidad de números a calcular

; === PROGRAMA PRINCIPAL ===
               ORG 20h                     ; Inicio del programa principal
Main:          MOV BL, 12h                 ; BL = dirección de F(2) (10h + 2)
               MOV AL, 0                   ; AL = F(n-2) valor anterior (F(0))
               MOV DL, 1                   ; DL = F(n-1) valor actual (F(1))
               MOV CH, 2                   ; CH = contador de posición actual
               
; --- Verificación de casos especiales ---
               CMP CH, N                   ; ¿Ya calculamos todos los números?
               JC Bucle_fibonacci          ; No → continuar cálculo (CH < N)
               JZ Fin_programa             ; Sí → terminar (CH = N)
               JMP Fin_programa            ; Fallback → terminar

; === BUCLE PRINCIPAL DE FIBONACCI ===
; Algoritmo: Para cada posición, F(n) = F(n-1) + F(n-2)
Bucle_fibonacci:
; --- Calcular siguiente número ---
               MOV CL, DL                  ; CL = F(n-1) (valor actual)
               ADD CL, AL                  ; CL = F(n-1) + F(n-2) = F(n)
               
; --- Verificar overflow ---
               JC Overflow_error           ; Si hay carry → número muy grande
               
; --- Almacenar resultado usando [BL] directo ---
               MOV [BL], CL                ; Guardar F(n) en memoria [BL]
               
; --- Actualizar valores para siguiente iteración ---
               MOV AL, DL                  ; AL = F(n-1) (nuevo valor anterior)
               MOV DL, CL                  ; DL = F(n) (nuevo valor actual)
               INC BL                      ; BL++ (siguiente dirección de memoria)
               INC CH                      ; CH++ (siguiente posición en secuencia)
               
; --- Verificar condición de terminación ---
               CMP CH, N                   ; ¿CH >= N?
               JC Bucle_fibonacci          ; No → continuar (CH < N)
               JZ Fin_programa             ; Sí → terminar (CH = N)
               JMP Fin_programa            ; Fallback → terminar

; === MANEJO DE ERROR ===
Overflow_error: MOV [BL], 0FFh             ; Marcar error con 255 en [BL]
               JMP Fin_programa            ; Terminar programa

; === FINALIZACIÓN ===
Fin_programa:  HLT                         ; Detener ejecución

; =============================================================================
; ANÁLISIS DE DIRECCIONES DE MEMORIA:
;
; Posición  | Dirección | Cálculo         | Valor | BL apunta a
; ----------|-----------|-----------------|-------|-------------
; F(0)      | 10h       | Inicial         | 0     | Pre-definido
; F(1)      | 11h       | Inicial         | 1     | Pre-definido  
; F(2)      | 12h       | 0 + 1           | 1     | BL = 12h
; F(3)      | 13h       | 1 + 1           | 2     | BL = 13h
; F(4)      | 14h       | 1 + 2           | 3     | BL = 14h
; F(5)      | 15h       | 2 + 3           | 5     | BL = 15h
; F(6)      | 16h       | 3 + 5           | 8     | BL = 16h
; F(7)      | 17h       | 5 + 8           | 13    | BL = 17h
; F(8)      | 18h       | 8 + 13          | 21    | BL = 18h
; F(9)      | 19h       | 13 + 21         | 34    | BL = 19h
; =============================================================================

; =============================================================================
; COMPATIBILIDAD CON VONSIM8:
;
; MODO DE DIRECCIONAMIENTO DIRECTO [BL]:
; - Usar [BL] directamente sin desplazamientos
; - BL contiene la dirección exacta de memoria
; - Inicializar BL con la dirección base + offset
; - Incrementar BL para avanzar a la siguiente posición
;
; GESTIÓN DE DIRECCIONES:
; - Área de datos inicia en 10h
; - F(0) en 10h, F(1) en 11h (pre-definidos)
; - F(2) en 12h, F(3) en 13h, etc. (calculados)
; - BL se inicializa en 12h y se incrementa cada iteración
; =============================================================================

; =============================================================================
; REGISTROS UTILIZADOS:
;
; - AL: Valor F(n-2) anterior para el cálculo
; - DL: Valor F(n-1) actual para el cálculo  
; - CL: Valor F(n) calculado (resultado temporal)
; - BL: Dirección de memoria donde almacenar [BL]
; - CH: Contador de posición en la secuencia (2, 3, 4...)
;
; VENTAJAS DEL MODO [BL] DIRECTO:
; - Compatible con todas las versiones de VonSim8
; - Acceso directo a memoria sin cálculos de offset
; - Simplicidad en el direccionamiento
; - Mayor portabilidad del código
; =============================================================================

; =============================================================================
; CASOS DE PRUEBA Y VALIDACIÓN:
;
; 1. N=2: Solo F(0)=0, F(1)=1 (sin bucle)
; 2. N=5: 0,1,1,2,3 (bucle ejecuta 3 veces)
; 3. N=10: 0,1,1,2,3,5,8,13,21,34 (bucle ejecuta 8 veces)
; 4. Overflow: Si F(n) > 255, se marca con 0FFh en [BL]
; 5. Memoria: Resultados en 10h, 11h, 12h, 13h, 14h, 15h, 16h, 17h, 18h, 19h
; =============================================================================