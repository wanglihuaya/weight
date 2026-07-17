# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

WeChat Mini Program for tracking weight changes, built with Vue 3 Composition API, TypeScript, and TDesign components. Uses weapp-vite as the build tool and wevu as the Vue framework adapter for mini programs.

## Common Commands

```bash
# Development
pnpm dev              # Start development server
pnpm dev:open         # Start dev server and open WeChat DevTools

# Building
pnpm build            # Build for production
pnpm typecheck        # Run TypeScript type checking (vue-tsc)

# Utility
pnpm open             # Open WeChat DevTools
```

## Architecture

### Core Technologies
- **weapp-vite**: Build tool for WeChat Mini Programs (https://vite.icebreaker.top/)
- **wevu**: Vue 3 framework adapter for mini programs
- **TDesign**: Tencent's design system for mini programs (auto-imported)
- **Tailwind CSS**: With rpx units via weapp-tailwindcss (rem2rpx plugin)

### Directory Structure

```
src/
├── app.vue                 # Main app config with TabBar + page/subpackage routes
├── pages/                  # Main TabBar pages (首页/数据/表单/清单/能力)
├── subpackages/           # Lazy-loaded pages (lab, ability)
├── components/            # Reusable Vue components
├── hooks/                 # Composition API hooks (useToast, useDialog, usePullDownRefresh)
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

### Key Configuration Patterns

**Component Auto-Import** (vite.config.ts):
- TDesign components are auto-imported via `TDesignResolver()`
- Vue components use `wevu` module
- Components use `virtualHost: true` and `styleIsolation: 'apply-shared'` by default

**Tailwind CSS** (tailwind.config.ts):
- Content: `src/**/*.{wxml,js,ts,vue}`
- Preflight and container are disabled (mini program compatibility)
- Icons: MDI collection via `@egoist/tailwindcss-icons`
- `rem2rpx: true` converts rem units to rpx

**Page Generation** (pnpm g):
- Components: `src/components` → generates Foo/Foo format
- Pages: `src/pages` → generates index files
- Extensions: `.js` → `.ts`, `.wxss` → `.scss`

### Component Conventions

1. **Script Setup**: Use Vue 3 `<script setup lang="ts">` syntax
2. **Props**: Define with TypeScript interfaces using `withDefaults(defineProps<T>(), {...})`
3. **Component Config**: Use `defineComponentJson()` for component-level configuration
4. **App Config**: Use `defineAppJson()` in app.vue for global configuration
5. **Events**: Use `defineEmits<{ (e: 'event-name', payload: type): void }>()` for typed events

### Styling Notes

- Tailwind classes with rpx units (e.g., `p-[16rpx]`, `rounded-[20rpx]`)
- Gradient backgrounds and shadow effects for modern UI
- Style isolation handled at component level via `styleIsolation: 'apply-shared'`
- Global styles in app.vue with Tailwind directives

### Navigation

- TabBar navigation for main pages (configured in app.vue `defineAppJson`)
- Sub-package loading for secondary pages
- Programmatic: `wx.switchTab()` for TabBar pages, `wx.navigateTo()` for others

### WeChat Mini Program APIs

- Use `miniprogram-api-typings` for TypeScript support
- TDesign components are accessed globally (auto-imported)
- Custom hooks wrap common patterns (toast, dialog, pull-down-refresh)


# 子包页面开发指南

本文档总结了 `class-binding` 和 `ability` 两个子包页面的写法模式和最佳实践。

## 目录

1. [页面配置模式](#页面配置模式)
2. [状态管理模式](#状态管理模式)
3. [组件引入与使用](#组件引入与使用)
4. [样式系统](#样式系统)
5. [API 调用模式](#api-调用模式)
6. [UI 布局模式](#ui-布局模式)

---

## 页面配置模式

### 基础配置

所有子包页面都使用 `definePageJson` 宏进行页面级配置：

```typescript
definePageJson({
  navigationBarTitleText: '页面标题',
  backgroundColor: '#f6f7fb',
})
```

**配置说明：**
- `navigationBarTitleText`: 导航栏标题
- `backgroundColor`: 页面背景色（与顶部安全区域协调）

### 导入模式

```typescript
import { computed, reactive, ref, useBindModel, watch, onShow } from 'wevu'

import SectionTitle from '@/components/SectionTitle/index.vue'
```

**要点：**
- Vue API 从 `wevu` 导入（非 `vue`）
- 组件使用 `@/` 别名路径导入
- 按需导入所需的 Composition API

---

## 状态管理模式

### 基础响应式状态

```typescript
const isActive = ref(true)
const hasError = ref(false)
const isRound = ref(false)
const isGhost = ref(false)
```

### useBindModel 模式（双路绑定）

```typescript
const bindModel = useBindModel({ event: 'change', valueProp: 'value' })
const onActiveChange = bindModel.model<boolean>('isActive').onChange
```

**用途：** 将 TDesign 组件的 change 事件与 ref 状态自动绑定

### reactive 对象模式

```typescript
const classObject = reactive({
  'demo-active': true,
  'text-danger': false,
  'demo-round': false,
  'demo-ghost': false,
})
```

### watch 监听模式

```typescript
watch([isActive, hasError, isRound, isGhost], ([active, error, round, ghost]) => {
  classObject['demo-active'] = active
  classObject['text-danger'] = error
  classObject['demo-round'] = round
  classObject['demo-ghost'] = ghost
}, { immediate: true })
```

**要点：**
- 支持多源监听（数组形式）
- 使用解构获取响应式值
- `immediate: true` 立即执行

### computed 计算属性

```typescript
const activeClassIf = computed(() => (isActive.value ? activeClass.value : ''))
const dynamicKeyClass = computed(() => ({ [activeClass.value]: isActive.value }))
```

**模式：**
- 条件返回字符串（用于 class 绑定）
- 动态 key 对象（用于 class 绑定）

### 类型定义

```typescript
const systemInfo = ref<WechatMiniprogram.SystemInfo | null>(null)
```

**要点：**
- 使用微信小程序 API 类型定义（来自 `miniprogram-api-typings`）
- 联合类型处理可能为 null 的情况

---

## 组件引入与使用

### 导入共享组件

```typescript
import SectionTitle from '@/components/SectionTitle/index.vue'
```

### 使用 TDesign 组件（自动导入）

```vue
<t-switch :value="isActive" @change="onActiveChange" />
```

**常用 TDesign 组件：**
- `t-switch`: 开关
- `t-search`: 搜索框
- `t-check-tag`: 标签选择器
- `t-button`: 按钮
- `t-toast`: 轻提示

---

## 样式系统

### Tailwind CSS 约定

```vue
<view class="min-h-screen bg-[#f6f7fb] px-[28rpx] pb-[88rpx] pt-[24rpx] text-[#1c1c3c]">
```

**常用类：**
| 类名 | 作用 | 值 |
|------|------|-----|
| `min-h-screen` | 最小高度 | 屏幕高度 |
| `px-[28rpx]` | 水平内边距 | 28rpx |
| `pb-[88rpx]` | 底部内边距 | 88rpx（预留 TabBar） |
| `pt-[24rpx]` | 顶部内边距 | 24rpx |
| `text-[#1c1c3c]` | 文字颜色 | 主色 |

### 卡片样式模式

```vue
<view class="rounded-[24rpx] bg-white p-[20rpx] shadow-[0_18rpx_40rpx_rgba(17,24,39,0.08)]">
```

**卡片样式组合：**
- `rounded-[24rpx]`: 圆角 24rpx
- `bg-white`: 白色背景
- `p-[20rpx]`: 内边距 20rpx
- `shadow-[...]`: 阴影效果（模糊 40rpx，透明度 0.08）

### 渐变头部模式

```vue
<view class="rounded-[28rpx] bg-gradient-to-br from-[#eef2ff] via-[#ffffff] to-[#e0f2fe] p-[20rpx]">
  <SectionTitle title="标题" subtitle="副标题" />
</view>
```

**渐变配色方案：**
| 主题 | from | via | to |
|------|------|-----|-----|
| 蓝色系 | `#eef2ff` | `#ffffff` | `#e0f2fe` |
| 绿色系 | `#ecfccb` | `#ffffff` | `#d9f99d` |

### 网格布局

```vue
<view class="grid grid-cols-2 gap-[12rpx]">
```

### 列表间距

```vue
<view class="space-y-[14rpx]">
  <!-- 子元素之间垂直间距 14rpx -->
</view>
```

### Scoped 样式

```vue
<style scoped>
.demo-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  border: 2rpx solid #d7d9f2;
  background: #ffffff;
  border-radius: 18rpx;
  transition: all 0.2s ease;
}
</style>
```

**要点：**
- 使用 rpx 单位（响应式像素）
- `scoped` 限制样式作用域
- 添加 `transition` 实现平滑过渡

---

## API 调用模式

### 微信原生 API

```typescript
function loadSystemInfo() {
  wx.getSystemInfo({
    success: (result) => {
      systemInfo.value = result
    },
  })
}
```

### 生命周期钩子

```typescript
onShow(() => {
  loadSystemInfo()
})
```

**常用生命周期：**
- `onShow`: 页面显示时触发
- `onHide`: 页面隐藏时触发
- `onLoad`: 页面加载时触发

---

## UI 布局模式

### 1. 顶部渐变区域 + SectionTitle

```vue
<view class="rounded-[28rpx] bg-gradient-to-br from-[#eef2ff] via-[#ffffff] to-[#e0f2fe] p-[20rpx]">
  <SectionTitle title="主标题" subtitle="副标题说明" />
</view>
```

### 2. 白色卡片 + 内容区

```vue
<view class="mt-[18rpx] rounded-[24rpx] bg-white p-[20rpx] shadow-[0_18rpx_40rpx_rgba(17,24,39,0.08)]">
  <SectionTitle title="卡片标题" subtitle="卡片说明" />
  <view class="mt-[12rpx]">
    <!-- 内容 -->
  </view>
</view>
```

### 3. 状态控制卡片组

```vue
<view class="grid grid-cols-2 gap-[12rpx]">
  <view class="rounded-[16rpx] bg-[#f8fafc] p-[12rpx]">
    <view class="flex items-center justify-between">
      <text class="text-[22rpx] text-[#5c5b7a]">标签</text>
      <t-switch :value="state" @change="onChange" />
    </view>
  </view>
</view>
```

### 4. 信息行列表

```vue
<view class="space-y-[10rpx]">
  <view v-for="row in rows" :key="row.label" class="flex items-center justify-between">
    <text class="text-[22rpx] text-[#6f6b8a]">{{ row.label }}</text>
    <text class="text-[22rpx] font-semibold text-[#1f1a3f]">{{ row.value }}</text>
  </view>
</view>
```

### 5. 提示列表（带圆点）

```vue
<view class="space-y-[10rpx]">
  <view class="flex items-center gap-[8rpx]">
    <view class="h-[8rpx] w-[8rpx] rounded-full bg-[#2f2b5f]" />
    <text class="text-[22rpx] text-[#4c4b68]">提示内容</text>
  </view>
</view>
```

---

## Class 绑定模式（class-binding 页面）

### 1. 对象语法

```vue
<view :class="{ 'demo-active': isActive }">
```

### 2. 静态 + 动态

```vue
<view class="demo-block demo-ghost" :class="{ 'demo-active': isActive, 'text-danger': hasError }">
```

### 3. 响应式对象

```vue
<view :class="classObject">
```

### 4. 数组语法

```vue
<view :class="[activeClassIf, errorClassIf, roundClassIf]">
```

### 5. 条件数组

```vue
<view :class="[isActive ? activeClass : '', errorClassIf]">
```

### 6. 动态 key

```vue
<view :class="[dynamicKeyClass, errorClassIf]">
```

```typescript
const dynamicKeyClass = computed(() => ({ [activeClass.value]: isActive.value }))
```

---

## 页面模板结构

### 完整结构示例

```vue
<script setup lang="ts">
import { computed, ref, onShow } from 'wevu'
import SectionTitle from '@/components/SectionTitle/index.vue'

definePageJson({
  navigationBarTitleText: '页面标题',
  backgroundColor: '#f6f7fb',
})

// 状态定义
const state = ref(true)

// 计算属性
const computedValue = computed(() => state.value ? 'a' : 'b')

// 方法
function handleChange() {
  state.value = !state.value
}

// 生命周期
onShow(() => {
  // 初始化逻辑
})
</script>

<template>
  <view class="min-h-screen bg-[#f6f7fb] px-[28rpx] pb-[88rpx] pt-[24rpx] text-[#1c1c3c]">
    <!-- 头部区域 -->
    <view class="rounded-[28rpx] bg-gradient-to-br from-[#eef2ff] via-[#ffffff] to-[#e0f2fe] p-[20rpx]">
      <SectionTitle title="标题" subtitle="说明" />
    </view>

    <!-- 内容卡片 -->
    <view class="mt-[18rpx] rounded-[24rpx] bg-white p-[20rpx] shadow-[0_18rpx_40rpx_rgba(17,24,39,0.08)]">
      <SectionTitle title="卡片标题" subtitle="卡片说明" />
      <view class="mt-[12rpx]">
        <!-- 卡片内容 -->
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 自定义样式 */
</style>
```

---

## 总结

### 关键要点

1. **使用 wevu 导入 Vue API**，而非 vue
2. **definePageJson** 配置页面元信息
3. **@/ 别名**导入项目组件
4. **TDesign 组件自动导入**，无需手动 import
5. **rpx 单位**用于响应式布局
6. **Scoped 样式**隔离组件样式
7. **useBindModel** 简化双路绑定
8. **卡片模式**：`rounded-[24rpx] bg-white p-[20rpx] shadow-[...]`
9. **渐变头部**：`bg-gradient-to-br from-[...] via-[#ffffff] to-[...]`
