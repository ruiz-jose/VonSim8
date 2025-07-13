import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  // Cleanup global que se ejecuta una vez después de todos los tests
  console.log("🧹 Finalizando tests E2E...");

  // Aquí puedes agregar lógica como:
  // - Limpiar archivos temporales
  // - Cerrar conexiones de base de datos
  // - Generar reportes finales
  // - Enviar notificaciones
}

export default globalTeardown;
