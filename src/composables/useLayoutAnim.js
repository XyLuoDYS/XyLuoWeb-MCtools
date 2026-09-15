import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 卡片「伸缩」动画：卡片高度变化时给 height 做过渡。
 *
 * ## 解决什么问题
 * 纯 CSS 只能给「内容」做过渡，卡片自身的高度是**跳**过去的 ——
 * 比如颜色页的「颜色」卡片从 16 色网格换成取色器、贴图菜单页的参数面板从空态变成编辑态，
 * 高度会瞬间从 140px 变成 400px，看着很硬。这里补上高度过渡，卡片看起来就是在「长高 / 收缩」。
 *
 * 高度是**真实布局属性**：给它做动画时，后面的卡片会跟着一起连续下移 / 上移，
 * 所以不需要额外再补位移动画（早期版本用 FLIP 给兄弟卡片做 translate，
 * 会和高度动画叠加出「又滑又弹」的怪异观感，已移除）。
 *
 * ## 三个关键设计（都是踩坑换来的）
 *
 * ### 1. 用 ResizeObserver，别用 watch + nextTick
 * 「数据变化 → nextTick → 量取」测不出东西：状态切换往往包在 `<Transition mode="out-in">` 里，
 * 它会先播 leave 动画，新内容要等一会儿才插入。nextTick 那一刻 DOM 还没换，高度自然没变，
 * 于是判不出差异；而真正的高度变化发生在之后，没人接住。
 * 观察尺寸就与「谁引起的」无关了，比猜时机可靠。
 *
 * ### 2. 在尺寸回调里**立即**开始动画，别延迟
 * ResizeObserver 的回调发生在「布局完成、绘制之前」。在这里同步起动画，
 * 新的自然高度根本不会被画出来 —— 观众看到的第一帧就是动画的起始高度，无闪烁。
 * 早期版本为了躲开 `<Transition>` 可能出现的「塌陷中间态」而加了几十毫秒去抖，
 * 结果每帧都在变的高度会把去抖无限续期：动画被拖到 400ms 后才开始，
 * 卡片先闪到终值、再缩回去重播一遍，比不做还难看。
 *
 * ### 3. 用「按元素」的动画守卫，别用全局时间锁
 * 早期版本用一个 `locked` 布尔值挡住「动画自身触发的尺寸回调」，结果它把**别的卡片**也挡住了：
 * 放置一张贴图会先让「图层」卡片长高（拿走锁），过一会儿「贴图参数」卡片才换内容 ——
 * 那次变化正好落在锁的有效期里被丢掉，于是只有第一张卡片有动画。
 * 现在只跳过**正在被我们动画的那几个元素**（`blocked` 集合），互不干扰。
 *
 * ## 为什么用 WAAPI 而不是内联 style + transition
 * `fill: 'backwards'` 让动画在「开始时间尚未确定」的那一帧就用起始值（否则会闪一帧终值），
 * 而动画结束后不填充，所以不会像内联样式那样污染元素
 * （卡片本身还有 `transition: transform …` 的 hover 效果，用内联 transition 覆盖容易打架）。
 *
 * @param {import('vue').Ref<HTMLElement|null>} rootRef 包裹所有卡片的容器
 * @param {{ selector?: string, duration?: number, easing?: string, minHeight?: number, warmup?: number }} [options]
 */
export function useLayoutAnim(rootRef, options = {}) {
  const selector = options.selector ?? '.panel-card'
  const duration = options.duration ?? 340
  const easing = options.easing ?? 'cubic-bezier(0.4, 0, 0.2, 1)'
  // 高度差小于这个值不值得动（亚像素抖动，动了反而糊）
  const minHeight = options.minHeight ?? 2
  // 首屏这段时间里布局还在陆续稳定（字体替换、图片解码…），先不播动画
  const warmup = options.warmup ?? 340

  let ro = null
  let mo = null
  let settled = new Map() // el -> 当前认为稳定的高度
  let observedCount = -1
  let ready = false
  let warmupTimer = null

  const anims = new Map() // el -> Animation
  const animTimers = new Map() // el -> timeoutId
  const blocked = new Set() // 正在被我们动画的卡片：忽略它自己的尺寸回调
  const clipped = new Set() // 动画期间被临时裁掉溢出的卡片

  const reduced = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /** 量取每张卡片的高度；隐藏的卡片不参与 */
  function measure() {
    const root = rootRef.value
    const m = new Map()
    if (!root) return m
    for (const el of root.querySelectorAll(selector)) {
      if (!el.offsetWidth && !el.offsetHeight) continue
      m.set(el, el.getBoundingClientRect().height)
    }
    return m
  }

  function animateEl(el, from, to) {
    // 高度变化时把内容裁住，否则中间帧会看到内容溢出卡片边框
    el.style.overflow = 'hidden'
    clipped.add(el)
    blocked.add(el)
    // ⚠️ fill 必须是 'backwards' 而不是 'none'：
    // 新建的动画要等到下一帧才确定开始时间，在那之前它处于 before 阶段 ——
    // 'none' 表示 before 阶段不生效，于是元素会先按「新的自然高度」画一帧（肉眼可见的一闪），
    // 下一帧才跳回起始高度重新长上去。'backwards' 让 before 阶段就用起始值，
    // 而动画结束后不填充（自然高度正好是目标值），同样不会留痕迹。
    const a = el.animate({ height: [`${from}px`, `${to}px`] }, { duration, easing, fill: 'backwards' })
    anims.set(el, a)
    const t = setTimeout(() => {
      anims.delete(el)
      animTimers.delete(el)
      blocked.delete(el)
      if (clipped.has(el)) {
        el.style.overflow = ''
        clipped.delete(el)
      }
    }, duration + 60)
    animTimers.set(el, t)
  }

  function cancelAll() {
    for (const [, a] of anims) {
      try {
        a.cancel()
      } catch {
        /* 已结束的动画 cancel 会抛，忽略 */
      }
    }
    anims.clear()
    for (const t of animTimers.values()) clearTimeout(t)
    animTimers.clear()
    blocked.clear()
    for (const el of clipped) el.style.overflow = ''
    clipped.clear()
  }

  function onChange(entries) {
    if (!ready || !rootRef.value) return
    // 只由「没在动画中的卡片」的变化触发；否则自己的动画每帧都会把这里叫醒
    if (entries && !entries.some(e => !blocked.has(e.target))) return

    const now = measure()
    if (!now.size) return
    for (const [el, h] of now) {
      // 正在被我们动画的卡片：整个跳过（既不更新基线也不动画），
      // 否则会把动画中间帧的高度误当成新基线，动画结束后又反向弹一次
      if (blocked.has(el)) continue
      const from = settled.get(el)
      settled.set(el, h)
      if (from === undefined) continue // 新出现的卡片：只登记基线
      if (reduced()) continue
      if (Math.abs(from - h) < minHeight) continue
      animateEl(el, from, h)
    }
    // 已消失的元素清掉基线，避免 Map 一直变大
    for (const el of [...settled.keys()]) if (!now.has(el)) settled.delete(el)
  }

  function observeAll() {
    const root = rootRef.value
    if (!root || typeof ResizeObserver === 'undefined') return
    ro?.disconnect()
    ro = new ResizeObserver(onChange)
    const els = root.querySelectorAll(selector)
    for (const el of els) ro.observe(el)
    observedCount = els.length
  }

  /** 卡片被整块重建后重新绑定；新卡片在下次 onChange 里只登记基线，不会被动画一下 */
  function rebind() {
    for (const el of [...settled.keys()]) if (!el.isConnected) settled.delete(el)
    observeAll()
  }

  onMounted(() => {
    warmupTimer = setTimeout(() => {
      settled = measure()
      ready = true
      observeAll()
      const root = rootRef.value
      if (root && typeof MutationObserver !== 'undefined') {
        mo = new MutationObserver(() => {
          if (!ready || !rootRef.value) return
          // 卡片数量没变就不用重绑（子树里的普通增删很频繁）
          if (rootRef.value.querySelectorAll(selector).length === observedCount) return
          rebind()
        })
        mo.observe(root, { childList: true, subtree: true })
      }
    }, warmup)
  })

  onBeforeUnmount(() => {
    clearTimeout(warmupTimer)
    ro?.disconnect()
    mo?.disconnect()
    cancelAll()
  })
}
