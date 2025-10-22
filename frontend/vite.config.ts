import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import fs from 'fs';

const BACKEND_URL = "https://backend:3000";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(), // 🔹 Lee automáticamente "paths" de tsconfig.json
  ],
  server: {
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem'),
    },
    host: true, // permite --host 0.0.0.0 y accesos desde la red
    proxy: {
      '/api': {
        target: BACKEND_URL, // URL del backend (nombre del servicio Docker)
        changeOrigin: true,
        secure: false, // <-- IMPORTANTE para certificados locales
        rewrite: (path) => path.replace(/^\/api/, ''), // Opcional: elimina el prefijo '/api'
      },
      "/social": {
        target: BACKEND_URL,
        ws: true, // => proxy de WS
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ['chart.js'], // fuerza que vite procese este módulo
  },
});
