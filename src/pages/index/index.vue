<script setup lang="ts">
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

definePageJson({
  usingComponents: {
    "t-fab": "tdesign-miniprogram/fab/fab",
    "t-navbar": "tdesign-miniprogram/navbar/navbar",
    "t-icon": "tdesign-miniprogram/icon/icon"
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
  activeIcon?: string
}

const tabs: TabItem[] = [
  { key: 'data', label: '体重', icon: weightIcon, activeIcon: weightIconActive },
  { key: 'weight', label: '数据', icon: dataIcon, activeIcon: dataIconActive },
  { key: 'widget', label: '小组件', icon: widgetIcon, activeIcon: widgetIconActive },
  { key: 'settings', label: '设置', icon: settingsIcon, activeIcon: settingsIconActive },
]

const activeKey = ref('data')
const instance = getCurrentInstance()
let offsetX: any = null
let containerScale: any = null
let indicatorScale: any = null
let navbarLeftScale: any = null
let scrollY: any = null
let tabWidthPercent = 0
let useWorklet = false

// Navbar 配置
const navbarTitle = ref('体重记录')
const scrollTop = ref(0)

// 根据滚动距离计算模糊强度和背景透明度
const navbarBgStyle = computed(() => {
  const progress = Math.min(scrollTop.value / 300, 1) // 300rpx内完成渐变
  const blurValue = progress * 5 // 0-40px模糊
  const bgOpacity = 0.1 + progress * 0.4 // 10%-40%透明度
  return `backdrop-filter: blur(${blurValue}px); background: linear-gradient(to bottom, rgba(255, 255, 255, ${bgOpacity}), transparent);`
})
const navbarHeightStyle = `padding-top: ${getNavbarInfo().paddingTop}px; height: calc(${getNavbarInfo().totalHeight}px); `

const navbarTotalHeightStyle = `height: ${getNavbarInfo().totalHeight + 12}px; `

const navbarTitleStyle = `margin-left: ${getNavbarInfo().centerLeft}px; width: ${getNavbarInfo().centerWidth}px; `

const capsuleWidth = `width: ${getNavbarInfo().capsuleWidth}px; `

// 监听滚动事件
const handleScroll = (e: any) => {
  scrollTop.value = e.detail.scrollTop
  if (scrollY) {
    scrollY.value = e.detail.scrollTop
  }
}

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
    indicatorScale = shared(1)
    navbarLeftScale = shared(1)
    scrollY = shared(0)

    // 计算单个 tab 的宽度百分比
    tabWidthPercent = 100 / tabs.length

    const pageInstance = instance?.proxy || instance

    // 应用动画样式到左侧按钮
    if (pageInstance?.applyAnimatedStyle) {
      pageInstance.applyAnimatedStyle('.navbar-left-btn', () => {
        'worklet'
        return {
          transform: `scale(${navbarLeftScale.value})`,
        }
      })

      // Navbar 标题动画：滚动时从透明渐变到显示，并有轻微上移
      pageInstance.applyAnimatedStyle('.navbar-title', () => {
        'worklet'
        const progress = Math.min(scrollY.value / 40, 1) // 40px 内完成
        return {
          opacity: progress,
          transform: `translateY(${(1 - progress) * 10}px)`,
        }
      })

      // 页面主标题动画：滚动时从显示渐变到隐藏，并有轻微上移
      pageInstance.applyAnimatedStyle('.page-title', () => {
        'worklet'
        const progress = Math.min(scrollY.value / 40, 1)
        return {
          opacity: 1 - progress,
          // transform: `translateY(${progress * -10}px)`,
        }
      })

      pageInstance.applyAnimatedStyle('.indicator-bg', () => {
        'worklet'
        return {
          width: `${tabWidthPercent}%`,
          transform: `translateX(${offsetX.value}%) scale(${indicatorScale.value})`,
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

const handleNavbarLeftTouchStart = () => {
  if (useWorklet && navbarLeftScale) {
    const { spring } = wx.worklet
    navbarLeftScale.value = spring(1.24, {
      stiffness: 1000,
      damping: 40,
    }, () => {
      'worklet'
    })
  }
}

const handleNavbarLeftTouchEnd = () => {
  if (useWorklet && navbarLeftScale) {
    const { spring } = wx.worklet
    navbarLeftScale.value = spring(1, {
      stiffness: 1000,
      damping: 40,
    }, () => {
      'worklet'
    })
  }
}

// 松开时恢复
const handleTabTouchEnd = (e: any) => {
  const tabKey = e?.currentTarget?.dataset.tabKey
  if (useWorklet && indicatorScale) {
    const { spring } = wx.worklet
    indicatorScale.value = spring(1, {
      stiffness: 400,
      damping: 25,
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
  if (useWorklet && offsetX && indicatorScale) {
    try {
      const { spring } = wx.worklet
      const index = tabs.findIndex(tab => tab.key === newKey)
      console.log(`🎯 切换到 tab ${index}, 目标位置: ${index * 100}%`)

      // 切换时背景先放大
      indicatorScale.value = spring(1.5, {
        stiffness: 400,
        damping: 25,
      }, () => {
        'worklet'
      })

      // 使用 spring 动画实现物理弹性效果
      offsetX.value = spring(index * 100, {
        stiffness: 250,
        damping: 20,
        mass: 1,
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
  <!-- 自定义 Navbar - fixed 定位，不占位 -->
  <view
    class="w-full fixed top-0 left-0 z-50 flex items-center justify-between"
    :style="navbarBgStyle + navbarHeightStyle"
  >
    <view
      class="navbar-left-btn shrink-0 grow-0 flex items-center justify-center p-1 shadow-sm bg-white/60 backdrop-blur-xs rounded-full hover:bg-white/80 transition-colors duration-150 ml-3"
      @touchstart="handleNavbarLeftTouchStart"
      @touchend="handleNavbarLeftTouchEnd"
      @touchcancel="handleNavbarLeftTouchEnd"
    >
      <t-icon
        name="chevron-left"
        size="64rpx"
        data-name="chevron-left"
      />
    </view>
    <view
      class="navbar-title absolute w-full text-[#1c1c3c] text-lg font-semibold text-center"
      :style="navbarTitleStyle"
    >{{ navbarTitle }}</view>
    <view :style="capsuleWidth"></view>
  </view>

  <!-- 主内容区域 - 可在 navbar 下方滚动 -->
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

    <!-- 占位符，避免内容被 navbar 遮挡 -->
    <view :style="navbarTotalHeightStyle" />

    <view class="page-title font-semibold text-lg">{{ navbarTitle }}</view>
    <!-- 内容区域 -->
    <view class="pb-[200rpx]">
      <view
        v-for="item in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]"
        :key="item"
        class="mb-4"
      >
        <view
          class="h-[200rpx] w-full rounded-[24rpx] bg-blue-100 backdrop-blur-md border border-white/60"
        >
          <view class="i-mdi-gauge size-10 text-red-400"></view>
          <view class="mdi--airplane-settings iconify-color size-10"></view>
        </view>
      </view>
    </view>
    <t-fab class="w-full !right-0 px-4 !bottom-[calc(env(safe-area-inset-bottom)+16rpx)]">
      <!-- Animated Tabs 组件 -->
      <!-- Tab 容器 (Web Style) -->
      <view
        class="tabs-container rounded-full w-full bg-white/80 backdrop-blur-sm p-[12rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.08)] border border-white/50"
        @touchstart="handleContainerTouchStart"
        @touchend="handleContainerTouchEnd"
        @touchcancel="handleContainerTouchEnd"
      >
        <view class="relative flex rounded-full">
          <!-- 滑动背景指示器 (Glider) - 通过 worklet 控制动画 -->
          <view
            class="indicator-bg absolute bottom-0 left-0 top-0 z-[1] rounded-full bg-white/40 shadow-[0_4rpx_16rpx_rgba(24,94,224,0.15)] border border-white/60"
            :style="indicatorStyleFallback"
          />

          <!-- Tab 项 -->
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
            <!-- 图标 -->
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

            <!-- 标签文字 -->
            <view
              class="text-[18rpx]  transition-colors duration-150"
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
/* 滑动指示器动画由 worklet 控制 */
.indicator-bg {
  /* Worklet 动画优先，CSS 作为备用 */
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 点击态样式 */
.tab-hover {
  opacity: 0.7;
}
</style>
