import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
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
