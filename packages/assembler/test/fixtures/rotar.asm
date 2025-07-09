; =============================================================================
; ROTACIÓN DE BITS - VERSIÓN OPTIMIZADA
; =============================================================================
; Descripción: Rota los bits de un número binario hacia la izquierda o derecha
; Algoritmo: Rotación circular de bits (el bit que sale por un lado entra por el otro)
; Ejemplo: 10000000b rotado 3 posiciones derecha = 00010000b
; Entrada: Número binario y cantidad de rotaciones en memoria
; Salida: Número rotado en AL
; Instrucciones de salto: Solo JZ, JC, JMP (sin JS, JNS, etc.)
; =============================================================================

; === ÁREA DE DATOS ===
               ORG 10h                     ; Inicio del área de datos
Numero_binario DB 10000000b               ; Número a rotar (128 decimal)
Cant_rotaciones DB 3                      ; Cantidad de rotaciones a realizar
Resultado      DB ?                       ; Variable para almacenar resultado

; === PROGRAMA PRINCIPAL ===
               ORG 20h                     ; Inicio del programa principal
Main:          MOV AL, Numero_binario      ; AL = número a rotar (10000000b)
               MOV CL, Cant_rotaciones     ; CL = cantidad de rotaciones (3)
               CALL Rotar_derecha          ; Llamar función de rotación derecha
               MOV Resultado, AL           ; Guardar resultado en memoria
               HLT                         ; Terminar programa

; === FUNCIONES DE ROTACIÓN ===
               ORG 30h                     ; Área de funciones

; === FUNCIÓN: ROTAR HACIA LA IZQUIERDA ===
; Propósito: Rota bits hacia la izquierda (MSB → LSB)
; Entrada: AL = número a rotar, CL = cantidad de rotaciones
; Salida: AL = número rotado
; Algoritmo: Para cada rotación, el bit más significativo pasa al menos significativo
Rotar_izquierda:
; --- Optimización: Si CL = 0, no hacer nada ---
               CMP CL, 0                   ; ¿Cantidad de rotaciones es cero?
               JZ Rotar_izq_fin            ; Sí → terminar sin rotar

; --- Bucle principal de rotación izquierda ---
Bucle_rotar_izq: 
               ADD AL, AL                  ; Desplazar bits izquierda (AL = AL × 2)
               JC Bit_alto_set             ; Si hay carry → bit 7 estaba en 1
               
; --- Bit alto era 0, continuar ---
               DEC CL                      ; CL-- (decrementar contador)
               JZ Rotar_izq_fin            ; Si CL = 0 → terminar
               JMP Bucle_rotar_izq         ; Continuar rotando

; --- Bit alto era 1, ponerlo en posición 0 ---
Bit_alto_set:  INC AL                      ; Poner bit 0 en 1 (rotar el carry)
               DEC CL                      ; CL-- (decrementar contador)
               JZ Rotar_izq_fin            ; Si CL = 0 → terminar
               JMP Bucle_rotar_izq         ; Continuar rotando

Rotar_izq_fin: RET                         ; Retornar con resultado en AL

; === FUNCIÓN: ROTAR HACIA LA DERECHA ===
; Propósito: Rota bits hacia la derecha usando rotación izquierda
; Entrada: AL = número a rotar, CL = cantidad de rotaciones
; Salida: AL = número rotado
; Algoritmo: Rotar derecha N = Rotar izquierda (8-N) para números de 8 bits
Rotar_derecha:
; --- Optimización: Normalizar rotaciones (0-7) ---
               CMP CL, 8                   ; ¿CL >= 8?
               JC Calcular_equivalente     ; No → continuar (CL < 8)
               
; --- Reducir rotaciones módulo 8 ---
Reducir_rotaciones:
               SUB CL, 8                   ; CL = CL - 8
               CMP CL, 8                   ; ¿CL >= 8?
               JC Calcular_equivalente     ; No → continuar (CL < 8)
               JMP Reducir_rotaciones      ; Sí → seguir reduciendo

; --- Convertir rotación derecha a izquierda equivalente ---
Calcular_equivalente:
               CMP CL, 0                   ; ¿CL = 0?
               JZ Rotar_der_fin            ; Sí → no rotar, terminar
               
               MOV BL, 8                   ; BL = 8 (total de bits)
               SUB BL, CL                  ; BL = 8 - CL (rotaciones izq. equiv.)
               MOV CL, BL                  ; CL = rotaciones equivalentes
               CALL Rotar_izquierda        ; Ejecutar rotación izquierda

Rotar_der_fin: RET                         ; Retornar con resultado en AL

; =============================================================================
; ANÁLISIS DEL EJEMPLO (10000000b rotado 3 posiciones derecha):
;
; Número inicial: 10000000b (128 decimal) - Solo el bit 7 está activado
;
; Paso 1: Convertir rotación derecha a izquierda equivalente
;         Rotar derecha 3 = Rotar izquierda (8-3) = Rotar izquierda 5
;
; Paso 2: Ejecutar 5 rotaciones izquierda:
;         Inicial:     1 0 0 0 0 0 0 0  (128 decimal)
;         Rotación 1:  0 0 0 0 0 0 0 1  (1 decimal)   - bit 7 → bit 0
;         Rotación 2:  0 0 0 0 0 0 1 0  (2 decimal)
;         Rotación 3:  0 0 0 0 0 1 0 0  (4 decimal)
;         Rotación 4:  0 0 0 0 1 0 0 0  (8 decimal)
;         Rotación 5:  0 0 0 1 0 0 0 0  (16 decimal)
;
; Resultado final: 00010000b (16 decimal)
;
; Verificación rotación derecha directa:
; 10000000b → 01000000b → 00100000b → 00010000b = 16 decimal ✓
; =============================================================================

; =============================================================================
; PATRÓN DE ROTACIÓN PARA 10000000b (128 decimal):
;
; Posiciones | Rotación Derecha | Binario      | Decimal
; -----------|------------------|--------------|--------
; 0          | Original         | 10000000b    | 128
; 1          | 1 derecha        | 01000000b    | 64
; 2          | 2 derecha        | 00100000b    | 32
; 3          | 3 derecha        | 00010000b    | 16  ← Ejemplo actual
; 4          | 4 derecha        | 00001000b    | 8
; 5          | 5 derecha        | 00000100b    | 4
; 6          | 6 derecha        | 00000010b    | 2
; 7          | 7 derecha        | 00000001b    | 1
; 8          | 8 derecha (0)    | 10000000b    | 128 (vuelta completa)
; =============================================================================

; =============================================================================
; CARACTERÍSTICAS ESPECIALES DEL NÚMERO 128 (10000000b):
;
; 1. POTENCIA DE 2: 128 = 2^7 (solo un bit activado)
; 2. BIT MÁS SIGNIFICATIVO: Ocupa la posición 7 (MSB)
; 3. ROTACIÓN LIMPIA: Cada rotación mueve el bit a la siguiente posición
; 4. PATRÓN PREDECIBLE: Resultado = 128 / (2^rotaciones_derecha)
; 5. VERIFICACIÓN FÁCIL: Visual y matemáticamente simple de comprobar
; =============================================================================

; =============================================================================
; INSTRUCCIONES DE SALTO UTILIZADAS:
;
; JZ (Jump if Zero):
; - Terminación de bucles: JZ cuando CL = 0 (contador llega a cero)
; - Casos especiales: JZ cuando no hay rotaciones que hacer
;
; JC (Jump if Carry):
; - Detección de bit alto: JC cuando ADD AL,AL genera carry (bit 7 = 1)
; - Comparaciones: JC cuando CL < 8 (sin carry en sustracción)
;
; JMP (Jump incondicional):
; - Continuación de bucles: JMP para repetir rotaciones
; - Control de flujo: JMP para saltar entre secciones
; - Bucles de reducción: JMP para normalizar rotaciones
; =============================================================================

; =============================================================================
; CASOS DE PRUEBA PARA 10000000b (128 decimal):
;
; 1. Rotación derecha 0: 10000000b → 10000000b (128, sin cambio)
; 2. Rotación derecha 1: 10000000b → 01000000b (64)
; 3. Rotación derecha 3: 10000000b → 00010000b (16, ejemplo actual)
; 4. Rotación derecha 7: 10000000b → 00000001b (1)
; 5. Rotación derecha 8: 10000000b → 10000000b (128, vuelta completa)
; 6. Rotación derecha 11: 10000000b → 00010000b (16, 11 mod 8 = 3)
; =============================================================================