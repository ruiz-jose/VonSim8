---
title: Ciclo de instrucción
head:
  - tag: meta
    attrs: { property: og:image, content: https://vonsim.github.io/docs/og/codification.png }
---

# Ciclo de la instrucción (Etapas de captación y ejecución)

## Captación:  (*)
  - MAR ← IP 
  - MBR ← read(Memoria[MAR]); IP ← IP + 1
  - IR  ← MBR

(*): Todas las instrucciones tienen los mismos pasos en la etapa de captación.

## Ejecución instrucción de transferencia MOV:

### 0: Copiar entre registros: `MOV rx, ry`
  - Rx ← Ry

### 1: Cargar a registro: 
####  0: MOV Rx,  [Dirección] 
  - MAR ← IP
  - MBR ← read(Memoria[MAR]); IP ← IP + 1        (Obtener byte 2)   
  - MAR ← MBR
  - MBR ← read(Memoria[MAR])        (Obtener operando)
  - Rx  ← MBR 

### 2: Almacenar en memoria:
#### 0: MOV  [Dirección], Ry     
  - MAR ← IP
  - MBR ← read(Memoria[MAR]); IP ← IP + 1      (Obtener byte 2)
  - MAR ← MBR
  - MBR ← Ry
  - write(Memoria[MAR]) ←  MBR 