# Set de instrucciones

<a href="/es/computer/instructions.pdf" download="Set de instrucciones del simulador VonSim.pdf">Descargar en formato PDF (tamaño A5)</a>

Aquí se listan todas las instrucciones que soporta el simulador. Cada instrucción tiene una breve descripción, una tabla con los flags que modifica. Si hay un "0" o un "1", significa que el flag se modifica a `0` o `1` respectivamente. Si hay una "X", significa que lo modifica según corresponda. Si no hay nada, significa que el flag no se modifica.

### Instrucciones de transferencia de datos

| Instrucción                 | Comentario                                       | `Z` | `C` | `S` | `O` | `I` |
| :-------------------------- | :----------------------------------------------- | :-: | :-: | :-: | :-: | :-: |
| [`MOV dest, fuente`](./mov) | Copia _fuente_ en _dest_                         |  -  |  -  |  -  |  -  |  -  |
| [`PUSH fuente`](./push)     | Carga _fuente_ en el tope de la pila             |  -  |  -  |  -  |  -  |  -  |
| [`POP dest`](./pop)         | Desapila el tope de la pila y lo carga en _dest_ |  -  |  -  |  -  |  -  |  -  |
| [`IN dest, fuente`](./in)   | Carga el valor en el puerto _fuente_ en _dest_   |  -  |  -  |  -  |  -  |  -  |
| [`OUT dest, fuente`](./out) | Carga en el puerto _dest_ el valor en _fuente_   |  -  |  -  |  -  |  -  |  -  |

### Instrucciones aritméticas

| Instrucción                 | Comentario                  | `Z` | `C` | `S` | `O` | `I` |
| :-------------------------- | :-------------------------- | :-: | :-: | :-: | :-: | :-: |
| [`ADD dest, fuente`](./add) | Suma _fuente_ a _dest_      |  X  |  X  |  X  |  X  |  -  |
| [`SUB dest, fuente`](./sub) | Resta _fuente_ a _dest_     |  X  |  X  |  X  |  X  |  -  |
| [`CMP dest, fuente`](./cmp) | Compara _fuente_ con _dest_ |  X  |  X  |  X  |  X  |  -  |
| [`NEG dest`](./neg)         | Negativo de _dest_          |  X  |  X  |  X  |  X  |  -  |
| [`INC dest`](./inc)         | Incrementa _dest_           |  X  |  -  |  X  |  X  |  -  |
| [`DEC dest`](./dec)         | Decrementa _dest_           |  X  |  -  |  X  |  X  |  -  |

### Instrucciones lógicas

| Instrucción                 | Comentario                              | `Z` | `C` | `S` | `O` | `I` |
| :-------------------------- | :-------------------------------------- | :-: | :-: | :-: | :-: | :-: |
| [`AND dest, fuente`](./and) | Operación _dest_ AND _fuente_ bit a bit |  X  |  0  |  X  |  0  |  -  |
| [`OR dest, fuente`](./or)   | Operación _dest_ OR _fuente_ bit a bit  |  X  |  0  |  X  |  0  |  -  |
| [`XOR dest, fuente`](./xor) | Operación _dest_ XOR _fuente_ bit a bit |  X  |  0  |  X  |  0  |  -  |
| [`NOT dest`](./not)         | Operación NOT _dest_ bit a bit          |  X  |  0  |  X  |  0  |  -  |

### Instrucciones de transferencia de control

| Instrucción               | Acción                                      | `Z` | `C` | `S` | `O` | `I` |
| :------------------------ | :------------------------------------------ | :-: | :-: | :-: | :-: | :-: |
| [`JMP etiqueta`](./jmp)   | Salta incondicionalmente a _etiqueta_       |  -  |  -  |  -  |  -  |  -  |
| [`JZ etiqueta`](./jz)     | Salta a _etiqueta_ si `Z=1`                 |  -  |  -  |  -  |  -  |  -  |
| [`JC etiqueta`](./jc)     | Salta a _etiqueta_ si `C=1`                 |  -  |  -  |  -  |  -  |  -  |
| [`JNC etiqueta`](./jnc)   | Salta a _etiqueta_ si `C=0`                 |  -  |  -  |  -  |  -  |  -  |
| [`JNZ etiqueta`](./jnz)   | Salta a _etiqueta_ si `Z=0`                 |  -  |  -  |  -  |  -  |  -  |
| [`JS etiqueta`](./js)     | Salta a _etiqueta_ si `S=1`                 |  -  |  -  |  -  |  -  |  -  |
| [`JNS etiqueta`](./jns)   | Salta a _etiqueta_ si `S=0`                 |  -  |  -  |  -  |  -  |  -  |
| [`JO etiqueta`](./jo)     | Salta a _etiqueta_ si `O=1`                 |  -  |  -  |  -  |  -  |  -  |
| [`JNO etiqueta`](./jno)   | Salta a _etiqueta_ si `O=0`                 |  -  |  -  |  -  |  -  |  -  |
| [`CALL etiqueta`](./call) | Llama a subrutina cuyo inicio es _etiqueta_ |  -  |  -  |  -  |  -  |  -  |
| [`INT N`](./int)          | Ejecuta la interrupción por software _N_    |  -  |  -  |  -  |  -  |  0  |

### Instrucciones de control

| Instrucción      | Comentario                              | `Z` | `C` | `S` | `O` | `I` |
| :--------------- | :-------------------------------------- | :-: | :-: | :-: | :-: | :-: |
| [`HLT`](./hlt)   | Detiene la ejecución                    |  -  |  -  |  -  |  -  |  -  |
| [`RET`](./ret)   | Retorna de la subrutina                 |  -  |  -  |  -  |  -  |  -  |
| [`IRET`](./iret) | Retorna de la rutina de interrupción    |  X  |  X  |  X  |  X  |  X  |
| [`CLI`](./cli)   | Inhabilita interrupciones enmascarables |  -  |  -  |  -  |  -  |  0  |
| [`STI`](./sti)   | Habilita interrupciones enmascarables   |  -  |  -  |  -  |  -  |  1  |
