<script setup lang="ts">
import { debounce } from '@/utils/common'
import { computed, getCurrentInstance, onMounted, ref } from 'wevu'

definePageJson({
  usingComponents: {
    "t-fab": "tdesign-miniprogram/fab/fab"
  },
  navigationStyle: 'custom',
  componentFramework: "glass-easel",
  renderer: "skyline",
  rendererOptions: {
    skyline: {
      defaultDisplayBlock: true,
      // defaultContentBox: true,
      tagNameStyleIsolation: "legacy",
      enableScrollViewAutoSize: true,
      keyframeStyleIsolation: "legacy"
    }
  }
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
let containerScale: any = null
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
    containerScale = shared(1)

    // 计算单个 tab 的宽度百分比
    tabWidthPercent = 100 / tabs.length

    const pageInstance = instance?.proxy || instance

    // 应用动画样式到指示器
    if (pageInstance?.applyAnimatedStyle) {
      pageInstance.applyAnimatedStyle('.indicator-bg', () => {
        'worklet'
        return {
          width: `${tabWidthPercent}%`,
          transform: `translateX(${offsetX.value}%)`,
        }
      })

      // 应用缩放动画到容器
      pageInstance.applyAnimatedStyle('.tabs-container', () => {
        'worklet'
        return {
          transform: `scale(${containerScale.value})`,
        }
      })

      useWorklet = true
      console.log('✅ Worklet 动画初始化成功')
    }
  } catch (error) {
    console.error('❌ Worklet 初始化失败:', error)
  }
})

const handleContainerTouchStart = () => {
  if (useWorklet && containerScale) {
    const { spring } = wx.worklet
    containerScale.value = spring(1.04, {
      stiffness: 1000,
      damping: 50,
    }, () => {
      'worklet'
    })
  }
}

const handleContainerTouchEnd = () => {
  if (useWorklet && containerScale) {
    const { spring } = wx.worklet
    containerScale.value = spring(1, {
      stiffness: 1000,
      damping: 50,
    }, () => {
      'worklet'
    })
  }
}

const handleTabChange = debounce((e: any) => {
  const newKey = e?.currentTarget?.dataset.tabKey
  if (!newKey || newKey === activeKey.value) return

  activeKey.value = newKey

  // 使用 worklet 动画更新位置
  if (useWorklet && offsetX) {
    try {
      const { spring } = wx.worklet
      const index = tabs.findIndex(tab => tab.key === newKey)
      console.log(`🎯 切换到 tab ${index}, 目标位置: ${index * 100}%`)

      // 使用 spring 动画实现物理弹性效果
      offsetX.value = spring(index * 100, {
        stiffness: 250, // 弹性系数，值越大回弹越快
        damping: 20,    // 阻尼系数，控制摆动次数
        mass: 1,        // 质量，值越大动作越沉重
      }, () => {
        'worklet'
      })
    } catch (error) {
      console.error('❌ 动画更新失败:', error)
    }
  }
}, 50)
</script>

<template>
  <scroll-view class="h-screen w-full bg-blue-100 p-4 text-[#1c1c3c]">
    <t-fab class="w-full !right-0 px-4">
      <!-- Animated Tabs 组件 -->
      <!-- Tab 容器 (Web Style) -->
      <view
        class="tabs-container rounded-full w-full bg-white p-[12rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.12)]"
        @touchstart="handleContainerTouchStart"
        @touchend="handleContainerTouchEnd"
        @touchcancel="handleContainerTouchEnd"
      >
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
            @touchstart="handleTabChange"
          >
            <!-- @tap="handleTabChange" -->
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
    </t-fab>
  </scroll-view>
</template>

<style scoped>
/* ========== 滑动指示器动画 (备用 CSS transition) ========== */
.indicator-bg {
  /* 备用方案使用弹性贝塞尔曲线模仿物理效果 */
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ========== 点击态样式 ========== */
.tab-hover {
  opacity: 0.8;
}
</style>
