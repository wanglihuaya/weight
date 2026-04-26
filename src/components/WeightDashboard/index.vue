<script setup lang="ts">
import { computed, ref } from 'wevu'

import WeightRuler from '@/components/WeightRuler/index.vue'

import { buildWeightDashboardMock } from './mock'

const mock = buildWeightDashboardMock(new Date())
const weightValue = ref(mock.summary.recent.current)

const summary = computed(() => ({
  ...mock.summary,
  recent: {
    ...mock.summary.recent,
    current: weightValue.value,
  },
}))

const recentMarkerPercent = computed(() => {
  const min = summary.value.recent.min
  const max = summary.value.recent.max
  const current = summary.value.recent.current
  const ratio = max - min <= 0 ? 0.5 : (current - min) / (max - min)
  return Math.min(100, Math.max(0, ratio * 100))
})

const bmiSegmentColors = ['#52B6E8', '#47CCB2', '#7DD321', '#95D92A', '#F0BD4B', '#F09D4F']
const bmiMarkerPercent = computed(() => {
  const maxIndex = bmiSegmentColors.length - 1
  const ratio = summary.value.bmiMarkerIndex / maxIndex
  return Math.min(100, Math.max(0, ratio * 100))
})

const chartYPositions = [0, 50, 100]
const chartVerticalLines = [24, 48, 72]

function pointStyle(xPercent: number, yPercent: number) {
  return `left:${xPercent}%;top:${yPercent}%;`
}

function markerStyle(percent: number) {
  return `left:${percent}%;`
}

function onWeightChange(val: number) {
  weightValue.value = val
}
</script>

<template>
  <view class="pb-[250rpx] pt-[10rpx]">
    <view class="text-[76rpx] font-semibold text-[#101014]">
      我的体重
    </view>

    <view class="mt-[14rpx] flex justify-center">
      <WeightRuler
        :min="30"
        :max="150"
        :step="0.1"
        :model-value="weightValue"
        @update:modelValue="onWeightChange"
      />
    </view>

    <view class="mt-[14rpx] rounded-[36rpx] bg-[#f4f4f5] px-[28rpx] py-[24rpx] shadow-[0_8rpx_20rpx_rgba(15,23,42,0.03)]">
      <view class="flex items-center justify-between">
        <view>
          <view class="text-[42rpx] font-semibold text-[#17171d]">
            {{ summary.yesterdayWeight.toFixed(1) }}
            <text class="ml-[8rpx] text-[30rpx] font-medium">
              千克
            </text>
          </view>
          <view class="mt-[4rpx] text-[34rpx] text-[#a4a4a8]">
            昨天
          </view>
        </view>
        <view class="flex items-center gap-[14rpx]">
          <view class="h-[56rpx] w-[56rpx] rounded-full bg-[#f05a4f] text-center leading-[56rpx] text-[34rpx] text-white">
            ↑
          </view>
          <view>
            <view class="text-[34rpx] text-[#a4a4a8]">
              {{ summary.totalDays }}天
            </view>
            <view class="text-[40rpx] font-semibold text-[#16161b]">
              {{ summary.deltaFromStart.toFixed(1) }}
              <text class="ml-[8rpx] text-[30rpx] font-medium">
                千克
              </text>
            </view>
          </view>
          <view class="pl-[6rpx] text-[50rpx] text-[#b4b4b8]">
            ›
          </view>
        </view>
      </view>

      <view class="my-[18rpx] h-[1px] bg-[#dddddf]" />

      <view class="grid grid-cols-3 gap-[18rpx]">
        <view>
          <view class="text-[30rpx] font-medium text-[#79797f]">
            近期
          </view>
          <view class="mt-[10rpx] flex items-center gap-[8rpx]">
            <text class="text-[34rpx] text-[#77777c]">
              {{ summary.recent.min.toFixed(0) }}
            </text>
            <view class="relative h-[26rpx] flex-1 rounded-full bg-[#d8d8db]">
              <view
                class="absolute top-[-5rpx] h-[36rpx] w-[7rpx] rounded-full bg-[#505057]"
                :style="markerStyle(recentMarkerPercent)"
              />
            </view>
            <text class="text-[34rpx] text-[#77777c]">
              {{ summary.recent.max.toFixed(0) }}
            </text>
          </view>
        </view>

        <view>
          <view class="text-[30rpx] font-medium text-[#79797f]">
            本周
          </view>
          <view class="mt-[16rpx] flex items-center gap-[10rpx]">
            <view
              v-for="(checked, index) in summary.weekCheckIn"
              :key="index"
              class="h-[24rpx] w-[24rpx] rounded-full"
              :class="checked ? 'bg-[#f05a4f]' : 'bg-[#bfc0c3]'"
            />
          </view>
        </view>

        <view>
          <view class="text-[30rpx] font-medium text-[#79797f]">
            BMI
          </view>
          <view class="mt-[8rpx] text-[42rpx] font-semibold text-[#19191e]">
            {{ summary.bmiValue.toFixed(1) }}
          </view>
          <view class="relative mt-[8rpx]">
            <view class="flex items-center gap-[6rpx]">
              <view
                v-for="(color, index) in bmiSegmentColors"
                :key="index"
                class="h-[22rpx] w-[30rpx] rounded-[6rpx]"
                :style="`background:${color};`"
              />
            </view>
            <view class="absolute top-[-22rpx] h-[46rpx] w-[4rpx] -ml-[2rpx] rounded-full bg-[#5b5b61]" :style="markerStyle(bmiMarkerPercent)" />
          </view>
        </view>
      </view>
    </view>

    <view class="mt-[26rpx]">
      <view class="flex items-center justify-between">
        <text class="text-[50rpx] font-semibold text-[#111116]">
          图表
        </text>
        <view class="flex items-center gap-[14rpx]">
          <view class="rounded-full bg-[#d6d6da] px-[24rpx] py-[8rpx] text-[40rpx] text-[#6f6f75]">
            {{ mock.chart.rangeLabel }}
          </view>
          <view class="h-[64rpx] w-[64rpx] rounded-full bg-[#d6d6da] text-center leading-[64rpx] text-[44rpx] text-[#6f6f75]">
            ›
          </view>
        </view>
      </view>

      <view class="mt-[16rpx] rounded-[36rpx] bg-[#f4f4f5] p-[20rpx] shadow-[0_8rpx_20rpx_rgba(15,23,42,0.03)]">
        <view class="relative h-[430rpx] rounded-[8rpx] border border-[#dadadd]">
          <view
            v-for="(top, index) in chartYPositions"
            :key="'h-' + index"
            class="absolute left-0 right-0 border-t border-[#d4d4d8]"
            :style="`top:${top}%;`"
          />
          <view
            v-for="line in chartVerticalLines"
            :key="'v-' + line"
            class="absolute bottom-0 top-0 border-l border-dashed border-[#d1d1d6]"
            :style="`left:${line}%;`"
          />

          <view
            v-for="point in mock.chart.points"
            :key="point.key"
            class="absolute -ml-[9rpx] -mt-[9rpx] h-[18rpx] w-[18rpx] rounded-full border-[4rpx]"
            :class="point.highlighted ? 'border-[#208de4] bg-[#d9f0ff]' : 'border-[#8bc6ef] bg-[#ecf6ff]'"
            :style="pointStyle(point.xPercent, point.yPercent)"
          />

          <view class="pointer-events-none absolute right-[-64rpx] top-0 bottom-0 flex flex-col justify-between text-[40rpx] text-[#8f9095]">
            <text v-for="(tick, index) in mock.chart.yTicks" :key="'tick-' + index">
              {{ tick.toFixed(0) }}
            </text>
          </view>
        </view>

        <view class="mt-[10rpx] flex justify-between px-[6rpx] text-[40rpx] text-[#8f9095]">
          <text v-for="label in mock.chart.xLabels" :key="label">
            {{ label }}
          </text>
        </view>
      </view>
    </view>

    <view class="mt-[28rpx]">
      <view class="text-[50rpx] font-semibold text-[#111116]">
        {{ mock.todayLabel }}
      </view>
      <view class="mt-[14rpx] rounded-[30rpx] bg-[#f4f4f5] px-[30rpx] py-[24rpx]">
        <view class="flex items-center gap-[16rpx] text-[48rpx] text-[#8b8b90]">
          <view class="h-[22rpx] w-[22rpx] rounded-full bg-[#bfc0c3]" />
          <text>{{ mock.todayEmptyText }}</text>
        </view>
      </view>
    </view>

    <view class="mt-[22rpx]">
      <view class="text-[50rpx] font-semibold text-[#111116]">
        {{ mock.recentTitle }}
      </view>
      <view class="mt-[14rpx] rounded-[30rpx] bg-[#f4f4f5] px-[30rpx] py-[20rpx]">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-[14rpx]">
            <view class="h-[22rpx] w-[22rpx] rounded-full bg-[#f05a4f]" />
            <text class="text-[54rpx] font-semibold text-[#1a1a1f]">
              {{ mock.recentRecord.value.toFixed(1) }}
              <text class="ml-[6rpx] text-[34rpx] font-medium">
                千克
              </text>
            </text>
          </view>
          <view class="text-[48rpx] font-medium text-[#f05a4f]">
            ↑{{ mock.recentRecord.delta.toFixed(1) }}
            <text class="text-[32rpx]">
              千克
            </text>
          </view>
          <view class="flex items-center gap-[12rpx]">
            <text class="text-[34rpx] text-[#808087]">
              {{ mock.recentRecord.dateText }}
            </text>
            <text class="text-[46rpx] text-[#b4b4b8]">
              ›
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="mt-[42rpx] flex flex-col items-center gap-[20rpx]">
      <view class="flex items-center gap-[10rpx] text-[34rpx] text-[#8f9096]">
        <text>☁</text>
        <text>{{ mock.syncText }}</text>
        <text class="text-[#2d8ce7]">ⓘ</text>
      </view>
      <view class="h-[152rpx] w-[152rpx] rounded-full bg-[#4e4f56] text-center text-[96rpx] leading-[144rpx] text-white">
        +
      </view>
    </view>
  </view>
</template>
