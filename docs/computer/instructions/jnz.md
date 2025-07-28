# JNZ

Esta instrucción salta solo sí `ZF=0`. Los [_flags_](../cpu#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JNZ etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
x db 2 
y db 3
z db 0
                mov AL, x
                cmp AL, y
                jnz NoEsIgual
                jmp Fin
NoEsIgual:      add AL, y
                mov z, AL 
Fin:            hlt
```

## Codificación

`1100_0101`  _dir_

