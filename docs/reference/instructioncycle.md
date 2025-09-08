# Ciclo de la instrucción

El ciclo de la instrucción es la secuencia de pasos que realiza la **Unidad de Control (UC)** para ejecutar cada instrucción de un programa. Este proceso es fundamental para el funcionamiento de cualquier computadora, ya que involucra elementos clave como registros, buses de datos, direcciones y señales de control generadas por la UC.

Las microoperaciones se expresan mediante la notación de transferencia entre registros:

<div style="text-align:center;">
destino ← origen
</div>

<div style="text-align:center;">
<img src="/images/cicloinstruccion3.png" alt="Flujo del ciclo de instrucción en VonSim8" style="max-width:85%;" />
</div>

El ciclo se divide en dos etapas principales: **captación (fetch)** y **ejecución**.

---

## Etapa 1: Captación

Esta etapa es igual para todas las instrucciones. Su objetivo es leer la instrucción desde la memoria y cargarla en el **Registro de Instrucciones** (`IR`). Consta de tres microoperaciones:

1. **`MAR` ← `IP`**  
   La UC transfiere al **Registro de Direcciones de Memoria** (`MAR`) la dirección de la próxima instrucción, almacenada en el **Puntero de Instrucción** (`IP`).
2. **`MBR` ← read(Memoria[`MAR`])** | **`IP` ← `IP` + 1**  
   La UC activa la señal de lectura para leer la instrucción ubicada en la dirección contenida en el `MAR`. El valor leído se guarda en el **Registro de Datos de Memoria** (`MBR`) y, al mismo tiempo, el `IP` se incrementa para apuntar a la siguiente instrucción u operando.
3. **`IR` ← `MBR`**  
   El contenido del `MBR` se transfiere al `IR`, dejando la instrucción lista para ser decodificada y ejecutada.

---

## Etapa 2: Ejecución

En esta etapa, el **decodificador de instrucciones** interpreta el valor en el registro `IR`. A partir del código de operación, lee las microinstrucciones necesarias en la **memoria de control** para determinar el tipo de instrucción, la cantidad de operandos y el modo de direccionamiento.

Luego, estas microinstrucciones se envían al **secuenciador**, que genera las señales de control precisas para ejecutar la operación.

A continuación se detallan los ciclos para las instrucciones más comunes:

### Instrucciones con dos operandos: **MOV**, **ADD**, **SUB**, **CMP**

#### Destino en registro (`Rx`)

- **Modo entre registros (`Rx`, `Ry`)**

  4. La ejecución se realiza en un solo paso:
     - **MOV**: `Rx` ← `Ry`
     - **ADD**: `Rx` ← `Rx` + `Ry` | update(Flags)
     - **SUB**: `Rx` ← `Rx` - `Ry` | update(Flags)
     - **CMP**: `Rx` - `Ry` | update(Flags) *(solo actualiza flags)*

- **Modo directo (`Rx`, `[Dirección]`)**

  4. **`MAR` ← `IP`** — Obtener dirección del operando fuente.
  5. **`MBR` ← read(Memoria[`MAR`])** | **`IP` ← `IP` + 1** — Leer la dirección desde memoria e incrementar `IP`.
  6. **`MAR` ← `MBR`** — Transferir la dirección al `MAR`.
  7. **`MBR` ← read(Memoria[`MAR`])** — Obtener el dato.
  8. Ejecutar la operación:
     - **MOV**: `Rx` ← `MBR`
     - **ADD**: `Rx` ← `Rx` + `MBR` | update(Flags)
     - **SUB**: `Rx` ← `Rx` - `MBR` | update(Flags)
     - **CMP**: `Rx` - `MBR` | update(Flags) *(solo actualiza flags)*

- **Modo inmediato (`Rx`, `Dato`)**

  4. **`MAR` ← `IP`** — Obtener dirección del dato inmediato.
  5. **`MBR` ← read(Memoria[`MAR`])** | **`IP` ← `IP` + 1** — Leer el dato e incrementar `IP`.
  6. Ejecutar la operación (igual que en el caso anterior).

- **Modo indirecto (`Rx`, `[BL]`)**

  4. **`MAR` ← `BL`** — Obtener dirección del dato desde el registro `BL`.
  5. **`MBR` ← read(Memoria[MAR])** — Leer el dato.
  6. Ejecutar la operación (igual que en el caso anterior).

#### Destino en memoria (`[Dirección]` o `[BL]`)

En este caso, el resultado de la operación se almacena en una dirección de memoria especificada en la instrucción o indicada por el contenido del registro `BL`.

- **Modo directo (`[Dirección]`, `Ry`)**

  4. **`MAR` ← `IP`** — Obtener dirección destino.
  5. **`MBR` ← read(Memoria[`MAR`])** | **`IP` ← `IP` + 1** — Leer la dirección e incrementar `IP`.
  6. **`MAR` ← `MBR`** — Transferir dirección a `MAR`.

  Según la instrucción:

  **MOV**:

  7. **`Ry` ← `MBR`** — Copiar `Ry` al `MBR`.

  8. **write(Memoria[`MAR`]) ← `MBR`**  — Escribir en memoria.

  **ADD/SUB/CMP**:

  7. **`MBR` ← read(Memoria[`MAR`])** — Leer el dato.

  8. Ejecutar la operación:
     - **ADD**: `MBR` ← `MBR` + `Ry` | update(Flags)
     - **SUB**: `MBR` ← `MBR` - `Ry` | update(Flags)
     - **CMP**: `MBR` - `Ry` | update(Flags) **(solo actualiza flags)**

  9. Si es **ADD** o **SUB**: **write(Memoria[`MAR`]) ← `MBR`**  — Escribir en memoria.

- **Modo indirecto (`[BL]`, `Ry`)**

  4. **`MAR` ← `BL`** — Transferir dirección de destino (en `BL`) a `MAR`.

  Según la instrucción:


  **MOV**:

  5. **`MBR` ← `Ry`** — Copiar `Ry` al `MBR`.

  6. **write(Memoria[MAR]) ← `MBR`** — Escribir en memoria.

   **ADD/SUB/CMP**:

  5. **`MBR` ← read(Memoria[`MAR`])** — Leer el dato.

  6. **ADD/SUB/CMP**: Ejecutar la operación (igual que en el caso anterior).

  7. Si es **ADD** o **SUB**: **write(Memoria[`MAR`]) ← `MBR`** — Escribir en memoria.

- **Modo directo-inmediato (`[Dirección]`, `Dato`)**

  4. **`MAR` ← `IP`** — Obtener dirección destino.
  5. **`MBR` ← read(Memoria[MAR])** | **`IP` ← `IP` + 1** — Leer dirección e incrementar `IP`.
  6. **`MAR` ← `IP`** | **`ri` ← `MBR`** — Preparar para leer el dato y guardar la dirección destino en un registro intermedio (`ri`).
  7. **`MBR` ← read(Memoria[`MAR`])** | **`IP` ← `IP` + 1** — Leer dato e incrementar `IP`.

  Según la instrucción:


  **MOV**: 
  
  8. **`MAR` ← `ri`** — Copiar dirección destino.

  9. **write(Memoria[`MAR`]) ← `MBR`** — Escribir en memoria.

  **ADD/SUB/CMP**:

  8. **`MAR` ← `ri`** | **`id` ← `MBR`** — Cargar dirección destino y guardar el valor inmediato en `id`.

  9. **`MBR` ← read(Memoria[MAR])** — Leer el valor actual de destino.

  10. Ejecutar la operación:
     - **ADD**: `MBR` ← `MBR` + `id`  | update(Flags)
     - **SUB**: `MBR` ← `MBR` - `id` | update(Flags)
     - **CMP**: `MBR` - `id` | update(Flags) *(solo actualiza flags)*
  11. Si es **ADD** o **SUB**: **write(Memoria[`MAR`]) ← `MBR`** — Escribir en memoria.

- **Modo indirecto-inmediato (`[BL]`, `Dato`)**

  4. **`MAR` ← `IP`** — Obtener dirección del dato inmediato.
  5. **`MBR` ← read(Memoria[`MAR`])** | **`IP` ← `IP` + 1** — Leer dato e incrementar `IP`.

  Según la instrucción:


  **MOV**:

  6. **`MAR` ← `BL`** — Copiar dirección de destino.

  7. **write(Memoria[MAR]) ← `MBR`**

  **ADD/SUB/CMP**:

  6. **`MAR` ← `BL`** | **`id` ← `MBR`** — Cargar la dirección destino y guardar el valor inmediato en id.

  7. **`MBR` ← read(Memoria[MAR])** — Leer el valor actual de destino.

  8. Ejecutar la operación (igual que en el caso anterior).

  9. Si es **ADD** o **SUB**: **write(Memoria[`MAR`]) ← `MBR`** — Escribir en memoria.

---

### Instrucciones con un operando: **JMP**, **Jxx**

- **Salto a (`Dirección`)**

  4. **`MAR` ← `IP`** — Obtener la dirección del salto.
  5. **`MBR` ← read(Memoria[MAR])** | **`IP` ← `IP` + 1** — Leer la dirección de destino e incrementar `IP`.

  Según la instrucción:

  **JMP**:

  6. **`IP` ← `MBR`**

  **Jxx**:

  6. **`IP` ← `MBR`** si se cumple la condición del flag `xx`; en caso contrario, continúa con la siguiente instrucción.

---

### Instrucciones sin operandos

- **HLT**

  4. Detiene la ejecución de la CPU.