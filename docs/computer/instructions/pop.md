# POP

Esta instrucción desapila el elemento en el tope en la [pila](../cpu#pila) y lo almacena en el operando destino. Los [_flags_](../cpu#flags) no se modifican.

Esta instrucción primero lee el valor apuntado por `SP` y lo guarda en el operando destino, para luego incrementar el registro `SP` en 1.

## Uso

```vonsim
POP dest
```

_dest_ solo puede ser un registro de 16 bits (ver [tipos de operandos](../assembly#operandos)).

## Codificación

`0110_Rx00`

`Rx`: Índices de registros, número entre `0` y `3`, cada índice es de 2 bits.

| Registro | Binario | Decimal |
|:--------:|:-------:|:-------:|
|   AL     |   00    |    0    |
|   BL     |   01    |    1    |
|   CL     |   10    |    2    |
|   DL     |   11    |    3    |