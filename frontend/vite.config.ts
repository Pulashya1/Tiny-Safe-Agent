import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development, send /api calls to the Python server (python server.py).
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
