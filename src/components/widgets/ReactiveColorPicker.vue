<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '#ffffff' },
  size: { type: String, default: '' }, // '' | 'small'
  // 嵌套在其他 popover（如导航栏主题面板）里时设为 false，
  // 避免点击取色盘被外层判定为"外部点击"而关闭外层面板
  teleported: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])

/* ---------- 颜色换算 ---------- */
function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  if (![r, g, b].every(isFinite)) return { h: 0, s: 0, v: 0 }
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max ? (d / max) * 100 : 0
  const v = max * 100
  return { h, s, v }
}
function hsvToHex(h, s, v) {
  // 防御：确保数值有限且在合法区间
  h = (isFinite(h) ? h : 0) % 360
  if (h < 0) h += 360
  s = Math.min(100, Math.max(0, isFinite(s) ? s : 0))
  v = Math.min(100, Math.max(0, isFinite(v) ? v : 0))
  s /= 100
  v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const to = n => {
    let val = Math.round((n + m) * 255)
    if (!isFinite(val)) val = 0
    val = Math.max(0, Math.min(255, val))
    return val.toString(16).padStart(2, '0')
  }
  return `#${to(r)}${to(g)}${to(b)}`
}
function normalizeHex(v) {
  let s = String(v || '').trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(s)) return '#' + s.toLowerCase()
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s.split('').map(c => c + c).join('')
    return '#' + s.toLowerCase()
  }
  return null
}

/* ---------- 内部状态 ---------- */
const hsv = computed(() => hexToHsv(normalizeHex(props.modelValue) || '#ffffff'))
const hueColor = computed(() => hsvToHex(hsv.value.h, 100, 100))
const svBg = computed(() =>
  `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${hueColor.value})`
)
const hueBg = computed(() => {
  const stops = [0, 60, 120, 180, 240, 300, 360]
    .map(d => `${hsvToHex(d, 100, 100)} ${d / 3.6}%`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
})

/* 十六进制输入框 */
const hexDraft = ref(props.modelValue)
watch(() => props.modelValue, v => { hexDraft.value = v })
function commitDraft() {
  const n = normalizeHex(hexDraft.value)
  if (n) {
    hexDraft.value = n
    emit('update:modelValue', n)
  } else {
    hexDraft.value = props.modelValue
  }
}

/* ---------- 交互 ---------- */
const planeEl = ref(null)
const hueEl = ref(null)
const draggingPlane = ref(false)
const draggingHue = ref(false)

function planeFold(e) {
  const el = planeEl.value
  const r = el.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
  emit('update:modelValue', hsvToHex(hsv.value.h, x * 100, (1 - y) * 100))
}
function onPlaneDown(e) {
  e.preventDefault()
  draggingPlane.value = true
  try { planeEl.value.setPointerCapture(e.pointerId) } catch { /* 忽略捕获失败 */ }
  planeFold(e)
}
function onPlaneMove(e) {
  if (draggingPlane.value) planeFold(e)
}
function onPlaneUp(e) {
  draggingPlane.value = false
  try { if (planeEl.value.hasPointerCapture?.(e.pointerId)) planeEl.value.releasePointerCapture?.(e.pointerId) } catch { /* 忽略 */ }
}

function hueFold(e) {
  const el = hueEl.value
  const r = el.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  emit('update:modelValue', hsvToHex(x * 360, hsv.value.s, hsv.value.v))
}
function onHueDown(e) {
  e.preventDefault()
  draggingHue.value = true
  try { hueEl.value.setPointerCapture(e.pointerId) } catch { /* 忽略捕获失败 */ }
  hueFold(e)
}
function onHueMove(e) {
  if (draggingHue.value) hueFold(e)
}
function onHueUp(e) {
  draggingHue.value = false
  try { if (hueEl.value.hasPointerCapture?.(e.pointerId)) hueEl.value.releasePointerCapture?.(e.pointerId) } catch { /* 忽略 */ }
}
</script>

<template>
  <el-popover
    trigger="click"
    :width="228"
    :show-arrow="false"
    :teleported="teleported"
    transition="el-zoom-in-top"
    popper-class="rcp-popper"
  >
    <template #reference>
      <span class="rcp-trigger" :class="size ? 'rcp-trigger-' + size : ''">
        <span class="rcp-trigger-fill" :style="{ background: modelValue }" />
      </span>
    </template>

    <div class="rcp">
      <div
        ref="planeEl"
        class="rcp-plane"
        :style="{ background: svBg }"
        @pointerdown="onPlaneDown"
        @pointermove="onPlaneMove"
        @pointerup="onPlaneUp"
      >
        <span
          class="rcp-plane-thumb"
          :style="{ left: hsv.s + '%', top: 100 - hsv.v + '%' }"
        />
      </div>

      <div
        ref="hueEl"
        class="rcp-hue"
        :style="{ background: hueBg }"
        @pointerdown="onHueDown"
        @pointermove="onHueMove"
        @pointerup="onHueUp"
      >
        <span class="rcp-hue-thumb" :style="{ left: hsv.h / 360 * 100 + '%' }" />
      </div>

      <div class="rcp-foot">
        <span class="rcp-preview" :style="{ background: modelValue }" />
        <input
          v-model="hexDraft"
          class="rcp-input"
          maxlength="7"
          spellcheck="false"
          @blur="commitDraft"
          @keydown.enter="commitDraft"
        />
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.rcp-trigger {
  display: inline-block;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  padding: 2px;
  box-sizing: border-box;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  vertical-align: middle;
}
.rcp-trigger:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent);
}
.rcp-trigger-small {
  width: 20px;
  height: 20px;
}
.rcp-trigger-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
}
.rcp {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rcp-plane {
  position: relative;
  height: 136px;
  border-radius: 8px;
  cursor: crosshair;
  touch-action: none;
}
.rcp-plane-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.rcp-hue {
  position: relative;
  height: 14px;
  border-radius: 999px;
  cursor: ew-resize;
  touch-action: none;
}
.rcp-hue-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.rcp-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rcp-preview {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  flex-shrink: 0;
}
.rcp-input {
  flex: 1;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  color: var(--text);
  font-family: Consolas, monospace;
  font-size: 13px;
  padding: 0 10px;
  outline: none;
  transition: border-color 0.15s ease;
}
.rcp-input:focus {
  border-color: var(--primary);
}
</style>

<style>
/* 弹层动画与原 el-color-picker 一致：从顶部缩放展开 */
.rcp-popper.el-popper {
  transform-origin: center top;
}
</style>