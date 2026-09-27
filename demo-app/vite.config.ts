import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Vite root is `frontend/` so that the React app keeps its own tree
// alongside `backend/`, `tests/` and `uploads/`.
export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
