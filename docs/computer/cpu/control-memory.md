# Memoria de Control

La memoria de control es un componente educativo que muestra cómo funciona internamente la unidad de control de la CPU. Permite visualizar las microinstrucciones y microoperaciones que se ejecutan para cada instrucción del programa.

## Características

### Visualización de Microprograma
- **Tabla de memoria de control**: Muestra todas las instrucciones disponibles con sus respectivas microoperaciones
- **Instrucción actual destacada**: Resalta la instrucción que se está ejecutando actualmente
- **Microoperaciones detalladas**: Lista paso a paso las operaciones elementales de cada instrucción

### Animaciones Educativas
- **Entrada suave**: El componente aparece con una animación de escala y opacidad
- **Resaltado dinámico**: La instrucción actual se resalta con un borde pulsante
- **Interfaz intuitiva**: Botón "+" en el decodificador para activar la visualización

### Contenido Educativo
- **Descripciones**: Cada instrucción incluye una explicación de su función
- **Conceptos clave**: Explicación de microinstrucciones, microoperaciones y secuencias
- **Ejemplos prácticos**: Microoperaciones realistas basadas en la arquitectura VonSim8

## Cómo usar

1. **Abrir la memoria de control**: Haz clic en el botón "+" junto al decodificador en la unidad de control
2. **Ejecutar un programa**: Carga y ejecuta un programa para ver las instrucciones en acción
3. **Observar las microoperaciones**: La instrucción actual se resaltará automáticamente
4. **Cerrar la visualización**: Haz clic fuera del modal o en el botón "✕"

## Microoperaciones Incluidas

### Instrucciones de Transferencia de Datos
- **MOV**: Transferencia entre registros y memoria
- **PUSH/POP**: Operaciones de pila

### Instrucciones Aritméticas
- **ADD**: Suma con actualización de flags
- **SUB**: Resta con actualización de flags
- **CMP**: Comparación sin modificar operandos

### Instrucciones de Control de Flujo
- **JMP**: Salto incondicional
- **JZ/JNZ**: Saltos condicionales
- **CALL/RET**: Llamadas a subrutinas

### Instrucciones del Sistema
- **HLT**: Detener la CPU

## Conceptos Técnicos

### Microinstrucción
Una microinstrucción es un comando elemental que controla una microoperación específica dentro de la CPU. Por ejemplo, "MAR←IP" transfiere el contenido del registro IP al registro MAR.

### Microoperación
Una microoperación es una operación atómica que se ejecuta en un solo ciclo de reloj. Ejemplos incluyen:
- Transferir datos entre registros
- Leer/escribir memoria
- Ejecutar operaciones en la ALU
- Actualizar flags de estado

### Secuencia de Microoperaciones
Cada instrucción de máquina se ejecuta mediante una secuencia específica de microoperaciones. Esta secuencia está almacenada en la memoria de control y se accede mediante el código de operación de la instrucción.

## Beneficios Educativos

1. **Comprensión profunda**: Ayuda a entender cómo las instrucciones de alto nivel se traducen en operaciones de bajo nivel
2. **Visualización clara**: Muestra la relación entre instrucciones y microoperaciones de forma visual
3. **Aprendizaje interactivo**: Permite experimentar con diferentes tipos de instrucciones
4. **Conceptos fundamentales**: Introduce conceptos clave de arquitectura de computadoras

## Implementación Técnica

La memoria de control está implementada como un componente React que:
- Utiliza react-spring para animaciones suaves
- Se integra con el sistema de eventos de la CPU
- Responde dinámicamente al estado de ejecución
- Mantiene consistencia visual con el resto del simulador 