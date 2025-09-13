# 🧪 Tests

Tests automatizados para validar el funcionamiento del simulador y ensamblador VonSim8.

## 📁 Estructura

### `unit/`
Tests unitarios para componentes específicos:
- **[`assembler.test.mjs`](./unit/assembler.test.mjs)** - Tests del ensamblador y parser
- **[`pic-detection.test.mjs`](./unit/pic-detection.test.mjs)** - Tests de detección del PIC

### `integration/` *(planeado)*
Tests de integración entre componentes

### `fixtures/` *(planeado)*
Archivos de datos de prueba

## 🎯 Propósito

Estos tests están diseñados para:
- Validar el correcto funcionamiento del ensamblador
- Detectar regresiones en el código
- Asegurar la calidad del simulador
- Automatizar pruebas de componentes críticos

## 🚀 Cómo ejecutar

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests específicos
npm test -- unit/assembler.test.mjs
npm test -- unit/pic-detection.test.mjs
```

## 📊 Tests disponibles

### Assembler Tests
- Parsing correcto de instrucciones
- Manejo de errores de sintaxis
- Generación de código objeto
- Validación de etiquetas y direcciones

### PIC Detection Tests
- Detección automática del PIC
- Configuración correcta de interrupciones
- Validación de vectores de interrupción

## ⚠️ Notas importantes

- Los tests están separados de los ejemplos educativos
- Usan Jest o similar como framework de testing
- Se ejecutan automáticamente en CI/CD
- Ayudan a mantener la estabilidad del simulador

## 🔧 Para desarrolladores

- Agregar tests para nuevas funcionalidades
- Mantener cobertura de código alta
- Ejecutar tests antes de commits
- Documentar tests complejos