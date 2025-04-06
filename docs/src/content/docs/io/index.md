---
title: "E/S: Conceptos generales"
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/io.png }
---

Por defecto, los únicos componentes conectados al bus la [CPU](/docs/cpu/) y la [memoria principal](/VonSim8/docs/memory/). El simulador puede configurarse para conectar [módulos]/VonSim8(/docs/io/modules/) de entrada/salida al bus y otros [dispositivos](/VonSim8/docs/io/devices/). Estos se encuentrar agrupados en conjuntos o configuraciones:

- **Teclado y pantalla**: un [teclado](/VonSim8/docs/io/devices/keyboard/) y una [pantalla](/VonSim8/docs/io/devices/screen/).
- **PIO con llaves y luces**: un [PIO](/VonSim8/docs/io/modules/pio/) conectado a [llaves y luces](/VonSim8/docs/io/devices/switches-and-leds/).
- **PIO con impresora**: un [PIO](/VonSim8/docs/io/modules/pio/) conectado a una [impresora Centronics](/VonSim8/docs/io/devices/printer/).
- **Handshake**: Una [impresora Centronics](/VonSim8/docs/io/devices/printer/) conectada por un [Handshake](/VonSim8/docs/io/modules/handshake).

Las últimas tres, además, incluyen un [PIC]/VonSim8/docs/io/modules/pic/), la [tecla F10](/VonSim8/docs/io/devices/f10/) para interrumpir, un [timer](/VonSim8/docs/io/modules/timer/) con su [reloj](/VonSim8/docs/io/devices/clock/), una [pantalla](/VonSim8/docs/io/devices/screen/) y un [teclado](/VonSim8/docs/io/devices/keyboard/).

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
