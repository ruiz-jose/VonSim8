# OUT

Esta instrucción escribe un byte en la [memoria E/S](../../io/modules/index). Los [_flags_](../cpu#flags) no se modifican.

## Uso

```vonsim
OUT dest, fuente
```

_dest_ refiere al puerto o dirección de la memoria E/S. Puede ser un valor inmediato de 8 bits (ver [tipos de operandos](../assembly#operandos)) o el registro `DL`. En el caso de utilizar `DL`, se utilizará la palabra almacenada en el registro como dirección de memoria E/S.

_fuente_ puede ser `AL`, y luego se escribirá en el puerto el valor de `AL`.

## Codificación

- Puerto fijo  
  `0101010w`, _puerto_
- Puerto variable  
  `0101011w`


