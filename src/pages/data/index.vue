<script setup lang="ts">
import DataPanel from '@/pages/index/DataPanel.vue'

definePageJson({
  navigationBarTitleText: '体重数据',
  backgroundColor: '#f6f7fb',
})
</script>

<template>
  <view class="min-h-screen bg-[#f6f7fb] px-[28rpx] pb-[88rpx] pt-[24rpx]">
    <DataPanel />
  </view>
</template>
