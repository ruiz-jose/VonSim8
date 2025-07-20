// @ts-check

import { localSearch, sidebarInstructions } from "../shared.js";

/** @type {import("vitepress").LocaleSpecificConfig<import("vitepress").DefaultTheme.Config>} */
export const es = {
  lang: "es",
  description:
    "Un simulador de ensamblador 8088 con múltiples dispositivos y funcionalidades. Funciona en escritorio y móvil.",
  themeConfig: {
    darkModeSwitchLabel: "Aparencia",
    darkModeSwitchTitle: "Cambiar a modo oscuro",
    docFooter: { prev: "Anterior", next: "Siguiente" },
    editLink: {
      pattern: "https://github.com/ruiz-jose/VonSim8/edit/main/docs/:path",
      text: "Editar esta página",
    },
    footer: {
      message: `Esta obra está bajo la licencia <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.`,
    },
    langMenuLabel: "Idioma",
    lastUpdated: { text: "Última actualización" },
    nav: [{ text: "Simulador", link: "/" }],
    notFound: {
      code: "404",
      title: "PÁGINA NO ENCONTRADA",
      quote: "Página no está en caché. Ni en memoria. Ni en ninguna parte, realmente.",
      linkLabel: "ir a la página principal",
      linkText: "JMP inicio",
    },
    outline: { label: "En esta página" },
    returnToTopLabel: "Volver arriba",
    search: localSearch({
      button: {
        buttonText: "Buscar",
        buttonAriaLabel: "Buscar",
      },
      modal: {
        backButtonTitle: "Cerrar búsqueda",
        displayDetails: "Mostrar lista detallada",
        footer: {
          closeKeyAriaLabel: "escape",
          closeText: "para cerrar",
          navigateDownKeyAriaLabel: "flecha abajo",
          navigateText: "para navegar",
          navigateUpKeyAriaLabel: "flecha arriba",
          selectKeyAriaLabel: "enter",
          selectText: "para seleccionar",
        },
        noResultsText: "No se encontraron resultados para",
        resetButtonTitle: "Limpiar búsqueda",
      },
    }),
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
};
