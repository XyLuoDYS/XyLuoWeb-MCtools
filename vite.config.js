import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// MC 新闻源（mcbe.news）不返回 CORS 头，浏览器无法直连，
// 这里用 dev / preview 的同源转发把 /api/mc-news 代理到源站。
// 前端仍保留公共 CORS 代理作为静态部署时的兜底。
const mcNewsProxy = {
  '/api/mc-news': {
    target: 'https://mcbe.news',
    changeOrigin: true,
    rewrite: () => '/news/official/rss.xml',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36'
    }
  },
  // 英→中翻译（MyMemory 免费接口；Google / Lingva 在国内均不可用）
  // 前端会先走这里，失败再直连源站兜底
  '/api/translate': {
    target: 'https://api.mymemory.translated.net',
    changeOrigin: true,
    rewrite: p => '/get' + p.slice('/api/translate'.length)
  }
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: { proxy: mcNewsProxy },
  preview: { proxy: mcNewsProxy }
})
