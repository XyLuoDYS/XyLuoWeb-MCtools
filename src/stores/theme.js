import { defineStore } from 'pinia'

// MC 风格预设主题色
export const PRESET_COLORS = [
  { name: '绿宝石', value: '#17c964' },
  { name: '钻石', value: '#4fc3f7' },
  { name: '下界', value: '#a855f7' },
  { name: '金锭', value: '#f5b942' },
  { name: '红石', value: '#ef4444' },
  { name: '青金', value: '#6366f1' },
  { name: '粉红羊', value: '#f472b6' },
  { name: '铜锭', value: '#e8853d' }
]

// 校验合法 6 位十六进制色值
const isHex = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
const DEFAULT_COLOR = '#ef4444'

/* ---------- 色彩换算 ---------- */
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d ? (d / (1 - Math.abs(2 * l - 1))) : 0
  return { h, s: s * 100, l: l * 100 }
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.min(100, Math.max(0, s)) / 100
  l = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const to = n => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    primaryColor: isHex(localStorage.getItem('theme_primary'))
      ? localStorage.getItem('theme_primary')
      : DEFAULT_COLOR,
    // 默认深色：未设置过（null）时为深色；显式 '0'/浅色 或 '1'/深色 才沿用用户选择
    isDark: localStorage.getItem('theme_dark') === null || localStorage.getItem('theme_dark') === '1'
  }),

  actions: {
    /**
     * 将主题色与亮暗模式应用到 document
     * - 主题色写入 --primary 及其衍生色变量
     * - 背景整套调色板从主题色派生（亮色微带主题色调，暗色为带主题色相的深色）
     * - 同步覆盖 Element Plus 的 --el-color-primary 系列
     * - 亮暗模式通过 html.dark class 切换
     */
    applyTheme() {
      const root = document.documentElement
      const hex = this.primaryColor

      // 主色衍生：混合白色/黑色得到 light-3/5/7/8/9 与 dark-2
      const mix = (a, b, t) => {
        const pa = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
        const pb = a === 'w' ? [255, 255, 255] : [0, 0, 0]
        return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
      }

      root.style.setProperty('--primary', hex)
      root.style.setProperty('--primary-light', mix('w', 0.3))
      root.style.setProperty('--primary-lighter', mix('w', 0.6))
      root.style.setProperty('--primary-dark', mix('b', 0.25))

      // Element Plus 主色映射
      root.style.setProperty('--el-color-primary', hex)
      root.style.setProperty('--el-color-primary-light-3', mix('w', 0.3))
      root.style.setProperty('--el-color-primary-light-5', mix('w', 0.5))
      root.style.setProperty('--el-color-primary-light-7', mix('w', 0.7))
      root.style.setProperty('--el-color-primary-light-8', mix('w', 0.8))
      root.style.setProperty('--el-color-primary-light-9', mix('w', 0.9))
      root.style.setProperty('--el-color-primary-dark-2', mix('b', 0.2))

      // 背景调色板：从主题色取色相，亮/暗两套（饱和度给足，肉眼可见地跟随主题色）
      const { h } = hexToHsl(hex)
      const hexToRgbStr = c => c.slice(1).match(/../g).map(x => parseInt(x, 16)).join(', ')
      const rgb = hexToRgbStr(hex)
      const palette = this.isDark
        ? {
            bg: hslToHex(h, 22, 6),
            bgSoft: hslToHex(h, 20, 8.5),
            cardBg: hslToHex(h, 20, 11),
            cardBorder: hslToHex(h, 18, 20),
            chipBg: 'rgba(255, 255, 255, 0.06)',
            navbarBg: `rgba(${hexToRgbStr(hslToHex(h, 22, 8))}, 0.85)`,
            heroGradient: `linear-gradient(135deg, rgba(${rgb}, 0.16), rgba(${rgb}, 0.05))`
          }
        : {
            bg: hslToHex(h, 55, 95),
            bgSoft: hslToHex(h, 50, 92),
            cardBg: hslToHex(h, 60, 97.5),
            cardBorder: hslToHex(h, 45, 88.5),
            chipBg: 'rgba(0, 0, 0, 0.04)',
            navbarBg: `rgba(${hexToRgbStr(hslToHex(h, 60, 97.5))}, 0.88)`,
            heroGradient: `linear-gradient(135deg, rgba(${rgb}, 0.12), rgba(${rgb}, 0.04))`
          }

      root.style.setProperty('--bg', palette.bg)
      root.style.setProperty('--bg-soft', palette.bgSoft)
      root.style.setProperty('--card-bg', palette.cardBg)
      root.style.setProperty('--card-border', palette.cardBorder)
      root.style.setProperty('--chip-bg', palette.chipBg)
      root.style.setProperty('--navbar-bg', palette.navbarBg)
      root.style.setProperty('--hero-gradient', palette.heroGradient)

      root.classList.toggle('dark', this.isDark)
    },

    setPrimaryColor(color) {
      if (!isHex(color)) return
      this.primaryColor = color
      localStorage.setItem('theme_primary', color)
      this.applyTheme()
    },

    toggleDark() {
      this.isDark = !this.isDark
      localStorage.setItem('theme_dark', this.isDark ? '1' : '0')
      this.applyTheme()
    }
  }
})
