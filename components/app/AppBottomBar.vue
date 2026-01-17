<template>
  <view class="bottomBar" :style="{ paddingBottom: `${safeBottom}px` }">
    <button class="bottomBarBtn" type="primary" @click="$emit('click')">{{ label }}</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

defineProps({
  label: { type: String, default: '提交' },
});

const safeBottom = ref(0);

onMounted(() => {
  const sys = uni.getSystemInfoSync();
  safeBottom.value = sys.safeAreaInsets?.bottom ?? 0;
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
</style>
