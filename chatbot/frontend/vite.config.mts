// vite.config.mts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // optional: allows external access
    port: 3000,
    allowedHosts: ['all'],
    // proxy: {
    //   '/api': {
    //     target: import.meta.env.VITE_API_BASE_URL,
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
})
