import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import fs from 'fs';

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
    proxy: {
      '/api': {
        target: 'https://backend:3000', // URL del backend (nombre del servicio Docker)
        changeOrigin: true,
        secure: false, // <-- IMPORTANTE para certificados locales
        rewrite: (path) => path.replace(/^\/api/, ''), // Opcional: elimina el prefijo '/api'
      },
    },
  },
  optimizeDeps: {
    include: ['chart.js'], // fuerza que vite procese este módulo
  },
});
