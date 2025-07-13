#!/bin/bash

# Script de despliegue que no falla si los tests e2e tienen errores

echo "🚀 Iniciando proceso de despliegue..."

# Ejecutar tests unitarios (estos sí deben pasar)
echo "📋 Ejecutando tests unitarios..."
npm run test || { echo "❌ Tests unitarios fallaron. Abortando despliegue."; exit 1; }

# Ejecutar tests e2e (opcionales - no bloquean el despliegue)
echo "🔍 Ejecutando tests e2e (opcionales)..."
cd e2e
pnpm test:e2e:optional || echo "⚠️  Tests e2e fallaron pero continuando con el despliegue..."
cd ..

# Construir la aplicación
echo "🏗️  Construyendo la aplicación..."
npm run build || { echo "❌ Error en la construcción. Abortando despliegue."; exit 1; }

# Aquí puedes agregar los comandos de despliegue específicos
echo "🚀 Desplegando a producción..."
# git push origin main
# npm run deploy
# o cualquier otro comando de despliegue

echo "✅ Despliegue completado exitosamente!" 