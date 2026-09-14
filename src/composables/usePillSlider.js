import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

/**
 * 分段控件（segmented control）的滑动指示块。
 *
 * 为什么不用纯 CSS 的 50% 推算：
 *   站内的分段控件按钮经常文字长短不一（「可视化编辑 / 粘贴代码解析」「完整贴图 / 自动裁切」），
 *   宽度并不相等；而且按钮还带 padding、容器带 border。硬算必然差几像素。
 *   这里直接量取选中按钮真实的 offsetLeft / offsetWidth 写进内联样式，任何文字长度都严丝合缝。
 *
 * 用法：
 *   const { wrapRef, pillStyle } = usePillSlider(() => activeKey.value, { pad: 4 })
 *   <div class="seg" ref="wrapRef">
 *     <span class="seg-pill" :style="pillStyle || {}" :class="{ ready: !!pillStyle }" />
 *     <button :class="{ on: activeKey === 'a' }">A</button>
 *     <button :class="{ on: activeKey === 'b' }">B</button>
 *   </div>
 *
 * 约定：
 *   - 容器（ref 指向的元素）必须有 `position: relative`、且内边距等于 `pad`。
 *   - 选中按钮必须有 `.on`（或 `.active`）类，指示块靠它定位。
 *   - pillStyle 为 null 表示「还没量到 / 当前没有选中项」→ 指示块应隐藏（用 .ready 控制透明度）。
 *
 * @param {() => any} activeKey 返回当前选中项标识的 getter（响应式）
 * @param {{ pad?: number }} [opts] pad：容器内边距，用于把 offsetLeft/offsetTop 折算成左/上偏移
 */
export function usePillSlider(activeKey, opts = {}) {
  const pad = opts.pad ?? 4
  const wrapRef = ref(null)
  const pillStyle = ref(null)
  let raf = 0

  function measure() {
    const wrap = wrapRef.value
    if (!wrap) return
    const btn = wrap.querySelector('button.on, button.active')
    if (!btn) {
      pillStyle.value = null
      return
    }
    pillStyle.value = {
      width: `${btn.offsetWidth}px`,
      // 只做水平位移：垂直方向由 CSS 的 top/bottom(= pad) 撑满，
      // 这样不依赖 offsetTop 的基准（不同引擎在含 border 的容器上取法不一致，会差 1px）
      transform: `translateX(${btn.offsetLeft - pad}px)`
    }
  }

  // 合并到下一帧再量：切换选中项的同一帧内，按钮的 .on 类与容器尺寸都可能还在变，
  // 立刻量会拿到旧值（指示块滑到错位置）。
  function sync() {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(measure)
  }

  watch(activeKey, () => nextTick(sync))

  onMounted(() => {
    nextTick(sync)
    // 字体加载完成前按钮宽度可能是回退字体的宽度 → 字一换位置就偏了，字体就绪后再量一次
    if (document.fonts?.ready) document.fonts.ready.then(sync).catch(() => {})
    window.addEventListener('resize', sync)
  })

  onUnmounted(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', sync)
  })

  return { wrapRef, pillStyle, sync }
}
