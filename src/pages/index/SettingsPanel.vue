<script setup lang="ts">
import { computed, onMounted } from 'wevu'

import { cloudLoginPending, cloudLoginReady, cloudUser, ensureSilentLogin } from '@/services/auth'
import { cloudWeightRecords, refreshWeightRecords } from '@/services/weightStore'
import { buildSettingsSections, buildSettingsSnapshot } from './pageModels'

defineComponentJson({
  styleIsolation: 'apply-shared',
})

const snapshot = computed(() => buildSettingsSnapshot(new Date()))
const sections = computed(() => buildSettingsSections(snapshot.value))
const cloudConnectionLabel = computed(() => {
  if (cloudLoginPending.value) {
    return '连接中'
  }

  return cloudLoginReady.value ? '已连接' : '未连接'
})
const maskedOpenid = computed(() => {
  const openid = cloudUser.value?.openid ?? ''
  if (!openid) {
    return '等待静默登录'
  }

  return `${openid.slice(0, 6)}...${openid.slice(-4)}`
})
const recordCountLabel = computed(() => `${cloudWeightRecords.value.length} 条记录`)

onMounted(() => {
  ensureSilentLogin().catch(() => {})
  refreshWeightRecords().catch(() => {})
})
</script>

<template>
  <view class="pb-[220rpx] pt-[10rpx]">
    <view class="section-title">会员</view>
    <view class="rounded-[34rpx] bg-white px-[28rpx] py-[24rpx] shadow-[0_16rpx_40rpx_rgba(15,23,42,0.06)]">
      <view class="flex items-center">
        <view class="membership-app-icon">
          <view class="membership-scale">
            <view class="membership-scale-needle" />
          </view>
          <view class="membership-dots">
            <view class="membership-dot membership-dot-blue" />
            <view class="membership-dot membership-dot-coral" />
            <view class="membership-badge">W</view>
          </view>
        </view>

        <view class="ml-[22rpx] flex-1">
          <view class="text-[34rpx] font-semibold text-[#12131a]">
            {{ snapshot.membershipTitle }}
          </view>
          <view class="mt-[12rpx] inline-flex items-center rounded-full bg-[#f3f4fb] px-[18rpx] py-[8rpx]">
            <view class="text-[22rpx] text-[#ff5577]">❤</view>
            <text class="ml-[10rpx] text-[24rpx] font-medium text-[#2d2e35]">
              {{ snapshot.membershipBadge }}
            </text>
          </view>
        </view>

        <text class="text-[56rpx] leading-none text-[#c8c9d1]">›</text>
      </view>
    </view>

    <view class="mt-[18rpx] rounded-[30rpx] bg-white px-[28rpx] py-[24rpx] shadow-[0_16rpx_40rpx_rgba(15,23,42,0.06)]">
      <view class="flex items-center justify-between">
        <view>
          <view class="text-[30rpx] font-semibold text-[#12131a]">
            微信云开发
          </view>
          <view class="mt-[8rpx] text-[24rpx] text-[#8f919c]">
            {{ maskedOpenid }}
          </view>
        </view>
        <view class="cloud-status-pill" :class="cloudLoginReady ? 'cloud-status-pill-active' : ''">
          {{ cloudConnectionLabel }}
        </view>
      </view>
      <view class="mt-[18rpx] flex items-center justify-between rounded-[24rpx] bg-[#f6f7fb] px-[20rpx] py-[18rpx]">
        <text class="text-[24rpx] text-[#626575]">体重记录</text>
        <text class="text-[24rpx] font-medium text-[#111217]">{{ recordCountLabel }}</text>
      </view>
    </view>

    <view v-for="section in sections" :key="section.title" class="mt-[34rpx]">
      <view class="section-title">{{ section.title }}</view>
      <view class="rounded-[34rpx] bg-white px-[28rpx] shadow-[0_16rpx_40rpx_rgba(15,23,42,0.06)]">
        <view
          v-for="(item, index) in section.items"
          :key="item.key"
          class="flex items-center py-[26rpx]"
          :class="index !== section.items.length - 1 ? 'border-b border-[#ececf2]' : ''"
        >
          <view class="setting-icon-shell">
            <view v-if="item.iconKey === 'baseline'" class="icon-scale">
              <view class="icon-scale-dial" />
              <view class="icon-scale-needle" />
            </view>
            <view v-else-if="item.iconKey === 'goal'" class="icon-target">
              <view class="icon-target-ring icon-target-ring-outer" />
              <view class="icon-target-ring icon-target-ring-middle" />
              <view class="icon-target-ring icon-target-ring-inner" />
            </view>
            <view v-else-if="item.iconKey === 'bmi'" class="icon-label">BMI</view>
            <view v-else-if="item.iconKey === 'unit'" class="icon-unit">
              <view class="icon-unit-bar" />
              <view class="icon-unit-bar icon-unit-bar-short" />
            </view>
            <view v-else-if="item.iconKey === 'indicator'" class="icon-indicator">
              <view class="icon-indicator-dot icon-indicator-dot-solid" />
              <view class="icon-indicator-dot" />
            </view>
            <view v-else-if="item.iconKey === 'week-start'" class="icon-calendar">
              <view v-for="grid in 6" :key="grid" class="icon-calendar-grid" />
            </view>
            <view v-else-if="item.iconKey === 'reminder'" class="icon-bell">
              <view class="icon-bell-cap" />
            </view>
            <view v-else class="icon-award">★</view>
          </view>

          <text class="ml-[18rpx] flex-1 text-[30rpx] text-[#111217]">
            {{ item.label }}
          </text>
          <text v-if="item.value" class="mr-[18rpx] text-[28rpx] text-[#989aa6]">
            {{ item.value }}
          </text>
          <text class="text-[52rpx] leading-none text-[#c8c9d1]">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.section-title {
  margin-bottom: 18rpx;
  color: #8f919c;
  font-size: 28rpx;
  font-weight: 600;
}

.cloud-status-pill {
  min-width: 120rpx;
  border-radius: 9999rpx;
  background: #ececf2;
  color: #8d90a0;
  font-size: 24rpx;
  line-height: 1;
  padding: 12rpx 20rpx;
  text-align: center;
}

.cloud-status-pill-active {
  background: #dff4e8;
  color: #217a49;
}

.membership-app-icon {
  display: flex;
  height: 126rpx;
  width: 126rpx;
  flex-direction: column;
  justify-content: center;
  border-radius: 30rpx;
  border: 2rpx solid #dedfe6;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%);
  padding: 14rpx 12rpx;
  box-sizing: border-box;
}

.membership-scale {
  position: relative;
  height: 46rpx;
  border-radius: 26rpx 26rpx 18rpx 18rpx;
  background: linear-gradient(180deg, #f7f8fb 0%, #e8e9ef 100%);
}

.membership-scale::before {
  content: '';
  position: absolute;
  left: 10rpx;
  right: 10rpx;
  top: 10rpx;
  height: 12rpx;
  border-top: 3rpx dashed #b5b9c6;
  border-radius: 999rpx;
}

.membership-scale-needle {
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  height: 0;
  width: 0;
  transform: translateX(-50%);
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-bottom: 22rpx solid #fb6f5c;
}

.membership-dots {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.membership-dot {
  height: 24rpx;
  width: 24rpx;
  border-radius: 999rpx;
  border: 6rpx solid #ffffff;
  box-shadow: 0 0 0 2rpx rgba(202, 205, 216, 0.7);
}

.membership-dot-blue {
  background: #5ca4ff;
}

.membership-dot-coral {
  background: #f57967;
}

.membership-badge {
  display: flex;
  height: 44rpx;
  width: 44rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #383a41;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.setting-icon-shell {
  display: flex;
  height: 72rpx;
  width: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: linear-gradient(180deg, #57adff 0%, #3f82f8 100%);
}

.icon-scale {
  position: relative;
  height: 30rpx;
  width: 38rpx;
}

.icon-scale-dial {
  height: 28rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.92);
  border-bottom-width: 6rpx;
  border-radius: 22rpx 22rpx 14rpx 14rpx;
}

.icon-scale-needle {
  position: absolute;
  left: 50%;
  top: 8rpx;
  height: 14rpx;
  width: 4rpx;
  transform: translateX(-50%);
  border-radius: 999rpx;
  background: #ffffff;
}

.icon-target {
  position: relative;
  height: 38rpx;
  width: 38rpx;
}

.icon-target-ring {
  position: absolute;
  inset: 0;
  border-radius: 999rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.95);
}

.icon-target-ring-middle {
  inset: 8rpx;
}

.icon-target-ring-inner {
  inset: 16rpx;
}

.icon-label {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.icon-unit {
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
}

.icon-unit-bar {
  height: 34rpx;
  width: 8rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.95);
}

.icon-unit-bar-short {
  height: 24rpx;
}

.icon-indicator {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.icon-indicator-dot {
  height: 16rpx;
  width: 16rpx;
  border-radius: 999rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.95);
}

.icon-indicator-dot-solid {
  background: rgba(255, 255, 255, 0.95);
}

.icon-calendar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4rpx;
  width: 34rpx;
}

.icon-calendar-grid {
  height: 8rpx;
  width: 8rpx;
  border-radius: 3rpx;
  background: rgba(255, 255, 255, 0.95);
}

.icon-bell {
  position: relative;
  height: 30rpx;
  width: 28rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.95);
  border-bottom-left-radius: 18rpx;
  border-bottom-right-radius: 18rpx;
  border-top-left-radius: 18rpx;
  border-top-right-radius: 18rpx;
}

.icon-bell::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -8rpx;
  height: 6rpx;
  width: 10rpx;
  transform: translateX(-50%);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.95);
}

.icon-bell-cap {
  position: absolute;
  left: 50%;
  top: -8rpx;
  height: 8rpx;
  width: 8rpx;
  transform: translateX(-50%);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.95);
}

.icon-award {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}
</style>
