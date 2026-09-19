import { createRouter, createWebHistory } from 'vue-router'

// 用 History 模式（不带 #）：URL 形如 /mccolor
// ⚠️ 静态部署时必须把所有路径（404）回退到 index.html，否则刷新子页面会 404：
//   · Nginx      try_files $uri $uri/ /index.html;
//   · Netlify    见 public/_redirects
//   · Vercel     见 public/vercel.json
//   · GitHub Pages / 纯静态托管不支持这种回退 → 请改回 createWebHashHistory
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页' }
    },
    {
      path: '/mccolor',
      name: 'mccolor',
      component: () => import('@/views/McColorToolView.vue'),
      meta: { title: '颜色代码生成' }
    },
    {
      path: '/mcmenu',
      name: 'mcmenu',
      component: () => import('@/views/McMenuToolView.vue'),
      meta: { title: '贴图菜单生成' }
    },
    {
      // ⚠️ 路径不能叫 /license —— 项目根目录有同名文件 LICENSE，
      // dev server 的静态文件中间件会直接把它当文件返回（页面变纯文本）。
      // 同理别用 /readme、/contributing 之类与根目录文件重名的路径。
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/LicenseView.vue'),
      meta: { title: '素材授权条款' }
    },
    {
      // 根目录没有无扩展名的 guide 文件，所以 /guide 可以安全使用
      // （不像 /license 会被同名文件 LICENSE 抢走）
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideView.vue'),
      meta: { title: '使用教程' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // 浏览器前进/后退：回到原来的位置
    if (savedPosition) return savedPosition
    if (to.hash) {
      // 锚点定位：目标组件是懒加载的，元素可能还没挂载 —— vue-router 会自己重试直到能定位；
      // top 留出 sticky 导航栏的高度，别让标题被压在栏下面
      return { el: to.hash, top: 78, behavior: 'smooth' }
    }
    return { top: 0 }
  }
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} - XyLuoDYS 工具站` : 'XyLuoDYS 工具站'
})

export default router
