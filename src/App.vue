<script setup>
import { onMounted, onUnmounted, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { fetchAnimeImage } from '@/utils/animeImage'

const REPO = 'https://github.com/XyLuoDYS/XyLuoWeb-MCtools'
const YEAR = new Date().getFullYear()

const route = useRoute()

/* ---------------- 页脚：滑到页面底部才从底部升上来 ----------------
   页脚本来就在文档流末尾，这里再收一道 —— 没滑到底就不显示，
   免得页面内容偏短时它的上边缘露在首屏最下面（首页正是如此）。
   动画是「整体从页面底部滑上来」，见 <style> 里 .footer-panel 的 translateY(100%)；
   隐藏时由外层 .site-footer 的 overflow 裁掉 —— 所以**文档高度全程不变**，
   页脚出现 / 消失都不会顶动上方内容（早先用 12px 位移 + 淡入会顶，已修）。
   ⚠️ 显示 / 隐藏用两个不同阈值（8px / 24px）：滚动值是小数，
   留点余量，免得在「刚到底」的边界上反复开关。 */
const SHOW_TOL = 8
const HIDE_TOL = 24

const footerShown = ref(false)
let queued = false
let ro = null
let routeTimer = 0

function measure() {
  queued = false
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  // 内容比屏幕还短 → 压根没有可滚动空间，直接显示，不然页脚永远看不到
  if (max <= SHOW_TOL) {
    footerShown.value = true
    return
  }
  const toBottom = max - window.scrollY
  footerShown.value = footerShown.value ? toBottom <= HIDE_TOL : toBottom <= SHOW_TOL
}

// 滚动事件很密，合并到一帧里算一次
function queueMeasure() {
  if (queued) return
  queued = true
  requestAnimationFrame(measure)
}

// 内容高度会变：路由切换、折叠块开合、图片加载都会让 max 变
function remeasureSoon() {
  nextTick(queueMeasure)
  clearTimeout(routeTimer)
  // 页面切换带过渡，nextTick 时量到的可能还是旧内容的高度，补一次延时兜底
  routeTimer = setTimeout(queueMeasure, 380)
}

onMounted(async () => {
  window.addEventListener('scroll', queueMeasure, { passive: true })
  window.addEventListener('resize', queueMeasure)
  if (window.ResizeObserver) {
    ro = new ResizeObserver(queueMeasure)
    ro.observe(document.body)
  }
  queueMeasure()

  // 设全站背景图（本地配置，暗色模式会变灰，见 global.css）
  const bg = await fetchAnimeImage('bg')
  if (bg) {
    document.documentElement.style.setProperty('--bg-image', `url("${bg}")`)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', queueMeasure)
  window.removeEventListener('resize', queueMeasure)
  if (ro) ro.disconnect()
  clearTimeout(routeTimer)
})

watch(() => route.fullPath, remeasureSoon)
</script>

<template>
  <NavBar />
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <!-- 页脚：外层 .site-footer 只负责占位 + 把滑出去的内容裁掉，
       真正的外观（边框 / 底色 / 内容）全在 .footer-panel 上，
       这样隐藏时外层自己不画任何东西，不会露出边框或底色。 -->
  <footer class="site-footer" :class="{ 'is-shown': footerShown }">
    <div class="footer-panel">
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
    </div>
  </footer>
</template>

<style scoped>
/* 外层：只负责「占位 + 裁切」，自己不画任何东西。
   ⚠️ overflow: hidden 是修「页脚一出现上方内容就跳」的关键 ——
   它把滑出去的 .footer-panel 裁在这里，那个位移就不会被算进文档的可滚动高度；
   否则可滚动高度会随动画变化，浏览器会顺手把滚动位置往回夹，整页内容跟着跳一下。
   ⚠️ 隐藏时也**不能**用 height / display 收起来：那样内容会重排，跳动更明显。 */
.site-footer {
  overflow: hidden;
}
/* 内层：真正的外观（边框 / 底色 / 内容）都在这里，整体从页面底部上下滑动。
   translateY(100%) 正好等于自身高度 → 完全滑出，被外层裁掉，一点都看不见。
   ⚠️ 出现 / 消失必须用**两条不同的缓动**：
     · 消失（这条 = 隐藏态）用先慢后快 ease-in-out。页脚在页面最底部，
       往下一滑很快就滑出屏幕；若用「先快后慢」，七成路程会在 100ms 内跑完、
       而且全发生在屏幕外，肉眼等于「啪一下没了」。
     · 出现（`.is-shown` 那条）用先快后慢 —— 从底部升上来干脆利落，收尾柔和。
   CSS 过渡取的是**目标状态**那条声明，所以两边的缓动想不同就写不同，天然生效。 */
.footer-panel {
  border-top: 1px solid var(--card-border);
  background: var(--navbar-bg);
  backdrop-filter: blur(12px);
  transform: translateY(100%);
  visibility: hidden;
  transition:
    transform 0.5s cubic-bezier(0.42, 0, 0.58, 1),
    visibility 0s linear 0.5s,
    background-color 0.3s ease,
    border-color 0.3s ease;
}
.site-footer.is-shown > .footer-panel {
  transform: translateY(0);
  visibility: visible;
  transition:
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s,
    background-color 0.3s ease,
    border-color 0.3s ease;
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
