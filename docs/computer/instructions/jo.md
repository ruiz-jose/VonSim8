# JO

Esta instrucción salta solo sí `O=1`. Los [_flags_](../cpu#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JO etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
x db 2 
y db 3
z db 0
                mov AL, x
                cmp AL, y
                jo EsNeg
                jmp Fin
EsNeg:          add AL, y
                mov z, AL 
Fin:            hlt
```

## Codificación

`1100_0100`  _dir_
