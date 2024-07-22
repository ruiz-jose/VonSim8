---
title: PUSHF
head:
  - tag: meta
    attrs:
      { property: og:image, content: https://vonsim.github.io/docs/og/cpu/instructions/pushf.png }
---

Esta instrucción apila el registro [`FLAGS`](/docs/cpu/#flags) en la [pila](/docs/cpu/#pila). Los [_flags_](/docs/cpu/#flags) no se modifican.

Esta instrucción primero decrementa el registro `SP` en 2 y luego almacena el registro `FLAGS` en la dirección apuntada por `SP`.

## Uso

```vonsim
PUSHF
```

## Codificación

`01110000`

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
