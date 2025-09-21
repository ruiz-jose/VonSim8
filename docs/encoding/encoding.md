# Formato completo de instrucciones

En este documento se describe la codificación binaria de cada instrucción del simulador VonSim8. Aunque el conjunto de instrucciones se inspira en el Intel 8088, la codificación se ha simplificado para facilitar el aprendizaje y la comprensión de los conceptos fundamentales.

## Resumen de categorías

| Categoría                | Instrucción                                 | Código operación   | Operandos | Acción                                                                                                   |
|:------------------------:|:-------------------------------------------:|:------------------:|:---------:|:--------------------------------------------------------------------------------------------------------|
| Transferencia de datos   | MOV                                         | 0, 1, 2            |    2      | Copia entre registros, carga desde memoria a registro, almacena en memoria                              |
| Procesamiento de datos   | ADD                                         | 3, 4, 5            |    2      | Suma: operando1 = operando1 + operando2                                                                 |
|                          | SUB                                         | 6, 7, 8            |    2      | Resta: operando1 = operando1 - operando2                                                                |
|                          | CMP                                         | 9, 10, 11          |    2      | Comparación: operando1 - operando2 (no modifica el destino)                                             |
| Control de flujo         | JMP / Jxx / CALL / INT                      | 12                 |    1      | Saltos incondicionales JMP, condicionales Jxx, llamada a subrutina CALL, llamada de interrupción INT    |
| Gestión de flujo         | HLT / RET / IRET / CLI / STI                | 13                 |    0      | Detener CPU (HLT), retorno de subrutina (RET), retorno de interrupción (IRET), gestión de interrupciones (CLI/STI) |
| Manejo de pila y E/S     | OUT / IN / PUSH / POP                       | 14                 |    2      | Enviar a puerto (OUT), recibir de puerto (IN), poner en la pila (PUSH), retirar de la pila (POP)        |
| Miscelánea               | AND / OR / XOR / NOT / NEG / INC / DEC      | 15                 |    1-2    | Operaciones lógicas y aritméticas: AND, OR, XOR, NOT, NEG, incremento (INC), decremento (DEC)           |
                                                                       |

## Acrónimos y abreviaciones

Durante la codificación se emplean las siguientes abreviaturas para los registros:

| Código | Nombre |
| :----: | :----: |
|  00    |  AL    |
|  01    |  CL    |
|  10    |  DL    |
|  11    |  BL    |

En las instrucciones que utilizan registros como operandos, `Ry` representa el registro fuente y `Rx` el registro destino.

## Instrucciones binarias (dos operandos)

Las instrucciones `MOV`, `ADD`, `SUB` y `CMP` pueden ocupar 1, 2 o 3 bytes. Los primeros 4 bits corresponden al código de operación (`opcode`) y los 4 restantes al modo de direccionamiento. Los modos de direccionamiento y la estructura de los bytes se resumen en la siguiente tabla:

| Destino                                | Fuente                                 | Primer Byte | Segundo Byte        | Tercer Byte |
| :------------------------------------- | :------------------------------------- | :---------: | :------------------ | :---------- |
| Registro                               | Registro                               | `----RxRy`  | —                   |
| Registro                               | Memoria (directo)                      | `----Rx00`  | dir                 |
| Registro                               | Memoria (indirecto)                    | `----Rx01`  | —                   |
| Registro                               | Inmediato                              | `----Rx10`  | dato                |
| Memoria (directo)                      | Registro                               | `----00Ry`  | dir                 |
| Memoria (indirecto)                    | Registro                               | `----01Ry`  | —                   |
| Memoria (directo)                      | Inmediato                              | `----1100`  | dir                 | dato        |
| Memoria (indirecto)                    | Inmediato                              | `----1101`  | dato                |

A continuación se muestran las combinaciones posibles para cada instrucción binaria:

| #   | Instrucción        | Acción                                      | Codificación                  |
| --- | ------------------ | ------------------------------------------- | ----------------------------- |
| 0   | `MOV Rx, Ry`       | `Rx` ← `Ry`                                 | `0000 RxRy`                   |
| 1   | `MOV Rx, [M]`      | `Rx` ← `Mem[Dirección]`                     | `0001 Rx00 MMMMMMMM`          |
| 1   | `MOV Rx, [BL]`     | `Rx` ← `Mem[BL]`                            | `0001 Rx01`                   |
| 1   | `MOV Rx, D`        | `Rx` ← `Dato`                               | `0001 Rx10 MMMMMMMM`          |
| 2   | `MOV [M], Ry`      | `Mem[Dirección]` ← `Rx`                     | `0010 00Ry MMMMMMMM`          |
| 2   | `MOV [BL], Ry`     | `Mem[BL]` ← `Rx`                            | `0010 01Ry`                   |
| 2   | `MOV [M], D`       | `Mem[Dirección]` ← `Dato`                   | `0010 1100 MMMMMMMM DDDDDDDD` |
| 2   | `MOV [BL], D`      | `Mem[BL]` ← `Dato`                          | `0010 1101 DDDDDDDD`          |
| 3   | `ADD Rx, Ry`       | `Rx` ← `Rx + Ry`                            | `0011 RxRy`                   |
| 4   | `ADD Rx, [M]`      | `Rx` ← `Rx + Mem[Dirección]`                | `0100 Rx00 MMMMMMMM`          |
| 4   | `ADD Rx, [BL]`     | `Rx` ← `Rx + Mem[BL]`                       | `0100 Rx01`                   |
| 4   | `ADD Rx, D`        | `Rx` ← `Rx + Dato`                          | `0100 Rx10 DDDDDDDD`          |
| 5   | `ADD [M], Ry`      | `Mem[Dirección]` ← `Mem[Dirección] + Rx`    | `0101 00Ry MMMMMMMM`          |
| 5   | `ADD [BL], Ry`     | `Mem[BL]` ← `Mem[BL] + Rx`                  | `0101 01Ry`                   |
| 5   | `ADD [M], D`       | `Mem[Dirección]` ← `Mem[Dirección] + Dato`  | `0101 1100 MMMMMMMM DDDDDDDD` |
| 5   | `ADD [BL], D`      | `Mem[BL]` ← `Mem[BL] + Dato`                | `0101 1101 DDDDDDDD`          |
| 6   | `SUB Rx, Ry`       | `Rx` ← `Rx - Ry`                            | `0110 RxRy`                   |
| 7   | `SUB Rx, [M]`      | `Rx` ← `Rx - Mem[Dirección]`                | `0111 Rx00 MMMMMMMM`          |
| 7   | `SUB Rx, [BL]`     | `Rx` ← `Rx - Mem[BL]`                       | `0111 Rx01`                   |
| 7   | `SUB Rx, D`        | `Rx` ← `Rx - Dato`                          | `0111 Rx10 DDDDDDDD`          |
| 8   | `SUB [M], Ry`      | `Mem[Dirección]` ← `Mem[Dirección] - Rx`    | `1000 00Ry MMMMMMMM`          |
| 8   | `SUB [BL], Ry`     | `Mem[BL]` ← `Mem[BL] - Rx`                  | `1000 01Ry`                   |
| 8   | `SUB [M], D`       | `Mem[Dirección]` ← `Mem[Dirección] - Dato`  | `1000 1100 MMMMMMMM DDDDDDDD` |
| 8   | `SUB [BL], D`      | `Mem[BL]` ← `Mem[BL] - Dato`                | `1000 1101 DDDDDDDD`          |
| 9   | `CMP Rx, Ry`       | `Rx - Ry`                                   | `1001 RxRy`                   |
| 10  | `CMP Rx, [M]`      | `Rx - Mem[Dirección]`                       | `1010 Rx00 MMMMMMMM`          |
| 10  | `CMP Rx, [BL]`     | `Rx - Mem[BL]`                              | `1010 Rx01`                   |
| 10  | `CMP Rx, D`        | `Rx - Dato`                                 | `1010 Rx10 DDDDDDDD`          |
| 11  | `CMP [M], Ry`      | `Mem[Dirección] - Rx`                       | `1011 00Ry MMMMMMMM`          |
| 11  | `CMP [BL], Ry`     | `Mem[BL] - Rx`                              | `1011 01Ry`                   |
| 11  | `CMP [M], D`       | `Mem[Dirección] - Dato`                     | `1011 1100 MMMMMMMM DDDDDDDD` |
| 11  | `CMP [BL], D`      | `Mem[BL] - Dato`                            | `1011 1101 DDDDDDDD`          |

## Instrucciones unarias (un solo operando)

| #   | Instrucción        | Acción                                                      | Codificación           |
| --- | ------------------ | ----------------------------------------------------------- | ---------------------- |
| 12  | `JMP M`            | Salto incondicional: `IP` ← `Dirección`                     | `1100 0000 MMMMMMMM`   |
| 12  | `JZ M`             | Salta si Z=1: `IP` ← `Dirección`                            | `1100 0001 MMMMMMMM`   |
| 12  | `JC M`             | Salta si C=1: `IP` ← `Dirección`                            | `1100 0010 MMMMMMMM`   |
| 12  | `JS M`             | Salta si S=1: `IP` ← `Dirección`                            | `1100 0011 MMMMMMMM`   |
| 12  | `JO M`             | Salta si O=1: `IP` ← `Dirección`                            | `1100 0100 MMMMMMMM`   |
| 12  | `JNC M`            | Salta si C=0: `IP` ← `Dirección`                            | `1100 0101 MMMMMMMM`   |
| 12  | `JNZ M`            | Salta si Z=0: `IP` ← `Dirección`                            | `1100 0110 MMMMMMMM`   |
| 12  | `JNS M`            | Salta si S=0: `IP` ← `Dirección`                            | `1100 0111 MMMMMMMM`   |
| 12  | `JNO M`            | Salta si O=0: `IP` ← `Dirección`                            | `1100 1000 MMMMMMMM`   |
| 12  | `CALL M`           | Llama a subrutina: apila IP y salta a `Dirección`           | `1100 1001 MMMMMMMM`   |
| 12  | `INT M`            | Ejecuta interrupción: salta a rutina en `Dirección`         | `1100 1010 MMMMMMMM`   |

## Instrucciones sin operandos

| #   | Instrucción | Acción                                                        | Codificación   |
| --- | ----------- | ------------------------------------------------------------- | -------------- |
| 13  | `HLT`      | Detiene la CPU (Halt)                                          | `1101 0000`    |
| 13  | `RET`      | Retorna de subrutina: recupera dirección de retorno a `IP`     | `1101 0001`    |
| 13  | `IRET`     | Retorna de interrupción: recupera dirección de retorno a `IP`  | `1101 0010`    |
| 13  | `CLI`      | Inhabilita interrupciones (Clear Interrupt Flag)               | `1101 0011`    |
| 13  | `STI`      | Habilita interrupciones (Set Interrupt Flag)                   | `1101 0100`    |

## Instrucciones de E/S y pila

| #   | Instrucción   | Acción                                                        | Codificación           |
| --- | ------------- | ------------------------------------------------------------- | ---------------------- |
| 14  | `OUT DL, AL`  | Envía el valor de `AL` al puerto especificado en `DL`         | `1110 0000`            |
| 14  | `OUT D, AL`   | Envía el valor de `AL` al puerto de dirección inmediata `D`   | `1110 0001 DDDDDDDD`   |
| 14  | `IN AL, DL`   | Recibe un valor desde el puerto especificado en `DL` y lo carga en `AL` | `1110 0010`    |
| 14  | `IN AL, D`    | Recibe un valor desde el puerto de dirección inmediata `D` y lo carga en `AL` | `1110 0011 DDDDDDDD` |
| 14  | `PUSH Ry`     | Pone el valor de `Ry` en la pila                              | `1110 01Ry`            |
| 14  | `POP Rx`      | Retira el valor del tope de la pila y lo carga en `Rx`        | `1110 10Rx`            |

## Instrucciones sin código único de operación

El simulador utiliza un código de operación de 4 bits para las instrucciones, lo que simplifica la arquitectura del sistema pero limita el número máximo de instrucciones implementables a 16 opciones diferentes. Con el objetivo de ampliar el repertorio de instrucciones sin incrementar el tamaño de la codificación, se adoptó una estrategia de agrupación para el código de operación 15.

Bajo esta implementación, las instrucciones lógicas (AND, OR y XOR) comparten el código de operación 15 con las instrucciones aritméticas de un operando (INC, DEC, NEG y NOT). Esta decisión de diseño permite mantener la compatibilidad con los modos de direccionamiento establecidos para las instrucciones aritméticas de dos operandos (ADD, SUB y CMP), garantizando consistencia en la interfaz del simulador mientras se maximiza la funcionalidad dentro de las limitaciones impuestas por el esquema de codificación de 4 bits.

Esta solución representa un compromiso eficaz entre la simplicidad arquitectural y la capacidad funcional del simulador, permitiendo una mayor diversidad de operaciones sin comprometer la claridad pedagógica del diseño.

