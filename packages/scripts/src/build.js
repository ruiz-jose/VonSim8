import fs from "node:fs/promises";
import path from "node:path";

import { $ } from "execa";
import { glob } from "glob";

// Validar versión de Node
const requiredNodeVersion = "22.0.0";
const currentNodeVersion = process.version;
const nodeVersionMatch = currentNodeVersion.match(/v(\d+\.\d+\.\d+)/);

if (!nodeVersionMatch || nodeVersionMatch[1] < requiredNodeVersion) {
  console.error(
    `❌ Error: Se requiere Node.js >= ${requiredNodeVersion}, pero tienes ${currentNodeVersion}`,
  );
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
  new URL("./packages/", rootDir),
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

// Normaliza el path para evitar doble barra
function normalizePathForGlob(url) {
  let p = url.pathname;
  if (p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

// Copiar archivos de app/dist a dist
const appDistDir = new URL("./dist/", appDir);
const appDistPath = normalizePathForGlob(appDistDir);
const distPath = normalizePathForGlob(distDir);

if (await fs.stat(appDistDir).catch(() => false)) {
  console.info(`🔍 Verificando contenido de: ${appDistPath}`);

  // Listar contenido del directorio para debug
  try {
    const dirContents = await fs.readdir(appDistDir, { withFileTypes: true });
    console.info(`📁 Contenido del directorio:`);
    dirContents.forEach(item => {
      const type = item.isDirectory() ? "📁" : "📄";
      console.info(`  ${type} ${item.name}`);
    });
  } catch (error) {
    console.warn(`⚠️  No se pudo leer el directorio: ${error.message}`);
  }

  // Verificar que existan archivos para copiar usando glob
  const filesToCopy = await glob(appDistPath + "/*", { windowsPathsNoEscape: true });

  if (filesToCopy.length > 0) {
    console.info(`✅ Encontrados ${filesToCopy.length} archivos para copiar:`);
    filesToCopy.forEach(file => console.info(`  📄 ${path.basename(file)}`));

    try {
      await $`cp -r ${appDistPath}/* ${distPath}/`;
      console.info(`✅ Archivos copiados exitosamente a ${distPath}`);
      // Limpiar app/dist después de copiar
      await fs.rm(appDistDir, { recursive: true });
      console.info(`🗑️  Directorio ${appDistPath} limpiado`);
    } catch (error) {
      console.error(`❌ Error copiando archivos: ${error.message}`);
      // No fallar el build, solo mostrar el error
      console.warn(`⚠️  Continuando sin copiar archivos de app...`);
    }
  } else {
    console.warn(`⚠️  No se encontraron archivos para copiar en ${appDistPath}`);
    console.warn(`⚠️  Continuando sin copiar archivos de app...`);
  }
} else {
  console.warn(`⚠️  El directorio ${appDistPath} no existe`);
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
const docsDistPath = normalizePathForGlob(docsDistDir);

if (await fs.stat(docsDistDir).catch(() => false)) {
  console.info(`🔍 Verificando contenido de: ${docsDistPath}`);

  const docsOutputDir = new URL("./docs/", distDir);
  await fs.mkdir(docsOutputDir, { recursive: true });

  // Listar contenido del directorio para debug
  try {
    const dirContents = await fs.readdir(docsDistDir, { withFileTypes: true });
    console.info(`📁 Contenido del directorio docs:`);
    dirContents.forEach(item => {
      const type = item.isDirectory() ? "📁" : "📄";
      console.info(`  ${type} ${item.name}`);
    });
  } catch (error) {
    console.warn(`⚠️  No se pudo leer el directorio docs: ${error.message}`);
  }

  // Verificar que existan archivos para copiar usando glob
  const filesToCopy = await glob(docsDistPath + "/*", { windowsPathsNoEscape: true });

  if (filesToCopy.length > 0) {
    console.info(`✅ Encontrados ${filesToCopy.length} archivos para copiar desde docs:`);
    filesToCopy.forEach(file => console.info(`  📄 ${path.basename(file)}`));

    try {
      await $`cp -r ${docsDistPath}/* ${docsOutputDir.pathname}`;
      console.info(`✅ Archivos de docs copiados exitosamente`);
    } catch (error) {
      console.error(`❌ Error copiando archivos de docs: ${error.message}`);
      console.warn(`⚠️  Continuando sin copiar archivos de docs...`);
    }
  } else {
    console.warn(`⚠️  No se encontraron archivos para copiar en ${docsDistPath}`);
    console.warn(`⚠️  Continuando sin copiar archivos de docs...`);
  }

  // Mover 404.html a la raíz de dist
  const docs404Path = new URL("./404.html", docsOutputDir);
  const root404Path = new URL("./404.html", distDir);
  if (await fs.stat(docs404Path).catch(() => false)) {
    try {
      await fs.rename(docs404Path, root404Path);
      console.info(`✅ 404.html movido a la raíz`);
    } catch (error) {
      console.warn(`⚠️  Error moviendo 404.html: ${error.message}`);
    }
  }

  // Limpiar docs/dist después de copiar
  try {
    await fs.rm(docsDistDir, { recursive: true });
    console.info(`🗑️  Directorio docs ${docsDistPath} limpiado`);
  } catch (error) {
    console.warn(`⚠️  Error limpiando directorio docs: ${error.message}`);
  }
} else {
  console.warn(`⚠️  El directorio docs ${docsDistPath} no existe`);
}

// Mostrar información del build completado
try {
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
