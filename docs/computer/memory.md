# Memoria principal

El simulador cuenta con una memoria principal de almacenamiento. Esta memoria cubre el espacio de direcciones `00h` hasta `FFh`. Ciertas direcciones (`10h` hasta `9Fh`) está reservada para el usuario: aquí se almacenan los programas y datos. La parte más alta (`A0h` hasta `FFh`) está reservada para un sistema operativo que permite al usuario interactuar con varios dispositivos (ver [llamadas al sistema](./cpu#llamadas-al-sistema)).

Nótese que, al contrario que en el procesador Intel 8088, la memoria principal no está dividida en segmentos. Por eso, el programador debe tener cuidado de no sobrepasar los límites de la memoria ni que otros programas sobreescriban su código o datos.
