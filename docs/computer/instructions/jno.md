# JNO

Esta instrucción salta solo sí `OF=0`. Los [_flags_](../cpu#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JNO etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
                mov AL, x
                cmp AL, y
                jno NoEsNeg
                jmp Fin
NoEsNeg:        add AL, y
                mov z, AL 
Fin:            hlt
```

## Codificación

`00100111`, _dir-low_, _dir-high_
