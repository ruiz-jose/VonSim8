# Codificación

Aquí se denota la codificación en binario de cada una de las instrucciones del simulador. Pese a que el set de instrucciones esté basado en el del Intel 8088, la codificación se simplificado con fines prácticos y didácticos.

## Acrónimos y abreviaciones

A lo largo de la codificación se usan las siguientes abreviaturas:

- `Rx` o `Ry`: referencian registros.

  | `Código` | `Nombre` |
  | :------: | :------: |
  |   `00`   |   `AL`   |
  |   `01`   |   `CL`   |
  |   `10`   |   `DL`   |
  |   `11`   |   `BL`   |
  
La codificación de instrucciones en VonSim8 está simplificada para fines didácticos, permitiendo a los estudiantes centrarse en los conceptos fundamentales sin la complejidad técnica de arquitecturas reales.

Para las instrucciones con un registro como operando, `Ry` codifica el registro fuente y `Rx` el registro destino.

## Instrucciones con dos operandos (Binarias)

Las instrucciones están codificadas con 1, 2 o 3 bytes. Los primeros 4 bits identifican el `opcode` de la instrucción y determinan como se tienen que interpretar los 4 bits restantes.

Estas instrucciones reciben dos operandos y soportan varios modos de direccionamiento. Esta información está codificada en el primer Byte junto al código de operación de la instrucción según la siguiente tabla:

| Destino                                | Fuente                                 | Primer Byte | Segundo Byte        | Tercer Byte |
| :------------------------------------- | :------------------------------------- | :---------: | :------------------ | :---------- |
| Registro                               | Registro                               | `----RxRy`  | —                   |
| Registro                               | Memoria (directo)                      | `----Rx00`  | dir                 |
| Registro                               | Memoria (indirecto)                    | `----Rx01`  | —                   |
| Registro                               | Inmediato                              | `----Rx10`  | dato                |
| Memoria (directo)                      | Registro                               | `----00Ry`  | dir                 |
| Memoria (indirecto)                    | Registro                               | `----01Ry`  | dir                 |
| Memoria (directo)                      | Inmediato                              | `----1100`  | dir                 | dato        |
| Memoria (indirecto)                    | Inmediato                              | `----1101`  | dato                |


| #   | Instrucción        | Acción                                      | Codificación                  |
| --- | ------------------ | ------------------------------------------- | ----------------------------- |
| 0   | `MOV Rx, Ry`       | `Rx` ← `Ry`                                 | `0000 RxRy`                   |
| 1   | `MOV Rx, [M]`      | `Rx` ← `Mem[Dirección]`                     | `0001 Rx00 DDDDDDDD`          |
| 1   | `MOV Rx, [BL]`     | `Rx` ← `Mem[BL]`                            | `0001 Rx01`                   |
| 1   | `MOV Rx, D`        | `Rx` ← `Dato`                               | `0001 Rx10 DDDDDDDD`          |
| 2   | `MOV [M], Ry`      | `Mem[Dirección]` ← `Rx`                     | `0010 00Ry DDDDDDDD`          |
| 2   | `MOV [BL], Ry`     | `Mem[BL]` ← `Rx`                            | `0010 01Ry`                   |
| 2   | `MOV [M], D`       | `Mem[Dirección]` ← `Dato`                   | `0010 1100 DDDDDDDD dddddddd` |
| 2   | `MOV [BL], D`      | `Mem[BL]` ← `Dato`                          | `0010 1101 DDDDDDDD`          |
| 3   | `ADD Rx, Ry`       | `Rx` ← `Rx + Ry`                            | `0011 RxRy`                   |
| 4   | `ADD Rx, [M]`      | `Rx` ← `Rx + Mem[Dirección]`                | `0100 Rx00 DDDDDDDD`          |
| 4   | `ADD Rx, [BL]`     | `Rx` ← `Rx + Mem[BL]`                       | `0100 Rx01`                   |
| 4   | `ADD Rx, D`        | `Rx` ← `Rx + Dato`                          | `0100 Rx10 DDDDDDDD`          |
| 5   | `ADD [M], Ry`      | `Mem[Dirección]` ← `Mem[Dirección] + Rx`    | `0101 00Ry DDDDDDDD`          |
| 5   | `ADD [BL], Ry`     | `Mem[BL]` ← `Mem[BL] + Rx`                  | `0101 01Ry`                   |
| 5   | `ADD [M], D`       | `Mem[Dirección]` ← `Mem[Dirección] + Dato`  | `0101 1100 DDDDDDDD dddddddd` |
| 5   | `ADD [BL], D`      | `Mem[BL]` ← `Mem[BL] + Dato`                | `0101 1101 DDDDDDDD`          |
| 6   | `SUB Rx, Ry`       | `Rx` ← `Rx - Ry`                            | `0110 RxRy`                   |
| 7   | `SUB --, --`       | Mismo direccionamientos que MOV             | `0111 ---- --------`          |
| 8   | `SUB --, --`       | Mismo direccionamientos que MOV             | `1000 ---- -------- --------` |
| 9   | `CMP Rx, Ry`       | `Rx - Ry`                                   | `1001 RxRy`                   |
| A   | `CMP --, --`       | Mismo direccionamientos que MOV             | `1010 ---- --------`          |
| B   | `CMP --, --`       | Mismo direccionamientos que MOV             | `1011 ---- -------- --------` |


## Instrucciones de un solo operando (unarias) 

| #   | Instrucción        | Acción                                      | Codificación                  |
| --- | ------------------ | ------------------------------------------- | ----------------------------- |
| C   | `JMP M`            | `IP` ← `Dirección`                          | `1100 0000 DDDDDDDD`          |
| C   | `JC M`             | Si `flag C=1` entonces `IP` ← `Dirección`   | `1100 0001 DDDDDDDD`          |
| C   | `JZ M`             | Si `flag Z=1` entonces `IP` ← `Dirección`   | `1100 0011 DDDDDDDD`          |
| C   | `Jxx M`            | Se pueden implemementar más flags y CALL    | `1100 ffff --------`          |
| D   | `HLT  `            | Detenie CPU                                 | `1101 0000`                   |


## Instrucciones de salto

| Instrucción |   Opcode    |
| :---------: | :---------: |
|    `JC`     | `1100 0000` |
|    `JNC`    | `1100 0001` |
|    `JZ`     | `1100 0010` |
|    `JNZ`    | `1100 0011` |
|    `JS`     | `1100 0100` |
|    `JNS`    | `1100 0101` |
|    `JO`     | `1100 0110` |
|    `JNO`    | `1100 0111` |
|    `JMP`    | `1100 0000` |
|   `CALL`    | `1100 0001` |

## Instrucciones de E/S

| Instrucción |    Opcode    |
| :---------: | :----------: |
|    `IN`     | `0101 00 pw` |
|    `OUT`    | `0101 01 pw` |

El bit `p` codifica

- si el puerto es fijo (`p=0`), el cual se tendrá que proveer en el siguiente byte (puerto máximo: 255),
- o si el puerto es variable (`p=1`), caso en el cual se usará el valor almacenado en el registro `DL` como puerto.

## Instrucciones relacionadas a la pila

| Instrucción |   Opcode    |
| :---------: | :---------: |
|   `PUSH`    | `0110` |
|    `POP`    | `0110` |

`rr` siempre representa un registro de 8 bits.

Luego del opcode, estas instrucciones (salvo `RET`) reciben una dirección absoluta de memoria (que ocupa dos bytes).

## Instrucciones relacionadas a las interrupciones

| Instrucción |   Opcode    |
| :---------: | :---------: |
|    `CLI`    | `0001 1000` |
|    `STI`    | `0001 1001` |
|    `INT`    | `0001 1010` |
|   `IRET`    | `0001 1011` |

Luego del opcode, `INT` recibe el número de instrucción (ocupa un byte).

## Otras instrucciones

| Instrucción |   Opcode    |
| :---------: | :---------: |
|    `HLT`    | `1101 0000` |
