<template>
  <view class="pageRoot" :style="{ background: bg }">
    <view class="safeSpacer" :style="{ height: `${safeTop}px` }"></view>
    <scroll-view v-if="useScroll" class="pageScroll" scroll-y>
      <slot></slot>
    </scroll-view>
    <view v-else class="pageContent">
      <slot></slot>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  useScroll: { type: Boolean, default: true },
  bg: { type: String, default: '#f6f7fb' },
});

const safeTop = ref(0);

onMounted(() => {
  const sys = uni.getSystemInfoSync();
  safeTop.value = sys.safeAreaInsets?.top ?? sys.statusBarHeight ?? 0;
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.pageContent {
  flex: 1;
}
</style>
