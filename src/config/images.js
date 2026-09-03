/**
 * 自定义图片配置
 *
 * 把图片放进 public/images/ 目录，然后把路径填到下面即可生效。
 * 留空 '' 则自动从网络动漫图库拉取（失败时回退到内置生成图）。
 *
 * 可用键：
 *   bg   —— 全站背景图（暗色模式会自动压暗偏灰）
 *            填数组则为多图随机池，每次打开页面随机选一张
 *   hero —— 首页 Hero 大图
 *   card —— 工具卡片封面图
 */
export const LOCAL_IMAGES = {
  // 背景图随机池：每次访问随机选一张（图片在 public/images/bg/ 下）
  bg: [
    '/images/bg/bg (1).jpg',
    '/images/bg/bg (2).jpg',
    '/images/bg/bg (3).jpg',
    '/images/bg/bg (4).jpg',
    '/images/bg/bg (1).png',
    '/images/bg/bg (2).png',
    '/images/bg/bg (3).png',
    '/images/bg/bg (4).png',
    '/images/bg/bg (5).png',
    '/images/bg/bg (6).png',
    '/images/bg/bg (7).png'
  ],
  hero: '/images/index.jpg',
  card: '/images/card.png'
}
