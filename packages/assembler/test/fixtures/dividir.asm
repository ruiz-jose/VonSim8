; =============================================================================
; DIVISIÓN POR RESTAS SUCESIVAS 
; =============================================================================
; Descripción: Divide dos números usando restas repetidas (N ÷ M)
; Algoritmo: Resta el divisor del dividendo hasta que no sea posible
; Ejemplo: 255 ÷ 2 = Cociente: 127, Resto: 1
; Optimizaciones: Verificaciones tempranas, menos instrucciones, mejor flujo
; Entrada: Variables Dividendo y Divisor en memoria
; Salida: Resto en AL, Cociente en CL, ambos guardados en memoria
; =============================================================================

; === ÁREA DE DATOS ===
               ORG 10h                     ; Inicio del área de datos
Dividendo      DB 255                      ; Número a dividir (N)
Divisor        DB 2                        ; Número divisor (M)
Cociente       DB ?                        ; Variable para cociente (N÷M)
Resto          DB ?                        ; Variable para resto

; === PROGRAMA PRINCIPAL ===
               ORG 20h                     ; Programa principal
Main:          MOV AL, Dividendo           ; AL = dividendo (255)
               MOV BL, Divisor             ; BL = divisor (2)
               MOV CL, 0                   ; CL = cociente inicializado en 0
               
; --- 1: Verificaciones tempranas ---
               CMP BL, 0                   ; ¿División por cero?
               JZ Guardar_error            ; Sí → terminar con error
               
               CMP AL, BL                  ; ¿Dividendo < divisor?
               JC Guardar_resultados       ; Sí → cociente=0, resto=dividendo
               
; === BUCLE DE DIVISIÓN ===
; --- 2: comparación por iteración
Bucle_division: SUB AL, BL                 ; AL = AL - BL (restar divisor)
               INC CL                      ; CL++ (incrementar cociente)
               CMP AL, BL                  ; ¿Resto >= divisor?
               JC Guardar_resultados       ; No → terminar (AL < BL)
               JZ Resto_cero               ; Sí, pero AL = BL → división exacta
               JMP Bucle_division          ; Continuar división

; --- 3: Manejo directo de resto cero ---
Resto_cero:    SUB AL, BL                  ; Última resta: AL = 0
               INC CL                      ; CL++ (contar última operación)

; === FINALIZACIÓN OPTIMIZADA ===
Guardar_resultados:
               MOV Cociente, CL            ; Guardar cociente en memoria
               MOV Resto, AL               ; Guardar resto en memoria
               HLT                         ; Terminar programa

; --- Manejo de error optimizado ---
Guardar_error: MOV Cociente, 0FFh          ; Error: cociente = 255
               MOV Resto, 0FFh             ; Error: resto = 255
               HLT                         ; Terminar con error

; =============================================================================
; OPTIMIZACIONES IMPLEMENTADAS:
;
; 1. VERIFICACIONES TEMPRANAS:
;    - División por cero: Se detecta antes del bucle
;    - Dividendo < divisor: Se evita el bucle completamente
;
; 2. BUCLE SIMPLIFICADO:
;    - Una sola comparación por iteración (en lugar de dos)
;    - Operación SUB al inicio del bucle (más eficiente)
;    - Menos saltos condicionales
;
; 3. MANEJO DIRECTO DE CASOS ESPECIALES:
;    - Resto cero: Se maneja en 3 instrucciones
;    - Errores: Terminación inmediata sin bucles
;
; 4. REDUCCIÓN DE INSTRUCCIONES:
;    - Eliminadas instrucciones redundantes
;    - Flujo más directo y lineal
;    - Menos etiquetas y saltos
; =============================================================================

; =============================================================================
; ANÁLISIS DE RENDIMIENTO (255 ÷ 2):
;
; FLUJO OPTIMIZADO:
; - Inicialización: AL=255, BL=2, CL=0 (3 instrucciones)
; - Verificación temprana: 2 comparaciones (2 instrucciones)
; - Bucle: 127 × (SUB + INC + CMP + JMP) = 127 × 3 = 381 instrucciones
; - Finalización: 2 MOV + HLT = 3 instrucciones
; - Total: ~389 instrucciones vs ~513 en versión anterior
; =============================================================================

; =============================================================================
; CASOS DE PRUEBA:
;
; 1. División normal: 255 ÷ 2 = Cociente: 127, Resto: 1
; 2. División exacta: 100 ÷ 5 = Cociente: 20, Resto: 0
; 3. Dividendo menor: 3 ÷ 5 = Cociente: 0, Resto: 3
; 4. División por cero: X ÷ 0 = Error: 255, 255
; 5. División por uno: 255 ÷ 1 = Cociente: 255, Resto: 0
; =============================================================================

; =============================================================================
; REGISTROS Y VARIABLES:
; - AL: Dividendo inicial → Resto parcial → Resto final
; - BL: Divisor (constante durante toda la operación)
; - CL: Contador de restas realizadas (cociente final)
; - Memoria: Dividendo, Divisor (entrada) + Cociente, Resto (salida)
; =============================================================================