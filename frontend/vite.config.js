import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ─── BUILD OPTIMIZATIONS ──────────────────────────────────────────────────────
  build: {
    // Split vendor libs into a separate chunk — browsers cache it between deploys
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — rarely changes, long-lived cache
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Socket.io client — separate chunk since it's large
          'vendor-socket': ['socket.io-client'],
          // Axios — small, used across many files
          'vendor-axios': ['axios'],
        },
      },
    },
    // Warn when a chunk exceeds 600kb (helps track bundle bloat)
    chunkSizeWarningLimit: 600,
  },

  // ─── DEV SERVER ───────────────────────────────────────────────────────────────
  server: {
    proxy: {
      // REST API — proxy to backend during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Socket.IO — must use ws:// proxy with WebSocket upgrade
      // Without this, socket connects directly to :3000 (works but bypasses Vite)
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,       // REQUIRED: enables WebSocket proxying
        secure: false,
      },
    },
  },
})
