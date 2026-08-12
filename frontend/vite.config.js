import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ─── DEV SERVER ───────────────────────────────────────────────────────────────
  server: {
    // Proxy /api/* requests to backend during development.
    // This avoids CORS issues and means frontend code can use /api/... directly.
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // backend
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
