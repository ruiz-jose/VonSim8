---
title: INT
head:
  - tag: meta
    attrs:
      { property: og:image, content: https://vonsim.github.io/docs/og/cpu/instructions/int.png }
---

Esta instrucción emite una [interrupción](/docs/cpu/#interrupciones) por software. El [_flag_](/docs/cpu/#flags) `IF` cambia a `0` obligatoriamente porque se va a ejecutar una interrupción. Los demás _flags_ no se modifican.

## Uso

```vonsim
INT N
```

_N_ es el número de interrupción (0-255), que debe ser inmediato (ver [tipos de operandos](/docs/cpu/assembly/#operandos)).

Utiliza el mismo mecanismo de vector de interrupciones que las interrupciones por hardware. Generalmente se utiliza para realizar [llamadas al sistema](/docs/cpu/#llamadas-al-sistema), pero si se la llama con cualquier otro número, se ejecutará la rutina de interrupción asociada a ese número.

## Codificación

`00011010`, _número de interrupción_

---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
