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
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} - XyLuoDYS 工具站` : 'XyLuoDYS 工具站'
})

export default router
