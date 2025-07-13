# Tests de VonSim8

Esta carpeta contiene los tests mejorados para la aplicación VonSim8, organizados por categorías y siguiendo las mejores prácticas de testing.

## Estructura de Tests

```
test/
├── App.test.tsx                 # Tests del componente principal App
├── components/
│   └── Header.test.tsx          # Tests del componente Header
├── editor/
│   └── StatusBar.test.tsx       # Tests del StatusBar del editor
├── computer/
│   └── simulation.test.ts       # Tests de la simulación de CPU
├── utils/
│   └── helpers.test.ts          # Tests de funciones helper
├── integration/
│   └── workflow.test.tsx        # Tests de integración
├── setup.ts                     # Configuración de tests
└── README.md                    # Esta documentación
```

## Tipos de Tests

### 1. Tests de Componentes (Unit Tests)

- **App.test.tsx**: Tests del componente principal de la aplicación
- **Header.test.tsx**: Tests del componente Header con interacciones
- **StatusBar.test.tsx**: Tests del StatusBar del editor

### 2. Tests de Lógica (Unit Tests)

- **simulation.test.ts**: Tests de la lógica de simulación de CPU
- **helpers.test.ts**: Tests de funciones utilitarias

### 3. Tests de Integración

- **workflow.test.tsx**: Tests de flujos completos de la aplicación

## Configuración

### Setup de Tests

El archivo `setupTests.ts` configura:

- Mocks para APIs del navegador (File System Access, CodeMirror, etc.)
- Mocks para servicios externos (PostHog, PWA)
- Configuración de limpieza automática
- Extensión de expect para tests de accesibilidad

### Mocks Principales

- **CodeMirror**: Simula el editor de código
- **File System Access API**: Simula operaciones de archivos
- **PostHog**: Simula analytics
- **PWA**: Simula funcionalidad de Progressive Web App

## Ejecutar Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests específicos
npm test -- --grep "App Component"

# Ejecutar tests de un archivo específico
npm test App.test.tsx
```

### Cobertura de Tests

Los tests están configurados para mantener una cobertura mínima del 70% en:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Mejores Prácticas Implementadas

### 1. Organización

- Tests organizados por funcionalidad
- Nombres descriptivos para tests y describe blocks
- Separación clara entre unit tests e integration tests

### 2. Mocks y Stubs

- Mocks apropiados para dependencias externas
- Stubs para APIs del navegador no disponibles en Node.js
- Mocks específicos para cada test cuando sea necesario

### 3. Assertions

- Assertions específicas y descriptivas
- Verificación de comportamiento, no implementación
- Tests de casos edge y error

### 4. Accesibilidad

- Tests de ARIA attributes
- Verificación de navegación por teclado
- Tests de roles semánticos

### 5. Performance

- Tests de rendimiento para operaciones críticas
- Verificación de memory leaks
- Tests de debounce y throttling

## Casos de Test Cubiertos

### Componentes React

- ✅ Renderizado correcto
- ✅ Props y state
- ✅ Event handlers
- ✅ Lifecycle methods
- ✅ Accesibilidad
- ✅ Responsive design

### Lógica de Negocio

- ✅ Operaciones de CPU
- ✅ Manejo de memoria
- ✅ Ejecución de instrucciones
- ✅ Validaciones
- ✅ Manejo de errores

### Integración

- ✅ Flujos completos de usuario
- ✅ Interacción entre componentes
- ✅ Persistencia de datos
- ✅ Navegación por teclado
- ✅ Manejo de errores de red

### Utilidades

- ✅ Conversiones numéricas
- ✅ Validaciones
- ✅ Operaciones de arrays
- ✅ Manejo de strings
- ✅ Performance utilities

## Debugging de Tests

### Logs Detallados

```bash
# Ejecutar tests con logs detallados
npm test -- --verbose

# Ejecutar un test específico con logs
npm test -- --grep "should handle" --verbose
```

### Debug en VS Code

Agregar esta configuración a `.vscode/launch.json`:

```json
{
  "name": "Debug Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "--reporter=verbose"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Mantenimiento

### Agregar Nuevos Tests

1. Crear archivo en la carpeta apropiada
2. Seguir la convención de nombres: `ComponentName.test.tsx`
3. Usar describe blocks descriptivos
4. Agregar tests para casos edge y error
5. Verificar cobertura

### Actualizar Tests Existentes

1. Mantener compatibilidad con cambios de API
2. Actualizar mocks cuando sea necesario
3. Verificar que los tests sigan siendo relevantes
4. Refactorizar tests duplicados

### Cobertura de Código

- Mantener cobertura mínima del 70%
- Identificar código no cubierto
- Agregar tests para funcionalidad crítica
- Documentar decisiones de no testing

## Troubleshooting

### Problemas Comunes

#### Tests Failing en CI

- Verificar que los mocks estén configurados correctamente
- Asegurar que las APIs del navegador estén mockeadas
- Verificar que no haya dependencias de timing

#### Tests Lentos

- Optimizar mocks pesados
- Usar `vi.fn()` en lugar de implementaciones completas
- Evitar operaciones síncronas innecesarias

#### Memory Leaks

- Verificar que los event listeners se limpien
- Usar `afterEach` para limpieza
- Evitar referencias circulares en mocks

### Recursos Útiles

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event](https://testing-library.com/docs/user-event/intro/)

## Contribución

Al agregar nuevos tests:

1. Seguir las convenciones existentes
2. Agregar documentación si es necesario
3. Verificar que pasen en CI
4. Actualizar esta documentación si es relevante
