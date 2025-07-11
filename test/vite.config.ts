import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'test', // Set root to test directory since we run from project root
  plugins: [react()],
  server: {
    port: 3005,
    host: 'localhost'
  },
  resolve: {
    alias: {
      '@': '../src',
    },
  },
  build: {
    outDir: 'dist',
  },
}) 