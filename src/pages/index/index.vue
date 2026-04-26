<script setup lang="ts">
/**
 * 首页 - 体重记录与数据展示
 * 采用 Skyline 渲染内核与 Worklet 动画引擎
 */
import WeightDashboard from '@/components/WeightDashboard/index.vue'
import { getNavbarInfo } from '@/utils/navbar'
import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'wevu'
import { createTabSwitchContext, runTabSwitchAnimation } from './tabSwitch'
import dataIconActive from '/tabbar/data-active.png'
import dataIcon from '/tabbar/data.png'
import settingsIconActive from '/tabbar/setting-active.png'
import settingsIcon from '/tabbar/setting.png'
import weightIconActive from '/tabbar/weight-active.png'
import weightIcon from '/tabbar/weight.png'
import widgetIconActive from '/tabbar/widgets-active.png'
import widgetIcon from '/tabbar/widgets.png'

// ==========================================
// 页面配置 (Page Configurations)
// ==========================================
definePageJson({
  usingComponents: {
    "t-fab": "tdesign-miniprogram/fab/fab",
    "t-icon": "tdesign-miniprogram/icon/icon"
  },
  navigationStyle: 'custom',
  navigationBarTextStyle: 'black',
  componentFramework: "glass-easel",
  renderer: "skyline",
  disableScroll: true,
  rendererOptions: {
    skyline: {
      defaultDisplayBlock: true,
      tagNameStyleIsolation: "legacy",
      enableScrollViewAutoSize: true,
      keyframeStyleIsolation: "legacy"
    }
  }
})

// ==========================================
// 类型与常量 (Constants & Types)
// ==========================================
interface TabItem {
  key: string
  label: string
  title?: string
  icon: string
  activeIcon?: string
}

const tabs: TabItem[] = [
  { key: 'data', label: '体重', title:'我的体重', icon: weightIcon, activeIcon: weightIconActive },
  { key: 'weight', label: '数据', icon: dataIcon, activeIcon: dataIconActive },
  { key: 'widget', label: '小组件', icon: widgetIcon, activeIcon: widgetIconActive },
  { key: 'settings', label: '设置', icon: settingsIcon, activeIcon: settingsIconActive },
]

// ==========================================
// 响应式变量 (Reactive State)
// ==========================================
const instance = getCurrentInstance()
const activeKey = ref('data')
const navbarTitle = computed(() => {
  return tabs.find(tab => tab.key === activeKey.value)?.title|| tabs.find(tab => tab.key === activeKey.value)?.label
})
const scrollTop = ref(0)
const useWorklet = ref(false)

// ==========================================
// Worklet 共享变量 (Animation Shared Values)
// ==========================================
let offsetX: any = null        // Tab 指示器偏移
let containerScale: any = null  // Tab 容器缩放
let indicatorScale: any = null  // 指示器缩放
let navbarLeftScale: any = null // 导航栏左侧按钮缩放
let scrollY: any = null        // 滚动位置同步
let tabWidthPercent = 0
let indicatorResetTimer: ReturnType<typeof setTimeout> | null = null
const INDICATOR_RESET_DELAY = 140

// ==========================================
// 计算属性 (Computed Styles)
// ==========================================

// 导航栏布局信息
const navInfo = getNavbarInfo()
const navbarHeightStyle = `padding-top: ${navInfo.paddingTop}px; height: calc(${navInfo.totalHeight}px); `
const navbarTotalHeightStyle = `height: ${navInfo.totalHeight + 12}px; `
const navbarTitleStyle = `margin-left: ${navInfo.centerLeft}px; width: ${navInfo.centerWidth}px; `
const capsuleWidth = `width: ${navInfo.capsuleWidth}px; `

// Tab 指示器兜底样式 (非 Worklet 环境)
const indicatorStyleFallback = computed(() => {
  const index = tabs.findIndex(tab => tab.key === activeKey.value)
  return {
    width: `${100 / tabs.length}%`,
    transform: `translateX(${index * 100}%)`,
  }
})

// ==========================================
// 交互逻辑与事件处理 (Event Handlers)
// ==========================================

// 滚动同步
const handleScroll = (e: any) => {
  scrollTop.value = e.detail.scrollTop
  if (scrollY) {
    scrollY.value = e.detail.scrollTop
  }
}

// 导航栏左侧按钮反馈
const handleNavbarLeftTouchStart = () => {
  if (useWorklet.value && navbarLeftScale) {
    const { spring } = wx.worklet
    navbarLeftScale.value = spring(1.24, { stiffness: 1000, damping: 40 }, () => { 'worklet' })
  }
}

const handleNavbarLeftTouchEnd = () => {
  if (useWorklet.value && navbarLeftScale) {
    const { spring } = wx.worklet
    navbarLeftScale.value = spring(1, { stiffness: 1000, damping: 40 }, () => { 'worklet' })
  }
}

// Tab 容器缩放反馈
const handleContainerTouchStart = () => {
  if (useWorklet.value && containerScale) {
    const { spring } = wx.worklet
    containerScale.value = spring(1.04, { stiffness: 1000, damping: 50 }, () => { 'worklet' })
  }
}

const handleContainerTouchEnd = () => {
  if (useWorklet.value && containerScale) {
    const { spring } = wx.worklet
    containerScale.value = spring(1, { stiffness: 1000, damping: 50 }, () => { 'worklet' })
  }
}

// Tab 切换逻辑
const handleTabChange = (e: any) => {
  const newKey = e?.currentTarget?.dataset.tabKey
  if (!newKey || newKey === activeKey.value) return

  const index = tabs.findIndex(tab => tab.key === newKey)
  if (index === -1) return

  activeKey.value = newKey

  // 更新 Worklet 动画
  if (useWorklet.value && offsetX && indicatorScale) {
    const { spring } = wx.worklet
    const context = createTabSwitchContext({
      scaleTo(value) {
        indicatorScale.value = spring(value, { stiffness: 400, damping: 25 }, () => { 'worklet' })
      },
      moveTo(value) {
        offsetX.value = spring(value, {
          stiffness: 250,
          damping: 20,
          mass: 1,
        }, () => { 'worklet' })
      },
      scheduleReset(onReset) {
        if (indicatorResetTimer) {
          clearTimeout(indicatorResetTimer)
        }
        indicatorResetTimer = setTimeout(() => {
          indicatorResetTimer = null
          onReset()
        }, INDICATOR_RESET_DELAY)
      },
    })

    runTabSwitchAnimation(context, index)
  }
}

// ==========================================
// 生命周期与动画初始化 (Lifecycle & Initializer)
// ==========================================
onMounted(() => {
  try {
    if (!wx?.worklet) {
      console.warn('⚠️ Worklet 不可用，使用 CSS transition 备用方案')
      return
    }

    const { shared } = wx.worklet
    const pageInstance = instance?.proxy || instance

    // 1. 初始化共享变量
    offsetX = shared(0)
    containerScale = shared(1)
    indicatorScale = shared(1)
    navbarLeftScale = shared(1)
    scrollY = shared(0)
    tabWidthPercent = 100 / tabs.length

    // 2. 注册 Worklet 动画样式
    if (pageInstance?.applyAnimatedStyle) {
      // 导航栏左侧缩放
      pageInstance.applyAnimatedStyle('.navbar-left-btn', () => {
        'worklet'
        return { transform: `scale(${navbarLeftScale.value})` }
      })

      // 导航栏标题滚动联动
      pageInstance.applyAnimatedStyle('.navbar-title', () => {
        'worklet'
        const progress = Math.min(scrollY.value / 40, 1)
        return {
          opacity: progress,
          transform: `translateY(${(1 - progress) * 10}px)`
        }
      })

      // 页面主标题滚动联动
      pageInstance.applyAnimatedStyle('.page-title', () => {
        'worklet'
        const progress = Math.min(scrollY.value / 40, 1)
        return { opacity: 1 - progress }
      })

      // Tab 指示器位置与缩放
      pageInstance.applyAnimatedStyle('.indicator-bg', () => {
        'worklet'
        return {
          width: `${tabWidthPercent}%`,
          transform: `translateX(${offsetX.value}%) scale(${indicatorScale.value})`
        }
      })

      // Tab 容器整体缩放
      pageInstance.applyAnimatedStyle('.tabs-container', () => {
        'worklet'
        return { transform: `scale(${containerScale.value})` }
      })

      // 导航栏背景模糊与透明度渐变
      // 小程序限制: backdrop-filter 无法直接通过 Worklet 动画
      // 解决方案: 使用多层叠加 + opacity 动画模拟渐变效果
      pageInstance.applyAnimatedStyle('.navbar-bg', () => {
        'worklet'
        // 计算滚动进度 (0 ~ 1)
        const progress = Math.min(scrollY.value / 300, 1)
        // 透明度从 0 渐变到 1
        const opacity = progress
        // 使用 CSS 变量传递模糊值 (仅部分小程序支持)
        // 主层透明度 + mask-image 实现平滑边缘
        return {
          opacity,
          // 小程序中 backdrop-filter 需要配合 mask-image 实现平滑过渡
        }
      })

      useWorklet.value = true
      console.log('✅ Worklet 动画初始化成功')
    }
  } catch (error) {
    console.error('❌ Worklet 初始化失败:', error)
  }
})

onUnmounted(() => {
  if (indicatorResetTimer) {
    clearTimeout(indicatorResetTimer)
    indicatorResetTimer = null
  }
})
</script>

<template>
  <!-- ========================================== -->
  <!-- 顶部导航栏 (Custom Navbar) -->
  <!-- ========================================== -->
  <view
    class="w-full fixed top-0 left-0 z-50"
    :style="navbarHeightStyle"
  >
    <!-- 背景模糊层 (Worklet 动画控制 opacity) -->
    <view class="navbar-bg absolute inset-0 w-full h-full" />

    <!-- 内容层 -->
    <view class="relative w-full h-full flex items-center justify-between">
      <!-- 左侧操作按钮 -->
      <view
        class="navbar-left-btn -translate-y-2 shrink-0 grow-0 flex items-center justify-center p-1 shadow-sm bg-white/60 backdrop-blur-xs rounded-full hover:bg-white/80 transition-colors duration-150 ml-3"
        @touchstart="handleNavbarLeftTouchStart"
        @touchend="handleNavbarLeftTouchEnd"
        @touchcancel="handleNavbarLeftTouchEnd"
      >
        <t-icon name="chevron-left" size="64rpx" data-name="chevron-left" />
      </view>

      <!-- 中心标题 (随滚动渐显) -->
      <view
        class="navbar-title absolute w-full text-[#1c1c3c] text-lg font-semibold text-center pointer-events-none"
        :style="navbarTitleStyle"
      >
        {{ navbarTitle }}
      </view>

      <!-- 右侧胶囊占位 -->
      <view :style="capsuleWidth"></view>
    </view>
  </view>

  <!-- ========================================== -->
  <!-- 主内容滚动区 (Main Content) -->
  <!-- ========================================== -->
  <scroll-view
    enable-back-to-top
    scroll-anchoring
    enable-passive
    :show-scrollbar="false"
    :safe-area-inset-top="false"
    scroll-y
    enhanced
    class="h-screen pt-[var(--status-bar-height)] w-full bg-gray-100 text-[#1c1c3c] px-4 box-border"
    @scroll="handleScroll"
  >
    <!-- 顶部避让空间 -->
    <view :style="navbarTotalHeightStyle" />

    <!-- 页面大标题 (随滚动渐隐) -->
    <view class="page-title font-semibold text-lg">{{ navbarTitle }}</view>

    <!-- 内容列表容器 -->
    <view v-if="activeKey==='data'">
      <WeightDashboard />
    </view>
    <view class="pb-[200rpx]" v-if="activeKey==='widget'">
      <view
        v-for="item in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]"
        :key="item"
        class="mb-4"
      >
        <view class="w-full rounded-[24rpx] bg-blue-100 backdrop-blur-md border border-white/60 p-4">
          <view class="i-mdi-widgets size-10"></view>
          <view class="mdi--widgets iconify-color  size-10"></view>
          <view class="mdi--widgets iconify-color  size-10"></view>
          <view class="mdi--widgets iconify-color  size-10"></view>
          <view class="mdi--widgets iconify-color  size-10"></view>
          <view class="mdi--widgets iconify-color  size-10"></view>
          <view class="mdi--widgets iconify-color  size-10"></view>
        </view>
      </view>
    </view>
    <view class="pb-[200rpx]" v-if="activeKey==='weight'">
      <view
        v-for="item in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]"
        :key="item"
        class="mb-4"
      >
        <view class="w-full rounded-[24rpx] bg-blue-100 backdrop-blur-md border border-white/60 p-4">
          <view class="i-mdi-calendar-multiselect size-10"></view>
          <view class="mdi--calendar-multiselect iconify-color  size-10"></view>
          <view class="mdi--calendar-multiselect iconify-color  size-10"></view>
          <view class="mdi--calendar-multiselect iconify-color  size-10"></view>
          <view class="mdi--calendar-multiselect iconify-color  size-10"></view>
          <view class="mdi--calendar-multiselect iconify-color  size-10"></view>
          <view class="mdi--calendar-multiselect iconify-color  size-10"></view>
        </view>
      </view>
    </view>
    <view class="pb-[200rpx]" v-if="activeKey==='settings'">
      <view
        v-for="item in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]"
        :key="item"
        class="mb-4"
      >
        <view class="w-full rounded-[24rpx] bg-blue-100 backdrop-blur-md border border-white/60 p-4">
          <view class="i-mdi-cog size-10"></view>
          <view class="mdi--cog iconify-color  size-10"></view>
          <view class="mdi--cog iconify-color  size-10"></view>
          <view class="mdi--cog iconify-color  size-10"></view>
          <view class="mdi--cog iconify-color  size-10"></view>
          <view class="mdi--cog iconify-color  size-10"></view>
          <view class="mdi--cog iconify-color  size-10"></view>
        </view>
      </view>
    </view>

    <!-- ========================================== -->
    <!-- 悬浮 TabBar (Floating Animted Tabs) -->
    <!-- ========================================== -->
    <!-- <t-fab class="w-full !right-0 px-4 !bottom-[calc(env(safe-area-inset-bottom)+0rpx)]"> -->
    <t-fab class="w-full !right-0 px-4 !bottom-[32rpx]">
      <view
        class="tabs-container rounded-full w-full bg-white/80 backdrop-blur-sm p-[12rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.08)] border border-white/50"
        @touchstart="handleContainerTouchStart"
        @touchend="handleContainerTouchEnd"
        @touchcancel="handleContainerTouchEnd"
      >
        <view class="relative flex rounded-full">
          <!-- 背景指示器 (Worklet 控制) -->
          <view
            class="indicator-bg absolute bottom-0 left-0 top-0 z-[1] rounded-full bg-white/40 shadow-[0_4rpx_16rpx_rgba(24,94,224,0.15)] border border-white/60"
            :style="indicatorStyleFallback"
          />

          <!-- Tab 项列表 -->
          <view
            v-for="tab in tabs"
            :key="tab.key"
            class="relative z-[2] flex flex-1 flex-col items-center justify-center py-[12rpx] transition-opacity duration-150"
            hover-class="tab-hover"
            :data-tab-key="tab.key"
            @tap="handleTabChange"
          >
            <!-- 图标与激活状态反馈 -->

              <image
                :src="tab.key === activeKey ? tab.activeIcon : tab.icon"
                class="size-6"
                mode="aspectFit"
              ></image>

            <!-- 标签文本 -->
            <view
              class="text-[18rpx] transition-colors duration-150"
              :class="activeKey === tab.key ? 'text-[#098BE9]' : 'text-[#19191D]'"
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
/* 导航栏背景模糊层 (Worklet 动画控制 opacity) */
.navbar-bg {
  /* 固定模糊值，通过 opacity 控制可见性 */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* 延长渐变遮罩，实现更平滑的边缘过渡 (70% -> 100%) */
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 70%,
    rgba(0, 0, 0, 0.85) 78%,
    rgba(0, 0, 0, 0.65) 85%,
    rgba(0, 0, 0, 0.4) 90%,
    rgba(0, 0, 0, 0.2) 95%,
    rgba(0, 0, 0, 0) 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 70%,
    rgba(0, 0, 0, 0.85) 78%,
    rgba(0, 0, 0, 0.65) 85%,
    rgba(0, 0, 0, 0.4) 90%,
    rgba(0, 0, 0, 0.2) 95%,
    rgba(0, 0, 0, 0) 100%
  );
  /* 初始状态：完全透明，通过 Worklet 渐变到 1 */
  opacity: 0;
  /* 延长背景渐变，从 75% 开始变淡 */
  /* background: white; */
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.92) 60%,
    rgba(255, 255, 255, 1) 100%,
    transparent 100%
  );
  /* 硬件加速提示 */
  transform: translateZ(0);
  will-change: opacity;
}

/* 导航栏底部柔和阴影 (缓解割裂感) */
.navbar-bg::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180rpx;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.03) 0%,
    rgba(0, 0, 0, 0.06) 30%,
    rgba(0, 0, 0, 0.04) 60%,
    transparent 100%
  );
  pointer-events: none;
}

/* 指示器备用动画 */
.indicator-bg {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 反馈态 */
.tab-hover {
  opacity: 0.7;
}
</style>
