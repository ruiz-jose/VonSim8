# MOV

Esta instrucción copia el operando fuente en el operando destino. El operando fuente no se modifica. Los [_flags_](../cpu#flags) no se modifican.

## Uso

```vonsim
MOV dest, fuente
```

Las combinaciones válidas de _dest_, _fuente_ son:

- Registro, registro
- Registro, dirección de memoria
- Registro, inmediato
- Dirección de memoria, registro
- Dirección de memoria, inmediato

El operando `dirección de memoria` puede ser directo o indirecto, directo es la dirección misma de memoria e indirecto la dirección esta en el registro BL. 

(Ver [tipos de operandos](../assembly#operandos))

## Codificación

### Carga a registro
- REGISTRO a registro  
  `0000_RxRy`
- Memoria (directo) a registro  
  `0001_Rx00`, _dir_
- Memoria (indirecto `BL`) a registro  
  `0001_Rx01`
- Inmediato a registro  
  `0001_Rx10`, _dato_

### Almacenar en memoria
- Registro a memoria (directo)  
  `0010_00Ry`, _dir_
- Registro a memoria (indirecto `BL`)  
  `0010_01Ry`
- Inmediato a memoria (directo)
  `0010_1100`, _dir_, _dato_
- Inmediato a memoria (indirecto `BL`)  
  `0010_1101`, _dato_

`Rx` o `Ry`: Índices de registros, número entre `0` y `3`, cada índice es de 2 bits.

| Registro | Binario | Decimal |
|:--------:|:-------:|:-------:|
|   AL     |   00    |    0    |
|   BL     |   01    |    1    |
|   CL     |   10    |    2    |
|   DL     |   11    |    3    |