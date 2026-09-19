import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 给 `<details>` 加「展开 / 收起」的高度过渡。
 *
 * ## 解决什么问题
 * 原生 `<details>` 的开合是**瞬间**的：一关就把内容设成 `display: none`，
 * 于是 CSS 的 `transition` 根本碰不到它 —— height / opacity 都无从过渡，
 * 点一下就是硬生生地跳出来、跳回去。这里补上高度 + 上下内边距 + 淡入淡出。
 *
 * ## 为什么必须拦掉 `summary` 的默认行为
 * `<details>` 的开关是浏览器内建的，改 `open` 属性会立刻重排，
 * 没有任何钩子能让你「先动画、再关闭」。所以：
 *   · 展开 —— 先 `open = true`，量出自然高度 h，再从 0 动画到 h；
 *   · 收起 —— **先别关**，从 h 动画到 0，等动画跑完（`onfinish`）才真正 `open = false`。
 * 两条路都用 `preventDefault()` 挡住浏览器自己的切换。
 *
 * ## 为什么要一起动画 padding
 * 内容是带上下 padding 的（`.fold-body` / `.faq-a` 都有）。
 * 只动画 height 的话，从 0 到 h 的过程中 padding 一直是满的 ——
 * 开头那几帧会先撑出一条空白的「宽带子」，看着像卡了一下。
 * 所以把 `padding-top` / `padding-bottom` 一起从 0 补上去。
 *
 * ## 为什么 `fill` 用 `'backwards'`（跟 useLayoutAnim 一个道理）
 * 新建的动画要等到下一帧才确定起始时间，在那之前它处于 before 阶段。
 * `'none'` 表示 before 阶段不生效 → 元素会先按**展开后的自然高度**画一帧（肉眼可见的一闪），
 * 下一帧才跳回 0 重新长出来。`'backwards'` 让 before 阶段就用起始值；
 * 而动画结束时不填充，自然高度刚好是终值，不留痕迹、也不污染元素的内联样式。
 *
 * ## 动画期间的 overflow
 * 高度在缩小时内容会溢出边框，所以临时把内容裁住（内联 `overflow: hidden`），
 * 结束时把原值还回去 —— 不用 class 是为了不依赖各页面的样式表。
 *
 * @param {import('vue').Ref<HTMLElement|null>} rootRef 包裹所有 `<details>` 的容器
 * @param {{ selector?: string, duration?: number, easing?: string }} [options]
 */
export function useDetailsAnim(rootRef, options = {}) {
  const selector = options.selector ?? 'details'
  const duration = options.duration ?? 260
  const easing = options.easing ?? 'cubic-bezier(0.22, 1, 0.36, 1)'

  const bound = new Set()
  const anims = new Map() // 内容元素 -> Animation
  const overflowBackup = new Map() // 内容元素 -> 原来的内联 overflow
  const disposers = []
  let mo = null

  const reduced = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /** 内容 = details 里除 summary 之外的那个元素 */
  const contentOf = details =>
    [...details.children].find(el => el.tagName !== 'SUMMARY') || null

  function readBox(el) {
    const cs = getComputedStyle(el)
    return {
      h: el.getBoundingClientRect().height,
      pt: cs.paddingTop,
      pb: cs.paddingBottom
    }
  }

  function releaseOverflow(el) {
    if (overflowBackup.has(el)) {
      el.style.overflow = overflowBackup.get(el)
      overflowBackup.delete(el)
    }
  }

  function toggle(details, content) {
    const opening = !details.open

    // 上一次动画还没跑完就又点了一下：先收掉，按当前状态重新来
    const prev = anims.get(content)
    if (prev) {
      try {
        prev.cancel()
      } catch {
        /* 已结束的动画 cancel 会抛，忽略 */
      }
      anims.delete(content)
      releaseOverflow(content)
    }

    if (reduced()) {
      details.open = opening
      return
    }

    if (opening) details.open = true
    // ⚠️ 一定要在 open 之后再量：关着的时候内容是 display:none，量出来是 0
    const box = readBox(content)

    const full = { height: `${box.h}px`, paddingTop: box.pt, paddingBottom: box.pb, opacity: 1 }
    const zero = { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }

    if (!overflowBackup.has(content)) overflowBackup.set(content, content.style.overflow)
    content.style.overflow = 'hidden'

    const a = content.animate(opening ? [zero, full] : [full, zero], {
      duration,
      easing,
      fill: 'backwards'
    })
    anims.set(content, a)

    a.onfinish = () => {
      // 已经被更新的一次点击顶掉了，这次的结果不要
      if (anims.get(content) !== a) return
      anims.delete(content)
      releaseOverflow(content)
      // 收起：动画跑完才真正关闭
      if (!opening) details.open = false
    }
    a.oncancel = () => {
      if (anims.get(content) === a) anims.delete(content)
      releaseOverflow(content)
    }
  }

  function bind(details) {
    if (bound.has(details)) return
    const summary = details.querySelector(':scope > summary')
    const content = contentOf(details)
    if (!summary || !content) return
    bound.add(details)

    const onClick = e => {
      // summary 里如果放了链接 / 按钮，别抢它们的点击
      const hit = e.target && e.target.closest
        ? e.target.closest('a, button, input, textarea, select')
        : null
      if (hit) return
      e.preventDefault()
      toggle(details, content)
    }

    summary.addEventListener('click', onClick)
    disposers.push(() => {
      summary.removeEventListener('click', onClick)
      const a = anims.get(content)
      if (a) {
        try {
          a.cancel()
        } catch { /* 忽略 */ }
        anims.delete(content)
      }
      releaseOverflow(content)
    })
  }

  function bindAll() {
    const root = rootRef.value
    if (!root) return
    for (const d of root.querySelectorAll(selector)) bind(d)
  }

  onMounted(() => {
    bindAll()
    // 折叠块如果以后变成动态渲染的，新增的要补绑上
    const root = rootRef.value
    if (root && typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => {
        const n = rootRef.value ? rootRef.value.querySelectorAll(selector).length : 0
        if (n !== bound.size) bindAll()
      })
      mo.observe(root, { childList: true, subtree: true })
    }
  })

  onBeforeUnmount(() => {
    mo?.disconnect()
    for (const fn of disposers) fn()
    disposers.length = 0
    bound.clear()
    anims.clear()
  })
}
