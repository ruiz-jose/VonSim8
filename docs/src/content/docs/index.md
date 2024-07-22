---
title: ¿Qué es VonSim?
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/index.png }
---

VonSim es una herramienta destinada a la enseñanza y aprendizaje de arquitectura y organización de computadoras. Consta de un entorno para desarrollar programas en [lenguaje ensamblador](/docs/cpu/assembly/) (_Assembly_ o _Assembler_) y de un simulador para los mismos.

Está [basado](/docs/cpu/) en el procesador 8088 de Intel, y cuenta con:

- cuatro registros multipropósito de 16 bits;
- una [memoria principal](/docs/memory/) de 32 kB;
- un bus de direcciones de 16 bits y un bus de datos de 8 bits;
- interrupciones por software (como lectura del teclado y escritura en pantalla);
- interrupciones por hardware con un [PIC](/docs/io/modules/pic/);
- múltiples [dispositivos](/docs/io/devices/): reloj, llaves, leds y una impresora centronics.

Estos dispositivos están inspirados por sus análogos especificados por la iAPX 88 (o familia 8088) de Intel. Estos son un conjunto de dispositivos diseñados por Intel para su buen funcionamiento en conjunto con el procesador 8088. Más detalles pueden encontrarse en el [manual de usuario de iAPX 88 (1981)](http://www.bitsavers.org/components/intel/8086/1981_iAPX_86_88_Users_Manual.pdf).

:::caution[Simplificaciones]
Este simulador no busca ser un emulador fiel del 8088. Por el contrario, busca ser una herramienta para la enseñanza de la arquitectura de computadoras. Por eso, se han hecho múltiples simplificaciones con respecto al 8088 que dificultan su uso en un entorno real. Mismamente, el set de instrucciones es mucho más pequeño que el del 8088 y su codificación es más simple.
:::

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

- [Manual de Usuario del MSX88 (v3.0)](/docs/msx88/Manual-MSX88-v3.pdf)
- [Manual de Usuario del MSX88 (v4.0)](/docs/msx88/Manual-MSX88-v4.pdf)
- [Set de instrucciones del MSX88](/docs/msx88/set-instr-MSX88.PDF)
- [Paper de presentación del MSX88](/docs/msx88/msx88-original-paper.pdf)
- [MSX88 v3.1 (con DOSBox)](/docs/msx88/MSX88Portable.zip)
- [MSX88 v4.0 (portado)](/docs/msx88/msx88_2017.rar)
- [Apunte sobre interrupciones](/docs/msx88/apunte-interrupciones.pdf)

### Licencia

Todo el contenido del mismo se encuentra bajo la licencia [GNU Affero General Public License v3.0](https://github.com/vonsim/vonsim/blob/main/LICENSE) y su código fuente está disponible en [GitHub](https://github.com/vonsim/vonsim).

&copy; 2017-presente Facundo Quiroga, Manuel Bustos Berrondo y Juan Martín Seery ([III-LIDI](https://weblidi.info.unlp.edu.ar/), [Facultad de Informática](https://info.unlp.edu.ar/), [UNLP](https://unlp.edu.ar/)).

Esta documentación está bajo la licencia [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), salvo que se indique lo contrario.
