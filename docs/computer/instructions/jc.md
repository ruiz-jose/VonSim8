# JC

Esta instrucción salta solo sí `C=1`. Los [_flags_](../cpu#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JC etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
x db 2 
y db 3
z db 0
        mov AL, x
        cmp AL, y
        jc EsMenor
        jmp Fin
EsMenor:  add AL, y
          mov z, AL 
Fin:      hlt
```

## Codificación

`1100 0010`  _dir_
