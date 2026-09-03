<script setup>
const tools = [
  { name: '颜色代码生成', done: true },
  { name: '更多工具', done: false }
]
const doneCount = tools.filter(t => t.done).length
</script>

<template>
  <div class="widget">
    <div class="widget-head">
      <el-icon><DataLine /></el-icon>
      <span>工具进度</span>
    </div>
    <div class="progress-row">
      <el-progress
        type="circle"
        :percentage="Math.round((doneCount / tools.length) * 100)"
        :width="64"
        :stroke-width="7"
      />
      <div class="tool-list">
        <div v-for="t in tools" :key="t.name" class="tool-item">
          <span class="status-dot" :class="{ done: t.done }" />
          <span :class="{ 'done-text': t.done }">{{ t.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.tool-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
  color: var(--text-secondary);
}
.tool-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  opacity: 0.5;
}
.status-dot.done {
  background: var(--primary);
  opacity: 1;
  box-shadow: 0 0 6px var(--primary);
}
.done-text {
  color: var(--text);
}
</style>
