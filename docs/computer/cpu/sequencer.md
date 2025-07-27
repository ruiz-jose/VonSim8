# Secuenciador de Microoperaciones

El secuenciador es un componente educativo que muestra cómo se controla la secuencia de microoperaciones en la unidad de control de la CPU. Permite visualizar las diferentes fases del ciclo de instrucción y las señales de control que se generan en cada etapa.

## Características

### Visualización de Estados
- **Diagrama de estados**: Muestra las fases del ciclo de instrucción de forma visual
- **Fase actual destacada**: Resalta la fase que se está ejecutando actualmente
- **Señales de control**: Lista las señales específicas generadas en cada fase
- **Microoperaciones**: Muestra las operaciones elementales de cada fase

### Animaciones Educativas
- **Transiciones suaves**: El componente aparece con animaciones fluidas
- **Resaltado dinámico**: La fase actual se resalta con colores y efectos pulsantes
- **Interfaz intuitiva**: Botón "⚙️" en el decodificador para activar la visualización

### Contenido Educativo
- **Fases detalladas**: Explicación de cada fase del ciclo de instrucción
- **Señales específicas**: Lista de señales de control generadas
- **Conceptos clave**: Explicación de secuenciación y sincronización

## Cómo usar

1. **Abrir el secuenciador**: Haz clic en el botón "⚙️" junto al decodificador en la unidad de control
2. **Ejecutar un programa**: Carga y ejecuta un programa para ver las fases en acción
3. **Observar las transiciones**: La fase actual se resaltará automáticamente
4. **Cerrar la visualización**: Haz clic fuera del modal o en el botón "✕"

## Fases del Ciclo de Instrucción

### 1. Captación (Fetch)
- **Descripción**: Obtener la instrucción desde memoria
- **Microoperaciones**: 
  - `MAR←IP` (transferir IP a MAR)
  - `MBR←Mem[MAR]` (leer memoria)
  - `IR←MBR` (transferir a registro de instrucción)
- **Señales de Control**:
  - `RD=1` (señal de lectura)
  - `IO/M=0` (acceso a memoria)
  - `Bus Address` (activar bus de direcciones)

### 2. Decodificación (Decode)
- **Descripción**: Interpretar el código de operación
- **Microoperaciones**:
  - `Decodificar IR` (analizar instrucción)
  - `Generar señales de control` (preparar control)
- **Señales de Control**:
  - `Control Lines` (líneas de control)
  - `ALU Control` (control de ALU)

### 3. Ejecución (Execute)
- **Descripción**: Ejecutar la operación específica
- **Microoperaciones**:
  - `Ejecutar microoperaciones` (operaciones específicas)
  - `Actualizar registros` (modificar registros)
- **Señales de Control**:
  - `ALU Enable` (habilitar ALU)
  - `Register Enable` (habilitar registros)

### 4. Escritura (Writeback)
- **Descripción**: Guardar resultados en memoria/registros
- **Microoperaciones**:
  - `Escribir resultado` (guardar resultado)
  - `Actualizar flags` (modificar flags de estado)
- **Señales de Control**:
  - `WR=1` (señal de escritura)
  - `Flag Update` (actualizar flags)

## Conceptos Técnicos

### Secuenciador
El secuenciador es el componente de la unidad de control que determina el orden y la sincronización de las microoperaciones. Controla qué operación se ejecuta en cada momento y coordina todos los componentes de la CPU.

### Señales de Control
Las señales de control son impulsos eléctricos que activan o desactivan componentes específicos de la CPU. Cada fase del ciclo de instrucción genera un conjunto único de señales.

### Estados
Cada fase del ciclo de instrucción representa un estado diferente del secuenciador. La transición entre estados está controlada por el reloj del sistema y la lógica de control.

### Sincronización
La sincronización es crucial para que todas las operaciones se ejecuten en el momento correcto. El secuenciador asegura que las señales de control se generen en la secuencia apropiada.

## Beneficios Educativos

1. **Comprensión de secuenciación**: Ayuda a entender cómo se controla el orden de las operaciones
2. **Visualización de estados**: Muestra las fases del ciclo de instrucción de forma clara
3. **Señales de control**: Introduce el concepto de señales de control y su función
4. **Sincronización**: Explica la importancia de la sincronización en la CPU

## Implementación Técnica

El secuenciador está implementado como un componente React que:
- Utiliza react-spring para animaciones suaves
- Se integra con el sistema de eventos de la CPU
- Responde dinámicamente al estado de ejecución
- Mantiene consistencia visual con el resto del simulador
- Incluye un diagrama de estados visual con transiciones

## Relación con la Memoria de Control

El secuenciador trabaja en conjunto con la memoria de control:
- **Memoria de Control**: Almacena las microinstrucciones para cada instrucción
- **Secuenciador**: Controla el orden y la sincronización de esas microinstrucciones
- **Integración**: Ambos componentes forman la unidad de control completa

Esta integración permite una comprensión completa de cómo funciona la unidad de control en una CPU real. 