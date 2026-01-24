<script setup lang="ts">
/**
 * 首页 - 体重记录与数据展示
 * 采用 Skyline 渲染内核与 Worklet 动画引擎
 */
import { debounce } from '@/utils/common'
import { getNavbarInfo } from '@/utils/navbar'
import dataIconActive from 'public/tabbar/data-active.png'
import dataIcon from 'public/tabbar/data.png'
import settingsIconActive from 'public/tabbar/setting-active.png'
import settingsIcon from 'public/tabbar/setting.png'
import weightIconActive from 'public/tabbar/weight-active.png'
import weightIcon from 'public/tabbar/weight.png'
import widgetIconActive from 'public/tabbar/widgets-active.png'
import widgetIcon from 'public/tabbar/widgets.png'
import { computed, getCurrentInstance, onMounted, ref } from 'wevu'

// ==========================================
// 页面配置 (Page Configurations)
// ==========================================
definePageJson({
  usingComponents: {
    "t-fab": "tdesign-miniprogram/fab/fab",
    "t-icon": "tdesign-miniprogram/icon/icon"
  },
  navigationStyle: 'custom',
  componentFramework: "glass-easel",
  renderer: "skyline",
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
  icon: string
  activeIcon?: string
}

const tabs: TabItem[] = [
  { key: 'data', label: '体重', icon: weightIcon, activeIcon: weightIconActive },
  { key: 'weight', label: '数据', icon: dataIcon, activeIcon: dataIconActive },
  { key: 'widget', label: '小组件', icon: widgetIcon, activeIcon: widgetIconActive },
  { key: 'settings', label: '设置', icon: settingsIcon, activeIcon: settingsIconActive },
]

// ==========================================
// 响应式变量 (Reactive State)
// ==========================================
const instance = getCurrentInstance()
const activeKey = ref('data')
const navbarTitle = ref('体重记录')
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

// ==========================================
// 计算属性 (Computed Styles)
// ==========================================

// 导航栏背景动态样式（模糊与透明度渐变）
const navbarBgStyle = computed(() => {
  const progress = Math.min(scrollTop.value / 300, 1)
  const blurValue = progress * 5
  const bgOpacity = 0.1 + progress * 0.4
  return `backdrop-filter: blur(${blurValue}px); background: linear-gradient(to bottom, rgba(255, 255, 255, ${bgOpacity}), transparent);`
})

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

// Tab 指示器松开反馈
const handleTabTouchEnd = () => {
  if (useWorklet.value && indicatorScale) {
    const { spring } = wx.worklet
    indicatorScale.value = spring(1, { stiffness: 400, damping: 25 }, () => { 'worklet' })
  }
}

// Tab 切换逻辑
const handleTabChange = debounce((e: any) => {
  const newKey = e?.currentTarget?.dataset.tabKey
  if (!newKey || newKey === activeKey.value) return

  activeKey.value = newKey

  // 更新 Worklet 动画
  if (useWorklet.value && offsetX && indicatorScale) {
    const { spring } = wx.worklet
    const index = tabs.findIndex(tab => tab.key === newKey)

    // 点击时指示器先放大
    indicatorScale.value = spring(1.5, { stiffness: 400, damping: 25 }, () => { 'worklet' })

    // 平滑平移指示器
    offsetX.value = spring(index * 100, {
      stiffness: 250,
      damping: 20,
      mass: 1,
    }, () => { 'worklet' })
  }
}, 50)

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

      useWorklet.value = true
      console.log('✅ Worklet 动画初始化成功')
    }
  } catch (error) {
    console.error('❌ Worklet 初始化失败:', error)
  }
})
</script>

<template>
  <!-- ========================================== -->
  <!-- 顶部导航栏 (Custom Navbar) -->
  <!-- ========================================== -->
  <view
    class="w-full fixed top-0 left-0 z-50 flex items-center justify-between"
    :style="navbarBgStyle + navbarHeightStyle"
  >
    <!-- 左侧操作按钮 -->
    <view
      class="navbar-left-btn shrink-0 grow-0 flex items-center justify-center p-1 shadow-sm bg-white/60 backdrop-blur-xs rounded-full hover:bg-white/80 transition-colors duration-150 ml-3"
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
    class="h-screen pt-[var(--status-bar-height)] w-full bg-gradient-to-b from-blue-50 to-blue-100 text-[#1c1c3c] px-4"
    @scroll="handleScroll"
  >
    <!-- 顶部避让空间 -->
    <view :style="navbarTotalHeightStyle" />

    <!-- 页面大标题 (随滚动渐隐) -->
    <view class="page-title font-semibold text-lg">{{ navbarTitle }}</view>

    <!-- 内容列表容器 -->
    <view class="pb-[200rpx]">
      <view
        v-for="item in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]"
        :key="item"
        class="mb-4"
      >
        <view class="h-[200rpx] w-full rounded-[24rpx] bg-blue-100 backdrop-blur-md border border-white/60">
          <view class="i-mdi-gauge size-10 text-red-400"></view>
          <view class="mdi--airplane-settings iconify-color size-10"></view>
        </view>
      </view>
    </view>

    <!-- ========================================== -->
    <!-- 悬浮 TabBar (Floating Animted Tabs) -->
    <!-- ========================================== -->
    <t-fab class="w-full !right-0 px-4 !bottom-[calc(env(safe-area-inset-bottom)+16rpx)]">
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
            class="relative z-[2] flex flex-1 flex-col gap-1 items-center justify-center py-[10rpx] transition-opacity duration-150"
            hover-class="tab-hover"
            :data-tab-key="tab.key"
            @touchstart="handleTabChange"
            @touchend="handleTabTouchEnd"
            @touchcancel="handleTabTouchEnd"
          >
            <!-- 图标与激活状态反馈 -->
            <view
              class="transition-all duration-150"
              :class="activeKey === tab.key ? 'scale-110' : ''"
              style="line-height: 1;"
            >
              <image
                :src="tab.key === activeKey ? tab.activeIcon : tab.icon"
                class="size-6"
                mode="aspectFit"
              ></image>
            </view>

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
/* 指示器备用动画 */
.indicator-bg {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 反馈态 */
.tab-hover {
  opacity: 0.7;
}
</style>
