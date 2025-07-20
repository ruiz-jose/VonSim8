---
title: Memoria principal
head:
  - tag: meta
    attrs: { property: og:image, content: https://github.com/ruiz-jose/VonSim8/docs/og/memory.png }
---

El simulador cuenta con una memoria principal de almacenamiento. Esta memoria cubre el espacio de direcciones `00h` hasta `FFh`. Ciertas direcciones (`10h` hasta `9Fh`) está reservada para el usuario: aquí se almacenan los programas y datos. La parte más alta (`A0h` hasta `FFh`) está reservada para un sistema operativo que permite al usuario interactuar con varios dispositivos (ver [llamadas al sistema](/VonSim8/docs/cpu/#llamadas-al-sistema)).

La memoria principal se visualiza como una matriz hexadecimal, permitiendo observar el flujo de datos y el impacto de cada instrucción en tiempo real. El simulador resalta dinámicamente las posiciones activas y los registros involucrados en cada operación.

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
