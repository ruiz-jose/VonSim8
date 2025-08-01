# Actualización de la Fase "Obtener Operandos"

## Resumen de Cambios

Se ha implementado una mejora en el comportamiento de la fase "Obtener operandos" dentro del ciclo de ejecución de una instrucción. Ahora esta fase finaliza específicamente cuando el operando se escribe en el registro MBR (Memory Buffer Register).

## Cambios Implementados

### 1. Nuevo Tipo de Fase
- Se agregó la fase `"fetching-operands-completed"` al tipo `Cycle` en `app/src/computer/cpu/state.ts`
- Esta fase indica que la obtención de operandos ha terminado

### 2. Lógica de Finalización de Fase
- Se modificó el evento `cpu:mbr.get` en `app/src/computer/cpu/events.ts`
- Ahora cuando se escribe en el MBR durante la fase "fetching-operands", se marca automáticamente el fin de esta fase
- Se excluye la transferencia a IR (que es parte de la captación de instrucción)

### 3. Actualizaciones de UI
- **Header**: Se agregó soporte para mostrar la nueva fase
- **InstructionCycleInfo**: Se agregó icono y color para la nueva fase
- **Sequencer**: Se actualizó para manejar la nueva fase
- **Localización**: Se agregaron traducciones en español e inglés

### 4. Control de Estado
- Se definió el tipo `CyclePhase` para tipar correctamente las fases
- Se actualizó la variable `currentPhase` para incluir la nueva fase

## Comportamiento Esperado

### Antes
- La fase "fetch-operands" terminaba cuando se ejecutaba el siguiente `cpu:cycle.update`
- No había una indicación clara de cuándo exactamente terminaba la obtención de operandos

### Después
- La fase "fetch-operands" termina específicamente cuando el operando se escribe en el MBR
- Se muestra la fase "fetching-operands-completed" para indicar que los operandos han sido obtenidos
- El flujo de control es más preciso y refleja mejor el comportamiento real del procesador

## Instrucciones Afectadas

Las siguientes instrucciones activan la fase "fetch-operands":

1. **MOV con memoria**: `MOV AL, [200h]`
2. **ADD con memoria**: `ADD BL, [201h]`
3. **SUB con memoria**: `SUB CL, [202h]`
4. **CMP con memoria**: `CMP DL, [203h]`
5. **AND/OR/XOR con memoria**: `AND AL, [204h]`
6. **Instrucciones de pila**: `PUSH`, `POP`
7. **Instrucciones de salto**: `JMP`, `CALL`, `RET`
8. **Instrucciones de interrupción**: `INT`

## Archivos Modificados

1. `app/src/computer/cpu/state.ts` - Nuevo tipo de fase
2. `app/src/computer/cpu/events.ts` - Lógica de finalización
3. `app/src/components/Header.tsx` - UI del header
4. `app/src/computer/cpu/InstructionCycleInfo.tsx` - Información del ciclo
5. `app/src/computer/cpu/Sequencer.tsx` - Secuenciador
6. `app/src/lib/i18n/locales/spanish.ts` - Traducciones en español
7. `app/src/lib/i18n/locales/english.ts` - Traducciones en inglés

## Ejemplo de Uso

```assembly
; Este programa activará la fase "fetch-operands"
ORG 100h

MOV AL, [200h]    ; Cargar desde memoria - activa fetch-operands
ADD BL, [201h]    ; Sumar desde memoria - activa fetch-operands
CMP CL, [202h]    ; Comparar con memoria - activa fetch-operands

MOV DL, 42h       ; Valor inmediato - NO activa fetch-operands
MOV AL, BL        ; Entre registros - NO activa fetch-operands

HLT

ORG 200h
DB 10h, 20h, 30h  ; Datos de prueba
```

## Verificación

Para verificar que los cambios funcionan correctamente:

1. Ejecutar el simulador
2. Cargar un programa que use instrucciones con memoria
3. Ejecutar paso a paso
4. Observar que la fase "fetch-operands" cambia a "fetching-operands-completed" cuando se escribe en MBR
5. Verificar que las instrucciones sin memoria no activan esta fase 