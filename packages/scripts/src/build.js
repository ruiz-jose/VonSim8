import fs from "node:fs/promises";
import path from "node:path";

import { $ } from "execa";

const rootDir = new URL("../../..", import.meta.url);
const distDir = new URL("./dist/", rootDir);

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
await $({ cwd: appDir })`pnpm run build`.pipeStdout(process.stdout).pipeStderr(process.stderr);

// Copiar archivos de app/dist a dist
const appDistDir = new URL("./dist/", appDir);
if (await fs.stat(appDistDir).catch(() => false)) {
  await $`cp -r ${appDistDir}/* ${distDir}`;
  // Limpiar app/dist después de copiar
  await fs.rm(appDistDir, { recursive: true });
}

console.info("\n\n========= Building @vonsim/docs =========\n");
const docsDir = new URL("./docs/", rootDir);
await $({ cwd: docsDir })`pnpm run build`.pipeStdout(process.stdout).pipeStderr(process.stderr);

// Copiar archivos de docs/dist a dist/docs
const docsDistDir = new URL("./dist/", docsDir);
if (await fs.stat(docsDistDir).catch(() => false)) {
  const docsOutputDir = new URL("./docs/", distDir);
  await fs.mkdir(docsOutputDir, { recursive: true });
  await $`cp -r ${docsDistDir}/* ${docsOutputDir}`;
  
  // Mover 404.html a la raíz de dist
  const docs404Path = new URL("./404.html", docsOutputDir);
  const root404Path = new URL("./404.html", distDir);
  if (await fs.stat(docs404Path).catch(() => false)) {
    await fs.rename(docs404Path, root404Path);
  }
  
  // Limpiar docs/dist después de copiar
  await fs.rm(docsDistDir, { recursive: true });
}

console.info("\n\nDone");
