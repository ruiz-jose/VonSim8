; =============================================================================
; MULTIPLICACIÓN POR SUMAS SUCESIVAS
; =============================================================================
; Descripción: Multiplica dos números usando sumas repetidas (a × b)
; Algoritmo: Suma el valor 'a' exactamente 'b' veces
; Ejemplo: 25 × 4 = 25 + 25 + 25 + 25 = 100
; Entrada: Variables 'a' y 'b' definidas en memoria
; Salida: Resultado almacenado en variable 'res'
; Autor: VonSim8 - Simulador MSX88
; =============================================================================

; === ÁREA DE DATOS ===
               ORG 10h                     ; Inicio del área de datos
Multiplicando  DB 25                       ; Primer número (a multiplicar)
Multiplicador  DB 4                        ; Segundo número (veces a sumar)
Resultado      DB ?                        ; Variable para almacenar resultado

; === PROGRAMA PRINCIPAL ===
               ORG 20h                     ; Inicio del programa principal
Main:          MOV AL, 0                   ; AL = acumulador (resultado parcial)
               MOV BL, Multiplicador       ; BL = contador de iteraciones
               
; --- Verificar caso especial: multiplicación por cero ---
               CMP BL, 0                   ; ¿Multiplicador es cero?
               JZ Guardar_resultado        ; Sí → resultado es 0, terminar
               
; === BUCLE DE MULTIPLICACIÓN ===
; Algoritmo: Repetir 'b' veces la operación AL = AL + a
Bucle_suma:    ADD AL, Multiplicando       ; AL = AL + valor a multiplicar
               DEC BL                      ; Decrementar contador de iteraciones
               JNZ Bucle_suma              ; Si BL≠0 → continuar sumando
               
; === FINALIZACIÓN ===
Guardar_resultado:
               MOV Resultado, AL           ; Guardar resultado final en memoria
               HLT                         ; Detener ejecución del programa

; =============================================================================
; ANÁLISIS DEL ALGORITMO:
; - Inicialización: AL=0, BL=4
; - Iteración 1: AL = 0 + 25 = 25,  BL = 3
; - Iteración 2: AL = 25 + 25 = 50, BL = 2  
; - Iteración 3: AL = 50 + 25 = 75, BL = 1
; - Iteración 4: AL = 75 + 25 = 100, BL = 0
; - Resultado final: 100 (25 × 4)
; =============================================================================

; =============================================================================
; REGISTROS UTILIZADOS:
; - AL: Acumulador para el resultado parcial y final
; - BL: Contador de iteraciones (copia del multiplicador)
; 
; VARIABLES DE MEMORIA:
; - Multiplicando (10h): Número que se suma repetidamente
; - Multiplicador (11h): Número de veces que se suma
; - Resultado (12h): Producto final almacenado
; =============================================================================