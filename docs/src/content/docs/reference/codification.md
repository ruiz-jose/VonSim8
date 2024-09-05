---
title: Codificación
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/codification.png }
---

Aquí se denota la codificación en binario de cada una de las instrucciones del simulador. Pese a que el set de instrucciones esté basado en el de Intel 8088, la codificación se simplificado con fines prácticos y didácticos.

## Formato de instrucciones
Las instrucciones están codificadas con 1, 2 o 3 bytes. Los primeros 4 bits identifican el `opcode` de la instrucción y determinan como se tienen que ise interpretar los 4 bits restantes. 

| Caso | Codificación | Parámetros |
| --- | --- | --- |
| A: entre registros | `---- XXYY` | `XX` = Registro destino, `YY` = Registro fuente |
| B: Cargar a registro  | `---- XXmm DDDDDDDD` | `mm` = modo, `XX` = Registro destino, `D` = Dirección de memoria o Dato Inmediato |
| C: Almacenar en memoria | `---- mmmm DDDDDDDD dddddddd` | `mmmm` = modo ampliado, `D` = Dirección de memoria,  `d` = Dato Inmediato |
| D: control de flujo  | `---- ffff DDDDDDDD` | `ffff` = funcionalidad `D` = Dirección de memoria |

 `d` = Dato Inmediato, no puede ser destino de la instrucción.


| Modo direccionamientos B: Cargar a registro  |  |  |
| :---: | :---: | :---: |
| **`mm`= Modo** | **`Byte`= tamaño** | **Interpretación** |
| 00 |  2 |directo `D` = Dirección de memoria |
| 01 |  1 |indirecto utiliza como operando implicito el registro `BL` y no requiere operando `D` |
| 10 |  2 |Inmediato `D` = Dato Inmediato |
| 11 |  2 |Indirecto la dirección se calcula operando implicito `BL` + Dato Inmediato|

| Modo direccionamientos C: Almacenar en memoria  |  |  |
| :---: | :---: | :---: |
| **`mmmm`= Modo** | **`Byte`= tamaño** | **Interpretación** |
| 00YY |  2 |directo `D` = Dirección de memoria, `YY` = Registro fuente |
| 01YY |  1 |indirecto `BL`, `YY` = Registro fuente|
| 01YY |  2 |Indirecto la dirección se calcula operando implicito `BL` + Dato Inmediato |
| 1100 |  3 |Inmediato a memoria|
| 1101 |  2 |Inmediato a memoria mediante indirecto `BL`|
| 1110 |  3 |Inmediato a memoria mediante indirecto `BL`+ Dato Inmediato |


| # | Instrucción        | Acción                                                             | Codificación                  |
| - | ---                | ---                                                                | ---                           |
| 0 | `MOV Rx, Ry`       | `Rx` $\leftarrow$ `Ry`                                             | `0000 XXYY`                   |
| 1 | `MOV Rx, [M]`      | `Rx` $\leftarrow$ `Mem[Dirección]`                                 | `0001 XX00 DDDDDDDD`          |
| 1 | `MOV Rx, [BL]`     | `Rx` $\leftarrow$ `Mem[BL]`                                        | `0001 XX01`                   |
| 1 | `MOV Rx, D`        | `Rx` $\leftarrow$ `Dato`                                           | `0001 XX10 DDDDDDDD`          |
| 1 | `MOV Rx, [BL + D]` | `Rx` $\leftarrow$ `Mem[BL + Dato]`                                 | `0001 XX11 DDDDDDDD`          |
| 2 | `MOV [M], Ry`      | `Mem[Dirección]` $\leftarrow$ `Rx`                                 | `0010 00YY DDDDDDDD`          |
| 2 | `MOV [BL], Ry`     | `Mem[BL]` $\leftarrow$ `Rx`                                        | `0010 01YY`                   |
| 2 | `MOV [BL + D], Ry` | `Mem[BL + Dato]` $\leftarrow$ `Rx`                                 | `0010 10YY DDDDDDDD`          |
| 2 | `MOV [M], D`       | `Mem[Dirección]` $\leftarrow$ `Dato`                               | `0010 1100 DDDDDDDD dddddddd` |
| 2 | `MOV [BL], D`      | `Mem[BL]` $\leftarrow$ `Dato`                                      | `0010 1101 DDDDDDDD`          |
| 2 | `MOV [BL + D], D`  | `Mem[BL + Dato]` $\leftarrow$ `Dato`                               | `0010 1110 DDDDDDDD`          |
| 3 | `ADD Rx, Ry`       | `Rx` $\leftarrow$ `Rx + Ry`                                        | `0011 XXYY`                   |
| 4 | `ADD --, --`       | Mismo direccionamientos que MOV                                    | `0100 ---- --------`          |
| 5 | `ADD --, --`       | Mismo direccionamientos que MOV                                    | `0101 ---- -------- --------` |
| 6 | `SUB Rx, Ry`       | `Rx` $\leftarrow$ `Rx - Ry`                                        | `0110 XXYY`                   |
| 7 | `SUB --, --`       | Mismo direccionamientos que MOV                                    | `0111 ---- --------`          |
| 8 | `SUB --, --`       | Mismo direccionamientos que MOV                                    | `1000 ---- -------- --------` |
| 9 | `CMP Rx, Ry`       | Modifica *flags* de `Rx - Ry`                                      | `1001 XXYY`                   |
| A | `CMP --, --`       | Mismo direccionamientos que MOV                                    | `1010 ---- --------`          |
| B | `CMP --, --`       | Mismo direccionamientos que MOV                                    | `1011 ---- -------- --------` |
| C | `JMP M`            | `IP` $\leftarrow$ `Dirección`                                      | `1100 0000 DDDDDDDD`          |
| C | `JC M`             | Si `flag C=1` entonces `IP` $\leftarrow$ `Dirección`               | `1100 0001 DDDDDDDD`          |
| C | `JZ M`             | Si `flag Z=1` entonces `IP` $\leftarrow$ `Dirección`               | `1100 0011 DDDDDDDD`          |
| C | `Jxx M`            | Se pueden implemementar más flags y CALL                           | `1100 ffff --------`          |


- `Rx` o `Ry`: referencian registros.

  | `Código` | `Nombre` | 
  | :---: | :---: | 
  | `00` | `AL`  | 
  | `01` | `CL`  | 
  | `10` | `DL`  |
  | `11` | `BL`  | 
  
Estas instrucciones reciben dos operandos y soportan varios modos de direccionamiento. Esta información está codificada en el bit `d` y el segundo byte de la instrucción según la siguiente tabla:

| Destino                                | Fuente                                 |  Primer Byte | Segundo Byte                             |Tercer Byte
| :------------------------------------- | :------------------------------------- | :----------: | :--------------------------------------- | :--------------------------------------- |
| Registro                               | Registro                               |  `----RxRy`  | —                                        |
| Registro                               | Memoria (directo)                      |  `----Rx00`  | dir                                      |
| Registro                               | Memoria (indirecto)                    |  `----Rx01`  | —                                        |
| Registro                               | Inmediato                              |  `----Rx10`  | dato                                     |
| Registro                               | Memoria (indirecto con desplazamiento) |  `----Rx11`  | dato desplazamiento                      |
| Memoria (directo)                      | Registro                               |  `----00Ry`  | dir                                      |
| Memoria (indirecto)                    | Registro                               |  `----01Ry`  | dir                                      |
| Memoria (indirecto con desplazamiento) | Registro                               |  `----10Ry`  | dato                                     |
| Memoria (directo)                      | Inmediato                              |  `----1100`  | dir                                      |dato
| Memoria (indirecto)                    | Inmediato                              |  `----1101`  | dato                                     |
| Memoria (indirecto con desplazamiento) | Inmediato                              |  `----1110`  | dato desplazamiento                      |

---

| Instrucción |   Opcode    |
| :---------: | :---------: |
|    `JMP`    | `1100 0000` |
|    `JC`     | `1100 0000` |
|    `JNC`    | `1100 0001` |
|    `JZ`     | `1100 0010` |
|    `JNZ`    | `1100 0011` |
|    `JS`     | `1100 0100` |
|    `JNS`    | `1100 0101` |
|    `JO`     | `1100 0110` |
|    `JNO`    | `1100 0111` |

---


| Instrucción |   Opcode    |
| :---------: | :---------: |
|    `NOP`    | `0001 0000` |
|    `HLT`    | `0001 0001` |

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
