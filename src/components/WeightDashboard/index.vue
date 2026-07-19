<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'wevu'

import WeightRuler from '@/components/WeightRuler/index.vue'
import {
  cloudUserSettings,
  cloudUserSettingsReady,
  refreshUserSettings,
} from '@/services/settingsStore'
import { chooseWeightPhoto, uploadWeightPhotos, type WeightPhotoSelection } from '@/services/weightMedia'
import {
  cloudWeightLastSyncedAt,
  cloudWeightRecords,
  cloudWeightRecordSaving,
  cloudWeightRecordsLoading,
  cloudWeightStoreError,
  dashboardView,
  refreshWeightRecords,
  saveWeightRecord,
} from '@/services/weightStore'

import { buildWeightEntryModes, buildWeightEntryReadoutMotion, resolveWeightEntryPayloadValue } from './weightEntry'
import WeightEntryRuler from './WeightEntryRuler.vue'
import {
  buildWeightTrendChartModel,
  WEIGHT_TREND_RANGES,
  type WeightTrendRange,
} from './weightTrend'
import WeightTrendChart from './WeightTrendChart.vue'

const ENTRY_WEIGHT_MIN = 30
const ENTRY_WEIGHT_MAX = 150
const ENTRY_WEIGHT_STEP = 0.1
const DEFAULT_WEIGHT = 70
defineComponentJson({
  styleIsolation: 'apply-shared',
})

const weightValue = ref(DEFAULT_WEIGHT)
const entryModes = buildWeightEntryModes()
const entryPopupVisible = ref(false)
const entryModeKey = ref(entryModes[0]?.key ?? 'now')
const draftWeight = ref(weightValue.value)
const entryMotionOffset = ref(0)
const entryAtMin = ref(false)
const entryAtMax = ref(false)
const entryRecordedAt = ref(Date.now())
const entryTimePickerVisible = ref(false)
const entryPhoto = ref<WeightPhotoSelection | null>(null)
const entryPhotoChoosing = ref(false)
const entryPhotoUploading = ref(false)
const entryNote = ref('')
const entryPickerStart = new Date(2016, 0, 1).getTime()
const entryPickerEnd = ref(Date.now())
const entryPickerMode = ['date', 'minute']
const entryPickerPopupProps = {
  zIndex: 13000,
}

const dashboard = computed(() => dashboardView.value)
const hasRecords = computed(() => dashboard.value.hasRecords)
const summary = computed(() => dashboard.value.summary)
const todayRecord = computed(() => dashboard.value.todayRecord)
const recentRecords = computed(() => dashboard.value.recentRecords)
const selectedTrendRange = ref<WeightTrendRange>('30d')
const chartReferenceDate = computed(() => (
  cloudWeightLastSyncedAt.value
    ? new Date(cloudWeightLastSyncedAt.value)
    : new Date()
))
const chart = computed(() => buildWeightTrendChartModel(
  cloudWeightRecords.value,
  chartReferenceDate.value,
  selectedTrendRange.value,
))
const targetWeight = computed(() => (
  cloudUserSettings.value.targetWeight
))

const selectedEntryMode = computed(() => {
  return entryModes.find((mode) => mode.key === entryModeKey.value) ?? entryModes[0]
})
const entryDisplayWeight = computed(() => draftWeight.value.toFixed(1))
const entryRecordedAtLabel = computed(() => {
  const date = new Date(entryRecordedAt.value)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
})
const entrySaveBusy = computed(() => cloudWeightRecordSaving.value || entryPhotoUploading.value)
const entrySubmitText = computed(() => {
  if (entryPhotoUploading.value) {
    return '正在上传照片…'
  }

  return cloudWeightRecordSaving.value ? '保存中…' : '记录体重'
})
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

const trendDirectionIcon = computed(() => {
  if (!hasRecords.value) {
    return 'i-lucide-arrow-up'
  }
  if (summary.value.deltaFromStart < 0) {
    return 'i-lucide-arrow-down'
  }
  if (summary.value.deltaFromStart === 0) {
    return 'i-lucide-arrow-right'
  }
  return 'i-lucide-arrow-up'
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
  if (!cloudUserSettingsReady.value) {
    refreshUserSettings().catch(() => undefined)
  }
})

function markerStyle(percent: number) {
  return `left:${percent}%;`
}

function selectTrendRange(range: WeightTrendRange) {
  if (range === selectedTrendRange.value) {
    return
  }
  selectedTrendRange.value = range
}

function selectTrendRangeFromEvent(event: WechatMiniprogram.TouchEvent) {
  const range = String(event.currentTarget.dataset.trendRange ?? '')
  if (!WEIGHT_TREND_RANGES.some(option => option.key === range)) {
    return
  }

  selectTrendRange(range as WeightTrendRange)
}

function onWeightChange(val: number) {
  weightValue.value = val
}

function openEntryPopup() {
  draftWeight.value = Number(latestWeight.value.toFixed(1))
  entryModeKey.value = entryModes[0]?.key ?? 'now'
  entryRecordedAt.value = Date.now()
  entryTimePickerVisible.value = false
  entryPhoto.value = null
  entryNote.value = ''
  entryMotionOffset.value = 0
  entryAtMin.value = false
  entryAtMax.value = false
  entryPopupVisible.value = true
}

function closeEntryPopup() {
  if (entrySaveBusy.value) {
    return
  }

  entryMotionOffset.value = 0
  entryAtMin.value = false
  entryAtMax.value = false
  entryTimePickerVisible.value = false
  entryPopupVisible.value = false
}

function blockEntryOverlayTouchMove() {}

async function selectEntryMode(modeKey: string) {
  entryModeKey.value = modeKey as typeof entryModeKey.value

  if (modeKey === 'now') {
    entryPickerEnd.value = Date.now()
    entryTimePickerVisible.value = true
    return
  }

  if (modeKey === 'photo') {
    await chooseEntryPhoto()
  }
}

function selectEntryModeFromEvent(event: WechatMiniprogram.TouchEvent) {
  selectEntryMode(String(event.currentTarget.dataset.modeKey || 'now')).catch(() => {})
}

function isMediaPickerCancel(error: unknown) {
  const message = String((error as { errMsg?: string })?.errMsg ?? '')
  return message.toLowerCase().includes('cancel')
}

async function chooseEntryPhoto() {
  if (entryPhotoChoosing.value || entrySaveBusy.value) {
    return
  }

  entryPhotoChoosing.value = true
  try {
    const photo = await chooseWeightPhoto()
    if (photo.size > 10 * 1024 * 1024) {
      wx.showToast({
        title: '照片不能超过 10MB',
        icon: 'none',
      })
      return
    }
    entryPhoto.value = photo
  }
  catch (error) {
    if (!isMediaPickerCancel(error)) {
      wx.showToast({
        title: '照片选择失败',
        icon: 'none',
      })
    }
  }
  finally {
    entryPhotoChoosing.value = false
  }
}

function removeEntryPhoto() {
  if (!entrySaveBusy.value) {
    entryPhoto.value = null
  }
}

function openEntryTimePicker() {
  if (!entrySaveBusy.value) {
    entryModeKey.value = 'now'
    entryPickerEnd.value = Date.now()
    entryTimePickerVisible.value = true
  }
}

function closeEntryTimePicker() {
  entryTimePickerVisible.value = false
}

function confirmEntryTime(event: WechatMiniprogram.CustomEvent<{ value?: number | string }>) {
  const value = Number(event.detail?.value)
  if (Number.isFinite(value)) {
    entryRecordedAt.value = Math.min(Date.now(), value)
  }
  entryTimePickerVisible.value = false
}

function handleEntryNoteInput(event: WechatMiniprogram.Input) {
  entryNote.value = String(event.detail.value ?? '').slice(0, 200)
}

async function saveEntryWeight() {
  if (entrySaveBusy.value) {
    return
  }

  entryPhotoUploading.value = !!entryPhoto.value
  try {
    const photoFileIds = entryPhoto.value
      ? await uploadWeightPhotos([entryPhoto.value.tempFilePath])
      : []
    await saveWeightRecord({
      weight: Number(draftWeight.value.toFixed(1)),
      mode: entryModeKey.value,
      recordedAt: new Date(entryRecordedAt.value).toISOString(),
      note: entryNote.value,
      photoFileIds,
    })
    entryPhotoUploading.value = false
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
  finally {
    entryPhotoUploading.value = false
  }
}

function handleEntryRulerMotion(payload: WechatMiniprogram.CustomEvent<{ offset?: number, atMin?: boolean, atMax?: boolean, dragging?: boolean }> | { offset?: number, atMin?: boolean, atMax?: boolean, dragging?: boolean, current?: number }) {
  const detail = 'detail' in payload && payload.detail ? payload.detail : payload
  entryMotionOffset.value = detail.offset ?? 0
  entryAtMin.value = !!detail.atMin
  entryAtMax.value = !!detail.atMax
  const nextWeight = resolveWeightEntryPayloadValue(payload)
  if (detail.dragging && nextWeight !== undefined) {
    draftWeight.value = Number(nextWeight.toFixed(1))
  }
}

function onDraftWeightChange(payload: unknown) {
  const nextWeight = resolveWeightEntryPayloadValue(payload)
  if (nextWeight !== undefined) {
    draftWeight.value = Number(nextWeight.toFixed(1))
  }
}
</script>

<template>
  <view class="dashboard-shell pb-[340rpx] pt-[8rpx]">
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
              <view class="summary-delta-icon" :class="trendDirectionIcon" />
            </view>

            <view class="summary-number">
              {{ trendDeltaText }}
              <text v-if="hasRecords" class="summary-unit">千克</text>
            </view>
          </view>
        </view>

        <view class="summary-arrow i-lucide-chevron-right" />
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

        <view class="metric-col pl-3">
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
          <view class="flex items-center w-full gap-1">
            <view class="bmi-value">{{ hasRecords ? summary.bmiValue.toFixed(1) : '--' }}</view>
            <view class="bmi-track-wrap flex-1">
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
    </view>

    <!-- <view class="section-block">
      <view class="section-head">
        <text class="section-title">趋势概览</text>
      </view>

      <view class="stats-grid">
        <view
          v-for="card in statCards"
          :key="card.key"
          class="stat-card"
          :class="`stat-card-${card.tone}`"
        >
          <text class="stat-card-label">{{ card.label }}</text>
          <view class="stat-card-value">
            {{ card.value }}
            <text v-if="card.value !== '--'" class="stat-card-unit">{{ card.unit }}</text>
          </view>
          <text class="stat-card-hint">{{ card.hint }}</text>
        </view>
      </view>

      <view class="panel-card insight-card">
        <view
          v-for="(row, index) in insightRows"
          :key="row.key"
          class="insight-row"
          :class="index !== insightRows.length - 1 ? 'insight-row-divider' : ''"
        >
          <text class="insight-label">{{ row.label }}</text>
          <text class="insight-value">{{ row.value }}</text>
        </view>
      </view>
    </view> -->

    <view class="section-block">
      <view class="section-head">
        <view>
          <text class="section-title">图表</text>
          <!-- <text class="chart-section-subtitle">触摸曲线，查看每次变化</text> -->
        </view>
        <view class="trend-range-control">
          <view
            v-for="option in WEIGHT_TREND_RANGES"
            :key="option.key"
            :data-trend-range="option.key"
            class="trend-range-option"
            :class="selectedTrendRange === option.key ? 'trend-range-option-active' : ''"
            @tap.stop="selectTrendRangeFromEvent"
          >
            {{ option.label }}
          </view>
        </view>
      </view>

      <view class="panel-card chart-card">
        <WeightTrendChart
          id="weight-trend-chart"
          :model="chart"
          :show-target="cloudUserSettingsReady"
          :target-weight="targetWeight"
        />
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
            <view class="record-delta" :class="todayRecord.delta >= 0 ? 'record-delta-up' : 'record-delta-down'">
              <view
                class="record-delta-icon"
                :class="todayRecord.delta >= 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              />
              <text>{{ Math.abs(todayRecord.delta).toFixed(1) }}千克</text>
            </view>
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
            <view class="record-delta" :class="record.delta >= 0 ? 'record-delta-up' : 'record-delta-down'">
              <view
                class="record-delta-icon"
                :class="record.delta >= 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              />
              <text>{{ Math.abs(record.delta).toFixed(1) }}千克</text>
            </view>
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
      <view v-if="!entryPopupVisible" class="add-button" hover-class="add-button-active" @tap="openEntryPopup">+</view>
    </view>

    <view v-if="entryPopupVisible" class="entry-layer">
      <view class="entry-overlay" @tap="closeEntryPopup" @touchmove.stop="blockEntryOverlayTouchMove" />
      <view class="entry-popup-shell">
        <view class="entry-popup-card">
          <view class="entry-popup-head">
            <view class="entry-mode-row">
              <view
                v-for="mode in entryModes"
                :key="mode.key"
                class="entry-mode-pill"
                :style="`background:${mode.fill};color:${mode.tone};`"
                :class="mode.key === entryModeKey ? 'entry-mode-pill-active' : 'entry-mode-pill-muted'"
                :data-mode-key="mode.key"
                @tap="selectEntryModeFromEvent"
              >
                <view class="entry-mode-icon">
                  <t-icon :name="mode.icon" size="28rpx" />
                </view>
                <text class="entry-mode-label">{{ mode.label }}</text>
              </view>
            </view>

            <view class="entry-tools">
              <view class="entry-tool-circle entry-tool-close" hover-class="entry-tool-close-active" @tap="closeEntryPopup">
                <t-icon name="close" size="32rpx" />
              </view>
            </view>
          </view>

          <view class="entry-record-time" hover-class="entry-record-time-active" @tap="openEntryTimePicker">
            <view class="entry-record-time-icon">
              <t-icon name="time" size="26rpx" />
            </view>
            <text class="entry-record-time-label">记录时间</text>
            <text class="entry-record-time-value">{{ entryRecordedAtLabel }}</text>
            <t-icon name="chevron-right" size="24rpx" />
          </view>

          <view v-if="entryModeKey === 'photo'" class="entry-photo-panel">
            <view v-if="entryPhoto" class="entry-photo-preview-wrap">
              <image class="entry-photo-preview" :src="entryPhoto.tempFilePath" mode="aspectFill" />
              <view class="entry-photo-actions">
                <view class="entry-photo-action entry-photo-action-primary" hover-class="entry-photo-action-active" @tap="chooseEntryPhoto">
                  <t-icon name="refresh" size="24rpx" />
                  <text>重新选择</text>
                </view>
                <view class="entry-photo-action entry-photo-action-danger" hover-class="entry-photo-action-active" @tap="removeEntryPhoto">
                  <t-icon name="delete" size="24rpx" />
                  <text>移除</text>
                </view>
              </view>
            </view>
            <view v-else class="entry-photo-empty" hover-class="entry-photo-empty-active" @tap="chooseEntryPhoto">
              <view class="entry-photo-empty-icon">
                <t-icon name="camera" size="34rpx" />
              </view>
              <view class="entry-photo-empty-copy">
                <text class="entry-photo-empty-title">{{ entryPhotoChoosing ? '正在打开相机…' : '拍照或从相册选择' }}</text>
                <text class="entry-photo-empty-subtitle">照片会与本次体重一起保存</text>
              </view>
            </view>
          </view>

          <view v-if="entryModeKey === 'note'" class="entry-note-panel">
            <view class="entry-note-head">
              <text>记录此刻的状态</text>
              <view v-if="entryPhoto" class="entry-note-photo-badge">
                <t-icon name="image" size="22rpx" />
                <text>已添加照片</text>
              </view>
            </view>
            <textarea
              class="entry-note-textarea"
              :value="entryNote"
              :maxlength="200"
              :show-confirm-bar="false"
              placeholder="例如：晨起空腹、运动后、今天状态很好…"
              placeholder-class="entry-note-placeholder"
              @input="handleEntryNoteInput"
            />
            <text class="entry-note-counter">{{ entryNote.length }}/200</text>
          </view>

          <view class="entry-readout" :class="entryModeKey === 'now' ? '' : 'entry-readout-compact'">
            <view class="entry-readout-card" :style="entryReadoutCardStyle">
              <text class="entry-readout-value">{{ entryDisplayWeight }}</text>
              <text class="entry-readout-unit">千克</text>
            </view>
          </view>

          <view class="entry-ruler-wrap">
            <WeightEntryRuler
              id="entry-weight-ruler"
              :model-value="draftWeight"
              :min="ENTRY_WEIGHT_MIN"
              :max="ENTRY_WEIGHT_MAX"
              :step="ENTRY_WEIGHT_STEP"
              bindinput="onDraftWeightChange"
              bindchange="onDraftWeightChange"
              bindmotion="handleEntryRulerMotion"
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

          <view class="entry-submit" :class="entrySaveBusy ? 'entry-submit-disabled' : ''" @tap="saveEntryWeight">
            {{ entrySubmitText }}
          </view>
        </view>
      </view>

      <t-date-time-picker
        :visible="entryTimePickerVisible"
        :value="entryRecordedAt"
        :start="entryPickerStart"
        :end="entryPickerEnd"
        :mode="entryPickerMode"
        :popup-props="entryPickerPopupProps"
        title="选择记录时间"
        confirm-btn="完成"
        cancel-btn="取消"
        @confirm="confirmEntryTime"
        @cancel="closeEntryTimePicker"
        @close="closeEntryTimePicker"
      />
    </view>
  </view>
</template>

<style scoped>
.dashboard-shell {
  color: #111115;
}

.hero-ruler {
  margin-top: 16rpx;
  margin-right: -24rpx;
  margin-left: -24rpx;
}

.summary-card {
  position: relative;
  z-index: 5;
  margin-top: -28rpx;
  border-radius: 46rpx;
  background: #ffffff;
  padding: 26rpx 30rpx 22rpx;
  box-shadow: 0 18rpx 54rpx rgba(24, 29, 40, 0.055);
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
  font-size: 28rpx;
  line-height: 1.2;
  color: #b8b9bf;
  font-weight: 500;
}

.summary-number {
  margin-top: 10rpx;
  font-size: 66rpx;
  line-height: 1;
  font-weight: 500;
  color: #090a0d;
  white-space: nowrap;
  letter-spacing: -1.4rpx;
}

.summary-unit {
  margin-left: 8rpx;
  font-size: 27rpx;
  font-weight: 600;
  letter-spacing: 0;
}

.summary-delta {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.summary-delta-badge {
  display: flex;
  height: 54rpx;
  width: 54rpx;
  align-items: center;
  justify-content: center;
  border-radius: 9999rpx;
  background: #f66158;
  color: #fff;
  flex-shrink: 0;
}

.summary-delta-icon {
  font-size: 30rpx;
}

.summary-arrow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48rpx;
  color: #c6c6cb;
}

.summary-divider {
  margin: 18rpx 0 16rpx;
  height: 1px;
  background: #e1e2e6;
}

.summary-bottom {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.metric-col {
  flex: 1;
  min-width: 0;
}

.metric-label {
  display: block;
  font-size: 25rpx;
  line-height: 1.2;
  color: #777980;
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
  height: 14rpx;
  width: 14rpx;
  border-radius: 100%;
  background: #d0d0d4;
}

.week-dot-active {
  background: #8f8f95;
}

.bmi-value {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1;
  font-weight: 500;
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
  height: 16rpx;
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
  margin-top: 48rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.section-title {
  font-size: 43rpx;
  line-height: 1.16;
  font-weight: 700;
  color: #090a0d;
  letter-spacing: -0.8rpx;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.stats-grid {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.stat-card {
  width: calc(50% - 8rpx);
  border-radius: 30rpx;
  padding: 22rpx 22rpx 20rpx;
  box-shadow: 0 14rpx 32rpx rgba(17, 17, 21, 0.05);
}

.stat-card-sky {
  background: linear-gradient(180deg, #eef7ff 0%, #ffffff 100%);
}

.stat-card-violet {
  background: linear-gradient(180deg, #f3efff 0%, #ffffff 100%);
}

.stat-card-amber {
  background: linear-gradient(180deg, #fff6e9 0%, #ffffff 100%);
}

.stat-card-graphite {
  background: linear-gradient(180deg, #f3f4f7 0%, #ffffff 100%);
}

.stat-card-label {
  display: block;
  color: #8d909c;
  font-size: 24rpx;
  line-height: 1.2;
  font-weight: 600;
}

.stat-card-value {
  margin-top: 16rpx;
  color: #15161c;
  font-size: 44rpx;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
}

.stat-card-unit {
  margin-left: 8rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.stat-card-hint {
  display: block;
  margin-top: 14rpx;
  color: #a0a3ad;
  font-size: 20rpx;
  line-height: 1.35;
}

.insight-card {
  margin-top: 16rpx;
  overflow: hidden;
}

.insight-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 24rpx 28rpx;
}

.insight-row-divider {
  border-bottom: 1px solid #ececf1;
}

.insight-label {
  color: #868993;
  font-size: 26rpx;
  line-height: 1.2;
}

.insight-value {
  color: #17181d;
  font-size: 28rpx;
  line-height: 1.2;
  font-weight: 600;
  text-align: right;
}

.panel-card {
  margin-top: 20rpx;
  border-radius: 44rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 18rpx 52rpx rgba(24, 29, 40, 0.045);
}

.chart-card {
  padding: 24rpx;
}

.chart-section-subtitle {
  display: block;
  margin-top: 7rpx;
  color: #9a9fa8;
  font-size: 21rpx;
  line-height: 1;
}

.trend-range-control {
  display: flex;
  align-items: center;
  padding: 5rpx;
  border: 1rpx solid rgba(64, 76, 91, 0.06);
  border-radius: 999rpx;
  background: #eceff3;
}

.trend-range-option {
  min-width: 62rpx;
  padding: 10rpx 10rpx;
  border-radius: 999rpx;
  color: #858b95;
  font-size: 22rpx;
  font-weight: 550;
  line-height: 1;
  text-align: center;
  transition: color 160ms ease-out, background-color 160ms ease-out, box-shadow 160ms ease-out;
}

.trend-range-option-active {
  background: #ffffff;
  box-shadow: 0 3rpx 10rpx rgba(38, 58, 77, 0.11);
  color: #1c82ca;
  font-weight: 650;
}

.empty-card {
  padding: 32rpx 34rpx;
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
  display: flex;
  align-items: center;
  gap: 3rpx;
  font-size: 24rpx;
  line-height: 1;
  font-weight: 600;
}

.record-delta-icon {
  flex-shrink: 0;
  font-size: 23rpx;
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
  margin-top: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
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
  position: fixed;
  left: 50%;
  bottom: 188rpx;
  z-index: 60;
  height: 120rpx;
  width: 120rpx;
  border-radius: 9999rpx;
  background: rgba(67, 68, 73, 0.96);
  color: #fff;
  font-size: 76rpx;
  line-height: 110rpx;
  text-align: center;
  transform: translateX(-50%);
  border: 1rpx solid rgba(255, 255, 255, 0.46);
  box-shadow:
    0 20rpx 50rpx rgba(45, 47, 54, 0.24),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
  transition: transform 120ms ease-out, background-color 120ms ease-out;
}

.add-button-active {
  transform: translateX(-50%) scale(0.94);
  background: rgba(45, 46, 51, 0.98);
}

.entry-layer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 12000;
}

.entry-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(31, 34, 41, 0.28);
}

.entry-popup-shell {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  padding: 0 20rpx 8rpx;
}

.entry-popup-card {
  overflow: hidden;
  border: 2rpx solid rgba(255, 255, 255, 0.94);
  border-radius: 44rpx;
  background: #fbfbfc;
  box-shadow:
    0 -16rpx 60rpx rgba(15, 23, 42, 0.1),
    0 28rpx 80rpx rgba(15, 23, 42, 0.16),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.98);
  padding: 30rpx 28rpx calc(env(safe-area-inset-bottom) + 18rpx);
}

.entry-popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.entry-mode-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-wrap: nowrap;
  min-width: 0;
}

.entry-mode-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 60rpx;
  padding: 0 20rpx;
  border-radius: 9999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.58);
  font-size: 24rpx;
  line-height: 1;
  font-weight: 500;
  transition: transform 120ms ease-out, opacity 120ms ease-out, box-shadow 120ms ease-out;
}

.entry-mode-pill-active {
  opacity: 1;
  transform: scale(1.02);
  box-shadow:
    0 8rpx 18rpx rgba(17, 17, 21, 0.08),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
}

.entry-mode-pill-muted {
  opacity: 0.68;
}

.entry-mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28rpx;
  width: 28rpx;
}

.entry-mode-label {
  line-height: 1;
}

.entry-tools {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.entry-tool-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  width: 64rpx;
  border-radius: 9999rpx;
  border: 1rpx solid rgba(20, 22, 28, 0.04);
  background: #eceef1;
  color: #17191f;
  transition: transform 120ms ease-out, background-color 120ms ease-out;
}

.entry-tool-close {
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
}

.entry-tool-close-active {
  transform: scale(0.92);
  background: #e1e3e7;
}

.entry-record-time {
  display: flex;
  align-items: center;
  height: 62rpx;
  margin-top: 18rpx;
  border-radius: 20rpx;
  background: #f2f4f7;
  padding: 0 18rpx;
  color: #777a83;
  transition: transform 120ms ease-out, background-color 120ms ease-out;
}

.entry-record-time-active {
  transform: scale(0.985);
  background: #e9ecf1;
}

.entry-record-time-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1686de;
}

.entry-record-time-label {
  margin-left: 10rpx;
  font-size: 23rpx;
  line-height: 1;
}

.entry-record-time-value {
  flex: 1;
  margin-right: 4rpx;
  color: #282b31;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1;
  text-align: right;
}

.entry-photo-panel,
.entry-note-panel {
  margin-top: 16rpx;
  border: 1rpx solid rgba(30, 36, 48, 0.05);
  border-radius: 24rpx;
  background: #f6f7f9;
}

.entry-photo-panel {
  padding: 14rpx;
}

.entry-photo-empty {
  display: flex;
  align-items: center;
  min-height: 104rpx;
  padding: 0 16rpx;
  transition: transform 120ms ease-out, opacity 120ms ease-out;
}

.entry-photo-empty-active {
  opacity: 0.72;
  transform: scale(0.985);
}

.entry-photo-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 68rpx;
  width: 68rpx;
  flex-shrink: 0;
  border-radius: 20rpx;
  background: #dcecf9;
  color: #1686de;
}

.entry-photo-empty-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-left: 18rpx;
}

.entry-photo-empty-title {
  color: #292c33;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 1.2;
}

.entry-photo-empty-subtitle {
  margin-top: 8rpx;
  color: #999ca5;
  font-size: 21rpx;
  line-height: 1.2;
}

.entry-photo-preview-wrap {
  display: flex;
  align-items: center;
}

.entry-photo-preview {
  height: 112rpx;
  width: 112rpx;
  flex-shrink: 0;
  border-radius: 20rpx;
  background: #e5e7eb;
}

.entry-photo-actions {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-left: 18rpx;
}

.entry-photo-action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 600;
  transition: transform 120ms ease-out, opacity 120ms ease-out;
}

.entry-photo-action + .entry-photo-action {
  margin-top: 8rpx;
}

.entry-photo-action-primary {
  background: #e3effa;
  color: #1686de;
}

.entry-photo-action-danger {
  background: #f8e9e7;
  color: #d25c51;
}

.entry-photo-action-active {
  opacity: 0.72;
  transform: scale(0.98);
}

.entry-photo-action text {
  margin-left: 8rpx;
}

.entry-note-panel {
  position: relative;
  padding: 18rpx 18rpx 36rpx;
}

.entry-note-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #555861;
  font-size: 22rpx;
  font-weight: 600;
}

.entry-note-photo-badge {
  display: flex;
  align-items: center;
  border-radius: 999rpx;
  background: #e7e2fc;
  padding: 7rpx 12rpx;
  color: #7162e8;
  font-size: 19rpx;
}

.entry-note-photo-badge text {
  margin-left: 5rpx;
}

.entry-note-textarea {
  width: 100%;
  height: 118rpx;
  box-sizing: border-box;
  margin-top: 12rpx;
  color: #24272e;
  font-size: 24rpx;
  line-height: 1.45;
}

.entry-note-placeholder {
  color: #b1b3bb;
}

.entry-note-counter {
  position: absolute;
  right: 18rpx;
  bottom: 12rpx;
  color: #a4a7af;
  font-size: 19rpx;
  line-height: 1;
}

.entry-readout {
  margin-top: 48rpx;
  display: flex;
  justify-content: center;
}

.entry-readout-compact {
  margin-top: 28rpx;
}

.entry-readout-card {
  display: inline-flex;
  align-items: flex-end;
  gap: 10rpx;
  border-radius: 28rpx;
  background: #f3f4f6;
  padding: 20rpx 34rpx 18rpx;
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out;
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
  border-radius: 24rpx;
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
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
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
