# CPU

El procesador que utiliza este entorno de simulación está basado en el **Intel 8088**.

> **Referencia:** Consulta la [hoja de especificaciones del Intel 8088](https://www.ceibo.com/eng/datasheets/Intel-8088-Data-Sheet.pdf) para más detalles sobre la arquitectura original.

:::warning[Simplificaciones]
VonSim8 no busca ser un emulador fiel del 8088, sino una herramienta educativa. Por eso, se han hecho varias simplificaciones respecto al procesador real: el set de instrucciones es más pequeño, la memoria es limitada y la codificación es más simple.
:::

## Puertos

El procesador cuenta con los siguientes puertos:

- 8 bits de direcciones de memoria (bus de direcciones, con su respectivo _buffer_ `MAR`)
- 8 bits de datos (bus de datos, con su respectivo _buffer_ `MBR`)
- 1 bit para la señal de lectura (`RD`)
- 1 bit para la señal de escritura (`WR`)
- 1 bit para indicar si la escritura es a [memoria principal](./memory) o a un módulo de [entrada/salida](../io/modules/index) (`IO/M`, siendo `1` para E/S)
- 1 bit para la petición de interrupción (`INTR`)
- 1 bit para la señal de _acknowledge_ de interrupción (`INTA`)

## Registros

- Cuatro registros multipropósito de 8 bits (`AL`, `BL`, `CL`, `DL`).
- Registro de pila (`SP`) y registros internos (`FLAGS`, `IP`, `IR`, `MAR`, `MBR`, `id`, `ri`).

Los registros de proposito general pueden ser accedidos y modificados por el programador. Los internos son gestionados por la CPU.

El procesador cuenta con cuatro registros de propósito general de 8 bits: `AL`, `BL`, `CL` y `DL`. Además, para el funcionamiento de la [pila](#pila), cuenta con un registro `SP` (_stack pointer_) de 8 bits. Estos registros pueden ser accedidos por el usuario.

Dentro de los registros internos que no pueden ser accedidos por el usuario, se encuentra el registro [`FLAGS`](#flags) (_flags register_, 8 bits), el `IP` (_instruction pointer_, 8 bits) que almacena la dirección de la próxima instrucción a ejecutar, el `IR` (_instruction register_, 8 bits) que almacena el byte de la instrucción que se está analizando/decodificando en un instante dado, y el `MAR` (_memory address register_, 8 bits) que almacena la dirección de memoria que se quiere propagar por el bus de direcciones, y el `MBR` (_memory buffer register_, 8 bits) que almacena el byte que se quiere propagar o se ha recibido por el bus de datos.

Hay además algunos registros internos que sirven de intermediarios para realizar ejecutar instrucciones, como pueden ser el `ri` para almacenar una dirección temporal, el `id` para almacenar un dato temporal.

## ALU

La ALU (_Arithmetic Logic Unit_) permite realizar operaciones aritméticas y lógicas de 8 bits. Las operaciones disponibles son: [`ADD`](./instructions/add), [`ADC`](./instructions/adc), [`INC`](./instructions/inc), [`SUB`](./instructions/sub), [`SBB`](./instructions/sbb), [`DEC`](./instructions/dec), [`NEG`](./instructions/neg), [`NOT`](./instructions/not), [`AND`](./instructions/and) y [`OR`](./instructions/or). Todas estas operaciones modifican el registro `FLAGS`.

### Flags

El registro `FLAGS` es un registro de 8 bits que contiene las _flags_ mostradas en la siguiente tabla. Este registro no es directamente accesible por el usuario, pero puede ser modificado por las operaciones de la ALU y pueden realizarse saltos condicionales en base a sus valores.

| Bit # | Abreviatura | Descripción            |
| :---: | :---------: | :--------------------- |
|   0   |    `CF`     | _Flag_ de acarreo      |
|   6   |    `ZF`     | _Flag_ de cero         |
|   7   |    `SF`     | _Flag_ de signo        |
|   9   |    `IF`     | _Flag_ de interrupción |
|  11   |    `OF`     | _Flag_ de overflow     |

El resto de bits están reservados / no se utilizan.

## Pila

El procesador implementa la pila como método de almacenamiento accesible por el usuario y por la misma CPU para su correcto funcionamiento. Esta es del estilo _Last In, First Out_ (LIFO), es decir, el último elemento en entrar es el primero en salir. La pila se encuentra en la memoria principal, comenzando en la dirección más alta de la misma (`FFh`) y creciendo hacia las direcciones más bajas (`FEh`, `FCh`, etc.). El tope de la pila se guarda en el registro `SP`. Todos los elementos de la pila son de 8 bits.

## Subrutinas

El procesador también implementa subrutinas. Estas son pequeños fragmentos de código que pueden ser llamados desde cualquier parte del programa. Para ello, se utiliza la instrucción [`CALL`](./instructions/call). Esta instrucción almacena el `IP` en la [pila](#pila), y luego realiza un salto a la dirección de la subrutina, modificando el `IP` para que este apunte a la primera instrucción de la subrutina. Para volver de la subrutina, se utiliza la instrucción [`RET`](./instructions/ret), que desapila la dirección apilada previamente por `CALL` y restaura el `IP`, volviendo a el punto de ejecución posterior a la llamada a la subrutina.

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

El procesador admite interrupciones por hardware y por software, que pueden ser emitidas por el [PIC](../io/modules/pic) o por la instrucción [`INT`](./instructions/int) respectivamente. Para ejecutar interrupciones por hardware, el procesador debe estar habilitado para recibir interrupciones. Esto es, `IF=1` (la _flag_ de interrupciones activada).

Ambas interrupciones deben propocionar un número de interrupción. En el caso de las interrupciones por software, esta es dada por el operando de la instrucción `INT` ([ver más](./instructions/int)). En el caso de las interrupciones por hardware, esta es dada por el PIC ([ver cómo se obtiene](../io/modules/pic#funcionamiento)). El número de interrupción debe ser un número entre `0` y `7`.

Una vez interrumpido, el procesador ejecutará la rutina de interrupción asociada a ese número de interrupción. La dirección de comienzo de esta rutina estará almacenada en el vector de interrupciones. Este vector ocupa las celdas `00h` hasta `07h` de la memoria principal, y cada elemento del vector tiene 1 byte de largo -- el primer elemento se encuentra en `0h`, el segundo en `1h`, el tercero en `2h`, y así. Cada elemento corresponde con la dirección de inicio de la rutina de interrupción.

Específicamente, el procesador:

1. obtiene el número de la interrupción (0-7),
2. apila el registro [`FLAGS`](#flags),
3. inhabilita las interrupciones (`IF=0`),
4. apila el registro `IP`,
5. obtiene la dirección de la rutina de interrupción del vector de interrupciones,
6. modifica el `IP` para que apunte a la dirección de la rutina de interrupción.

Y así se comienza a ejecutar la rutina de interrupción. Estas tienen el mismo formato que una [subrutina](#subrutinas) salvo que terminan en [`IRET`](./instructions/iret) en vez de [`RET`](./instructions/ret).

### Llamadas al sistema

El simulador permite realizar llamadas al sistema o _syscalls_. En el simulador, estas llamadas son realizadas idénticamente a las interrupciones. Así, para realizar una _syscall_ basta con interrumpir a la CPU con el número de interrupción correspondiente. Estos números son:

- `INT 0`: termina la ejecución del programa, equivalente a la instrucción [`HLT`](./instructions/hlt);
- `INT 6`: lee un carácter del [teclado](../io/devices/keyboard);
- `INT 7`: escribe una cadena de caracteres en [pantalla](../io/devices/screen).

Las direcciones del vector de interrupciones asociadas a estos números están protegidas por el sistema, impidiendo que el usuario las modifique.

El contenido de estas rutinas se encuentran almacenadas en el [monitor del sistema](./memory) en las direcciones `A0h`, `B0h` y `C0h` respectivamente.
