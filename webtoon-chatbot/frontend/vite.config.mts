// vite.config.mts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const gitpodTarget = process.env.GITPOD_WORKSPACE_URL
  ? `https://8000-${process.env.GITPOD_WORKSPACE_URL.replace('https://', '')}`
  : 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
        allowedHosts: [
      '5174-mydefinary-big16-ujilnpryys6.ws-us120.gitpod.io'
    ],
    host: true, // optional: allows external access
    port: 5173,
    proxy: {
      '/api': {
        target: gitpodTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
