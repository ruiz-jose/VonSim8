---
title: "CPU: Conceptos generales"
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/cpu.png }
---

El procesador que utiliza este entorno de simulación está basado en el **Intel 8088**. Puede ver más sobre la arquitectura original del mismo en su [hoja de especificaciones](https://www.ceibo.com/eng/datasheets/Intel-8088-Data-Sheet.pdf).

El mismo se caracteriza principalmente por poder hacer operaciones de 8 y 16 bits, siendo las últimas del tipo _little-endian_.

## Puertos

El procesador cuenta con los siguientes puertos:

- 8 bits de direcciones de memoria (bus de direcciones, con su respectivo _buffer_ `MAR`)
- 8 bits de datos (bus de datos, con su respectivo _buffer_ `MBR`)
- 1 bit para la señal de lectura (`RD`)
- 1 bit para la señal de escritura (`WR`)
- 1 bit para indicar si la escritura es a [memoria principal](/VonSim8/docs/memory/) o a un módulo de [entrada/salida](/VonSim8/docs/io/modules/) (`IO/M`, siendo `1` para E/S)
- 1 bit para la petición de interrupción (`INTR`)
- 1 bit para la señal de _acknowledge_ de interrupción (`INTA`)

## Registros

El procesador cuenta con cuatro registros de propósito general de 8 bits: `AL`, `BL`, `CL` y `DL`. Además, para el funcionamiento de la [pila](#pila), cuenta con un registro `SP` (_stack pointer_) de 8 bits. Estos registros pueden ser accedidos por el usuario.

Dentro de los registros internos que no pueden ser accedidos por el usuario, se encuentra el registro [`FLAGS`](#flags) (_flags register_, 8 bits), el `IP` (_instruction pointer_, 8 bits) que almacena la dirección de la próxima instrucción a ejecutar, el `IR` (_instruction register_, 8 bits) que almacena el byte de la instrucción que se está analizando/decodificando en un instante dado, y el `MAR` (_memory address register_, 8 bits) que almacena la dirección de memoria que se quiere propagar por el bus de direcciones, y el `MBR` (_memory buffer register_, 8 bits) que almacena el byte que se quiere propagar o se ha recibido por el bus de datos.

Hay además algunos registros internos que sirven de intermediarios para realizar ejecutar instrucciones, como pueden ser el `id` para almacenar un dato temporal.

## ALU

La ALU (_Arithmetic Logic Unit_) permite realizar operaciones aritméticas y lógicas de 8 y 16 bits. Las operaciones disponibles son: [`ADD`](/VonSim8/VonSim8/docs/cpu/instructions/add/), [`ADC`](/VonSim8/docs/cpu/instructions/adc/), [`INC`](/VonSim8/docs/cpu/instructions/inc/), [`SUB`]/VonSim8/docs/cpu/instructions/sub/), [`SBB`](/VonSim8/docs/cpu/instructions/sbb/), [`DEC`](/VonSim8/docs/cpu/instructions/dec/), [`NEG`](/VonSim8/docs/cpu/instructions/neg/), [`NOT`](/VonSim8/docs/cpu/instructions/not/), [`AND`](/VonSim8/docs/cpu/instructions/and/) y [`OR`](/VonSim8/docs/cpu/instructions/or/). Todas estas operaciones modifican el registro `FLAGS`.

### Flags

El registro `FLAGS` es un registro de 16 bits que contiene las _flags_ mostradas en la siguiente tabla. Este registro no es directamente accesible por el usuario, pero puede ser modificado por las operaciones de la ALU y pueden realizarse saltos condicionales en base a sus valores.

| Bit # | Abreviatura | Descripción            |
| :---: | :---------: | :--------------------- |
|   0   |    `CF`     | _Flag_ de acarreo      |
|   2   |    `ZF`     | _Flag_ de cero         |
|   3   |    `SF`     | _Flag_ de signo        |
|   4   |    `IF`     | _Flag_ de interrupción |
|   7   |    `OF`     | _Flag_ de overflow     |

El resto de bits están reservados / no se utilizan.

## Pila

El procesador implementa la pila como método de almacenamiento accesible por el usuario y por la misma CPU para su correcto funcionamiento. Esta es del estilo _Last In, First Out_ (LIFO), es decir, el último elemento en entrar es el primero en salir. La pila se encuentra en la memoria principal, comenzando en la dirección más alta de la misma (`FFh`) y creciendo hacia las direcciones más bajas (`FEh`, `FCh`, etc.). El tope de la pila se guarda en el registro `SP`. Todos los elementos de la pila son de 8 bits.

## Subrutinas

El procesador también implementa subrutinas. Estas son pequeños fragmentos de código que pueden ser llamados desde cualquier parte del programa. Para ello, se utiliza la instrucción [`CALL`](/VonSim8/docs/cpu/instructions/call/). Esta instrucción almacena el `IP` en la [pila](#pila), y luego realiza un salto a la dirección de la subrutina, modificando el `IP` para que este apunte a la primera instrucción de la subrutina. Para volver de la subrutina, se utiliza la instrucción [`RET`](/VonSim8/docs/cpu/instructions/ret/), que desapila la dirección apilada previamente por `CALL` y restaura el `IP`, volviendo a el punto de ejecución posterior a la llamada a la subrutina.

Ejemplo de subrutina:

```vonsim
      mov al, 1
      mov bl, 2
      mov cl, 3
      call sum3
      ; ax = 6
      hlt


; suma al, bl y cl
sum3: add al, bl
      add al, cl
      ret

```

## Interrupciones

El procesador admite interrupciones por hardware y por software, que pueden ser emitidas por el [PIC](/VonSim8/docs/io/modules/pic/) o por la instrucción [`INT`](/VonSim8/docs/cpu/instructions/int/) respectivamente. Para ejecutar interrupciones por hardware, el proesador debe estar habilitado para recibir interrupciones. Esto es, `IF=1` (la _flag_ de interrupciones activada).

Ambas interrupciones deben propocionar un número de interrupción. En el caso de las interrupciones por software, esta es dada por el operando de la instrucción `INT` ([ver más](/VonSim8/docs/cpu/instructions/int/)). En el caso de las interrupciones por hardware, esta es dada por el PIC ([ver cómo se obtiene](/VonSim8/docs/io/modules/pic/#funcionamiento)). El número de interrupción debe ser un número entre `0` y `255`.

Una vez interrumpido, el procesador ejecutará la rutina de interrupción asociada a ese número de interrupción. La dirección de comienzo de esta rutina estará almacenada en el vector de interrupciones. Este vector ocupa las celdas `00h` hasta `0Fh` de la memoria principal, y cada elemento del vector tiene 1 byte de largo y se corresponde con la dirección de inicio de la rutina de interrupción.

Específicamente, el procesador:

1. obtiene el número de la interrupción (00-0Fh),
2. apila el registro [`FLAGS`](#flags),
3. inhabilita las interrupciones (`IF=0`),
4. apila el registro `IP`,
5. obtiene la dirección de la rutina de interrupción del vector de interrupciones,
6. modifica el `IP` para que apunte a la dirección de la rutina de interrupción.

Y así se comienza a ejecutar la rutina de interrupción. Estas tienen el mismo formato que una [subrutina](#subrutinas) salvo que terminan en [`IRET`](/VonSim8/docs/cpu/instructions/iret/) en vez de [`RET`](/VonSim8/docs/cpu/instructions/ret/).

### Llamadas al sistema

El simulador permite realizar llamadas al sistema o _syscalls_. En el simulador, estas llamadas son realizadas idénticamente a las interrupciones. Así, para realizar una _syscall_ basta con interrumpir a la CPU con el número de interrupción correspondiente. Estos números son:

- `INT 0`: termina la ejecución del programa, equivalente a la instrucción [`HLT`](/VonSim8/docs/cpu/instructions/hlt/);
- `INT 3`: incia el modo de depuración (_breakpoint_);
- `INT 6`: lee un carácter del [teclado](/VonSim8/docs/io/devices/keyboard/);
- `INT 7`: escribe una cadena de caracteres en [pantalla](/VonSim8/docs/io/devices/screen/).

Las direcciones del vector de interrupciones asociadas a estos números están protegidas por el sistema, impidiendo que el usuario las modifique.

El contenido de estas rutinas se encuentran almacenadas en el [monitor del sistema](/VonSim8/docs/memory/) en las direcciones `A0h`, `B0h`, `C0h` y `D0h` respectivamente.

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
