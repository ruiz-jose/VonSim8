# ADC

Esta instrucción suma dos operandos y guarda el resultado en el operando destino. Si `C=1`, entonces se suma `1` al resultado. El operando fuente no se modifica.

Los [_flags_](../cpu#flags) se modifican de la siguiente manera:

- Si el resultado es cero, entonces `Z=1`. De lo contrario, `Z=0`.
- Si la suma no entra en el operando destino, entonces `C=1`. De lo contrario, `C=0`.
- Si el el bit más significativo del resultado es `1`, entonces `S=1`. De lo contrario, `SF=0`.
- Si la suma de dos números positivos da un número negativo o la suma de dos números negativos da un número positivo, entonces `O=1`. De lo contrario, `O=0`.

## Uso

```vonsim
ADC dest, fuente
```

Las combinaciones válidas de _dest_, _fuente_ son:

- Registro, registro
- Registro, dirección de memoria
- Registro, inmediato
- Dirección de memoria, registro
- Dirección de memoria, inmediato

(Ver [tipos de operandos](../assembly#operandos))

## Codificación

### Carga a registro
- REGISTRO a registro  
  `1111_RxRy`
- Memoria (directo) a registro  
  `1111_Rx00`, _dir_
- Memoria (indirecto `BL`) a registro  
  `1111_Rx01`
- Inmediato a registro  
  `1111_Rx10`, _dato_

### Almacenar en memoria
- Registro a memoria (directo)  
  `1111_00Ry`, _dir_
- Registro a memoria (indirecto `BL`)  
  `1111_01Ry`
- Inmediato a memoria (directo)
  `1111_1100`, _dir_, _dato_
- Inmediato a memoria (indirecto `BL`)  
  `1111_1101`, _dato_

`Rx` o `Ry`: Índices de registros, número entre `0` y `3`, cada índice es de 2 bits.

| Registro | Binario | Decimal |
|:--------:|:-------:|:-------:|
|   AL     |   00    |    0    |
|   BL     |   01    |    1    |
|   CL     |   10    |    2    |
|   DL     |   11    |    3    |