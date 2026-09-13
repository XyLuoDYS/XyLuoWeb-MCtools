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

// 粗体(&l)没有对应颜色，用文本色变量保证亮/暗模式都可见
const ITEM_COLORS = { '&a': '#55FF55', '&6': '#FFAA00', '&c': '#FF5555', '&b': '#55FFFF', '&d': '#FF55FF', '&l': 'var(--text-secondary)', '<gradient:#17c964:#4fc3f7>': '#4fc3f7', '<rainbow>': '#f5b942' }

async function copy(code) {
  const ok = () => ElMessage.success({ message: `已复制 ${code}`, duration: 1000 })

  try {
    await navigator.clipboard.writeText(code)
    return ok()
  } catch { /* 无剪贴板权限或非安全上下文，走降级 */ }

  // 降级方案：execCommand 可能返回 false，必须判断，不能无条件报成功
  let copied = false
  try {
    const ta = document.createElement('textarea')
    ta.value = code
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    copied = document.execCommand('copy')
    ta.remove()
  } catch {
    copied = false
  }

  if (copied) ok()
  else ElMessage.error({ message: '复制失败，请手动选中复制', duration: 1800 })
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
  /* MC 亮色系在浅色背景下对比度很低，加一圈内描边保证任何模式都看得见 */
  box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.5);
}
</style>
