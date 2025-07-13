import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

import { $ } from "execa";

// Validar versión de Node
const requiredNodeVersion = "22.0.0";
const currentNodeVersion = process.version;
const nodeVersionMatch = currentNodeVersion.match(/v(\d+\.\d+\.\d+)/);

if (!nodeVersionMatch || nodeVersionMatch[1] < requiredNodeVersion) {
  console.error(`❌ Error: Se requiere Node.js >= ${requiredNodeVersion}, pero tienes ${currentNodeVersion}`);
  console.error("Por favor, actualiza Node.js para continuar.");
  process.exit(1);
}

console.info(`✅ Node.js ${currentNodeVersion} - Compatible`);

const rootDir = new URL("../../..", import.meta.url);
const distDir = new URL("./dist/", rootDir);

// Validar estructura del proyecto
const requiredDirs = [
  new URL("./app/", rootDir),
  new URL("./docs/", rootDir),
  new URL("./packages/", rootDir)
];

for (const dir of requiredDirs) {
  try {
    await fs.access(dir);
    console.info(`✅ Directory exists: ${path.basename(dir.pathname)}`);
  } catch (error) {
    console.error(`❌ Required directory missing: ${path.basename(dir.pathname)}`);
    process.exit(1);
  }
}

process.env.NODE_ENV = "production";

// Limpiar directorio dist si existe
if (await fs.stat(distDir).catch(() => false)) {
  console.info("Cleaning dist directory");
  await fs.rm(distDir, { recursive: true });
}

// Crear directorio dist
await fs.mkdir(distDir, { recursive: true });

console.info("\n\n========= Building @vonsim/app =========\n");
const appDir = new URL("./app/", rootDir);
try {
  await $({ cwd: appDir })`pnpm run build`.pipeStdout(process.stdout).pipeStderr(process.stderr);
  console.info("✅ @vonsim/app build completed successfully");
} catch (error) {
  console.error("❌ Error building @vonsim/app:", error.message);
  process.exit(1);
}

// Copiar archivos de app/dist a dist
const appDistDir = new URL("./dist/", appDir);
if (await fs.stat(appDistDir).catch(() => false)) {
  await $`cp -r ${appDistDir.pathname}/* ${distDir.pathname}`;
  // Limpiar app/dist después de copiar
  await fs.rm(appDistDir, { recursive: true });
}

console.info("\n\n========= Building @vonsim/docs =========\n");
const docsDir = new URL("./docs/", rootDir);
try {
  await $({ cwd: docsDir })`pnpm run build`.pipeStdout(process.stdout).pipeStderr(process.stderr);
  console.info("✅ @vonsim/docs build completed successfully");
} catch (error) {
  console.error("❌ Error building @vonsim/docs:", error.message);
  process.exit(1);
}

// Copiar archivos de docs/dist a dist/docs
const docsDistDir = new URL("./dist/", docsDir);
if (await fs.stat(docsDistDir).catch(() => false)) {
  const docsOutputDir = new URL("./docs/", distDir);
  await fs.mkdir(docsOutputDir, { recursive: true });
  await $`cp -r ${docsDistDir.pathname}/* ${docsOutputDir.pathname}`;
  
  // Mover 404.html a la raíz de dist
  const docs404Path = new URL("./404.html", docsOutputDir);
  const root404Path = new URL("./404.html", distDir);
  if (await fs.stat(docs404Path).catch(() => false)) {
    await fs.rename(docs404Path, root404Path);
  }
  
  // Limpiar docs/dist después de copiar
  await fs.rm(docsDistDir, { recursive: true });
}

// Mostrar información del build completado
try {
  const distStats = await fs.stat(distDir);
  const buildTime = new Date().toLocaleTimeString();
  
  console.info("\n" + "=".repeat(50));
  console.info("🎉 BUILD COMPLETED SUCCESSFULLY");
  console.info("=".repeat(50));
  console.info(`📁 Output directory: ${distDir.pathname}`);
  console.info(`📅 Build time: ${buildTime}`);
  console.info(`✅ All packages built and artifacts copied`);
  console.info("=".repeat(50));
} catch (error) {
  console.error("❌ Error getting build information:", error.message);
  process.exit(1);
}
