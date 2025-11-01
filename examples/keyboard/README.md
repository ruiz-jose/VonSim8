# Interrupción INT 6 - Lectura de Teclado

## Descripción

La interrupción `INT 6` permite leer un carácter del teclado virtual y guardarlo en una dirección de memoria.

## Funcionamiento

Cuando se ejecuta `INT 6`:

1. **Rutina de Interrupción**: La CPU carga y ejecuta automáticamente una rutina en la dirección `C0h` que:
   - Espera a que el usuario presione una tecla en el teclado virtual
   - Lee el carácter presionado
   - Guarda el carácter en la dirección de memoria apuntada por el registro `BX`

2. **Puertos de E/S**: La rutina usa el PIO para comunicarse con el teclado:
   - **Puerto 32h (CA)**: Estado del teclado (0 = sin tecla, 1 = tecla disponible)
   - **Puerto 30h (PA)**: Dato del teclado (carácter ASCII de la tecla presionada)

## Rutina de Interrupción

```asm
org 0C0h
push AL              ; Guardar AL en el stack
wait_for_key:
in AL, 32h          ; Leer estado del teclado (puerto CA)
cmp AL, 0           ; ¿No hay tecla disponible?
jz wait_for_key     ; Si es 0, seguir esperando
in AL, 30h          ; Leer carácter del teclado (puerto PA)
pop AL              ; Restaurar valor anterior de AL
mov [BX], AL        ; Guardar carácter en [BX]
iret                ; Retornar de la interrupción
```

Esta rutina se inyecta automáticamente cuando el programa contiene al menos una instrucción `INT`.

## Uso

```asm
org 20h

; Configurar BX con la dirección donde guardar el carácter
mov BX, 50h

; Llamar a INT 6
int 6

; El carácter leído está ahora en la dirección 50h

hlt
end
```

## Comportamiento Paso a Paso

1. El usuario ejecuta `INT 6`
2. La CPU guarda el estado (FLAGS e IP) en el stack
3. La CPU salta a la dirección `C0h` (rutina INT 6)
4. La rutina lee el puerto 32h (estado del teclado) en un bucle
5. Mientras no haya tecla presionada, el puerto 32h devuelve 0
6. El usuario presiona una tecla en el teclado virtual
7. La tecla se copia en los puertos del PIO:
   - Puerto 32h (CA): Se establece en 1 (tecla disponible)
   - Puerto 30h (PA): Se establece con el código ASCII de la tecla
8. La rutina detecta que el puerto 32h es 1 y sale del bucle
9. Lee el código ASCII del puerto 30h
10. Guarda el carácter en la dirección `[BX]`
11. `IRET` restaura el estado y continúa después de `INT 6`

## Implementación Técnica

### PIOKeyboard

El `PIOKeyboard` es un módulo de E/S que conecta el teclado virtual con la CPU:

- **Puerto 32h (CA)**: Devuelve 1 si hay una tecla disponible, 0 si no
- **Puerto 30h (PA)**: Devuelve el código ASCII de la tecla presionada

### Inyección de Instrucciones

Las instrucciones de la rutina INT 6 se inyectan automáticamente:

1. Se ensamblan usando el ensamblador de VonSim
2. Se agregan al mapa de instrucciones de la CPU
3. Se cargan en memoria como bytecodes

Esto permite que el usuario vea la ejecución paso a paso de la rutina en el editor del simulador.

## Archivos Modificados

- `packages/simulator/src/io/connections/pio-keyboard.ts`: Nueva clase PIOKeyboard
- `packages/simulator/src/io/index.ts`: Integración de PIOKeyboard con IOInterface
- `packages/simulator/src/cpu/index.ts`: Inyección automática de instrucciones INT 6
- `packages/simulator/src/cpu/syscalls.ts`: Simplificación de INT 6
- `packages/simulator/src/memory.ts`: Carga de bytecodes de INT 6
- `packages/simulator/src/index.ts`: Notificación de tecla disponible al PIO

## Ejemplo Completo

Ver `examples/keyboard/int6-test.asm` para un ejemplo funcional.
