# Tests E2E - VonSim8

Este directorio contiene los tests end-to-end para VonSim8, un simulador de arquitectura de computadoras Von Neumann de 8 bits.

## 📁 Estructura Organizada

```
e2e/
├── specs/                    # Tests principales (se sube al repo)
│   ├── core/                # Funcionalidad básica
│   │   └── app-loading.spec.ts
│   ├── features/            # Funcionalidades específicas
│   │   ├── assembler.spec.ts
│   │   ├── simulation.spec.ts
│   │   └── educational.spec.ts
│   └── integration/         # Flujos completos
│       └── workflow.spec.ts
├── fixtures/                # Datos de prueba (se sube al repo)
│   └── programs/           # Programas de ejemplo
│       ├── valid-program.asm
│       ├── invalid-program.asm
│       └── fibonacci.asm
├── utils/                   # Utilidades compartidas (se sube al repo)
│   ├── test-helpers.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
├── local/                   # Tests locales (NO se sube)
├── test-results/            # Resultados (NO se sube)
├── playwright-report/       # Reportes HTML (NO se sube)
├── playwright.config.ts     # Configuración
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Comandos Disponibles

### Desarrollo Local
```bash
# Ejecutar todos los tests
pnpm test:e2e

# Ejecutar con UI interactiva
pnpm test:e2e:ui

# Ejecutar en modo headed (ver navegador)
pnpm test:e2e:headed

# Ejecutar en modo debug
pnpm test:e2e:debug

# Generar código de test interactivamente
pnpm test:e2e:codegen
```

### Tests Específicos
```bash
# Solo tests core (carga, navegación)
pnpm test:e2e:core

# Solo tests de features (ensamblador, simulación, educativo)
pnpm test:e2e:features

# Solo tests de integración (flujos completos)
pnpm test:e2e:integration
```

### CI/CD
```bash
# Tests para CI (solo Chromium)
pnpm test:e2e:ci

# Ver reportes
pnpm test:e2e:report
```

## 🎯 Funcionalidades Testeadas

### Core (Funcionalidad Básica)
- ✅ Carga de la aplicación
- ✅ Navegación principal
- ✅ Responsividad móvil
- ✅ Manejo de errores JavaScript

### Features (Funcionalidades Específicas)

#### Ensamblador
- ✅ Ensamblado de programas válidos
- ✅ Manejo de errores de sintaxis
- ✅ Limpieza del editor
- ✅ Validación de instrucciones

#### Simulación
- ✅ Ejecución de ciclos
- ✅ Ejecución de instrucciones completas
- ✅ Pausa y reanudación
- ✅ Reset de simulación
- ✅ Estados de simulación

#### Componentes Educativos
- ✅ Centro de aprendizaje
- ✅ Tooltips educativos
- ✅ Tutoriales interactivos
- ✅ Sistema de progreso
- ✅ Tour de bienvenida
- ✅ Visualizaciones de conceptos

### Integration (Flujos Completos)
- ✅ Flujo completo: escribir → ensamblar → ejecutar
- ✅ Manejo de errores y corrección
- ✅ Simulación con periféricos
- ✅ Configuración y personalización
- ✅ Aprendizaje educativo completo

## 🔧 Configuración

### Variables de Entorno
- `BASE_URL`: URL base de la aplicación (default: http://localhost:5173)
- `CI`: Configuración para entornos de CI/CD

### Navegadores
- **CI**: Solo Chromium para velocidad
- **Local**: Chromium, Firefox, WebKit, Mobile Chrome

## 📊 Reportes

Los reportes se generan automáticamente en:
- `playwright-report/`: Reporte HTML interactivo
- `test-results/`: Resultados en formato JSON
- Screenshots y videos en caso de fallos

## 🐛 Debugging

### Modo Debug
```bash
pnpm test:e2e:debug
```

### Screenshots Automáticos
Los screenshots se toman automáticamente en caso de fallo.

### Logs Específicos de VonSim8
```typescript
import { DebugHelper } from '../../utils/test-helpers';

// Log del estado de simulación
await DebugHelper.logSimulationState(page);

// Log del estado de la página
await DebugHelper.logPageState(page, 'Contexto');
```

## 📝 Escribiendo Tests para VonSim8

### Ejemplo Básico
```typescript
import { test, expect } from '@playwright/test';
import { VonSim8Helper, NavigationHelper } from '../../utils/test-helpers';

test.describe('Mi Funcionalidad', () => {
  test('debería hacer algo específico', async ({ page }) => {
    await NavigationHelper.goToHome(page);
    
    // Ensamblar programa
    await VonSim8Helper.assembleProgram(page, 'hlt');
    
    // Ejecutar ciclo
    await VonSim8Helper.runCycle(page);
    
    // Verificar resultado
    await VonSim8Helper.expectRegisterValue(page, 'al', '00');
  });
});
```

### Helpers Específicos de VonSim8

#### Simulación
```typescript
// Ensamblar programa
await VonSim8Helper.assembleProgram(page, program);

// Ejecutar ciclo/instrucción
await VonSim8Helper.runCycle(page);
await VonSim8Helper.runInstruction(page);

// Control de simulación
await VonSim8Helper.startSimulation(page);
await VonSim8Helper.pauseSimulation(page);
await VonSim8Helper.resetSimulation(page);
```

#### Registros y Memoria
```typescript
// Obtener valores
const alValue = await VonSim8Helper.getRegisterValue(page, 'al');
const memValue = await VonSim8Helper.getMemoryValue(page, '1000');

// Verificar valores
await VonSim8Helper.expectRegisterValue(page, 'al', '0A');
await VonSim8Helper.expectMemoryValue(page, '1000', 'FF');
```

#### Periféricos
```typescript
// Teclado
await VonSim8Helper.clickKeyboardKey(page, '5');

// LEDs
await VonSim8Helper.expectLEDState(page, 0, true);

// Switches
await VonSim8Helper.setSwitch(page, 1, true);
```

#### Componentes Educativos
```typescript
// Centro de aprendizaje
await VonSim8Helper.openEducationalCenter(page);

// Tutoriales
await VonSim8Helper.startTutorial(page, 'cpu-basics');
await VonSim8Helper.completeTutorial(page);
```

#### Configuración
```typescript
// Configuración
await VonSim8Helper.openSettings(page);
await VonSim8Helper.changeSimulationSpeed(page, 'fast');
await VonSim8Helper.changeTheme(page, 'dark');
```

## 🎮 Programas de Ejemplo

### Programas Disponibles en Fixtures
- `valid-program.asm`: Programa simple de suma
- `invalid-program.asm`: Programa con errores de sintaxis
- `fibonacci.asm`: Programa complejo de Fibonacci

### Uso en Tests
```typescript
import { readFileSync } from 'fs';
import path from 'path';

const program = readFileSync(
  path.join(__dirname, '../../fixtures/programs/fibonacci.asm'), 
  'utf-8'
);

await VonSim8Helper.assembleProgram(page, program);
```

## 🚫 Qué NO Subir al Repositorio

- `test-results/`: Resultados de ejecución
- `playwright-report/`: Reportes generados
- `local/`: Tests locales/debugging
- `screenshots/`: Screenshots temporales
- `.env.local`: Variables de entorno locales

## 🔄 CI/CD

Los tests se ejecutan automáticamente en:
- Pull Requests
- Merge a main
- Releases

Configuración optimizada para velocidad en CI con retry automático en fallos.

## 🎓 Casos de Uso Educativos

Los tests incluyen escenarios específicos para:
- **Estudiantes principiantes**: Tests básicos de carga y navegación
- **Estudiantes intermedios**: Tests de ensamblador y simulación
- **Estudiantes avanzados**: Tests de periféricos y flujos complejos
- **Educadores**: Tests de componentes educativos y tutoriales

## 🐛 Troubleshooting

### Problemas Comunes

1. **CodeMirror no disponible**
   ```typescript
   // Usar waitForFunction para esperar a que CodeMirror esté listo
   await page.waitForFunction(() => {
     const win = window as any;
     return win.codemirror;
   });
   ```

2. **Elementos no encontrados**
   ```typescript
   // Usar timeouts más largos para elementos dinámicos
   await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
   ```

3. **Simulación lenta**
   ```typescript
   // Ajustar velocidad de simulación para tests
   await VonSim8Helper.changeSimulationSpeed(page, 'fast');
   ```

## 📈 Métricas de Calidad

Los tests monitorean:
- **Cobertura funcional**: Todas las características principales
- **Estabilidad**: Tests robustos con retry automático
- **Performance**: Tiempos de ejecución optimizados
- **Accesibilidad**: Tests de navegación por teclado
- **Responsividad**: Tests en diferentes tamaños de pantalla

---

*Tests diseñados específicamente para VonSim8 - Simulador de Arquitectura de Computadoras* 