# ¿Qué es VonSim8?

VonSim8 es un simulador interactivo y educativo que te permite aprender, practicar y experimentar los conceptos fundamentales de arquitectura y organización de computadoras. Es ideal para estudiantes, docentes y entusiastas que buscan una herramienta visual, sencilla y potente para comprender cómo funciona una computadora desde adentro. 
VonSim8 está inspirado en el VonSim, que es una herramienta destinada a la enseñanza y aprendizaje de arquitectura y organización de computadoras. Consta de un entorno para desarrollar programas en [lenguaje ensamblador](./computer/assembly) (Ensambaldor) y de un simulador para los mismos.

Está [basado](./computer/cpu) en el procesador 8088 de Intel, y cuenta con:
- Cuatro registros multipropósito de 8 bits (`AL`, `BL`, `CL`, `DL`).
- Registro de pila (`SP`) y registros internos (`FLAGS`, `IP`, `IR`, `MAR`, `MBR`, `id`).
- una [memoria principal](./computer/memory) de 256 bytes;
- Bus de direcciones y datos de 8 bits.
- interrupciones por software (como lectura del teclado y escritura en pantalla);
- interrupciones por hardware con un [PIC](./io/modules/pic);
- múltiples [dispositivos](./io/devices/index): reloj, llaves, leds y una impresora centronics.

> **Referencia:** Consulta la [hoja de especificaciones del Intel 8088](https://www.ceibo.com/eng/datasheets/Intel-8088-Data-Sheet.pdf) para más detalles sobre la arquitectura original.

:::warning[Simplificaciones]
Estos dispositivos están inspirados por sus análogos especificados por la iAPX 88 (o familia 8088) de Intel. Estos son un conjunto de dispositivos diseñados por Intel para su buen funcionamiento en conjunto con el procesador 8088. Más detalles pueden encontrarse en el [manual de usuario de iAPX 88 (1981)](http://www.bitsavers.org/components/intel/8086/1981_iAPX_86_88_Users_Manual.pdf).
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

- [Organización de computadoras](http://weblidi.info.unlp.edu.ar/catedras/organizacion/),
- [Arquitectura de computadoras](http://weblidi.info.unlp.edu.ar/catedras/arquitecturaP2003/),
- [Conceptos de arquitectura de computadoras](http://weblidi.info.unlp.edu.ar/catedras/ConArqCom/),

entre otras de la [Facultad de Informática](https://info.unlp.edu.ar/) de la [Universidad Nacional de La Plata](https://www.unlp.edu.ar/).

### Agradecimientos

VonSim se basa en el trabajo previo de Rubén de Diego Martínez para la Universidad Politécnica de Madrid. El simulador original se llamaba MSX88 y fue desarrollado en 1988. Algunas referencias:

- [Manual de Usuario del MSX88 (v3.0)](/msx88/Manual-MSX88-v3.pdf)
- [Manual de Usuario del MSX88 (v4.0)](/msx88/Manual-MSX88-v4.pdf)
- [Set de instrucciones del MSX88](/msx88/set-instr-MSX88.PDF)
- [Paper de presentación del MSX88](/msx88/msx88-original-paper.pdf)
- [MSX88 v3.1 (con DOSBox)](/msx88/MSX88Portable.zip)
- [MSX88 v4.0 (portado)](/msx88/msx88_2017.rar){target="_self"}
- [Apunte sobre interrupciones](/msx88/apunte-interrupciones.pdf)

### Licencia

Todo el contenido del mismo se encuentra bajo la licencia [GNU Affero General Public License v3.0](https://github.com/ruiz-jose/VonSim8/blob/main/LICENSE) y su código fuente está disponible en [GitHub](https://github.com/ruiz-jose/VonSim8).

Todo el contenido del mismo se encuentra bajo la licencia [GNU Affero General Public License v3.0](https://github.com/vonsim/vonsim/blob/main/LICENSE) y su código fuente está disponible en [GitHub](https://github.com/vonsim/vonsim).

Copyright &copy; 2017-presente Facundo Quiroga, Manuel Bustos Berrondo y Juan Martín Seery ([III-LIDI](https://weblidi.info.unlp.edu.ar/), [Facultad de Informática](https://info.unlp.edu.ar/), [UNLP](https://unlp.edu.ar/)).

Esta documentación está bajo la licencia [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), salvo que se indique lo contrario.
