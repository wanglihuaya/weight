<script setup lang="ts">
/**
 * 首页 - 体重记录与数据展示
 * 采用 Skyline 渲染内核与 Worklet 动画引擎
 */
import WeightDashboard from '@/components/WeightDashboard/index.vue'
import { getNavbarInfo } from '@/utils/navbar'
import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'wevu'
import DataPanel from './DataPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import WidgetPanel from './WidgetPanel.vue'
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
const navbarGradientFallbackClass = computed(() => (
  !useWorklet.value && scrollTop.value > 8 ? 'navbar-gradient--active' : ''
))

// ==========================================
// Worklet 共享变量 (Animation Shared Values)
// ==========================================
let offsetX: any = null        // Tab 指示器偏移
let containerScale: any = null  // Tab 容器缩放
let indicatorScale: any = null  // 指示器缩放
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
const navbarTitleStyle = [
  `margin-left: ${navInfo.centerLeft}px`,
  `width: ${navInfo.centerWidth}px`,
  `top: ${navInfo.menuRect.top - navInfo.paddingTop}px`,
  `height: ${navInfo.menuRect.height}px`,
].join(';')
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
const handleTabChange = (event: WechatMiniprogram.TouchEvent) => {
  const newKey = String(event.currentTarget.dataset.tabKey || '')
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
    scrollY = shared(0)
    tabWidthPercent = 100 / tabs.length

    // 2. 注册 Worklet 动画样式
    if (pageInstance?.applyAnimatedStyle) {
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

      // iOS 26 风格白色渐变随滚动显现，无模糊滤镜
      pageInstance.applyAnimatedStyle('.navbar-gradient', () => {
        'worklet'
        const progress = Math.min(Math.max((scrollY.value - 6) / 72, 0), 1)
        return {
          opacity: progress,
          transform: `translateY(${(1 - progress) * -4}px)`
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
    <!-- iOS 26 风格：纯白到透明的细腻渐变，无模糊滤镜 -->
    <view
      class="navbar-gradient pointer-events-none absolute left-0 top-0 w-full"
      :class="navbarGradientFallbackClass"
    >
      <view class="navbar-gradient__base absolute left-0 top-0 h-full w-full" />
      <view class="navbar-gradient__sheen absolute left-0 top-0 w-full" />
    </view>

    <!-- 内容层 -->
    <view class="navbar-content relative w-full h-full">
      <!-- 中心标题 (随滚动渐显) -->
      <view
        class="navbar-title-slot absolute w-full text-center pointer-events-none"
        :style="navbarTitleStyle"
      >
        <view class="navbar-title">{{ navbarTitle }}</view>
      </view>
    </view>
  </view>

  <!-- ========================================== -->
  <!-- 主内容滚动区 (Main Content) -->
  <!-- ========================================== -->
  <scroll-view
    type="list"
    enable-back-to-top
    scroll-anchoring
    enable-passive
    :show-scrollbar="false"
    :safe-area-inset-top="false"
    scroll-y
    enhanced
    class="home-scroll h-screen pt-[var(--status-bar-height)] w-full px-4 box-border"
    @scroll="handleScroll"
  >
    <!-- 顶部避让空间 -->
    <view :style="navbarTotalHeightStyle" />

    <!-- 页面大标题 (随滚动渐隐) -->
    <view class="page-title home-page-title">{{ navbarTitle }}</view>

    <!-- 内容列表容器 -->
    <view v-if="activeKey==='data'">
      <WeightDashboard id="weight-dashboard" />
    </view>
    <view v-if="activeKey==='widget'" class="pb-[200rpx]">
      <WidgetPanel />
    </view>
    <view class="pb-[200rpx]" v-if="activeKey==='weight'">
      <DataPanel />
    </view>
    <view class="pb-[200rpx]" v-if="activeKey==='settings'">
      <SettingsPanel />
    </view>

    <!-- ========================================== -->
    <!-- 悬浮 TabBar (Floating Animted Tabs) -->
    <!-- ========================================== -->
    <t-fab class="home-tabbar-fab w-full !right-0 px-4 !bottom-[50rpx]">
      <view
        class="tabs-container home-tabbar w-full"
        @touchstart="handleContainerTouchStart"
        @touchend="handleContainerTouchEnd"
        @touchcancel="handleContainerTouchEnd"
      >
        <view class="home-tabbar-track relative flex rounded-full">
          <!-- 背景指示器 (Worklet 控制) -->
          <view
            class="indicator-bg home-tabbar-indicator absolute bottom-0 left-0 top-0 z-[1] rounded-full"
            :style="indicatorStyleFallback"
          />

          <!-- Tab 项列表 -->
          <view
            v-for="tab in tabs"
            :key="tab.key"
            class="home-tabbar-item relative z-[2] flex flex-1 flex-col items-center justify-center transition-opacity duration-150"
            hover-class="tab-hover"
            :data-tab-key="tab.key"
            @tap="handleTabChange"
          >
            <image
              :src="tab.key === activeKey ? tab.activeIcon : tab.icon"
              class="home-tabbar-icon"
              mode="aspectFit"
            />

            <view
              class="home-tabbar-label transition-colors duration-150"
              :class="activeKey === tab.key ? 'text-[#1595f5]' : 'text-[#17181d]'"
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
/* iOS 26 inspired navbar：纯白色透明度渐变，不使用 backdrop-filter。 */
.navbar-gradient {
  height: calc(100% + 104rpx);
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.navbar-gradient--active {
  opacity: 1;
  transform: translateY(0);
}

.navbar-gradient__base {
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

.navbar-gradient__sheen {
  height: 58%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.18) 58%,
    rgba(255, 255, 255, 0) 100%
  );
}

.navbar-content {
  z-index: 1;
}

.navbar-title {
  opacity: 0;
  transform: translateY(10px);
  color: rgba(22, 28, 38, 0.92);
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.4rpx;
  text-shadow: 0 1rpx 0 rgba(255, 255, 255, 0.72);
}

.navbar-title-slot {
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.home-scroll {
  color: #111218;
  background: #f4f5f9;
}

.home-page-title {
  margin-top: 44rpx;
  margin-bottom: 4rpx;
  color: #08090c;
  font-size: 62rpx;
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -1.8rpx;
}

.home-tabbar {
  padding: 10rpx;
  overflow: hidden;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.94);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(22px);
  box-shadow:
    0 22rpx 58rpx rgba(36, 42, 56, 0.14),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.96);
}

.home-tabbar-track {
  min-height: 100rpx;
}

.home-tabbar-indicator {
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  background: rgba(226, 228, 234, 0.84);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8),
    0 8rpx 24rpx rgba(31, 36, 48, 0.06);
}

.home-tabbar-item {
  min-height: 100rpx;
  padding: 8rpx 0 6rpx;
}

.home-tabbar-icon {
  width: 50rpx;
  height: 50rpx;
}

.home-tabbar-label {
  margin-top: 2rpx;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 1.1;
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
