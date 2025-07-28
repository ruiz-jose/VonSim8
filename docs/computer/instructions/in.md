# IN

Esta instrucción obtiene un byte de la [memoria E/S](../../io/modules/index) y lo almacena en el operando destino. Los [_flags_](../cpu#flags) no se modifican.

## Uso

```vonsim
IN dest, fuente
```

_fuente_ refiere al puerto o dirección de la memoria E/S. Puede ser un valor inmediato de 8 bits (ver [tipos de operandos](../assembly#operandos)) o el registro `DL`. En el caso de utilizar `DL`, se utilizará el byte almacenado en el registro como dirección de memoria E/S.

_dest_ puede ser `AL`, se leerá del puerto y se almacenará en `AL`.

## Codificación

- Puerto fijo  
  `0101000w`, _puerto_
- Puerto variable  
  `0101001w`

