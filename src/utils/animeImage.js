/**
 * 图片加载策略：全部走本地，不请求任何第三方图库。
 *   1. 本地自定义：src/config/images.js 里配置的 public/images/ 文件
 *   2. 兜底图：配置缺失时回退到 public/images/ 下的默认文件
 *
 * 为什么不从网络图库拉图：
 *   早期的实现会依次尝试 nekos.best / waifu.pics / pic.re 等公开动漫图库。
 *   但那类站点里的图基本是第三方画师的原创作品，**授权状态无法核实**，
 *   与本项目的素材条款（见根目录 LICENSE-ASSETS.md）互相矛盾，故已全部移除。
 */
import { LOCAL_IMAGES } from '@/config/images'

// 兜底图（配置缺失时使用）
// 注意：路径必须对应 public/ 下真实存在的文件，否则会被 SPA 回退返回 index.html 导致破图
const FALLBACK_HERO = '/images/index.png'
const FALLBACK_CARD = '/images/card-mccolor.png'
const FALLBACK_MENU = '/images/card-mcmenu.png'
const FALLBACK_BG = '/images/bg/bg.png'

/**
 * 取一张图片 URL（纯本地，无网络请求）
 * @param {string} key 图片键：'bg' | 'hero' | 'card' | 'menu'（对应 images.js 里的配置键）
 * @param {string} [fallback] 配置缺失时的兜底 URL（默认用项目自带图）
 * @returns {Promise<string>} 图片 URL
 */
export async function fetchAnimeImage(key, fallback = '') {
  const local = LOCAL_IMAGES[key]

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
    return picked
  }

  return local || fallback || FALLBACK_BG
}

export { FALLBACK_HERO, FALLBACK_CARD, FALLBACK_MENU, FALLBACK_BG }
