import { addDynamicIconSelectors } from "@iconify/tailwind";
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Chivo", ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },

      colors: {
        mantis: {
          "50": "#f6faf3",
          "100": "#e9f5e3",
          "200": "#d3eac8",
          "300": "#afd89d",
          "400": "#82bd69",
          "500": "#61a146",
          "600": "#4c8435",
          "700": "#3d692c",
          "800": "#345427",
          "900": "#2b4522",
          "950": "#13250e",
        },
      },

      strokeWidth: {
        bus: "10px",
      },

      transitionTimingFunction: {
        realistic: "cubic-bezier(0.3, 0.7, 0.4, 1)",
        "realistic-bounce": "cubic-bezier(0.3, 0.7, 0.4, 1.5)",
      },
    },
  },
  plugins: [
    addDynamicIconSelectors(),
    tailwindcssAnimate,
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          scrollbar: value => ({
            "&::-webkit-scrollbar": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb, &::-webkit-scrollbar-corner": {
              borderRadius: "9999px",
              borderStyle: "solid",
              borderWidth: "4px",
              borderColor: "transparent",
              backgroundColor: value,
              backgroundClip: "content-box",
              padding: "1px",
            },
          }),
        },
        {
          type: "color",
          values: flattenColorPalette(theme("colors")),
        },
      );
    }),
  ],
} satisfies Config;

export default config;

// From https://github.com/tailwindlabs/tailwindcss/blob/master/src/util/flattenColorPalette.js
function flattenColorPalette(colors: Record<string, any>) {
  return Object.assign(
    {},
    ...Object.entries(colors ?? {}).flatMap(([color, values]) =>
      typeof values == "object"
        ? Object.entries(flattenColorPalette(values)).map(([number, hex]) => ({
            [color + (number === "DEFAULT" ? "" : `-${number}`)]: hex,
          }))
        : [{ [`${color}`]: values }],
    ),
  );
}
