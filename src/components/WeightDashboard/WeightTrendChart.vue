<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'wevu'

import {
  resolveNearestTrendPoint,
  resolveWeightTrendTargetPosition,
  type WeightTrendChartModel,
  type WeightTrendPoint,
} from './weightTrend'

const props = withDefaults(
  defineProps<{
    model?: WeightTrendChartModel
    targetWeight?: number
    showTarget?: boolean
  }>(),
  {
    model: () => ({
      range: '30d',
      rangeLabel: '1月',
      days: 30,
      startDateKey: '',
      endDateKey: '',
      yTicks: [1.5, 1, 0.5, 0],
      xTicks: [],
      points: [],
      minPointKey: '',
      maxPointKey: '',
    }),
    targetWeight: 0,
    showTarget: false,
  },
)

const fallbackModel: WeightTrendChartModel = {
  range: '30d',
  rangeLabel: '1月',
  days: 30,
  startDateKey: '',
  endDateKey: '',
  yTicks: [1.5, 1, 0.5, 0],
  xTicks: [],
  points: [],
  minPointKey: '',
  maxPointKey: '',
}

defineComponentJson({
  styleIsolation: 'apply-shared',
})

interface PlotPoint extends WeightTrendPoint {
  x: number
  y: number
}

interface ChartLayout {
  left: number
  right: number
  top: number
  bottom: number
  plotWidth: number
  plotHeight: number
}

const instance = getCurrentInstance()
const canvasId = `weight-trend-canvas-${Math.random().toString(36).slice(2, 10)}`
const safeModel = computed(() => props.model ?? fallbackModel)
const selectedIndex = ref(Math.max(0, safeModel.value.points.length - 1))

let canvas: any = null
let ctx: any = null
let width = 0
let height = 0
let dpr = 1
let canvasLeft = 0
let animationHandle: any = null
let animationGeneration = 0

const selectedPoint = computed(() => safeModel.value.points[selectedIndex.value] ?? null)
const selectedDeltaText = computed(() => {
  const point = selectedPoint.value
  if (!point || selectedIndex.value === 0) {
    return '本周期首条记录'
  }
  if (point.delta === 0) {
    return '较前次持平'
  }
  return `较前次 ${point.delta > 0 ? '+' : ''}${point.delta.toFixed(1)} 千克`
})
const selectedDeltaTone = computed(() => {
  const delta = selectedPoint.value?.delta ?? 0
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
})
const modelSignature = computed(() => [
  safeModel.value.range,
  safeModel.value.startDateKey,
  safeModel.value.endDateKey,
  safeModel.value.points.map(point => `${point.key}:${point.value}`).join('|'),
].join(':'))

function cancelAnimation() {
  animationGeneration += 1
  if (canvas && animationHandle !== null) {
    canvas.cancelAnimationFrame?.(animationHandle)
  }
  animationHandle = null
}

function getLayout(): ChartLayout {
  const left = 10
  const right = 42
  const top = 24
  const bottom = 28
  return {
    left,
    right,
    top,
    bottom,
    plotWidth: Math.max(1, width - left - right),
    plotHeight: Math.max(1, height - top - bottom),
  }
}

function getPlotPoints(layout: ChartLayout) {
  const yMax = safeModel.value.yTicks[0] ?? 1
  const yMin = safeModel.value.yTicks.at(-1) ?? 0
  const yRange = Math.max(0.1, yMax - yMin)

  return safeModel.value.points.map(point => ({
    ...point,
    x: layout.left + point.xRatio * layout.plotWidth,
    y: layout.top + ((yMax - point.value) / yRange) * layout.plotHeight,
  }))
}

function roundedRectPath(
  context: any,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, boxWidth / 2, boxHeight / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + boxWidth - safeRadius, y)
  context.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + safeRadius)
  context.lineTo(x + boxWidth, y + boxHeight - safeRadius)
  context.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - safeRadius, y + boxHeight)
  context.lineTo(x + safeRadius, y + boxHeight)
  context.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function drawPill(
  text: string,
  anchorX: number,
  anchorY: number,
  foreground: string,
  background: string,
) {
  ctx.save()
  ctx.font = '600 10px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const paddingX = 7
  const boxHeight = 20
  const boxWidth = Math.ceil(ctx.measureText(text).width) + paddingX * 2
  const x = Math.min(width - boxWidth - 2, Math.max(2, anchorX - boxWidth / 2))
  const y = Math.min(height - boxHeight - 2, Math.max(2, anchorY))
  roundedRectPath(ctx, x, y, boxWidth, boxHeight, 8)
  ctx.fillStyle = background
  ctx.fill()
  ctx.fillStyle = foreground
  ctx.fillText(text, x + paddingX, y + boxHeight / 2 + 0.5)
  ctx.restore()
}

function buildTangents(points: PlotPoint[]) {
  if (points.length < 2) {
    return []
  }

  const slopes = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1]
    return (next.y - point.y) / Math.max(0.001, next.x - point.x)
  })
  const tangents = new Array(points.length).fill(0)
  tangents[0] = slopes[0]
  tangents[tangents.length - 1] = slopes.at(-1) ?? 0

  for (let index = 1; index < tangents.length - 1; index += 1) {
    const before = slopes[index - 1]
    const after = slopes[index]
    tangents[index] = before * after <= 0 ? 0 : (before + after) / 2
  }

  for (let index = 0; index < slopes.length; index += 1) {
    const slope = slopes[index]
    if (Math.abs(slope) < 0.0001) {
      tangents[index] = 0
      tangents[index + 1] = 0
      continue
    }

    const a = tangents[index] / slope
    const b = tangents[index + 1] / slope
    const sum = a * a + b * b
    if (sum > 9) {
      const scale = 3 / Math.sqrt(sum)
      tangents[index] = scale * a * slope
      tangents[index + 1] = scale * b * slope
    }
  }

  return tangents
}

function traceCurve(points: PlotPoint[]) {
  if (points.length === 0) {
    return
  }

  const tangents = buildTangents(points)
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 0; index < points.length - 1; index += 1) {
    const point = points[index]
    const next = points[index + 1]
    const distance = next.x - point.x
    ctx.bezierCurveTo(
      point.x + distance / 3,
      point.y + (tangents[index] * distance) / 3,
      next.x - distance / 3,
      next.y - (tangents[index + 1] * distance) / 3,
      next.x,
      next.y,
    )
  }
}

function drawGrid(layout: ChartLayout) {
  ctx.save()
  ctx.lineWidth = 1
  ctx.font = '500 10px sans-serif'
  ctx.textBaseline = 'middle'

  safeModel.value.yTicks.forEach((tick, index) => {
    const y = layout.top + (layout.plotHeight * index) / Math.max(1, safeModel.value.yTicks.length - 1)
    ctx.beginPath()
    ctx.strokeStyle = index === safeModel.value.yTicks.length - 1 ? '#d9e0e8' : '#edf1f5'
    ctx.setLineDash([])
    ctx.moveTo(layout.left, y)
    ctx.lineTo(layout.left + layout.plotWidth, y)
    ctx.stroke()
    ctx.fillStyle = '#9298a3'
    ctx.textAlign = 'right'
    ctx.fillText(tick.toFixed(1), width - 2, y)
  })

  safeModel.value.xTicks.forEach((tick, index) => {
    const x = layout.left + tick.xRatio * layout.plotWidth
    if (index > 0 && index < safeModel.value.xTicks.length - 1) {
      ctx.beginPath()
      ctx.strokeStyle = '#eef2f6'
      ctx.setLineDash([3, 4])
      ctx.moveTo(x, layout.top)
      ctx.lineTo(x, layout.top + layout.plotHeight)
      ctx.stroke()
    }
    ctx.fillStyle = '#9ca2ad'
    ctx.textBaseline = 'bottom'
    ctx.textAlign = index === 0 ? 'left' : index === safeModel.value.xTicks.length - 1 ? 'right' : 'center'
    ctx.fillText(tick.label, x, height)
  })

  ctx.setLineDash([])
  ctx.restore()
}

function drawTarget(layout: ChartLayout) {
  if (!props.showTarget) {
    return
  }

  const position = resolveWeightTrendTargetPosition(props.targetWeight, safeModel.value.yTicks)
  if (!position) {
    return
  }

  const y = layout.top + position.yRatio * layout.plotHeight
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(240, 106, 96, 0.62)'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 4])
  ctx.moveTo(layout.left, y)
  ctx.lineTo(layout.left + layout.plotWidth, y)
  ctx.stroke()
  ctx.restore()

  const direction = position.state === 'above' ? '↑ ' : position.state === 'below' ? '↓ ' : ''
  const labelY = position.state === 'below' ? y - 22 : y + 3
  drawPill(
    `${direction}目标 ${props.targetWeight.toFixed(1)}`,
    layout.left + 43,
    labelY,
    '#d85249',
    'rgba(255, 238, 236, 0.96)',
  )
}

function drawTrend(layout: ChartLayout, points: PlotPoint[], progress: number) {
  if (points.length === 0) {
    return
  }

  const revealX = layout.left + layout.plotWidth * progress
  ctx.save()
  ctx.beginPath()
  ctx.rect(layout.left - 8, layout.top - 16, Math.max(1, revealX - layout.left + 16), layout.plotHeight + 32)
  ctx.clip()

  if (points.length > 1) {
    ctx.beginPath()
    traceCurve(points)
    ctx.lineTo(points.at(-1)!.x, layout.top + layout.plotHeight)
    ctx.lineTo(points[0].x, layout.top + layout.plotHeight)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, layout.top, 0, layout.top + layout.plotHeight)
    gradient.addColorStop(0, 'rgba(35, 144, 232, 0.22)')
    gradient.addColorStop(0.7, 'rgba(35, 144, 232, 0.055)')
    gradient.addColorStop(1, 'rgba(35, 144, 232, 0)')
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    traceCurve(points)
    ctx.strokeStyle = '#238fe4'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = 'rgba(35, 143, 228, 0.18)'
    ctx.shadowBlur = 7
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  points.forEach((point, index) => {
    if (point.x > revealX + 1) {
      return
    }
    const isLatest = index === points.length - 1
    if (isLatest) {
      ctx.beginPath()
      ctx.fillStyle = 'rgba(35, 144, 232, 0.13)'
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#238fe4'
    ctx.lineWidth = isLatest ? 2.5 : 1.8
    ctx.arc(point.x, point.y, isLatest ? 4.2 : 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  ctx.restore()
}

function drawExtrema(points: PlotPoint[]) {
  if (points.length === 0) {
    return
  }

  const minPoint = points.find(point => point.key === safeModel.value.minPointKey)
  const maxPoint = points.find(point => point.key === safeModel.value.maxPointKey)
  if (!minPoint || !maxPoint) {
    return
  }

  if (minPoint.key === maxPoint.key) {
    drawPill(
      `最高 · 最低 ${minPoint.value.toFixed(1)}`,
      minPoint.x,
      minPoint.y - 26,
      '#2577aa',
      'rgba(232, 245, 253, 0.96)',
    )
    return
  }

  drawPill(
    `最高 ${maxPoint.value.toFixed(1)}`,
    maxPoint.x,
    maxPoint.y - 26,
    '#2577aa',
    'rgba(232, 245, 253, 0.96)',
  )
  drawPill(
    `最低 ${minPoint.value.toFixed(1)}`,
    minPoint.x,
    minPoint.y + 7,
    '#2577aa',
    'rgba(232, 245, 253, 0.96)',
  )
}

function drawSelection(layout: ChartLayout, points: PlotPoint[]) {
  const point = points[selectedIndex.value]
  if (!point) {
    return
  }

  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(35, 144, 232, 0.34)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.moveTo(point.x, layout.top)
  ctx.lineTo(point.x, layout.top + layout.plotHeight)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.fillStyle = '#238fe4'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5
  ctx.arc(point.x, point.y, 5.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawEmpty(layout: ChartLayout) {
  const centerX = layout.left + layout.plotWidth / 2
  const centerY = layout.top + layout.plotHeight / 2
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = '#8cc4e6'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(centerX - 26, centerY - 2)
  ctx.lineTo(centerX - 16, centerY - 9)
  ctx.lineTo(centerX - 6, centerY + 2)
  ctx.lineTo(centerX + 7, centerY - 12)
  ctx.lineTo(centerX + 18, centerY - 5)
  ctx.lineTo(centerX + 27, centerY - 16)
  ctx.stroke()
  ctx.fillStyle = '#a2aab5'
  ctx.font = '500 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('暂无趋势数据', centerX, centerY + 14)
  ctx.restore()
}

function draw(progress = 1) {
  if (!ctx || !width || !height) {
    return
  }

  ctx.clearRect(0, 0, width, height)
  const layout = getLayout()
  const points = getPlotPoints(layout)
  drawGrid(layout)
  drawTarget(layout)
  drawTrend(layout, points, progress)
  if (points.length === 0) {
    drawEmpty(layout)
  }
  if (progress >= 0.98) {
    drawExtrema(points)
    drawSelection(layout, points)
  }
}

function animate() {
  if (!canvas || !ctx) {
    return
  }

  cancelAnimation()
  const generation = animationGeneration
  let startedAt: number | null = null
  const duration = 320
  const step = (timestamp: number) => {
    if (generation !== animationGeneration) {
      return
    }

    startedAt ??= timestamp
    const elapsed = Math.max(0, timestamp - startedAt)
    const rawProgress = Math.min(1, elapsed / duration)
    const easedProgress = 1 - (1 - rawProgress) ** 3
    draw(easedProgress)
    if (rawProgress < 1) {
      animationHandle = canvas.requestAnimationFrame(step)
    }
    else {
      animationHandle = null
    }
  }

  animationHandle = canvas.requestAnimationFrame(step)
}

function initCanvas() {
  const query = wx.createSelectorQuery().in(instance?.proxy || instance)
  query.select(`#${canvasId}`)
    .fields({ node: true, size: true })
  query.exec((result) => {
    const field = result?.[0]
    if (!field?.node) {
      return
    }

    canvas = field.node
    ctx = canvas.getContext('2d')
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    dpr = windowInfo.pixelRatio || 1
    width = field.width || windowInfo.windowWidth
    height = field.height || 190
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.scale(dpr, dpr)
    selectedIndex.value = Math.max(0, safeModel.value.points.length - 1)
    animate()
  })
}

function resolveTouchX(event: any) {
  const touch = event?.touches?.[0] ?? event?.changedTouches?.[0]
  const localX = Number(touch?.x)
  if (Number.isFinite(localX)) {
    return localX
  }
  const clientX = Number(touch?.clientX ?? touch?.pageX)
  return Number.isFinite(clientX) ? clientX - canvasLeft : null
}

function selectFromTouch(event: any) {
  const x = resolveTouchX(event)
  if (x === null || safeModel.value.points.length === 0) {
    return
  }

  cancelAnimation()
  const layout = getLayout()
  const ratio = (x - layout.left) / layout.plotWidth
  selectedIndex.value = resolveNearestTrendPoint(safeModel.value.points, ratio)
  draw()
}

onMounted(() => {
  setTimeout(initCanvas, 80)
})

onUnmounted(() => {
  cancelAnimation()
  canvas = null
  ctx = null
})

watch(modelSignature, () => {
  selectedIndex.value = Math.max(0, safeModel.value.points.length - 1)
  animate()
})

watch(() => props.targetWeight, () => {
  draw()
})

watch(() => props.showTarget, () => {
  draw()
})
</script>

<template>
  <view class="weight-trend-chart">
    <view class="weight-trend-readout" :class="selectedPoint ? '' : 'weight-trend-readout-empty'">
      <view class="weight-trend-readout-copy">
        <text class="weight-trend-readout-eyebrow">
          {{ selectedPoint ? `${selectedPoint.dateLabel} · ${selectedPoint.weekdayLabel}` : `${safeModel.rangeLabel}趋势` }}
        </text>
        <text class="weight-trend-readout-hint">
          {{ selectedPoint ? selectedDeltaText : '记录后将在这里生成体重曲线' }}
        </text>
      </view>
      <view v-if="selectedPoint" class="weight-trend-readout-value">
        <text class="weight-trend-readout-number">{{ selectedPoint.value.toFixed(1) }}</text>
        <text class="weight-trend-readout-unit">千克</text>
        <view class="weight-trend-delta-dot" :class="`weight-trend-delta-dot-${selectedDeltaTone}`" />
      </view>
      <view v-else class="weight-trend-readout-placeholder">
        <view class="i-lucide-chart-no-axes-combined" />
      </view>
    </view>

    <view class="weight-trend-canvas-shell">
      <canvas
        :id="canvasId"
        type="2d"
        class="weight-trend-canvas"
        @touchstart.stop="selectFromTouch"
        @touchmove.stop="selectFromTouch"
      />
    </view>
  </view>
</template>

<style scoped>
.weight-trend-chart {
  width: 100%;
}

.weight-trend-readout {
  display: flex;
  align-items: center;
  min-height: 82rpx;
  padding: 0 6rpx 18rpx;
}

.weight-trend-readout-empty {
  opacity: 0.82;
}

.weight-trend-readout-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.weight-trend-readout-eyebrow {
  color: #262a31;
  font-size: 25rpx;
  font-weight: 650;
  line-height: 1.15;
}

.weight-trend-readout-hint {
  overflow: hidden;
  color: #949aa5;
  font-size: 21rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weight-trend-readout-value {
  position: relative;
  display: flex;
  align-items: baseline;
  margin-left: 20rpx;
  padding-right: 18rpx;
}

.weight-trend-readout-number {
  color: #15191f;
  font-size: 42rpx;
  font-weight: 720;
  letter-spacing: -1.5rpx;
  line-height: 1;
}

.weight-trend-readout-unit {
  margin-left: 5rpx;
  color: #848b96;
  font-size: 20rpx;
  font-weight: 500;
}

.weight-trend-delta-dot {
  position: absolute;
  right: 0;
  top: 4rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
}

.weight-trend-delta-dot-up {
  background: #f06a60;
}

.weight-trend-delta-dot-down {
  background: #2c9be8;
}

.weight-trend-delta-dot-flat {
  background: #aeb4bd;
}

.weight-trend-readout-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  background: #edf6fc;
  color: #53a5db;
  font-size: 28rpx;
}

.weight-trend-canvas-shell {
  position: relative;
  width: 100%;
  height: 388rpx;
  overflow: hidden;
  border: 1rpx solid rgba(52, 75, 96, 0.06);
  border-radius: 26rpx;
  background:
    linear-gradient(180deg, rgba(245, 250, 254, 0.78), rgba(255, 255, 255, 0.96) 42%),
    #ffffff;
}

.weight-trend-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

</style>
