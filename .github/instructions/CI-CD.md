# 🚀 Sistema de CI/CD de VonSim8

Este documento describe el sistema de CI/CD completamente automatizado de VonSim8.

## 📋 Workflows Disponibles

### 1. 🧪 Test Suite (`test.yml`)

**Triggers:** Push a `main`/`develop`, Pull Requests, Manual
**Jobs:**

- 🔍 **Code Quality**: Linting, formatting, security audit
- 🧪 **Unit Tests**: Tests unitarios con cobertura
- 🔗 **Integration Tests**: Tests de integración
- 🌐 **E2E Tests**: Tests end-to-end con Playwright
- 🏗️ **Build Validation**: Validación de build
- 📢 **Notifications**: Resumen de resultados

### 2. 🔍 Pull Request Checks (`pull-request.yml`)

**Triggers:** Pull Requests a `main`/`develop`
**Jobs:**

- 🔍 **Code Analysis**: Análisis de código y bundle size
- ⚡ **Quick Tests**: Tests rápidos
- 🏗️ **Build Check**: Validación de build
- 🤖 **Auto Review**: Revisión automática con comentarios

### 3. 🚀 Deploy to Production (`deploy.yml`)

**Triggers:** Push a `main`, Manual
**Jobs:**

- ✅ **Pre-deploy Validation**: Tests críticos y build
- 🌐 **Deploy to GitHub Pages**: Deploy automático
- 📢 **Deploy Notification**: Notificaciones de deploy

### 4. 🏷️ Release (`release.yml`)

**Triggers:** Push de tags `v*` (ej: `v1.0.0`)
**Jobs:**

- ✅ **Validate Release**: Validación completa
- 🚀 **Create Release**: Creación automática de release
- 📢 **Notify Release**: Notificaciones

## 🛠️ Scripts Disponibles

### Desarrollo Local

```bash
# Desarrollo
pnpm dev                    # Servidor de desarrollo
pnpm build                  # Build de producción
pnpm preview                # Preview del build

# Tests
pnpm test                   # Tests unitarios
pnpm test:watch             # Tests en modo watch
pnpm test:coverage          # Tests con cobertura
pnpm test:ui                # UI de tests
pnpm test:integration       # Tests de integración
pnpm test:e2e               # Tests E2E
pnpm test:e2e:ui            # UI de tests E2E
pnpm test:e2e:debug         # Tests E2E en modo debug

# Calidad de código
pnpm lint                   # Linting
pnpm format                 # Formateo automático
pnpm format:check           # Verificar formateo
pnpm audit                  # Auditoría de seguridad
pnpm type-check             # Verificación de tipos

# Utilidades
pnpm clean                  # Limpiar archivos generados
```

## 🔧 Configuración

### Variables de Entorno

Los workflows usan las siguientes variables:

- `NODE_VERSION`: '22'
- `PNPM_VERSION`: '10'

### Secrets Requeridos

- `GITHUB_TOKEN`: Automático (no requiere configuración)
- `CODECOV_TOKEN`: Para reportes de cobertura (opcional)

## 📊 Monitoreo y Métricas

### Cobertura de Tests

- Se sube automáticamente a Codecov
- Reportes disponibles en cada PR
- Tendencias históricas

### Bundle Size

- Monitoreado con Bundlewatch
- Alertas en PRs si aumenta significativamente
- Límites configurados en `.bundlewatch.json`

### Performance

- Tests de performance en E2E
- Métricas de build time
- Análisis de dependencias

## 🔄 Flujo de Trabajo

### 1. Desarrollo

```bash
# Crear feature branch
git checkout -b feature/nueva-funcionalidad

# Desarrollar y testear localmente
pnpm test
pnpm lint
pnpm build

# Commit con mensaje convencional
git commit -m "feat: agregar nueva funcionalidad"

# Push
git push origin feature/nueva-funcionalidad
```

### 2. Pull Request

- Se ejecutan automáticamente todos los checks
- Revisión automática con comentarios
- Labels automáticos según estado
- Build artifacts disponibles para descarga

### 3. Merge a Main

- Tests completos se ejecutan
- Deploy automático a GitHub Pages
- Notificaciones de estado

### 4. Release

```bash
# Crear tag
git tag v1.0.0
git push origin v1.0.0

# Se ejecuta automáticamente:
# - Validación completa
# - Creación de release en GitHub
# - Generación de changelog
# - Upload de assets
```

## 🎯 Mejores Prácticas

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato
refactor: refactorización
test: agregar tests
chore: tareas de mantenimiento
```

### Pull Requests

- Título descriptivo
- Descripción detallada
- Screenshots si aplica
- Tests incluidos
- Documentación actualizada

### Releases

- Usar versionado semántico (v1.0.0)
- Changelog automático
- Assets incluidos
- Notificaciones configuradas

## 🚨 Troubleshooting

### Tests Fallando

1. Verificar logs en GitHub Actions
2. Ejecutar localmente: `pnpm test`
3. Revisar mocks y configuración
4. Verificar dependencias

### Build Fallando

1. Verificar TypeScript: `pnpm type-check`
2. Revisar linting: `pnpm lint`
3. Verificar dependencias: `pnpm audit`
4. Limpiar cache: `pnpm clean`

### Deploy Fallando

1. Verificar tests en main
2. Revisar configuración de GitHub Pages
3. Verificar permisos del repositorio
4. Revisar logs de deploy

## 📈 Métricas y KPIs

### Calidad de Código

- Cobertura de tests > 80%
- 0 vulnerabilidades críticas
- 0 errores de linting
- Bundle size < 2MB

### Performance

- Build time < 5 minutos
- Deploy time < 3 minutos
- Tests time < 10 minutos

### Automatización

- 100% de commits con tests
- 100% de PRs con revisión automática
- 100% de releases automáticas

## 🔗 Enlaces Útiles

- [GitHub Actions](https://github.com/features/actions)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Codecov](https://codecov.io/)
- [Bundlewatch](https://bundlewatch.io/)
- [Dependabot](https://dependabot.com/)
