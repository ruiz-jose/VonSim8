---
title: Ciclo de instrucción
head:
  - tag: meta
    attrs:
      { property: og:image, content: https://vonsim.github.io/VonSim8/docs/og/codification.png }
---

## Ciclo de la instrucción: Etapas de captación y ejecución

Este apartado describe en detalle el proceso llevado a cabo por la Unidad de Control (UC) para ejecutar cada instrucción, destacando los siguientes aspectos:

- Secuencia de pasos.
- Registros involucrados en cada etapa del proceso.
- Uso de los buses de datos, direcciones y control.
- Señales de control generadas.

El ciclo de la instrucción se define como la secuencia de microoperaciones que tienen lugar durante la ejecución de una instrucción en el sistema. Estas operaciones se describen utilizando un lenguaje de transferencia entre registros, de la forma:

`destino` ← `origen`

#### Etapa de Captación:

En esta etapa, común a todas las instrucciones, se realiza la lectura de la instrucción desde la memoria.

1. **`MAR` ← `IP`**:
   El contenido del registro puntero de instrucciones `IP` se transfiere al registro de direcciones de memoria `MAR`. La UC genera la señal necesaria para seleccionar el valor del `IP` y copiarlo en el `MAR`.
2. **`MDR` ← `read(Memoria[MAR])` ; `IP` ← `IP` + 1**:
   La UC activa la señal de lectura (read) hacia la memoria, utilizando el valor del `MAR` como dirección. El dato leído se transfiere al Registro de Datos de Memoria `MBR` a través del bus de datos. Simultáneamente, el `IP` se incrementa en 1 para apuntar al siguiente byte.
3. **`IR` ← `MBR`**:
   El contenido del `MBR` se transfiere al Registro de Instrucciones `IR`, completando la etapa de captación.

#### Etapa de Ejecución:

En esta etapa, las operaciones específicas dependen del tipo de instrucción. A continuación, se describen algunos casos representativos:

- MOV `Rx`, `Ry` (Copiar entre registros)
  1. **`Rx` ← `Ry`**:
     El contenido del registro `Ry` se copia en el registro `Rx`.

- MOV `Rx`, `[Dirección]` (Cargar a registro)
  1. **`MAR` ← `IP`**:
     El valor del `IP` se transfiere a `MAR`.
  2. **`MBR` ← `read(Memoria[MAR])`; `IP` ← `IP` + 1**:
     Se lee (read) de memoria el contenido de la dirección indicada por `MAR` y se almacena en `MBR`.Simultáneamente, el `IP` se incrementa.
  3. **`MAR` ← `MBR`**:
     El contenido de `MBR` se transfiere a `MAR`.
  4. **`MBR` ← `read(Memoria[MAR])`**:
     Se lee de memoria el contenido de la dirección indicada por `MAR` y se almacena en `MBR`.
  5. **`Rx` ← `MBR`**:
     El contenido del `MBR` se copia al registro `Rx`.

- MOV `[Dirección]`, `Ry` (Almacenar en memoria)  
  1, 2, 3. Igual que MOV `Rx`, `[Dirección]`. 4. **`MBR` ← `Ry`**:
  El contenido de `Ry` se transfiere a `MBR`. 5. **`write(Memoria[MAR])` ← `MBR`**:
  El contenido de `MBR` se escribe (write) en memoria en la dirección apuntada por el `MAR`.

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
