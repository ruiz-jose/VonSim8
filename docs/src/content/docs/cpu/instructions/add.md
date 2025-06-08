---
title: ADD
head:
  - tag: meta
    attrs:
      { property: og:image, content: https://vonsim.github.io/VonSim8/docs/og/cpu/instructions/add.png }
---

Esta instrucción suma dos operandos y guarda el resultado en el operando destino. El operando fuente no se modifica.

Los [_flags_](/VonSim8/docs/cpu/#flags) se modifican de la siguiente manera:

- Si la suma no entra en el operando destino, entonces `CF=1`. De lo contrario, `CF=0`.
- Si el resultado es cero, entonces `ZF=1`. De lo contrario, `ZF=0`.
- Si la suma de dos números positivos da un número negativo o la suma de dos números negativos da un número positivo, entonces `OF=1`. De lo contrario, `OF=0`.

## Uso

```vonsim
ADD dest, fuente
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
  `0100_RRrr`
- Memoria (directo) a registro  
  `0101_00RR`, _dir_
- Memoria (indirecto) a registro  
  `0101_RR01`
- Inmediato a registro  
  `0101_RR10`, _dato_
- Registro a memoria (directo)  
  `0110_00rr`, _dir_
- Registro a memoria (indirecto)  
  `0110_01rr`
- Inmediato a memoria (directo)  
  `0110_10_00`, _dir_, _dato_
- Inmediato a memoria (indirecto)  
  `0110_10_01`, _dato_


`rr` o `RR` codifica un registro según la siguiente tabla:

| `rr` | `nombre` |
| :---: | :---: | 
| `00` | `AL`  | 
| `01` | `BL`  | 
| `10` | `BL`  | 
| `11` | `DL`  | 


---

<small>Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small>
