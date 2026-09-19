<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore, PRESET_COLORS } from '@/stores/theme'
import { ElMessage } from 'element-plus'
import ReactiveColorPicker from '@/components/widgets/ReactiveColorPicker.vue'

const route = useRoute()
const theme = useThemeStore()

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/mccolor', label: '颜色代码生成' },
  { path: '/mcmenu', label: '贴图菜单生成' },
  { path: '/guide', label: '使用教程' },
  { path: '/terms', label: '素材条款' }
]

const showThemePanel = ref(false)

function pickColor(color) {
  if (color) {
    theme.setPrimaryColor(color)
    ElMessage.success({ message: '主题色已更新', duration: 1200 })
  }
}

/* ---------------- 导航横向滚动 ---------------- */
// 窄屏按钮放不下时，导航条可左右滑动，并在可滑动方向显示渐隐提示
const navRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollHint() {
  const el = navRef.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = max > 2 && el.scrollLeft < max - 2
}
// 当前页签滚进可视区，避免切换后看不到高亮项
function scrollActiveIntoView() {
  nextTick(() => {
    const active = navRef.value?.querySelector('.nav-link.active')
    // block: 'nearest' —— 只做横向滚动，不影响页面垂直位置
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  })
}

let observer = null
onMounted(() => {
  const el = navRef.value
  if (!el) return
  updateScrollHint()
  el.addEventListener('scroll', updateScrollHint, { passive: true })
  window.addEventListener('resize', updateScrollHint)
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(updateScrollHint)
    observer.observe(el)
  }
  scrollActiveIntoView()
})
onUnmounted(() => {
  const el = navRef.value
  if (el) el.removeEventListener('scroll', updateScrollHint)
  window.removeEventListener('resize', updateScrollHint)
  observer?.disconnect()
})
watch(() => route.path, () => {
  updateScrollHint()
  scrollActiveIntoView()
})
</script>

<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="logo">
        <span class="logo-block" aria-hidden="true" />
        <span class="logo-text">XyLuoDYS <em>工具站</em></span>
      </router-link>

      <div class="nav-scroll" :class="{ 'hint-left': canScrollLeft, 'hint-right': canScrollRight }">
        <nav ref="navRef" class="nav-links">
          <router-link
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="nav-link"
            :class="{ active: route.path === link.path }"
          >
            {{ link.label }}
          </router-link>
        </nav>
      </div>

      <div class="nav-actions">
        <!-- 主题色选择 -->
        <el-popover v-model:visible="showThemePanel" placement="bottom-end" :width="240" trigger="click" popper-class="nav-theme-popper">
          <template #reference>
            <button class="icon-btn" title="自定义主题色">
              <span class="theme-dot" :style="{ background: theme.primaryColor }" />
            </button>
          </template>
          <div class="theme-panel">
            <div class="panel-title">预设主题色</div>
            <div class="preset-grid">
              <button
                v-for="c in PRESET_COLORS"
                :key="c.value"
                class="preset-swatch"
                :class="{ active: theme.primaryColor === c.value }"
                :style="{ background: c.value }"
                :title="c.name"
                @click="pickColor(c.value)"
              />
            </div>
            <div class="panel-title" style="margin-top: 12px">自定义颜色</div>
            <ReactiveColorPicker
              :teleported="false"
              :model-value="theme.primaryColor"
              @update:model-value="v => { if (v) theme.setPrimaryColor(v) }"
            />

            <div class="panel-title" style="margin-top: 14px">
              背景强度
              <span class="panel-value">{{ theme.bgStrength }}</span>
            </div>
            <el-slider
              :model-value="theme.bgStrength"
              :min="0"
              :max="100"
              :step="1"
              size="small"
              :disabled="theme.isDark"
              @input="v => theme.setBgStrength(v)"
            />
            <div class="panel-hint">
              {{ theme.isDark ? '暗色模式固定为原图' : '往右拖 = 背景更清晰，往左拖 = 更护眼' }}
            </div>
          </div>
        </el-popover>

        <!-- 亮暗切换 -->
        <button class="icon-btn" :title="theme.isDark ? '切换到亮色模式' : '切换到暗色模式'" @click="theme.toggleDark()">
          <el-icon v-if="theme.isDark"><Sunny /></el-icon>
          <el-icon v-else><Moon /></el-icon>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--navbar-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--card-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 28px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 17px;
  flex-shrink: 0;
}
.logo-block {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  /* 图案是白色的，所以底色继续跟主题色走（和站点图标同一份图形） */
  background-color: var(--primary);
  background-image: url('/mark.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: auto 58%;
  box-shadow: 0 3px 10px var(--primary-light);
}
.logo-text em {
  font-style: normal;
  color: var(--primary);
}

/* 滚动容器：左右渐隐提示还有哪一边可以滑 */
.nav-scroll {
  position: relative;
  flex: 1;
  min-width: 0;
}
.nav-scroll::before,
.nav-scroll::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 26px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1;
}
.nav-scroll::before {
  left: -1px;
  background: linear-gradient(90deg, var(--navbar-bg), transparent);
}
.nav-scroll::after {
  right: -1px;
  background: linear-gradient(270deg, var(--navbar-bg), transparent);
}
.nav-scroll.hint-left::before {
  opacity: 1;
}
.nav-scroll.hint-right::after {
  opacity: 1;
}
.nav-links {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.nav-links::-webkit-scrollbar {
  display: none;
}
.nav-link {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 14.5px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.nav-link:hover {
  color: var(--text);
  background: var(--chip-bg);
}
.nav-link.active {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  font-weight: 600;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 17px;
  transition: all 0.2s ease;
}
.icon-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.theme-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(128, 128, 128, 0.35);
  transition: background 0.3s ease;
}
.theme-panel .panel-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-value {
  font-variant-numeric: tabular-nums;
  color: var(--primary);
  font-weight: 600;
}
.panel-hint {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: -4px;
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.preset-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.preset-swatch:hover {
  transform: scale(1.12);
}
.preset-swatch.active {
  border-color: var(--text);
}

/* ---------------- 窄屏 ---------------- */
@media (max-width: 820px) {
  .navbar-inner {
    gap: 12px;
    padding: 0 14px;
    height: 56px;
  }
  .logo {
    gap: 8px;
    font-size: 16px;
  }
  .nav-link {
    padding: 7px 12px;
    font-size: 14px;
  }
  .icon-btn {
    width: 34px;
    height: 34px;
    font-size: 16px;
  }
  .theme-dot {
    width: 16px;
    height: 16px;
  }
}
/* 极窄屏：只留 logo 方块，把横向空间让给可滑动的导航 */
@media (max-width: 480px) {
  .navbar-inner {
    gap: 8px;
    padding: 0 10px;
  }
  .logo-text {
    display: none;
  }
  .nav-actions {
    gap: 6px;
  }
}
/* 触屏：hover 会粘滞，去掉上浮与边框变色 */
@media (hover: none) {
  .icon-btn:hover {
    border-color: var(--card-border);
    color: var(--text);
  }
  .nav-link:hover {
    color: var(--text-secondary);
    background: transparent;
  }
  .nav-link.active:hover {
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 12%, transparent);
  }
}
</style>

<!-- 主题面板浮层（teleport 到 body）：窄屏下收窄，避免超出视口 -->
<style>
.nav-theme-popper.el-popover.el-popper {
  max-width: calc(100vw - 20px);
}
@media (max-width: 480px) {
  .nav-theme-popper.el-popover.el-popper {
    width: min(240px, calc(100vw - 20px)) !important;
  }
}
</style>
