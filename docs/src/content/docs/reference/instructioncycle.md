---
title: Ciclo de instrucción
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/codification.png }
---

# Ciclo de la instrucción (Etapas de captación y ejecución)

Utilizando el repertorio de instrucciones proporcionado, y empleando el simulador VonSim8 en modo de ejecución por ciclo (tecla F7).

Se busca detallar los pasos que realiza la unidad de control para ejecutar cada una de las instrucciones, nombrando los:

- Secuencia de pasos.
- Registros involucrados en cada paso del proceso.
- Buses que intervienen (Datos, direcciones y control).
- Señales de control que se envían.
- Considere que el CPU tiene una unidad de control microprogramada, como interviene en la ejecución de la instrucción.

  
## Etapa de captación (*)

  1. **MAR ← IP**: El contenido del registro de instrucciones (IP) se transfiere al registro de direcciones de memoria (MAR). La unidad de control (UC) envía la señal para seleccionar el dato del IP y da la orden para que este valor se copie en el MAR.

  2. **MBR ← read(Memoria[MAR]); IP ← IP + 1**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). Al mismo tiempo, el IP se incrementa en 1 para apuntar a la siguiente byte.

  3. **IR  ← MBR**: La instrucción almacenada en el MBR se transfiere al registro de instrucciones (IR). La UC emite la señal para seleccionar el dato del MBR y ordena que este valor se copie al IR.
  
(*): Todas las instrucciones tienen los mismos pasos en la etapa de captación.

## Etapa de Ejecución

### `MOV rx, ry`  (Copiar entre registros)

  1. **Rx ← Ry**: El contenido del registro (Ry) se copia al registro (Rx). La unidad de control (UC) envía la señal para seleccionar el dato del Ry para luego dar la orden para que este dato se copie en el Rx.

### `MOV Rx,  [Dirección]`  (Cargar a registro)

  1. **MAR ← IP**: El contenido del registro de instrucciones (IP) se transfiere al registro de direcciones de memoria (MAR). La unidad de control (UC) envía la señal para seleccionar el dato del IP y da la orden para que este valor se copie en el MAR.

  2. **MBR ← read(Memoria[MAR]); IP ← IP + 1**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). Al mismo tiempo, el IP se incrementa en 1 para apuntar a la siguiente byte. (Obtener byte 2) 

  3. **MAR  ← MBR**: La instrucción almacenada en el MBR se transfiere al registro MAR. La UC emite la señal para seleccionar el dato del MBR y ordena que este valor se copie al MAR.

  4. **MBR ← read(Memoria[MAR])**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). (Obtener operando)

  5. **Rx  ← MBR**: La instrucción almacenada en el MBR se transfiere al registro Rx. La UC emite la señal para seleccionar el dato del MBR y ordena que este valor se copie al Rx.


### `MOV  [Dirección], Ry`  (Almacenar en memoria)
    
  1. **MAR ← IP**: El contenido del registro de instrucciones (IP) se transfiere al registro de direcciones de memoria (MAR). La unidad de control (UC) envía la señal para seleccionar el dato del IP y da la orden para que este valor se copie en el MAR.

  2. **MBR ← read(Memoria[MAR]); IP ← IP + 1**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). Al mismo tiempo, el IP se incrementa en 1 para apuntar a la siguiente byte. (Obtener byte 2) 

  3. **MAR  ← MBR**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR).

  4. **MBR ← Ry**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). (Obtener operando)

  5. **write(Memoria[MAR]) ←  MBR**: La UC emite la señal de escritura (write) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria graba el contenido del que viene por el bus de datos en la direccion que se envia por el bus de direcciones.

### `ADD Rx,  [Dirección]`  (Rx = Rx + [M])

  1. **MAR ← IP**: El contenido del registro de instrucciones (IP) se transfiere al registro de direcciones de memoria (MAR). La unidad de control (UC) envía la señal para seleccionar el dato del IP y da la orden para que este valor se copie en el MAR.

  2. **MBR ← read(Memoria[MAR]); IP ← IP + 1**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). Al mismo tiempo, el IP se incrementa en 1 para apuntar a la siguiente byte. (Obtener byte 2) 

  3. **MAR  ← MBR**: La instrucción almacenada en el MBR se transfiere al registro MAR. La UC emite la señal para seleccionar el dato del MBR y ordena que este valor se copie al MAR.

  4. **MBR ← read(Memoria[MAR])**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). (Obtener operando)

### `SUB [Dirección], Ry`  ([M] = [M] - Ry)

  1. **MAR ← IP**: El contenido del registro de instrucciones (IP) se transfiere al registro de direcciones de memoria (MAR). La unidad de control (UC) envía la señal para seleccionar el dato del IP y da la orden para que este valor se copie en el MAR.

  2. **MBR ← read(Memoria[MAR]); IP ← IP + 1**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). Al mismo tiempo, el IP se incrementa en 1 para apuntar a la siguiente byte. (Obtener byte 2) 

  3. **MAR  ← MBR**: La instrucción almacenada en el MBR se transfiere al registro MAR. La UC emite la señal para seleccionar el dato del MBR y ordena que este valor se copie al MAR.

  4. **MBR ← read(Memoria[MAR])**: La UC emite la señal de lectura (read) a la memoria, que utiliza el valor del MAR como dirección a través del bus de direcciones. La memoria devuelve el contenido de esa dirección a través del bus de datos. La UC ordena que este dato se almacene en el registro de datos de memoria (MBR). (Obtener operando)
