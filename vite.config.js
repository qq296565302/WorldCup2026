import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api/wheniskickoff': {
        target: 'https://wheniskickoff.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wheniskickoff/, '/data/v1'),
        secure: true
      },
      '/api/thesportsdb': {
        target: 'https://www.thesportsdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/thesportsdb/, '/api/v1/json/3'),
        secure: true
      },
      '/api/dongqiudi': {
        target: 'https://www.dongqiudi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dongqiudi/, ''),
        secure: true,
        headers: {
          Referer: 'https://www.dongqiudi.com/'
        }
      }
    }
  }
})
