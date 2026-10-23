import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Navigation uses URL hashes; unknown paths should remain real 404s.
  appType: 'mpa',
  server: { port: Number(process.env.PORT || 5173), strictPort: true },
  preview: { port: Number(process.env.PORT || 4173), strictPort: true },
})
