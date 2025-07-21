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

| #   | Instrucción        | Acción                                      | Codificación                  |
| --- | ------------------ | ------------------------------------------- | ----------------------------- |
| 0   | `MOV Rx, Ry`       | `Rx` ← `Ry`                                 | `0000 XXYY`                   |
| 1   | `MOV Rx, [M]`      | `Rx` ← `Mem[Dirección]`                     | `0001 XX00 DDDDDDDD`          |
| 1   | `MOV Rx, [BL]`     | `Rx` ← `Mem[BL]`                            | `0001 XX01`                   |
| 1   | `MOV Rx, D`        | `Rx` ← `Dato`                               | `0001 XX10 DDDDDDDD`          |
| 1   | `MOV Rx, [BL + D]` | `Rx` ← `Mem[BL + Dato]` (No implementada)   | `0001 XX11 DDDDDDDD`          |
| 2   | `MOV [M], Ry`      | `Mem[Dirección]` ← `Rx`                     | `0010 00YY DDDDDDDD`          |
| 2   | `MOV [BL], Ry`     | `Mem[BL]` ← `Rx`                            | `0010 01YY`                   |
| 2   | `MOV [BL + D], Ry` | `Mem[BL + Dato]` ← `Rx` (No implementada)   | `0010 10YY DDDDDDDD`          |
| 2   | `MOV [M], D`       | `Mem[Dirección]` ← `Dato`                   | `0010 1100 DDDDDDDD dddddddd` |
| 2   | `MOV [BL], D`      | `Mem[BL]` ← `Dato`                          | `0010 1101 DDDDDDDD`          |
| 2   | `MOV [BL + D], D`  | `Mem[BL + Dato]` ← `Dato` (No implementada) | `0010 1110 DDDDDDDD`          |
| 3   | `ADD Rx, Ry`       | `Rx` ← `Rx + Ry`                            | `0011 XXYY`                   |
| 4   | `ADD --, --`       | Mismo direccionamientos que MOV             | `0100 ---- --------`          |
| 5   | `ADD --, --`       | Mismo direccionamientos que MOV             | `0101 ---- -------- --------` |
| 6   | `SUB Rx, Ry`       | `Rx` ← `Rx - Ry`                            | `0110 XXYY`                   |
| 7   | `SUB --, --`       | Mismo direccionamientos que MOV             | `0111 ---- --------`          |
| 8   | `SUB --, --`       | Mismo direccionamientos que MOV             | `1000 ---- -------- --------` |
| 9   | `CMP Rx, Ry`       | Modifica _flags_ de `Rx - Ry`               | `1001 XXYY`                   |
| A   | `CMP --, --`       | Mismo direccionamientos que MOV             | `1010 ---- --------`          |
| B   | `CMP --, --`       | Mismo direccionamientos que MOV             | `1011 ---- -------- --------` |
| C   | `JMP M`            | `IP` ← `Dirección`                          | `1100 0000 DDDDDDDD`          |
| C   | `JC M`             | Si `flag C=1` entonces `IP` ← `Dirección`   | `1100 0001 DDDDDDDD`          |
| C   | `JZ M`             | Si `flag Z=1` entonces `IP` ← `Dirección`   | `1100 0011 DDDDDDDD`          |
| C   | `Jxx M`            | Se pueden implemementar más flags y CALL    | `1100 ffff --------`          |


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


## Formato de instrucciones

Las instrucciones están codificadas con 1, 2 o 3 bytes. Los primeros 4 bits identifican el `opcode` de la instrucción y determinan como se tienen que ise interpretar los 4 bits restantes.

| Caso                    | Codificación                  | Parámetros                                                                        |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| A: entre registros      | `---- XXYY`                   | `XX` = Registro destino, `YY` = Registro fuente                                   |
| B: Cargar a registro    | `---- XXmm DDDDDDDD`          | `mm` = modo, `XX` = Registro destino, `D` = Dirección de memoria o Dato Inmediato |
| C: Almacenar en memoria | `---- mmmm DDDDDDDD dddddddd` | `mmmm` = modo ampliado, `D` = Dirección de memoria, `d` = Dato Inmediato          |
| D: control de flujo     | `---- ffff DDDDDDDD`          | `ffff` = funcionalidad `D` = Dirección de memoria                                 |

`d` = Dato Inmediato, no puede ser destino de la instrucción.

- **dato** se refiere al byte de un dato inmediato.
- **dir** se refiere al word de una dirección.


| Modo direccionamientos B: Cargar a registro |                    |                                                                                       |
| :-----------------------------------------: | :----------------: | :-----------------------------------------------------------------------------------: |
|               **`mm`= Modo**                | **`Byte`= tamaño** |                                  **Interpretación**                                   |
|                     00                      |         2          |                          directo `D` = Dirección de memoria                           |
|                     01                      |         1          | indirecto utiliza como operando implicito el registro `BL` y no requiere operando `D` |
|                     10                      |         2          |                            Inmediato `D` = Dato Inmediato                             |

---

| Modo direccionamientos C: Almacenar en memoria |                    |                                                                            |
| :--------------------------------------------: | :----------------: | :------------------------------------------------------------------------: |
|                **`mmmm`= Modo**                | **`Byte`= tamaño** |                             **Interpretación**                             |
|                      00YY                      |         2          |         directo `D` = Dirección de memoria, `YY` = Registro fuente         |
|                      01YY                      |         1          |                   indirecto `BL`, `YY` = Registro fuente                   |
|                      1100                      |         3          |                            Inmediato a memoria                             |
|                      1101                      |         2          |                Inmediato a memoria mediante indirecto `BL`                 |


## Instrucciones binarias de la ALU

| Instrucción |    Opcode    |
| :---------: | :----------: |
|    `MOV`    | `0000 w` |
|    `AND`    | `0001 w` |
|    `OR`     | `0010 w` |
|    `XOR`    | `0011 w` |
|    `ADD`    | `0100 w` |
|    `ADC`    | `0101 w` |
|    `SUB`    | `0110 w` |
|    `SBB`    | `0111 w` |
|   `TEST`    | `0001 w` |
|    `CMP`    | `0110 w` |

Estas instrucciones reciben dos operandos y soportan varios modos de direccionamiento. Esta información está codificada en el bit `d` y el segundo byte de la instrucción según la siguiente tabla:

| Destino                                | Fuente                                 | Segundo byte | Bytes siguientes                         |
| :------------------------------------- | :------------------------------------- | :----------: | :--------------------------------------- |
| Registro                               | Registro                               |  `00RRRrrr`  | —                                        |
| Registro                               | Memoria (directo)                      |  `01000rrr`  | dir-low, dir-high                        |
| Registro                               | Memoria (indirecto)                    |  `01010rrr`  | —                                        |
| Registro                               | Memoria (indirecto con desplazamiento) |  `01100rrr`  | desp-low, desp-high                      |
| Registro                               | Inmediato                              |  `01001rrr`  | dato-low, dato-high                      |
| Memoria (directo)                      | Registro                               |  `11000rrr`  | dir-low, dir-high                        |
| Memoria (indirecto)                    | Registro                               |  `11010rrr`  | —                                        |
| Memoria (indirecto con desplazamiento) | Registro                               |  `11100rrr`  | desp-low, desp-high                      |
| Memoria (directo)                      | Inmediato                              |  `11001000`  | dir-low, dir-high, dato-low, dato-high   |
| Memoria (indirecto)                    | Inmediato                              |  `11011000`  | dato-low, dato-high                      |
| Memoria (indirecto con desplazamiento) | Inmediato                              |  `11101000`  | desp-low, desp-high, dato-low, dato-high |

Para las instrucciones con un registro como operando, `rrr` codifica este registro. En el caso registro a registro, `RRR` codifica el registro fuente y `rrr` el registro destino.

## Instrucciones unarias de la ALU

| Instrucción |    Opcode    |
| :---------: | :----------: |
|    `NOT`    | `0100 000 w` |
|    `NEG`    | `0100 001 w` |
|    `INC`    | `0100 010 w` |
|    `DEC`    | `0100 011 w` |

Estas instrucciones reciben un operando y soportan varios modos de direccionamiento. Esta información está codificada el segundo byte de la instrucción según la siguiente tabla:

| Destino                                | Segundo byte | Bytes siguientes    |
| :------------------------------------- | :----------: | :------------------ |
| Registro                               |  `00000rrr`  | —                   |
| Memoria (directo)                      |  `11000000`  | dir-low, dir-high   |
| Memoria (indirecto)                    |  `11010000`  | —                   |
| Memoria (indirecto con desplazamiento) |  `11100000`  | desp-low, desp-high |

## Instrucciones de E/S

| Instrucción |    Opcode    |
| :---------: | :----------: |
|    `IN`     | `0101 00 pw` |
|    `OUT`    | `0101 01 pw` |

El bit `p` codifica

- si el puerto es fijo (`p=0`), el cual se tendrá que proveer en el siguiente byte (puerto máximo: 255),
- o si el puerto es variable (`p=1`), caso en el cual se usará el valor almacenado en el registro `DX` como puerto.

## Instrucciones relacionadas a la pila

| Instrucción |   Opcode    |
| :---------: | :---------: |
|   `PUSH`    | `0110 0rrr` |
|    `POP`    | `0110 1rrr` |
|   `PUSHF`   | `0111 0000` |
|   `POPF`    | `0111 1000` |

`rrr` siempre representa un registro de 16 bits.

## Instrucciones de salto

| Instrucción |   Opcode    |
| :---------: | :---------: |
|    `JC`     | `0010 0000` |
|    `JNC`    | `0010 0001` |
|    `JZ`     | `0010 0010` |
|    `JNZ`    | `0010 0011` |
|    `JS`     | `0010 0100` |
|    `JNS`    | `0010 0101` |
|    `JO`     | `0010 0110` |
|    `JNO`    | `0010 0111` |
|    `JMP`    | `0011 0000` |
|   `CALL`    | `0011 0001` |
|    `RET`    | `0011 0011` |

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
|    `NOP`    | `0001 0000` |
|    `HLT`    | `0001 0001` |
