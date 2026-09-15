<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePillSlider } from '@/composables/usePillSlider'
import { useLayoutAnim } from '@/composables/useLayoutAnim'

/* ============================================================
   贴图库
   Vite 在编译时扫描项目根目录下的两个文件夹（往里面丢 PNG，页面自动就会出现）：
     <项目根>/mine/                你自绘的贴图
     <项目根>/vanilla/container/   MC 原版容器贴图
   用两个独立的 glob，而不是一个大 glob 再按路径猜分组 —— 路径改了也不会串组。
   ============================================================ */
const mineMap = import.meta.glob('../../mine/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
})
const vanillaMap = import.meta.glob('../../vanilla/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
})

const norm = p => p.replace(/\\/g, '/')
// button_primary → Button Primary
const pretty = s => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const mineList = ref([]) // 我的贴图
const vanillaList = ref([]) // MC 原版贴图（全部）
const containerList = ref([]) // 可作为底图的容器（vanilla/container 一级目录）

function toRecs(map) {
  return Object.entries(map).map(([p, url]) => {
    const path = norm(p)
    const file = path.split('/').pop().replace(/\.png$/i, '')
    return { key: path, file, label: pretty(file), url }
  })
}

function buildLibrary() {
  const byLabel = (a, b) => a.label.localeCompare(b.label)
  mineList.value = toRecs(mineMap).sort(byLabel)
  const van = toRecs(vanillaMap).sort(byLabel)
  vanillaList.value = van
  // 能当底图的只有 vanilla/container 下的一级 PNG（creative_inventory 等子目录是页签，不算容器）
  containerList.value = van.filter(r => /\/vanilla\/container\/[^/]+\.png$/i.test(r.key))
}
buildLibrary()

/* ============================================================
   图片缓存 / 加载
   ============================================================ */
const imgCache = new Map()
function getImg(url) {
  let im = imgCache.get(url)
  if (!im) {
    im = new Image()
    im.decoding = 'async'
    im.src = url
    imgCache.set(url, im)
  }
  return im
}
function imgReady(im) {
  if (im.complete && im.naturalWidth) return Promise.resolve(im)
  return new Promise((res, rej) => {
    im.addEventListener('load', () => res(im), { once: true })
    im.addEventListener('error', () => rej(new Error('img error')), { once: true })
  })
}

/* ============================================================
   对齐吸附 + 边界夹取
   ============================================================
   这里有个容易写错的地方：**必须先按步长吸附，再夹到边界内**。
   反过来（先夹后吸附）的话，吸附步长大于 1px 时会把已经夹紧的值又抬到界外：
     贴图高 16、画布高 222、吸附 4px → 先夹得 206 → 再吸附到 4 的倍数得 208 → 越界 2px。
   这就是"贴图能跑到容器底图外面"的根因。
   ============================================================ */
const snapOn = ref(true)
const snapPx = ref(1) // 默认 1px，可在输出设置里自定义
function onSnapChange(v) {
  snapPx.value = Math.max(1, Math.min(64, Math.round(Number(v) || 1)))
}
const snap = v => (snapOn.value ? Math.round(v / snapPx.value) * snapPx.value : Math.round(v))
const clampAxis = (v, size, total) => Math.max(0, Math.min(Math.max(0, total - size), v))
// 吸附 + 夹取的正确组合：一步到位，调用方不会再漏掉顺序
const snapClampAxis = (v, size, total) => clampAxis(snap(v), size, total)

/* ============================================================
   容器底图
   ============================================================ */
const CROP_MODES = [
  { id: 'auto', label: '自动裁切', hint: '自动裁掉四周的透明留白，对齐 MC 真实 GUI 尺寸' },
  { id: 'full', label: '完整贴图', hint: '保留整张贴图（含四周透明边）' }
]

const containerKey = ref('')
const containerImg = ref(null)
const containerMeta = ref(null)
const natSize = ref({ w: 0, h: 0 })
const cropBox = ref({ x: 0, y: 0, w: 0, h: 0 })
const cropMode = ref('auto')
// 「底图范围」分段按钮的滑动指示块
const { wrapRef: cropSegRef, pillStyle: cropSegPill } = usePillSlider(() => cropMode.value, { pad: 3 })
const loadingCtn = ref(false)

// 底图范围：自动裁切到「不透明像素的包围盒」（MC 的 GUI 区域就正好是这个尺寸）
const design = computed(() => (cropMode.value === 'full'
  ? { x: 0, y: 0, w: natSize.value.w, h: natSize.value.h }
  : { ...cropBox.value }))

// 扫描不透明包围盒。容器贴图四周通常是大片透明留白，裁掉才能对齐真实 GUI 尺寸
function autoCrop(img) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  let data
  try {
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return { x: 0, y: 0, w, h }
  }
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      if (data[(row + x) * 4 + 3] !== 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

async function selectContainer(rec) {
  if (!rec) return
  loadingCtn.value = true
  try {
    const im = getImg(rec.url)
    await imgReady(im)
    containerImg.value = im
    containerMeta.value = rec
    natSize.value = { w: im.naturalWidth, h: im.naturalHeight }
    cropBox.value = autoCrop(im)
    items.value = []
    clearSelection()
    outW.value = design.value.w
    outH.value = design.value.h
    fitZoom()
  } catch {
    ElMessage.error('容器贴图加载失败')
  } finally {
    loadingCtn.value = false
  }
}

watch(containerKey, k => {
  const rec = containerList.value.find(c => c.key === k)
  if (rec) selectContainer(rec)
})

// 底图变小了（换容器 / 切裁切模式）→ 原来贴着右下的贴图会留在界外，重新夹一遍
watch(design, d => {
  outW.value = d.w
  outH.value = d.h
  if (!d.w || !d.h) return
  for (const it of items.value) {
    it.w = Math.max(1, Math.min(d.w, it.w))
    it.h = Math.max(1, Math.min(d.h, it.h))
    it.x = clampAxis(it.x, it.w, d.w)
    it.y = clampAxis(it.y, it.h, d.h)
  }
})

/* ============================================================
   画布缩放
   一律用整数倍：像素贴图在非整数倍下会出现「有些像素 2px、有些 3px」的
   不均感（image-rendering: pixelated 也无法救），MC 材质是像素艺术，
   整数倍才是正确观感。
   ============================================================ */
const zoom = ref(2)
const ZOOM_MIN = 1
const ZOOM_MAX = 16
// 画布四周的留白。必须 ≥ 缩放手柄向外伸出的距离，否则贴图贴到底边时
// 手柄会溢出滚动容器，画布右侧就凭空多出一条滚动条。
const STAGE_PAD = 16
const stageWrap = ref(null)
// 用户手动调过缩放后，就不再自动「适应」打扰他
let userZoomed = false
let lastFitW = 0
let fitTimer = null
let fitObserver = null

function fitZoom(force = true) {
  if (!force && userZoomed) return
  clearTimeout(fitTimer)
  // 延后一帧：容器贴图刚设好时列宽可能还没稳定，
  // 太早量 clientWidth 会得到偏小的值（结果就是缩放卡在 1×）
  fitTimer = setTimeout(() => {
    const el = stageWrap.value
    const d = design.value
    if (!el || !d.w || !d.h) return
    // clientWidth 含 padding，可用宽度要把四周留白扣掉
    const availW = Math.max(120, el.clientWidth - STAGE_PAD * 2 - 4)
    // 纵向取视口高度的 68%：既让画布尽量大，又不会长得离谱到要滚很远
    // （不能用「innerHeight 减去固定像素」——窗口小的时候会算出 0，缩放就被卡在 1×）
    const availH = Math.max(240, Math.round(window.innerHeight * 0.68))
    const z = Math.min(availW / d.w, availH / d.h)
    zoom.value = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.floor(z)))
    lastFitW = el.clientWidth
  }, 60)
}
function zoomBy(step) {
  userZoomed = true
  zoom.value = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.value + step))
}
// 「适应」按钮：恢复自动适应
function refit() {
  userZoomed = false
  fitZoom()
}

/* ============================================================
   图层（画布上的贴图）
   items 数组顺序 = 绘制顺序：**后面的压在前面之上**。
   图层面板按相反顺序展示（最上层排最前），和画布看到的一致。
   ============================================================ */
const items = ref([])
let itemSeq = 0
const selectedIds = ref(new Set())
const selectedItems = computed(() => items.value.filter(i => selectedIds.value.has(i.id)))
const selCount = computed(() => selectedItems.value.length)
// 参数面板只在「正好选中一个」时出现；多选走批量操作
const single = computed(() => (selectedItems.value.length === 1 ? selectedItems.value[0] : null))
const singleIndex = computed(() => (single.value ? items.value.findIndex(i => i.id === single.value.id) : -1))
// 图层面板：最上层在最前
const layersTopFirst = computed(() => [...items.value].slice().reverse())

let anchorId = null // Shift 范围选择的锚点

function setSelection(ids) {
  selectedIds.value = new Set(ids)
}
function selectOnly(id) {
  anchorId = id
  setSelection([id])
}
function toggleSelect(id) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
  anchorId = id
}
function selectRangeTo(id) {
  const all = items.value
  const from = all.findIndex(i => i.id === (anchorId ?? id))
  const to = all.findIndex(i => i.id === id)
  if (from < 0 || to < 0) {
    selectOnly(id)
    return
  }
  const [a, b] = from <= to ? [from, to] : [to, from]
  setSelection(all.slice(a, b + 1).map(i => i.id))
}
function selectAll() {
  if (!items.value.length) return
  setSelection(items.value.map(i => i.id))
}
function clearSelection() {
  selectedIds.value = new Set()
}

// 画布 / 图层行统一的「点击 = 怎么选」
function pickByEvent(id, e) {
  if (e.shiftKey) selectRangeTo(id)
  else if (e.ctrlKey || e.metaKey) toggleSelect(id)
  else selectOnly(id)
}

async function addTexture(rec, center) {
  const im = getImg(rec.url)
  await imgReady(im).catch(() => null)
  const d = design.value
  if (!d.w || !d.h) {
    ElMessage.warning('容器还没载入完成')
    return
  }
  const nw = im.naturalWidth || 16
  const nh = im.naturalHeight || 16
  // 默认按贴图原始像素尺寸放入；比画布还大时等比缩小到能放下
  let w = nw
  let h = nh
  if (w > d.w || h > d.h) {
    const k = Math.min(d.w / w, d.h / h)
    w = Math.max(1, Math.round(w * k))
    h = Math.max(1, Math.round(h * k))
  }
  const cx = center ? center.x : d.w / 2
  const cy = center ? center.y : d.h / 2
  const it = {
    id: ++itemSeq,
    key: rec.key,
    url: rec.url,
    label: rec.label,
    x: snapClampAxis(cx - w / 2, w, d.w),
    y: snapClampAxis(cy - h / 2, h, d.h),
    w,
    h,
    flipX: false,
    flipY: false
  }
  items.value.push(it)
  selectOnly(it.id)
  return it
}

function removeItem(it) {
  items.value = items.value.filter(o => o.id !== it.id)
  if (selectedIds.value.has(it.id)) {
    const s = new Set(selectedIds.value)
    s.delete(it.id)
    selectedIds.value = s
  }
}
function removeSelected() {
  if (!selectedIds.value.size) return
  const ids = new Set(selectedIds.value)
  items.value = items.value.filter(i => !ids.has(i.id))
  clearSelection()
}

async function clearAll() {
  if (!items.value.length) return
  try {
    await ElMessageBox.confirm('确定清空画布上所有贴图吗？', '清空画布', {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  items.value = []
  clearSelection()
}

/* ---------- 层级 ---------- */
// dir = 1 上移一层（更靠前），-1 下移一层。多选时整组一起挪，组内相对顺序不变
function layerMove(dir) {
  if (!selectedIds.value.size) return
  const ids = selectedIds.value
  const next = [...items.value]
  if (dir > 0) {
    for (let i = next.length - 2; i >= 0; i--) {
      if (ids.has(next[i].id) && !ids.has(next[i + 1].id)) {
        ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      }
    }
  } else {
    for (let i = 1; i < next.length; i++) {
      if (ids.has(next[i].id) && !ids.has(next[i - 1].id)) {
        ;[next[i], next[i - 1]] = [next[i - 1], next[i]]
      }
    }
  }
  items.value = next
}
function layerToEdge(edge) {
  if (!selectedIds.value.size) return
  const ids = selectedIds.value
  const sel = items.value.filter(i => ids.has(i.id))
  const rest = items.value.filter(i => !ids.has(i.id))
  items.value = edge === 'top' ? [...rest, ...sel] : [...sel, ...rest]
}

/* ---------- 对齐 / 分布（多选） ---------- */
const ALIGN_OPS = [
  { id: 'left', label: '左对齐', icon: '⇤' },
  { id: 'hcenter', label: '水平居中', icon: '⇹' },
  { id: 'right', label: '右对齐', icon: '⇥' },
  { id: 'top', label: '顶对齐', icon: '⇡' },
  { id: 'vcenter', label: '垂直居中', icon: '⇕' },
  { id: 'bottom', label: '底对齐', icon: '⇣' }
]

function alignItems(mode) {
  const list = selectedItems.value
  if (list.length < 2) return
  const d = design.value
  const left = Math.min(...list.map(i => i.x))
  const right = Math.max(...list.map(i => i.x + i.w))
  const top = Math.min(...list.map(i => i.y))
  const bottom = Math.max(...list.map(i => i.y + i.h))
  const cx = (left + right) / 2
  const cy = (top + bottom) / 2
  for (const it of list) {
    if (mode === 'left') it.x = snapClampAxis(left, it.w, d.w)
    else if (mode === 'right') it.x = snapClampAxis(right - it.w, it.w, d.w)
    else if (mode === 'hcenter') it.x = snapClampAxis(Math.round(cx - it.w / 2), it.w, d.w)
    else if (mode === 'top') it.y = snapClampAxis(top, it.h, d.h)
    else if (mode === 'bottom') it.y = snapClampAxis(bottom - it.h, it.h, d.h)
    else if (mode === 'vcenter') it.y = snapClampAxis(Math.round(cy - it.h / 2), it.h, d.h)
  }
}

// 两端不动，中间的按「中心点等距」摊开
function distribute(axis) {
  const list = [...selectedItems.value]
  if (list.length < 3) return
  const d = design.value
  const key = axis === 'x' ? 'x' : 'y'
  const size = axis === 'x' ? 'w' : 'h'
  const total = axis === 'x' ? d.w : d.h
  list.sort((a, b) => a[key] - b[key])
  const first = list[0]
  const last = list[list.length - 1]
  const c0 = first[key] + first[size] / 2
  const c1 = last[key] + last[size] / 2
  const step = (c1 - c0) / (list.length - 1)
  list.forEach((it, i) => {
    if (i === 0 || i === list.length - 1) return
    it[key] = snapClampAxis(Math.round(c0 + step * i - it[size] / 2), it[size], total)
  })
}

/* ---------- 参数面板（精确调整） ---------- */
const itemLockRatio = ref(true)

function setPos(axis, v) {
  const it = single.value
  if (!it) return
  const n = Number(v)
  if (!Number.isFinite(n)) return
  const d = design.value
  if (axis === 'x') it.x = snapClampAxis(n, it.w, d.w)
  else it.y = snapClampAxis(n, it.h, d.h)
}

function setSize(axis, v) {
  const it = single.value
  if (!it) return
  const n = Math.round(Number(v) || 0)
  if (!n || n < 1) return
  const d = design.value
  if (axis === 'w') {
    const k = n / it.w
    it.w = Math.min(d.w, n)
    if (itemLockRatio.value) it.h = Math.max(1, Math.min(d.h, Math.round(it.h * k)))
  } else {
    const k = n / it.h
    it.h = Math.min(d.h, n)
    if (itemLockRatio.value) it.w = Math.max(1, Math.min(d.w, Math.round(it.w * k)))
  }
  it.x = snapClampAxis(it.x, it.w, d.w)
  it.y = snapClampAxis(it.y, it.h, d.h)
}

// 单个：自己在画布里居中；多个：整组居中（保持相对位置）
function centerSelected() {
  const list = selectedItems.value
  if (!list.length) return
  const d = design.value
  if (list.length === 1) {
    const it = list[0]
    it.x = snapClampAxis(Math.round((d.w - it.w) / 2), it.w, d.w)
    it.y = snapClampAxis(Math.round((d.h - it.h) / 2), it.h, d.h)
    return
  }
  const left = Math.min(...list.map(i => i.x))
  const right = Math.max(...list.map(i => i.x + i.w))
  const top = Math.min(...list.map(i => i.y))
  const bottom = Math.max(...list.map(i => i.y + i.h))
  const dx = Math.round((d.w - (right - left)) / 2) - left
  const dy = Math.round((d.h - (bottom - top)) / 2) - top
  moveSelectionBy(dx, dy)
}

function flipSelected(axis) {
  for (const it of selectedItems.value) {
    if (axis === 'x') it.flipX = !it.flipX
    else it.flipY = !it.flipY
  }
}

function duplicateSelected() {
  const list = selectedItems.value
  if (!list.length) return
  const d = design.value
  const copies = list.map(it => ({
    ...it,
    id: ++itemSeq,
    x: snapClampAxis(it.x + 2, it.w, d.w),
    y: snapClampAxis(it.y + 2, it.h, d.h)
  }))
  items.value.push(...copies)
  setSelection(copies.map(c => c.id))
}

/* ============================================================
   拖动 / 缩放（指针事件，鼠标与触屏统一）
   ============================================================ */
let drag = null

function designPoint(e) {
  const rect = stageRef.value.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / zoom.value,
    y: (e.clientY - rect.top) / zoom.value
  }
}

/**
 * 把一组贴图整体平移 (dx, dy)，保证**整组**都不越界。
 * 单个贴图走这里也等价 —— 组只有一个成员，等价于直接夹取。
 * 逐个夹取是不行的：那样组内每个成员会各自撞到边界，相对位置就被挤乱了。
 */
function moveSelectionBy(dx, dy, doSnap = true) {
  const d = design.value
  const base = selectedItems.value.map(it => ({ id: it.id, x: it.x, y: it.y, w: it.w, h: it.h }))
  if (!base.length) return
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of base) {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }
  const nx = doSnap ? snap(dx) : Math.round(dx)
  const ny = doSnap ? snap(dy) : Math.round(dy)
  // 允许的位移区间：整组的左/上边不越过 0，右/下边不越过画布
  const clampedX = Math.max(-minX, Math.min(Math.max(-minX, d.w - maxX), nx))
  const clampedY = Math.max(-minY, Math.min(Math.max(-minY, d.h - maxY), ny))
  for (const b of base) {
    const it = items.value.find(x => x.id === b.id)
    if (!it) continue
    it.x = b.x + clampedX
    it.y = b.y + clampedY
  }
}

function startDrag(mode, it, e) {
  if (e.button) return
  e.preventDefault()
  e.stopPropagation()
  // 拖一个没选中的贴图 → 先单选它；拖已选中的 → 整组一起走
  if (!selectedIds.value.has(it.id)) selectOnly(it.id)
  const p = designPoint(e)
  drag = { mode, id: it.id, sx: p.x, sy: p.y, ow: it.w, oh: it.h, moved: false }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onItemDown(it, e) {
  // Ctrl / Shift 点画布上的贴图 = 多选，不进入拖动（避免手一抖就把位置带偏）
  if (e.ctrlKey || e.metaKey || e.shiftKey) {
    e.preventDefault()
    e.stopPropagation()
    pickByEvent(it.id, e)
    return
  }
  startDrag('move', it, e)
}
const onHandleDown = (it, e) => startDrag('resize', it, e)

function onPointerMove(e) {
  if (!drag) return
  const d = design.value
  const p = designPoint(e)
  const dx = p.x - drag.sx
  const dy = p.y - drag.sy
  if (drag.mode === 'move') {
    // 在「点击」的抖动范围内先不动、也不算拖动 ——
    // 否则手指/鼠标 1px 的抖动就会把「点击单选」变成一次 0px 的平移，
    // 松手时点选就被吞掉了。
    if (!drag.moved) {
      if (Math.hypot(dx, dy) <= 1.5) return
      drag.moved = true
    }
    moveSelectionBy(dx, dy)
  } else {
    const it = items.value.find(i => i.id === drag.id)
    if (!it) return
    it.w = Math.max(1, Math.min(d.w, snap(Math.max(1, drag.ow + dx))))
    it.h = Math.max(1, Math.min(d.h, snap(Math.max(1, drag.oh + dy))))
    it.x = snapClampAxis(it.x, it.w, d.w)
    it.y = snapClampAxis(it.y, it.h, d.h)
  }
}

function onPointerUp() {
  if (!drag) return
  const d = drag
  drag = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  // 多选状态下「点一下」某个已选中的贴图，如果全程没真的拖动，就把它收敛成唯一选中。
  // 不这么做的话，点击永远只能加选 —— 想单选某个成员就只能先去点空白处，很别扭。
  if (d.mode === 'move' && !d.moved && selectedIds.value.size > 1 && selectedIds.value.has(d.id)) {
    selectOnly(d.id)
  }
}

function onStageDown() {
  clearSelection()
}

/* ============================================================
   从贴图库拖到画布
   ============================================================ */
const libDrag = ref(null) // 跟随指针的幽灵贴图
let libPress = null

function onLibDown(rec, e) {
  if (e.button) return
  e.preventDefault()
  libPress = { rec, x: e.clientX, y: e.clientY }
  window.addEventListener('pointermove', onLibMove)
  window.addEventListener('pointerup', onLibUp)
  window.addEventListener('pointercancel', onLibUp)
}
function overStage(cx, cy) {
  const el = stageRef.value
  if (!el) return false
  const r = el.getBoundingClientRect()
  return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom
}
async function onLibMove(e) {
  if (!libPress) return
  if (!libDrag.value) {
    if (Math.hypot(e.clientX - libPress.x, e.clientY - libPress.y) < 6) return
    const im = getImg(libPress.rec.url)
    await imgReady(im).catch(() => null)
    if (!libPress) return
    libDrag.value = {
      rec: libPress.rec,
      url: libPress.rec.url,
      nw: im.naturalWidth || 16,
      nh: im.naturalHeight || 16,
      x: e.clientX,
      y: e.clientY,
      over: false
    }
  }
  libDrag.value.x = e.clientX
  libDrag.value.y = e.clientY
  libDrag.value.over = overStage(e.clientX, e.clientY)
}
function endLibListen() {
  window.removeEventListener('pointermove', onLibMove)
  window.removeEventListener('pointerup', onLibUp)
  window.removeEventListener('pointercancel', onLibUp)
}
function onLibUp(e) {
  const press = libPress
  const d = libDrag.value
  endLibListen()
  libPress = null
  libDrag.value = null
  if (!press) return
  if (d) {
    // 拖到画布上 → 在松手的位置放下
    if (overStage(e.clientX, e.clientY)) addTexture(press.rec, designPoint(e))
  } else {
    // 原地单击 → 放到画布正中央
    addTexture(press.rec)
  }
}

/* ============================================================
   导出分辨率
   ============================================================ */
const outW = ref(176)
const outH = ref(166)
const lockRatio = ref(true)

function onWChange(v) {
  if (!lockRatio.value) return
  const d = design.value
  const n = Number(v)
  if (!d.w || !n) return
  outH.value = Math.max(1, Math.round((n * d.h) / d.w))
}
function onHChange(v) {
  if (!lockRatio.value) return
  const d = design.value
  const n = Number(v)
  if (!d.h || !n) return
  outW.value = Math.max(1, Math.round((n * d.w) / d.h))
}
function applyScale(k) {
  const d = design.value
  if (!d.w || !d.h) return
  outW.value = d.w * k
  outH.value = d.h * k
}

const exportScaleText = computed(() => {
  const d = design.value
  if (!d.w || !outW.value) return ''
  const k = outW.value / d.w
  return k === 1 ? '1:1 原尺寸' : `${Math.round(k * 100) / 100}× 放大`
})

/* ---------- 导出 PNG ---------- */
const exporting = ref(false)
async function exportPng() {
  const d = design.value
  if (!containerImg.value || !d.w || !d.h) {
    ElMessage.warning('请先选择容器底图')
    return
  }
  const W = Math.max(1, Math.round(Number(outW.value) || 0))
  const H = Math.max(1, Math.round(Number(outH.value) || 0))
  if (W > 8192 || H > 8192) {
    ElMessage.warning('分辨率上限 8192 × 8192')
    return
  }
  exporting.value = true
  try {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const ctx = c.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, W, H)
    const kx = W / d.w
    const ky = H / d.h
    // 1) 底图（按裁切框取源区域，铺满输出画布）
    ctx.drawImage(containerImg.value, d.x, d.y, d.w, d.h, 0, 0, W, H)
    // 2) 逐个贴图，按同样的比例缩放
    // 翻转的稳妥做法：先原样画到离屏画布，再以 1:1 尺寸镜像贴回。
    // 直接把负缩放矩阵加在「带缩放的 drawImage」上虽然多数浏览器也正确，
    // 但那依赖引擎对「负方向 + 降采样」的取整实现，跨浏览器有踩坑风险；
    // 1:1 镜像时每个源像素正好落在一个目标像素上，不依赖取整。
    // （已隔离实测：两种画法在本机 Chromium 下都是 2400/2400 精确镜像。）
    await Promise.all(items.value.map(it => imgReady(getImg(it.url)).catch(() => null)))
    const flipBuf = document.createElement('canvas')
    for (const it of items.value) {
      const im = getImg(it.url)
      if (!im.naturalWidth) continue
      const dw = Math.max(1, Math.round(it.w * kx))
      const dh = Math.max(1, Math.round(it.h * ky))
      const dx = Math.round(it.x * kx)
      const dy = Math.round(it.y * ky)
      if (it.flipX || it.flipY) {
        flipBuf.width = dw
        flipBuf.height = dh
        const fc = flipBuf.getContext('2d')
        fc.imageSmoothingEnabled = false
        fc.clearRect(0, 0, dw, dh)
        fc.drawImage(im, 0, 0, dw, dh)

        ctx.save()
        ctx.imageSmoothingEnabled = false
        ctx.translate(it.flipX ? dx + dw : dx, it.flipY ? dy + dh : dy)
        ctx.scale(it.flipX ? -1 : 1, it.flipY ? -1 : 1)
        ctx.drawImage(flipBuf, 0, 0)
        ctx.restore()
      } else {
        ctx.drawImage(im, dx, dy, dw, dh)
      }
    }
    const blob = await new Promise(r => c.toBlob(r, 'image/png'))
    if (!blob) throw new Error('toBlob failed')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mc-menu-${containerMeta.value?.file || 'menu'}-${W}x${H}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    ElMessage.success({ message: `已导出 ${W} × ${H} PNG`, duration: 1800 })
  } catch {
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

/* ============================================================
   键盘快捷键
   数据化，既能直接被 onKeydown 之外的地方引用，也能直接渲染成帮助面板。
   ============================================================ */
const SHORTCUT_GROUPS = [
  {
    name: '选择',
    items: [
      { keys: ['单击'], desc: '选中贴图' },
      { keys: ['Ctrl', '单击'], desc: '加选 / 减选' },
      { keys: ['Shift', '单击'], desc: '选中一段范围' },
      { keys: ['Ctrl', 'A'], desc: '全选' },
      { keys: ['Esc'], desc: '取消选择' }
    ]
  },
  {
    name: '位置 / 大小',
    items: [
      { keys: ['拖动'], desc: '移动（多选时整组一起动）' },
      { keys: ['←', '↑', '↓', '→'], desc: '微调 1px' },
      { keys: ['Shift', '方向键'], desc: '微调 10px' },
      { keys: ['C'], desc: '居中（多选时整组居中）' }
    ]
  },
  {
    name: '编辑',
    items: [
      { keys: ['Ctrl', 'D'], desc: '复制选中' },
      { keys: ['Delete'], desc: '删除选中' },
      { keys: ['F'], desc: '水平翻转' },
      { keys: ['Shift', 'F'], desc: '垂直翻转' }
    ]
  },
  {
    name: '层级',
    items: [
      { keys: [']'], desc: '上移一层' },
      { keys: ['['], desc: '下移一层' },
      { keys: ['Ctrl', ']'], desc: '移到最上层' },
      { keys: ['Ctrl', '['], desc: '移到最下层' }
    ]
  },
  {
    name: '画布',
    items: [
      { keys: ['+', '−'], desc: '放大 / 缩小' },
      { keys: ['0'], desc: '适应窗口' },
      { keys: ['?'], desc: '打开 / 关闭本面板' }
    ]
  }
]
const kbdOpen = ref(false)

function onKeydown(e) {
  if (e.target instanceof Element && e.target.matches('input, textarea, [contenteditable="true"]')) return
  const mod = e.ctrlKey || e.metaKey
  const k = e.key

  if (k === 'Escape') {
    if (kbdOpen.value) {
      kbdOpen.value = false
      return
    }
    clearSelection()
    return
  }
  if (k === '?') {
    e.preventDefault()
    kbdOpen.value = !kbdOpen.value
    return
  }
  if (mod && (k === 'a' || k === 'A')) {
    e.preventDefault()
    selectAll()
    return
  }
  if (mod && (k === 'd' || k === 'D')) {
    e.preventDefault()
    duplicateSelected()
    return
  }

  const has = selectedIds.value.size > 0
  if (k === 'Delete' || k === 'Backspace') {
    if (!has) return
    e.preventDefault()
    removeSelected()
    return
  }
  if (k === '[' || k === ']') {
    if (!has) return
    e.preventDefault()
    if (mod) layerToEdge(k === ']' ? 'top' : 'bottom')
    else layerMove(k === ']' ? 1 : -1)
    return
  }
  if (k === 'f' || k === 'F') {
    if (!has) return
    e.preventDefault()
    flipSelected(e.shiftKey ? 'y' : 'x')
    return
  }
  if (k === 'c' || k === 'C') {
    if (!has) return
    e.preventDefault()
    centerSelected()
    return
  }
  if (k === '+' || k === '=') {
    e.preventDefault()
    zoomBy(1)
    return
  }
  if (k === '-' || k === '_') {
    e.preventDefault()
    zoomBy(-1)
    return
  }
  if (k === '0') {
    e.preventDefault()
    refit()
    return
  }
  if (!has) return
  const step = e.shiftKey ? 10 : 1
  const delta = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step]
  }[k]
  if (delta) {
    e.preventDefault()
    // 方向键是精确微调，不走吸附（否则 1px 步长会被 4px 吸附吞掉）
    moveSelectionBy(delta[0], delta[1], false)
  }
}

/* ============================================================
   视图样式计算
   ============================================================ */
const stageRef = ref(null)

const stageStyle = computed(() => {
  const d = design.value
  const z = zoom.value
  const nat = natSize.value
  const chk = 'linear-gradient(45deg, rgba(128,128,128,0.24) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.24) 75%)'
  const layers = []
  if (containerImg.value && nat.w) {
    layers.push(`url("${containerImg.value.src}") ${-d.x * z}px ${-d.y * z}px / ${nat.w * z}px ${nat.h * z}px no-repeat`)
  }
  layers.push(`${chk} 0px 0px / 8px 8px repeat`)
  layers.push(`${chk} 4px 4px / 8px 8px repeat`)
  return {
    width: d.w * z + 'px',
    height: d.h * z + 'px',
    background: layers.join(', '),
    imageRendering: 'pixelated'
  }
})

function placedStyle(it) {
  const z = zoom.value
  return {
    left: it.x * z + 'px',
    top: it.y * z + 'px',
    width: it.w * z + 'px',
    height: it.h * z + 'px',
    transform: `scale(${it.flipX ? -1 : 1}, ${it.flipY ? -1 : 1})`
  }
}

const usedKeys = computed(() => new Set(items.value.map(i => i.key)))
const isUsed = rec => usedKeys.value.has(rec.key)

/* ============================================================
   卡片布局动画
   参数面板空态↔单选↔多选、图层列表有内容↔空态，都会改变卡片高度，
   进而把同列的其它卡片顶下去。这里统一把「位移 + 高度变化」补成动画。
   用 ResizeObserver 驱动而不是 watch：面板两态之间是 Transition out-in，
   内容要等 leave 动画播完才插入，靠数据和 nextTick 猜时机接不住。
   ============================================================ */
const layoutRef = ref(null)
useLayoutAnim(layoutRef, { selector: '.panel-card', duration: 340 })

/* ============================================================
   初始化
   ============================================================ */
onMounted(() => {
  // 预载贴图库，拖拽时能立刻拿到原始尺寸
  const all = [...mineList.value, ...vanillaList.value]
  all.forEach(r => imgReady(getImg(r.url)).catch(() => null))

  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)

  const def = containerList.value.find(c => c.file === 'generic_54') || containerList.value[0]
  if (def) containerKey.value = def.key

  // 列宽稳定后再自动适应一次（首次 fitZoom 可能量到还没布局完的宽度）
  if (typeof ResizeObserver !== 'undefined' && stageWrap.value) {
    fitObserver = new ResizeObserver(() => {
      const w = stageWrap.value?.clientWidth || 0
      if (Math.abs(w - lastFitW) > 8) fitZoom(false)
    })
    fitObserver.observe(stageWrap.value)
  }
  fitZoom(false)
})

let resizeTimer = null
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => fitZoom(false), 200)
}

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
  clearTimeout(resizeTimer)
  clearTimeout(fitTimer)
  fitObserver?.disconnect()
  endLibListen()
  onPointerUp()
})
</script>

<template>
  <div class="page-container">
    <div class="tool-header">
      <h1><el-icon class="h-icon"><Picture /></el-icon> MC 贴图菜单生成</h1>
      <p>左侧挑一个 MC 原版容器当底图，把右侧你画的按钮贴图拖进画布摆好位置，设定分辨率后导出 PNG。</p>
    </div>

    <div ref="layoutRef" class="menu-layout">
      <!-- ==================== 左栏：画布 + 输出设置 ==================== -->
      <div class="col-left">
        <!-- 画布 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">画布</span>
            <span class="panel-head-right">
              <button type="button" class="mini" title="缩小一档（− 键）" @click="zoomBy(-1)">−</button>
              <span class="zoom-val" :key="zoom" title="画布缩放（整数倍，贴图才不会糊）">{{ zoom }}×</span>
              <button type="button" class="mini" title="放大一档（+ 键）" @click="zoomBy(1)">＋</button>
              <button type="button" class="mini wide" title="按窗口大小自动适应（0 键）" @click="refit">适应</button>
              <el-popover
                v-model:visible="kbdOpen"
                placement="bottom-end"
                :width="288"
                trigger="click"
                popper-class="xy-popper kbd-popper"
              >
                <template #reference>
                  <button type="button" class="mini wide" title="查看全部快捷键（? 键）">快捷键</button>
                </template>
                <div class="kbd-panel">
                  <div v-for="g in SHORTCUT_GROUPS" :key="g.name" class="kbd-group">
                    <div class="kbd-group-name">{{ g.name }}</div>
                    <div v-for="s in g.items" :key="s.desc" class="kbd-row">
                      <span class="kbd-keys">
                        <kbd v-for="(k, i) in s.keys" :key="i">{{ k }}</kbd>
                      </span>
                      <span class="kbd-desc">{{ s.desc }}</span>
                    </div>
                  </div>
                </div>
              </el-popover>
            </span>
          </div>

          <div class="tip-line">
            <b>拖动</b>贴图库里的贴图到画布 · <b>单击</b>选中 · <b>Ctrl/Shift 单击</b>多选 · 拖动<b>移动</b> · 右下角圆点<b>缩放</b>
          </div>

          <div ref="stageWrap" class="stage-wrap">
            <div ref="stageRef" class="stage" :class="{ loading: loadingCtn }" :style="stageStyle" @pointerdown="onStageDown">
              <div
                v-for="it in items"
                :key="it.id"
                class="placed"
                :class="{ sel: selectedIds.has(it.id) }"
                :style="placedStyle(it)"
                :title="`${it.label} · ${it.x},${it.y} · ${it.w}×${it.h}`"
                @pointerdown="onItemDown(it, $event)"
              >
                <img :src="it.url" :alt="it.label" draggable="false" />
                <span
                  v-if="single && single.id === it.id"
                  class="rz"
                  title="拖动缩放（多选时不显示手柄）"
                  @pointerdown="onHandleDown(it, $event)"
                />
              </div>
              <div v-if="!containerImg" class="stage-empty">正在载入容器贴图…</div>
              <div v-else-if="!items.length" class="stage-empty soft">拖一张贴图进来吧～</div>
            </div>
          </div>
        </div>

        <!-- 输出设置 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">输出设置</span>
            <span class="chip">底图 {{ design.w }} × {{ design.h }}</span>
          </div>

          <div class="ctl-list">
            <div class="ctl-row">
              <span class="ctl-k">容器底图</span>
              <div class="ctl-v">
                <el-select
                  v-model="containerKey"
                  filterable
                  size="small"
                  class="ctn-select xy-field"
                  popper-class="xy-popper"
                  placeholder="选择一个 MC 容器"
                >
                  <el-option v-for="c in containerList" :key="c.key" :value="c.key" :label="c.label">
                    <span class="ctn-opt">
                      <img :src="c.url" alt="" class="ctn-thumb" />
                      <span class="ctn-name">{{ c.label }}</span>
                    </span>
                  </el-option>
                </el-select>
              </div>
            </div>

            <div class="ctl-row">
              <span class="ctl-k">底图范围</span>
              <div class="ctl-v">
                <div ref="cropSegRef" class="seg">
                  <span class="seg-pill" :class="{ ready: !!cropSegPill }" :style="cropSegPill || {}" aria-hidden="true" />
                  <button
                    v-for="m in CROP_MODES"
                    :key="m.id"
                    type="button"
                    :class="{ on: cropMode === m.id }"
                    :title="m.hint"
                    @click="cropMode = m.id"
                  >{{ m.label }}</button>
                </div>
              </div>
            </div>

            <div class="ctl-row">
              <span class="ctl-k">对齐吸附</span>
              <div class="ctl-v">
                <el-input-number
                  v-model="snapPx"
                  :min="1"
                  :max="64"
                  :controls="false"
                  size="small"
                  class="xy-field is-num snap-in"
                  title="贴图对齐的像素步长"
                  @change="onSnapChange"
                />
                <span class="res-unit">px</span>
                <el-switch v-model="snapOn" size="small" class="xy-switch" title="关掉后可以停在任意整数像素上" />
                <span class="ctl-hint">拖动时的对齐步长</span>
              </div>
            </div>

            <div class="ctl-row">
              <span class="ctl-k">导出分辨率</span>
              <div class="ctl-v">
                <el-input-number
                  v-model="outW"
                  :min="1"
                  :max="8192"
                  :controls="false"
                  size="small"
                  class="xy-field is-num res-in"
                  @change="onWChange"
                />
                <span class="res-x">×</span>
                <el-input-number
                  v-model="outH"
                  :min="1"
                  :max="8192"
                  :controls="false"
                  size="small"
                  class="xy-field is-num res-in"
                  @change="onHChange"
                />
                <span class="res-unit">px</span>
                <div class="seg kbtns">
                  <button
                    v-for="k in [1, 2, 3, 4]"
                    :key="k"
                    type="button"
                    :title="`按底图的 ${k} 倍尺寸导出`"
                    @click="applyScale(k)"
                  >×{{ k }}</button>
                </div>
              </div>
            </div>

            <div class="ctl-row">
              <span class="ctl-k">锁定比例</span>
              <div class="ctl-v">
                <el-switch v-model="lockRatio" size="small" class="xy-switch" title="改一边时自动算另一边" />
                <span class="ctl-hint">{{ exportScaleText }}</span>
              </div>
            </div>
          </div>

          <div class="tb-actions">
            <span class="tb-tags">
              <span class="chip">{{ items.length }} 个贴图</span>
              <span v-if="selCount === 1" class="chip">选中 {{ single.label }}</span>
              <span v-else-if="selCount > 1" class="chip">已选 {{ selCount }} 个</span>
            </span>
            <button type="button" class="btn" :disabled="!selCount" @click="removeSelected">删除选中</button>
            <button type="button" class="btn" :disabled="!items.length" @click="clearAll">清空画布</button>
            <button type="button" class="btn primary" :disabled="exporting" @click="exportPng">
              <el-icon v-if="exporting" class="is-loading"><Loading /></el-icon>
              <el-icon v-else><Download /></el-icon>
              {{ exporting ? '导出中…' : '导出 PNG' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== 右栏：贴图参数 + 图层 + 贴图库 ==================== -->
      <div class="col-right">
        <!-- 选中贴图的参数 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">贴图参数</span>
            <span v-if="selCount === 1" class="chip">{{ single.label }}</span>
            <span v-else-if="selCount > 1" class="chip">已选 {{ selCount }} 个</span>
            <span v-else class="chip">未选中</span>
          </div>

          <Transition name="param" mode="out-in">
          <div v-if="!selCount" key="empty" class="param-empty">
            在画布上<b>单击</b>一个贴图，就能在这里精确调整它的位置、大小和层级～<br />
            按住 <b>Ctrl</b> 单击可以多选，多选后能批量对齐。
          </div>

          <!-- 单个：完整参数 -->
          <div v-else-if="selCount === 1" key="one" class="param-body">
            <div class="param-preview">
              <div class="param-thumb">
                <img
                  :src="single.url"
                  alt=""
                  :style="{ transform: `scale(${single.flipX ? -1 : 1}, ${single.flipY ? -1 : 1})` }"
                />
              </div>
              <div class="param-meta">
                <div class="param-name">{{ single.label }}</div>
                <div class="param-sub">尺寸 {{ single.w }} × {{ single.h }} px</div>
                <div class="param-sub">第 {{ singleIndex + 1 }} / {{ items.length }} 层</div>
              </div>
            </div>

            <div class="param-grid">
              <label class="pf">
                <span>X 坐标</span>
                <el-input-number
                  :model-value="single.x"
                  :min="0"
                  :controls="false"
                  size="small"
                  class="xy-field is-num"
                  @change="v => setPos('x', v)"
                />
              </label>
              <label class="pf">
                <span>Y 坐标</span>
                <el-input-number
                  :model-value="single.y"
                  :min="0"
                  :controls="false"
                  size="small"
                  class="xy-field is-num"
                  @change="v => setPos('y', v)"
                />
              </label>
              <label class="pf">
                <span>宽度</span>
                <el-input-number
                  :model-value="single.w"
                  :min="1"
                  :controls="false"
                  size="small"
                  class="xy-field is-num"
                  @change="v => setSize('w', v)"
                />
              </label>
              <label class="pf">
                <span>高度</span>
                <el-input-number
                  :model-value="single.h"
                  :min="1"
                  :controls="false"
                  size="small"
                  class="xy-field is-num"
                  @change="v => setSize('h', v)"
                />
              </label>
            </div>

            <div class="param-toggle">
              <el-switch v-model="itemLockRatio" size="small" class="xy-switch" title="改宽/高时自动按原比例算另一边" />
              <span>改尺寸时保持原比例</span>
            </div>

            <div class="param-ops">
              <button type="button" class="btn sm" title="居中（C）" @click="centerSelected">居中</button>
              <button type="button" class="btn sm" :class="{ on: single.flipX }" title="水平镜像（F）" @click="flipSelected('x')">水平翻转</button>
              <button type="button" class="btn sm" :class="{ on: single.flipY }" title="垂直镜像（Shift+F）" @click="flipSelected('y')">垂直翻转</button>
              <button type="button" class="btn sm" :disabled="singleIndex >= items.length - 1" title="往更上层移（] ）" @click="layerMove(1)">上移一层</button>
              <button type="button" class="btn sm" :disabled="singleIndex <= 0" title="往更下层移（[ ）" @click="layerMove(-1)">下移一层</button>
              <button type="button" class="btn sm" title="原位附近复制一个（Ctrl+D）" @click="duplicateSelected">复制</button>
              <button type="button" class="btn sm danger" @click="removeSelected">删除</button>
            </div>
          </div>

          <!-- 多个：批量操作 -->
          <div v-else key="many" class="param-body">
            <div class="param-empty multi">
              已选中 <b>{{ selCount }}</b> 个贴图 · 拖动任意一个会<b>整组一起移动</b>
            </div>

            <div class="align-grid">
              <button
                v-for="a in ALIGN_OPS"
                :key="a.id"
                type="button"
                class="btn sm"
                :title="a.label"
                @click="alignItems(a.id)"
              >
                <span class="align-icon">{{ a.icon }}</span>{{ a.label }}
              </button>
            </div>

            <div class="param-ops">
              <button type="button" class="btn sm" title="水平方向等间距" @click="distribute('x')">水平分布</button>
              <button type="button" class="btn sm" title="垂直方向等间距" @click="distribute('y')">垂直分布</button>
              <button type="button" class="btn sm" title="居中（C）" @click="centerSelected">整组居中</button>
              <button type="button" class="btn sm" title="水平镜像（F）" @click="flipSelected('x')">水平翻转</button>
              <button type="button" class="btn sm" title="垂直镜像（Shift+F）" @click="flipSelected('y')">垂直翻转</button>
              <button type="button" class="btn sm" title="移到最上层（Ctrl+]）" @click="layerToEdge('top')">置顶</button>
              <button type="button" class="btn sm" title="移到最下层（Ctrl+[）" @click="layerToEdge('bottom')">置底</button>
              <button type="button" class="btn sm" title="复制选中（Ctrl+D）" @click="duplicateSelected">复制</button>
              <button type="button" class="btn sm danger" @click="removeSelected">删除</button>
            </div>
          </div>
          </Transition>
        </div>

        <!-- 图层 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">图层</span>
            <span class="panel-head-right">
              <span class="chip">{{ items.length }} 层</span>
              <button type="button" class="mini wide" :disabled="!items.length" title="全选（Ctrl+A）" @click="selectAll">全选</button>
            </span>
          </div>

          <div v-if="!items.length" class="param-empty">
            画布上还没有贴图～ 从下面的贴图库拖一张进来，它就会出现在这里。
          </div>

          <template v-else>
            <div class="tip-line small">
              列表<b>最上面 = 画布最上层</b> · 按住 <b>Ctrl</b> 单击多选 · 按住 <b>Shift</b> 单击选一段
            </div>

            <div class="lyr-list">
              <div
                v-for="(it, i) in layersTopFirst"
                :key="it.id"
                class="lyr"
                :class="{ on: selectedIds.has(it.id) }"
                :title="`${it.label} · ${it.x},${it.y} · ${it.w}×${it.h}`"
                @click="pickByEvent(it.id, $event)"
              >
                <span class="lyr-idx">{{ items.length - i }}</span>
                <span class="lyr-thumb">
                  <img
                    :src="it.url"
                    alt=""
                    :style="{ transform: `scale(${it.flipX ? -1 : 1}, ${it.flipY ? -1 : 1})` }"
                  />
                </span>
                <span class="lyr-info">
                  <span class="lyr-name">{{ it.label }}</span>
                  <span class="lyr-size">{{ it.w }} × {{ it.h }}</span>
                </span>
                <span class="lyr-ops">
                  <button
                    type="button"
                    class="lyr-op"
                    title="上移一层"
                    :disabled="i === 0"
                    @click.stop="selectOnly(it.id); layerMove(1)"
                  >↑</button>
                  <button
                    type="button"
                    class="lyr-op"
                    title="下移一层"
                    :disabled="i === layersTopFirst.length - 1"
                    @click.stop="selectOnly(it.id); layerMove(-1)"
                  >↓</button>
                  <button
                    type="button"
                    class="lyr-op danger"
                    title="删除这一层"
                    @click.stop="removeItem(it)"
                  >✕</button>
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- 贴图库 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">贴图库</span>
            <span class="chip">{{ mineList.length + vanillaList.length }} 个</span>
          </div>

          <div class="lib-scroll">
            <div class="lib-group">
              <div class="lib-group-head">
                <span>我的贴图</span>
                <span class="lib-count">{{ mineList.length }}</span>
              </div>
              <div v-if="!mineList.length" class="lib-empty">
                还没有贴图呢～把自己画的 PNG 放进项目根目录的 <code>mine/</code>，刷新就会出现
              </div>
              <div v-else class="lib-grid">
                <button
                  v-for="r in mineList"
                  :key="r.key"
                  type="button"
                  class="lib-item"
                  :class="{ used: isUsed(r) }"
                  :title="`${r.label}（拖到画布，或单击放到正中央）`"
                  @pointerdown="onLibDown(r, $event)"
                >
                  <img :src="r.url" :alt="r.label" draggable="false" />
                  <span class="lib-name">{{ r.label }}</span>
                </button>
              </div>
            </div>

            <div class="lib-group">
              <div class="lib-group-head">
                <span>MC 原版贴图</span>
                <span class="lib-count">{{ vanillaList.length }}</span>
              </div>
              <div class="lib-grid">
                <button
                  v-for="r in vanillaList"
                  :key="r.key"
                  type="button"
                  class="lib-item"
                  :class="{ used: isUsed(r) }"
                  :title="`${r.label}（拖到画布，或单击放到正中央）`"
                  @pointerdown="onLibDown(r, $event)"
                >
                  <img :src="r.url" :alt="r.label" draggable="false" />
                  <span class="lib-name">{{ r.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 拖动中跟随指针的幽灵 -->
    <div v-if="libDrag" class="drag-ghost" :class="{ over: libDrag.over }" :style="{ left: libDrag.x + 'px', top: libDrag.y + 'px' }">
      <img :src="libDrag.url" alt="" />
    </div>
  </div>
</template>

<style scoped>
/* ==================== 头部 ==================== */
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
.tool-header .h-icon {
  color: var(--primary);
}
.tool-header p {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

/* ==================== 通用卡片件（与颜色工具页一致） ==================== */
.panel-card {
  padding: 18px 20px;
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
.panel-head-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tip-line {
  font-size: 12.5px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border: 1px dashed color-mix(in srgb, var(--primary) 40%, transparent);
  padding: 7px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  line-height: 1.6;
}
.tip-line.small {
  font-size: 11.5px;
  padding: 6px 10px;
  margin-bottom: 10px;
}
.tip-line b {
  color: var(--primary);
}
.tip-line code,
.lib-empty code,
.param-empty code {
  font-family: Consolas, monospace;
  font-size: 11.5px;
  background: var(--chip-bg);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--primary);
}

/* ==================== 站点风按钮 ==================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 31px;
  padding: 0 15px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}
.btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}
.btn:active:not(:disabled) {
  transform: translateY(0) scale(0.96);
  transition-duration: 0.08s;
}
.btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
.btn.on {
  border-color: var(--primary);
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  font-weight: 600;
}
.btn.primary {
  border-color: transparent;
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 10px color-mix(in srgb, var(--primary) 38%, transparent);
}
.btn.primary:hover:not(:disabled) {
  color: #fff;
  filter: brightness(1.08);
}
.btn.danger {
  border-color: color-mix(in srgb, #ef4444 45%, var(--card-border));
  color: #ef4444;
}
.btn.danger:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
  background: color-mix(in srgb, #ef4444 12%, transparent);
}
.btn.sm {
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
}
.align-icon {
  font-size: 13px;
  line-height: 1;
}

/* ==================== 输出设置（紧凑行式） ==================== */
.ctl-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.ctl-row {
  display: grid;
  /* 标签定宽 → 右边控件左边缘全部对齐，比松散的网格整齐得多 */
  grid-template-columns: 68px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}
.ctl-k {
  font-size: 12.5px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.ctl-v {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
.ctl-hint {
  font-size: 11.5px;
  color: var(--text-muted);
}
.tb-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 24px;
  /* margin-right:auto 比 justify-content:space-between 更稳：
     换行时标签会独立占一行，不会和按钮互相拉扯 */
  margin-right: auto;
}
.tb-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  margin-top: 14px;
  border-top: 1px dashed var(--card-border);
}

/* 容器选择 */
.ctn-select {
  width: 100%;
  max-width: 240px;
}
.ctn-opt {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ctn-thumb {
  width: 22px;
  height: 22px;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
}
.ctn-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 分段按钮（与颜色工具页 mode-tabs 同一观感 + 同一个滑动指示块） */
.seg {
  position: relative;
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  width: fit-content;
}
/* 滑动指示块：宽度/位移由 usePillSlider 量取按钮真实尺寸后写进内联样式。
   纯装饰，不参与命中（pointer-events:none），否则会挡住按钮点击。 */
.seg-pill {
  position: absolute;
  z-index: 0;
  left: 3px;
  top: 3px;
  bottom: 3px;
  width: calc(50% - 5px); /* 首帧兜底，挂载后由内联宽度覆盖 */
  border-radius: 7px;
  background: var(--primary);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 40%, transparent);
  opacity: 0; /* 还没量到尺寸时先不出现，避免首帧闪一下 */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease;
  pointer-events: none;
}
.seg-pill.ready {
  opacity: 1;
}
.seg button {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  padding: 4px 11px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: color 0.22s ease, transform 0.12s ease;
}
.seg button:hover {
  color: var(--primary);
}
.seg button:active {
  transform: scale(0.94);
}
/* 选中态：文字压在指示块上，按钮自身不画背景（背景交给指示块） */
.seg button.on {
  color: #fff;
  font-weight: 600;
}
.seg button.on:hover {
  color: #fff;
}
.seg.kbtns button {
  min-width: 36px;
  padding: 3px 8px;
}
/* 倍率按钮（×1~×4）不是选择态而是「动作」，没有指示块：
   点下去给一个明显的按下回弹，点完立刻知道生效了 */
.seg.kbtns button:active {
  background: var(--primary);
  color: #fff;
}

/* 行内控件排布 */
.res-in {
  width: 74px;
}
.snap-in {
  width: 58px;
}
.res-x,
.res-unit {
  font-size: 12px;
  color: var(--text-muted);
}

/* 缩放小按钮 */
.mini {
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-secondary);
  border-radius: 7px;
  width: 26px;
  height: 24px;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
  display: grid;
  place-items: center;
  transition: all 0.18s ease;
}
.mini:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}
.mini:active:not(:disabled) {
  transform: scale(0.9);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.mini:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
.mini.wide {
  width: auto;
  padding: 0 9px;
  font-size: 12px;
}
.zoom-val {
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: center;
  /* 数字换值时很短的一次放大，缩放操作有回馈 */
  animation: zoomIn 0.22s ease;
}
@keyframes zoomIn {
  from { transform: scale(0.78); opacity: 0.5; }
}

/* ==================== 快捷键面板 ==================== */
.kbd-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: min(64vh, 480px);
  overflow-y: auto;
}
.kbd-group-name {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 6px;
}
.kbd-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 12px;
}
.kbd-keys {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  min-width: 92px;
}
.kbd-keys kbd {
  font-family: inherit;
  font-size: 11px;
  line-height: 1.5;
  padding: 1px 6px;
  border-radius: 5px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  white-space: nowrap;
}
.kbd-desc {
  color: var(--text-secondary);
}

/* ==================== 布局 ==================== */
.menu-layout {
  display: grid;
  /* 画布在左且更宽；minmax(0,…) 防止内容撑破格子 */
  grid-template-columns: minmax(0, 1.42fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ==================== 画布 ==================== */
.stage-wrap {
  display: flex;
  justify-content: center;
  justify-content: safe center;
  align-items: flex-start;
  /* 留白必须容得下缩放手柄向外伸出的一圈（手柄 -5px + 命中区伪元素 -9px = 14px），
     否则选中一张贴到边上的贴图，手柄就会溢出这个滚动容器，
     画布右侧/底部会凭空多出一条滚动条。 */
  padding: 16px;
  min-height: 200px;
  /* 画布超过这个高度就在卡片内部滚动，页面不会被拉得特别长 */
  max-height: min(62vh, 620px);
  overflow: auto;
}
.stage {
  position: relative;
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--card-border);
  /* 关掉触摸拖动时的页面滚动/缩放手势，画布内操作才顺 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.stage.loading {
  /* 底图还在解码：轻微呼吸而不是死盯着半透明 */
  opacity: 0.55;
  animation: stagePulse 1.1s ease-in-out infinite;
}
@keyframes stagePulse {
  50% { opacity: 0.3; }
}
.stage-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--text-muted);
  pointer-events: none;
}
.stage-empty.soft {
  color: color-mix(in srgb, var(--text-muted) 75%, transparent);
  /* 空画布提示轻轻浮动，引导"拖一张进来" */
  animation: hintFloat 2s ease-in-out infinite;
}
@keyframes hintFloat {
  50% { transform: translateY(-4px); }
}

/* 画布上的贴图 */
.placed {
  position: absolute;
  cursor: grab;
  outline: 1px dashed transparent;
  outline-offset: 0;
  transition: outline-color 0.16s ease, outline-offset 0.16s ease;
  /* 新拖进来的贴图「弹」一下，能立刻看清落在了哪里。
     用独立的 scale 属性而不是 transform —— transform 被内联样式占着（水平/垂直翻转），
     两者是各自独立的属性，互不覆盖（CSS 会按 translate → rotate → scale → transform 依次合成）。 */
  animation: placedIn 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes placedIn {
  from { opacity: 0; scale: 0.72; }
}
.placed img {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  pointer-events: none;
}
.placed.sel {
  outline-color: var(--primary);
  /* 选中时虚线框向外让开一点，像"拎起来"了 */
  outline-offset: 3px;
}
.placed:active {
  cursor: grabbing;
}
/* 右下角缩放手柄：外圈用白色描边，深浅底都能看见 */
.rz {
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--primary);
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
  cursor: nwse-resize;
  touch-action: none;
  /* 跟着选中态一起出现，而不是硬邦邦地闪出来 */
  animation: rzIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition: scale 0.14s ease;
}
@keyframes rzIn {
  from { opacity: 0; scale: 0.3; }
}
.rz:hover {
  scale: 1.2;
}
.rz:active {
  scale: 1.35;
}
/* 指尖比鼠标粗，把命中区往外扩一圈。
   外扩量必须 ≤ 画布四周的留白（否则贴边时会撑出滚动条）。 */
.rz::before {
  content: '';
  position: absolute;
  inset: -9px;
}

/* ==================== 图层面板 ==================== */
.lyr-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 236px;
  overflow-y: auto;
  padding-right: 3px;
}
.lyr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  border-radius: 9px;
  border: 1px solid transparent;
  background: var(--chip-bg);
  cursor: pointer;
  /* 新加一层从左侧滑进来，一眼看出"刚多了一层" */
  animation: layerIn 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
@keyframes layerIn {
  from { opacity: 0; transform: translateX(-8px); }
}
.lyr:hover {
  border-color: color-mix(in srgb, var(--primary) 45%, transparent);
}
.lyr.on {
  background: color-mix(in srgb, var(--primary) 13%, transparent);
  border-color: var(--primary);
}
.lyr-idx {
  flex-shrink: 0;
  width: 18px;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  text-align: center;
}
.lyr.on .lyr-idx {
  color: var(--primary);
  font-weight: 700;
}
.lyr-thumb {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.lyr-thumb img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}
.lyr-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.lyr-name {
  font-size: 12px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lyr-size {
  font-size: 10.5px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.lyr-ops {
  flex-shrink: 0;
  display: inline-flex;
  gap: 2px;
  /* 默认淡出，hover / 选中时才明显 —— 列表保持干净 */
  opacity: 0.35;
  transition: opacity 0.15s ease;
}
.lyr:hover .lyr-ops,
.lyr.on .lyr-ops {
  opacity: 1;
}
.lyr-op {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 5px;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
  display: grid;
  place-items: center;
  transition: background-color 0.15s ease, color 0.15s ease, scale 0.12s ease;
}
.lyr-op:hover:not(:disabled) {
  background: var(--card-bg);
  color: var(--primary);
  scale: 1.12;
}
.lyr-op:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.lyr-op.danger:hover {
  color: #ef4444;
}

/* ==================== 贴图参数面板 ==================== */
.param-empty {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.7;
  background: var(--chip-bg);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}
.param-empty.multi {
  text-align: left;
  padding: 11px 13px;
  margin-bottom: 12px;
}
.param-empty b {
  color: var(--primary);
}
/* 参数面板「空态 ↔ 有选中 ↔ 多选」切换：淡入 + 轻微上浮 */
.param-body {
  min-width: 0;
}
.param-enter-active {
  transition: opacity 0.22s ease, transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}
.param-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.param-enter-from { opacity: 0; transform: translateY(6px); }
.param-leave-to { opacity: 0; transform: translateY(-4px); }
.param-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  background: var(--chip-bg);
  margin-bottom: 14px;
  min-width: 0;
}
.param-thumb {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 9px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.param-thumb img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}
.param-meta {
  min-width: 0;
}
.param-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.param-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  margin-top: 3px;
}
.param-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
.pf {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.pf > span {
  font-size: 11.5px;
  color: var(--text-muted);
}
.param-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}
.param-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--card-border);
}
.align-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

/* ==================== 贴图库 ==================== */
.lib-scroll {
  max-height: 46vh;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.lib-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--card-border);
}
.lib-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--chip-bg);
  padding: 1px 7px;
  border-radius: 999px;
  font-weight: 500;
}
.lib-empty {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.7;
  background: var(--chip-bg);
  border-radius: 10px;
  padding: 12px 14px;
}
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 8px;
}
.lib-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px 6px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  cursor: grab;
  font-family: inherit;
  min-width: 0;
  transition: all 0.18s ease;
  /* 关掉触屏长按选中/拨动，指针拖动才不会被系统手势打断 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.lib-item:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
.lib-item:active {
  transform: translateY(0) scale(0.96);
  border-color: var(--primary);
}
.lib-item.used {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--card-border));
  background: color-mix(in srgb, var(--primary) 7%, var(--card-bg));
}
.lib-item img {
  width: 100%;
  height: 36px;
  object-fit: contain;
  image-rendering: pixelated;
  pointer-events: none;
}
.lib-name {
  font-size: 10.5px;
  color: var(--text-secondary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

/* ==================== 拖动幽灵 ==================== */
.drag-ghost {
  position: fixed;
  z-index: 4000;
  transform: translate(-50%, -50%);
  pointer-events: none;
  padding: 3px;
  border-radius: 6px;
  border: 1px dashed transparent;
  /* 用独立的 scale 属性：transform 被居中占着，两者互不覆盖 */
  animation: ghostIn 0.16s ease-out;
  transition: border-color 0.15s ease, background-color 0.15s ease, scale 0.15s ease;
}
@keyframes ghostIn {
  from { opacity: 0.3; scale: 0.82; }
}
/* 拖到画布上方时轻微放大，明确"这里可以放" */
.drag-ghost.over {
  scale: 1.04;
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.drag-ghost img {
  display: block;
  max-width: 140px;
  max-height: 140px;
  image-rendering: pixelated;
  opacity: 0.9;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
}

/* ==================== 窄屏 ==================== */
@media (max-width: 980px) {
  .menu-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .lib-scroll {
    max-height: 40vh;
  }
  .lyr-list {
    max-height: 200px;
  }
}
@media (max-width: 640px) {
  .tool-header h1 {
    font-size: 21px;
  }
  .tool-header p {
    font-size: 13px;
  }
  .panel-card {
    padding: 14px 14px;
  }
  .ctl-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
    align-items: start;
  }
  .ctn-select {
    max-width: 100%;
  }
  .tb-actions {
    justify-content: stretch;
  }
  .tb-actions .btn {
    flex: 1;
  }
  .lib-grid {
    grid-template-columns: repeat(auto-fill, minmax(66px, 1fr));
  }
  .lib-item img {
    height: 30px;
  }
  .param-ops .btn {
    flex: 1 1 calc(50% - 7px);
  }
  .align-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 触屏：hover 态会粘滞，去掉上浮和变色 */
@media (hover: none) {
  .lib-item:hover {
    transform: none;
    border-color: var(--card-border);
    box-shadow: none;
  }
  .lib-item.used:hover {
    border-color: color-mix(in srgb, var(--primary) 45%, var(--card-border));
  }
  .mini:hover:not(:disabled),
  .btn:hover:not(:disabled) {
    transform: none;
    border-color: var(--card-border);
    color: var(--text-secondary);
  }
  /* 触屏没有 hover，缩放手柄不要粘在放大态上 */
  .rz:hover {
    scale: 1;
  }
  /* 触屏也没有 hover，图层的操作按钮常显 */
  .lyr-ops {
    opacity: 1;
  }
}
</style>
