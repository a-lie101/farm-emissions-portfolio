import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // Served from https://a-lie101.github.io/farm-emissions-portfolio/ on GitHub Pages.
  base: command === "build" ? "/farm-emissions-portfolio/" : "/",
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
}));
