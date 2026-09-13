<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import ReactiveColorPicker from '@/components/widgets/ReactiveColorPicker.vue'

/* ================= 基础数据 ================= */
const VANILLA_COLORS = [
  { code: '0', name: '黑色', hex: '#000000' },
  { code: '1', name: '深蓝', hex: '#0000AA' },
  { code: '2', name: '深绿', hex: '#00AA00' },
  { code: '3', name: '湖蓝', hex: '#00AAAA' },
  { code: '4', name: '深红', hex: '#AA0000' },
  { code: '5', name: '深紫', hex: '#AA00AA' },
  { code: '6', name: '金色', hex: '#FFAA00' },
  { code: '7', name: '灰色', hex: '#AAAAAA' },
  { code: '8', name: '深灰', hex: '#555555' },
  { code: '9', name: '蓝色', hex: '#5555FF' },
  { code: 'a', name: '绿色', hex: '#55FF55' },
  { code: 'b', name: '天蓝', hex: '#55FFFF' },
  { code: 'c', name: '红色', hex: '#FF5555' },
  { code: 'd', name: '粉色', hex: '#FF55FF' },
  { code: 'e', name: '黄色', hex: '#FFFF55' },
  { code: 'f', name: '白色', hex: '#FFFFFF' }
]
const MINI_NAMES = ['black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white']

const HEX_FORMATS = [
  { id: 'amp', label: '原版 (&#RRGGBB)' },
  { id: 'x', label: '原版 (&x&R&R&G&G&B&B)' },
  { id: 'mini', label: '聊天 (<#RRGGBB>)' },
  { id: 'motd', label: 'MOTD (\\u00A7x)' },
  { id: 'sx', label: '控制台 (§x§R§R§G§G§B§B)' },
  { id: 'bbcode', label: 'BBCode ([COLOR=#RRGGBB])' },
  { id: 'mini_single', label: 'MiniMessage 单颜色 (<#RRGGBB>)' },
  { id: 'cmi', label: 'CMI ({#RRGGBB})' },
  { id: 'easylib', label: 'EasyLib (<#RRGGBB>)' }
]

// 内置渐变模板：一键应用到选中字符
const GRAD_PRESETS = [
  { name: '彩虹', colors: ['#FF5555', '#FFAA00', '#FFFF55', '#55FF55', '#55FFFF', '#5555FF'] },
  { name: '烈焰', colors: ['#AA0000', '#FF5555', '#FFAA00'] },
  { name: '海洋', colors: ['#00AAAA', '#5555FF', '#55FFFF'] },
  { name: '森之绿', colors: ['#00AA00', '#55FF55', '#FFFF55'] },
  { name: '暮光', colors: ['#AA00AA', '#5555FF', '#FF55FF'] },
  { name: '钻石', colors: ['#55FFFF', '#5555FF'] }
]

/* ================= 颜色工具函数 ================= */
function hexToRgbArr(hex) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
}
function lerpColor(c1, c2, t) {
  const a = hexToRgbArr(c1)
  const b = hexToRgbArr(c2)
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
function hexOfLegacy(code) {
  return VANILLA_COLORS.find(c => c.code === code).hex
}
// 圆形色块上的文字用黑还是白
function textOn(hex) {
  const [r, g, b] = hexToRgbArr(hex)
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#333' : '#fff'
}

/* =========================================================
 * 旧版"颜色选择"卡片逻辑（卡片模板已注释，逻辑暂保留不删）
 * ========================================================= */
const gradColors = ref(['#084CFB', '#ADF3FD'])
const gradStyles = ref({ bold: false, italic: false, underline: false, strike: false, uppercase: true })

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const f = n => {
    const k = (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(v * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}
function addGradColor() {
  if (gradColors.value.length < 6) gradColors.value.push('#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'))
}
function removeGradColor(i) {
  if (gradColors.value.length > 2) gradColors.value.splice(i, 1)
}
function randomGradient() {
  const n = 2 + Math.floor(Math.random() * 2)
  const h0 = Math.floor(Math.random() * 360)
  gradColors.value = Array.from({ length: n }, (_, i) => hslToHex((h0 + (i * 300) / n) % 360, 70 + Math.random() * 30, 45 + Math.random() * 20))
}
const gradBarCss = computed(() => `linear-gradient(90deg, ${gradColors.value.join(', ')})`)
/* ================ 旧版逻辑保留结束 ================ */

/* ================= 文本与字符样式 ================= */
const text = ref('你好,Minecraft!')
const chars = computed(() => [...text.value])
// 每个字符的样式：null 或 { ct: 'legacy'|'hex'|null, cc, ch, b,i,u,s,o }
const charStyles = ref([...text.value].map(() => null))

// 文本编辑时通过前后缀 diff 计算编辑区，正确平移样式/重置标记/选区/插入点（避免索引错位）
// suppressTextWatch：内部替换字符时跳过 diff（长度不变，样式/选区无需平移且必须保留）
let suppressTextWatch = false
watch(text, (val, oldVal) => {
  if (suppressTextWatch) {
    suppressTextWatch = false
    return
  }
  const nv = [...val]
  const ov = [...(oldVal ?? '')]
  // 公共前缀 / 后缀
  let p = 0
  while (p < nv.length && p < ov.length && nv[p] === ov[p]) p++
  let s = 0
  while (s < nv.length - p && s < ov.length - p && nv[nv.length - 1 - s] === ov[ov.length - 1 - s]) s++
  const delStart = p
  const delEnd = ov.length - s // 旧文本 [delStart, delEnd) 区间被替换
  const delta = nv.length - ov.length
  // 旧索引 → 新索引（null = 已被删除）
  const mapIdx = r => (r < delStart ? r : r >= delEnd ? r + delta : null)

  const rs = new Set()
  for (const r of resets.value) {
    const m = mapIdx(r)
    if (m !== null) rs.add(m)
  }
  resets.value = rs

  const cs2 = new Array(nv.length).fill(null)
  for (let i = 0; i < ov.length; i++) {
    const m = mapIdx(i)
    if (m !== null) cs2[m] = charStyles.value[i] ?? null
  }
  charStyles.value = cs2

  const sel = new Set()
  for (const i of selection.value) {
    const m = mapIdx(i)
    if (m !== null) sel.add(m)
  }
  selection.value = sel

  if (insertPos.value !== null) insertPos.value = mapIdx(insertPos.value)
})

/* ================= 选取模块 ================= */
const selection = ref(new Set())
const anchor = ref(null)
const dragging = ref(false)
const insertPos = ref(null)
const resets = ref(new Set())

const selectionSorted = computed(() => [...selection.value].sort((a, b) => a - b))

/* ---------------- 手机：点击直接选中 ---------------- */
/* 点中哪个字符由元素自身边界决定，直接精确选中即可：
     点一下 → 选中该字符
     再点同一个 → 取消
   打开「多选模式」后可逐个累加（点一下切换一次）。
   已取消手机的拖动框选（原 onTouchMove/onTouchEnd 从没绑定过监听，本就是死代码）。 */
function tapChar(i) {
  insertPos.value = null
  // 多选模式：点一下切换，可累加
  if (multiMode.value) {
    toggleOneChar(i)
    return
  }
  // 已经是唯一选中项 → 再点取消
  if (selection.value.size === 1 && selection.value.has(i)) {
    selection.value = new Set()
    return
  }
  selection.value = new Set([i])
}

const multiMode = ref(false)
const isTouch = ref(false)
let lastTouchAt = 0 // 触摸结束后浏览器会补发 mousedown，需要忽略

function toggleMultiMode() {
  multiMode.value = !multiMode.value
}
function toggleOneChar(i) {
  const s = new Set(selection.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  selection.value = s
}
function invertSelection() {
  if (!chars.value.length) return
  const s = new Set()
  for (let i = 0; i < chars.value.length; i++) if (!selection.value.has(i)) s.add(i)
  selection.value = s
}
function clearSelection() {
  selection.value = new Set()
}

// 字符上按下（触屏）：直接选中，不做拖动框选
function onCharTouchStart(i, e) {
  lastTouchAt = Date.now()
  // 不让触摸再触发后续合成鼠标事件的拖动逻辑
  dragging.value = false
  pendingToggleOff = false
  tapChar(i)
}

/* 小栏动画模式：
   - bar-slide：小栏出现/消失（选区从无到有）→ 高度塌陷动画
   - bar-fade：效果栏 ↔ 插入栏直接切换 → 纯交叉淡入淡出，卡片高度不变 */
const barAnim = ref('bar-slide')
watch(
  () => [selection.value.size > 0, insertPos.value !== null],
  ([nowEff, nowIns], [prevEff, prevIns]) => {
    barAnim.value = (nowEff && prevIns) || (nowIns && prevEff) ? 'bar-fade' : 'bar-slide'
  }
)

// 单击已选中的字符时先记账、mouse up 时再判定：没移动 = 取消选择，移到其他字符 = 拖动框选
let pendingToggleOff = false
function startDrag(i, e) {
  // 触屏后浏览器补发的合成鼠标事件：忽略，否则会覆盖刚触摸选好的结果
  if (Date.now() - lastTouchAt < 700) return
  insertPos.value = null
  if (e.ctrlKey || e.metaKey || multiMode.value) {
    toggleOneChar(i)
    dragging.value = false
    return
  }
  // 普通单击唯一选中的字符：保持选区并记账，mouseup 无移动才取消（不阻断从它发起拖动）
  if (selection.value.size === 1 && selection.value.has(i)) {
    pendingToggleOff = true
    anchor.value = i
    dragging.value = true
    return
  }
  pendingToggleOff = false
  anchor.value = i
  dragging.value = true
  selection.value = new Set([i])
}
// 选取区背景 mousedown：清空选中字符和插入点。
// 注意不能用 click：拖动框选时 mousedown/up 落在不同元素上，click 会派发到祖先 .select-area（target 是自己），
// 误触清空刚拖选的结果
function clearSelectionOnBg() {
  if (selection.value.size) selection.value = new Set()
  if (insertPos.value !== null) insertPos.value = null
}
function selectAllChars() {
  insertPos.value = null
  selection.value = new Set(chars.value.map((_, i) => i))
}

const allCharsSelected = computed(() =>
  chars.value.length > 0 && selection.value.size === chars.value.length
)
function toggleSelectAll() {
  if (allCharsSelected.value) selection.value = new Set()
  else selectAllChars()
}
function extendDrag(i) {
  if (!dragging.value) return
  pendingToggleOff = false // 拖到其他字符 = 框选，不是取消单击
  const s = new Set()
  const a = Math.min(anchor.value, i)
  const b = Math.max(anchor.value, i)
  for (let k = a; k <= b; k++) s.add(k)
  selection.value = s
}
function endDrag() {
  if (dragging.value && pendingToggleOff) {
    selection.value = new Set() // 按下后未移动：取消选择
    pendingToggleOff = false
  }
  dragging.value = false
}
function clickGap(i) {
  // 再次点击同一间隙 = 取消插入点
  if (insertPos.value === i) {
    insertPos.value = null
    return
  }
  insertPos.value = i
  selection.value = new Set()
}
function toggleResetAt(i) {
  const s = new Set(resets.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  resets.value = s
}
const insertPosHasReset = computed(() => insertPos.value !== null && resets.value.has(insertPos.value))
function toggleResetAtInsertPos() {
  if (insertPos.value !== null) toggleResetAt(insertPos.value)
}

/* ================= Del 快捷删除 ================= */
// 非输入框内按 Del/Backspace：多选了颜色点 → 删点；选中了字符 → 删字符（样式随 text watcher 自动清理）
function onKeydown(e) {
  if (e.target instanceof Element && e.target.matches('input, textarea, [contenteditable="true"]')) return
  // Esc：取消颜色点的选中状态。
  // 单击不再「再点一下取消」，所以这里保留一个明确的取消入口，避免选中态只能靠删除来解除。
  if (e.key === 'Escape') {
    if (selectedPointIds.value.size) {
      e.preventDefault()
      selectedPointIds.value = new Set()
    }
    return
  }
  if (e.key !== 'Delete' && e.key !== 'Backspace') return
  if (selectedPointIds.value.size) {
    e.preventDefault()
    deleteSelectedPoint()
  } else if (selection.value.size) {
    e.preventDefault()
    deleteSelectedChars()
  }
}
function deleteSelectedChars() {
  const sel = selection.value
  const next = [...text.value].filter((_, i) => !sel.has(i)).join('')
  selection.value = new Set()
  text.value = next
}

// 选区中字符的内联样式（所见即所得）
function charCss(i) {
  const st = charStyles.value[i]
  if (!st) return {}
  const css = {}
  if (st.ct === 'legacy') css.color = hexOfLegacy(st.cc)
  else if (st.ct === 'hex') css.color = st.ch
  // 记录描边色，供粗体的外描边使用（无颜色时回退白色）
  if (st.b) css['--fx'] = css.color || '#ffffff'
  if (st.b) css.fontWeight = '700'
  if (st.i) css.fontStyle = 'italic'
  const deco = [st.u ? 'underline' : '', st.s ? 'line-through' : ''].join(' ').trim()
  if (deco) css.textDecoration = deco
  return css
}

/* ================= 上色（一步直达） ================= */
const colorMode = ref('legacy') // legacy | custom
const symbol = ref('§')
const hexFormat = ref('amp')
const fmtOpen = ref(false)
const fmtSelectRef = ref(null)
function onDocClickCloseFmt(e) {
  if (fmtSelectRef.value && !fmtSelectRef.value.contains(e.target)) fmtOpen.value = false
}
onMounted(() => {
  document.addEventListener('mousedown', onDocClickCloseFmt)
  window.addEventListener('keydown', onKeydown)
  // 触屏检测：仅用于文案/样式分支。
  // ⚠️ 不要在这里自动开启多选模式 —— 用户要求手机默认是「点一下选中、再点取消」的单选语义，
  // 只有手动点右上角「多选」才进入可累加的逐个点选。
  isTouch.value = window.matchMedia?.('(pointer: coarse)').matches ?? false
  // 模式切换滑块：首帧、字体加载完成后、窗口尺寸变化时都重新量一次
  nextTick(syncEmsSlider)
  if (document.fonts) document.fonts.ready.then(syncEmsSlider)
  window.addEventListener('resize', syncEmsSlider)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocClickCloseFmt)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', syncEmsSlider)
  stopDragListen() // 防止渐变点拖动监听泄漏
})

/* ================= 预览背景自定义（localStorage 持久化） ================= */
const DEFAULT_PREVIEW_BG = '#141414'
const PREVIEW_BG_KEY = 'mccolor_preview_bg'
const savedBg = localStorage.getItem(PREVIEW_BG_KEY)
const previewBg = ref(/^#[0-9a-fA-F]{6}$/.test(savedBg) ? savedBg : DEFAULT_PREVIEW_BG)
watch(previewBg, v => {
  try { localStorage.setItem(PREVIEW_BG_KEY, v) } catch { /* 忽略 */ }
})

function requireSelection() {
  if (!selection.value.size) {
    ElMessage.warning({ message: '先在右侧选取字符（单击 / 拖动 / Ctrl 多选）', duration: 1800 })
    return false
  }
  return true
}

// 旧版 16 色：点击立即上色
function applyLegacyColor(c) {
  if (!requireSelection()) return
  for (const i of selection.value) {
    const prev = charStyles.value[i] || {}
    charStyles.value[i] = { ...prev, ct: 'legacy', cc: c.code }
  }
  ElMessage.success({ message: `已上色 ${selection.value.size} 个字符`, duration: 1000 })
}

/* ================= 渐变编辑条 ================= */
// 颜色点：{ id, color, pos(0~100) }，单击空白创建、点击选中、按住拖动
const trackRef = ref(null)
const barPoints = ref([
  { id: 1, color: '#FF5555', pos: 0 },
  { id: 2, color: '#55FFFF', pos: 100 }
])
let ptSeq = 2
// 支持多选：Ctrl+单击叠加/移除；拖动任一选中点 = 整组平移
const selectedPointIds = ref(new Set())
const selectedPoints = computed(() => barPoints.value.filter(p => selectedPointIds.value.has(p.id)))
const selectedPoint = computed(() => selectedPointIds.value.size === 1 ? (selectedPoints.value[0] || null) : null)
const sortedPoints = computed(() => [...barPoints.value].sort((a, b) => a.pos - b.pos))
const barCss = computed(() => `linear-gradient(90deg, ${sortedPoints.value.map(p => `${p.color} ${p.pos}%`).join(', ')})`)

// 拖动状态
let dragPtId = null
let dragMoved = false
let dragStartX = 0
let dragLastPos = 0
// 本次按下是否「单击在唯一选中的点上」——按下时先记下来，等松手时若不是拖动才取消选中。
// 不能在按下瞬间就取消：那会让选区在拖动开始前消失，表现为「点一下切换一下、拖不动」。
let clickToggleId = null

function posFromEvent(e) {
  const rect = trackRef.value.getBoundingClientRect()
  return Math.round(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * 100)
}
// 条上 t(0~1) 处的颜色（按颜色点位置插值）
function barColorAt(t) {
  const pts = sortedPoints.value
  if (!pts.length) return '#FFFFFF'
  if (pts.length === 1) return pts[0].color
  if (t <= pts[0].pos / 100) return pts[0].color
  const last = pts[pts.length - 1]
  if (t >= last.pos / 100) return last.color
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i].pos / 100
    const b = pts[i + 1].pos / 100
    if (t >= a && t <= b) {
      return lerpColor(pts[i].color, pts[i + 1].color, b > a ? (t - a) / (b - a) : 0)
    }
  }
  return last.color
}
function onPointDown(p, e) {
  e.preventDefault() // 防止拖动时触发文字选中
  clickToggleId = null
  if (e.ctrlKey || e.metaKey) {
    // Ctrl+单击：叠加 / 移除选中
    const s = new Set(selectedPointIds.value)
    if (s.has(p.id)) s.delete(p.id)
    else s.add(p.id)
    selectedPointIds.value = s
    if (!s.has(p.id)) return // 移除选中后不进入拖动
  } else if (!selectedPointIds.value.has(p.id)) {
    // 单击未选中的点：单选该点
    selectedPointIds.value = new Set([p.id])
  } else if (selectedPointIds.value.size === 1) {
    // 单击「唯一选中的点」：先只做个标记，真正的取消选中放到松手时（onTrackUp）。
    // 这样按住拖动依然能拖（拖动会清掉这个标记），单击才取消，两者不再打架。
    clickToggleId = p.id
  }
  // 已在选区里的点：保持选区不动（多选时整组拖动）
  dragPtId = p.id
  dragMoved = false
  dragStartX = e.clientX
  dragLastPos = posFromEvent(e)
  startDragListen()
}
function onTrackDown(e) {
  e.preventDefault() // 防止拖动时触发文字选中
  if (barPoints.value.length >= 8) {
    ElMessage.warning({ message: '最多 8 个颜色点', duration: 1200 })
    return
  }
  const pos = posFromEvent(e)
  const p = { id: ++ptSeq, color: barColorAt(pos / 100), pos }
  barPoints.value.push(p)
  selectedPointIds.value = new Set([p.id])
  dragPtId = p.id
  dragMoved = true // 新建的点可直接拖动
  dragLastPos = pos
  startDragListen()
}
// 拖动期间监听挂到 window 上：光标/手指移出渐变条（甚至移出页面）也仍可继续拖。
// ⚠️ 必须用 pointermove/pointerup，不能用 mousemove/mouseup ——
//    触屏上 pointerdown 里调了 preventDefault()，浏览器不会再补发合成鼠标事件，
//    用 mouse 事件会让手机端「按下去纹丝不动」。
function startDragListen() {
  window.addEventListener('pointermove', onTrackMove)
  window.addEventListener('pointerup', onTrackUp)
  window.addEventListener('pointercancel', onTrackUp)
}
function stopDragListen() {
  window.removeEventListener('pointermove', onTrackMove)
  window.removeEventListener('pointerup', onTrackUp)
  window.removeEventListener('pointercancel', onTrackUp)
}
// 整组拖动：所有选中点保持间距一起平移，clamp 到 0~100
function applyGroupDrag(pos) {
  const pts = selectedPoints.value
  if (!pts.length) return
  let delta = pos - dragLastPos
  if (!delta) return
  const minPos = Math.min(...pts.map(p => p.pos))
  const maxPos = Math.max(...pts.map(p => p.pos))
  delta = delta > 0 ? Math.min(delta, 100 - maxPos) : Math.max(delta, -minPos)
  dragLastPos += delta
  for (const p of pts) p.pos += delta
}
function onTrackMove(e) {
  if (dragPtId == null) return
  if (!dragMoved && Math.abs(e.clientX - dragStartX) < 4) return // 移动超过阈值才算拖动
  dragMoved = true
  applyGroupDrag(posFromEvent(e))
}
function onTrackUp(e) {
  if (dragPtId == null) return
  const clickId = clickToggleId
  // 只有「按下时标记了要切换」且「整段过程没有发生拖动」才算一次单击；
  // pointercancel（手势被系统/浏览器打断）不算，避免误取消选中。
  const isClick = clickId != null && !dragMoved && e?.type !== 'pointercancel'
  dragPtId = null
  dragMoved = false
  clickToggleId = null
  stopDragListen()
  if (isClick && selectedPointIds.value.size === 1 && selectedPointIds.value.has(clickId)) {
    selectedPointIds.value = new Set() // 单击已选中的点 → 取消选中
  }
}
function deleteSelectedPoint() {
  if (!selectedPointIds.value.size) return
  if (barPoints.value.length <= selectedPointIds.value.size) {
    ElMessage.warning({ message: '至少保留 1 个颜色点', duration: 1200 })
    return
  }
  barPoints.value = barPoints.value.filter(p => !selectedPointIds.value.has(p.id))
  selectedPointIds.value = new Set()
}

// 实时应用渐变条到选中字符（无提示，供实时响应使用）
function liveApplyBar() {
  const sel = selectionSorted.value
  const n = sel.length
  if (!n) return
  sel.forEach((idx, k) => {
    const hexVal = barColorAt(n > 1 ? k / (n - 1) : 0)
    const prev = charStyles.value[idx] || {}
    charStyles.value[idx] = { ...prev, ct: 'hex', ch: hexVal }
  })
}
// 渐变条实时响应：颜色点颜色/位置变化时，若已多选字符则立即上色（单选用快捷取色器）
watch(
  barPoints,
  () => {
    if (colorMode.value !== 'custom') return
    if (selection.value.size <= 1) return
    liveApplyBar()
  },
  { deep: true }
)
// 内置渐变模板：载入渐变条（watch 会自动应用到选中字符）
function applyGradPreset(gp) {
  const n = gp.colors.length
  barPoints.value = gp.colors.map((c, i) => ({ id: ++ptSeq, color: c, pos: n > 1 ? Math.round((i * 100) / (n - 1)) : 0 }))
  selectedPointIds.value = new Set()
  if (!selection.value.size) {
    ElMessage.warning({ message: '先在右侧选取字符（单击 / 拖动 / Ctrl 多选）', duration: 1800 })
  }
}

/* ================= 字体效果（快捷工具栏） ================= */
const EFFECTS = [
  { key: 'b', label: 'B', css: 'font-weight:700', tip: '粗体 —— 加粗文字' },
  { key: 'i', label: 'I', css: 'font-style:italic', tip: '斜体 —— 倾斜文字' },
  { key: 'u', label: 'U', css: 'text-decoration:underline', tip: '下划线 —— 文字底部加线' },
  { key: 's', label: 'S', css: 'text-decoration:line-through', tip: '删除线 —— 文字中间加线' },
  { key: 'o', label: '乱', css: '', tip: '乱码 —— 文字随机变化' }
]
function effectState(key) {
  const sel = selectionSorted.value
  if (!sel.length) return false
  return sel.every(i => !!charStyles.value[i]?.[key])
}
function toggleEffect(key) {
  if (!selection.value.size) return
  const val = !effectState(key)
  for (const i of selection.value) {
    const prev = charStyles.value[i] || {}
    charStyles.value[i] = { ...prev, [key]: val }
  }
}

/* ================= 不改变效果替换字符 ================= */
// 选中字符后输入替换内容：按选中顺序一一对应替换字符本体，颜色/效果/重置标记全部保留。
// 始终基于选区建立时的原始文本重建，退格即可逐步还原；文本长度不变，样式索引天然对齐。
const replaceInput = ref('')
let replaceOrigin = ''
let clearingReplace = false
watch(selection, () => {
  replaceOrigin = text.value
  if (replaceInput.value) {
    clearingReplace = true
    replaceInput.value = ''
  }
})
watch(replaceInput, v => {
  if (clearingReplace) { clearingReplace = false; return }
  if (!selection.value.size) return
  const origin = [...replaceOrigin]
  const sel = selectionSorted.value
  const rep = [...v]
  const out = origin.map((ch, i) => {
    const j = sel.indexOf(i)
    return j !== -1 && j < rep.length ? rep[j] : ch
  })
  const next = out.join('')
  if (next === text.value) return
  suppressTextWatch = true
  text.value = next
})

/* ================= 单个字符快速上色 ================= */
// 单选一个字符时，快捷工具栏出现取色器，拖选即实时变色
const singleSelIndex = computed(() =>
  selectionSorted.value.length === 1 ? selectionSorted.value[0] : null
)
const singleColor = ref('#FFFFFF')
watch(singleSelIndex, i => {
  if (i === null) return
  const st = charStyles.value[i]
  singleColor.value = st
    ? st.ct === 'hex' ? st.ch
    : st.ct === 'legacy' ? hexOfLegacy(st.cc)
    : '#FFFFFF'
    : '#FFFFFF'
})
watch(singleColor, v => {
  const i = singleSelIndex.value
  if (i === null) return
  // 变化来自字符样式同步（如旧版色块上色）时不回写，避免把 legacy 覆盖成 hex
  if (singleCharColorSig.value === v) return
  const prev = charStyles.value[i] || {}
  charStyles.value[i] = { ...prev, ct: 'hex', ch: v }
})
// 单字符颜色被其他途径改变时（如旧版色块），同步取色器 HEX
const singleCharColorSig = computed(() => {
  const i = singleSelIndex.value
  if (i === null) return null
  const st = charStyles.value[i]
  if (!st || !st.ct) return '#FFFFFF'
  return st.ct === 'hex' ? st.ch : hexOfLegacy(st.cc)
})
watch(singleCharColorSig, v => {
  if (v !== null && v !== singleColor.value) singleColor.value = v
})

/* ================= 颜色预设（localStorage 持久化） ================= */
const PRESET_KEY = 'mccolor_presets'
function loadPresets() {
  try {
    const raw = JSON.parse(localStorage.getItem(PRESET_KEY))
    if (!Array.isArray(raw)) return []
    // 必须逐项校验：pts 缺失或为空会让 presetName() 读 pts[0].color 直接抛错、整页白屏
    return raw
      .filter(p =>
        p && typeof p === 'object' &&
        Array.isArray(p.pts) && p.pts.length > 0 &&
        p.pts.every(pt => pt && typeof pt.color === 'string' && Number.isFinite(pt.pos))
      )
      .map(p => ({ ...p, id: Number.isFinite(p.id) ? p.id : 0 }))
  } catch { /* 忽略坏值 */ }
  return []
}
const presets = ref(loadPresets())
let presetSeq = presets.value.reduce((m, p) => Math.max(m, p.id || 0), 0)

function persistPresets() {
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(presets.value)) } catch { /* 忽略 */ }
}

function presetName(pts) {
  const sorted = [...pts].sort((a, b) => a.pos - b.pos)
  if (sorted.length === 1) return sorted[0].color.toUpperCase()
  return `${sorted[0].color.toUpperCase()} → ${sorted[sorted.length - 1].color.toUpperCase()}`
}
function savePreset() {
  presets.value.push({ id: ++presetSeq, name: presetName(barPoints.value), pts: barPoints.value.map(p => ({ color: p.color, pos: p.pos })) })
  persistPresets()
  ElMessage.success({ message: '已保存到预设', duration: 1000 })
}
function removePreset(i) {
  presets.value.splice(i, 1)
  persistPresets()
}
function applyPreset(p) {
  barPoints.value = p.pts.map(pt => ({ id: ++ptSeq, color: pt.color, pos: pt.pos }))
  selectedPointIds.value = new Set()
  if (!selection.value.size) {
    ElMessage.warning({ message: '先在右侧选取字符（单击 / 拖动 / Ctrl 多选）', duration: 1800 })
  }
}

/* ================= 清除选中字符的颜色 ================= */
function clearColorOfSelection() {
  if (!selection.value.size) return
  for (const i of selection.value) {
    const st = charStyles.value[i]
    if (!st) continue
    const { ct, cc, ch, ...rest } = st
    charStyles.value[i] = Object.keys(rest).length ? rest : null
  }
  ElMessage.success({ message: '已清除颜色', duration: 1000 })
}

/* ================= 输出生成 ================= */
const isMiniFmt = computed(() => ['mini', 'mini_single', 'easylib'].includes(hexFormat.value))

function hexEmit(hex) {
  const h = hex.replace('#', '').toUpperCase()
  switch (hexFormat.value) {
    case 'amp': return '&#' + h
    case 'x': return '&x' + [...h].map(c => '&' + c).join('')
    case 'sx': return '§x' + [...h].map(c => '§' + c).join('')
    case 'motd': return '\\u00A7x' + [...h].map(c => '\\u00A7' + c).join('')
    case 'cmi': return '{#' + h + '}'
    case 'bbcode': return '[COLOR=#' + h + ']'
    default: return '<#' + h + '>'
  }
}
function legacyEmit(code) {
  if (isMiniFmt.value) return `<${MINI_NAMES[VANILLA_COLORS.findIndex(c => c.code === code)]}>`
  if (hexFormat.value === 'motd') return '\\u00A7' + code
  return symbol.value + code
}
function fmtEmit(st) {
  const parts = []
  const push = (flag, code, miniTag, bbTag) => {
    if (!flag) return
    if (hexFormat.value === 'bbcode') { if (bbTag) parts.push(bbTag) }
    else if (isMiniFmt.value) parts.push(miniTag)
    else if (hexFormat.value === 'motd') parts.push('\\u00A7' + code)
    else parts.push(symbol.value + code)
  }
  push(st.b, 'l', '<bold>', '[b]')
  push(st.i, 'o', '<italic>', '[i]')
  push(st.u, 'n', '<underlined>', '[u]')
  push(st.s, 'm', '<strikethrough>', '[s]')
  push(st.o, 'k', '<obfuscated>', '')
  return parts.join('')
}
function resetEmit() {
  if (isMiniFmt.value) return '<reset>'
  if (hexFormat.value === 'bbcode') return '[/COLOR]'
  if (hexFormat.value === 'motd') return '\\u00A7r'
  return symbol.value + 'r'
}

const output = computed(() => {
  const cs = chars.value
  let out = ''
  let prevSig = '\u0000'
  let i = 0
  while (i < cs.length) {
    if (resets.value.has(i)) {
      out += resetEmit()
      prevSig = '\u0000'
    }
    const st = charStyles.value[i]
    const sig = st
      ? JSON.stringify([st.ct === 'legacy' ? legacyEmit(st.cc) : st.ct === 'hex' ? hexEmit(st.ch) : null, !!st.b, !!st.i, !!st.u, !!st.s, !!st.o])
      : 'none'
    if (sig !== prevSig) {
      out += st
        ? (st.ct === 'legacy' ? legacyEmit(st.cc) : st.ct === 'hex' ? hexEmit(st.ch) : '') + fmtEmit(st)
        : ''
      prevSig = sig
    }
    out += cs[i]
    i++
  }
  if (resets.value.has(cs.length)) out += resetEmit()
  return out
})

/* ================= 预览 ================= */
const previewRuns = computed(() => {
  const runs = []
  const cs = chars.value
  let state = { color: '#FFFFFF', b: false, i: false, u: false, s: false, o: false }
  for (let idx = 0; idx < cs.length; idx++) {
    if (resets.value.has(idx)) state = { color: '#FFFFFF', b: false, i: false, u: false, s: false, o: false }
    const st = charStyles.value[idx]
    if (st) {
      if (st.ct) {
        state = { color: st.ct === 'legacy' ? hexOfLegacy(st.cc) : st.ch, b: !!st.b, i: !!st.i, u: !!st.u, s: !!st.s, o: !!st.o }
      } else {
        state = { ...state, b: st.b ?? state.b, i: st.i ?? state.i, u: st.u ?? state.u, s: st.s ?? state.s, o: st.o ?? state.o }
      }
    }
    const prev = runs[runs.length - 1]
    if (prev && prev.style.color === state.color && prev.style.b === state.b && prev.style.i === state.i && prev.style.u === state.u && prev.style.s === state.s && prev.style.o === state.o) {
      prev.text += cs[idx]
    } else {
      runs.push({ text: cs[idx], style: { ...state } })
    }
  }
  return runs
})
function runStyle(style) {
  return {
    color: style.color,
    fontWeight: '400',
    fontStyle: style.i ? 'italic' : 'normal',
    textDecoration: [style.u ? 'underline' : '', style.s ? 'line-through' : ''].join(' ').trim() || 'none'
  }
}

/* ================= MC 原版粗体：按字符命中字体决定克隆偏移 ================= */
// 预览字体栈 'Mojang', 'UnifontMC' 按字符回退：Mojang 命中（拉丁等）→ 右移 2px；
// Unifont 命中（中文等）→ 右移 1px。用 canvas 测宽探测：Mojang 不含该字符时宽度与纯回退一致
const fontsReady = ref(false)
let probeCtx = null
const boldOffsetCache = new Map()
function mcBoldOffset(ch) {
  if (boldOffsetCache.has(ch)) return boldOffsetCache.get(ch)
  if (!probeCtx) probeCtx = document.createElement('canvas').getContext('2d')
  probeCtx.font = '100px monospace'
  const wFallback = probeCtx.measureText(ch).width
  probeCtx.font = "100px 'Mojang', monospace"
  const wMojang = probeCtx.measureText(ch).width
  const off = Math.abs(wMojang - wFallback) > 0.01 ? 2 : 1
  boldOffsetCache.set(ch, off)
  return off
}
// 粗体字符样式：克隆右移 + 保留本底黑影（含克隆的黑影）
function mcBoldShadow(ch) {
  void fontsReady.value // 字体加载完成后触发重算
  const off = mcBoldOffset(ch)
  return {
    textShadow: `${off}px 0 0 currentColor, 1.5px 1.5px 0 rgba(0, 0, 0, 0.8), ${off + 1.5}px 1.5px 0 rgba(0, 0, 0, 0.8)`
  }
}

/* ================= 乱码动效 ================= */
const OBF_CHARS = '!@#$%^&*()<>/\\|?~abcdefgxyz'
const tick = ref(0)
let obfTimer = null
// 只有真的存在乱码字符时才跑定时器：否则页面会每 130ms 无意义地重渲染整个预览
const hasObf = computed(() => previewRuns.value.some(r => r.style.o))
function startObf() {
  if (obfTimer == null) obfTimer = setInterval(() => (tick.value = (tick.value + 1) % 1000), 130)
}
function stopObf() {
  if (obfTimer != null) { clearInterval(obfTimer); obfTimer = null }
}
watch(hasObf, on => (on ? startObf() : stopObf()), { immediate: true })
onMounted(() => {
  // MC 字体就绪后清缓存重算，避免字体未加载时探测出错误的粗体偏移
  Promise.all([
    document.fonts.load("22px 'Mojang'", 'A'),
    document.fonts.load("22px 'UnifontMC'", '测')
  ]).catch(() => {}).finally(() => {
    boldOffsetCache.clear()
    fontsReady.value = true
  })
})
onUnmounted(() => stopObf())
function obfuscate(text) {
  void tick.value
  return text.split('').map(() => OBF_CHARS[Math.floor(Math.random() * OBF_CHARS.length)]).join('')
}

/* ================= 复制 ================= */
async function copyText(content) {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success({ message: '已复制到剪贴板', duration: 1200 })
  } catch {
    const ta = document.createElement('textarea')
    ta.value = content
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    ElMessage.success({ message: '已复制到剪贴板', duration: 1200 })
  }
}

/* ================= 模式切换 + 导入已有颜色代码 ================= */
/* visual：可视化编辑（原来的交互）
   import：把已经写好颜色代码的文字粘进来，解析成「纯文本 + 每字符样式 + 重置标记」
   —— 解析结果与编辑器内部结构完全一致，所以解析完可以继续点选/上色，
      并且会用当前选择的输出格式重新生成（等于顺带做了格式转换）。 */
const editMode = ref('visual') // visual | import
/* 切面切换方向：点右侧按钮 → 新面板从右滑入、旧的向左滑出（反方向同理） */
const paneDir = ref('right') // right | left
function switchMode(m) {
  if (m === editMode.value) return
  paneDir.value = m === 'import' ? 'right' : 'left'
  editMode.value = m
}

/* ---- 模式切换按钮的滑动指示块 ----
   两个按钮文字长度不同（4 字 / 6 字），宽度并不相等，
   所以不用纯 CSS 的 50% 推算，而是量取选中按钮真实的 offsetWidth/offsetLeft 写进内联样式，保证滑块严丝合缝。 */
const emsBtnA = ref(null)
const emsBtnB = ref(null)
const EMS_PAD = 4 // 与 .edit-mode-switch 的 padding 一致
const emsSliderStyle = ref({})
function syncEmsSlider() {
  const btn = editMode.value === 'import' ? emsBtnB.value : emsBtnA.value
  if (!btn) return
  emsSliderStyle.value = {
    width: btn.offsetWidth + 'px',
    transform: `translateX(${btn.offsetLeft - EMS_PAD}px)`
  }
}
watch(editMode, () => nextTick(syncEmsSlider))
const importRaw = ref('')
const IMPORT_DEMO = '&6&l公告 &r&7» &e今天 &a20:00 &e开服 &#FF7BD5新地图上线 <#55FFFF>欢迎来玩'

// MC 效果码映射：l/o/n/m/k = 粗体/斜体/下划线/删除线/乱码
// ⚠️ MC 的 'o' 是斜体，而内部标记里 'i' 才是斜体、'o' 是乱码，必须走映射表不能直接用
const MC_FLAG = { l: 'b', o: 'i', n: 'u', m: 's', k: 'o' }
const MINI_FLAG = { bold: 'b', italic: 'i', underlined: 'u', strikethrough: 's', obfuscated: 'o' }
const MINI_COLOR = Object.fromEntries(MINI_NAMES.map((n, i) => [n, VANILLA_COLORS[i].code]))
MINI_COLOR.grey = MINI_COLOR.gray
MINI_COLOR.dark_grey = MINI_COLOR.dark_gray
const LEGACY_CODE_SET = new Set(VANILLA_COLORS.map(c => c.code))
// 查表统一走 hasOwnProperty：避免 <constructor> 这类标签命中 Object 原型上的属性
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const RE_HEX6 = /^[0-9a-fA-F]{6}$/
const RE_BB = /^\[\/?(COLOR|B|BOLD|I|ITALIC|U|UNDERLINE|S|STRIKE|STRIKETHROUGH)(?:=#([0-9a-fA-F]{6}))?\]/i
const RE_X_FORM = /^[&§]x((?:[&§][0-9a-fA-F]){6})/
const RE_GRAD = /^<(g|gradient):([^>]+)>/i

// 渐变插值：<g:#A:#B:#C> 的停靠点是等距的
function gradColorAt(colors, t) {
  if (!colors.length) return '#FFFFFF'
  if (colors.length === 1) return colors[0].toUpperCase()
  const seg = Math.min(Math.max(t, 0), 1) * (colors.length - 1)
  const i = Math.min(Math.floor(seg), colors.length - 2)
  return lerpColor(colors[i], colors[i + 1], seg - i).toUpperCase()
}

function parseMcCodes(raw) {
  const src = String(raw).replace(/\\u00A7/g, '§') // MOTD 格式里的字面量 \u00A7
  const text = []
  const styles = []
  const resets = new Set()

  const newCtx = () => ({ color: null, b: false, i: false, u: false, s: false, o: false })
  // 把当前上下文快照成内部样式对象（无任何样式时返回 null）
  const snap = c => {
    const st = {}
    if (c.color) {
      st.ct = c.color.ct
      if (c.color.ct === 'legacy') st.cc = c.color.cc
      else st.ch = c.color.ch
    }
    for (const k of ['b', 'i', 'u', 's', 'o']) if (c[k]) st[k] = true
    return Object.keys(st).length ? st : null
  }
  const put = (ch, c) => { text.push(ch); styles.push(snap(c)) }

  function walk(str, ctx) {
    let i = 0
    while (i < str.length) {
      const ch = str[i]

      /* ---- & / § 前缀 ---- */
      if (ch === '&' || ch === '§') {
        const next = str[i + 1] || ''
        // &x&R&R&G&G&B&B（以及 §x…、\u00A7x…）
        if (next === 'x' || next === 'X') {
          const m = RE_X_FORM.exec(str.slice(i))
          if (m) {
            ctx.color = { ct: 'hex', ch: '#' + m[1].replace(/[&§]/g, '').toUpperCase() }
            i += m[0].length
            continue
          }
        }
        // &#RRGGBB
        if (next === '#') {
          const h = str.slice(i + 2, i + 8)
          if (RE_HEX6.test(h)) { ctx.color = { ct: 'hex', ch: '#' + h.toUpperCase() }; i += 8; continue }
        }
        const lc = next.toLowerCase()
        if (lc === 'r') { resets.add(text.length); Object.assign(ctx, newCtx()); i += 2; continue }
        if (MC_FLAG[lc]) { ctx[MC_FLAG[lc]] = true; i += 2; continue }
        if (LEGACY_CODE_SET.has(lc)) { Object.assign(ctx, newCtx(), { color: { ct: 'legacy', cc: lc } }); i += 2; continue }
        put(ch, ctx); i++; continue // 不是有效代码 → 当普通字符
      }

      /* ---- {#RRGGBB}（CMI） ---- */
      if (ch === '{') {
        const m = /^\{#([0-9a-fA-F]{6})\}/.exec(str.slice(i))
        if (m) { ctx.color = { ct: 'hex', ch: '#' + m[1].toUpperCase() }; i += m[0].length; continue }
      }

      /* ---- [COLOR=#RRGGBB] / [/COLOR] / [B] …（BBCode） ---- */
      if (ch === '[') {
        const m = RE_BB.exec(str.slice(i))
        if (m) {
          const tag = m[1].toUpperCase()
          const closing = str.slice(i, i + 2) === '[/'
          if (tag === 'COLOR') ctx.color = closing ? null : (m[2] ? { ct: 'hex', ch: '#' + m[2].toUpperCase() } : null)
          else {
            const key = { B: 'b', BOLD: 'b', I: 'i', ITALIC: 'i', U: 'u', UNDERLINE: 'u', S: 's', STRIKE: 's', STRIKETHROUGH: 's' }[tag]
            if (key) ctx[key] = !closing
          }
          i += m[0].length
          continue
        }
      }

      /* ---- < … >（MiniMessage / RoseGarden） ---- */
      if (ch === '<') {
        const rest = str.slice(i)
        // 渐变 <g:#A:#B> … </g> / <gradient:#A:#B> … </gradient>
        const gm = RE_GRAD.exec(rest)
        if (gm) {
          const tag = gm[1].toLowerCase()
          // 只保留 #RRGGBB，丢掉 phase 之类的附加参数
          const cols = gm[2].split(':').map(s => s.trim()).filter(s => /^#[0-9a-fA-F]{6}$/.test(s))
          const after = rest.slice(gm[0].length)
          const cm = new RegExp('</' + tag + '>', 'i').exec(after)
          const inner = cm ? after.slice(0, cm.index) : after
          const start = text.length
          walk(inner, { ...ctx, color: null }) // 内部颜色由渐变覆盖，保留内部效果标记
          const span = text.length - start
          for (let k = 0; k < span; k++) {
            const st = { ...(styles[start + k] || {}) }
            delete st.cc // 内部若写过旧版颜色码，会被渐变覆盖，清掉避免残留
            st.ct = 'hex'
            st.ch = gradColorAt(cols, span > 1 ? k / (span - 1) : 0)
            styles[start + k] = st
          }
          const prevColor = ctx.color
          // 有闭合标签 → 颜色回退到渐变之前；没闭合 → 末尾色继续沿用
          if (cm) ctx.color = prevColor
          else if (cols.length) ctx.color = { ct: 'hex', ch: cols[cols.length - 1].toUpperCase() }
          i += gm[0].length + inner.length + (cm ? cm[0].length : 0)
          continue
        }
        // 闭合标签 </bold> / </red> / </#RRGGBB>
        const cm2 = /^<\/(#[0-9a-fA-F]{6}|[a-z_]+)>/i.exec(rest)
        if (cm2) {
          const nm = cm2[1].toLowerCase()
          if (has(MINI_FLAG, nm)) ctx[MINI_FLAG[nm]] = false
          else if (has(MINI_COLOR, nm) || nm.startsWith('#')) ctx.color = null // 颜色回退到无
          i += cm2[0].length
          continue
        }
        // 单标签 <#RRGGBB> / <bold> / <red> / <reset>
        const tm = /^<(#[0-9a-fA-F]{6}|[a-zA-Z_][a-zA-Z0-9_]*)>/.exec(rest)
        if (tm) {
          const name = tm[1].toLowerCase()
          if (/^#[0-9a-fA-F]{6}$/.test(name)) { ctx.color = { ct: 'hex', ch: name.toUpperCase() }; i += tm[0].length; continue }
          if (name === 'reset') { resets.add(text.length); Object.assign(ctx, newCtx()); i += tm[0].length; continue }
          // MiniMessage 的命名色只换颜色，不清效果标记（<red><bold> 顺序无关）
          if (has(MINI_COLOR, name)) { ctx.color = { ct: 'legacy', cc: MINI_COLOR[name] }; i += tm[0].length; continue }
          if (has(MINI_FLAG, name)) { ctx[MINI_FLAG[name]] = true; i += tm[0].length; continue }
          // 不是认识的标签 → 当普通字符（例如 "3<5" 这种）
        }
      }

      put(ch, ctx)
      i++
    }
  }

  walk(src, newCtx())
  return { text: text.join(''), styles, resets }
}

// 把解析结果灌进编辑器。文本整体替换会让 diff watcher 去平移旧样式，这里要跳过
function applyParsed(p) {
  if (p.text !== text.value) {
    suppressTextWatch = true
    text.value = p.text
  }
  charStyles.value = p.styles
  resets.value = new Set(p.resets)
  selection.value = new Set()
  insertPos.value = null
}

function fillImportDemo() {
  importRaw.value = IMPORT_DEMO
}

function doImport() {
  const raw = importRaw.value
  if (!raw.trim()) {
    ElMessage.warning({ message: '先粘贴要解析的颜色代码', duration: 1800 })
    return
  }
  let parsed
  try {
    parsed = parseMcCodes(raw)
  } catch (e) {
    ElMessage.error({ message: `解析失败：${e.message}`, duration: 2400 })
    return
  }
  const n = [...parsed.text].length
  if (!n) {
    ElMessage.warning({ message: '没有解析出可编辑的字符', duration: 1800 })
    return
  }
  const styled = parsed.styles.filter(s => s && (s.ct || s.b || s.i || s.u || s.s || s.o)).length
  applyParsed(parsed)
  switchMode('visual') // 解析完直接进入可视化编辑，继续改（带左滑动画）
  ElMessage.success({
    message: styled
      ? `已解析 ${n} 个字符（${styled} 个带样式），输出会按当前格式重新生成`
      : `已载入 ${n} 个字符，但没识别到颜色代码`,
    duration: 2600
  })
}
</script>

<template>
  <div class="page-container">
    <div class="tool-header">
      <h1><el-icon class="h-icon"><MagicStick /></el-icon> 颜色代码生成</h1>
      <p>
        选中字符 → 点颜色立即上色 → 复制代码，就是这么简单
      </p>
      <!-- 模式切换 -->
      <div class="edit-mode-switch" :class="{ right: editMode === 'import' }">
        <span class="ems-slider" :style="emsSliderStyle" aria-hidden="true"></span>
        <button
          ref="emsBtnA"
          type="button"
          :class="{ on: editMode === 'visual' }"
          @click="switchMode('visual')"
        >
          <el-icon><EditPen /></el-icon> 可视化编辑
        </button>
        <button
          ref="emsBtnB"
          type="button"
          :class="{ on: editMode === 'import' }"
          @click="switchMode('import')"
        >
          <el-icon><Upload /></el-icon> 粘贴代码解析
        </button>
      </div>
    </div>

    <!-- 切面切换动画：方向跟随按钮滑动 -->
    <Transition :name="'pane-' + paneDir" mode="out-in">
    <!-- ==================== 模式二：粘贴已有代码 ==================== -->
    <div v-if="editMode === 'import'" key="import" class="import-wrap">
      <div class="card panel-card">
        <div class="panel-head">
          <span class="card-title">粘贴已有颜色代码</span>
          <span class="chip">{{ [...importRaw].length }} 字符</span>
        </div>

        <div class="tip-line">
          自动识别格式：<b>&amp; / §</b> 单字符代码 ·
          <b>&amp;#RRGGBB</b> · <b>&amp;x&amp;R&amp;R…</b> · <b>\u00A7x…</b> ·
          <b>&lt;#RRGGBB&gt;</b> · <b>&lt;g:#A:#B&gt;</b> · <b>{#RRGGBB}</b> ·
          <b>[COLOR=#RRGGBB]</b> · <b>MiniMessage</b>
        </div>

        <textarea
          v-model="importRaw"
          class="import-area"
          spellcheck="false"
          placeholder="把带颜色代码的文字粘在这里…&#10;例如：&6&l公告 &r&7» &e今天 &a20:00 开服"
        />

        <div class="import-actions">
          <el-button type="primary" round @click="doImport">
            <el-icon style="margin-right: 4px"><MagicStick /></el-icon> 解析并编辑
          </el-button>
          <el-button round @click="fillImportDemo">示例</el-button>
          <el-button round :disabled="!importRaw" @click="importRaw = ''">清空</el-button>
          <span class="import-note">解析后会自动回到可视化编辑，可继续改并换格式重新生成</span>
        </div>
      </div>
    </div>

    <!-- ==================== 模式一：可视化编辑 ==================== -->
    <div v-else key="visual" class="mc-layout">
      <!-- ==================== 左：颜色 ==================== -->
      <div class="left-col">
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">颜色</span>
            <span class="chip">{{ selection.size ? `已选 ${selection.size} 个字符` : '未选择' }}</span>
          </div>

          <div class="mode-tabs">
            <button :class="{ active: colorMode === 'legacy' }" @click="colorMode = 'legacy'">旧版 16 色</button>
            <button :class="{ active: colorMode === 'custom' }" @click="colorMode = 'custom'">自定义颜色</button>
          </div>

          <!-- 旧版 16 色 -->
          <template v-if="colorMode === 'legacy'">
            <div class="tip-line">选中字符后，<b>点击色块立即上色</b></div>
            <div class="sw-circle-grid">
              <button
                v-for="c in VANILLA_COLORS"
                :key="c.code"
                class="sw-c"
                :style="{ background: c.hex }"
                :title="`${c.name}（${symbol}${c.code}）`"
                @click="applyLegacyColor(c)"
              >
                <span class="sw-c-code" :style="{ color: textOn(c.hex) }">{{ c.code }}</span>
              </button>
            </div>
          </template>

          <!-- 自定义颜色（单色 + 渐变，编辑条一体） -->
          <template v-else>
            <div class="group-label">输出格式</div>
            <div ref="fmtSelectRef" class="fmt-select" :class="{ open: fmtOpen }">
              <button class="fmt-btn" type="button" @click="fmtOpen = !fmtOpen">
                <span class="fmt-cur">{{ HEX_FORMATS.find(f => f.id === hexFormat)?.label }}</span>
                <el-icon class="fmt-arrow" :class="{ up: fmtOpen }"><ArrowDown /></el-icon>
              </button>
              <Transition name="fmt">
                <div v-if="fmtOpen" class="fmt-list">
                  <button
                    v-for="f in HEX_FORMATS"
                    :key="f.id"
                    class="fmt-opt"
                    :class="{ on: hexFormat === f.id }"
                    type="button"
                    @click="hexFormat = f.id; fmtOpen = false"
                  >
                    <span class="fmt-dot" />
                    {{ f.label }}
                  </button>
                </div>
              </Transition>
            </div>

            <div class="tip-line">
              <b>点击条子空白处</b>创建颜色点 · <b>点击颜色点</b>选中编辑 · <b>再次单击</b>取消选中 · <b>按住拖动</b>调整位置（移出条子也能继续拖） · <b>Ctrl+点击</b>多选
            </div>

            <!-- 渐变编辑条 -->
            <div
              ref="trackRef"
              class="grad-track"
              @mousedown="onTrackDown"
            >
              <div class="grad-track-bg" :style="{ background: barCss }" />
              <div
                v-for="p in barPoints"
                :key="p.id"
                class="grad-pt"
                :class="{ sel: selectedPointIds.has(p.id) }"
                :style="{ left: p.pos + '%', background: p.color }"
                :title="`${p.color.toUpperCase()} · ${p.pos}%`"
                @pointerdown.stop="onPointDown(p, $event)"
              />
            </div>
            <div class="grad-scale"><span>0%</span><span>50%</span><span>100%</span></div>

            <!-- 选中颜色点编辑器（单选时） -->
            <div v-if="selectedPoint" class="pt-editor">
              <ReactiveColorPicker
                :model-value="selectedPoint.color"
                @update:model-value="v => { if (v) selectedPoint.color = v }"
              />
              <code class="hex-big">{{ selectedPoint.color.toUpperCase() }}</code>
              <div class="pt-pos">
                <span class="pt-pos-label">位置</span>
                <el-slider v-model="selectedPoint.pos" :min="0" :max="100" style="width: 110px" />
                <span class="pos-num">{{ selectedPoint.pos }}%</span>
              </div>
              <el-button size="small" type="danger" plain @click="deleteSelectedPoint">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <!-- 多选状态栏：统一颜色 / 整组拖动 / 批量删除 -->
            <div v-else-if="selectedPointIds.size > 1" class="pt-editor">
              <ReactiveColorPicker
                :model-value="selectedPoints[0]?.color"
                @update:model-value="v => { if (v) selectedPoints.forEach(p => (p.color = v)) }"
              />
              <span class="pt-multi-label">已选 {{ selectedPointIds.size }} 个颜色点 · 统一颜色 · 拖动整组平移 · Del 删除</span>
              <el-button size="small" type="danger" plain @click="deleteSelectedPoint">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <div class="group-label">快速模板</div>
            <div class="gp-grid">
              <button v-for="gp in GRAD_PRESETS" :key="gp.name" class="gp-chip" @click="applyGradPreset(gp)">
                <span class="gp-bar" :style="{ background: `linear-gradient(90deg, ${gp.colors.join(', ')})` }" />
                <span class="gp-name">{{ gp.name }}</span>
              </button>
            </div>
          </template>
        </div>

        <!-- 渐变预设暂存 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">我的预设</span>
            <el-button size="small" text type="primary" @click="savePreset">
              <el-icon style="margin-right: 4px"><Star /></el-icon> 存为预设
            </el-button>
          </div>
          <div v-if="presets.length" class="preset-list">
            <span v-for="(p, i) in presets" :key="p.id" class="preset-chip" :title="p.name" @click="applyPreset(p)">
              <span
                class="preset-bar"
                :style="{
                  background: p.pts.length > 1
                    ? `linear-gradient(90deg, ${[...p.pts].sort((a, b) => a.pos - b.pos).map(x => `${x.color} ${x.pos}%`).join(', ')})`
                    : p.pts[0].color
                }"
              />
              <span class="preset-name">{{ p.name }}</span>
              <i class="point-x" title="删除预设" @click.stop="removePreset(i)">×</i>
            </span>
          </div>
          <div v-else class="preset-empty">暂无预设 · 在渐变条上搭配好颜色后保存，会一直保留</div>
        </div>
      </div>

      <!-- ==================== 右：工作区 ==================== -->
      <div class="right-col">
        <!-- 输入 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">输入文字</span>
            <span class="chip">{{ chars.length }} 个字符</span>
          </div>
          <input v-model="text" class="text-input" placeholder="输入文字…" spellcheck="false" />
        </div>

        <!-- 选取 + 快捷工具栏 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">选取字符</span>
            <div class="panel-head-right">
              <button
                class="qb-btn select-all-btn"
                :class="{ on: allCharsSelected }"
                :title="allCharsSelected ? '取消全选' : '选中全部字符'"
                @click="toggleSelectAll"
              >全选</button>
              <button
                class="qb-btn multi-mode-btn"
                :class="{ on: multiMode }"
                :title="multiMode ? '关闭多选：恢复单击单选 / 拖动框选' : '开启多选：逐个点选，可累加'"
                @click="toggleMultiMode"
              >多选</button>
              <span class="chip hint-chip">{{
                multiMode
                  ? '点一下选中，再点取消（可累加）'
                  : isTouch
                    ? '点一下选中 · 再点一下取消'
                    : '单击 · 拖动框选 · Ctrl 多选 · 点间隙插入'
              }}</span>
            </div>
          </div>
          <div class="select-area" @mouseup="endDrag" @mouseleave="endDrag" @mousedown.self="clearSelectionOnBg">
            <template v-if="chars.length">
              <template v-for="(ch, i) in chars" :key="i">
                <span
                  class="gap"
                  :class="{ active: insertPos === i }"
                  :title="`在第 ${i + 1} 个字符前插入`"
                  @click="clickGap(i)"
                >
                  <span
                    v-if="resets.has(i)"
                    class="reset-badge"
                    title="重置标记（点击移除）"
                    @click.stop="toggleResetAt(i)"
                  >R</span>
                </span>
                <span
                  class="char"
                  :class="{ selected: selection.has(i), 'fx-b': charStyles[i]?.b, 'fx-o': charStyles[i]?.o }"
                  :data-ch="ch"
                  :data-i="i"
                  :style="charCss(i)"
                  @mousedown.prevent="startDrag(i, $event)"
                  @mouseenter="extendDrag(i)"
                  @touchstart="onCharTouchStart(i, $event)"
                ><i v-if="charStyles[i]?.b" class="fx-b-wrap" aria-hidden="true"><i class="fx-b-ring" :data-ch="ch" /><i class="fx-b-cut" :data-ch="ch" /></i>{{ ch }}</span>
              </template>
              <span class="gap" :class="{ active: insertPos === chars.length }" title="在末尾插入" @click="clickGap(chars.length)">
                <span
                  v-if="resets.has(chars.length)"
                  class="reset-badge"
                  title="重置标记（点击移除）"
                  @click.stop="toggleResetAt(chars.length)"
                >R</span>
              </span>
            </template>
            <span v-else class="preview-placeholder">先在上方输入文字</span>
          </div>

          <!-- 触屏引导：桌面版提示在窄屏会被隐藏，这里单独给触屏设备一条常驻说明 -->
          <p v-if="chars.length" class="touch-tip">
            {{ multiMode
              ? '多选模式：点一下选中 · 再点一下取消（可累加）'
              : '点一下选中该字符 · 再点一下取消' }}
          </p>

          <!-- 快捷工具栏：选中 → 效果栏；点间隙 → 插入栏。
               两栏高度一致，切换时旧栏悬浮原地淡出（不塌陷占位）→ 卡片高度不变、不跳动 -->
          <Transition :name="barAnim">
            <!-- 选中时：效果快捷工具栏 -->
            <div v-if="selection.size" key="effects" class="quick-bar">
              <span class="qb-label">效果</span>
              <button
                v-for="ef in EFFECTS"
                :key="ef.key"
                class="qb-btn"
                :class="{ on: effectState(ef.key) }"
                :style="ef.css"
                :data-tip="ef.tip"
                @click="toggleEffect(ef.key)"
              >{{ ef.label }}</button>
              <span class="qb-sep" style="margin-left: 4px" />
              <button class="qb-btn qb-clear" title="清除选中字符的颜色（保留字体效果）" @click="clearColorOfSelection">
                <el-icon><Brush /></el-icon> 清色
              </button>
              <template v-if="multiMode">
                <span class="qb-sep" style="margin-left: 4px" />
                <button class="qb-btn" title="选中所有未选中的字符" @click="invertSelection">反选</button>
                <button class="qb-btn" title="取消全部选中" @click="clearSelection">清空</button>
              </template>
              <span class="qb-sep" style="margin-left: 4px" />
              <span class="qb-label">替换</span>
              <input
                v-model="replaceInput"
                class="qb-replace-input"
                placeholder="输入新字符，实时替换"
                spellcheck="false"
              />
              <template v-if="singleSelIndex !== null">
                <span class="qb-sep" style="margin-left: 4px" />
                <ReactiveColorPicker
                size="small"
                :model-value="singleColor"
                @update:model-value="v => { if (v) singleColor = v }"
                />
                <code class="qb-single-hex">{{ singleColor.toUpperCase() }}</code>
              </template>
            </div>

            <!-- 插入点：重置工具栏 -->
            <div v-else-if="insertPos !== null" key="insert" class="quick-bar insert-bar">
              <span class="qb-label">插入点 · {{ insertPos === chars.length ? '末尾' : `第 ${insertPos + 1} 个字符前` }}</span>
              <button
                class="qb-btn"
                :class="{ on: insertPosHasReset }"
                :data-tip="`重置代码 ${symbol}r —— 在此插入点清除之前的颜色与效果`"
                @click="toggleResetAtInsertPos"
              >重置</button>
              <button class="qb-btn" @click="insertPos = null">取消</button>
            </div>
          </Transition>
        </div>

        <!-- 预览 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">MC 聊天框预览</span>
            <div class="preview-tools">
              <ReactiveColorPicker
                size="small"
                :model-value="previewBg"
                @update:model-value="v => { if (v) previewBg = v }"
              />
              <button
                class="qb-btn bg-reset-btn"
                :class="{ ghost: previewBg === DEFAULT_PREVIEW_BG }"
                :tabindex="previewBg === DEFAULT_PREVIEW_BG ? -1 : 0"
                :title="previewBg === DEFAULT_PREVIEW_BG ? '' : '恢复默认背景'"
                :disabled="previewBg === DEFAULT_PREVIEW_BG"
                @click="previewBg = DEFAULT_PREVIEW_BG"
              >恢复</button>
              <span class="chip">乱码实时演示</span>
            </div>
          </div>
          <div class="chat-preview" :style="{ background: previewBg }">
            <div class="chat-line">
              <span class="chat-prefix">&lt;Steve&gt;</span>
              <span v-if="chars.length">
                <template v-for="(run, i) in previewRuns" :key="i">
                  <!-- 粗体：逐字符按命中字体克隆右移（Mojang 2px / Unifont 1px），复刻 MC 原版渲染 -->
                  <span v-if="run.style.b" :style="runStyle(run.style)"><span
                      v-for="(ch, j) in run.text"
                      :key="j"
                      :style="mcBoldShadow(ch)"
                    >{{ run.style.o ? obfuscate(ch) : ch }}</span></span>
                  <span
                    v-else
                    :style="runStyle(run.style)"
                    :class="{ obf: run.style.o }"
                  >{{ run.style.o ? obfuscate(run.text) : run.text }}</span>
                </template>
              </span>
              <span v-else class="preview-placeholder">…</span>
            </div>
          </div>
        </div>

        <!-- 输出 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">输出代码</span>
            <div class="out-tools">
              <span class="chip">格式代码</span>
              <div class="sym-toggle" title="颜色 / 效果 / 重置代码使用的符号">
                <button :class="{ on: symbol === '§' }" @click="symbol = '§'">§</button>
                <button :class="{ on: symbol === '&' }" @click="symbol = '&'">&amp;</button>
              </div>
              <el-button type="primary" size="small" round @click="copyText(output)">
                <el-icon style="margin-right: 4px"><DocumentCopy /></el-icon> 复制
              </el-button>
            </div>
          </div>
          <pre class="code-output">{{ output || ' ' }}</pre>
        </div>
      </div>
    </div>
    </Transition>
  </div>
</template>

<style scoped>
.tool-header {
  margin-bottom: 16px;
}
.tool-header h1 {
  font-size: 26px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}
.h-icon {
  color: var(--primary);
}
.tool-header p {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

/* ========== 模式切换（标题下方）：毛玻璃底 + 滑块左右滑动 ========== */
.edit-mode-switch {
  position: relative;
  display: inline-flex;
  gap: 4px;
  margin-top: 12px;
  padding: 4px;
  border-radius: 12px;
  /* 底色必须半透明，backdrop-filter 才有「磨砂」观感（透出身后的背景图 / 卡片） */
  background: color-mix(in srgb, var(--card-bg) 62%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-border) 80%, transparent);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  backdrop-filter: blur(12px) saturate(140%);
}
/* 滑动指示块：宽/位移由 JS 量取按钮实际尺寸后写入内联样式（两个按钮文字长短不同、宽度不等） */
.ems-slider {
  position: absolute;
  z-index: 0;
  top: 4px;
  left: 4px;
  bottom: 4px;
  width: calc(50% - 6px); /* 首帧兜底，挂载后会被内联宽度覆盖 */
  border-radius: 9px;
  background: var(--primary);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--primary) 40%, transparent);
  transition: transform 0.34s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.34s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
.edit-mode-switch button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 8px 15px;
  border-radius: 9px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.22s ease;
}
.edit-mode-switch button:hover {
  color: var(--primary);
}
/* 选中态：文字压在滑块上，按钮自身不再画背景（背景交给滑块） */
.edit-mode-switch button.on {
  color: #fff;
  font-weight: 600;
}
.edit-mode-switch button.on:hover {
  color: #fff;
}

/* ========== 切面切换动画：方向跟随按钮左右滑动 ========== */
.pane-right-enter-active,
.pane-left-enter-active {
  transition: opacity 0.28s ease, transform 0.36s cubic-bezier(0.4, 0, 0.2, 1);
}
.pane-right-leave-active,
.pane-left-leave-active {
  transition: opacity 0.16s ease, transform 0.2s ease;
}
.pane-right-enter-from { opacity: 0; transform: translateX(26px); }
.pane-right-leave-to { opacity: 0; transform: translateX(-26px); }
.pane-left-enter-from { opacity: 0; transform: translateX(-26px); }
.pane-left-leave-to { opacity: 0; transform: translateX(26px); }

/* ========== 模式二：粘贴代码解析 ========== */
/* 宽度对齐可视化编辑的两栏总宽（左栏 + 中间缝隙 + 右栏）——
   两栏布局是撑满内容的 grid，所以这里同样不设 max-width，直接占满即可 */
.import-wrap {
  width: 100%;
  max-width: 100%;
}
.import-area {
  display: block;
  width: 100%;
  min-height: 170px;
  box-sizing: border-box;
  resize: vertical;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  color: var(--text);
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13.5px;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.import-area:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
}
.import-area::placeholder {
  color: var(--text-muted);
}
.import-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.import-actions :deep(.el-button + .el-button) {
  margin-left: 0; /* 用 gap 控制间距，否则换行后左侧会多出一段空白 */
}
.import-note {
  flex: 1 1 180px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.mc-layout {
  display: grid;
  /* minmax(0, …) 而非 2fr/3fr：grid item 默认 min-width:auto，内容一宽就会撑破整行 */
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 16px;
  align-items: start;
}
.left-col,
.right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.panel-card {
  padding: 18px 20px;
  position: relative; /* 两栏切换时，离场栏绝对定位悬浮的锚点 */
  min-width: 0;
  max-width: 100%;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.card-title::before {
  content: '';
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 55%, transparent));
}
.group-label {
  font-size: 12px;
  color: var(--text-muted);
  margin: 14px 0 8px;
}
.tip-line {
  font-size: 12.5px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border: 1px dashed color-mix(in srgb, var(--primary) 40%, transparent);
  padding: 7px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.tip-line b {
  color: var(--primary);
}

/* ========== MC 风格悬浮提示（深底紫边框，跟随主题色） ========== */
.qb-btn[data-tip] {
  position: relative;
}
.qb-btn[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  padding: 7px 11px;
  border-radius: 4px;
  background: #100010f0;
  border: 2px solid color-mix(in srgb, var(--primary) 75%, #25015a);
  color: #fff;
  font-size: 12px;
  font-family: 'Mojang', 'UnifontMC', sans-serif;
  line-height: 1.5;
  white-space: nowrap;
  pointer-events: none;
  z-index: 30;
  animation: tip-in 0.15s ease;
}
@keyframes tip-in {
  from { opacity: 0; transform: translateX(-50%) translateY(3px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ========== 选取字符的效果标记 ========== */
.char.fx-b,
.char.fx-o {
  position: relative;
}

/* 粗体：真正的平行描边（描边与字符之间有均匀缝隙）
   原理：ring 层画粗描边 → cut 层用 destination-out 抠掉贴字部分 → 剩下间距均匀的描边环 */
.char.fx-b {
  isolation: isolate; /* 独立层叠上下文：z-index:-1 只沉到本字符内，不掉到卡片背景后面 */
  --fgap: 1.5px;  /* 描边与字符之间的缝隙 */
  --fline: 1.1px; /* 描边线宽 */
}
.fx-b-wrap {
  position: absolute;
  inset: 0;
  z-index: -1; /* 在 .char 背景之上、正文文字之下 */
  isolation: isolate; /* 把 destination-out 抠空限制在本层内，不误伤卡片背景 */
  pointer-events: none;
  font-style: normal;
}
.fx-b-ring,
.fx-b-cut {
  position: absolute;
  inset: 0;
  font-style: normal;
  pointer-events: none;
}
.fx-b-ring::before,
.fx-b-cut::before {
  content: attr(data-ch); /* 字符由各层自身的 data-ch 提供 */
  position: absolute;
  inset: 0;
  padding: 2px 1px; /* 与 .char 相同 padding，保证克隆与原字对齐 */
}
.fx-b-ring::before {
  -webkit-text-stroke: calc((var(--fgap) + var(--fline)) * 2) var(--fx, #ffffff);
  color: transparent;
}
.fx-b-cut::before {
  -webkit-text-stroke: calc(var(--fgap) * 2) #000;
  color: #000;
}
.fx-b-cut {
  mix-blend-mode: destination-out; /* 抠掉粗描边贴字的部分，形成缝隙 */
}

/* 错误/干扰故障：撕裂感 —— 主体错切抖动 + RGB 通道跳裂 + 撕裂切片随机错位跳切 */
/* 1) 主体本身轻微错切，像信号不稳 */
.char.fx-o {
  animation: fx-o-shake 0.45s steps(1) infinite;
}
@keyframes fx-o-shake {
  0%   { transform: translate(0.5px, 0) skewX(0deg); }
  20%  { transform: translate(-1.5px, 0.5px) skewX(4deg); }
  40%  { transform: translate(1px, -0.5px) skewX(-3deg); }
  60%  { transform: translate(-0.5px, 0.5px) skewX(2deg); }
  80%  { transform: translate(1.5px, -0.5px) skewX(-4deg); }
  100% { transform: translate(0.5px, 0) skewX(0deg); }
}
/* 2) RGB 通道分裂：青红两层距离不断跳变，撕裂抖动感 */
.char.fx-o::before {
  content: attr(data-ch);
  position: absolute;
  inset: 0;
  padding: 2px 1px; /* 与 .char 相同 padding，保证克隆与原字对齐 */
  color: transparent;
  animation: fx-o-split 0.55s steps(1) infinite;
  pointer-events: none;
  z-index: 2;
}
@keyframes fx-o-split {
  0%   { text-shadow: -3px 0 0 rgba(0, 255, 255, 0.85), 3px 0 0 rgba(255, 40, 80, 0.85); }
  25%  { text-shadow: -5px 1px 0 rgba(0, 255, 255, 0.75), 5px -1px 0 rgba(255, 40, 80, 0.75); }
  50%  { text-shadow: -2px -1px 0 rgba(0, 255, 255, 0.9), 2px 1px 0 rgba(255, 40, 80, 0.9); }
  75%  { text-shadow: -6px 0 0 rgba(0, 255, 255, 0.7), 6px 0 0 rgba(255, 40, 80, 0.7); }
  100% { text-shadow: -3px 0 0 rgba(0, 255, 255, 0.85), 3px 0 0 rgba(255, 40, 80, 0.85); }
}
/* 3) 撕裂切片：红色残影条带在不同高度、不同错位间跳切，中间夹消失帧造成闪烁撕裂 */
.char.fx-o::after {
  content: attr(data-ch);
  position: absolute;
  inset: 0;
  padding: 2px 1px;
  color: rgba(255, 40, 80, 0.8);
  animation: fx-o-tear 0.65s steps(1) infinite;
  pointer-events: none;
  z-index: 3;
}
@keyframes fx-o-tear {
  0%   { clip-path: inset(10% 0 72% 0); transform: translate(-5px, 1px); }
  15%  { clip-path: inset(52% 0 34% 0); transform: translate(6px, -1px); }
  30%  { clip-path: inset(50% 0 50% 0); transform: translate(0, 0); }               /* 闪断帧 */
  45%  { clip-path: inset(28% 0 58% 0); transform: translate(-8px, 0); }
  60%  { clip-path: inset(72% 0 10% 0); transform: translate(4px, 1px); }
  75%  { clip-path: inset(50% 0 50% 0); transform: translate(0, 0); }               /* 闪断帧 */
  90%  { clip-path: inset(42% 0 46% 0); transform: translate(-6px, -1px); }
  100% { clip-path: inset(10% 0 72% 0); transform: translate(-5px, 1px); }
}

/* ========== 格式下拉（自定义胶囊式） ========== */
.fmt-select {
  position: relative;
  margin-bottom: 12px;
}
.fmt-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fmt-btn:hover {
  border-color: var(--primary);
}
.fmt-select.open .fmt-btn {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
}
.fmt-cur {
  font-weight: 600;
}
.fmt-arrow {
  color: var(--text-muted);
  transition: transform 0.2s ease;
  font-size: 12px;
}
.fmt-arrow.up {
  transform: rotate(180deg);
}
.fmt-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 240px;
  overflow-y: auto;
  padding: 5px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--shadow-hover);
}
.fmt-opt {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: all 0.12s ease;
}
.fmt-opt:hover {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  color: var(--text);
}
.fmt-opt.on {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  color: var(--primary);
  font-weight: 700;
}
.fmt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--card-border);
  flex-shrink: 0;
  transition: all 0.12s ease;
}
.fmt-opt.on .fmt-dot {
  background: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent);
}
.fmt-enter-active,
.fmt-leave-active {
  transition: all 0.16s ease;
}
.fmt-enter-from,
.fmt-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ========== 文字输入框 ========== */
.text-input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: all 0.15s ease;
}
.text-input::placeholder {
  color: var(--text-muted);
}
.text-input:hover {
  border-color: color-mix(in srgb, var(--primary) 55%, transparent);
}
.text-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
}

/* ========== 模式选项卡 ========== */
.mode-tabs {
  display: flex;
  background: var(--chip-bg);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 14px;
}
.mode-tabs button {
  flex: 1 1 0%;
  /* min-width:0：flex item 默认 min-width:auto，按钮文字会顶宽父容器 */
  min-width: 0;
  border: none;
  background: transparent;
  padding: 8px 0;
  border-radius: 9px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.18s ease;
}
.mode-tabs button:hover {
  color: var(--primary);
}
.mode-tabs button.active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 10px color-mix(in srgb, var(--primary) 40%, transparent);
}

/* ========== 圆形色板 ========== */
.sw-circle-grid {
  display: grid;
  /* minmax(0, 1fr)：列轨道可收缩到 0，色块再小也不会把网格撑出容器 */
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 10px;
}
.sw-c {
  aspect-ratio: 1;
  /* 不设 width/height/min-width：尺寸完全交给列轨道，窄屏自动变小、不会溢出 */
  min-width: 0;
  max-width: 100%;
  border-radius: 50%;
  border: 2px solid rgba(128, 128, 128, 0.3);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.13s ease, box-shadow 0.13s ease;
  font-family: Consolas, monospace;
}
.sw-c:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 35%, transparent);
  z-index: 1;
}
.sw-c:active {
  transform: scale(0.95);
}
.sw-c-code {
  font-size: 13px;
  font-weight: 700;
  pointer-events: none;
}

/* ========== 渐变编辑条 ========== */
.grad-track {
  position: relative;
  height: 34px;
  border-radius: 10px;
  cursor: copy;
  padding: 0;
  /* 触屏：横向拖动颜色点时不要带着页面一起滚 */
  touch-action: none;
}
.grad-track-bg {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.25);
  transition: background 0.15s ease;
}
.grad-pt {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
  transform: translate(-50%, -50%);
  cursor: grab;
  transition: box-shadow 0.12s ease, transform 0.12s ease;
  /* 触屏：在点上按住拖动时不滚动页面，pointermove 才能连续派发 */
  touch-action: none;
}
/* 指尖比鼠标粗，把命中区向外扩一圈（视觉不变） */
.grad-pt::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
}
.grad-pt:hover {
  transform: translate(-50%, -50%) scale(1.2);
}
.grad-pt.sel {
  box-shadow: 0 0 0 3px var(--primary), 0 1px 4px rgba(0, 0, 0, 0.45);
  cursor: grabbing;
}
.grad-scale {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 4px;
  padding: 0 2px;
}
.pt-editor {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
  margin-bottom: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--primary) 6%, var(--chip-bg));
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  animation: ptIn 0.18s ease;
}
.pt-multi-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: auto;
}
.hex-big {
  font-family: Consolas, monospace;
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
  background: var(--chip-bg);
  padding: 5px 12px;
  border-radius: 8px;
}
@keyframes ptIn {
  from { opacity: 0; transform: translateY(-4px); }
}
.pt-pos {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pt-pos-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.pos-num {
  font-size: 12px;
  font-family: Consolas, monospace;
  color: var(--primary);
  width: 36px;
}

/* ========== 快速模板 ========== */
.gp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.gp-chip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  cursor: pointer;
  transition: all 0.15s ease;
}
.gp-chip:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 18%, transparent);
}
.gp-chip:active {
  transform: scale(0.96);
}
.gp-bar {
  height: 14px;
  border-radius: 999px;
  border: 1px solid rgba(128, 128, 128, 0.35);
}
.gp-name {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ========== 预设 ========== */
.point-x {
  font-style: normal;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 2px;
}
.point-x:hover {
  color: #ef4444;
}
.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.preset-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 6px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  cursor: pointer;
  transition: all 0.15s ease;
}
.preset-chip:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}
.preset-bar {
  width: 32px;
  height: 15px;
  border-radius: 999px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  flex-shrink: 0;
}
.preset-name {
  font-size: 12px;
  font-family: Consolas, monospace;
  color: var(--text-secondary);
}
.preset-empty {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--chip-bg);
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.6;
}

/* ========== 选取模块 ========== */
.select-area {
  min-height: 88px;
  border-radius: 12px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  padding: 18px 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  white-space: pre-wrap;
  /* 禁用系统文本选择：必须带 -webkit- 前缀（iOS Safari 长期只认前缀版本）。
     缺了它，手机长按字符会弹出系统自带的模糊选字（放大镜 + 蓝色系统选区），
     我们自己的单字符精确选择反而被系统拦截 —— 用户看到的"只能模糊选中"就是它。 */
  -webkit-user-select: none;
  user-select: none;
  /* iOS 长按不弹出放大镜/拷贝菜单 */
  -webkit-touch-callout: none;
  line-height: 1.4;
  /* 选取区字符间距：调这一个值即可（每一侧的外边距，字符间实际间隔 = 该值 ×2） */
  --char-gap: 5px;
  /* 防撑破三件套：
     min-width:0 —— flex item 不再被 min-content 顶宽（否则窄屏下"已换行的文字"会撑开父级）
     max-width:100% —— 宽度上限锁死在容器内
     overflow-x:clip —— 万一仍有内容变宽，就地裁掉，绝不产生横向滚动

     注意用 clip 不用 hidden：hidden 会创建滚动容器，把导航栏的 position:sticky 变成相对它定位而失效。 */
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
  /* 任意位置都能断行，min-content 宽度降到 1 字符，彻底消除"变直"的可能 */
  overflow-wrap: anywhere;
  word-break: break-word;
  /* 高度随内容增减时平滑过渡（效果栏同款动画感）；interpolate-size 允许 auto 高度参与过渡 */
  interpolate-size: allow-keywords;
  transition: height 0.25s ease;
}
.char {
  font-size: 27px;
  font-weight: 700;
  padding: 2px 1px;
  /* gap 已 0 宽，字符间隔靠这个外边距撑开（两侧相加 = 实际间隔） */
  margin: 0 var(--char-gap, 5px);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text);
  /* 触屏点按即时响应（去掉老 iOS 的 300ms 点击延迟），不影响正常滚动 */
  touch-action: manipulation;
  transition: box-shadow 0.1s ease;
}
.char:hover {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent);
}
.char.selected {
  background: color-mix(in srgb, var(--primary) 20%, transparent);
  box-shadow: 0 0 0 2px var(--primary);
}
/* 触屏引导条：桌面不显示，只在粗指针（触屏）设备出现 —— 窄屏下桌面版提示会被隐藏，
   这里补一条常驻说明，否则手机用户根本不知道"再点一下能取消" */
.touch-tip {
  display: none;
  margin: 9px 2px 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-muted);
}
@media (pointer: coarse) {
  .touch-tip {
    display: block;
  }
}
.gap {
  /* 零宽度：不占布局空间，字符连续排列 → flex 换行后任何一行的行首都不会留空白
     （旧版 gap 占 13/16px 实体宽度，第一行以 gap 开头、第二行以字符开头，行首不对齐）。
     点击热区与插入竖线都用绝对定位画出来，功能不变。 */
  width: 0;
  align-self: stretch;
  min-height: 36px;
  position: relative;
  cursor: pointer;
}
/* 扩展点击热区：正好覆盖字符之间的空隙（随 --char-gap 联动）。
   不写死 ±9px —— 热区一旦大于空隙就会压到字符边缘，点字符边角会误触发插入。 */
.gap::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(-1 * (var(--char-gap, 5px) + 1px));
  right: calc(-1 * (var(--char-gap, 5px) + 1px));
}
.gap::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 60%;
  border-radius: 2px;
  background: transparent;
  transition: background 0.15s ease;
}
.gap:hover::after {
  background: color-mix(in srgb, var(--primary) 35%, transparent);
}
.gap.active::after {
  background: var(--primary);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% { opacity: 0.2; }
}
.reset-badge {
  /* gap 已 0 宽，徽章绝对定位悬挂在间隙上方，不占布局 */
  position: absolute;
  left: 50%;
  top: -4px;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  font-style: normal;
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 1;
}
.reset-badge:hover {
  transform: translateX(-50%) scale(1.15);
}
.preview-placeholder {
  font-size: 13px;
  color: var(--text-muted);
}

/* ========== 快捷工具栏 ========== */
.quick-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--primary) 7%, var(--chip-bg));
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
}
.insert-bar {
  background: color-mix(in srgb, var(--primary) 10%, var(--chip-bg));
  border-color: color-mix(in srgb, var(--primary) 40%, transparent);
}
.qb-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: 4px;
}
.qb-btn {
  min-width: 34px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg, var(--bg));
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.13s ease;
}
.qb-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.qb-btn:active {
  transform: scale(0.94);
}
.qb-btn.on {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.qb-single-hex {
  font-family: Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  background: var(--card-bg, var(--bg));
  padding: 4px 8px;
  border-radius: 6px;
}
.qb-replace-input {
  width: 150px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg, var(--bg));
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: all 0.15s ease;
}
.qb-replace-input::placeholder {
  color: var(--text-muted);
  font-size: 12px;
}
.qb-replace-input:hover {
  border-color: color-mix(in srgb, var(--primary) 55%, transparent);
}
.qb-replace-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
}
/* bar-slide：出现/消失（选区从无到有）—— 真实高度塌陷动画，卡片平滑撑开/收回 */
.bar-slide-enter-active,
.bar-slide-leave-active {
  transition: all 0.2s ease;
  interpolate-size: allow-keywords;
  overflow: hidden;
}
.bar-slide-enter-from,
.bar-slide-leave-to {
  opacity: 0;
  height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-top-width: 0;
  border-bottom-width: 0;
}
/* bar-fade：效果栏 ↔ 插入栏互相切换 —— 交叉淡入淡出 + 轻微横移。
   两栏等高，离场栏绝对定位悬浮原地（不占布局），transform 不参与布局，
   卡片高度全程不变 */
.bar-fade-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.bar-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  position: absolute;
  inset-inline: 0;
}
.bar-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.bar-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* ========== 聊天预览 ========== */
.chat-preview {
  background: rgba(0, 0, 0, 0.78);
  border-radius: 10px;
  padding: 16px 18px;
  font-family: 'Mojang', 'UnifontMC', 'Segoe UI', sans-serif;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
  transition: background-color 0.2s ease;
}
.chat-line {
  font-size: 22px;
  line-height: 1.8;
  word-break: break-all;
  text-shadow: 1.5px 1.5px 0 rgba(0, 0, 0, 0.8);
}
.chat-prefix {
  color: #ffffff;
  margin-right: 6px;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
}
.obf {
  font-family: Consolas, monospace;
}
.preview-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bg-reset-btn {
  height: 26px;
  font-size: 12px;
  padding: 0 8px;
}

/* ========== 符号切换（输出面板头） ========== */
.out-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}
.out-label {
  font-size: 12px;
  color: var(--text-secondary);
}
/* 面板头里的 chip 缩小间距 */
.panel-head .chip {
  font-size: 12px;
}
/* 全选按钮：紧贴提示文字左侧（panel-head 右侧组内） */
.panel-head-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.select-all-btn {
  height: 24px;
  font-size: 12px;
  padding: 0 9px;
  border-radius: 6px;
  min-width: 0;
}
.qb-clear:hover {
  border-color: #ef4444;
  color: #ef4444;
}
/* 恢复按钮：宽度 + 透明度动画收展，不改变标题行高度 */
.bg-reset-btn {
  overflow: hidden;
  white-space: nowrap;
  max-width: 80px;
  transition: opacity 0.25s ease, max-width 0.25s ease, margin 0.25s ease, padding 0.25s ease;
}
.bg-reset-btn.ghost {
  opacity: 0;
  max-width: 0;
  min-width: 0; /* 覆盖 .qb-btn 的 min-width，否则无法收窄到 0 */
  margin-left: -8px; /* 抵消消失后残留的一侧 gap，使间距与常驻时一致 */
  padding-left: 0;
  padding-right: 0;
  border-width: 0;
  pointer-events: none;
}
.sym-toggle {
  display: inline-flex;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  overflow: hidden;
}
.sym-toggle button {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: Consolas, monospace;
  font-size: 13px;
  width: 30px;
  height: 26px;
  cursor: pointer;
  transition: all 0.13s ease;
}
.sym-toggle button + button {
  border-left: 1px solid var(--card-border);
}
.sym-toggle button:hover {
  color: var(--primary);
}
.sym-toggle button.on {
  background: var(--primary);
  color: #fff;
  font-weight: 700;
}

/* ========== 代码输出 ========== */
.code-output {
  background: var(--chip-bg);
  border-radius: 8px;
  padding: 12px 14px;
  font-family: Consolas, monospace;
  font-size: 13.5px;
  color: var(--primary);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
  /* 同 .select-area：锁死宽度上限，长代码串/选中文字都不会把页面撑宽 */
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  overflow-x: clip;
  /* 手机上允许长按拖选部分代码复制 */
  -webkit-user-select: text;
  user-select: text;
  -webkit-touch-callout: default;
}

/* ========== 触屏适配 ========== */
/* 竖向滑动留给页面滚动，横向滑动交给 JS 做连选 */
.select-area {
  touch-action: pan-y;
}
.multi-mode-btn {
  height: 24px;
  font-size: 12px;
  padding: 0 9px;
  border-radius: 6px;
  min-width: 0;
}
/* 触屏没有真正的 hover：点击后 hover 态会一直粘着，这里还原成常态 */
@media (hover: none) {
  .char:hover {
    box-shadow: none;
  }
  .qb-btn:hover:not(.on) {
    border-color: var(--card-border);
    color: var(--text);
  }
  .select-all-btn:hover,
  .multi-mode-btn:hover {
    border-color: var(--card-border);
    color: var(--text);
  }
  .sw-c:hover {
    transform: none;
    box-shadow: none;
  }
  .grad-pt:hover {
    transform: translate(-50%, -50%);
  }
}
@media (pointer: coarse) {
  /* 触摸目标放大到 ≥30px 高 */
  .qb-btn {
    height: 36px;
    min-width: 38px;
  }
  .select-all-btn,
  .multi-mode-btn,
  .bg-reset-btn {
    height: 30px;
  }
  .select-all-btn,
  .multi-mode-btn {
    padding: 0 11px;
  }
  .sym-toggle button {
    height: 30px;
    width: 34px;
  }
  /* 颜色点加大，手指好按 */
  .grad-track {
    height: 40px;
  }
  .grad-pt {
    width: 26px;
    height: 26px;
  }
  /* 注意：不要给 .sw-c 设固定宽高！
     8 列 × 38px + 7×10px 间距 = 374px，任何窄于 ~430px 的手机都会被撑开横向滚动。
     触摸目标大小改用下面的「减少列数」实现 —— 列少了，每格反而更大更好按。 */

  /* 选中态描边：触屏下改用 inset 内描边。
     原来的外阴影（box-shadow: 0 0 0 2px）是向外画的 ink 溢出，
     会被 .select-area 的 overflow:clip 在部分移动端引擎里裁掉 →
     用户看到的现象就是"有背景色、却没有框"。
     inset 画在元素内部，任何裁剪环境都稳定可见。 */
  .char.selected {
    box-shadow: inset 0 0 0 2px var(--primary);
  }
}
/* 窄屏减少列数：既保证色块≥40px 好按，又绝不会撑破容器 */
@media (max-width: 640px) {
  .sw-circle-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 9px;
  }
}
@media (max-width: 420px) {
  .sw-circle-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
}

@media (max-width: 900px) {
  .mc-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .tool-header h1 {
    font-size: 21px;
  }
  .tool-header p {
    font-size: 13px;
  }
  /* 模式切换：窄屏铺满整行，两个按钮等宽（不换行） */
  .edit-mode-switch {
    display: flex;
    width: 100%;
    box-sizing: border-box;
  }
  .edit-mode-switch button {
    flex: 1 1 0%;
    padding: 9px 6px;
    font-size: 12.5px;
  }
  .import-area {
    min-height: 132px;
    padding: 12px 13px;
    font-size: 13px;
  }
  .import-actions {
    gap: 8px;
  }
  .import-actions :deep(.el-button) {
    flex: 1 1 auto;
  }
  .import-note {
    flex-basis: 100%;
  }
  .panel-card {
    padding: 14px 14px;
  }
  /* 面板头：按钮永不换行 —— 过长提示文字改为隐藏，避免把按钮挤到第二行 */
  .panel-head {
    flex-wrap: nowrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  .panel-head-right {
    flex-shrink: 0;
  }
  .hint-chip,
  .out-tools .chip,
  .preview-tools .chip {
    display: none;
  }
  /* 快捷工具栏：不换行，改成横向滑动，卡片高度保持稳定 */
  .quick-bar {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    scroll-padding: 0 12px;
  }
  .quick-bar::-webkit-scrollbar {
    display: none;
  }
  .quick-bar > * {
    flex-shrink: 0;
  }
  .qb-replace-input {
    width: 96px;
  }
  /* 字符触摸目标加大 */
  .char {
    padding: 4px 2px;
  }
  /* gap 已是 0 宽设计（热区用 ::before 画出来），不再覆盖 width */
  .select-area {
    padding: 16px 12px;
  }
  .code-output {
    font-size: 12.5px;
    padding: 10px 12px;
  }
}
</style>
