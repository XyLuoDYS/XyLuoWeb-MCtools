<script setup>
import { ref, computed, onMounted } from 'vue'
import ClockWidget from '@/components/widgets/ClockWidget.vue'
import TipWidget from '@/components/widgets/TipWidget.vue'
import NewsWidget from '@/components/widgets/NewsWidget.vue'
import ToolCard from '@/components/ToolCard.vue'
import { fetchAnimeImage, FALLBACK_HERO, FALLBACK_CARD } from '@/utils/animeImage'

// 图片改为从网上动漫图库拉取（失败时回退到内置生成图）
const heroImg = ref(FALLBACK_HERO)
const mcColorImg = ref(FALLBACK_CARD)
const mcMenuImg = ref(FALLBACK_CARD)

onMounted(async () => {
  heroImg.value = await fetchAnimeImage('hero', FALLBACK_HERO)
  mcColorImg.value = await fetchAnimeImage('card', FALLBACK_CARD)
  // 用不同的 key，两张工具卡片才会拿到不同的图
  mcMenuImg.value = await fetchAnimeImage('menu', FALLBACK_CARD)
})

const tools = computed(() => [
  {
    title: '颜色代码生成',
    desc: '逐字选取上色：MC 旧版 16 色（&/§ 可选）或十六进制颜色（11 种格式），支持渐变、字体效果、插入重置，实时预览 MC 聊天框效果。',
    icon: 'MagicStick',
    to: '/mccolor',
    image: mcColorImg.value
  },
  {
    title: '贴图菜单生成',
    desc: '挑一个 MC 原版容器当底图，把你自绘的按钮贴图拖上去摆好位置，自定义导出分辨率，一键生成菜单 PNG。',
    icon: 'PictureFilled',
    to: '/mcmenu',
    image: mcMenuImg.value
  },
  {
    title: '更多工具',
    desc: '更多实用小工具正在施工中，敬请期待……',
    icon: 'Box',
    soon: true,
    image: null
  }
])
</script>

<template>
  <div class="page-container home">
    <!-- Hero 区 -->
    <section class="hero card">
      <div class="hero-text">
        <div class="chip hero-chip">
          <el-icon><Grid /></el-icon>
          MC 玩家 / 服主工具合集
        </div>
        <h1 class="hero-title">
          你好，<span class="highlight">冒险家</span>
        </h1>
        <p class="hero-sub">
          这里是 XyLuoDYS 的工具站 —— 为 Minecraft 玩家与服务器主打造的实用小工具集合，持续更新中。
        </p>
        <div class="hero-actions">
          <router-link to="/mccolor">
            <el-button type="primary" size="large" round>
              <el-icon style="margin-right: 6px"><MagicStick /></el-icon>
              开始使用工具
            </el-button>
          </router-link>
        </div>
      </div>
      <div class="hero-img">
        <img :src="heroImg" alt="Minecraft 动漫插画" />
      </div>
    </section>

    <!-- 小组件栏：小知识(左) + MC 新闻(右，占两格) -->
    <section class="widgets-row">
      <ClockWidget class="card" />
      <div class="widgets-left">
        <TipWidget class="card" />
      </div>
      <div class="widgets-news">
        <NewsWidget class="card" />
      </div>
    </section>

    <!-- 工具入口 -->
    <section class="tools-section">
      <div class="section-head">
        <h2>工具箱</h2>
        <span class="section-sub">点击卡片进入工具</span>
      </div>
      <div class="tools-grid">
        <ToolCard
          v-for="t in tools"
          :key="t.title"
          :title="t.title"
          :desc="t.desc"
          :icon="t.icon"
          :to="t.to"
          :image="t.image"
          :soon="t.soon"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  min-height: 300px;
  background-image: var(--hero-gradient);
}
.hero-text {
  flex: 1;
  padding: 40px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}
.hero-chip {
  align-self: flex-start;
}
.hero-title {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.2;
}
.highlight {
  color: var(--primary);
  position: relative;
}
.highlight::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 8px;
  background: color-mix(in srgb, var(--primary) 22%, transparent);
  border-radius: 4px;
  z-index: -1;
}
.hero-sub {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  max-width: 460px;
}
.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.hero-img {
  width: 42%;
  position: relative;
  overflow: hidden;
}
.hero-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: heroFloat 6s ease-in-out infinite;
}
@keyframes heroFloat {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.04) translateY(-6px); }
}

/* 小组件栏：minmax(0,1fr) 锁定列宽，长文本不会把列撑宽 */
.widgets-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.widgets-row > * {
  min-width: 0;
}
.widgets-left {
  grid-column: 2;
  display: flex;
}
.widgets-left .card {
  flex: 1;
  min-width: 0;
}
.widgets-news {
  grid-column: span 2;
  display: flex;
}
.widgets-news .card {
  flex: 1;
  min-width: 0;
}

/* 工具区 */
.tools-section {
  margin-top: 36px;
}
.section-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.section-head h2 {
  font-size: 22px;
  font-weight: 700;
}
.section-sub {
  font-size: 13px;
  color: var(--text-muted);
}
.tools-grid {
  display: grid;
  /* auto-fit：工具数量变化时列数自动跟着变，不用手改 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

/* 响应式 */
@media (max-width: 900px) {
  .hero {
    flex-direction: column;
  }
  .hero-text {
    padding: 30px 24px;
  }
  .hero-img {
    width: 100%;
    height: 200px;
  }
  .widgets-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .widgets-left {
    grid-column: auto;
  }
  .widgets-news {
    grid-column: span 2;
  }
}

/* 手机：单列铺满，Hero 收缩 */
@media (max-width: 640px) {
  .hero {
    min-height: 0;
  }
  .hero-text {
    padding: 24px 20px;
    gap: 10px;
  }
  .hero-title {
    font-size: 27px;
  }
  .hero-sub {
    font-size: 14px;
    line-height: 1.65;
  }
  .hero-img {
    height: 165px;
  }
  .widgets-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .widgets-left,
  .widgets-news {
    grid-column: auto;
  }
  .section-head {
    margin-bottom: 12px;
  }
  .section-head h2 {
    font-size: 19px;
  }
  .section-sub {
    display: none;
  }
}
</style>
