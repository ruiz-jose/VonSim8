# JNC

Esta instrucción salta solo sí `C=0`. Los [_flags_](../cpu#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JNC etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
x db 2 
y db 3
z db 0
                mov AL, x
                cmp AL, y
                jnc NoEsMenor
                jmp Fin
NoEsMenor:      add AL, y
                mov z, AL 
Fin:            hlt
```

## Codificación

`1100_0101`  _dir_
