<script setup>
import { onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { fetchAnimeImage } from '@/utils/animeImage'

const REPO = 'https://github.com/XyLuoDYS/XyLuoWeb-MCtools'
const YEAR = new Date().getFullYear()

onMounted(async () => {
  // 设全站背景图（本地配置，暗色模式会变灰，见 global.css）
  const bg = await fetchAnimeImage('bg')
  if (bg) {
    document.documentElement.style.setProperty('--bg-image', `url("${bg}")`)
  }
})
</script>

<template>
  <NavBar />
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-main">
        <div class="footer-brand">
          <span class="footer-block" aria-hidden="true" />
          <span>XyLuoDYS 工具站</span>
        </div>
        <p class="footer-lic">
          代码采用 <strong>MIT</strong> 协议，可自由商用；
          <code>mine/</code> 贴图与 <code>public/images/</code> 插画可免费用、免费改、
          打包进资源包，<strong>但不可商用</strong>
          <router-link to="/terms" class="footer-link">查看完整素材条款 →</router-link>
        </p>
        <p class="footer-ai">
          <el-icon><Cpu /></el-icon>
          <span>本站网页代码<strong>由 AI 生成</strong>，作者负责整理与维护</span>
        </p>
      </div>

      <div class="footer-aside">
        <a class="footer-link" :href="REPO" target="_blank" rel="noopener">
          <el-icon><Link /></el-icon>
          GitHub 仓库
        </a>
        <span class="footer-copy">© {{ YEAR }} XyLuoDYS</span>
      </div>
    </div>

    <p class="footer-notice">
      NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
    </p>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--card-border);
  background: var(--navbar-bg);
  backdrop-filter: blur(12px);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.footer-main {
  min-width: 0;
  flex: 1;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 7px;
}
.footer-block {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex-shrink: 0;
  /* 和顶栏 logo / 站点图标共用同一份图形；图案是白色的，底色继续跟主题色走 */
  background-color: var(--primary);
  background-image: url('/mark.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: auto 58%;
}
.footer-lic {
  font-size: 12.5px;
  line-height: 1.85;
  color: var(--text-secondary);
  max-width: 720px;
}
.footer-lic strong {
  color: var(--text);
}
.footer-lic code {
  background: var(--chip-bg);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: Consolas, monospace;
  font-size: 0.9em;
}
/* 「代码由 AI 生成」标注：做成一个小徽章，和授权摘要视觉上分开 */
.footer-ai {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 9px;
  padding: 4px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary) 24%, transparent);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.footer-ai .el-icon {
  color: var(--primary);
  font-size: 13px;
  flex-shrink: 0;
}
.footer-ai strong {
  color: var(--primary);
}
.footer-link {
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}
.footer-link:hover {
  opacity: 0.75;
}
.footer-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.footer-copy {
  font-size: 12px;
  color: var(--text-muted);
}
.footer-notice {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 18px;
  font-size: 11px;
  letter-spacing: 0.02em;
  line-height: 1.7;
  color: var(--text-muted);
  font-family: Consolas, monospace;
  opacity: 0.85;
}

@media (max-width: 640px) {
  .footer-inner {
    flex-direction: column;
    gap: 14px;
    padding: 18px 14px 10px;
  }
  .footer-aside {
    align-items: flex-start;
  }
  .footer-notice {
    padding: 0 14px 16px;
  }
}
</style>
