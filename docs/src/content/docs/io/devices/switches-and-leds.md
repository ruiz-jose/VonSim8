---
title: Llaves y luces
head:
  - tag: meta
    attrs:
      {
        property: og:image,
        content: https://vonsim.github.io/docs/og/io/devices/switches-and-leds.png,
      }
---

Las llaves o interruptores están conectados al puerto `PA`/`CA` del [PIO](/docs/io/modules/pio/) y son dispositivos de entrada. Al cambiar su estado, estos se reflejarán en `PA` (si el PIO está configurado correctamente). Si se altera `PA`, los cambios no se verán reflejados en las llaves (no se mueven solas, por así decirlo).

Las luces o LED están conectadas al puerto `PB`/`CB` del [PIO](/docs/io/modules/pio/) y son dispositivos de salida. La única forma de cambiar su estado es modificando `PB`. Estos cambios se reflejarán en las luces si el PIO está configurado correctamente, de lo contrario, las luces se verán apagadas.

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
