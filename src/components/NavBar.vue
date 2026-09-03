<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore, PRESET_COLORS } from '@/stores/theme'
import { ElMessage } from 'element-plus'
import ReactiveColorPicker from '@/components/widgets/ReactiveColorPicker.vue'

const route = useRoute()
const theme = useThemeStore()

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/mccolor', label: '颜色代码生成' }
]

const showThemePanel = ref(false)

function pickColor(color) {
  if (color) {
    theme.setPrimaryColor(color)
    ElMessage.success({ message: '主题色已更新', duration: 1200 })
  }
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="logo">
        <span class="logo-block">X</span>
        <span class="logo-text">XyLuoDYS <em>工具站</em></span>
      </router-link>

      <nav class="nav-links">
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

      <div class="nav-actions">
        <!-- 主题色选择 -->
        <el-popover v-model:visible="showThemePanel" placement="bottom-end" :width="240" trigger="click">
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
}
.logo-block {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 19px;
  font-family: Consolas, monospace;
  box-shadow: 0 3px 10px var(--primary-light);
}
.logo-text em {
  font-style: normal;
  color: var(--primary);
}
.nav-links {
  display: flex;
  gap: 6px;
  flex: 1;
}
.nav-link {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 14.5px;
  color: var(--text-secondary);
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
  transform: translateY(-1px);
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
</style>
