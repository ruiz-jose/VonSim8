# Escritura Directa en Pantalla - Dirección 0xE5

## Descripción

VonSim8 ahora soporta escritura directa en pantalla mediante la dirección de memoria **0xE5** (229 decimal). Esta característica permite mostrar caracteres en la pantalla sin necesidad de usar la interrupción `INT 7`.

## Funcionamiento

Cuando se escribe un byte en la dirección de memoria `0xE5`, el simulador:

1. Intercepta la escritura en memoria
2. Envía automáticamente el carácter a la pantalla
3. El carácter se muestra inmediatamente en el dispositivo de salida

Este mecanismo es similar a cómo funciona `INT 6` para la lectura de teclado, pero aplicado a la escritura en pantalla.

## Ventajas

- **Simplicidad**: No requiere configurar interrupciones
- **Directo**: Escritura inmediata, sin overhead de llamadas al sistema
- **Educativo**: Demuestra el concepto de "memory-mapped I/O"

## Uso Básico

### Ejemplo Simple

```assembly
org 2000h

; Escribir 'A' en pantalla
mov al, 'A'
mov [0E5h], al

hlt
end
```

### Ejemplo de Mensaje

```assembly
org 2000h

mov bx, offset mensaje

loop_escribir:
    mov al, [bx]
    cmp al, 0
    jz fin

    mov [0E5h], al  ; Escribir en pantalla

    inc bx
    jmp loop_escribir

fin:
    hlt

mensaje db 'Hola VonSim8!', 0
end
```

## Comparación con INT 7

### Usando INT 7 (tradicional)

```assembly
mov bx, offset mensaje
mov al, 13              ; Longitud del mensaje
int 7

mensaje db 'Hola VonSim8!'
```

### Usando 0xE5 (escritura directa)

```assembly
mov bx, offset mensaje

loop:
    mov al, [bx]
    cmp al, 0
    jz fin
    mov [0E5h], al      ; Escritura directa
    inc bx
    jmp loop

fin:
    hlt

mensaje db 'Hola VonSim8!', 0
```

## Notas Técnicas

- La dirección **0xE5** está reservada para este propósito
- Cada escritura en esta dirección envía un solo carácter a la pantalla
- Los caracteres especiales (backspace=8, line feed=10, form feed=12) funcionan igual que en `INT 7`
- La escritura en 0xE5 también actualiza la memoria en esa posición

## Ejemplos Incluidos

- `write-e5-test.asm`: Prueba básica de escritura de caracteres
- `write-e5-message.asm`: Escritura de un mensaje completo usando un loop

## Implementación Interna

La funcionalidad está implementada en:

- `packages/simulator/src/memory.ts`: Intercepta escrituras en 0xE5
- `app/src/computer/memory/events.ts`: Maneja el evento `memory:write.screen`

El mecanismo utiliza el mismo sistema de eventos que otras operaciones de I/O, asegurando consistencia y permitiendo animaciones visuales en el simulador.
