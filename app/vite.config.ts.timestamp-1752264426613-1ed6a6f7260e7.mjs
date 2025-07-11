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
        name: "VonSim8",
        short_name: "VonSim8",
        description: "Simulador vonsim de 8 bits",
        theme_color: "#1c1917",
        display: "standalone",
        background_color: "#1c1917",
        icons: [
          { src: "icon-192.png", type: "image/png", sizes: "192x192" },
          { src: "icon-512.png", type: "image/png", sizes: "512x512" }
        ]
      },
      workbox: {
        navigateFallback: null
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx0ZW1wXFxcXDIwMjVcXFxcVm9uU2ltOFxcXFxhcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHRlbXBcXFxcMjAyNVxcXFxWb25TaW04XFxcXGFwcFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdGVtcC8yMDI1L1ZvblNpbTgvYXBwL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwibm9kZTpjaGlsZF9wcm9jZXNzXCI7XG5cbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGFwcFR5cGU6IFwibXBhXCIsXG4gIGJhc2U6IFwiL1ZvblNpbTgvXCIsXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiBcInByb21wdFwiLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1wiZm9udHMvKiovKlwiLCBcImZhdmljb24uc3ZnXCIsIFwiaWNvbi0xOTIucG5nXCIsIFwiaWNvbi01MTIucG5nXCJdLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogXCJWb25TaW04XCIsXG4gICAgICAgIHNob3J0X25hbWU6IFwiVm9uU2ltOFwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTaW11bGFkb3Igdm9uc2ltIGRlIDggYml0c1wiLFxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjMWMxOTE3XCIsXG4gICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiMxYzE5MTdcIixcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7IHNyYzogXCJpY29uLTE5Mi5wbmdcIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiIH0sXG4gICAgICAgICAgeyBzcmM6IFwiaWNvbi01MTIucG5nXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjUxMng1MTJcIiB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogbnVsbCxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIGRlZmluZToge1xuICAgIF9fQ09NTUlUX0hBU0hfXzogSlNPTi5zdHJpbmdpZnkoZ2V0Q29tbWl0SGFzaCgpKSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7IFwiQC9cIjogXCIvc3JjL1wiIH0sXG4gIH0sXG59KTtcblxuZnVuY3Rpb24gZ2V0Q29tbWl0SGFzaCgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZXhlY1N5bmMoXCJnaXQgcmV2LXBhcnNlIC0tc2hvcnQgSEVBRFwiLCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSkudG9TdHJpbmcoKS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcInVua25vd25cIjtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvUSxTQUFTLGdCQUFnQjtBQUU3UixPQUFPLFdBQVc7QUFDbEIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxlQUFlO0FBR3hCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxFQUNULE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxjQUFjLGVBQWUsZ0JBQWdCLGNBQWM7QUFBQSxNQUMzRSxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixTQUFTO0FBQUEsUUFDVCxrQkFBa0I7QUFBQSxRQUNsQixPQUFPO0FBQUEsVUFDTCxFQUFFLEtBQUssZ0JBQWdCLE1BQU0sYUFBYSxPQUFPLFVBQVU7QUFBQSxVQUMzRCxFQUFFLEtBQUssZ0JBQWdCLE1BQU0sYUFBYSxPQUFPLFVBQVU7QUFBQSxRQUM3RDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLGtCQUFrQjtBQUFBLE1BQ3BCO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04saUJBQWlCLEtBQUssVUFBVSxjQUFjLENBQUM7QUFBQSxFQUNqRDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTyxFQUFFLE1BQU0sUUFBUTtBQUFBLEVBQ3pCO0FBQ0YsQ0FBQztBQUVELFNBQVMsZ0JBQWdCO0FBQ3ZCLE1BQUk7QUFDRixXQUFPLFNBQVMsOEJBQThCLEVBQUUsVUFBVSxRQUFRLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSztBQUFBLEVBQ3ZGLFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGOyIsCiAgIm5hbWVzIjogW10KfQo=
