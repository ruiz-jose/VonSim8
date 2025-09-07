# Implementación del Mensaje de Usuario para INT 6

## Descripción
Se ha implementado una funcionalidad que muestra un mensaje amigable al usuario cuando se invoca la interrupción INT 6 (lectura de carácter del teclado).

## Cambios Realizados

### 1. Traducciones Agregadas
Se agregaron nuevos mensajes en los archivos de traducción:

**`app/src/lib/i18n/locales/spanish.ts`:**
- `"keyboard-input-required": "Ingrese un carácter por teclado"`
- `"keyboard-input-description": "El programa está esperando que ingrese un carácter. Use el teclado virtual o su teclado físico."`

**`app/src/lib/i18n/locales/english.ts`:**
- `"keyboard-input-required": "Enter a character from keyboard"`
- `"keyboard-input-description": "The program is waiting for you to enter a character. Use the virtual keyboard or your physical keyboard."`

### 2. Modificación de Eventos del Teclado
**`app/src/computer/keyboard/events.ts`:**
- Se agregó la funcionalidad para mostrar un toast informativo cuando se ejecuta `keyboard:listen-key`
- Se importaron las funciones necesarias: `toast`, `translate`, y `getSettings`
- El toast se muestra por 5 segundos con variante "info"

### 3. Mejora del Mensaje Técnico
**`app/src/computer/simulation.ts`:**
- Se mejoró el mensaje técnico que aparece en el área de mensajes del simulador
- Cambió de "Interrupción: Rutina leer caracter del teclado" a "INT 6: Lectura de carácter del teclado"

## Funcionamiento

Cuando se ejecuta la instrucción `INT 6` en un programa:

1. **Mensaje técnico**: Aparece en el área de mensajes del simulador: "INT 6: Lectura de carácter del teclado"

2. **Toast al usuario**: Se muestra un toast amigable con:
   - **Título**: "Ingrese un carácter por teclado" (español) o "Enter a character from keyboard" (inglés)
   - **Descripción**: "El programa está esperando que ingrese un carácter. Use el teclado virtual o su teclado físico."
   - **Duración**: 5 segundos
   - **Variante**: Info (color azul informativo)

3. **Estado visual**: El simulador cambia a estado "Esperando tecla..." en la interfaz

## Ejemplo de Programa de Prueba

```assembly
; Programa de prueba para INT 6 - Lectura de carácter del teclado
car DB 0           ; Variable para almacenar el carácter ingresado

MOV BL, OFFSET car ; BL apunta a la dirección donde se guardará el carácter
INT 6              ; Llamada al sistema para leer un carácter del teclado
HLT                ; Detener la ejecución
```

## Beneficios

1. **Mejor experiencia de usuario**: Los usuarios ahora reciben una notificación clara cuando el programa espera input
2. **Reducción de confusión**: Elimina la incertidumbre sobre por qué el programa se "colgó"
3. **Instrucciones claras**: Le dice al usuario exactamente qué hacer y cómo hacerlo
4. **Multiidioma**: Funciona tanto en español como en inglés
5. **No intrusivo**: El toast desaparece automáticamente después de 5 segundos

## Archivos Modificados

1. `app/src/lib/i18n/locales/spanish.ts`
2. `app/src/lib/i18n/locales/english.ts`
3. `app/src/computer/keyboard/events.ts`
4. `app/src/computer/simulation.ts`

## Archivos Creados

1. `test_int6_keyboard.asm` - Programa de ejemplo para probar la funcionalidad
