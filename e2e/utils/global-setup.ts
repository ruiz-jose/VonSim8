import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Setup global que se ejecuta una vez antes de todos los tests
  console.log('🚀 Iniciando configuración global de tests E2E...');
  
  // Aquí puedes agregar lógica como:
  // - Limpiar base de datos de prueba
  // - Crear usuarios de prueba
  // - Configurar variables de entorno
  // - Verificar que el servidor esté disponible
}

export default globalSetup; 