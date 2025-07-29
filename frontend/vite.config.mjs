import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
      '@configured-variables': fileURLToPath(new URL('./src/styles/variables/_template.scss', import.meta.url)),
      '@axios': fileURLToPath(new URL('./src/plugins/axios', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
      '@style': fileURLToPath(new URL('./src/styles', import.meta.url)),
      'apexcharts': fileURLToPath(new URL('node_modules/apexcharts-clevision', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  server: {
    host: true, // 0.0.0.0 허용
    port: 8080,
    strictPort: true,
    cors: true,
    allowedHosts: ['all'], // or 정확한 호스트 명시
    // proxy: { // 만약 CORS 문제가 생기면 주석 헤제
    //   '/api': {
    //     target: import.meta.env.VITE_API_BASE_URL,
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // }, // 
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  optimizeDeps: {
    exclude: [],
  },
})
