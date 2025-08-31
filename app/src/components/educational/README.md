# Centro de Aprendizaje VonSim8

El Centro de Aprendizaje de VonSim8 es un sistema educativo interactivo diseñado para enseñar conceptos fundamentales de arquitectura de computadoras y programación en ensamblador.

## Características Principales

### 🎯 Tutoriales Interactivos

- **Componentes de la CPU**: Aprende sobre ALU, Unidad de Control y registros
- **Registros de la CPU**: Comprende los diferentes tipos de registros y sus funciones
- **Memoria RAM**: Entiende el funcionamiento de la memoria principal
- **Fundamentos de la CPU**: Conceptos básicos de CPU y registros

### 🏆 Sistema de Progreso

- **Logros desbloqueables**: Conocedor de Componentes, Experto en Registros, Explorador de Memoria
- **Niveles de aprendizaje**: Principiante, Intermedio, Avanzado
- **Puntos de experiencia**: Sistema de recompensas por completar tutoriales
- **Estadísticas de sesión**: Tiempo de aprendizaje y progreso

## Estructura de Archivos

```
educational/
├── README.md                    # Esta documentación
├── index.ts                     # Exportaciones de componentes
├── EducationalMenu.tsx          # Menú principal del centro de aprendizaje
├── EducationalProgress.tsx      # Sistema de progreso y logros
├── InteractiveTutorial.tsx      # Tutoriales interactivos
└── ConceptVisualizer.tsx        # Visualizaciones de conceptos
```

## Componentes Principales

### EducationalMenu

Menú principal que permite acceder a tutoriales y visualizaciones. Incluye:

- Lista de tutoriales disponibles con dificultad y duración
- Visualizaciones interactivas organizadas por categoría
- Acceso al sistema de progreso educativo

### InteractiveTutorial

Sistema de tutoriales paso a paso que incluye:

- Explicaciones detalladas de conceptos
- Evaluaciones interactivas (quizzes)
- Progreso automático entre pasos
- Integración con el sistema de logros

### EducationalProgress

Sistema de gamificación que incluye:

- Logros desbloqueables por completar tutoriales
- Niveles de aprendizaje con requisitos de puntos
- Estadísticas de tiempo de sesión
- Persistencia de progreso en localStorage

## Conceptos Educativos

### Componentes de la CPU

- **ALU (Unidad Aritmético-Lógica)**: Ejecuta operaciones aritméticas y lógicas
- **Unidad de Control**: Coordina el funcionamiento de todos los componentes
- **Registro de Flags**: Indicadores del estado de las operaciones (C, Z)

### Registros de la CPU

- **Registros de Propósito General**: AL, BL, CL, DL para datos
- **Puntero de Instrucción (IP)**: Dirección de la próxima instrucción
- **Registro de Instrucción (IR)**: Instrucción en curso
- **Registros de Memoria**: MAR y MBR para comunicación con memoria

### Memoria RAM

- **Estructura**: 256 celdas de 1 byte cada una
- **Direccionamiento**: Hexadecimal (00h-FFh)
- **Buses**: Datos (bidireccional), Direcciones (unidireccional), Control (rd/wr)
- **Registros**: MAR (dirección) y MBR (datos)

## Uso del Sistema

### Para Estudiantes

1. Abre el Centro de Aprendizaje desde el menú principal
2. Selecciona un tutorial según tu nivel de conocimiento
3. Completa los pasos del tutorial y las evaluaciones
4. Explora las visualizaciones interactivas
5. Revisa tu progreso y logros desbloqueados

### Para Desarrolladores

1. Los tutoriales se definen en `InteractiveTutorial.tsx`
2. Las visualizaciones se configuran en `ConceptVisualizer.tsx`
3. El sistema de progreso se maneja en `EducationalProgress.tsx`
4. Los logros se pueden personalizar en el array `ACHIEVEMENTS`

## Integración con VonSim8

El Centro de Aprendizaje está integrado con el simulador principal:

- Los tutoriales pueden referenciar componentes reales de la CPU
- Las visualizaciones muestran el estado actual del simulador
- El progreso se guarda automáticamente
- Los logros se desbloquean al completar actividades específicas

## Tecnologías Utilizadas

- **React**: Componentes funcionales con hooks
- **TypeScript**: Tipado estático para mejor desarrollo
- **Tailwind CSS**: Estilos y animaciones
- **FontAwesome**: Iconografía
- **localStorage**: Persistencia de progreso

## Contribuciones

Para mejorar el Centro de Aprendizaje:

1. Agrega nuevos tutoriales en `InteractiveTutorial.tsx`
2. Crea visualizaciones en `ConceptVisualizer.tsx`
3. Define nuevos logros en `EducationalProgress.tsx`
4. Actualiza esta documentación

## Próximas Mejoras

- [ ] Animaciones más fluidas en las visualizaciones
- [ ] Tutoriales avanzados sobre interrupciones
- [ ] Ejercicios prácticos con el simulador
- [ ] Sistema de certificaciones
- [ ] Exportación de progreso
- [ ] Modo multijugador para competencias
