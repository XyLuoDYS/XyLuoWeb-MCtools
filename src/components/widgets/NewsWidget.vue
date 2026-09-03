<script setup>
import { ref, onMounted } from 'vue'

// MC 官方社区更新动态 RSS（经代理做 CORS 转发，前端解析）
const RSS_URL = 'https://feedback.minecraft.net/hc/en-us/rss/community_updates'

// 多个免费 CORS 代理，依序尝试，提高成功率
const PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
]

// 网络不可用时的兜底示例
const FALLBACK = [
  { title: '（离线示例）Minecraft 更新动态会在这里展示', link: '', date: '', desc: '网络不可用时显示内置示例，恢复联网后会自动加载官方社区的最新动态。' }
]

const items = ref([])
const loading = ref(true)
const expanded = ref(-1)

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
function fmtDate(d) {
  if (!d) return ''
  const m = String(d.match(/\d{4}-\d{2}-\d{2}|[A-Za-z]{3},?\s+\d{1,2}.*?\d{4}|[A-Za-z]{3}\s+\d{1,2}/) || [''])[0]
  return m || d.slice(0, 16)
}

async function fetchText(url) {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(url), { mode: 'cors' })
      if (!res.ok) continue
      const text = await res.text()
      if (text && text.trim()) return text
    } catch {
      /* 尝试下一个代理 */
    }
  }
  return null
}

async function loadNews() {
  loading.value = true
  try {
    const xml = await fetchText(RSS_URL)
    if (!xml) throw new Error('no feed')
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const nodes = [...doc.querySelectorAll('item')].slice(0, 4)
    if (!nodes.length) throw new Error('no items')
    items.value = nodes.map(n => ({
      title: n.querySelector('title')?.textContent?.trim() || '（无标题）',
      link: n.querySelector('link')?.textContent?.trim() || '',
      date: n.querySelector('pubDate')?.textContent ?? '',
      desc: stripHtml(n.querySelector('description')?.textContent) || '暂无摘要'
    }))
  } catch {
    items.value = FALLBACK
  }
  loading.value = false
}

function toggle(i) {
  expanded.value = expanded.value === i ? -1 : i
}

onMounted(loadNews)
</script>

<template>
  <div class="widget news-widget">
    <div class="widget-head">
      <el-icon><Reading /></el-icon>
      <span>MC 新闻</span>
      <span class="news-chip">官方社区动态</span>
    </div>

    <div v-if="loading" class="news-status">加载中…</div>

    <div v-else class="news-list">
      <div
        v-for="(n, i) in items"
        :key="n.title + i"
        class="news-item"
        :class="{ open: expanded === i }"
        @click="toggle(i)"
      >
        <div class="news-title">
          <span class="news-dot" />
          <span class="news-title-text">{{ n.title }}</span>
          <span v-if="n.date" class="news-date">{{ fmtDate(n.date) }}</span>
        </div>
        <Transition name="news">
          <div v-if="expanded === i" class="news-body">
            <p class="news-desc">{{ n.desc }}</p>
            <a
              v-if="n.link"
              class="news-link"
              :href="n.link"
              target="_blank"
              rel="noopener"
              @click.stop
            >
              查看原文 <el-icon><Right /></el-icon>
            </a>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.news-widget {
  display: flex;
  flex-direction: column;
}
.news-chip {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}
.news-status {
  font-size: 13px;
  color: var(--text-muted);
  padding: 14px 0;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.news-item {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  cursor: pointer;
  transition: all 0.18s ease;
}
.news-item:hover {
  border-color: var(--primary);
}
.news-item.open {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 6%, var(--chip-bg));
}
.news-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.45;
}
.news-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}
.news-title-text {
  flex: 1;
}
.news-date {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}
.news-body {
  margin-top: 8px;
  border-top: 1px dashed color-mix(in srgb, var(--primary) 30%, transparent);
  padding-top: 8px;
}
.news-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.7;
  word-break: break-word;
}
.news-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--primary);
}
.news-link:hover {
  text-decoration: underline;
}

.news-enter-active,
.news-leave-active {
  transition: all 0.22s ease;
}
.news-enter-from,
.news-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>