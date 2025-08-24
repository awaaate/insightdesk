import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const serverUrl = process.env.VITE_SERVER_URL;
  return {
    plugins: [tailwindcss(), tanstackRouter({}), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        config: path.resolve(__dirname, "../server/src/config/index.ts"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: serverUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "../server/public",
      emptyOutDir: true,
    },
    // Ensure proper base path for production
    base: "/",
  };
});
