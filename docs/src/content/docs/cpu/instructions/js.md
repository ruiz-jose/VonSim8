---
title: JS
head:
  - tag: meta
    attrs: { property: og:image, content: https://ruiz-jose.github.io/VonSim8/docs/og/cpu/instructions/js.png }
---

Esta instrucción salta solo sí `SF=1`. Los [_flags_](/VonSim8/docs/cpu/#flags) no se modifican.

De saltar, copiará la dirección de salto en `IP`.

## Uso

```vonsim
JS etiqueta
```

_etiqueta_ debe ser una etiqueta que apunta a una instrucción.

### Ejemplo

```vonsim
        org 2000h
salto:  push ax
        ; --- etc ---

        js salto ; Válido
        js 2000h ; Inválido, debe ser una etiqueta
        hlt
        end
```

## Codificación

`00100100`, _dir-low_, _dir-high_

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
