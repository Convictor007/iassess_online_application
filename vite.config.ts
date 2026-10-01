import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local `vite` only serves the React app. API routes live in `/api` and run on Vercel.
// Proxy `/api/*` so localhost:5173 can call the real backend.
// Override for a local Vercel CLI server: VITE_API_PROXY_TARGET=http://localhost:3000
const apiTarget =
  process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_URL || 'https://iassess.vercel.app'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
