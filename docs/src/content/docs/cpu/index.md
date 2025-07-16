---
title: "CPU: Conceptos generales"
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/cpu.png }
---



# ¿Qué es la CPU de VonSim8?

La CPU de VonSim8 está inspirada en el procesador Intel 8088 y fue diseñada con fines didácticos para que puedas aprender arquitectura y organización de computadoras de manera sencilla y visual.

Permite realizar operaciones de 8 y 16 bits (_little-endian_) y simula los principales componentes de un microprocesador real.

## Características principales

- Cuatro registros multipropósito de 8 bits (`AL`, `BL`, `CL`, `DL`).
- Registro de pila (`SP`) y registros internos (`FLAGS`, `IP`, `IR`, `MAR`, `MBR`, `id`).
- Bus de direcciones y datos de 8 bits.
- Soporte para subrutinas, pila y llamadas al sistema (_syscalls_).
- Interrupciones por hardware y software.
- Múltiples dispositivos conectados (teclado, pantalla, etc.).

> **Referencia:** Consulta la [hoja de especificaciones del Intel 8088](https://www.ceibo.com/eng/datasheets/Intel-8088-Data-Sheet.pdf) para más detalles sobre la arquitectura original.

:::warning[Simplificaciones]
VonSim8 no busca ser un emulador fiel del 8088, sino una herramienta educativa. Por eso, se han hecho varias simplificaciones respecto al procesador real: el set de instrucciones es más pequeño, la memoria es limitada y la codificación es más simple.
:::



## Puertos

- `MAR`: Bus de direcciones (8 bits)
- `MBR`: Bus de datos (8 bits)
- `RD`: Señal de lectura
- `WR`: Señal de escritura
- `IO/M`: Indica si la operación es a memoria principal (`0`) o E/S (`1`)
- `INTR`: Petición de interrupción
- `INTA`: Reconocimiento de interrupción

Más información: [Memoria principal](/VonSim8/docs/memory/) | [Módulos de E/S](/VonSim8/docs/io/modules/)



## Registros

- `AL`, `BL`, `CL`, `DL`: Propósito general (usuario)
- `SP`: Puntero de pila (_stack pointer_, usuario)
- `FLAGS`: Banderas de estado (interno)
- `IP`: Puntero de instrucción (interno)
- `IR`: Registro de instrucción (interno)
- `MAR`: Dirección de memoria (interno)
- `MBR`: Dato de memoria (interno)
- `id`: Dato temporal (interno)

Los registros de usuario pueden ser accedidos y modificados por el programador. Los internos son gestionados por la CPU.



## ALU (Unidad aritmético-lógica)

Permite realizar operaciones aritméticas y lógicas de 8 y 16 bits:

- [`ADD`](/VonSim8/VonSim8/docs/cpu/instructions/add/), [`ADC`](/VonSim8/docs/cpu/instructions/adc/), [`INC`](/VonSim8/docs/cpu/instructions/inc/), [`SUB`](/VonSim8/docs/cpu/instructions/sub/), [`SBB`](/VonSim8/docs/cpu/instructions/sbb/), [`DEC`](/VonSim8/docs/cpu/instructions/dec/), [`NEG`](/VonSim8/docs/cpu/instructions/neg/), [`NOT`](/VonSim8/docs/cpu/instructions/not/), [`AND`](/VonSim8/docs/cpu/instructions/and/), [`OR`](/VonSim8/docs/cpu/instructions/or/)

Todas estas operaciones modifican el registro `FLAGS`.



### Registro FLAGS

Contiene banderas que reflejan el resultado de las operaciones y el estado de la CPU:

- `CF`: Flag de acarreo
- `ZF`: Flag de cero
- `SF`: Flag de signo
- `IF`: Flag de interrupción
- `OF`: Flag de overflow

El resto de bits están reservados y no se utilizan.



## Pila

Estructura LIFO (_Last In, First Out_): el último elemento en entrar es el primero en salir. Se implementa en la memoria principal, comenzando en la dirección más alta (`FFh`) y creciendo hacia abajo. El tope de la pila se guarda en el registro `SP` y todos los elementos son de 8 bits.



## Subrutinas

Fragmentos de código reutilizables que pueden ser llamados desde cualquier parte del programa usando [`CALL`](/VonSim8/docs/cpu/instructions/call/) y [`RET`](/VonSim8/docs/cpu/instructions/ret/).

**Ejemplo:**

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

Permiten responder a eventos externos (hardware) o internos (software, instrucción [`INT`](/VonSim8/docs/cpu/instructions/int/)). Para que una interrupción de hardware sea atendida, la flag `IF` debe estar activada (`IF=1`).

Ambos tipos requieren un número (0-255). En software, lo define el operando de `INT`; en hardware, el PIC.

Cuando ocurre una interrupción:

1. Se obtiene el número de la interrupción (00-0Fh).
2. Se apila el registro [`FLAGS`](#flags).
3. Se inhabilitan las interrupciones (`IF=0`).
4. Se apila el registro `IP`.
5. Se obtiene la dirección de la rutina de interrupción del vector de interrupciones.
6. Se modifica el `IP` para apuntar a la rutina.

Las rutinas de interrupción terminan con [`IRET`](/VonSim8/docs/cpu/instructions/iret/) (no con `RET`).



### Llamadas al sistema (_syscalls_)

Algunas interrupciones especiales funcionan como llamadas al sistema:

- `INT 0`: Termina la ejecución del programa (equivalente a [`HLT`](/VonSim8/docs/cpu/instructions/hlt/)).
- `INT 6`: Lee un carácter del [teclado](/VonSim8/docs/io/devices/keyboard/).
- `INT 7`: Escribe una cadena de caracteres en [pantalla](/VonSim8/docs/io/devices/screen/).

Estas direcciones están protegidas y no pueden ser modificadas por el usuario. El código de estas rutinas reside en el [monitor del sistema](/VonSim8/docs/memory/) en las direcciones `A0h`, `B0h`, `C0h` y `D0h`.

---

---

## Créditos

Este simulador fue hecho por

- [Facundo Quiroga](http://facundoq.github.io/),
- [Manuel Bustos Berrondo](https://github.com/manuelbb)
- y [Juan Martín Seery](https://juanm04.com),

con ayuda de

- [Andoni Zubimendi](https://github.com/AndoniZubimendi)
- y [César Estrebou](https://github.com/cesarares)

para las cátedras de

- [Organización de computadoras](http://weblidi.info.unlp.edu.ar/catedras/organiza/),
- [Arquitectura de computadoras](http://weblidi.info.unlp.edu.ar/catedras/arquitecturaP2003/),
- [Conceptos de arquitectura de computadoras](http://weblidi.info.unlp.edu.ar/catedras/ConArqCom/),

entre otras de la [Facultad de Informática](https://info.unlp.edu.ar/) de la [Universidad Nacional de La Plata](https://www.unlp.edu.ar/).

### Agradecimientos

VonSim se basa en el trabajo previo de Rubén de Diego Martínez para la Universidad Politécnica de Madrid. El simulador original se llamaba MSX88 y fue desarrollado en 1988. Algunas referencias:

- [Manual de Usuario del MSX88 (v3.0)](/VonSim8/docs/msx88/Manual-MSX88-v3.pdf)
- [Manual de Usuario del MSX88 (v4.0)](/VonSim8/docs/msx88/Manual-MSX88-v4.pdf)
- [Set de instrucciones del MSX88](/VonSim8/docs/msx88/set-instr-MSX88.PDF)
- [Paper de presentación del MSX88](/VonSim8/docs/msx88/msx88-original-paper.pdf)
- [MSX88 v3.1 (con DOSBox)](/VonSim8/docs/msx88/MSX88Portable.zip)
- [MSX88 v4.0 (portado)](/VonSim8/docs/msx88/msx88_2017.rar)
- [Apunte sobre interrupciones](/VonSim8/docs/msx88/apunte-interrupciones.pdf)

### Licencia

Todo el contenido del mismo se encuentra bajo la licencia [GNU Affero General Public License v3.0](https://github.com/ruiz-jose/VonSim8/blob/main/LICENSE) y su código fuente está disponible en [GitHub](https://github.com/ruiz-jose/VonSim8).

&copy; 2017-presente Facundo Quiroga, Manuel Bustos Berrondo y Juan Martín Seery ([III-LIDI](https://weblidi.info.unlp.edu.ar/), [Facultad de Informática](https://info.unlp.edu.ar/), [UNLP](https://unlp.edu.ar/)).

Esta documentación está bajo la licencia [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), salvo que se indique lo contrario.
