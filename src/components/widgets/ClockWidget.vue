<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const now = ref(new Date())
let timer = null

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => clearInterval(timer))

const pad = n => String(n).padStart(2, '0')
</script>

<template>
  <div class="widget clock-widget">
    <div class="widget-head">
      <el-icon><Clock /></el-icon>
      <span>现在时间</span>
    </div>
    <div class="time">{{ pad(now.getHours()) }}:{{ pad(now.getMinutes()) }}<small>:{{ pad(now.getSeconds()) }}</small></div>
    <div class="date">{{ now.getFullYear() }}-{{ pad(now.getMonth() + 1) }}-{{ pad(now.getDate()) }} {{ WEEKDAYS[now.getDay()] }}</div>
  </div>
</template>

<style scoped>
.time {
  font-size: 26px;
  font-weight: 700;
  font-family: Consolas, monospace;
  color: var(--primary);
  letter-spacing: 1px;
}
.time small {
  font-size: 16px;
  color: var(--text-muted);
}
.date {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
</style>
