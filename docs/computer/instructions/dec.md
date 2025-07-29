# DEC

Esta instrucción resta uno al operando destino y almacena el resultado en el mismo operando.

Los [_flags_](../cpu#flags) se modifican de la siguiente manera:

- Si la resta no entra en el operando destino, entonces `CF=1`. De lo contrario, `CF=0`.
- Si el resultado es cero, entonces `ZF=1`. De lo contrario, `ZF=0`.
- Si el el bit más significativo del resultado es `1`, entonces `SF=1`. De lo contrario, `SF=0`.
- Si el operando es negativo y el resultado positivo, entonces `OF=1`. De lo contrario, `OF=0`.

## Uso

```vonsim
DEC dest
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