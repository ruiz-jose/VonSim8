; =============================================================================
; SUMADOR DE TABLAS - Suma elemento por elemento de dos arreglos
; =============================================================================
; Descripción: Suma los elementos correspondientes de dos arreglos 'a' y 'b'
; y almacena el resultado en el arreglo 'res'
; Resultado: res[i] = a[i] + b[i] para i = 0, 1, 2, 3, 4
; Utiliza únicamente las flags Z (Zero) y C (Carry)
; =============================================================================

          ORG 60h                        ; Inicio del área de datos
          Len EQU 5                      ; Longitud de los arreglos (constante)
          A DB 25, 4, 77, 32, 6          ; Primer arreglo de 5 elementos
          B DB 4, 89, 32, 55, 1          ; Segundo arreglo de 5 elementos  
          Res DB ?, ?, ?, ?, ?           ; Arreglo resultado (sin inicializar)

          ORG 20h                        ; Inicio del programa principal
          MOV CL, Len                    ; CL = longitud del arreglo (5)
          DEC CL                         ; CL = 4 (índice del último elemento)

Suma_elementos:
          ; === BUCLE PRINCIPAL: Suma elementos de posición CL ===
          MOV BL, OFFSET A               ; BL = dirección base del arreglo 'A'
          ADD BL, CL                     ; BL = dirección de A[CL]
          MOV AL, [BL]                   ; AL = valor de A[CL]
          
          MOV BL, OFFSET B               ; BL = dirección base del arreglo 'B'
          ADD BL, CL                     ; BL = dirección de B[CL]
          ADD AL, [BL]                   ; AL = A[CL] + B[CL] (puede activar CF)
          
          MOV BL, OFFSET Res             ; BL = dirección base del arreglo 'Res'
          ADD BL, CL                     ; BL = dirección de Res[CL]
          MOV [BL], AL                   ; Res[CL] = AL (resultado de la suma)
          
          ; Verificar si quedan elementos por procesar
          CMP CL, 0                      ; Comparar CL con 0
          JZ Fin_programa                ; Si ZF=1 (CL=0), terminar
          
          DEC CL                         ; CL = CL - 1 (decrementar índice)
          JMP Suma_elementos             ; Continuar con siguiente elemento
          
Fin_programa:
          HLT                            ; Terminar programa

; =============================================================================
; ALGORITMO MEJORADO - Solo usa flags Z y C:
; 
; 1. Inicialización: CL = 4 (índice del último elemento)
; 2. Bucle principal: Para cada índice CL desde 4 hasta 0:
;    - Carga A[CL] en AL
;    - Suma B[CL] a AL (flag C puede activarse si hay overflow)
;    - Guarda el resultado en Res[CL]
;    - Compara CL con 0 (usa flag Z)
;    - Si ZF=1, termina; si ZF=0, decrementa CL y continúa
; 
; MEJORAS IMPLEMENTADAS:
; - Eliminado el cálculo inicial complejo (len*2-1)
; - Usa CMP CL, 0 + JZ en lugar de JNS (que usa flag S)
; - Algoritmo más simple y directo
; - Procesamiento desde índice 4 hacia 0 (orden descendente)
; 
; Valores finales esperados en 'Res':
; Res[0] = A[0] + B[0] = 25 + 4 = 29
; Res[1] = A[1] + B[1] = 4 + 89 = 93  
; Res[2] = A[2] + B[2] = 77 + 32 = 109
; Res[3] = A[3] + B[3] = 32 + 55 = 87
; Res[4] = A[4] + B[4] = 6 + 1 = 7
; =============================================================================