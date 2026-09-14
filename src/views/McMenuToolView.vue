<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

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
    selectedId.value = null
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

/* ============================================================
   画布缩放
   一律用整数倍：像素贴图在非整数倍下会出现「有些像素 2px、有些 3px」的
   不均感（image-rendering: pixelated 也无法救），MC 材质是像素艺术，
   整数倍才是正确观感。
   ============================================================ */
const zoom = ref(2)
const ZOOM_MIN = 1
const ZOOM_MAX = 16
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
    const availW = Math.max(120, el.clientWidth - 12)
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
   画布上的贴图
   ============================================================ */
const items = ref([])
let itemSeq = 0
const selectedId = ref(null)
const selected = computed(() => items.value.find(i => i.id === selectedId.value) || null)
const selectedIndex = computed(() => items.value.findIndex(i => i.id === selectedId.value))

/* ---------- 对齐吸附 ---------- */
const snapOn = ref(true)
const snapPx = ref(1) // 默认 1px，可在工具条里自定义
function onSnapChange(v) {
  const n = Math.max(1, Math.min(64, Math.round(Number(v) || 1)))
  snapPx.value = n
}
const snap = v => {
  if (!snapOn.value) return Math.round(v)
  return Math.round(v / snapPx.value) * snapPx.value
}
const clampAxis = (v, size, total) => Math.max(0, Math.min(Math.max(0, total - size), v))

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
    x: snap(clampAxis(cx - w / 2, w, d.w)),
    y: snap(clampAxis(cy - h / 2, h, d.h)),
    w,
    h,
    flipX: false,
    flipY: false
  }
  items.value.push(it)
  selectedId.value = it.id
  return it
}

function bringToFront(it) {
  const i = items.value.indexOf(it)
  if (i >= 0 && i !== items.value.length - 1) {
    items.value.splice(i, 1)
    items.value.push(it)
  }
}

function removeItem(it) {
  items.value = items.value.filter(o => o.id !== it.id)
  if (selectedId.value === it.id) selectedId.value = null
}
function removeSelected() {
  if (selected.value) removeItem(selected.value)
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
  selectedId.value = null
}

/* ---------- 参数面板（精确调整选中贴图） ---------- */
const itemLockRatio = ref(true)

function setPos(axis, v) {
  const it = selected.value
  if (!it) return
  const n = Number(v)
  if (!Number.isFinite(n)) return
  const d = design.value
  if (axis === 'x') it.x = snap(clampAxis(n, it.w, d.w))
  else it.y = snap(clampAxis(n, it.h, d.h))
}

function setSize(axis, v) {
  const it = selected.value
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
  it.x = snap(clampAxis(it.x, it.w, d.w))
  it.y = snap(clampAxis(it.y, it.h, d.h))
}

function centerSelected() {
  const it = selected.value
  if (!it) return
  const d = design.value
  it.x = snap(clampAxis(Math.round((d.w - it.w) / 2), it.w, d.w))
  it.y = snap(clampAxis(Math.round((d.h - it.h) / 2), it.h, d.h))
}

function flipSelected(axis) {
  const it = selected.value
  if (!it) return
  if (axis === 'x') it.flipX = !it.flipX
  else it.flipY = !it.flipY
}

function duplicateSelected() {
  const it = selected.value
  if (!it) return
  const d = design.value
  const copy = {
    ...it,
    id: ++itemSeq,
    x: snap(clampAxis(it.x + 2, it.w, d.w)),
    y: snap(clampAxis(it.y + 2, it.h, d.h))
  }
  items.value.push(copy)
  selectedId.value = copy.id
}

// dir = 1 上移一层（更靠前），-1 下移一层
function layerMove(dir) {
  const i = selectedIndex.value
  const j = i + dir
  if (i < 0 || j < 0 || j >= items.value.length) return
  const [it] = items.value.splice(i, 1)
  items.value.splice(j, 0, it)
}

/* ---------- 拖动 / 缩放（指针事件，鼠标与触屏统一） ---------- */
let drag = null

function designPoint(e) {
  const rect = stageRef.value.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / zoom.value,
    y: (e.clientY - rect.top) / zoom.value
  }
}

function startDrag(mode, it, e) {
  e.preventDefault()
  e.stopPropagation()
  selectedId.value = it.id
  bringToFront(it)
  const p = designPoint(e)
  drag = { mode, id: it.id, sx: p.x, sy: p.y, ox: it.x, oy: it.y, ow: it.w, oh: it.h }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}
const onItemDown = (it, e) => startDrag('move', it, e)
const onHandleDown = (it, e) => startDrag('resize', it, e)

function onPointerMove(e) {
  if (!drag) return
  const it = items.value.find(i => i.id === drag.id)
  if (!it) return
  const d = design.value
  const p = designPoint(e)
  const dx = p.x - drag.sx
  const dy = p.y - drag.sy
  if (drag.mode === 'move') {
    it.x = snap(clampAxis(drag.ox + dx, it.w, d.w))
    it.y = snap(clampAxis(drag.oy + dy, it.h, d.h))
  } else {
    it.w = Math.max(1, Math.min(d.w, snap(Math.max(1, drag.ow + dx))))
    it.h = Math.max(1, Math.min(d.h, snap(Math.max(1, drag.oh + dy))))
    it.x = snap(clampAxis(it.x, it.w, d.w))
    it.y = snap(clampAxis(it.y, it.h, d.h))
  }
}

function onPointerUp() {
  if (!drag) return
  drag = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function onStageDown() {
  selectedId.value = null
}

/* ---------- 键盘：Delete 删除、Esc 取消、方向键微调 ---------- */
function onKeydown(e) {
  if (e.target instanceof Element && e.target.matches('input, textarea, [contenteditable="true"]')) return
  if (e.key === 'Escape') {
    selectedId.value = null
    return
  }
  const it = selected.value
  if (!it) return
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    removeSelected()
    return
  }
  const step = e.shiftKey ? 10 : 1
  const d = design.value
  const map = {
    ArrowLeft: () => { it.x = clampAxis(it.x - step, it.w, d.w) },
    ArrowRight: () => { it.x = clampAxis(it.x + step, it.w, d.w) },
    ArrowUp: () => { it.y = clampAxis(it.y - step, it.h, d.h) },
    ArrowDown: () => { it.y = clampAxis(it.y + step, it.h, d.h) }
  }
  if (map[e.key]) {
    e.preventDefault()
    map[e.key]()
  }
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

watch(design, d => {
  outW.value = d.w
  outH.value = d.h
})
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

    <div class="menu-layout">
      <!-- ==================== 左栏：画布 + 输出设置 ==================== -->
      <div class="col-left">
        <!-- 画布 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">画布</span>
            <span class="panel-head-right">
              <button type="button" class="mini" title="缩小一档" @click="zoomBy(-1)">−</button>
              <span class="zoom-val" title="画布缩放（整数倍，贴图才不会糊）">{{ zoom }}×</span>
              <button type="button" class="mini" title="放大一档" @click="zoomBy(1)">＋</button>
              <button type="button" class="mini wide" title="按窗口大小自动适应" @click="refit">适应</button>
            </span>
          </div>

          <div class="tip-line">
            <b>拖动</b>贴图库里的贴图到画布 · <b>单击</b>选中 · 拖动<b>移动</b> · 右下角圆点<b>缩放</b> · <b>Delete</b> 删除 · <b>方向键</b>微调（按住 Shift ×10）
          </div>

          <div ref="stageWrap" class="stage-wrap">
            <div ref="stageRef" class="stage" :class="{ loading: loadingCtn }" :style="stageStyle" @pointerdown="onStageDown">
              <div
                v-for="it in items"
                :key="it.id"
                class="placed"
                :class="{ sel: selectedId === it.id }"
                :style="placedStyle(it)"
                :title="`${it.label} · ${it.x},${it.y} · ${it.w}×${it.h}`"
                @pointerdown="onItemDown(it, $event)"
              >
                <img :src="it.url" :alt="it.label" draggable="false" />
                <span v-if="selectedId === it.id" class="rz" @pointerdown="onHandleDown(it, $event)" />
              </div>
              <div v-if="!containerImg" class="stage-empty">正在载入容器贴图…</div>
              <div v-else-if="!items.length" class="stage-empty soft">拖一张贴图进来吧～</div>
            </div>
          </div>

          <!-- 图层条：点击选中、× 删除 -->
          <div v-if="items.length" class="layer-bar">
            <span class="layer-bar-label">图层</span>
            <button
              v-for="it in items"
              :key="it.id"
              type="button"
              class="layer-chip"
              :class="{ on: selectedId === it.id }"
              :title="`${it.label} · ${it.x},${it.y} · ${it.w}×${it.h}`"
              @click="selectedId = it.id"
            >
              <img :src="it.url" alt="" />
              <span class="layer-name">{{ it.label }}</span>
              <span class="layer-x" title="删除这一层" @click.stop="removeItem(it)">×</span>
            </button>
          </div>
        </div>

        <!-- 输出设置（压缩宽度，紧跟画布下方） -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">输出设置</span>
            <span class="chip">{{ design.w }} × {{ design.h }} 底图</span>
          </div>

          <div class="ctl-grid">
            <div class="tb-item span-all">
              <label class="tb-label">容器底图</label>
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

            <div class="tb-item">
              <label class="tb-label">底图范围</label>
              <div class="seg">
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

            <div class="tb-item">
              <label class="tb-label">对齐吸附</label>
              <div class="inline-row">
                <el-input-number
                  v-model="snapPx"
                  :min="1"
                  :max="64"
                  :controls="false"
                  size="small"
                  class="xy-field is-num snap-in"
                  title="贴图对齐的像素步长，可自定义"
                  @change="onSnapChange"
                />
                <span class="res-unit">px</span>
                <el-switch v-model="snapOn" size="small" class="xy-switch" title="开关对齐吸附" />
              </div>
            </div>

            <div class="tb-item">
              <label class="tb-label">锁定比例</label>
              <div class="inline-row">
                <el-switch v-model="lockRatio" size="small" class="xy-switch" title="改一边时自动算另一边" />
                <span class="res-unit">{{ exportScaleText }}</span>
              </div>
            </div>

            <div class="tb-item span-all">
              <label class="tb-label">导出分辨率</label>
              <div class="inline-row">
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
          </div>

          <div class="tb-actions">
            <span class="tb-tags">
              <span class="chip">{{ items.length }} 个贴图</span>
              <span v-if="selected" class="chip">选中 {{ selected.label }}</span>
            </span>
            <button type="button" class="btn" :disabled="!selected" @click="removeSelected">删除选中</button>
            <button type="button" class="btn" :disabled="!items.length" @click="clearAll">清空画布</button>
            <button type="button" class="btn primary" :disabled="exporting" @click="exportPng">
              <el-icon v-if="exporting" class="is-loading"><Loading /></el-icon>
              <el-icon v-else><Download /></el-icon>
              {{ exporting ? '导出中…' : '导出 PNG' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== 右栏：贴图参数 + 贴图库 ==================== -->
      <div class="col-right">
        <!-- 选中贴图的参数 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">贴图参数</span>
            <span v-if="selected" class="chip">{{ selected.label }}</span>
            <span v-else class="chip">未选中</span>
          </div>

          <div v-if="!selected" class="param-empty">
            在画布上<b>单击</b>一个贴图，就能在这里精确调整它的位置、大小和层级～
          </div>

          <template v-else>
            <div class="param-preview">
              <div class="param-thumb">
                <img
                  :src="selected.url"
                  alt=""
                  :style="{ transform: `scale(${selected.flipX ? -1 : 1}, ${selected.flipY ? -1 : 1})` }"
                />
              </div>
              <div class="param-meta">
                <div class="param-name">{{ selected.label }}</div>
                <div class="param-sub">尺寸 {{ selected.w }} × {{ selected.h }} px</div>
                <div class="param-sub">第 {{ selectedIndex + 1 }} / {{ items.length }} 层</div>
              </div>
            </div>

            <div class="param-grid">
              <label class="pf">
                <span>X 坐标</span>
                <el-input-number
                  :model-value="selected.x"
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
                  :model-value="selected.y"
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
                  :model-value="selected.w"
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
                  :model-value="selected.h"
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
              <button type="button" class="btn sm" @click="centerSelected">居中</button>
              <button type="button" class="btn sm" :class="{ on: selected.flipX }" title="水平镜像" @click="flipSelected('x')">水平翻转</button>
              <button type="button" class="btn sm" :class="{ on: selected.flipY }" title="垂直镜像" @click="flipSelected('y')">垂直翻转</button>
              <button type="button" class="btn sm" :disabled="selectedIndex >= items.length - 1" title="往更上层移" @click="layerMove(1)">上移一层</button>
              <button type="button" class="btn sm" :disabled="selectedIndex <= 0" title="往更下层移" @click="layerMove(-1)">下移一层</button>
              <button type="button" class="btn sm" title="原位附近复制一个" @click="duplicateSelected">复制</button>
              <button type="button" class="btn sm danger" @click="removeSelected">删除</button>
            </div>
          </template>
        </div>

        <!-- 贴图库 -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="card-title">贴图库</span>
            <span class="chip">{{ mineList.length + vanillaList.length }} 个</span>
          </div>

          <div class="tip-line">
            往项目根目录的 <code>mine/</code> 里丢 PNG，刷新后就会出现在「我的贴图」里。
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

/* ==================== 站点风按钮（替代 el-button） ==================== */
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

/* ==================== 输出设置 ==================== */
.ctl-grid {
  display: grid;
  /* 自动铺排：窄了就自己换行，不用手写断点 */
  grid-template-columns: repeat(auto-fit, minmax(182px, 1fr));
  gap: 14px 16px;
}
.ctl-grid > .span-all {
  grid-column: 1 / -1;
}
.tb-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.tb-label {
  font-size: 12px;
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
  padding-top: 14px;
  margin-top: 16px;
  border-top: 1px dashed var(--card-border);
}

/* 容器选择 */
.ctn-select {
  width: 100%;
  max-width: 280px;
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

/* 分段按钮（与颜色工具页 mode-tabs 同一观感） */
.seg {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  width: fit-content;
}
.seg button {
  border: none;
  background: transparent;
  padding: 4px 11px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: all 0.18s ease;
}
.seg button:hover {
  color: var(--primary);
}
.seg button.on {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 40%, transparent);
}
.seg.kbtns button {
  min-width: 38px;
}

/* 行内控件排布 */
.inline-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.res-in {
  width: 78px;
}
.snap-in {
  width: 62px;
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
.mini:hover {
  border-color: var(--primary);
  color: var(--primary);
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
  /* safe center：画布比容器宽时不会把左侧裁掉，能正常滚到最左边 */
  justify-content: center;
  justify-content: safe center;
  align-items: flex-start;
  padding: 6px 4px 2px;
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
  opacity: 0.5;
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
}

/* 画布上的贴图 */
.placed {
  position: absolute;
  cursor: grab;
  outline: 1px dashed transparent;
  outline-offset: 0;
  transition: outline-color 0.15s ease;
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
}
/* 右下角缩放手柄：外圈用白色描边，深浅底都能看见 */
.rz {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--primary);
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
  cursor: nwse-resize;
  touch-action: none;
}
/* 指尖比鼠标粗，把命中区往外扩一圈 */
.rz::before {
  content: '';
  position: absolute;
  inset: -9px;
}

/* 图层条 */
.layer-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--card-border);
}
.layer-bar-label {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-right: 2px;
}
.layer-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  padding: 3px 6px 3px 4px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s ease;
}
.layer-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.layer-chip.on {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  color: var(--primary);
  font-weight: 600;
}
.layer-chip img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
}
.layer-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.layer-x {
  opacity: 0.55;
  padding: 0 2px;
  font-size: 13px;
  line-height: 1;
}
.layer-x:hover {
  opacity: 1;
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
.param-empty b {
  color: var(--primary);
}
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

/* ==================== 贴图库 ==================== */
.lib-scroll {
  max-height: 52vh;
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
}
.drag-ghost img {
  display: block;
  max-width: 140px;
  max-height: 140px;
  image-rendering: pixelated;
  opacity: 0.9;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
}
.drag-ghost.over {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}

/* ==================== 窄屏 ==================== */
@media (max-width: 980px) {
  .menu-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .lib-scroll {
    max-height: 44vh;
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
  .ctl-grid {
    grid-template-columns: minmax(0, 1fr);
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
  .mini:hover,
  .btn:hover:not(:disabled) {
    transform: none;
    border-color: var(--card-border);
    color: var(--text-secondary);
  }
}
</style>
