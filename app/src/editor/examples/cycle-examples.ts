// Ejemplos cortos para comparar el ciclo de instrucción según el modo de
// direccionamiento. Cada uno se recorre con F6 (fase) o F7 (ciclo) y, al
// terminar cada instrucción, el panel muestra un resumen para compararlas.
export const ejemplosCiclo = [
  {
    nombre: "Ciclo: registro vs. inmediato",
    filename: "ciclo_registro_inmediato.asm",
    contenido: `; Comparar: ¿cuántos ciclos lleva cada instrucción?
; Presioná F6 para avanzar por fases (búsqueda / ejecución)
; y mirá el resumen que aparece al final de cada instrucción.

; Registro: el dato ya está dentro de la CPU.
; La ejecución no necesita ir a la memoria.
MOV AL, 5       ; inmediato (para tener un valor en AL)
MOV BL, AL      ; registro: copia AL en BL

; Inmediato: el dato viene en el byte siguiente de la instrucción.
; La ejecución lee un byte más de la memoria.
ADD BL, 2

HLT`,
  },
  {
    nombre: "Ciclo: directo",
    filename: "ciclo_directo.asm",
    contenido: `; Directo: la instrucción trae la DIRECCIÓN del dato.
; Fijate que en la ejecución hay DOS lecturas:
;   1. leer la dirección (el byte siguiente de la instrucción)
;   2. leer el dato en esa dirección (MAR ← MBR)

x DB 7
y DB 0

MOV AL, x       ; lee la variable x de la memoria
MOV y, AL       ; escribe en la memoria: mirá la celda "y"
HLT`,
  },
  {
    nombre: "Ciclo: indirecto con BL",
    filename: "ciclo_indirecto.asm",
    contenido: `; Indirecto: la dirección del dato está en BL.
; Comparalo con el modo directo: la instrucción es más corta
; (no trae la dirección) y por eso necesita menos ciclos.

x DB 7

MOV BL, OFFSET x   ; BL apunta a x
MOV AL, [BL]       ; lee el dato en la dirección que dice BL
HLT`,
  },
  {
    nombre: "Ciclo: saltos y subrutinas",
    filename: "ciclo_saltos.asm",
    contenido: `; En un salto, la ejecución cambia IP: la próxima búsqueda
; trae la instrucción desde otra dirección.
; CALL además guarda en la pila adónde volver, y RET lo recupera.

        MOV AL, 0
        CALL sumar    ; mirá cómo baja SP y se escribe en la pila
        JMP fin       ; salto incondicional
        MOV AL, 99    ; esta instrucción nunca se ejecuta
fin:    HLT

sumar:  ADD AL, 1
        RET           ; IP toma la dirección guardada en la pila`,
  },
];
