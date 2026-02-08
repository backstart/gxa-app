<template>
  <view class="pageRoot" :style="{ background: bg }">
    <view class="safeSpacer" :style="{ height: `${safeTop}px` }"></view>
    <scroll-view
      v-if="useScroll"
      class="pageScroll"
      :id="scrollId"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="scrollWithAnimation"
      @scroll="handleScroll"
    >
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
  scrollTop: { type: Number, default: 0 },
  scrollIntoView: { type: String, default: '' },
  scrollWithAnimation: { type: Boolean, default: false },
  scrollId: { type: String, default: 'app-page-scroll' },
});
const emit = defineEmits(['scroll']);

const safeTop = ref(0);

onMounted(() => {
  const sys = uni.getSystemInfoSync();
  safeTop.value = sys.safeAreaInsets?.top ?? sys.statusBarHeight ?? 0;
});

function handleScroll(event) {
  // 将滚动事件透传给页面层，便于实现筛选吸顶和自动置顶交互
  emit('scroll', event);
}
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.pageContent {
  flex: 1;
}
</style>
