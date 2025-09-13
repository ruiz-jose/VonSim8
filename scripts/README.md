# 🛠️ Scripts

Scripts de automatización para el proyecto VonSim8.

## 📁 Archivos

### [`deploy.sh`](./deploy.sh)
Script de despliegue automatizado que:
- Ejecuta tests unitarios (obligatorios)
- Ejecuta tests E2E (opcionales)
- Construye la aplicación
- Despliega a producción

**Uso:**
```bash
# Ejecutar desde la raíz del proyecto
./scripts/deploy.sh

# O hacerlo ejecutable y correr
chmod +x scripts/deploy.sh
scripts/deploy.sh
```

## 🚀 Cómo agregar nuevos scripts

1. Crear el archivo `.sh` en esta carpeta
2. Agregar el shebang `#!/bin/bash`
3. Hacer el archivo ejecutable: `chmod +x scripts/nombre.sh`
4. Documentar el script en este README

## 📋 Scripts futuros sugeridos

- `build.sh` - Script de construcción
- `test.sh` - Script de testing completo
- `setup.sh` - Configuración inicial del proyecto
- `clean.sh` - Limpieza de archivos temporales
- `dev.sh` - Inicio del entorno de desarrollo

## ⚠️ Notas

- Todos los scripts deben ejecutarse desde la raíz del proyecto
- Usar rutas relativas en los scripts
- Documentar parámetros y opciones de cada script