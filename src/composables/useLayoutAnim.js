import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 卡片布局的变化动画（FLIP 位移 + 高度伸缩）。
 *
 * ## 解决什么问题
 * 纯 CSS 只能给「内容」加过渡。当某张卡片从空态变成有内容、高度从 60px 涨到 320px 时，
 * 它下面那些卡片的位移是**跳**过去的 —— 兄弟元素的位移不受 transition 控制。
 * 用户看到的就是"卡片哗一下全移位了"，很硬。
 *
 * ## 为什么用 ResizeObserver 而不是 watch + nextTick
 * 一开始用「数据变化 → nextTick → 量取」的写法，结果**完全没生效**：
 * 参数面板的两种状态用了 `<Transition mode="out-in">`，它会先播 leave 动画，
 * 新内容要等 ~120ms 后才真正插入。nextTick 那一刻 DOM 还没换，高度自然没变，
 * 于是判不出差异、什么动画都没生成；而真正的高度变化发生在之后，没人接住。
 *
 * 改成观察尺寸：**不管高度变化是谁引起的**（Transition 延迟、数据变更、字体替换），
 * 尺寸一变就能捕获，比猜时机可靠得多。
 *
 * ## 原理
 * 1. 记住上一次稳定态的每张卡片 rect；
 * 2. 某张卡片尺寸一变（ResizeObserver 回调）→ 重新量所有卡片；
 * 3. 位置变了 → FLIP：先用 transform 把它"瞬移"回旧位置，再动画回 0，看起来就是滑过去的；
 *    高度变了 → 直接对 height 做过渡，看起来就是卡片在"长高/收缩"；
 * 4. 位移和高度用**同一套时长与缓动**，两者才会严丝合缝地同步
 *    （否则卡片下边缘和下一张卡片的上边缘会错开）。
 *
 * ## 为什么用 WAAPI 而不是内联 style + transition
 * `fill: 'none'` 表示动画播完不留任何痕迹，不会像内联样式那样污染元素
 * （`.card` 本身还有 `transition: transform ...` 的 hover 效果，用内联 transition 覆盖容易打架）。
 *
 * @param {import('vue').Ref<HTMLElement|null>} rootRef 包裹所有卡片的容器
 * @param {{ selector?: string, duration?: number, easing?: string, minMove?: number, warmup?: number }} [options]
 */
export function useLayoutAnim(rootRef, options = {}) {
  const selector = options.selector ?? '.panel-card'
  const duration = options.duration ?? 340
  const easing = options.easing ?? 'cubic-bezier(0.4, 0, 0.2, 1)'
  const minMove = options.minMove ?? 0.5
  // 首屏这段时间里布局还在陆续稳定（容器贴图解码完、字体替换…），先不播动画
  const warmup = options.warmup ?? 340

  let ro = null
  let prev = new Map()
  let ready = false
  // 动画自己也会改高度 → 会再把 ResizeObserver 叫醒。用锁把这段窗口内的回调忽略掉，
  // 否则会自激成一串动画。锁释放时重新校准基线，避免错位累积。
  let locked = false
  let lockTimer = null
  let recheckTimer = null
  let warmupTimer = null
  let running = []
  let hiddenOverflow = new Set()
  let cleanTimer = null

  const reduced = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function measure() {
    const root = rootRef.value
    const m = new Map()
    if (!root) return m
    for (const el of root.querySelectorAll(selector)) {
      if (!el.offsetWidth && !el.offsetHeight) continue // 隐藏的卡片不参与
      m.set(el, el.getBoundingClientRect())
    }
    return m
  }

  function stop() {
    for (const a of running) {
      try {
        a.cancel()
      } catch {
        /* 已结束的动画 cancel 会抛，忽略 */
      }
    }
    running = []
    clearTimeout(cleanTimer)
    for (const el of hiddenOverflow) el.style.overflow = ''
    hiddenOverflow.clear()
  }

  function play(before, after) {
    stop()
    if (reduced()) return
    for (const [el, a] of after) {
      const b = before.get(el)
      if (!b) continue // 新出现的卡片：交给它自己的出场动画，不参与位移
      if (!a.height) continue

      const dx = b.left - a.left
      const dy = b.top - a.top
      if (Math.abs(dx) > minMove || Math.abs(dy) > minMove) {
        running.push(
          el.animate(
            { transform: [`translate(${dx}px, ${dy}px)`, 'translate(0px, 0px)'] },
            { duration, easing, fill: 'none' }
          )
        )
      }

      const dh = b.height - a.height
      if (Math.abs(dh) > 1) {
        // 高度变化时把内容裁住，否则中间帧会看到内容溢出卡片边框
        el.style.overflow = 'hidden'
        hiddenOverflow.add(el)
        running.push(
          el.animate({ height: [`${b.height}px`, `${a.height}px`] }, { duration, easing, fill: 'none' })
        )
      }
    }

    if (hiddenOverflow.size) {
      cleanTimer = setTimeout(() => {
        for (const el of hiddenOverflow) el.style.overflow = ''
        hiddenOverflow.clear()
      }, duration + 60)
    }
  }

  function onChange() {
    if (!ready || locked) return
    const after = measure()
    if (!after.size) return
    // 先加锁：play 里的高度动画会再次触发 ResizeObserver
    locked = true
    clearTimeout(lockTimer)
    lockTimer = setTimeout(() => {
      locked = false
    }, duration + 80)
    play(prev, after)
    prev = after
    clearTimeout(recheckTimer)
    recheckTimer = setTimeout(() => {
      prev = measure()
    }, duration + 140)
  }

  function bind() {
    const root = rootRef.value
    if (!root || typeof ResizeObserver === 'undefined') return
    ro?.disconnect()
    ro = new ResizeObserver(onChange)
    for (const el of root.querySelectorAll(selector)) ro.observe(el)
  }

  onMounted(() => {
    warmupTimer = setTimeout(() => {
      prev = measure()
      ready = true
      bind()
    }, warmup)
  })

  onBeforeUnmount(() => {
    clearTimeout(warmupTimer)
    clearTimeout(lockTimer)
    clearTimeout(recheckTimer)
    ro?.disconnect()
    stop()
  })
}
