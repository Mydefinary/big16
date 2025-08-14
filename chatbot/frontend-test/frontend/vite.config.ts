import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
    server: {
    host: true, // optional: allows external access
    port: 3000,
    allowedHosts: ['all', "3000-mydefinary-big16-ujilnpryys6.ws-us121.gitpod.io"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
        // ★ /api 접두사를 제거해서 FastAPI의 /ask 로 전달되게 만듭니다.
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
