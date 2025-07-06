import fs from "node:fs/promises";

import { $ } from "execa";

const rootDir = new URL("../../..", import.meta.url);
const distDir = new URL("./dist/", rootDir);

process.env.NODE_ENV = "production";

if (await fs.stat(distDir).catch(() => false)) {
  console.info("Cleaning dist directory");
  await fs.rm(distDir, { recursive: true });
}

console.info("\n\n========= Building @vonsim/app =========\n");
const appDir = new URL("./app/", rootDir);
await $({ cwd: appDir })`pnpm run build`.pipeStdout(process.stdout).pipeStderr(process.stderr);
await fs.rename(new URL("./dist/", appDir), distDir);

console.info("\n\n========= Building @vonsim/docs =========\n");
const docsDir = new URL("./docs/", rootDir);
await $({ cwd: docsDir })`pnpm run build`.pipeStdout(process.stdout).pipeStderr(process.stderr);

// Agregar un pequeño retraso antes de renombrar
await new Promise(resolve => setTimeout(resolve, 1000));

await fs.rename(new URL("./dist/", docsDir), new URL("./docs/", distDir));

await fs.rename(new URL("./docs/404.html", distDir), new URL("./404.html", distDir));

console.info("\n\nDone");
