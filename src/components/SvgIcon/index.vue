<script setup lang="ts">
import { Base64, changeSvgColor } from '@/utils/svg';
import { ref, watch } from 'wevu';

const props = withDefaults(defineProps<{
  /** SVG 路径或 Data URL */
  src?: string
  /** 直接传入 SVG 源码 */
  content?: string
  /** Tailwind 尺寸类，如 size-4, size-5 等 */
  size?: string
  /** 显式颜色 */
  color?: string
  /** mode */
 mode ?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix' | 'top' | 'bottom' | 'center' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';
}>(), {
  size: 'size-5',
  color: '#ffffff',
  mode: 'aspectFit',
})

const svgData = ref('')
const fs = typeof wx !== 'undefined' ? wx.getFileSystemManager() : null

const processSvg = (input: string, isSrc: boolean, color: string) => {
  if (!input) {
    svgData.value = ''
    return
  }

  // 远程资源
  if (isSrc && (input.startsWith('http') || input.startsWith('https'))) {
    svgData.value = input
    return
  }

  const handleContent = (content: string) => {
    // 注入颜色并转换为 Base64
    const finalContent = changeSvgColor(content, color)
    const base64 = Base64.encode(finalContent)
    svgData.value = 'data:image/svg+xml;base64,' + base64
  }

  if (isSrc) {
    if (input.startsWith('data:')) {
      svgData.value = input
      return
    }

    if (fs) {
      fs.readFile({
        filePath: input,
        encoding: 'utf8',
        success: (res) => handleContent(res.data as string),
        fail: (err) => {
          console.error('[SvgIcon] Read file failed:', err)
          svgData.value = input
        }
      })
    } else {
      svgData.value = input
    }
  } else {
    handleContent(input)
  }
}

watch(
  [() => props.src, () => props.content, () => props.color],
  ([src, content, color]) => {
    if (content) processSvg(content, false, color || '#ffffff')
    else if (src) processSvg(src, true, color || '#ffffff')
  },
  { immediate: true }
)

defineComponentJson({
  styleIsolation: 'apply-shared',
  virtualHost: true
})
</script>

<template>
    <view :class="[size]" class="flex items-center justify-center aspect-square flex-shrink-0 ">
      <image
        :src="svgData"
        class="w-full h-full"
        :mode="mode"
      />
    </view>
</template>

<style scoped></style>
