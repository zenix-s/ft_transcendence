import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:3000', // URL del backend (nombre del servicio Docker)
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Opcional: elimina el prefijo '/api'
      },
    },
  },
})
