/**
 * 图片加载策略（优先级从高到低）：
 *   1. 本地自定义：src/config/images.js 里配置的 public/images/ 文件
 *   2. 网络动漫图库：nekos.best → waifu.pics → pic.re（sessionStorage 缓存）
 *   3. 兜底图：项目自带的 public/images/ 生成图
 */
import { LOCAL_IMAGES } from '@/config/images'

// 兜底图（网络和自定义都不可用时使用）
const FALLBACK_HERO = '/images/hero.jpg'
const FALLBACK_CARD = '/images/card.jpg'
const FALLBACK_BG = '/images/bg/bg (1).jpg'

// 图库源：返回 JSON，内含图片直链
const SOURCES = [
  // nekos.best：{ results: [{ url }] }
  async () => {
    const r = await fetch('https://nekos.best/api/v2/neko')
    const d = await r.json()
    return d?.results?.[0]?.url || null
  },
  // waifu.pics：{ url }
  async () => {
    const r = await fetch('https://api.waifu.pics/sfw/waifu')
    const d = await r.json()
    return d?.url || null
  },
  // pic.re：{ url }
  async () => {
    const r = await fetch('https://pic.re/image')
    const d = await r.json()
    return d?.url || null
  }
]

const cache = new Map()

/**
 * 取一张图片：本地自定义 > 网络图库 > 兜底
 * @param {string} key 图片键：'bg' | 'hero' | 'card'（同时也是 images.js 里的配置键）
 * @param {string} [fallback] 网络不可用时的兜底 URL（默认用项目自带图）
 * @returns {Promise<string>} 图片 URL
 */
export async function fetchAnimeImage(key, fallback = '') {
  // 1. 本地自定义（同步返回，无网络请求）
  const local = LOCAL_IMAGES[key]
  if (local) {
    // 数组 = 随机池：每次刷新随机选一张（尽量不与上次重复）
    if (Array.isArray(local) && local.length) {
      const ssKey = 'anime_img_pool_' + key
      let last = null
      try { last = sessionStorage.getItem(ssKey) } catch { /* 忽略 */ }
      let picked = local[Math.floor(Math.random() * local.length)]
      if (local.length > 1 && picked === last) {
        // 与上次相同则换一张（在剩余里随机）
        const rest = local.filter(p => p !== last)
        picked = rest[Math.floor(Math.random() * rest.length)]
      }
      try { sessionStorage.setItem(ssKey, picked) } catch { /* 忽略 */ }
      cache.set(key, picked)
      return picked
    }
    cache.set(key, local)
    return local
  }

  if (cache.has(key)) return cache.get(key)
  const ssKey = 'anime_img_' + key
  try {
    const cached = sessionStorage.getItem(ssKey)
    if (cached) {
      cache.set(key, cached)
      return cached
    }
  } catch { /* sessionStorage 不可用则跳过 */ }

  // 2. 网络图库
  for (const source of SOURCES) {
    try {
      const url = await source()
      if (url && /^https?:\/\//.test(url)) {
        cache.set(key, url)
        try { sessionStorage.setItem(ssKey, url) } catch { /* 忽略 */ }
        return url
      }
    } catch { /* 尝试下一个源 */ }
  }

  // 3. 兜底
  const fb = fallback || FALLBACK_BG
  cache.set(key, fb)
  return fb
}

export { FALLBACK_HERO, FALLBACK_CARD, FALLBACK_BG }
