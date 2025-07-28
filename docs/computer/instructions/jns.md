# JNS

Esta instrucción salta solo sí `SF=0`. Los [_flags_](../cpu#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JNS etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
x db 2 
y db 3
z db 0
                mov AL, x
                cmp AL, y
                jns EsNeg
                jmp Fin
EsNeg:          add AL, y
                mov z, AL 
Fin:            hlt
```

## Codificación

`00100101`, _dir-low_, _dir-high_
