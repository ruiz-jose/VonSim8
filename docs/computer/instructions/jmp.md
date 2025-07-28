# JMP

Esta instrucción salta incondicionalmente. Los [_flags_](../cpu#flags) no se modifican.

Copiará la dirección de salto en `IP`.

## Uso

```vonsim
JMP etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
x db 2 
y db 3
z db 0
                mov AL, x
                cmp AL, y
                jz EsIgual
                jmp Fin
EsIgual:        add AL, y
                mov z, AL 
Fin:            hlt
```

## Codificación

`00110000`, _dir-low_, _dir-high_
