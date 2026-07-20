import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // Served from https://a-lie101.github.io/fcc-prototype/ on GitHub Pages.
  base: command === "build" ? "/fcc-prototype/" : "/",
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
}));
