---
title: MOV
head:
  - tag: meta
    attrs:
      { property: og:image, content: https://vonsim.github.io/VonSim8/docs/og/cpu/instructions/mov.png }
---

Esta instrucción copia el operando fuente en el operando destino. El operando fuente no se modifica. Los [_flags_](/VonSim8/docs/cpu/#flags) no se modifican.

## Uso

```vonsim
MOV dest, fuente
```

Las combinaciones válidas de _dest_, _fuente_ son:

- Registro, registro
- Registro, dirección de memoria
- Registro, inmediato
- Dirección de memoria, registro
- Dirección de memoria, inmediato

(Ver [tipos de operandos](/VonSim8/docs/cpu/assembly/#operandos))

## Codificación

- REGISTRO a registro  
  `0000_RRrr`
- Memoria (directo) a registro  
  `0001_RR00`, _dir_
- Memoria (indirecto) a registro  
  `0001_RR01`
- Inmediato a registro  
  `0001_RR10`, _dato_
- Registro a memoria (directo)  
  `0010_00rr`, _dir_
- Registro a memoria (indirecto)  
  `0010_01rr`
- Inmediato a memoria (directo)  
  `0010_10_00`, _dir_, _dato_
- Inmediato a memoria (indirecto)  
  `0010_10_01`, _dato_

`rr` o `RR` codifica un registro según la siguiente tabla:

| `rr` | `nombre` |
| :---: | :---: | 
| `00` | `AL`  | 
| `01` | `BL`  | 
| `10` | `BL`  | 
| `11` | `DL`  | 



---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
