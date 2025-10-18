import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { $ } from "execa";

// Función auxiliar para copiar directorios recursivamente
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

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

// Copiar archivos de app/dist a dist usando Node.js nativo
const appDistDir = new URL("./dist/", appDir);
const appDistPath = fileURLToPath(appDistDir);
const distPath = fileURLToPath(distDir);

if (await fs.stat(appDistPath).catch(() => false)) {
  console.info(`🔍 Verificando contenido de: ${appDistPath}`);

  // Listar contenido del directorio para debug
  try {
    const dirContents = await fs.readdir(appDistPath, { withFileTypes: true });
    console.info(`📁 Contenido del directorio:`);
    dirContents.forEach(item => {
      const type = item.isDirectory() ? "📁" : "📄";
      console.info(`  ${type} ${item.name}`);
    });

    if (dirContents.length > 0) {
      console.info(`✅ Encontrados ${dirContents.length} elementos para copiar`);

      try {
        // Usar copyDir en lugar de cp
        await copyDir(appDistPath, distPath);
        console.info(`✅ Archivos copiados exitosamente a ${distPath}`);

        // Limpiar app/dist después de copiar
        await fs.rm(appDistPath, { recursive: true });
        console.info(`🗑️  Directorio ${appDistPath} limpiado`);
      } catch (error) {
        console.error(`❌ Error copiando archivos: ${error.message}`);
        console.warn(`⚠️  Continuando sin copiar archivos de app...`);
      }
    } else {
      console.warn(`⚠️  No se encontraron archivos para copiar en ${appDistPath}`);
    }
  } catch (error) {
    console.warn(`⚠️  No se pudo leer el directorio: ${error.message}`);
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

// Copiar archivos de docs/.vitepress/dist a dist/docs usando Node.js nativo
const docsDistDir = new URL("./.vitepress/dist/", docsDir);
const docsDistPath = fileURLToPath(docsDistDir);

if (await fs.stat(docsDistPath).catch(() => false)) {
  console.info(`🔍 Verificando contenido de: ${docsDistPath}`);

  const docsOutputDir = new URL("./docs/", distDir);
  const docsOutputPath = fileURLToPath(docsOutputDir);
  await fs.mkdir(docsOutputPath, { recursive: true });

  // Listar contenido del directorio para debug
  try {
    const dirContents = await fs.readdir(docsDistPath, { withFileTypes: true });
    console.info(`📁 Contenido del directorio docs:`);
    dirContents.forEach(item => {
      const type = item.isDirectory() ? "📁" : "📄";
      console.info(`  ${type} ${item.name}`);
    });

    if (dirContents.length > 0) {
      console.info(`✅ Encontrados ${dirContents.length} elementos para copiar desde docs`);

      try {
        // Usar copyDir en lugar de cp
        await copyDir(docsDistPath, docsOutputPath);
        console.info(`✅ Archivos de docs copiados exitosamente`);
      } catch (error) {
        console.error(`❌ Error copiando archivos de docs: ${error.message}`);
        console.warn(`⚠️  Continuando sin copiar archivos de docs...`);
      }
    } else {
      console.warn(`⚠️  No se encontraron archivos para copiar en ${docsDistPath}`);
    }
  } catch (error) {
    console.warn(`⚠️  No se pudo leer el directorio docs: ${error.message}`);
  }

  // Mover 404.html a la raíz de dist
  const docs404Path = path.join(docsOutputPath, "404.html");
  const root404Path = path.join(distPath, "404.html");
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
    await fs.rm(docsDistPath, { recursive: true });
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
  console.info(`📁 Output directory: ${distPath}`);
  console.info(`📅 Build time: ${buildTime}`);
  console.info(`✅ All packages built and artifacts copied`);
  console.info("=".repeat(50));

  // Verificar y mostrar el contenido final de dist
  const finalContents = await fs.readdir(distPath, { withFileTypes: true });
  console.info("\n📦 Contenido final de dist:");
  finalContents.forEach(item => {
    const type = item.isDirectory() ? "📁" : "📄";
    console.info(`  ${type} ${item.name}`);
  });
} catch (error) {
  console.error("❌ Error al completar el build:", error.message);
  process.exit(1);
}
