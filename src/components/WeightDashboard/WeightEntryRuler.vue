<script setup lang="ts">
import { getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'wevu'

import {
  applyWeightEntryDragDelta,
  buildWeightEntryCanvasLayout,
  clampWeightEntryValue,
  getWeightEntryBoundState,
  projectWeightEntryTarget,
  quantizeWeightEntryValue,
  stepWeightEntrySpring,
} from './weightEntry'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 70,
  },
  min: {
    type: Number,
    default: 30,
  },
  max: {
    type: Number,
    default: 150,
  },
  step: {
    type: Number,
    default: 0.1,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'motion'])

defineComponentJson({
  virtualHost: true,
  styleIsolation: 'apply-shared',
})

const instance = getCurrentInstance()
const canvasId = `entry-ruler-canvas-${Math.random().toString(36).slice(2, 10)}`

let canvas: any = null
let ctx: any = null
let dpr = 1
let currentValue = props.modelValue
let lastX = 0
let lastTimestamp = 0
let lastVibrateValue = quantizeWeightEntryValue(props.modelValue, props.step, props.min, props.max)
let isMoving = false
let rafHandle: any = null
let velocity = 0
let visualOffset = 0

const width = ref(640)
const height = ref(228)

const pixelsPerUnit = 118

function cancelFrame() {
  if (canvas && rafHandle) {
    canvas.cancelAnimationFrame?.(rafHandle)
  }
  rafHandle = null
}

function clampVisualOffset(offset: number) {
  return clampWeightEntryValue(offset, -0.6, 0.6)
}

function emitMotion() {
  const bounds = getWeightEntryBoundState(currentValue, props.min, props.max)
  emit('motion', {
    offset: visualOffset,
    dragging: isMoving,
    current: Number(currentValue.toFixed(1)),
    ...bounds,
  })
}

function triggerVibration(nextValue: number) {
  if (Math.abs(nextValue - lastVibrateValue) >= props.step) {
    wx.vibrateShort({ type: 'light' })
    lastVibrateValue = quantizeWeightEntryValue(nextValue, props.step, props.min, props.max)
  }
}

function draw() {
  if (!ctx) return

  ctx.clearRect(0, 0, width.value, height.value)

  const centerX = width.value / 2
  const layout = buildWeightEntryCanvasLayout(height.value)
  const visibleRange = width.value / pixelsPerUnit / 2 + 1.5
  const startTick = Math.max(props.min, Math.floor((currentValue - visibleRange) / props.step) * props.step)
  const endTick = Math.min(props.max, Math.ceil((currentValue + visibleRange) / props.step) * props.step)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = '600 16px sans-serif'

  for (let val = startTick; val <= endTick; val = Number((val + props.step).toFixed(1))) {
    const diff = val - currentValue
    const x = centerX + diff * pixelsPerUnit
    if (x < -32 || x > width.value + 32) continue

    const scaled = Math.round(val * 10)
    const isMajor = scaled % 10 === 0
    const isHalf = !isMajor && scaled % 5 === 0
    const tickHeight = isMajor ? layout.majorTickHeight : (isHalf ? layout.halfTickHeight : layout.minorTickHeight)
    const opacity = Math.max(0.24, 1 - Math.abs(diff) / (visibleRange + 0.6))

    ctx.strokeStyle = isMajor
      ? `rgba(189, 193, 201, ${opacity})`
      : `rgba(214, 218, 226, ${opacity})`
    ctx.lineWidth = isMajor ? 2.2 : 1.6
    ctx.beginPath()
    ctx.moveTo(x, layout.topPadding)
    ctx.lineTo(x, layout.topPadding + tickHeight)
    ctx.stroke()

    if (isMajor) {
      ctx.fillStyle = Math.abs(diff) < 0.05 ? '#111318' : `rgba(140, 144, 152, ${opacity})`
      ctx.fillText(String(Math.floor(val)), x, layout.labelTop)
    }
  }
  ctx.restore()

  ctx.save()
  ctx.shadowColor = 'rgba(240, 106, 96, 0.28)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 2
  ctx.strokeStyle = '#F06A60'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(centerX, 3)
  ctx.lineTo(centerX, layout.pointerHeight - 3)
  ctx.stroke()
  ctx.restore()
}

function initCanvas() {
  const query = wx.createSelectorQuery().in(instance?.proxy || instance)
  query.select('#' + canvasId)
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res?.[0]?.node) {
        return
      }

      canvas = res[0].node
      ctx = canvas.getContext('2d')
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() || wx.getSystemInfoSync() : wx.getSystemInfoSync()
      dpr = windowInfo.pixelRatio || 1
      width.value = res[0].width || windowInfo.windowWidth
      height.value = res[0].height || 120

      canvas.width = width.value * dpr
      canvas.height = height.value * dpr
      ctx.scale(dpr, dpr)

      currentValue = quantizeWeightEntryValue(props.modelValue, props.step, props.min, props.max)
      lastVibrateValue = currentValue
      visualOffset = 0
      draw()
      emitMotion()
    })
}

function handleTouchStart(e: any) {
  cancelFrame()
  isMoving = true
  lastX = e.touches[0].clientX
  lastTimestamp = Date.now()
  velocity = 0
}

function handleTouchMove(e: any) {
  if (!isMoving) return

  const x = e.touches[0].clientX
  const rawDx = x - lastX
  const now = Date.now()
  const dt = Math.max(now - lastTimestamp, 16)
  lastX = x
  lastTimestamp = now

  const dampedDx = applyWeightEntryDragDelta(rawDx, currentValue, props.min, props.max)
  const previousValue = currentValue
  const nextValue = clampWeightEntryValue(currentValue - dampedDx / pixelsPerUnit, props.min, props.max)
  const deltaWeight = nextValue - previousValue

  currentValue = nextValue
  velocity = velocity * 0.58 + (deltaWeight / dt) * 18
  visualOffset = clampVisualOffset(visualOffset * 0.32 + deltaWeight * 4.6)
  triggerVibration(currentValue)
  console.log("🚀 ~ handleTouchMove ~ currentValue:", currentValue)
  draw()
  emit('update:modelValue', Number(currentValue.toFixed(2)))
  emitMotion()
}

function animateTo(targetValue: number) {
  cancelFrame()

  const stepFrame = () => {
    const nextState = stepWeightEntrySpring({ current: currentValue, velocity }, targetValue)
    currentValue = nextState.current
    velocity = nextState.velocity
    visualOffset = clampVisualOffset(visualOffset * 0.72 + (targetValue - currentValue) * 1.8)

    if (Math.abs(targetValue - currentValue) < 0.01 && Math.abs(velocity) < 0.01) {
      currentValue = targetValue
      lastVibrateValue = targetValue
       velocity = 0
      visualOffset = 0
      draw()
      emit('update:modelValue', targetValue)
      emit('change', targetValue)
      emitMotion()
      rafHandle = null
      return
    }

    triggerVibration(currentValue)
    draw()
    emit('update:modelValue', Number(currentValue.toFixed(2)))
    emitMotion()
    rafHandle = canvas?.requestAnimationFrame?.(stepFrame)
  }

  rafHandle = canvas?.requestAnimationFrame?.(stepFrame)
}

function handleTouchEnd() {
  isMoving = false
  animateTo(projectWeightEntryTarget(currentValue, velocity, props.step, props.min, props.max))
}

onMounted(() => {
  setTimeout(() => {
    initCanvas()
  }, 80)
})

onUnmounted(() => {
  cancelFrame()
})

watch(() => props.modelValue, (val) => {
  if (isMoving) return
  const nextValue = quantizeWeightEntryValue(val, props.step, props.min, props.max)
  if (Math.abs(nextValue - currentValue) < 0.01) return
  currentValue = nextValue
  lastVibrateValue = nextValue
  velocity = 0
  visualOffset = 0
  draw()
  emitMotion()
})
</script>

<template>
  <view class="entry-ruler-canvas-shell">
    <canvas
      :id="canvasId"
      type="2d"
      class="entry-ruler-canvas"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    />
    <view class="entry-ruler-mask entry-ruler-mask-left" />
    <view class="entry-ruler-mask entry-ruler-mask-right" />
  </view>
</template>

<style scoped>
.entry-ruler-canvas-shell {
  position: relative;
  width: 100%;
  height: 220rpx;
  overflow: hidden;
}

.entry-ruler-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.entry-ruler-mask {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 88rpx;
  pointer-events: none;
}

.entry-ruler-mask-left {
  left: 0;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0));
}

.entry-ruler-mask-right {
  right: 0;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0));
}
</style>
