# Componentes Educativos de VonSim8

Este directorio contiene componentes específicamente diseñados para mejorar la experiencia educativa de VonSim8, un simulador de arquitectura de computadoras Von Neumann.

## 🎯 Objetivo

Los componentes educativos están diseñados para:

- **Facilitar la comprensión** de conceptos de arquitectura de computadoras
- **Proporcionar retroalimentación visual** en tiempo real
- **Adaptarse a diferentes niveles** de conocimiento (básico, intermedio, avanzado)
- **Crear una experiencia interactiva** y engaging para estudiantes
- **Gamificar el aprendizaje** con sistema de progreso y logros
- **Proporcionar tutoriales interactivos** paso a paso

## 📚 Componentes Disponibles

### 1. **EducationalTooltip**

Tooltips contextuales con explicaciones pedagógicas adaptadas a diferentes niveles de complejidad.

```tsx
import { EducationalTooltip } from "@/components/educational";

<EducationalTooltip concept="register" level="beginner">
  <span>Registro AX</span>
</EducationalTooltip>;
```

**Conceptos disponibles:**

- `register` - Registros de la CPU
- `memory` - Memoria RAM
- `alu` - Unidad Aritmético-Lógica
- `bus` - Buses de datos y control
- `instruction` - Instrucciones de máquina
- `program-counter` - Contador de programa
- `flags` - Banderas de estado
- `stack` - Pila de memoria
- `interrupt` - Sistema de interrupciones
- `peripheral` - Dispositivos periféricos
- `assembly` - Lenguaje ensamblador
- `addressing` - Modos de direccionamiento

### 2. **EducationalProgress**

Sistema de progreso educativo con niveles, logros y estadísticas de aprendizaje.

```tsx
import { EducationalProgress, emitProgressEvent } from "@/components/educational";

// Emitir eventos de progreso
emitProgressEvent("instructions_executed", 1);
emitProgressEvent("programs_written", 1);
emitProgressEvent("concept_mastered", 1);

// El componente se renderiza automáticamente
```

**Características:**

- Sistema de logros desbloqueables
- Niveles de aprendizaje progresivos
- Estadísticas de tiempo de sesión
- Persistencia de progreso en localStorage

### 3. **InteractiveTutorial**

Tutoriales interactivos paso a paso con ejercicios y quizzes.

```tsx
import { InteractiveTutorial, AVAILABLE_TUTORIALS } from "@/components/educational";

const tutorial = AVAILABLE_TUTORIALS.find(t => t.id === "cpu-basics");

<InteractiveTutorial
  tutorial={tutorial}
  onComplete={tutorialId => {
    emitProgressEvent("tutorials_completed", 1);
  }}
/>;
```

**Tutoriales disponibles:**

- **Fundamentos de la CPU**: Conceptos básicos de CPU y registros
- **Memoria RAM**: Funcionamiento de la memoria principal
- **Ciclo de Instrucción**: Fases fetch-decode-execute

### 4. **ConceptVisualizer**

Visualizaciones interactivas de conceptos complejos con animaciones.

```tsx
import { ConceptVisualizer } from "@/components/educational";

<ConceptVisualizer concept="fetch-decode-execute" onClose={() => setShowVisualizer(false)} />;
```

**Conceptos visualizables:**

- `fetch-decode-execute` - Ciclo de instrucción
- `memory-access` - Acceso a memoria
- `register-transfer` - Transferencia entre registros
- `alu-operation` - Operaciones ALU
- `bus-communication` - Comunicación por bus

### 5. **ExecutionPhases**

Indicador visual mejorado de las fases del ciclo fetch-decode-execute de la CPU.

```tsx
import { ExecutionPhases } from "@/components/educational";

<ExecutionPhases currentPhase="fetch" />;
```

**Mejoras:**

- Información detallada al hacer clic
- Modo interactivo con explicaciones
- Animaciones mejoradas

### 6. **StepByStepMode**

Modo paso a paso para ejecutar instrucciones con controles de reproducción.

```tsx
import { StepByStepMode } from "@/components/educational";

const steps = [
  {
    id: "step1",
    phase: "fetch",
    title: "Leer instrucción",
    description: "La CPU lee la siguiente instrucción de la memoria",
    instruction: "MOV AL, 5",
    registers: { IP: "00", AL: "00" },
  },
];

<StepByStepMode steps={steps} onComplete={() => console.log("Completado")} />;
```

### 7. **DataFlowAnimation**

Animaciones visuales del flujo de datos entre componentes.

```tsx
import { DataFlowAnimation, useDataFlow } from "@/components/educational";

<DataFlowAnimation from="CPU" to="Memory" data="A1" duration={2000} />;

// O usar el hook para múltiples animaciones
const { addFlow, flows } = useDataFlow();
addFlow({ from: "AL", to: "BL", data: "25" });
```

## 🎮 Uso en la Aplicación

Los componentes educativos están integrados en la aplicación principal:

- **EducationalTooltip**: Aparece al hacer hover sobre elementos con conceptos educativos
- **EducationalProgress**: Panel flotante en la esquina inferior izquierda
- **InteractiveTutorial**: Se activa desde el menú de tutoriales
- **ConceptVisualizer**: Se abre desde botones de visualización
- **ExecutionPhases**: Se muestra en la interfaz de la CPU

- **DataFlowAnimation**: Se activa durante la ejecución de instrucciones

## 🏆 Sistema de Logros

### Tipos de Logros

- **Primer Programa**: Escribir el primer programa en ensamblador
- **Maestro de Instrucciones**: Ejecutar 100 instrucciones
- **Explorador de Memoria**: Comprender el funcionamiento de la memoria RAM
- **Arquitecto de CPU**: Dominar los conceptos de arquitectura de CPU
- **Estudiante Persistente**: Pasar 30 minutos aprendiendo

### Niveles de Aprendizaje

- **Principiante**: Conceptos básicos (0 puntos)
- **Intermedio**: Operaciones aritméticas y lógicas (50 puntos)
- **Avanzado**: Interrupciones y programación compleja (100 puntos)

## 🎨 Personalización

Cada componente puede personalizarse mediante props:

```tsx
// Cambiar nivel de complejidad
<EducationalTooltip concept="register" level="advanced" />

// Personalizar animaciones
<DataFlowAnimation
  duration={3000}
  className="custom-animation"
/>



// Personalizar tutoriales
<InteractiveTutorial
  tutorial={customTutorial}
  onComplete={customHandler}
/>
```

## 📖 Conceptos Educativos

### Niveles de Complejidad

1. **Básico (Beginner)**: Explicaciones simples con analogías cotidianas
2. **Intermedio (Intermediate)**: Conceptos técnicos con contexto
3. **Avanzado (Advanced)**: Detalles técnicos específicos de la arquitectura

### Conceptos Cubiertos

- **Arquitectura de CPU**: Registros de 8 bits (AL, BL, CL, DL), ALU, buses, ciclo de instrucción
- **Memoria**: RAM de 256 bytes, direccionamiento de 8 bits, acceso a datos
- **Programación**: Lenguaje ensamblador de 8 bits, instrucciones, operandos
- **Sistema de I/O**: Periféricos, interrupciones, comunicación
- **Conceptos Avanzados**: Modos de direccionamiento, interrupciones

## 🔧 Desarrollo

### Agregar Nuevos Conceptos Educativos

1. Agregar el concepto en `EDUCATIONAL_CONTENT` en `EducationalTooltip.tsx`
2. Crear tooltips en los componentes relevantes
3. Actualizar la documentación

### Crear Nuevos Tutoriales

1. Definir el tutorial en `AVAILABLE_TUTORIALS` en `InteractiveTutorial.tsx`
2. Crear pasos con ejercicios y explicaciones
3. Integrar con el sistema de progreso

### Agregar Nuevas Visualizaciones

1. Definir la visualización en `VISUALIZATIONS` en `ConceptVisualizer.tsx`
2. Implementar las animaciones correspondientes
3. Integrar con los eventos de la simulación

### Crear Nuevos Logros

1. Agregar el logro en `ACHIEVEMENTS` en `EducationalProgress.tsx`
2. Emitir eventos de progreso en los lugares apropiados
3. Actualizar la documentación

## 🧪 Testing

Los componentes educativos incluyen tests específicos para:

- Funcionalidad de diferentes niveles
- Accesibilidad
- Responsividad
- Integración con el simulador

```bash
npm run test:educational
```

## 📈 Métricas Educativas

Los componentes recopilan métricas anónimas para mejorar la experiencia:

- Tiempo de interacción
- Nivel de complejidad seleccionado
- Conceptos más consultados
- Progreso en el modo paso a paso
- Logros desbloqueados
- Tiempo de sesión

## 🔧 Configuración

### Personalización de Contenido

```tsx
// Agregar nuevos conceptos educativos
const EDUCATIONAL_CONTENT = {
  "nuevo-concepto": {
    beginner: "Explicación básica",
    intermediate: "Explicación intermedia",
    advanced: "Explicación avanzada",
  },
};
```

### Temas Visuales

```css
/* Variables CSS para personalización */
:root {
  --educational-primary: #10b981;
  --educational-secondary: #f59e0b;
  --educational-accent: #8b5cf6;
}
```

## 🤝 Contribución

Para contribuir a los componentes educativos:

1. **Mantener enfoque pedagógico**: Cada componente debe tener valor educativo claro
2. **Seguir patrones de accesibilidad**: WCAG 2.1 AA
3. **Documentar cambios**: Explicar el impacto educativo
4. **Incluir tests**: Especialmente para funcionalidad educativa
5. **Integrar con progreso**: Conectar con el sistema de logros

## 🚀 Próximas Mejoras

- [ ] Sistema de ejercicios interactivos más complejos
- [ ] Visualizaciones 3D de conceptos arquitectónicos
- [ ] Modo colaborativo para aprendizaje grupal
- [ ] Integración con sistemas de gestión de aprendizaje (LMS)
- [ ] Análisis de progreso y recomendaciones personalizadas
- [ ] Exportación de certificados de logros

## 📖 Recursos Adicionales

- [Guía de Arquitectura de Computadoras](https://vonsim.github.io/docs)
- [Tutorial de VonSim8](https://vonsim.github.io/tutorial)
- [Referencia de Instrucciones](https://vonsim.github.io/instructions)

---

_Desarrollado con ❤️ para la educación en arquitectura de computadoras_
