import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";

const flarePath = resolve(__dirname, "../../packages/flare/dist/flare.js");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "serve-flare",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/flare.js" && existsSync(flarePath)) {
            res.setHeader("Content-Type", "application/javascript");
            res.end(readFileSync(flarePath));
          } else {
            next();
          }
        });
      },
    },
  ],
});
