import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bms-simple/', 
  build: { outDir: 'dist' },
  server: { port: 3000 }
})
