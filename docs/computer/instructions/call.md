# CALL

Esta instrucción inicializa una [subrutina](../cpu#subrutinas). Los [_flags_](../cpu#flags) no se modifican.

Primero, se apila la dirección de retorno (la dirección de la instrucción siguiente a `CALL`) en la [pila](../cpu#pila). Luego, se salta a la dirección de la subrutina, es decir, copia la dirección de salto en `IP`.

## Uso

```vonsim
CALL etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
            call rutina 
            hlt
rutina:     add al, 1           
            ret
```

## Codificación

`1100_1101`, _dir_
