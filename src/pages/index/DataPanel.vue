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
const monthStatCards = computed(() => [
  { key: 'days', label: '记录天数', value: `${dataView.value.stats.recordedDays}`, unit: '天' },
  { key: 'rate', label: '记录率', value: `${dataView.value.stats.completionRate}`, unit: '%' },
  { key: 'low', label: '最低体重', value: dataView.value.stats.lowestWeightLabel, unit: '千克' },
  { key: 'high', label: '最高体重', value: dataView.value.stats.highestWeightLabel, unit: '千克' },
])

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
  <view class="pb-[220rpx] pt-[10rpx]">
    <view class="rounded-[34rpx] bg-white px-[28rpx] py-[26rpx] shadow-[0_16rpx_40rpx_rgba(15,23,42,0.06)]">
      <view class="flex items-center justify-between">
        <text class="text-[34rpx] font-semibold text-[#12131a]">
          {{ dataView.monthLabel }}
        </text>
        <view class="flex items-center gap-[16rpx]">
          <view class="calendar-nav-btn" hover-class="calendar-nav-btn-active" @tap="shiftMonth(-1)">
            ‹
          </view>
          <view
            class="calendar-nav-btn"
            :class="canMoveNext ? '' : 'calendar-nav-btn-disabled'"
            hover-class="calendar-nav-btn-active"
            @tap="shiftMonth(1)"
          >
            ›
          </view>
        </view>
      </view>

      <view class="mt-[12rpx] flex items-center justify-between text-[22rpx] text-[#9ca0ab]">
        <text>{{ monthRecordsLoading ? '按月份同步云端记录…' : '按日期查看体重记录' }}</text>
        <text v-if="monthRecordsError || cloudWeightStoreError">{{ monthRecordsError || cloudWeightStoreError }}</text>
      </view>

      <view class="mt-[32rpx] grid grid-cols-7 gap-y-[18rpx] text-center">
        <text v-for="label in dataView.weekdayLabels" :key="label" class="text-[24rpx] font-medium text-[#c1c3cb]">
          {{ label }}
        </text>
      </view>

      <view class="mt-[20rpx] grid grid-cols-7 gap-y-[14rpx] text-center">
        <view v-for="day in dataView.days" :key="day.key" class="flex min-h-[92rpx] items-center justify-center">
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

      <view class="mt-[18rpx] border-t border-[#ececf2] pt-[8rpx]">
        <view class="flex items-center justify-between border-b border-[#ececf2] py-[26rpx]">
          <text class="text-[30rpx] text-[#15161c]">月平均</text>
          <view class="flex items-center text-[30rpx] text-[#15161c]">
            <text class="font-medium">{{ dataView.monthAverageLabel }}</text>
            <text class="ml-[6rpx] text-[#70727d]">{{ dataView.unitLabel }}</text>
          </view>
        </view>
        <view class="flex items-center justify-between py-[26rpx]">
          <text class="text-[30rpx] text-[#15161c]">体重变化</text>
          <view class="flex items-center">
            <view class="mr-[14rpx] flex h-[34rpx] w-[34rpx] items-center justify-center rounded-full bg-[#5aa8ff] text-[22rpx] text-white">
              →
            </view>
            <view class="flex items-center text-[30rpx] text-[#15161c]">
              <text class="font-medium">{{ dataView.weightChangeLabel }}</text>
              <text class="ml-[6rpx] text-[#70727d]">{{ dataView.unitLabel }}</text>
            </view>
          </view>
        </view>
        <view class="mt-[10rpx] grid grid-cols-2 gap-[14rpx] pb-[10rpx]">
          <view
            v-for="card in monthStatCards"
            :key="card.key"
            class="month-stat-card"
          >
            <text class="month-stat-label">{{ card.label }}</text>
            <view class="month-stat-value">
              {{ card.value }}
              <text v-if="card.value !== '--'" class="month-stat-unit">{{ card.unit }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-for="group in dataView.weekGroups" :key="group.key" class="mt-[34rpx]">
      <view class="mb-[18rpx] text-[28rpx] font-semibold text-[#12131a]">
        {{ group.label }}
      </view>
      <view class="rounded-[28rpx] bg-white px-[28rpx] py-[22rpx] shadow-[0_16rpx_40rpx_rgba(15,23,42,0.06)]">
        <view class="flex items-center">
          <view class="h-[24rpx] w-[24rpx] rounded-full bg-[#d5d6dc]" />
          <text class="ml-[18rpx] text-[28rpx] text-[#8f919c]">
            {{ group.summaryText }}
          </text>
        </view>
        <view v-if="group.hasRecords" class="mt-[20rpx] grid grid-cols-2 gap-[14rpx]">
          <view class="week-stat-chip">
            <text class="week-stat-label">最新</text>
            <text class="week-stat-value">{{ group.latestWeightLabel }} 千克</text>
          </view>
          <view class="week-stat-chip">
            <text class="week-stat-label">变化</text>
            <text class="week-stat-value">{{ group.deltaLabel }} 千克</text>
          </view>
          <view class="week-stat-chip">
            <text class="week-stat-label">均重</text>
            <text class="week-stat-value">{{ group.averageWeightLabel }} 千克</text>
          </view>
          <view class="week-stat-chip">
            <text class="week-stat-label">区间</text>
            <text class="week-stat-value">{{ group.rangeLabel }} 千克</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.calendar-nav-btn {
  display: flex;
  height: 54rpx;
  width: 54rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #4b95f3;
  font-size: 48rpx;
  line-height: 1;
  transition: background-color 160ms ease, opacity 160ms ease;
}

.calendar-nav-btn-active {
  background: rgba(75, 149, 243, 0.08);
}

.calendar-nav-btn-disabled {
  opacity: 0.35;
}

.calendar-day {
  position: relative;
  display: flex;
  height: 70rpx;
  width: 70rpx;
  align-items: center;
  justify-content: center;
}

.calendar-day-recorded {
  border-radius: 999rpx;
  background: #e7e7ea;
}

.calendar-day-recorded-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
}

.calendar-day-idle-text {
  color: #81838f;
  font-size: 30rpx;
  font-weight: 500;
}

.calendar-day-underline {
  position: absolute;
  bottom: 10rpx;
  left: 50%;
  height: 4rpx;
  width: 28rpx;
  transform: translateX(-50%);
  border-radius: 999rpx;
  background: #ffffff;
}

.month-stat-card {
  border-radius: 22rpx;
  background: #f5f7fb;
  padding: 18rpx 20rpx;
}

.month-stat-label {
  display: block;
  color: #8d919c;
  font-size: 22rpx;
  line-height: 1.2;
}

.month-stat-value {
  margin-top: 12rpx;
  color: #16171d;
  font-size: 30rpx;
  line-height: 1;
  font-weight: 700;
}

.month-stat-unit {
  margin-left: 6rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: #7a7f8a;
}

.week-stat-chip {
  border-radius: 20rpx;
  background: #f7f8fb;
  padding: 18rpx 20rpx;
}

.week-stat-label {
  display: block;
  color: #90939d;
  font-size: 22rpx;
  line-height: 1.2;
}

.week-stat-value {
  display: block;
  margin-top: 10rpx;
  color: #18191f;
  font-size: 24rpx;
  line-height: 1.25;
  font-weight: 600;
}
</style>
