# Visibilidad del Decodificador

El decodificador de la unidad de control ha sido mejorado para ser más visible y proporcionar mejor retroalimentación visual durante la ejecución de programas.

## 🎯 Mejoras de Visibilidad

### Diseño Visual Mejorado
- **Borde destacado**: Borde verde brillante (`border-mantis-500`) que hace el decodificador más visible
- **Sombra con efecto**: Sombra verde que crea un efecto de profundidad y destaque
- **Gradientes**: Fondo con gradiente que mejora la apariencia visual
- **Tipografía mejorada**: Texto con sombra y efectos de brillo

### Indicadores de Actividad
- **Punto pulsante**: Un punto verde que parpadea cuando el decodificador está activo
- **Animación de pulso**: Todo el contenedor pulsa suavemente durante la ejecución
- **Barra de progreso mejorada**: Barra más alta y con gradiente para mejor visibilidad

### Botones Interactivos
- **Efectos hover**: Los botones se agrandan y brillan al pasar el mouse
- **Transiciones suaves**: Animaciones fluidas para mejor experiencia de usuario
- **Colores distintivos**: Botón verde (+) para memoria de control, azul (⚙️) para secuenciador

## 🔍 Cómo Identificar el Decodificador

### Ubicación
El decodificador se encuentra en la **unidad de control** de la CPU, ubicada en la parte inferior izquierda del simulador.

### Características Visuales
1. **Contenedor principal**: Rectángulo con borde verde brillante
2. **Etiqueta**: "DECODIFICADOR" en texto verde con sombra
3. **Barra de progreso**: Barra verde que se llena durante la decodificación
4. **Botones**: Botón cuadrado (+/-) para memoria de control y botón circular (⚙️) para secuenciador
5. **Memoria de control desplegable**: Sección que aparece/desaparece con animación suave

### Estados del Decodificador

#### Estado Inactivo
- Borde verde sin animación
- Sin punto pulsante
- Barra de progreso vacía
- Texto "Esperando..." o "CPU detenida"

#### Estado Activo
- Borde verde con animación de pulso
- Punto verde pulsante junto al texto
- Barra de progreso que se llena
- Nombre de la instrucción actual visible
- Memoria de control desplegable (si está activada)

## 🎮 Cómo Usar

### Ejecutar un Programa
1. **Cargar programa**: Abre un archivo .asm en el editor
2. **Compilar**: Haz clic en "Compilar" para generar el código máquina
3. **Ejecutar**: Haz clic en "Ejecutar" para comenzar la simulación
4. **Observar**: El decodificador se volverá visible y activo

### Acceder a Componentes Adicionales
1. **Memoria de Control**: Haz clic en el botón **"+"** para desplegar/ocultar dentro del decodificador
2. **Secuenciador**: Haz clic en el botón **"⚙️"** azul para abrir el modal del secuenciador
3. **Cerrar**: Para la memoria de control, haz clic en **"-"**; para el secuenciador, haz clic fuera del modal

## 📊 Información Mostrada

### Durante la Ejecución
- **Nombre de la instrucción**: Ej. "MOV", "ADD", "JMP"
- **Operandos**: Registros y valores involucrados
- **Progreso**: Barra que indica el avance de la decodificación
- **Estado**: Indicador visual de actividad

### Ejemplos de Visualización
```
DECODIFICADOR ● [██████████] 100%
MOV AL, 5
```

```
DECODIFICADOR ● [██████░░░░] 60%
ADD AL, BL
```

```
DECODIFICADOR   [░░░░░░░░░░] 0%
Esperando...
```

## 🔧 Implementación Técnica

### CSS Classes Utilizadas
- `border-mantis-500`: Borde verde brillante
- `shadow-lg shadow-mantis-500/20`: Sombra con efecto verde
- `animate-pulse`: Animación de pulso
- `drop-shadow`: Efecto de sombra en texto
- `bg-gradient-to-r`: Gradientes de fondo

### Estados Reactivos
- **cycle.phase**: Determina si el decodificador está activo
- **cycle.metadata**: Proporciona información de la instrucción actual
- **showControlMemory/showSequencer**: Controlan la visibilidad de modales

### Animaciones
- **Pulso**: Cuando `cycle.phase !== "stopped"`
- **Punto activo**: Indicador visual de actividad
- **Hover effects**: Interacciones con botones
- **Transiciones**: Cambios suaves entre estados

## 🎓 Beneficios Educativos

### Comprensión Visual
- **Identificación clara**: Fácil de encontrar y reconocer
- **Estado visible**: Se puede ver cuándo está trabajando
- **Progreso observable**: Barra de progreso muestra el avance

### Interactividad
- **Componentes adicionales**: Acceso fácil a memoria de control y secuenciador
- **Retroalimentación inmediata**: Cambios visuales instantáneos
- **Experiencia mejorada**: Interfaz más atractiva y profesional

### Aprendizaje
- **Conceptos claros**: Visualización de la decodificación de instrucciones
- **Proceso observable**: Se puede ver el trabajo interno de la CPU
- **Integración**: Conexión visual entre instrucciones y microoperaciones

## 🚀 Casos de Uso

### Para Estudiantes
1. **Identificar componentes**: Aprender a reconocer partes de la CPU
2. **Entender procesos**: Ver cómo se decodifican las instrucciones
3. **Seguir ejecución**: Observar el progreso de cada instrucción

### Para Educadores
1. **Demostración**: Mostrar el funcionamiento interno de la CPU
2. **Explicación**: Usar la visualización para explicar conceptos
3. **Evaluación**: Verificar que los estudiantes entienden el proceso

### Para Desarrolladores
1. **Debugging**: Entender qué instrucción se está procesando
2. **Optimización**: Ver el impacto de diferentes tipos de instrucciones
3. **Desarrollo**: Usar como referencia para implementar mejoras

Esta implementación hace que el decodificador sea mucho más visible y útil para el aprendizaje y la comprensión de la arquitectura de computadoras. 