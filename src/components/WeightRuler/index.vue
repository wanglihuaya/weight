<script setup lang="ts">
import { getCurrentInstance, onMounted, ref, watch } from 'wevu'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 70
  },
  min: {
    type: Number,
    default: 30
  },
  max: {
    type: Number,
    default: 200
  },
  step: {
    type: Number,
    default: 0.1
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const instance = getCurrentInstance()
const canvasId = `ruler-canvas-${Math.random().toString(36).slice(2, 10)}`
let canvas: any = null
let ctx: any = null
let dpr = 1

const width = ref(375)
const height = ref(60)

// 内部状态
let currentValue = props.modelValue
let baseValue = props.modelValue // 记录开始滚动前的值
let lastVibrateValue = props.modelValue
let isMoving = false
let startX = 0
let lastX = 0
let velocity = 0
let lastTimestamp = 0

// 刻度配置
const scaleStep = 50 // 像素/单位 (1kg 对应多少像素)
const majorTickHeight = 16 // 1kg 刻度高度
const halfTickHeight = 12  // 0.5kg 刻度高度
const minorTickHeight = 8  // 0.1kg 刻度高度
const arcRadius = 2500 // 增加半径使弧度更加平滑平缓

const initCanvas = () => {
  const query = wx.createSelectorQuery().in(instance?.proxy || instance)
  query.select('#' + canvasId)
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res[0] || !res[0].node) {
        console.error('无法获取 Canvas 节点，尝试重新初始化')
        return
      }
      canvas = res[0].node
      ctx = canvas.getContext('2d')
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() || wx.getSystemInfoSync() : wx.getSystemInfoSync()
      dpr = windowInfo.pixelRatio

      // 确保宽度不为 0
      width.value = res[0].width || windowInfo.windowWidth
      height.value = res[0].height || 120

      canvas.width = width.value * dpr
      canvas.height = height.value * dpr
      ctx.scale(dpr, dpr)

      console.log('Canvas 初始化成功:', width.value, height.value, dpr)
      draw()
    })
}

const draw = () => {
  if (!ctx) return

  ctx.clearRect(0, 0, width.value, height.value)

  const centerX = width.value / 2
  const lineWidth = 1
  // 将圆心稍微向下移动 (lineWidth / 2)，防止弧线顶部被画布边界裁切导致看起来变细
  const centerY = arcRadius + lineWidth
  const tickMargin = 4 // 刻度与背景弧线之间的边距

  // 绘制背景弧线
  ctx.save()
  ctx.beginPath()
  // 这里的 y 轴需要对齐
  ctx.arc(centerX, centerY, arcRadius, -Math.PI, 0)
  ctx.strokeStyle = '#C1C1C3'
  ctx.lineWidth = lineWidth
  ctx.stroke()
  ctx.restore()

  // 1. 绘制刻度
  const viewRange = (width.value / 2 / scaleStep) + 2
  const startTick = Math.max(props.min, Math.floor((currentValue - viewRange) / props.step) * props.step)
  const endTick = Math.min(props.max, Math.ceil((currentValue + viewRange) / props.step) * props.step)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = 'bold 12px sans-serif'

  for (let val = startTick; val <= endTick; val = Number((val + props.step).toFixed(1))) {
    const diff = val - currentValue
    const angle = (diff * scaleStep) / arcRadius

    if (Math.abs(angle) > Math.PI / 4) continue

    // 刻度起始点增加 tickMargin，使其不接触背景弧线
    const x = centerX + Math.sin(angle) * (arcRadius - tickMargin)
    const y = centerY - Math.cos(angle) * (arcRadius - tickMargin)

    const isMajor = Math.abs(val % 1) < 0.01
    const isHalf = !isMajor && Math.abs(val % 0.5) < 0.01
    const tickLen = isMajor ? majorTickHeight : (isHalf ? halfTickHeight : minorTickHeight)

    const x2 = centerX + Math.sin(angle) * (arcRadius - tickMargin - tickLen)
    const y2 = centerY - Math.cos(angle) * (arcRadius - tickMargin - tickLen)

    // 根据离中心的距离计算透明度
    const opacity = Math.max(0, 1 - Math.abs(diff * scaleStep) / (width.value / 1.8))
    ctx.strokeStyle = `rgba(156, 163, 175, ${opacity})`
    ctx.lineWidth = isMajor ? 2 : 1.5

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x2, y2)
    ctx.stroke()

  }
  ctx.restore()

  // 2. 绘制中心指针
  ctx.save()
  // 指针阴影
  ctx.shadowColor = 'rgba(239, 68, 68, 0.3)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2

  ctx.fillStyle = '#FF5252'
  const pointerHeight = 24
  const pointerWidth = 12
  const pointerOffset = 20 // 向下移动

  ctx.beginPath()
  ctx.moveTo(centerX, pointerOffset)
  ctx.lineTo(centerX + pointerWidth / 2, pointerOffset + pointerHeight)
  ctx.lineTo(centerX - pointerWidth / 2, pointerOffset + pointerHeight)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const handleTouchStart = (e: any) => {
  isMoving = true
  baseValue = currentValue // 记录开始滚动前的值
  startX = e.touches[0].clientX
  lastX = startX
  lastTimestamp = Date.now()
  velocity = 0
}

const handleTouchMove = (e: any) => {
  if (!isMoving) return
  const x = e.touches[0].clientX
  const dx = x - lastX
  const now = Date.now()
  const dt = now - lastTimestamp

  if (dt > 0) {
    velocity = dx / dt
  }

  // 将像素位移转换为数值位移
  const valueDiff = dx / scaleStep
  let nextValue = currentValue - valueDiff

  // 边界检查
  if (nextValue < props.min) nextValue = props.min
  if (nextValue > props.max) nextValue = props.max

  currentValue = nextValue
  lastX = x
  lastTimestamp = now

  // 震动反馈：当跨越一个步长刻度时触发
  if (Math.abs(currentValue - lastVibrateValue) >= props.step) {
    wx.vibrateShort({ type: 'light' })
    lastVibrateValue = Math.round(currentValue / props.step) * props.step
  }

  draw()
  // 实时回传原始数值，确保父组件能感知到微小变动并触发重绘
  emit('update:modelValue', currentValue)
}

const handleTouchEnd = () => {
  isMoving = false
  // 不再进行惯性滚动和吸附，改为直接回到起始位置
  returnToBase()
}

const returnToBase = () => {
  const step = () => {
    if (isMoving) return
    const d = baseValue - currentValue
    // 接近目标值时停止
    if (Math.abs(d) < 0.005) {
      currentValue = baseValue
      draw()
      emit('update:modelValue', Number(currentValue.toFixed(1)))
      return
    }

    // 使用缓动公式，距离越近速度越慢
    currentValue += d * 0.15

    // 回弹过程中的震动反馈
    if (Math.abs(currentValue - lastVibrateValue) >= props.step) {
      wx.vibrateShort({ type: 'light' })
      lastVibrateValue = Math.round(currentValue / props.step) * props.step
    }

    draw()
    emit('update:modelValue', currentValue)
    canvas.requestAnimationFrame(step)
  }
  step()
}

onMounted(() => {
  // 延迟初始化，确保 Skyline 渲染节点已就绪
  setTimeout(() => {
    initCanvas()
  }, 100)
})

watch(() => props.modelValue, (val) => {
  if (!isMoving && Math.abs(val - currentValue) > 0.01) {
    currentValue = val
    draw()
  }
})
</script>

<template>
  <view class="ruler-container" :style="{ height: height + 'px' }">
    <canvas
      :id="canvasId"
      type="2d"
      class="ruler-canvas"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    ></canvas>
    <!-- 左右遮罩 -->
    <view class="mask-left"></view>
    <view class="mask-right"></view>
  </view>
</template>

<style scoped>
.ruler-container {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.ruler-canvas {
  width: 100%;
  height: 100%;
  display: block;
  z-index: 1;
}

.mask-left, .mask-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 150rpx;
  pointer-events: none;
  z-index: 10;
}

.mask-left {
  left: 0;
  background: linear-gradient(to right, #f4f5f9 0%, rgba(244, 245, 249, 0) 100%);
}

.mask-right {
  right: 0;
  background: linear-gradient(to left, #f4f5f9 0%, rgba(244, 245, 249, 0) 100%);
}
</style>
