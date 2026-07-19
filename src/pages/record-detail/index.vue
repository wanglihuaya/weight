<script setup lang="ts">
import { computed, getCurrentInstance, onLoad, onMounted, ref } from 'wevu'

import { getWeightRecord } from '@/services/weightApi'
import { type CloudWeightRecord } from '@/services/weightModels'
import { cloudWeightRecords } from '@/services/weightStore'
import { getNavbarInfo } from '@/utils/navbar'

definePageJson({
  navigationStyle: 'custom',
  navigationBarTextStyle: 'black',
  backgroundColor: '#f3f4f8',
  componentFramework: 'glass-easel',
  renderer: 'skyline',
  disableScroll: true,
  rendererOptions: {
    skyline: {
      defaultDisplayBlock: true,
      defaultContentBox: true,
      tagNameStyleIsolation: 'legacy',
      enableScrollViewAutoSize: true,
    },
  },
})

const navInfo = getNavbarInfo()
const instance = getCurrentInstance()
const recordId = ref('')
const record = ref<CloudWeightRecord | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const scrollTop = ref(0)
const useWorklet = ref(false)
let scrollY: any = null

const navbarStyle = `padding-top:${navInfo.paddingTop}px;height:${navInfo.totalHeight}px;`
const navbarButtonStyle = `top:${navInfo.menuRect.top}px;height:${navInfo.menuRect.height}px;width:${navInfo.menuRect.height}px;`
const navbarTitleStyle = [
  `margin-left:${navInfo.centerLeft}px`,
  `width:${navInfo.centerWidth}px`,
  `top:${navInfo.menuRect.top}px`,
  `height:${navInfo.menuRect.height}px`,
].join(';')
const scrollTopSpacerStyle = `height:${navInfo.totalHeight + 20}px;`
const navbarGradientFallbackClass = computed(() => (
  !useWorklet.value && scrollTop.value > 8 ? 'record-detail-navbar-gradient--active' : ''
))
const navbarTitleFallbackClass = computed(() => (
  !useWorklet.value && scrollTop.value > 36 ? 'record-detail-navbar-title--active' : ''
))
const pageTitleFallbackClass = computed(() => (
  !useWorklet.value && scrollTop.value > 36 ? 'record-detail-title-block--hidden' : ''
))

const recordDateLabel = computed(() => {
  if (!record.value) {
    return '--'
  }

  const date = new Date(record.value.recordedAt)
  if (Number.isNaN(date.getTime())) {
    return record.value.recordDate
  }

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`
})

const modeLabel = computed(() => {
  if (record.value?.photoFileIds?.length) {
    return '照片记录'
  }
  if (record.value?.note?.trim()) {
    return '笔记记录'
  }
  return '体重记录'
})

onLoad((query) => {
  recordId.value = String(query.id || '')
  const cachedRecord = cloudWeightRecords.value.find(item => item._id === recordId.value)
  if (cachedRecord) {
    record.value = cachedRecord
  }
  loadRecord()
})

onMounted(() => {
  try {
    if (!wx?.worklet) {
      return
    }

    const pageInstance = instance?.proxy || instance
    scrollY = wx.worklet.shared(0)

    if (pageInstance?.applyAnimatedStyle) {
      pageInstance.applyAnimatedStyle('.record-detail-navbar-title', () => {
        'worklet'
        const progress = Math.min(scrollY.value / 40, 1)
        return {
          opacity: progress,
          transform: `translateY(${(1 - progress) * 10}px)`,
        }
      })

      pageInstance.applyAnimatedStyle('.record-detail-title-block', () => {
        'worklet'
        const progress = Math.min(scrollY.value / 40, 1)
        return {
          opacity: 1 - progress,
          transform: `translateY(${-progress * 8}px)`,
        }
      })

      pageInstance.applyAnimatedStyle('.record-detail-navbar-gradient', () => {
        'worklet'
        const progress = Math.min(Math.max((scrollY.value - 6) / 72, 0), 1)
        return {
          opacity: progress,
          transform: `translateY(${(1 - progress) * -4}px)`,
        }
      })

      useWorklet.value = true
    }
  }
  catch (error) {
    console.warn('详情页滚动动画初始化失败，已切换 CSS 兜底', error)
  }
})

function handleScroll(event: WechatMiniprogram.ScrollViewScroll) {
  scrollTop.value = event.detail.scrollTop
  if (scrollY) {
    scrollY.value = event.detail.scrollTop
  }
}

async function loadRecord() {
  if (!recordId.value) {
    errorMessage.value = '缺少记录编号'
    loading.value = false
    return
  }

  loading.value = !record.value
  errorMessage.value = ''
  try {
    record.value = await getWeightRecord(recordId.value)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '记录加载失败'
  }
  finally {
    loading.value = false
  }
}

function goBack() {
  wx.navigateBack({
    fail() {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    },
  })
}

function previewPhoto(event: WechatMiniprogram.TouchEvent) {
  const urls = record.value?.photoFileIds ?? []
  const index = Number(event.currentTarget.dataset.photoIndex || 0)
  if (urls.length === 0) {
    return
  }

  wx.previewImage({
    urls,
    current: urls[index] ?? urls[0],
  })
}
</script>

<template>
  <view class="record-detail-page">
    <view class="record-detail-navbar" :style="navbarStyle">
      <view
        class="record-detail-navbar-gradient"
        :class="navbarGradientFallbackClass"
      >
        <view class="record-detail-navbar-gradient-base" />
        <view class="record-detail-navbar-gradient-sheen" />
      </view>

      <view
        class="record-detail-back"
        :style="navbarButtonStyle"
        hover-class="record-detail-back-active"
        @tap="goBack"
      >
        <t-icon name="chevron-left" size="38rpx" />
      </view>

      <view class="record-detail-navbar-title-slot" :style="navbarTitleStyle">
        <view class="record-detail-navbar-title" :class="navbarTitleFallbackClass">体重记录</view>
      </view>
    </view>

    <scroll-view
      scroll-y
      enhanced
      enable-back-to-top
      :show-scrollbar="false"
      class="record-detail-scroll"
      @scroll="handleScroll"
    >
      <view :style="scrollTopSpacerStyle" />
      <view class="record-detail-content">
        <view class="record-detail-title-block" :class="pageTitleFallbackClass">
          <view class="record-detail-kicker">{{ modeLabel }}</view>
          <view class="record-detail-title">体重记录</view>
        </view>

        <view v-if="loading" class="record-detail-state">
          <view class="record-detail-state-dot record-detail-state-dot-loading" />
          <text>正在读取记录…</text>
        </view>

        <view v-else-if="errorMessage && !record" class="record-detail-state record-detail-state-error">
          <text>{{ errorMessage }}</text>
          <view class="record-detail-retry" hover-class="record-detail-retry-active" @tap="loadRecord">重新加载</view>
        </view>

        <block v-else-if="record">
          <view class="record-detail-section">
            <view class="record-detail-label">日期</view>
            <view class="record-detail-card record-detail-date-card">
              <t-icon name="time" size="30rpx" color="#1686de" />
              <text>{{ recordDateLabel }}</text>
            </view>
          </view>

          <view class="record-detail-section">
            <view class="record-detail-label">体重</view>
            <view class="record-detail-card record-detail-weight-card">
              <view class="record-detail-weight-row">
                <text class="record-detail-weight-value">{{ record.weight.toFixed(1) }}</text>
                <text class="record-detail-weight-unit">千克</text>
              </view>
              <view class="record-detail-weight-meta">
                <view class="record-detail-mode-dot" />
                <text>{{ modeLabel }}</text>
              </view>
            </view>
          </view>

          <view class="record-detail-section">
            <view class="record-detail-label">照片</view>
            <view class="record-detail-card record-detail-photo-card">
              <view v-if="record.photoFileIds?.length" class="record-detail-photo-list">
                <image
                  v-for="(photo, index) in record.photoFileIds"
                  :key="photo"
                  class="record-detail-photo"
                  :src="photo"
                  mode="aspectFill"
                  :data-photo-index="index"
                  @tap="previewPhoto"
                />
              </view>
              <view v-else class="record-detail-empty">
                <view class="record-detail-empty-icon">
                  <t-icon name="image" size="32rpx" />
                </view>
                <text>本次记录未添加照片</text>
              </view>
            </view>
          </view>

          <view class="record-detail-section record-detail-section-last">
            <view class="record-detail-label">笔记</view>
            <view class="record-detail-card record-detail-note-card">
              <text v-if="record.note?.trim()" class="record-detail-note-text">{{ record.note }}</text>
              <view v-else class="record-detail-empty">
                <view class="record-detail-empty-icon record-detail-empty-icon-note">
                  <t-icon name="edit-1" size="30rpx" />
                </view>
                <text>本次记录未添加笔记</text>
              </view>
            </view>
          </view>
        </block>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.record-detail-page {
  height: 100vh;
  overflow: hidden;
  background: #f3f4f8;
  color: #111318;
}

.record-detail-navbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 50;
  box-sizing: border-box;
}

.record-detail-navbar-gradient {
  position: absolute;
  top: 0;
  left: 0;
  height: calc(100% + 104rpx);
  width: 100%;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition:
    opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.record-detail-navbar-gradient--active {
  opacity: 1;
  transform: translateY(0);
}

.record-detail-navbar-gradient-base,
.record-detail-navbar-gradient-sheen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.record-detail-navbar-gradient-base {
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 255, 255, 0.96) 24%,
    rgba(255, 255, 255, 0.9) 38%,
    rgba(255, 255, 255, 0.78) 50%,
    rgba(255, 255, 255, 0.62) 61%,
    rgba(255, 255, 255, 0.44) 71%,
    rgba(255, 255, 255, 0.28) 80%,
    rgba(255, 255, 255, 0.15) 88%,
    rgba(255, 255, 255, 0.06) 94%,
    rgba(255, 255, 255, 0) 100%
  );
}

.record-detail-navbar-gradient-sheen {
  height: 58%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.18) 58%,
    rgba(255, 255, 255, 0) 100%
  );
}

.record-detail-navbar-title-slot {
  position: absolute;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-align: center;
  pointer-events: none;
}

.record-detail-navbar-title {
  opacity: 0;
  color: rgba(22, 28, 38, 0.92);
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: -0.4rpx;
  line-height: 1.2;
  text-shadow: 0 1rpx 0 rgba(255, 255, 255, 0.72);
  transform: translateY(10px);
  transition:
    opacity 180ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.record-detail-navbar-title--active {
  opacity: 1;
  transform: translateY(0);
}

.record-detail-back {
  position: absolute;
  left: 28rpx;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14rpx 34rpx rgba(34, 39, 51, 0.08);
  transition: transform 120ms ease-out, opacity 120ms ease-out;
}

.record-detail-back-active {
  opacity: 0.72;
  transform: scale(0.92);
}

.record-detail-scroll {
  height: 100vh;
}

.record-detail-content {
  padding: 24rpx 38rpx calc(env(safe-area-inset-bottom) + 80rpx);
}

.record-detail-title-block {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 180ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.record-detail-title-block--hidden {
  opacity: 0;
  transform: translateY(-8px);
}

.record-detail-kicker {
  color: #999ba3;
  font-size: 23rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  line-height: 1;
}

.record-detail-title {
  margin-top: 16rpx;
  color: #090a0d;
  font-size: 66rpx;
  font-weight: 800;
  letter-spacing: -3rpx;
  line-height: 1.08;
}

.record-detail-section {
  margin-top: 54rpx;
}

.record-detail-section-last {
  padding-bottom: 40rpx;
}

.record-detail-label {
  margin-bottom: 20rpx;
  padding-left: 24rpx;
  color: #8b8d94;
  font-size: 31rpx;
  font-weight: 600;
  line-height: 1;
}

.record-detail-card {
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  border-radius: 42rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(28, 34, 48, 0.035);
}

.record-detail-date-card {
  display: flex;
  align-items: center;
  min-height: 116rpx;
  padding: 0 30rpx;
  color: #22242a;
  font-size: 29rpx;
  font-weight: 500;
}

.record-detail-date-card text {
  margin-left: 14rpx;
}

.record-detail-weight-card {
  padding: 30rpx;
}

.record-detail-weight-row {
  display: flex;
  align-items: baseline;
}

.record-detail-weight-value {
  color: #0a0b0e;
  font-size: 64rpx;
  font-weight: 700;
  letter-spacing: -2rpx;
  line-height: 1;
}

.record-detail-weight-unit {
  margin-left: 10rpx;
  color: #0a0b0e;
  font-size: 27rpx;
  font-weight: 600;
}

.record-detail-weight-meta {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  border-top: 1rpx solid #e8e9ec;
  padding-top: 22rpx;
  color: #8d8f96;
  font-size: 23rpx;
}

.record-detail-mode-dot {
  height: 12rpx;
  width: 12rpx;
  margin-right: 10rpx;
  border-radius: 999rpx;
  background: #3099ef;
}

.record-detail-photo-card {
  padding: 24rpx;
}

.record-detail-photo-list {
  display: flex;
  flex-wrap: wrap;
  margin: -6rpx;
}

.record-detail-photo {
  height: 300rpx;
  min-width: 280rpx;
  flex: 1;
  margin: 6rpx;
  border-radius: 28rpx;
  background: #eceef1;
}

.record-detail-note-card {
  min-height: 160rpx;
  padding: 30rpx;
}

.record-detail-note-text {
  color: #383b43;
  font-size: 27rpx;
  line-height: 1.65;
  word-break: break-all;
}

.record-detail-empty {
  display: flex;
  align-items: center;
  min-height: 112rpx;
  color: #a0a2a9;
  font-size: 24rpx;
}

.record-detail-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  width: 64rpx;
  flex-shrink: 0;
  margin-right: 16rpx;
  border-radius: 20rpx;
  background: #e6f1fa;
  color: #1686de;
}

.record-detail-empty-icon-note {
  background: #fbe9dc;
  color: #ef7d39;
}

.record-detail-state {
  display: flex;
  align-items: center;
  margin-top: 50rpx;
  border-radius: 28rpx;
  background: #ffffff;
  padding: 28rpx;
  color: #8e9097;
  font-size: 25rpx;
}

.record-detail-state-dot {
  height: 14rpx;
  width: 14rpx;
  margin-right: 14rpx;
  border-radius: 999rpx;
}

.record-detail-state-dot-loading {
  background: #3099ef;
}

.record-detail-state-error {
  justify-content: space-between;
  color: #d35f55;
}

.record-detail-retry {
  border-radius: 999rpx;
  background: #e3f0fb;
  padding: 14rpx 22rpx;
  color: #1686de;
  font-size: 22rpx;
  font-weight: 600;
  transition: opacity 120ms ease-out;
}

.record-detail-retry-active {
  opacity: 0.7;
}
</style>
