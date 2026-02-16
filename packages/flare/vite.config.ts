import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "Flare",
      formats: ["iife"],
      fileName: () => "flare.js",
    },
    rollupOptions: {
      // Bundle everything — no externals
    },
    cssCodeSplit: false,
  },
});
