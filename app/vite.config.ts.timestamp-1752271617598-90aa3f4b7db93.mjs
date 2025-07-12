// vite.config.ts
import { execSync } from "node:child_process";
import react from "file:///C:/temp/2025/VonSim8/node_modules/.pnpm/@vitejs+plugin-react-swc@3._324c43b49607240056dd01c209186755/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { defineConfig } from "file:///C:/temp/2025/VonSim8/node_modules/.pnpm/vite@5.4.19_@types+node@24.0.10_terser@5.43.1/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///C:/temp/2025/VonSim8/node_modules/.pnpm/vite-plugin-pwa@0.17.5_vite_88aca5abc9c3210d738378a908f0f6de/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
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
        description: "Simulador educativo de computadora de 8 bits con editor de c\xF3digo assembly integrado",
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
          { src: "icon-512.png", type: "image/png", sizes: "512x512", purpose: "any maskable" }
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
                maxAgeSeconds: 60 * 60 * 24 * 365
                // 1 año
              }
            }
          }
        ]
      }
    })
  ],
  define: {
    __COMMIT_HASH__: JSON.stringify(getCommitHash())
  },
  resolve: {
    alias: { "@/": "/src/" }
  }
});
function getCommitHash() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).toString().trim();
  } catch {
    return "unknown";
  }
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx0ZW1wXFxcXDIwMjVcXFxcVm9uU2ltOFxcXFxhcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHRlbXBcXFxcMjAyNVxcXFxWb25TaW04XFxcXGFwcFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdGVtcC8yMDI1L1ZvblNpbTgvYXBwL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwibm9kZTpjaGlsZF9wcm9jZXNzXCI7XG5cbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGFwcFR5cGU6IFwibXBhXCIsXG4gIGJhc2U6IFwiL1ZvblNpbTgvXCIsXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiBcInByb21wdFwiLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1wiZm9udHMvKiovKlwiLCBcImZhdmljb24uc3ZnXCIsIFwiaWNvbi0xOTIucG5nXCIsIFwiaWNvbi01MTIucG5nXCJdLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogXCJWb25TaW04IC0gU2ltdWxhZG9yIGRlIENvbXB1dGFkb3JhIGRlIDggYml0c1wiLFxuICAgICAgICBzaG9ydF9uYW1lOiBcIlZvblNpbThcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU2ltdWxhZG9yIGVkdWNhdGl2byBkZSBjb21wdXRhZG9yYSBkZSA4IGJpdHMgY29uIGVkaXRvciBkZSBjXHUwMEYzZGlnbyBhc3NlbWJseSBpbnRlZ3JhZG9cIixcbiAgICAgICAgdGhlbWVfY29sb3I6IFwiIzFjMTkxN1wiLFxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjMWMxOTE3XCIsXG4gICAgICAgIHN0YXJ0X3VybDogXCIvVm9uU2ltOC9cIixcbiAgICAgICAgc2NvcGU6IFwiL1ZvblNpbTgvXCIsXG4gICAgICAgIG9yaWVudGF0aW9uOiBcImFueVwiLFxuICAgICAgICBjYXRlZ29yaWVzOiBbXCJlZHVjYXRpb25cIiwgXCJwcm9kdWN0aXZpdHlcIiwgXCJ1dGlsaXRpZXNcIl0sXG4gICAgICAgIGxhbmc6IFwiZXNcIixcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7IHNyYzogXCJpY29uLTE5Mi5wbmdcIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiLCBwdXJwb3NlOiBcImFueSBtYXNrYWJsZVwiIH0sXG4gICAgICAgICAgeyBzcmM6IFwiaWNvbi01MTIucG5nXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjUxMng1MTJcIiwgcHVycG9zZTogXCJhbnkgbWFza2FibGVcIiB9LFxuICAgICAgICBdLFxuICAgICAgICBzY3JlZW5zaG90czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogXCJzY3JlZW5zaG90LXdpZGUucG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCIxMjgweDcyMFwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIGZvcm1fZmFjdG9yOiBcIndpZGVcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBcInNjcmVlbnNob3QtbmFycm93LnBuZ1wiLCBcbiAgICAgICAgICAgIHNpemVzOiBcIjc1MHgxMzM0XCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgZm9ybV9mYWN0b3I6IFwibmFycm93XCJcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6IG51bGwsXG4gICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd29mZjJ9XCJdLFxuICAgICAgICBydW50aW1lQ2FjaGluZzogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC5nb29nbGVhcGlzXFwuY29tXFwvLiovaSxcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZ29vZ2xlLWZvbnRzLWNhY2hlXCIsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUgLy8gMSBhXHUwMEYxb1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuICBkZWZpbmU6IHtcbiAgICBfX0NPTU1JVF9IQVNIX186IEpTT04uc3RyaW5naWZ5KGdldENvbW1pdEhhc2goKSksXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogeyBcIkAvXCI6IFwiL3NyYy9cIiB9LFxuICB9LFxufSk7XG5cbmZ1bmN0aW9uIGdldENvbW1pdEhhc2goKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGV4ZWNTeW5jKFwiZ2l0IHJldi1wYXJzZSAtLXNob3J0IEhFQURcIiwgeyBlbmNvZGluZzogXCJ1dGYtOFwiIH0pLnRvU3RyaW5nKCkudHJpbSgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gXCJ1bmtub3duXCI7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1EsU0FBUyxnQkFBZ0I7QUFFN1IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZTtBQUd4QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsRUFDVCxNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxlQUFlLENBQUMsY0FBYyxlQUFlLGdCQUFnQixjQUFjO0FBQUEsTUFDM0UsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2IsU0FBUztBQUFBLFFBQ1Qsa0JBQWtCO0FBQUEsUUFDbEIsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsYUFBYTtBQUFBLFFBQ2IsWUFBWSxDQUFDLGFBQWEsZ0JBQWdCLFdBQVc7QUFBQSxRQUNyRCxNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsVUFDTCxFQUFFLEtBQUssZ0JBQWdCLE1BQU0sYUFBYSxPQUFPLFdBQVcsU0FBUyxlQUFlO0FBQUEsVUFDcEYsRUFBRSxLQUFLLGdCQUFnQixNQUFNLGFBQWEsT0FBTyxXQUFXLFNBQVMsZUFBZTtBQUFBLFFBQ3RGO0FBQUEsUUFDQSxhQUFhO0FBQUEsVUFDWDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sYUFBYTtBQUFBLFVBQ2Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixhQUFhO0FBQUEsVUFDZjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCxrQkFBa0I7QUFBQSxRQUNsQixjQUFjLENBQUMsc0NBQXNDO0FBQUEsUUFDckQsZ0JBQWdCO0FBQUEsVUFDZDtBQUFBLFlBQ0UsWUFBWTtBQUFBLFlBQ1osU0FBUztBQUFBLFlBQ1QsU0FBUztBQUFBLGNBQ1AsV0FBVztBQUFBLGNBQ1gsWUFBWTtBQUFBLGdCQUNWLFlBQVk7QUFBQSxnQkFDWixlQUFlLEtBQUssS0FBSyxLQUFLO0FBQUE7QUFBQSxjQUNoQztBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixpQkFBaUIsS0FBSyxVQUFVLGNBQWMsQ0FBQztBQUFBLEVBQ2pEO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPLEVBQUUsTUFBTSxRQUFRO0FBQUEsRUFDekI7QUFDRixDQUFDO0FBRUQsU0FBUyxnQkFBZ0I7QUFDdkIsTUFBSTtBQUNGLFdBQU8sU0FBUyw4QkFBOEIsRUFBRSxVQUFVLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsRUFDdkYsUUFBUTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
