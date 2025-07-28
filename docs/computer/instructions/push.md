# PUSH

Esta instrucción apila un elemento en la [pila](../cpu#pila). El operando fuente no se modifica. Los [_flags_](../cpu#flags) no se modifican.

Esta instrucción primero decrementa el registro `SP` en 1 y luego almacena el operando fuente en la dirección apuntada por `SP`.

## Uso

```vonsim
PUSH fuente
```

_fuente_ solo puede ser un registro de 16 bits (ver [tipos de operandos](../assembly#operandos)).

## Codificación

`011000Ry`

`Ry`: Índices de registros, número entre `0` y `3`, cada índice es de 2 bits.

| Registro | Binario | Decimal |
|:--------:|:-------:|:-------:|
|   AL     |   00    |    0    |
|   BL     |   01    |    1    |
|   CL     |   10    |    2    |
|   DL     |   11    |    3    |