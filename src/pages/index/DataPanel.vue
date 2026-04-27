<script setup lang="ts">
import { computed, onMounted, ref } from 'wevu'

import { cloudWeightRecordsLoading, cloudWeightStoreError, getMonthlyRecordsView, refreshWeightRecords } from '@/services/weightStore'

defineComponentJson({
  virtualHost: true,
  styleIsolation: 'apply-shared',
})

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth()
}

const today = new Date()
const currentMonth = getMonthStart(today)
const visibleMonth = ref(getMonthStart(today))

const dataView = computed(() => getMonthlyRecordsView(visibleMonth.value, today))
const canMoveNext = computed(() => getMonthKey(visibleMonth.value) < getMonthKey(currentMonth))

onMounted(() => {
  refreshWeightRecords().catch(() => {
    wx.showToast({
      title: cloudWeightStoreError.value || '同步失败',
      icon: 'none',
    })
  })
})

function shiftMonth(offset: number) {
  if (offset > 0 && !canMoveNext.value) {
    return
  }

  const nextMonth = new Date(visibleMonth.value)
  nextMonth.setMonth(nextMonth.getMonth() + offset)
  visibleMonth.value = getMonthStart(nextMonth)
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
        <text>{{ cloudWeightRecordsLoading ? '云端同步中…' : '按日期查看体重记录' }}</text>
        <text v-if="cloudWeightStoreError">{{ cloudWeightStoreError }}</text>
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
</style>
