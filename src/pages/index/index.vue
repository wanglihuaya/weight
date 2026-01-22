<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from 'wevu'

definePageJson({
  navigationStyle: 'custom',
  componentFramework: 'glass-easel',
})

interface TabItem {
  key: string
  label: string
  icon: string
}

const tabs: TabItem[] = [
  { key: 'overview', label: '概览', icon: 'i-lucide-layout-dashboard' },
  { key: 'records', label: '记录', icon: 'i-lucide-list' },
  { key: 'trends', label: '趋势', icon: 'i-lucide-trending-up' },
  { key: 'goals', label: '目标', icon: 'i-lucide-target' },
]

const activeKey = ref('overview')
const instance = getCurrentInstance()
let offsetX: any = null
let tabWidthPercent = 0
let useWorklet = false

// 备用方案：使用 computed 样式
const indicatorStyleFallback = computed(() => {
  const index = tabs.findIndex(tab => tab.key === activeKey.value)
  return {
    width: `${100 / tabs.length}%`,
    transform: `translateX(${index * 100}%)`,
  }
})

// 初始化 worklet 动画
onMounted(() => {
  try {
    if (!wx?.worklet) {
      console.warn('⚠️ Worklet 不可用，使用 CSS transition 备用方案')
      return
    }

    const { shared } = wx.worklet

    // 创建共享变量
    offsetX = shared(0)

    // 计算单个 tab 的宽度百分比
    tabWidthPercent = 100 / tabs.length

    // 应用动画样式到指示器
    const pageInstance = instance?.proxy || instance
    if (pageInstance?.applyAnimatedStyle) {
      pageInstance.applyAnimatedStyle('.indicator-bg', () => {
        'worklet'
        return {
          width: `${tabWidthPercent}%`,
          transform: `translateX(${offsetX.value}%)`,
        }
      })
      useWorklet = true
      console.log('✅ Worklet 动画初始化成功')
    } else {
      console.warn('⚠️ applyAnimatedStyle 不可用，请检查 Skyline 渲染是否启用')
    }
  } catch (error) {
    console.error('❌ Worklet 初始化失败:', error)
  }
})

function handleTabChange(e: any) {
  const newKey = e?.currentTarget?.dataset.tabKey
  if (!newKey || newKey === activeKey.value) return

  activeKey.value = newKey

  // 使用 worklet 动画更新位置
  if (useWorklet && offsetX) {
    try {
      const { timing, Easing } = wx.worklet
      const index = tabs.findIndex(tab => tab.key === newKey)
      console.log(`🎯 切换到 tab ${index}, 目标位置: ${index * 100}%`)

      // 使用 timing 动画实现平滑过渡
      offsetX.value = timing(index * 100, {
        duration: 50,
      }, () => {
        'worklet'
      })
    } catch (error) {
      console.error('❌ 动画更新失败:', error)
    }
  }
}
</script>

<template>
  <view class="min-h-screen bg-blue-100 px-[28rpx] pb-[180rpx] pt-[32rpx] text-[#1c1c3c]">

    <!-- Animated Tabs 组件 -->
    <view class="fixed bottom-[calc(var(--safe-area-inset-bottom)+16rpx)] left-[40rpx] right-[40rpx] z-[999]">
      <!-- Tab 容器 (Web Style) -->
      <view class="rounded-full bg-white p-[12rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.12)]">
        <view class="relative flex rounded-full">
          <!-- 滑动背景指示器 (Glider) - 通过 worklet 控制动画 -->
          <view
            class="indicator-bg absolute bottom-0 left-0 top-0 z-[1] rounded-full bg-[#e6eef9]"
            :style="indicatorStyleFallback"
          />

          <!-- Tab 项 -->
          <view
            v-for="tab in tabs"
            :key="tab.key"
            class="relative z-[2] flex flex-1 flex-col items-center justify-center py-[20rpx] transition-opacity duration-150"
            hover-class="tab-hover"
            :data-tab-key="tab.key"
            @tap="handleTabChange"
          >
            <!-- 图标 -->
            <view
              class="mb-[4rpx] transition-all duration-200"
              :class="activeKey === tab.key ? 'text-[#185ee0] scale-110' : 'text-gray-400'"
              style="font-size: 36rpx; line-height: 1;"
            >
              <view :class="`${tab.icon}`" />
            </view>

            <!-- 标签文字 -->
            <view
              class="text-[22rpx] font-semibold transition-colors duration-200"
              :class="activeKey === tab.key ? 'text-[#185ee0]' : 'text-gray-500'"
            >
              {{ tab.label }}
            </view>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<style scoped>
/* ========== 滑动指示器动画 (备用 CSS transition) ========== */
.indicator-bg {
  transition: transform 0.25s ease-out;
}

/* ========== 点击态样式 ========== */
.tab-hover {
  opacity: 0.8;
}

/* worklet 动画由 applyAnimatedStyle 直接控制时会覆盖 CSS transition */
</style>
