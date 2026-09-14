<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// MC 官方新闻 RSS。
// 原 feedback.minecraft.net 的 Zendesk feed 已下线（403），
// minecraft.net/en-us/feeds/news 也已是 404。
// 改用 mcbe.news 缓存的「官方 Minecraft.net 新闻」（标准 RSS 2.0）。
const RSS_URL = 'https://mcbe.news/news/official/rss.xml'

// 该源不返回 CORS 头，浏览器无法直连：
// 1) Vite dev / preview 的同源转发（vite.config.js 的 /api/mc-news）
// 2) 公共 CORS 代理，静态部署时兜底
const PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
]

// 下拉可选条数
const FETCH_LIMIT = 12

const FALLBACK = [
  {
    title: '暂时无法获取 MC 新闻',
    link: '',
    date: '',
    desc: '新闻源或网络不可用。可点下方「重试」再试一次，或稍后刷新页面。'
  }
]

const items = ref([])
const status = ref('loading') // loading | ok | error
const current = ref(0)
const translating = ref(false)

const currentItem = computed(() => items.value[current.value] || null)

/* ---------------- 翻译缓存 ---------------- */
const CACHE_KEY = 'mcnews_zh_v1'
let zhCache = {}
try {
  zhCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}
} catch {
  zhCache = {}
}
function saveCache() {
  try {
    // 只保留最近 300 条，避免无限膨胀
    const keys = Object.keys(zhCache)
    if (keys.length > 300) {
      keys.slice(0, keys.length - 300).forEach(k => delete zhCache[k])
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(zhCache))
  } catch { /* 隐私模式等场景下忽略 */ }
}

/* ---------------- 工具函数 ---------------- */
function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function fmtDate(d) {
  if (!d) return ''
  const t = new Date(d)
  if (Number.isNaN(t.getTime())) return String(d).slice(0, 16)
  const p = n => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`
}

// 并发池：MyMemory 有限流，别一次打太多
async function mapLimit(list, limit, fn) {
  const out = new Array(list.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, async () => {
      while (i < list.length) {
        const idx = i++
        out[idx] = await fn(list[idx], idx)
      }
    })
  )
  return out
}

/* ---------------- 翻译 ---------------- */
async function translateOne(text) {
  if (!text) return ''
  const key = `t:${text.length}:${text.slice(0, 64)}`
  if (zhCache[key]) return zhCache[key]

  // MyMemory 对单条长度有限制，超出直接截断
  const q = text.length > 450 ? text.slice(0, 450) : text
  const qs = new URLSearchParams({
    q,
    langpair: 'en|zh-CN',
    de: 'xyluodys.tool@example.com' // 提高每日额度
  })

  const tryOne = async base => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 9000)
    try {
      const res = await fetch(`${base}?${qs}`, { signal: ctrl.signal })
      if (!res.ok) return null
      const j = await res.json()
      if (String(j?.responseStatus) !== '200') return null
      const out = j?.responseData?.translatedText
      if (!out) return null
      // 超限时接口会把警告当成译文返回，必须识别出来
      if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE/i.test(out)) return null
      return out
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  const out = (await tryOne('/api/translate')) ?? (await tryOne('https://api.mymemory.translated.net/get'))
  if (out) {
    zhCache[key] = out
    saveCache()
  }
  return out || ''
}

// 标题短，一次性把下拉里的都翻好
async function translateTitles() {
  await mapLimit(items.value, 4, async it => {
    const zh = await translateOne(it.title)
    if (zh) it.zhTitle = zh
  })
}

// 摘要长，只翻当前这一条，切换时按需翻译
async function translateCurrentDesc() {
  const it = currentItem.value
  if (!it || it.zhDesc || !it.desc) return
  translating.value = true
  const zh = await translateOne(it.desc)
  if (zh && currentItem.value === it) it.zhDesc = zh
  translating.value = false
}

/* ---------------- 拉取新闻 ---------------- */
// 校验返回内容确实是 feed（静态托管下 /api/mc-news 会回落到 index.html）
async function tryFetch(url, timeout) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const text = (await res.text()) || ''
    return /<rss|<feed|<item[\s>]|<entry[\s>]/i.test(text) ? text : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fetchText() {
  const local = await tryFetch('/api/mc-news', 6000)
  if (local) return local
  for (const proxy of PROXIES) {
    const text = await tryFetch(proxy(RSS_URL), 8000)
    if (text) return text
  }
  return null
}

async function loadNews() {
  status.value = 'loading'
  current.value = 0
  const xml = await fetchText()
  if (!xml) {
    items.value = FALLBACK.map(o => ({ ...o, dateText: '' }))
    status.value = 'error'
    return
  }
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    if (doc.querySelector('parsererror')) throw new Error('bad xml')
    const nodes = [...doc.querySelectorAll('item')].slice(0, FETCH_LIMIT)
    if (!nodes.length) throw new Error('no items')
    items.value = nodes.map(n => {
      const date = n.querySelector('pubDate')?.textContent ?? ''
      return {
        title: n.querySelector('title')?.textContent?.trim() || '（无标题）',
        link: n.querySelector('link')?.textContent?.trim() || '',
        desc: stripHtml(n.querySelector('description')?.textContent) || '暂无摘要',
        dateText: fmtDate(date),
        zhTitle: '',
        zhDesc: ''
      }
    })
    status.value = 'ok'
    translateTitles()
  } catch {
    items.value = FALLBACK.map(o => ({ ...o, dateText: '' }))
    status.value = 'error'
  }
}

/* ---------------- 详情弹窗 ---------------- */
const detailVisible = ref(false)

function openDetail() {
  if (!currentItem.value) return
  detailVisible.value = true
  translateCurrentDesc() // 摘要按需翻译，打开时才翻，省额度
}

function openLink() {
  const link = currentItem.value?.link
  if (link) window.open(link, '_blank', 'noopener')
}

/* ---------------- 背景滚动锁定 ---------------- */
/* 不用 Element 自带的 lock-scroll：它会给 body 加 `width: calc(100% - 滚动条宽)`，
   而本站滚动条常驻，补偿多余 → 整页被挤窄。
   这里只拦截滚动手势，完全不动 overflow / 宽度，页面一个像素都不会位移。 */
function blockScroll(e) {
  if (e.target?.closest?.('.el-dialog')) return // 弹窗内部正文要能滚
  if (e.cancelable) e.preventDefault()
}
watch(detailVisible, on => {
  if (on) {
    document.addEventListener('wheel', blockScroll, { passive: false })
    document.addEventListener('touchmove', blockScroll, { passive: false })
  } else {
    document.removeEventListener('wheel', blockScroll)
    document.removeEventListener('touchmove', blockScroll)
  }
})

onUnmounted(() => {
  document.removeEventListener('wheel', blockScroll)
  document.removeEventListener('touchmove', blockScroll)
})

onMounted(loadNews)
</script>

<template>
  <div class="widget news-widget">
    <!-- 头部骨架与小知识一致：徽章 + 标题 + 右上操作区 -->
    <div class="news-head">
      <span class="news-badge"><el-icon><Reading /></el-icon></span>
      <span class="news-name">MC 新闻</span>

      <el-select
        v-if="status !== 'loading'"
        v-model="current"
        size="small"
        class="news-picker"
        popper-class="xy-popper news-popper"
        placeholder="选择日期"
      >
        <el-option v-for="(it, i) in items" :key="i" :value="i" :label="it.dateText || '—'">
          <span class="opt-row">
            <span class="opt-date">{{ it.dateText || '—' }}</span>
            <span class="opt-title">{{ it.zhTitle || it.title }}</span>
          </span>
        </el-option>
      </el-select>
    </div>

    <div v-if="status === 'loading'" class="news-status">
      <el-icon class="is-loading"><Loading /></el-icon>
      加载中…
    </div>

    <!-- 引用框：只显示标题，点击弹出居中详情 -->
    <div
      v-else-if="currentItem"
      class="news-body"
      role="button"
      tabindex="0"
      :title="currentItem.zhTitle || currentItem.title"
      @click="openDetail"
      @keydown.enter.prevent="openDetail"
      @keydown.space.prevent="openDetail"
    >
      <span class="news-headline">{{ currentItem.zhTitle || currentItem.title }}</span>
      <el-icon class="news-go"><Right /></el-icon>
    </div>

    <div v-if="status === 'error'" class="news-retry">
      <el-button size="small" text type="primary" @click="loadNews">重试</el-button>
    </div>

    <!--
      详情弹窗：append-to-body 挂到 <body> 独立成层，
      不受父级卡片的 overflow / transform / z-index 影响，也不会撑高首页卡片
    -->
    <el-dialog
      v-model="detailVisible"
      width="560px"
      align-center
      append-to-body
      destroy-on-close
      :lock-scroll="false"
      class="news-dialog"
    >
      <template #header>
        <div class="dlg-head">
          <span class="dlg-badge"><el-icon><Reading /></el-icon></span>
          <span class="dlg-kicker">MC 新闻</span>
          <span v-if="currentItem?.dateText" class="dlg-date">{{ currentItem.dateText }}</span>
        </div>
      </template>

      <div v-if="currentItem" class="dlg-body">
        <h3 class="dlg-title">{{ currentItem.zhTitle || currentItem.title }}</h3>
        <p v-if="currentItem.zhTitle && currentItem.zhTitle !== currentItem.title" class="dlg-title-en">
          {{ currentItem.title }}
        </p>

        <div class="dlg-text">
          <template v-if="currentItem.zhDesc">{{ currentItem.zhDesc }}</template>
          <span v-else-if="translating" class="dlg-loading">
            <el-icon class="is-loading"><Loading /></el-icon> 正在翻译…
          </span>
          <template v-else>{{ currentItem.desc }}</template>
        </div>

        <details v-if="currentItem.zhDesc && currentItem.desc" class="dlg-raw">
          <summary>查看英文原文</summary>
          <p>{{ currentItem.desc }}</p>
        </details>
      </div>

      <template #footer>
        <div class="dlg-foot">
          <span class="dlg-url" :title="currentItem?.link">{{ currentItem?.link || '暂无原地址' }}</span>
          <el-button type="primary" size="small" :disabled="!currentItem?.link" @click="openLink">
            打开原地址 <el-icon><Right /></el-icon>
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.news-widget {
  gap: 10px;
}

/* 头部：描边徽章（小知识是渐变填充，这里做出区别）+ 标题 + 日期下拉 */
.news-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.news-badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 14px;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  flex-shrink: 0;
}
.news-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  min-width: 0;
}

/* 日期下拉：改造成站点 chip 观感（去边框、圆角、弱化），不抢标题视线 */
.news-picker {
  width: 116px;
  flex-shrink: 0;
}
.news-picker :deep(.el-select__wrapper) {
  min-height: 26px;
  border-radius: 8px;
  font-size: 12px;
  background: var(--chip-bg);
  box-shadow: none;
  padding: 0 8px;
}
.news-picker :deep(.el-select__wrapper:hover) {
  background: color-mix(in srgb, var(--primary) 10%, var(--chip-bg));
}
.news-picker :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--primary) inset;
}
.news-picker :deep(.el-select__placeholder) {
  color: var(--text-muted);
  font-size: 12px;
}
.news-picker :deep(.el-select__selected-item) {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.news-picker :deep(.el-select__caret) {
  color: var(--text-muted);
  font-size: 12px;
}

.news-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  padding: 14px 0;
}
.news-retry {
  display: flex;
  justify-content: flex-end;
}

/* 引用框：只放一行标题，点击打开详情。
   与小知识的差别在竖线：小知识是纯色实线，这里是「渐变渐隐」竖线 */
.news-body {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border-radius: 10px;
  padding: 9px 12px 9px 14px;
  background: var(--chip-bg);
  cursor: pointer;
  transition: background 0.2s ease;
}
.news-body::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 18%, transparent));
  transition: opacity 0.2s ease;
}
.news-body:hover {
  background: color-mix(in srgb, var(--primary) 8%, var(--chip-bg));
}
.news-body:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}
.news-headline {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}
.news-body:hover .news-headline {
  color: var(--primary);
}
.news-go {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--primary);
  opacity: 0.7;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.news-body:hover .news-go {
  opacity: 1;
  transform: translateX(2px);
}

/* ---------------- 详情弹窗 ---------------- */
.dlg-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 24px; /* 给右上角关闭按钮留位 */
}
.dlg-badge {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  flex-shrink: 0;
}
.dlg-kicker {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}
.dlg-date {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  background: var(--chip-bg);
  padding: 2px 8px;
  border-radius: 999px;
}

.dlg-title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.45;
  color: var(--text);
  margin: 0;
  word-break: break-word;
}
.dlg-title-en {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
  word-break: break-word;
}
.dlg-text {
  margin-top: 14px;
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 46vh;
  overflow-y: auto;
  padding-right: 4px;
}
.dlg-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary);
  font-size: 13px;
}

.dlg-raw {
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--chip-bg);
  border-radius: 8px;
  padding: 8px 12px;
}
.dlg-raw summary {
  cursor: pointer;
  user-select: none;
}
.dlg-raw summary:hover {
  color: var(--primary);
}
.dlg-raw p {
  margin-top: 8px;
  line-height: 1.75;
  word-break: break-word;
}

.dlg-foot {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dlg-url {
  flex: 1;
  min-width: 0;
  font-size: 11.5px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: Consolas, monospace;
}

/* 下拉项：日期 + 中文标题 */
.opt-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  max-width: 100%;
}
.opt-date {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.opt-title {
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-loading {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 窄屏：下拉收窄，标题一行省略不受影响 */
@media (max-width: 640px) {
  .news-picker {
    width: 104px;
  }
  .dlg-text {
    max-height: 40vh;
  }
  .dlg-foot {
    flex-wrap: wrap;
    gap: 8px;
  }
  .dlg-url {
    flex: 1 1 100%;
    order: 2;
  }
}
</style>

<!-- 弹窗与下拉浮层被 teleport 到 body，scoped 属性选择器失效，这里写全局样式 -->
<style>
.news-dialog.el-dialog,
.news-dialog .el-dialog {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: var(--shadow-hover);
  padding: 0;
  overflow: hidden;
  max-width: calc(100vw - 32px);
}
.news-dialog .el-dialog__header {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid var(--card-border);
}
.news-dialog .el-dialog__headerbtn {
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
}
.news-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--primary);
}
.news-dialog .el-dialog__body {
  padding: 18px 20px;
  color: var(--text);
}
.news-dialog .el-dialog__footer {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--card-border);
}

/* 下拉浮层（teleport 到 body）
   底色/边框/圆角/箭头/悬停/选中态统一交给 global.css 的 .xy-popper，
   这里只写「新闻下拉」特有的部分。
   之前这里只设了 border/radius/shadow 而没设底色，浮层就沿用了 Element
   默认的 --el-bg-color-overlay，暗色下和站点卡片明显不同色；箭头也没换色，
   会露出一块浅色小三角 —— 这就是「菜单风格和网页不符」的来源。 */
.news-popper.el-popper {
  max-width: min(360px, calc(100vw - 32px));
}
.news-popper .el-select-dropdown__item.is-selected .opt-date {
  color: color-mix(in srgb, var(--primary) 75%, var(--text-muted));
}

@media (max-width: 640px) {
  .news-dialog.el-dialog,
  .news-dialog .el-dialog {
    max-width: calc(100vw - 24px);
  }
  .news-dialog .el-dialog__body {
    padding: 14px 16px;
  }
  .news-dialog .el-dialog__header {
    padding: 14px 16px;
  }
  .news-dialog .el-dialog__footer {
    padding: 10px 16px 14px;
  }
}
</style>
