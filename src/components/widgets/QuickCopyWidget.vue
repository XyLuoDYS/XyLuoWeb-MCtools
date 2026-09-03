<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const items = ref([
  { label: '绿', code: '&a' },
  { label: '金', code: '&6' },
  { label: '红', code: '&c' },
  { label: '水', code: '&b' },
  { label: '紫', code: '&d' },
  { label: '渐变头', code: '<gradient:#17c964:#4fc3f7>' },
  { label: '彩虹', code: '<rainbow>' },
  { label: '粗体', code: '&l' }
])

const ITEM_COLORS = { '&a': '#55FF55', '&6': '#FFAA00', '&c': '#FF5555', '&b': '#55FFFF', '&d': '#FF55FF', '&l': '#FFFFFF', '<gradient:#17c964:#4fc3f7>': '#4fc3f7', '<rainbow>': '#f5b942' }

async function copy(code) {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success({ message: `已复制 ${code}`, duration: 1000 })
  } catch {
    const ta = document.createElement('textarea')
    ta.value = code
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    ElMessage.success({ message: `已复制 ${code}`, duration: 1000 })
  }
}
</script>

<template>
  <div class="widget">
    <div class="widget-head">
      <el-icon><DocumentCopy /></el-icon>
      <span>快捷复制</span>
    </div>
    <div class="copy-grid">
      <button
        v-for="item in items"
        :key="item.code"
        class="copy-chip"
        @click="copy(item.code)"
      >
        <span class="dot" :style="{ background: ITEM_COLORS[item.code] }" />
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.copy-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.copy-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.copy-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}
.copy-chip:active {
  transform: scale(0.94);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
