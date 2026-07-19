<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'wevu'

import { listWeightRecords } from '@/services/weightApi'
import { buildMonthlyRecordsView } from '@/services/weightModels'
import { cloudWeightStoreError, refreshWeightRecords } from '@/services/weightStore'

defineComponentJson({
  virtualHost: true,
  styleIsolation: 'apply-shared',
})

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthKey(timestamp: number) {
  const date = new Date(timestamp)
  return date.getFullYear() * 12 + date.getMonth()
}

const today = new Date()
const currentMonthTimestamp = getMonthStart(today).getTime()
const visibleMonthTimestamp = ref(currentMonthTimestamp)
const monthRecordsLoading = ref(false)
const monthRecordsError = ref('')
const dataView = ref(buildMonthlyRecordsView([], visibleMonthTimestamp.value, today))
let activeMonthRequestKey = ''

const canMoveNext = computed(() => getMonthKey(visibleMonthTimestamp.value) < getMonthKey(currentMonthTimestamp))
const monthStatusText = computed(() => {
  if (monthRecordsError.value || cloudWeightStoreError.value) {
    return monthRecordsError.value || cloudWeightStoreError.value
  }

  return monthRecordsLoading.value ? '正在同步本月记录…' : ''
})
const displayWeightChange = computed(() => (
  dataView.value.weightChangeLabel === '--' ? '0.0' : dataView.value.weightChangeLabel
))
const weightChangeDirectionIcon = computed(() => {
  const value = Number(displayWeightChange.value)
  if (value > 0) {
    return 'i-lucide-arrow-up'
  }
  if (value < 0) {
    return 'i-lucide-arrow-down'
  }
  return 'i-lucide-arrow-right'
})

onMounted(() => {
  refreshWeightRecords().catch(() => {
    wx.showToast({
      title: cloudWeightStoreError.value || '同步失败',
      icon: 'none',
    })
  })
  loadMonthData(visibleMonthTimestamp.value)
})

function shiftMonth(offset: number) {
  if (offset > 0 && !canMoveNext.value) {
    return
  }

  const nextMonth = new Date(visibleMonthTimestamp.value)
  nextMonth.setMonth(nextMonth.getMonth() + offset)
  visibleMonthTimestamp.value = getMonthStart(nextMonth).getTime()
}

function openRecordDetail(event: WechatMiniprogram.TouchEvent) {
  const recordId = String(event.currentTarget.dataset.recordId || '')
  if (!recordId) {
    return
  }

  wx.navigateTo({
    url: `/pages/record-detail/index?id=${encodeURIComponent(recordId)}`,
  })
}

watch(visibleMonthTimestamp, (month) => {
  loadMonthData(month)
})

function serializeRecordDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadMonthData(month: number) {
  const monthStart = getMonthStart(new Date(month))
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  const requestKey = `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`
  activeMonthRequestKey = requestKey
  monthRecordsLoading.value = true
  monthRecordsError.value = ''

  try {
    const records = await listWeightRecords({
      startDate: serializeRecordDate(monthStart),
      endDate: serializeRecordDate(monthEnd),
      limit: 200,
    })

    if (activeMonthRequestKey !== requestKey) {
      return
    }

    dataView.value = buildMonthlyRecordsView(records, monthStart, today)
  }
  catch (error) {
    if (activeMonthRequestKey !== requestKey) {
      return
    }

    monthRecordsError.value = error instanceof Error ? error.message : '月数据同步失败'
    dataView.value = buildMonthlyRecordsView([], monthStart, today)
  }
  finally {
    if (activeMonthRequestKey === requestKey) {
      monthRecordsLoading.value = false
    }
  }
}
</script>

<template>
  <view class="data-panel">
    <view class="calendar-card">
      <view class="calendar-header">
        <text class="calendar-month">
          {{ dataView.monthLabel }}
        </text>
        <view class="calendar-nav">
          <view
            class="calendar-nav-btn"
            hover-class="calendar-nav-btn-active"
            :hover-stay-time="80"
            @tap="shiftMonth(-1)"
          >
            <view class="nav-chevron i-lucide-chevron-left" />
          </view>
          <view
            class="calendar-nav-btn calendar-nav-btn-next"
            :class="canMoveNext ? '' : 'calendar-nav-btn-disabled'"
            hover-class="calendar-nav-btn-active"
            :hover-stay-time="80"
            @tap="shiftMonth(1)"
          >
            <view class="nav-chevron i-lucide-chevron-right" />
          </view>
        </view>
      </view>

      <view v-if="monthStatusText" class="calendar-status">
        <view class="calendar-status-dot" :class="monthRecordsLoading ? 'calendar-status-dot-loading' : 'calendar-status-dot-error'" />
        <text>{{ monthStatusText }}</text>
      </view>

      <view class="calendar-weekdays">
        <text v-for="label in dataView.weekdayLabels" :key="label" class="calendar-weekday">
          {{ label }}
        </text>
      </view>

      <view class="calendar-grid">
        <view v-for="day in dataView.days" :key="day.key" class="calendar-cell">
          <view
            v-if="day.label"
            class="calendar-day"
            :class="day.isRecorded ? 'calendar-day-recorded' : 'calendar-day-idle'"
          >
            <text :class="day.isRecorded ? 'calendar-day-recorded-text' : 'calendar-day-idle-text'">
              {{ day.label }}
            </text>
            <view
              v-if="day.isToday"
              class="calendar-day-underline"
              :class="day.isRecorded ? 'calendar-day-underline-light' : 'calendar-day-underline-accent'"
            />
          </view>
        </view>
      </view>

      <view class="month-summary">
        <view class="month-summary-item month-summary-average">
          <text class="month-summary-label">月平均</text>
          <view class="month-summary-value">
            <text>{{ dataView.monthAverageLabel }}</text>
            <text class="month-summary-unit">{{ dataView.unitLabel }}</text>
          </view>
        </view>

        <view class="month-summary-item month-summary-change">
          <text class="month-summary-label">体重变化</text>
          <view class="month-summary-change-row">
            <view class="change-direction">
              <view class="change-direction-icon" :class="weightChangeDirectionIcon" />
            </view>
            <view class="month-summary-value">
              <text>{{ displayWeightChange }}</text>
              <text class="month-summary-unit">{{ dataView.unitLabel }}</text>
            </view>
          </view>
        </view>

        <view class="summary-chevron-wrap">
          <view class="summary-chevron i-lucide-chevron-right" />
        </view>
      </view>
    </view>

    <view v-for="group in dataView.weekGroups" :key="group.key" class="week-section">
      <view class="week-title">
        {{ group.label }}
      </view>
      <view class="week-card" :class="group.hasRecords ? 'week-card-records' : 'week-card-empty'">
        <view v-if="!group.hasRecords" class="week-card-content">
          <view class="week-dot" :class="group.hasRecords ? 'week-dot-active' : ''" />
          <text class="week-summary" :class="group.hasRecords ? 'week-summary-active' : ''">
            {{ group.summaryText }}
          </text>
        </view>

        <block v-else>
          <view
            v-for="record in group.records"
            :key="record.id"
            class="week-record"
            hover-class="week-record-active"
            :data-record-id="record.id"
            @tap="openRecordDetail"
          >
            <view class="week-record-main">
              <view class="week-dot week-dot-active" />
              <view class="week-record-weight">
                <text class="week-record-value">{{ record.weightLabel }}</text>
                <text class="week-record-unit">千克</text>
              </view>
              <view class="week-record-delta" :class="`week-record-delta-${record.deltaDirection}`">
                <view
                  class="week-record-delta-icon"
                  :class="record.deltaDirection === 'up'
                    ? 'i-lucide-arrow-up'
                    : record.deltaDirection === 'down'
                      ? 'i-lucide-arrow-down'
                      : 'i-lucide-arrow-right'"
                />
                <text>{{ record.deltaLabel }}</text>
                <text class="week-record-delta-unit">千克</text>
              </view>
              <view class="week-record-date">
                <text>{{ record.dateLabel }}</text>
                <text class="week-record-time">{{ record.timeLabel }}</text>
              </view>
              <view class="week-record-chevron i-lucide-chevron-right" />
            </view>

            <view v-if="record.photoFileId || record.notePreview" class="week-record-attachments">
              <image
                v-if="record.photoFileId"
                class="week-record-photo"
                :src="record.photoFileId"
                mode="aspectFill"
              />
              <view v-if="record.notePreview" class="week-record-note">
                <view class="week-record-note-icon">
                  <t-icon name="edit-1" size="24rpx" />
                </view>
                <text class="week-record-note-text" :max-lines="2">{{ record.notePreview }}</text>
              </view>
              <view v-if="record.photoCount > 1" class="week-record-photo-count">
                +{{ record.photoCount - 1 }}
              </view>
            </view>
          </view>
        </block>
      </view>
    </view>
  </view>
</template>

<style scoped>
.data-panel {
  width: 100%;
  box-sizing: border-box;
  padding-top: 18rpx;
  padding-bottom: 220rpx;
}

.calendar-card {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 48rpx;
  background: #ffffff;
  padding: 34rpx 30rpx 0;
  box-shadow: 0 18rpx 44rpx rgba(24, 30, 47, 0.035);
}

.calendar-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 6rpx;
}

.calendar-month {
  color: #08090c;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.8rpx;
}

.calendar-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.calendar-nav-btn-next {
  margin-left: 20rpx;
}

.calendar-nav-btn {
  display: flex;
  flex-direction: row;
  height: 58rpx;
  width: 58rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  transition: background-color 140ms ease, opacity 140ms ease;
}

.calendar-nav-btn-active {
  background: rgba(43, 145, 239, 0.1);
}

.calendar-nav-btn-disabled {
  opacity: 0.28;
}

.nav-chevron {
  color: #3095ed;
  font-size: 34rpx;
}

.calendar-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 18rpx 6rpx -4rpx;
  color: #92949c;
  font-size: 21rpx;
  line-height: 1.3;
}

.calendar-status-dot {
  height: 10rpx;
  width: 10rpx;
  flex-shrink: 0;
  margin-right: 10rpx;
  border-radius: 999rpx;
}

.calendar-status-dot-loading {
  background: #3095ed;
}

.calendar-status-dot-error {
  background: #ec6b62;
}

.calendar-weekdays {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 100%;
  margin-top: 42rpx;
  text-align: center;
}

.calendar-weekday {
  display: block;
  width: 14.285714%;
  flex-shrink: 0;
  color: #c4c5ca;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 1.2;
}

.calendar-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 14rpx;
  text-align: center;
}

.calendar-cell {
  display: flex;
  flex-direction: row;
  width: 14.285714%;
  min-height: 88rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.calendar-day {
  position: relative;
  display: flex;
  flex-direction: row;
  height: 72rpx;
  width: 72rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
}

.calendar-day-recorded {
  background: #e3e3e5;
}

.calendar-day-recorded-text {
  color: #ffffff;
  font-size: 29rpx;
  font-weight: 500;
}

.calendar-day-idle-text {
  color: #85868d;
  font-size: 29rpx;
  font-weight: 500;
}

.calendar-day-underline {
  position: absolute;
  bottom: 9rpx;
  left: 50%;
  height: 4rpx;
  width: 26rpx;
  transform: translateX(-50%);
  border-radius: 999rpx;
}

.calendar-day-underline-light {
  background: #ffffff;
}

.calendar-day-underline-accent {
  background: #2f95ed;
}

.month-summary {
  position: relative;
  display: flex;
  flex-direction: row;
  width: 100%;
  box-sizing: border-box;
  align-items: stretch;
  margin-top: 18rpx;
  border-top: 2rpx solid #ededf0;
  padding: 28rpx 0 30rpx;
}

.month-summary-item {
  box-sizing: border-box;
  padding: 0 8rpx;
}

.month-summary-average {
  width: 37%;
  flex-shrink: 0;
  border-right: 2rpx solid #e8e8eb;
}

.month-summary-change {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0%;
  padding-left: 28rpx;
}

.month-summary-label {
  color: #898a90;
  font-size: 25rpx;
  line-height: 1.2;
}

.month-summary-value {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-top: 14rpx;
  color: #08090c;
  font-size: 35rpx;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.month-summary-unit {
  margin-left: 7rpx;
  font-size: 23rpx;
  font-weight: 600;
}

.month-summary-change-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.change-direction {
  display: flex;
  flex-direction: row;
  height: 38rpx;
  width: 38rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-top: 14rpx;
  margin-right: 10rpx;
  border-radius: 999rpx;
  background: #399bed;
  color: #ffffff;
}

.change-direction-icon {
  font-size: 24rpx;
}

.summary-chevron-wrap {
  display: flex;
  flex-direction: row;
  width: 42rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
}

.summary-chevron {
  color: #0b0c10;
  font-size: 34rpx;
}

.week-section {
  margin-top: 36rpx;
}

.week-title {
  margin-bottom: 18rpx;
  padding-left: 20rpx;
  color: #090a0d;
  font-size: 31rpx;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.4rpx;
}

.week-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  box-shadow: 0 16rpx 38rpx rgba(24, 30, 47, 0.025);
}

.week-card-empty {
  border-radius: 999rpx;
  padding: 28rpx 30rpx;
}

.week-card-records {
  overflow: hidden;
  border-radius: 40rpx;
  padding: 0 28rpx;
}

.week-card-content {
  display: flex;
  flex-direction: row;
  min-height: 34rpx;
  align-items: center;
}

.week-dot {
  height: 24rpx;
  width: 24rpx;
  flex-shrink: 0;
  border-radius: 999rpx;
  background: #d1d2d5;
}

.week-dot-active {
  background: #399bed;
  box-shadow: 0 0 0 8rpx rgba(57, 155, 237, 0.1);
}

.week-summary {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0%;
  margin-left: 20rpx;
  color: #929398;
  font-size: 29rpx;
  line-height: 1.25;
}

.week-summary-active {
  color: #55575f;
  font-weight: 500;
}

.week-record {
  padding: 28rpx 0;
  transition: opacity 120ms ease-out, transform 120ms ease-out;
}

.week-record + .week-record {
  border-top: 1rpx solid #eceef1;
}

.week-record-active {
  opacity: 0.72;
  transform: scale(0.99);
}

.week-record-main {
  display: flex;
  align-items: center;
  min-height: 54rpx;
}

.week-record-weight {
  display: flex;
  align-items: baseline;
  width: 178rpx;
  margin-left: 20rpx;
  color: #111319;
  white-space: nowrap;
}

.week-record-value {
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1;
}

.week-record-unit {
  margin-left: 7rpx;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
}

.week-record-delta {
  display: flex;
  align-items: center;
  gap: 2rpx;
  width: 150rpx;
  font-size: 26rpx;
  line-height: 1;
  white-space: nowrap;
}

.week-record-delta-icon {
  flex-shrink: 0;
  font-size: 24rpx;
}

.week-record-delta-up {
  color: #ef6a61;
}

.week-record-delta-down,
.week-record-delta-flat {
  color: #3298ef;
}

.week-record-delta-unit {
  margin-left: 4rpx;
  font-size: 20rpx;
  font-weight: 600;
}

.week-record-chevron {
  flex-shrink: 0;
  color: #c3c5ca;
  font-size: 30rpx;
}

.week-record-date {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 10rpx;
  color: #888a91;
  font-size: 23rpx;
  line-height: 1.15;
  white-space: nowrap;
}

.week-record-time {
  margin-top: 6rpx;
  color: #b0b2b8;
  font-size: 19rpx;
}

.week-record-attachments {
  position: relative;
  display: flex;
  align-items: stretch;
  margin-top: 20rpx;
  padding-left: 44rpx;
}

.week-record-photo {
  height: 112rpx;
  width: 112rpx;
  flex-shrink: 0;
  border-radius: 18rpx;
  background: #e9eaed;
}

.week-record-note {
  display: flex;
  flex: 1;
  min-width: 0;
  margin-left: 14rpx;
  border-radius: 18rpx;
  background: #f6f7f9;
  padding: 14rpx 16rpx;
}

.week-record-note:first-child {
  margin-left: 0;
}

.week-record-note-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40rpx;
  width: 40rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  background: #fbe5d5;
  color: #ef7d39;
}

.week-record-note-text {
  flex: 1;
  min-width: 0;
  margin-left: 10rpx;
  color: #666971;
  font-size: 21rpx;
  line-height: 1.4;
  word-break: break-all;
}

.week-record-photo-count {
  position: absolute;
  left: 122rpx;
  bottom: 8rpx;
  border-radius: 999rpx;
  background: rgba(20, 22, 28, 0.72);
  padding: 5rpx 9rpx;
  color: #ffffff;
  font-size: 17rpx;
  line-height: 1;
}
</style>
