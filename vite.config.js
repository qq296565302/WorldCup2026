import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
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
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36')
            proxyReq.setHeader('Referer', 'https://www.dongqiudi.com/')
            proxyReq.setHeader('Origin', 'https://www.dongqiudi.com')
            // 不固定 Accept，让前端请求决定
            if (!proxyReq.getHeader('Accept')) {
              proxyReq.setHeader('Accept', 'application/json')
            }
          })
        }
      },
      '/api/migu': {
        target: 'https://app-sc.miguvideo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/migu/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36')
            proxyReq.setHeader('Referer', 'https://www.miguvideo.com/')
            proxyReq.setHeader('Origin', 'https://www.miguvideo.com')
            proxyReq.setHeader('Accept', 'application/json')
          })
        }
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router')) {
            return 'vendor-vue'
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-http'
          }
        }
      }
    }
  }
})
