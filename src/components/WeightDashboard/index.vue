<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'wevu'

import WeightRuler from '@/components/WeightRuler/index.vue'
import { cloudWeightRecordSaving, cloudWeightRecordsLoading, cloudWeightStoreError, dashboardView, refreshWeightRecords, saveWeightRecord } from '@/services/weightStore'

import { buildWeightEntryModes, buildWeightEntryReadoutMotion } from './weightEntry'
import WeightEntryRuler from './WeightEntryRuler.vue'

const ENTRY_WEIGHT_MIN = 30
const ENTRY_WEIGHT_MAX = 150
const ENTRY_WEIGHT_STEP = 0.1
const DEFAULT_WEIGHT = 70

defineComponentJson({
  styleIsolation: 'apply-shared',
  usingComponents: {
    "t-popup": "tdesign-miniprogram/popup/popup",
  },
})

const weightValue = ref(DEFAULT_WEIGHT)
const entryModes = buildWeightEntryModes()
const entryPopupVisible = ref(false)
const entryModeKey = ref(entryModes[0]?.key ?? 'now')
const draftWeight = ref(weightValue.value)
const entryMotionOffset = ref(0)
const entryAtMin = ref(false)
const entryAtMax = ref(false)

const dashboard = computed(() => dashboardView.value)
const hasRecords = computed(() => dashboard.value.hasRecords)
const summary = computed(() => dashboard.value.summary)
const todayRecord = computed(() => dashboard.value.todayRecord)
const recentRecords = computed(() => dashboard.value.recentRecords)
const chart = computed(() => dashboard.value.chart)

const selectedEntryMode = computed(() => {
  return entryModes.find((mode) => mode.key === entryModeKey.value) ?? entryModes[0]
})
const entryDisplayWeight = computed(() => draftWeight.value.toFixed(1))
const entryReadoutMotion = computed(() => buildWeightEntryReadoutMotion(entryMotionOffset.value))
const entryReadoutCardStyle = computed(() => {
  const motion = entryReadoutMotion.value
  return {
    transform: `translate3d(${motion.translateX}px, ${motion.translateY}px, 0) scale(${motion.scale})`,
    opacity: motion.opacity,
    boxShadow: `0 ${motion.shadow}px ${motion.shadow * 1.9}px rgba(24, 29, 39, 0.08)`,
  }
})

const latestWeight = computed(() => {
  return hasRecords.value ? summary.value.recent.current : DEFAULT_WEIGHT
})
const recentMarkerPercent = computed(() => {
  const min = summary.value.recent.min
  const max = summary.value.recent.max
  const current = summary.value.recent.current
  const ratio = max - min <= 0 ? 0.5 : (current - min) / (max - min)
  return Math.min(100, Math.max(0, ratio * 100))
})

const bmiSegmentColors = ['#56C7F2', '#42D2C6', '#79DA58', '#9CDF35', '#F2BF58', '#F4A25D']
const bmiMarkerPercent = computed(() => {
  const maxIndex = bmiSegmentColors.length - 1
  const ratio = maxIndex <= 0 ? 0 : summary.value.bmiMarkerIndex / maxIndex
  return Math.min(100, Math.max(0, ratio * 100))
})

const chartYPositions = [0, 50, 100]
const chartVerticalLines = [25, 50, 75]
const trendDirection = computed(() => {
  if (!hasRecords.value) {
    return '↑'
  }
  if (summary.value.deltaFromStart < 0) {
    return '↓'
  }
  if (summary.value.deltaFromStart === 0) {
    return '→'
  }
  return '↑'
})
const trendDeltaText = computed(() => {
  return hasRecords.value ? Math.abs(summary.value.deltaFromStart).toFixed(1) : '--'
})
const syncTimeText = computed(() => {
  if (cloudWeightStoreError.value) {
    return cloudWeightStoreError.value
  }

  if (cloudWeightRecordsLoading.value) {
    return '云端同步中…'
  }

  return dashboard.value.syncText
})

watch(latestWeight, (val) => {
  weightValue.value = Number(val.toFixed(1))
  if (!entryPopupVisible.value) {
    draftWeight.value = Number(val.toFixed(1))
  }
}, { immediate: true })

onMounted(() => {
  refreshWeightRecords().catch(() => {
    wx.showToast({
      title: cloudWeightStoreError.value || '云端同步失败',
      icon: 'none',
    })
  })
})

function pointStyle(xPercent: number, yPercent: number) {
  return `left:${xPercent}%;top:${yPercent}%;`
}

function markerStyle(percent: number) {
  return `left:${percent}%;`
}

function onWeightChange(val: number) {
  weightValue.value = val
}

function openEntryPopup() {
  draftWeight.value = Number(latestWeight.value.toFixed(1))
  entryModeKey.value = entryModes[0]?.key ?? 'now'
  entryMotionOffset.value = 0
  entryAtMin.value = false
  entryAtMax.value = false
  entryPopupVisible.value = true
}

function closeEntryPopup() {
  entryMotionOffset.value = 0
  entryAtMin.value = false
  entryAtMax.value = false
  entryPopupVisible.value = false
}

function selectEntryMode(modeKey: string) {
  entryModeKey.value = modeKey as typeof entryModeKey.value
}

async function saveEntryWeight() {
  if (cloudWeightRecordSaving.value) {
    return
  }

  try {
    await saveWeightRecord({
      weight: Number(draftWeight.value.toFixed(1)),
      mode: entryModeKey.value,
    })
    closeEntryPopup()
    wx.showToast({
      title: '记录成功',
      icon: 'success',
    })
  }
  catch {
    wx.showToast({
      title: cloudWeightStoreError.value || '保存失败',
      icon: 'none',
    })
  }
}

function handleEntryPopupVisibleChange(e: WechatMiniprogram.CustomEvent<{ visible: boolean }>) {
  entryPopupVisible.value = !!e.detail.visible
  if (!entryPopupVisible.value) {
    entryMotionOffset.value = 0
    entryAtMin.value = false
    entryAtMax.value = false
  }
}

function handleEntryRulerMotion(e: WechatMiniprogram.CustomEvent<{ offset?: number, atMin?: boolean, atMax?: boolean }>) {
  entryMotionOffset.value = e.detail?.offset ?? 0
  entryAtMin.value = !!e.detail?.atMin
  entryAtMax.value = !!e.detail?.atMax
}

function onDraftWeightChange(val: number) {
  draftWeight.value = val
  console.log('Draft weight changed:', val)
}
</script>

<template>
  <view class="dashboard-shell pb-[292rpx] pt-[8rpx]">
    <view class="hero-ruler">
      <WeightRuler
        :min="ENTRY_WEIGHT_MIN"
        :max="ENTRY_WEIGHT_MAX"
        :step="ENTRY_WEIGHT_STEP"
        :model-value="weightValue"
        @update:modelValue="onWeightChange"
      />
    </view>

    <view class="summary-card">
      <view class="summary-top">
        <view class="summary-top-left">
          <text class="summary-kicker">{{ hasRecords ? summary.startLabel : '开始记录' }}</text>
          <view class="summary-number">
            {{ hasRecords ? summary.startWeight.toFixed(1) : '--' }}
            <text v-if="hasRecords" class="summary-unit">千克</text>
          </view>
        </view>

        <view class="summary-top-right">
          <text class="summary-kicker">{{ hasRecords ? `${summary.totalDays}天` : '暂无记录' }}</text>
          <view class="summary-delta">
            <view v-if="hasRecords" class="summary-delta-badge">
              {{ trendDirection }}
            </view>
            <view class="summary-number">
              {{ trendDeltaText }}
              <text v-if="hasRecords" class="summary-unit">千克</text>
            </view>
          </view>
        </view>

        <text class="summary-arrow">›</text>
      </view>

      <view class="summary-divider" />

      <view class="summary-bottom">
        <view class="metric-col">
          <text class="metric-label">近期</text>
          <view class="recent-scale">
            <text class="metric-side-text">{{ hasRecords ? summary.recent.min.toFixed(0) : '--' }}</text>
            <view class="recent-track">
              <view class="recent-track-fill" />
              <view class="recent-track-marker" :style="markerStyle(recentMarkerPercent)" />
            </view>
            <text class="metric-side-text">{{ hasRecords ? summary.recent.max.toFixed(0) : '--' }}</text>
          </view>
        </view>

        <view class="metric-col metric-col-center">
          <text class="metric-label">本周</text>
          <view class="week-dots">
            <view
              v-for="(checked, index) in summary.weekCheckIn"
              :key="index"
              class="week-dot"
              :class="checked ? 'week-dot-active' : ''"
            />
          </view>
        </view>

        <view class="metric-col">
          <text class="metric-label">BMI</text>
          <view class="bmi-value">{{ hasRecords ? summary.bmiValue.toFixed(1) : '--' }}</view>
          <view class="bmi-track-wrap">
            <view class="bmi-track">
              <view
                v-for="(color, index) in bmiSegmentColors"
                :key="index"
                class="bmi-segment"
                :style="`background:${color};`"
              />
            </view>
            <view class="bmi-marker" :style="markerStyle(bmiMarkerPercent)" />
          </view>
        </view>
      </view>
    </view>

    <view class="section-block">
      <view class="section-head">
        <text class="section-title">图表</text>
        <view class="section-actions">
          <view class="range-pill">{{ chart.rangeLabel }}</view>
          <view class="round-arrow">›</view>
        </view>
      </view>

      <view class="panel-card chart-card">
        <view class="chart-frame">
          <view
            v-for="(top, index) in chartYPositions"
            :key="'h-' + index"
            class="chart-line-horizontal"
            :style="`top:${top}%;`"
          />
          <view
            v-for="line in chartVerticalLines"
            :key="'v-' + line"
            class="chart-line-vertical"
            :style="`left:${line}%;`"
          />

          <view
            v-for="point in chart.points"
            :key="point.key"
            class="chart-point"
            :class="point.highlighted ? 'chart-point-active' : ''"
            :style="pointStyle(point.xPercent, point.yPercent)"
          />

          <view v-if="chart.points.length === 0" class="chart-empty-state">
            暂无图表数据
          </view>

          <view class="chart-y-ticks">
            <text v-for="(tick, index) in chart.yTicks" :key="'tick-' + index">
              {{ tick.toFixed(0) }}
            </text>
          </view>
        </view>

        <view class="chart-x-ticks">
          <text v-for="label in chart.xLabels" :key="label">
            {{ label }}
          </text>
        </view>
      </view>
    </view>

    <view class="section-block">
      <view class="section-title">{{ dashboard.todayLabel }}</view>
      <view class="panel-card empty-card">
        <view v-if="todayRecord" class="record-row">
          <view class="record-main">
            <view class="record-bullet record-bullet-accent" />
            <view class="record-copy">
              <view class="record-value">
                {{ todayRecord.value.toFixed(1) }}
                <text class="record-unit">千克</text>
              </view>
              <text class="record-note">{{ todayRecord.note }}</text>
            </view>
          </view>

          <view class="record-side">
            <text class="record-delta" :class="todayRecord.delta >= 0 ? 'record-delta-up' : 'record-delta-down'">
              {{ todayRecord.delta >= 0 ? '↑' : '↓' }}{{ Math.abs(todayRecord.delta).toFixed(1) }}千克
            </text>
            <text class="record-date">{{ todayRecord.dateText }}</text>
          </view>
        </view>
        <view v-else class="empty-row">
          <view class="empty-dot" />
          <text class="empty-text">{{ dashboard.todayEmptyText }}</text>
        </view>
      </view>
    </view>

    <view class="section-block">
      <view class="section-title">{{ dashboard.recentTitle }}</view>
      <view class="panel-card record-card">
        <view v-if="recentRecords.length === 0" class="empty-row">
          <view class="empty-dot" />
          <text class="empty-text">无</text>
        </view>
        <view
          v-for="(record, index) in recentRecords"
          :key="record.dateText"
          class="record-row"
          :class="index !== recentRecords.length - 1 ? 'record-row-divider' : ''"
        >
          <view class="record-main">
            <view class="record-bullet" :class="index === 0 ? 'record-bullet-accent' : ''" />
            <view class="record-copy">
              <view class="record-value">
                {{ record.value.toFixed(1) }}
                <text class="record-unit">千克</text>
              </view>
              <text class="record-note">{{ record.note }}</text>
            </view>
          </view>

          <view class="record-side">
            <text class="record-delta" :class="record.delta >= 0 ? 'record-delta-up' : 'record-delta-down'">
              {{ record.delta >= 0 ? '↑' : '↓' }}{{ Math.abs(record.delta).toFixed(1) }}千克
            </text>
            <text class="record-date">{{ record.dateText }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="sync-block">
      <view class="sync-copy">
        <text class="sync-cloud">☁</text>
        <text>{{ syncTimeText }}</text>
      </view>
      <view class="add-button" @tap="openEntryPopup">+</view>
    </view>

    <t-popup
      :visible="entryPopupVisible"
      placement="bottom"
      :close-on-overlay-click="true"
      @visible-change="handleEntryPopupVisibleChange"
    >
      <view v-if="entryPopupVisible" class="entry-popup-shell">
        <view class="entry-popup-card">
          <view class="entry-popup-head">
            <view class="entry-mode-row">
              <view
                v-for="mode in entryModes"
                :key="mode.key"
                class="entry-mode-pill"
                :style="`background:${mode.fill};color:${mode.tone};`"
                :class="mode.key === entryModeKey ? 'entry-mode-pill-active' : 'entry-mode-pill-muted'"
                @tap="selectEntryMode(mode.key)"
              >
                <text class="entry-mode-icon">{{ mode.icon }}</text>
                <text>{{ mode.label }}</text>
              </view>
            </view>

            <view class="entry-tools">
              <view class="entry-tool-circle">…</view>
              <view class="entry-tool-circle entry-tool-close" @tap="closeEntryPopup">×</view>
            </view>
          </view>

          <view class="entry-readout">
            <view class="entry-readout-card" :style="entryReadoutCardStyle">
              <text class="entry-readout-value">{{ entryDisplayWeight }}</text>
              <text class="entry-readout-unit">千克</text>
            </view>
          </view>

          <view class="entry-ruler-wrap">
            <WeightEntryRuler
              :model-value="draftWeight"
              :min="ENTRY_WEIGHT_MIN"
              :max="ENTRY_WEIGHT_MAX"
              :step="ENTRY_WEIGHT_STEP"
              @update:modelValue="onDraftWeightChange"
              @motion="handleEntryRulerMotion"
            />
          </view>

          <view class="entry-limit-row">
            <view class="entry-limit-chip" :class="entryAtMin ? 'entry-limit-chip-active' : ''">
              <text class="entry-limit-caption">最小</text>
              <text class="entry-limit-value">{{ ENTRY_WEIGHT_MIN.toFixed(1) }} kg</text>
            </view>
            <view class="entry-limit-center">
              <text>滚动刻度选择体重</text>
            </view>
            <view class="entry-limit-chip entry-limit-chip-right" :class="entryAtMax ? 'entry-limit-chip-active' : ''">
              <text class="entry-limit-caption">最大</text>
              <text class="entry-limit-value">{{ ENTRY_WEIGHT_MAX.toFixed(1) }} kg</text>
            </view>
          </view>

          <view class="entry-hint">
            {{ selectedEntryMode?.actionText }}
          </view>

          <view class="entry-submit" :class="cloudWeightRecordSaving ? 'entry-submit-disabled' : ''" @tap="saveEntryWeight">
            {{ cloudWeightRecordSaving ? '保存中…' : '记录体重' }}
          </view>
        </view>
      </view>
    </t-popup>
  </view>
</template>

<style scoped>
.dashboard-shell {
  color: #111115;
}

.hero-ruler {
  margin-top: 32rpx;
}

.summary-card {
  margin-top: -8rpx;
  border-radius: 42rpx;
  background: rgba(255, 255, 255, 0.94);
  padding: 28rpx 30rpx 24rpx;
  box-shadow: 0 14rpx 40rpx rgba(17, 17, 21, 0.05);
}

.summary-top {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
}

.summary-top-left,
.summary-top-right {
  flex: 1;
  min-width: 0;
}

.summary-top-right {
  padding-right: 46rpx;
}

.summary-kicker {
  display: block;
  font-size: 30rpx;
  line-height: 1.2;
  color: #b2b2b7;
}

.summary-number {
  margin-top: 8rpx;
  font-size: 64rpx;
  line-height: 1;
  font-weight: 600;
  color: #111115;
  white-space: nowrap;
}

.summary-unit {
  margin-left: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.summary-delta {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.summary-delta-badge {
  height: 50rpx;
  width: 50rpx;
  border-radius: 9999rpx;
  background: #fb6257;
  color: #fff;
  font-size: 28rpx;
  line-height: 50rpx;
  text-align: center;
  font-weight: 700;
  flex-shrink: 0;
}

.summary-arrow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 58rpx;
  color: #c6c6cb;
}

.summary-divider {
  margin: 24rpx 0 20rpx;
  height: 1px;
  background: #e5e5e8;
}

.summary-bottom {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
}

.metric-col {
  min-width: 0;
}

.metric-col-center {
  padding: 0 8rpx;
}

.metric-label {
  display: block;
  font-size: 26rpx;
  line-height: 1.2;
  color: #7f7f84;
  font-weight: 600;
}

.recent-scale {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.metric-side-text {
  font-size: 24rpx;
  line-height: 1;
  color: #8c8c92;
  flex-shrink: 0;
}

.recent-track {
  position: relative;
  height: 18rpx;
  flex: 1;
  border-radius: 9999rpx;
  background: #e0e0e3;
}

.recent-track-fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #ececed 0%, #d7d7da 100%);
}

.recent-track-marker {
  position: absolute;
  top: 50%;
  height: 32rpx;
  width: 6rpx;
  border-radius: 9999rpx;
  background: #4b4b52;
  transform: translate(-50%, -50%);
}

.week-dots {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.week-dot {
  height: 18rpx;
  width: 18rpx;
  border-radius: 9999rpx;
  background: #d0d0d4;
}

.week-dot-active {
  background: #8f8f95;
}

.bmi-value {
  margin-top: 10rpx;
  font-size: 28rpx;
  line-height: 1;
  font-weight: 700;
  color: #1c1c21;
}

.bmi-track-wrap {
  position: relative;
  margin-top: 14rpx;
  padding-right: 6rpx;
}

.bmi-track {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.bmi-segment {
  height: 18rpx;
  flex: 1;
  border-radius: 6rpx;
}

.bmi-marker {
  position: absolute;
  top: 50%;
  height: 30rpx;
  width: 6rpx;
  border-radius: 9999rpx;
  background: #4d4d54;
  transform: translate(-50%, -50%);
}

.section-block {
  margin-top: 28rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.section-title {
  font-size: 50rpx;
  line-height: 1.16;
  font-weight: 700;
  color: #101014;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.range-pill {
  min-width: 124rpx;
  padding: 10rpx 22rpx;
  border-radius: 9999rpx;
  background: #dbdbe0;
  color: #6e6e74;
  font-size: 26rpx;
  line-height: 1;
  text-align: center;
}

.round-arrow {
  height: 58rpx;
  width: 58rpx;
  border-radius: 9999rpx;
  background: #dbdbe0;
  color: #7a7a80;
  font-size: 42rpx;
  line-height: 58rpx;
  text-align: center;
}

.panel-card {
  margin-top: 16rpx;
  border-radius: 38rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14rpx 40rpx rgba(17, 17, 21, 0.045);
}

.chart-card {
  padding: 20rpx 18rpx 16rpx 20rpx;
}

.chart-frame {
  position: relative;
  height: 440rpx;
  overflow: visible;
  border: 1px solid #e2e2e5;
  border-radius: 10rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 248, 250, 0.78) 100%);
}

.chart-line-horizontal {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid #e7e7ea;
}

.chart-line-vertical {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px dashed #d9d9de;
}

.chart-point {
  position: absolute;
  height: 16rpx;
  width: 16rpx;
  margin-left: -8rpx;
  margin-top: -8rpx;
  border-radius: 9999rpx;
  background: #eff7ff;
  border: 4rpx solid #8bc8f0;
}

.chart-point-active {
  background: #d8efff;
  border-color: #2390e8;
  box-shadow: 0 0 0 8rpx rgba(35, 144, 232, 0.12);
}

.chart-empty-state {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #b2b4bc;
  font-size: 28rpx;
}

.chart-y-ticks {
  pointer-events: none;
  position: absolute;
  right: -54rpx;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #9a9aa1;
  font-size: 28rpx;
  line-height: 1;
}

.chart-x-ticks {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  padding: 0 8rpx;
  color: #97979e;
  font-size: 28rpx;
  line-height: 1;
}

.empty-card {
  padding: 28rpx 30rpx;
}

.empty-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.empty-dot {
  height: 22rpx;
  width: 22rpx;
  border-radius: 9999rpx;
  background: #cbccd0;
}

.empty-text {
  color: #8f9096;
  font-size: 28rpx;
  line-height: 1;
}

.record-card {
  overflow: hidden;
}

.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx 28rpx;
}

.record-row-divider {
  border-bottom: 1px solid #ededf0;
}

.record-main {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 0;
}

.record-bullet {
  height: 18rpx;
  width: 18rpx;
  border-radius: 9999rpx;
  background: #d0d0d4;
  flex-shrink: 0;
}

.record-bullet-accent {
  background: #fb6257;
}

.record-copy {
  min-width: 0;
}

.record-value {
  font-size: 34rpx;
  line-height: 1.08;
  font-weight: 700;
  color: #19191e;
}

.record-unit {
  margin-left: 6rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.record-note {
  display: block;
  margin-top: 6rpx;
  color: #9a9aa0;
  font-size: 22rpx;
  line-height: 1.2;
}

.record-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
  flex-shrink: 0;
}

.record-delta {
  font-size: 24rpx;
  line-height: 1;
  font-weight: 600;
}

.record-delta-up {
  color: #fb6257;
}

.record-delta-down {
  color: #2d8ce7;
}

.record-date {
  color: #98989e;
  font-size: 22rpx;
  line-height: 1;
}

.sync-block {
  margin-top: 42rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.sync-copy {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: #95969c;
  font-size: 26rpx;
  line-height: 1;
}

.sync-cloud {
  font-size: 30rpx;
}

.add-button {
  height: 144rpx;
  width: 144rpx;
  border-radius: 9999rpx;
  background: #4f5057;
  color: #fff;
  font-size: 92rpx;
  line-height: 132rpx;
  text-align: center;
  box-shadow: 0 16rpx 40rpx rgba(79, 80, 87, 0.22);
}

.entry-popup-shell {
  padding: 0 14rpx max(env(safe-area-inset-bottom), 20rpx);
}

.entry-popup-card {
  border-radius: 40rpx 40rpx 34rpx 34rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -16rpx 60rpx rgba(15, 23, 42, 0.08);
  padding: 30rpx 26rpx 26rpx;
}

.entry-popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.entry-mode-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
}

.entry-mode-pill {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 24rpx;
  border-radius: 9999rpx;
  font-size: 26rpx;
  line-height: 1;
  font-weight: 600;
}

.entry-mode-pill-active {
  transform: scale(1);
  box-shadow: 0 10rpx 24rpx rgba(17, 17, 21, 0.08);
}

.entry-mode-pill-muted {
  opacity: 0.72;
}

.entry-mode-icon {
  font-size: 28rpx;
}

.entry-tools {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.entry-tool-circle {
  height: 56rpx;
  width: 56rpx;
  border-radius: 9999rpx;
  background: #f0f1f4;
  color: #131318;
  font-size: 32rpx;
  line-height: 56rpx;
  text-align: center;
}

.entry-tool-close {
  font-size: 40rpx;
}

.entry-readout {
  margin-top: 82rpx;
  display: flex;
  justify-content: center;
}

.entry-readout-card {
  display: inline-flex;
  align-items: flex-end;
  gap: 10rpx;
  border-radius: 28rpx;
  background: #f3f4f6;
  padding: 20rpx 34rpx 18rpx;
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out;
  will-change: transform, box-shadow, opacity;
}

.entry-readout-value {
  font-size: 78rpx;
  line-height: 1;
  font-weight: 700;
  color: #121217;
}

.entry-readout-unit {
  padding-bottom: 10rpx;
  font-size: 28rpx;
  line-height: 1;
  font-weight: 700;
  color: #121217;
}

.entry-ruler-wrap {
  margin-top: 72rpx;
  overflow: hidden;
}

.entry-limit-row {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.entry-limit-chip {
  min-width: 128rpx;
  border-radius: 18rpx;
  background: #f5f6f8;
  padding: 14rpx 18rpx;
  color: #8e9098;
  transition: background 160ms ease, color 160ms ease, transform 160ms ease;
}

.entry-limit-chip-right {
  text-align: right;
}

.entry-limit-chip-active {
  background: #e9eefc;
  color: #456fdd;
  transform: translateY(-2rpx);
}

.entry-limit-caption {
  display: block;
  font-size: 20rpx;
  line-height: 1;
}

.entry-limit-value {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1;
  font-weight: 700;
}

.entry-limit-center {
  flex: 1;
  text-align: center;
  color: #b0b2ba;
  font-size: 22rpx;
  line-height: 1.2;
}

.entry-hint {
  margin-top: 24rpx;
  text-align: center;
  color: #a0a2aa;
  font-size: 24rpx;
  line-height: 1.3;
}

.entry-submit {
  margin-top: 48rpx;
  height: 104rpx;
  border-radius: 9999rpx;
  background: #31343a;
  color: #fff;
  font-size: 38rpx;
  line-height: 104rpx;
  text-align: center;
  font-weight: 600;
}

.entry-submit-disabled {
  opacity: 0.68;
}
</style>
