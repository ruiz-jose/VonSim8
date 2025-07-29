# NOT

Esta instrucción realiza la operación lógica NOT sobre el operando destino (NOT destino). El resultado se almacena en el operando destino.

Los [_flags_](../cpu#flags) se modifican de la siguiente manera:

- Si el resultado es cero, entonces `Z=1`. De lo contrario, `Z=0`.
- `C=0`.
- Si el el bit más significativo del resultado es `1`, entonces `S=1`. De lo contrario, `S=0`.
- `O=0`.

## Uso

```vonsim
NOT dest
```

_dest_ puede ser un registro o una dirección de memoria (ver [tipos de operandos](../assembly#operandos)).

## Codificación
- Registro  
  `1111_Rx11`
- Memoria (directo)  
  `1111_0011`, _dir_
- Memoria (indirecto `BL`)
  `1111_0111`


`Rx`: Índices de registros, número entre `0` y `3`, cada índice es de 2 bits.

| Registro | Binario | Decimal |
|:--------:|:-------:|:-------:|
|   AL     |   00    |    0    |
|   BL     |   01    |    1    |
|   CL     |   10    |    2    |
|   DL     |   11    |    3    |