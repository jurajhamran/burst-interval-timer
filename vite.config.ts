import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
        injectThemeColor: false,
      },

      manifest: {
        id: "/",
        name: "Burst: Tabata & Interval Timer",
        short_name: "Burst",
        description:
          "Free offline Tabata and interval timer. Build custom work and rest workouts, drag to reorder, no sign-up. Your data stays on your device.",
        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#0a0c10",
        background_color: "#0a0c10",
        categories: ["health", "fitness", "sports"],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["og-image.png"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
    },
  },
});
