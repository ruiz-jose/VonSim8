# INC

Esta instrucción suma uno al operando destino y almacena el resultado en el mismo operando.

Los [_flags_](../cpu#flags) se modifican de la siguiente manera:

- Si el resultado es cero, entonces `Z=1`. De lo contrario, `Z=0`.
- Si la suma no entra en el operando destino, entonces `C=1`. De lo contrario, `C=0`.
- Si el el bit más significativo del resultado es `1`, entonces `S=1`. De lo contrario, `S=0`.
- Si el operando es positivo y el resultado negativo, entonces `O=1`. De lo contrario, `O=0`.

## Uso

```vonsim
INC dest
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