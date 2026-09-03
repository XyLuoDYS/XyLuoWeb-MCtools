<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'

// 网上知识库：填入可直接返回【字符串数组】的 JSON 地址（需支持跨域）。
// 留空则使用下方内置知识库。若你的库需代理，可在前面加上代理前缀。
const MC_TIPS_URL = '' // 例如 'https://example.com/tips.json'

const BUILTIN_TIPS = [
  '钻石矿石最常见于 Y=-58 层附近',
  '水桶和铁桶是对付堕入岩浆的好帮手',
  '§a 是绿色，§c 是红色，聊天栏也能用',
  'MiniMessage 的 <rainbow> 标签可以让文字七彩渐变',
  '绿宝石只在山地生物群系生成',
  '用命名牌给羊命名 "jeb_" 会让它变彩虹色',
  '信标需要在下界之星的基础上搭建金字塔',
  'Java 版的 § 代码在 Bedrock 版要写成 §',
  '下界传送门最小只需要 4x5 的黑曜石框架，但更大更宽的传送门可以同时容纳更多玩家和生物',
  '潜影盒被破坏时会掉落自身，记得先附魔绑定诅咒？不，它不会掉'
]

const tips = ref([...BUILTIN_TIPS])
const tip = ref('')
const index = ref(0)

/* 展开状态与视觉省略状态分离：
   - expanded：逻辑上是否展开
   - clamped：文本是否显示单行省略（收起的过渡动画结束后才置 true，
     这样收起时文字先被 max-height 逐渐裁掉，而不是瞬间变一行） */
const expanded = ref(false)
const clamped = ref(true)

const bodyRef = ref(null)
const textRef = ref(null)
const collapsedH = ref(38)
const expandedH = ref(38)
const truncatable = ref(false)
let clampTimer = null

function measure() {
  const body = bodyRef.value
  const text = textRef.value
  if (!body || !text) return
  if (expanded.value) {
    expandedH.value = body.scrollHeight
  } else if (clamped.value) {
    collapsedH.value = body.scrollHeight
    truncatable.value = text.scrollWidth > text.clientWidth + 1
  }
}

function onTransitionEnd() {
  // 收起动画结束后再显示省略号
  if (!expanded.value) {
    clamped.value = true
    nextTick(measure)
  }
}

async function toggleExpand() {
  if (clampTimer) { clearTimeout(clampTimer); clampTimer = null }
  if (expanded.value) {
    // 收起：保持多行，让 max-height 过渡逐渐裁掉，结束后再打省略
    expanded.value = false
    await nextTick()
    measure()
    clampTimer = setTimeout(() => {
      if (!expanded.value) {
        clamped.value = true
        nextTick(measure)
      }
    }, 320)
  } else {
    expanded.value = true
    clamped.value = false
    await nextTick()
    measure()
  }
}

async function nextTip() {
  if (clampTimer) { clearTimeout(clampTimer); clampTimer = null }
  index.value = (index.value + 1) % tips.value.length
  tip.value = tips.value[index.value]
  expanded.value = false
  clamped.value = true
  await nextTick()
  measure()
}

async function loadRemote() {
  if (!MC_TIPS_URL) return
  try {
    const res = await fetch(MC_TIPS_URL)
    const data = await res.json()
    if (Array.isArray(data) && data.length) {
      tips.value = data.map(String).filter(Boolean)
    }
  } catch {
    // 网络失败则继续使用内置知识库
  }
}

function onResize() {
  measure()
}

onMounted(async () => {
  await loadRemote()
  index.value = Math.floor(Math.random() * tips.value.length)
  tip.value = tips.value[index.value]
  await nextTick()
  measure()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (clampTimer) clearTimeout(clampTimer)
})
</script>

<template>
  <div class="widget tip-widget">
    <div class="tip-head">
      <span class="tip-badge"><el-icon><MagicStick /></el-icon></span>
      <span class="tip-title">MC 小知识</span>
      <button class="refresh-btn" title="换一条" @click="nextTip">
        <el-icon><RefreshRight /></el-icon>
      </button>
    </div>

    <div
      ref="bodyRef"
      class="tip-body"
      :style="{ maxHeight: (expanded ? expandedH : collapsedH) + 'px' }"
      @transitionend="onTransitionEnd"
    >
      <p
        ref="textRef"
        class="tip-line"
        :class="{ clamp: clamped && !expanded }"
        :title="(expanded || truncatable) ? (expanded ? '点击收起' : '点击展开') : ''"
        @click="(expanded || truncatable) && toggleExpand()"
      >{{ tip }}</p>
    </div>
  </div>
</template>

<style scoped>
.tip-widget {
  gap: 10px;
}

/* 头部：渐变图标徽章 + 标题 + 换一条 */
.tip-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tip-badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  box-shadow: 0 3px 8px var(--primary-light);
  flex-shrink: 0;
}
.tip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}
.refresh-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 13px;
  transition: all 0.2s ease;
}
.refresh-btn:hover {
  color: var(--primary);
  border-color: var(--primary);
  transform: rotate(120deg);
}

/* 正文：引用框样式，高度过渡动画（展开 / 收起都有） */
.tip-body {
  overflow: hidden;
  border-radius: 10px;
  padding: 8px 12px;
  border-left: 3px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 5%, var(--chip-bg));
  transition: max-height 0.3s ease;
}
.tip-line {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.7;
  white-space: normal;
  word-break: break-all;
}
/* 收起态：最多一行，超出省略号（随窗口宽度实时截断） */
.tip-line.clamp {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
/* 展开态：点击文本收起 */
.tip-body:has(.tip-line:not(.clamp)) {
  cursor: pointer;
}
</style>
