import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The workspace builds this page too; this config supports isolated development.
export default defineConfig({
  plugins: [react()],
  appType: 'mpa',
  server: { port: Number(process.env.PORT || 5173), strictPort: true },
  preview: { port: Number(process.env.PORT || 4173), strictPort: true },
})
