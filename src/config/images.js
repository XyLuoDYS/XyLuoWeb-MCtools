/**
 * 自定义图片配置
 *
 * 把图片放进 public/images/ 目录，然后把路径填到下面即可生效。
 * 留空 '' 则回退到 public/images/ 下的默认兜底图（见 src/utils/animeImage.js）。
 * 本项目不请求任何第三方图库，图片全部来自本地，避免素材授权不清。
 *
 * 可用键：
 *   bg   —— 全站背景图（暗色模式会自动压暗偏灰）
 *            填数组则为多图随机池，每次打开页面随机选一张
 *   hero —— 首页 Hero 大图
 *   card —— 工具卡片封面图（「颜色代码生成」用）
 *   menu —— 工具卡片封面图（「贴图菜单生成」用）
 */
export const LOCAL_IMAGES = {
  // 背景图随机池：每次访问随机选一张（图片在 public/images/bg/ 下）
  bg: [
    '/images/bg/bg.png'
  ],
  hero: '/images/index.png',
  card: '/images/card-mccolor.png',
  menu: '/images/card-mcmenu.png'
}
