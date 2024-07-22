---
title: "E/S: Conceptos generales"
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/io.png }
---

Por defecto, los únicos componentes conectados al bus la [CPU](/docs/cpu/) y la [memoria principal](/docs/memory/). El simulador puede configurarse para conectar [módulos](/docs/io/modules/) de entrada/salida al bus y otros [dispositivos](/docs/io/devices/). Estos se encuentrar agrupados en conjuntos o configuraciones:

- **Teclado y pantalla**: un [teclado](/docs/io/devices/keyboard/) y una [pantalla](/docs/io/devices/screen/).
- **PIO con llaves y luces**: un [PIO](/docs/io/modules/pio/) conectado a [llaves y luces](/docs/io/devices/switches-and-leds/).
- **PIO con impresora**: un [PIO](/docs/io/modules/pio/) conectado a una [impresora Centronics](/docs/io/devices/printer/).
- **Handshake**: Una [impresora Centronics](/docs/io/devices/printer/) conectada por un [Handshake](/docs/io/modules/handshake).

Las últimas tres, además, incluyen un [PIC](/docs/io/modules/pic/), la [tecla F10](/docs/io/devices/f10/) para interrumpir, un [timer](/docs/io/modules/timer/) con su [reloj](/docs/io/devices/clock/), una [pantalla](/docs/io/devices/screen/) y un [teclado](/docs/io/devices/keyboard/).

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
