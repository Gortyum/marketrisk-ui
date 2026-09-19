import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://localhost:8000',
      '/etl': 'http://localhost:8000',
      '/portfolios': 'http://localhost:8000',
      '/risk': 'http://localhost:8000'
    }
  }
})