// @ts-check

import { createMarkdownRenderer, defineConfig } from "vitepress";

import { generateOpenGraphs } from "./opengraph.js";
import { es } from "./locales/es.js";
import { localSearch, sidebarInstructions } from "./shared.js";
import vonsimLang from "./vonsim.tmLanguage.json";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "VonSim8",
  titleTemplate: ":title | VonSim8",
  description:
    "A 8088-like Assembly Simulator with multiple devices and functionality. Works on desktop and mobile.",
  lastUpdated: true,
  themeConfig: {
    editLink: { pattern: "https://github.com/ruiz-jose/VonSim8/edit/main/docs/:path" },
    externalLinkIcon: true,
    footer: {
      message: `This work is licensed under <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.`,
    },
    logo: "/logo.svg",
    nav: [{ text: "Simulator", link: "/" }],
    notFound: {
      code: "404",
      title: "PAGE NOT FOUND",
      quote: "Page not in cache. Or memory. Or anywhere, really.",
      linkLabel: "go to home",
      linkText: "JMP home",
    },
    search: localSearch(),
    socialLinks: [{ icon: "github", link: "https://github.com/ruiz-jose/VonSim8" }],
    sidebar: [
      {
        text: "Computadora",
        items: [
          { text: "CPU", link: "/computer/cpu" },
          { text: "Memoria principal", link: "/computer/memory" },
          { text: "Lenguaje ensamblador", link: "/computer/assembly" },
          {
            text: "Instrucciones",
            link: "/computer/instructions/",
            collapsed: true,
            items: sidebarInstructions(),
          },
        ],
      },
      {
        text: "Entrada/Salida",
        items: [
          { text: "Conceptos generales", link: "/io/" },
          {
            text: "Módulos E/S",
            link: "/io/modules/",
            collapsed: false,
            items: [
              { text: "Handshake", link: "/io/modules/handshake" },
              { text: "PIC", link: "/io/modules/pic" },
              { text: "PIO", link: "/io/modules/pio" },
              { text: "Timer", link: "/io/modules/timer" },
            ],
          },
          {
            text: "Dispositivos",
            link: "/io/devices/",
            collapsed: false,
            items: [
              { text: "Reloj", link: "/io/devices/clock" },
              { text: "Tecla F10", link: "/io/devices/f10" },
              { text: "Teclado", link: "/io/devices/keyboard" },
              { text: "Impresora", link: "/io/devices/printer" },
              { text: "Pantalla", link: "/io/devices/screen" },
              { text: "Llaves y luces", link: "/io/devices/switches-and-leds" },
            ],
          },
        ],
      },
      {
        text: "Referencia",
        items: [
          { text: "Tabla ASCII", link: "/reference/ascii" },
          { text: "Codificación", link: "/reference/encoding" },
          { text: "Notas de versión", link: "/changelog" },
        ],
      },
    ],
    sidebarMenuLabel: "Menú",
  },
  markdown: {
    // @ts-ignore
    languages: [vonsimLang],
  },
  head: [
    ["link", { rel: "icon", href: "/logo.svg" }],
    // Scripts de analytics eliminados
  ],

  assetsDir: "assets/docs",
  ignoreDeadLinks: true, // Until english is fully translated

  vite: {
    build: {
      rollupOptions: {
        // manualChunks eliminado para evitar errores con módulos externos
      },
      chunkSizeWarningLimit: 1000 // Opcional: sube el límite de advertencia a 1MB
    }
  },

  async transformHead({ pageData, siteConfig }) {
    const titleTemplate = pageData.titleTemplate ?? siteConfig.userConfig.titleTemplate;
    if (
      pageData.isNotFound ||
      !pageData.filePath.endsWith(".md") ||
      typeof titleTemplate !== "string"
    ) {
      return;
    }

    const fullTitle = titleTemplate.replace(":title", pageData.title);
    const canonicalUrl = `https://ruiz-jose.github.io/VonSim8/docs/${pageData.relativePath}`
      .replace(/index\.md$/, "")
      .replace(/\.md$/, ".html");
    const ogPath = pageData.filePath.replace(/\.md$/, ".png");

    return [
      ["link", { rel: "canonical", href: canonicalUrl }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:url", content: canonicalUrl }],
      ["meta", { property: "og:title", content: fullTitle }],
      ["meta", { property: "og:image", content: `https://ruiz-jose.github.io/VonSim8/docs/${ogPath}` }],
    ];
  },

  async buildEnd(siteConfig) {
    const md = await createMarkdownRenderer(
      siteConfig.srcDir,
      siteConfig.markdown,
      siteConfig.site.base,
      siteConfig.logger,
    );
    await generateOpenGraphs(md, new URL(`file://${siteConfig.outDir}/`));
  },
});
