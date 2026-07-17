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
const weightChangeDirection = computed(() => {
  const value = Number(displayWeightChange.value)
  if (value > 0) {
    return '↑'
  }
  if (value < 0) {
    return '↓'
  }
  return '→'
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
            <view class="nav-chevron nav-chevron-left" />
          </view>
          <view
            class="calendar-nav-btn"
            :class="canMoveNext ? '' : 'calendar-nav-btn-disabled'"
            hover-class="calendar-nav-btn-active"
            :hover-stay-time="80"
            @tap="shiftMonth(1)"
          >
            <view class="nav-chevron nav-chevron-right" />
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
            <view v-if="day.isToday" class="calendar-day-underline" />
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
              {{ weightChangeDirection }}
            </view>
            <view class="month-summary-value">
              <text>{{ displayWeightChange }}</text>
              <text class="month-summary-unit">{{ dataView.unitLabel }}</text>
            </view>
          </view>
        </view>

        <view class="summary-chevron-wrap">
          <view class="summary-chevron" />
        </view>
      </view>
    </view>

    <view v-for="group in dataView.weekGroups" :key="group.key" class="week-section">
      <view class="week-title">
        {{ group.label }}
      </view>
      <view class="week-card">
        <view class="week-card-content">
          <view class="week-dot" :class="group.hasRecords ? 'week-dot-active' : ''" />
          <text class="week-summary" :class="group.hasRecords ? 'week-summary-active' : ''">
            {{ group.summaryText }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.data-panel {
  padding-top: 18rpx;
  padding-bottom: 220rpx;
}

.calendar-card {
  overflow: hidden;
  border-radius: 48rpx;
  background: #ffffff;
  padding: 34rpx 30rpx 0;
  box-shadow: 0 18rpx 44rpx rgba(24, 30, 47, 0.035);
}

.calendar-header {
  display: flex;
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
  align-items: center;
  gap: 20rpx;
}

.calendar-nav-btn {
  display: flex;
  height: 58rpx;
  width: 58rpx;
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
  height: 20rpx;
  width: 20rpx;
  border-top: 5rpx solid #3095ed;
  border-right: 5rpx solid #3095ed;
  border-radius: 2rpx;
}

.nav-chevron-left {
  transform: rotate(-135deg);
}

.nav-chevron-right {
  transform: rotate(45deg);
}

.calendar-status {
  display: flex;
  align-items: center;
  margin: 18rpx 6rpx -4rpx;
  color: #92949c;
  font-size: 21rpx;
  line-height: 1.3;
}

.calendar-status-dot {
  height: 10rpx;
  width: 10rpx;
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
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-top: 42rpx;
  text-align: center;
}

.calendar-weekday {
  color: #c4c5ca;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 1.2;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-top: 14rpx;
  text-align: center;
}

.calendar-cell {
  display: flex;
  min-height: 88rpx;
  align-items: center;
  justify-content: center;
}

.calendar-day {
  position: relative;
  display: flex;
  height: 72rpx;
  width: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
}

.calendar-day-recorded {
  background: linear-gradient(145deg, #eeeeef 0%, #dcdcdf 100%);
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
  background: #2f95ed;
}

.calendar-day-recorded .calendar-day-underline {
  background: #ffffff;
}

.month-summary {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.24fr 42rpx;
  margin-top: 18rpx;
  border-top: 2rpx solid #ededf0;
  padding: 28rpx 0 30rpx;
}

.month-summary-item {
  min-width: 0;
  padding: 0 8rpx;
}

.month-summary-average {
  border-right: 2rpx solid #e8e8eb;
}

.month-summary-change {
  padding-left: 28rpx;
}

.month-summary-label {
  color: #898a90;
  font-size: 25rpx;
  line-height: 1.2;
}

.month-summary-value {
  display: flex;
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
  align-items: center;
}

.change-direction {
  display: flex;
  height: 38rpx;
  width: 38rpx;
  flex: none;
  align-items: center;
  justify-content: center;
  margin-top: 14rpx;
  margin-right: 10rpx;
  border-radius: 999rpx;
  background: #399bed;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1;
}

.summary-chevron-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.summary-chevron {
  height: 18rpx;
  width: 18rpx;
  border-top: 6rpx solid #0b0c10;
  border-right: 6rpx solid #0b0c10;
  border-radius: 2rpx;
  transform: rotate(45deg);
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
  border-radius: 999rpx;
  background: #ffffff;
  padding: 28rpx 30rpx;
  box-shadow: 0 16rpx 38rpx rgba(24, 30, 47, 0.025);
}

.week-card-content {
  display: flex;
  min-height: 34rpx;
  align-items: center;
}

.week-dot {
  height: 24rpx;
  width: 24rpx;
  flex: none;
  border-radius: 999rpx;
  background: #d1d2d5;
}

.week-dot-active {
  background: #399bed;
  box-shadow: 0 0 0 8rpx rgba(57, 155, 237, 0.1);
}

.week-summary {
  margin-left: 20rpx;
  color: #929398;
  font-size: 29rpx;
  line-height: 1.25;
}

.week-summary-active {
  color: #55575f;
  font-weight: 500;
}
</style>
