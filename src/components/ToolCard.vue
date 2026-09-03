<script setup>
defineProps({
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  icon: { type: String, default: 'SetUp' },
  to: { type: String, default: null },
  image: { type: String, default: null },
  soon: { type: Boolean, default: false }
})
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    class="tool-card card"
    :class="{ soon }"
  >
    <div class="card-banner" :class="{ soon }">
      <img v-if="image" :src="image" :alt="title" loading="lazy" />
      <div v-else class="banner-fallback">
        <el-icon :size="34"><component :is="icon" /></el-icon>
      </div>
      <span v-if="soon" class="soon-badge">敬请期待</span>
    </div>
    <div class="card-body">
      <div class="card-title">
        <el-icon class="title-icon"><component :is="icon" /></el-icon>
        {{ title }}
      </div>
      <p class="card-desc">{{ desc }}</p>
      <span v-if="to" class="card-enter">进入工具 →</span>
    </div>
  </component>
</template>

<style scoped>
.tool-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
}
.tool-card:not(.soon):hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary);
}
.tool-card.soon {
  cursor: default;
  opacity: 0.62;
}
.card-banner {
  height: 130px;
  position: relative;
  overflow: hidden;
}
.card-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.tool-card:not(.soon):hover .card-banner img {
  transform: scale(1.06);
}
.banner-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary-light), var(--bg-soft));
  color: var(--primary);
}
.card-banner.soon .banner-fallback {
  color: var(--text-muted);
}
.soon-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
  backdrop-filter: blur(4px);
}
.card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
}
.title-icon {
  color: var(--primary);
}
.card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.55;
  flex: 1;
}
.card-enter {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  transition: letter-spacing 0.2s ease;
}
.tool-card:not(.soon):hover .card-enter {
  letter-spacing: 1px;
}
</style>
