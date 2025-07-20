// @ts-check

import fs from "node:fs";

/**
 * Genera la lista de instrucciones para la barra lateral.
 */
export function sidebarInstructions() {
  const dir = new URL(`../computer/instructions/`, import.meta.url);
  const files = fs.readdirSync(dir);
  return files
    .filter(f => f.endsWith(".md") && f !== "index.md")
    .map(f => {
      const name = f.slice(0, -3);
      return { text: name.toUpperCase(), link: `/computer/instructions/${name}` };
    });
}

/**
 * @param {import("vitepress").DefaultTheme.LocalSearchOptions["translations"]} translations
 * @returns {import("vitepress").DefaultTheme.Config["search"]}
 */
export function localSearch(translations = undefined) {
  return {
    provider: "local",
    options: { translations },
  };
}
