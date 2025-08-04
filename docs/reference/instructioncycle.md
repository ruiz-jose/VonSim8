# Ciclo de instrucción

Este apartado describe en detalle el proceso llevado a cabo por la Unidad de Control (UC) para ejecutar cada instrucción, destacando los siguientes aspectos:

- Secuencia de pasos.
- Registros involucrados en cada etapa del proceso.
- Uso de los buses de datos, direcciones y control.
- Señales de control generadas.

El ciclo de la instrucción se define como la secuencia de microoperaciones que tienen lugar durante la ejecución de una instrucción en el sistema. Estas operaciones se describen utilizando un lenguaje de transferencia entre registros, de la forma:

`destino` ← `origen`

La visualización del ciclo de instrucción se basa en el modelo RTL (Register Transfer Level), mostrando el desplazamiento de datos y las señales de control en cada fase. Esto facilita la comprensión de las microoperaciones internas y la interacción entre los componentes del procesador.
## Etapa de Captación: 
En esta etapa, común a todas las instrucciones, consiste en la lectura de la instrucción desde la memoria.

1. **`MAR` $\leftarrow$ `IP`**:
La Unidad de Control (UC) transfiere el contenido del registro puntero de instrucciones (`IP`) al registro de direcciones de memoria (`MAR`). Este paso prepara el sistema para acceder a la posición de memoria donde se encuentra la próxima instrucción.
2. **`MBR` $\leftarrow$ `read(Memoria[MAR])` ; `IP` $\leftarrow$ `IP` + 1**:
La UC activa la señal de lectura para obtener el contenido de la memoria en la dirección especificada por el (`MAR`). El dato leído se transfiere al registro de datos de memoria (`MBR`) mediante el bus de datos. Simultáneamente, el registro (`IP`) se incrementa en uno, apuntando así a la siguiente instrucción en memoria u operando de la instrucción vigente.
3. **`IR` $\leftarrow$ `MBR`**:
Finalmente, el contenido del registro de datos de memoria (`MBR`) se copia en el registro de instrucciones (`IR`). Con este paso, la instrucción ha sido captada y está lista para ser decodificada y ejecutada. 

La etapa de captación tiene 3 ciclos para todas las instrucciones.

### Etapa de Ejecución:
En esta etapa, las operaciones específicas dependen del tipo de instrucción. A continuación, se describen algunos casos representativos:

Instruccion de transferencia de datos MOV
#### Destino registro
* MOV `Rx`, `Ry` (Entre registros)
  4. **`Rx` $\leftarrow$ `Ry`**: El valor almacenado en Ry se copia en el registro Rx.

* MOV `Rx`, `[Dirección]` (Directo)
  4. **`MAR` $\leftarrow$ `IP`**: El contenido de IP se transfiere al registro MAR.
  5. **`MBR` $\leftarrow$ `read(Memoria[MAR])`; `IP` $\leftarrow$ `IP` + 1**: Se lee el dato de la memoria en la dirección indicada por MAR y se almacena en MBR; luego, IP se incrementa en uno.  
  6. **`MAR` $\leftarrow$ `MBR`**: El valor de MBR se transfiere a MAR.
  7. **`MBR` $\leftarrow$ `read(Memoria[MAR])`**: Se lee el dato de la memoria en la nueva dirección de MAR y se almacena en MBR.
  8. **`Rx`  $\leftarrow$ `MBR`**: Finalmente, el contenido de MBR se copia en el registro Rx.

* MOV `Rx`, `Dato` (Inmediato)
  4. 5. Se obtiene el operando de la instrucción.
  6. **`Rx`  $\leftarrow$ `MBR`**: El contenido de MBR se transfiere al registro Rx.

* MOV `Rx`, `[BL]` (Indirecto) 
  4. **`MAR` $\leftarrow$ `BL`**: El contenido de BL se transfiere al registro MAR.
  5. **`MBR` $\leftarrow$ `read(Memoria[MAR])`**: Se lee el dato de la memoria en la dirección indicada por MAR y se almacena en MBR.
  6. **`Rx`  $\leftarrow$ `MBR`**: Finalmente, el contenido de MBR se copia en el registro Rx.

  #### Destino Memoria
* MOV `[Dirección]`, `Ry` (Directo)     
  4. 5. Se obtiene el operando de la instrucción.
  6. **`MAR` $\leftarrow$ `MBR`**: El valor de MBR se transfiere al registro MAR.
  7. **`MBR` $\leftarrow$ `Ry`**: El contenido de Ry se copia en MBR.
  8. **`write(Memoria[MAR])` $\leftarrow$ `MBR`**: Se escribe el valor de MBR en la posición de memoria indicada por MAR.

* MOV `[BL]`, `Ry` (Indirecto)     
  4. **`MAR` $\leftarrow$ `BL`**: El contenido de BL se transfiere al registro MAR.
  5. **`MBR` $\leftarrow$ `Ry`**: El contenido de Ry se copia en MBR.
  6. **`write(Memoria[MAR])` $\leftarrow$ `MBR`**: Se escribe el valor de MBR en la posición de memoria indicada por MAR.

* MOV `[Dirección]`, `Dato` (Inmediato)     
  4. 5. Se obtiene el operando de la instrucción.
  6. **`MAR` $\leftarrow$ `IP`;`ri` $\leftarrow$ `MBR`**: El contenido de IP se transfiere al registro MAR y simultaneamente se transfiere el valor de MBR a un registro intermedio (ri) .  
  7. **`MBR` $\leftarrow$ `read(Memoria[MAR])`; `IP` $\leftarrow$ `IP` + 1**: Se lee el dato de la memoria en la dirección indicada por MAR y se almacena en MBR; luego, IP se incrementa en uno.  
  8. **`MAR` $\leftarrow$ `ri`**: El contenido de ri se transfiere al registro MAR.
  9. **`write(Memoria[MAR])` $\leftarrow$ `MBR`**: Se escribe el valor de MBR en la posición de memoria indicada por MAR.

* MOV `[BL]`, `Dato` (Inmediato)     
  4. 5. Se obtiene el operando de la instrucción.
  6. **`MAR` $\leftarrow$ `BL`**: El contenido de BL se transfiere al registro MAR.
  7. **`write(Memoria[MAR])` $\leftarrow$ `MBR`**: Se escribe el valor de MBR en la posición de memoria indicada por MAR.

  

- ADD `Rx`, `[Dirección]` (Sumar a registro)
  1, 2, 3, 4. Igual que MOV `Rx`, `[Dirección]`. 5. **`Rx` ← `Rx` + `MBR`**:
  La Unidad Aritmético-Lógica (ALU) realiza la suma entre `Rx` y `MBR`, almacenando el resultado en `Rx`. El Registro de Estado `RS` se actualiza con los indicadores correspondientes.

- SUB `[Dirección]`, `Ry` (Restar a memoria)
  1, 2, 3, 4. Igual que MOV `Rx`, `[Dirección]`. 5. **`MBR` ← `Ry` - `MBR`**:
  La ALU resta el contenido de `MBR` al de `Ry`, almacenando el resultado en `MBR`. El `RS` se actualiza. 6. **`write(Memoria[MAR])` ← `MBR`**:
  El contenido de `MBR` se escribe en memoria en la dirección apuntada por el `MAR`.

- CMP `Rx`, `[Dirección]` (Comparar a registro)
  1, 2, 3, 4. Igual que MOV `Rx`, `[Dirección]`. 5. **`Rx` - `MBR`**:
  La ALU realiza la resta entre el contenido de `Rx` y `MBR`. Aunque el resultado no se almacena, el `RS` se actualiza con los indicadores de comparación.

- JMP `Dirección` (Salto incondicional)
  1, 2. Igual que MOV `Rx`, `[Dirección]`. 3. **`IP` ← `MBR`**:
  El contenido del `MBR` se transfiere al registro `IP`, estableciendo la nueva dirección de ejecución.
