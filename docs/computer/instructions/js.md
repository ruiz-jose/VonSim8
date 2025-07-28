# JS

Esta instrucción salta solo sí `SF=1`. Los [_flags_](../cpu#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JS etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
x db 2 
y db 3
z db 0
                mov AL, x
                cmp AL, y
                js EsIgual
                jmp Fin
EsIgual:        add AL, y
                mov z, AL 
Fin:            hlt
```

## Codificación

`00100100`, _dir-low_, _dir-high_
