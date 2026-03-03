// planneragent/ui/vite.config.ts
// ===========================================
// Vite Dev Proxy → Worker (Wrangler dev)
// ===========================================

import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      "/sandbox": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
      "/system": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
      "/onboarding": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});