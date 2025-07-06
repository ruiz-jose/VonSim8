---
title: CALL
head:
  - tag: meta
    attrs:
      {
        property: og:image,
        content: https://vonsim.github.io/VonSim8/docs/og/cpu/instructions/call.png,
      }
---

Esta instrucción inicializa una [subrutina](/VonSim8/docs/cpu/#subrutinas). Los [_flags_](/VonSim8/docs/cpu/#flags) no se modifican.

Primero, se apila la dirección de retorno (la dirección de la instrucción siguiente a `CALL`) en la [pila](/VonSim8/docs/cpu/#pila). Luego, se salta a la dirección de la subrutina, es decir, copia la dirección de salto en `IP`.

## Uso

```vonsim
CALL etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
            call subrutina ; Válido
            call 30h     ; Inválido, debe ser una etiqueta
            hlt

subrutina:  push ax
            ; --- etc ---
            ret

```

## Codificación

`00110001`, _dir_

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
