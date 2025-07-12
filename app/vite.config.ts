import { execSync } from "node:child_process";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  appType: "mpa",
  base: "/VonSim8/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["fonts/**/*", "favicon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "VonSim8 - Simulador de Computadora de 8 bits",
        short_name: "VonSim8",
        description: "Simulador educativo de computadora de 8 bits con editor de código assembly integrado",
        theme_color: "#1c1917",
        display: "standalone",
        background_color: "#1c1917",
        start_url: "/VonSim8/",
        scope: "/VonSim8/",
        orientation: "any",
        categories: ["education", "productivity", "utilities"],
        lang: "es",
        icons: [
          { src: "icon-192.png", type: "image/png", sizes: "192x192", purpose: "any maskable" },
          { src: "icon-512.png", type: "image/png", sizes: "512x512", purpose: "any maskable" },
        ],
        screenshots: [
          {
            src: "screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide"
          },
          {
            src: "screenshot-narrow.png", 
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow"
          }
        ]
      },
      workbox: {
        navigateFallback: null,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              }
            }
          }
        ]
      },
    }),
  ],
  define: {
    __COMMIT_HASH__: JSON.stringify(getCommitHash()),
  },
  resolve: {
    alias: { "@/": "/src/" },
  },
});

function getCommitHash() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).toString().trim();
  } catch {
    return "unknown";
  }
}
