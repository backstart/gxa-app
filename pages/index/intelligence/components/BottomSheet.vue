<template>
  <view class="bottom-sheet" :style="sheetStyle">
    <view class="sheet-shell">
      <view
        class="handle-row"
        @tap="toggleState"
        @touchstart="handleTouchStart"
        @touchmove.stop.prevent="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <view class="handle-bar"></view>
      </view>
      <view class="state-row">
        <text
          v-for="item in stateOptions"
          :key="item"
          :class="['state-pill', modelValue === item ? 'active' : '']"
          @tap.stop="emit('update:modelValue', item)"
        >
          {{ stateTextMap[item] }}
        </text>
      </view>
      <scroll-view class="sheet-scroll" scroll-y :show-scrollbar="false">
        <slot :state="modelValue"></slot>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: 'half' },
  safeBottom: { type: Number, default: 0 },
});

const emit = defineEmits(['update:modelValue']);

const stateOptions = ['collapsed', 'half', 'full'];
const stateTextMap = {
  collapsed: '折叠',
  half: '半屏',
  full: '全屏',
};

const windowHeight = ref(780);
const dragHeight = ref(null);
const touchStartY = ref(0);
const touchStartHeight = ref(0);

const heights = computed(() => {
  const collapsed = Math.round(windowHeight.value * 0.28);
  const half = Math.round(windowHeight.value * 0.56);
  const full = Math.round(windowHeight.value * 0.88);
  return { collapsed, half, full };
});

const currentHeight = computed(() => dragHeight.value ?? heights.value[props.modelValue] ?? heights.value.half);
const translateY = computed(() => Math.max(windowHeight.value - currentHeight.value, 0));

const sheetStyle = computed(() => ({
  transform: `translateY(${translateY.value}px)`,
  paddingBottom: `${props.safeBottom}px`,
}));

function getNearestState(height) {
  return stateOptions.reduce((nearest, key) => {
    const nearestDiff = Math.abs(height - heights.value[nearest]);
    const currentDiff = Math.abs(height - heights.value[key]);
    return currentDiff < nearestDiff ? key : nearest;
  }, 'half');
}

function handleTouchStart(event) {
  const touch = event.touches && event.touches[0];
  if (!touch) return;
  touchStartY.value = touch.clientY;
  touchStartHeight.value = currentHeight.value;
}

function handleTouchMove(event) {
  const touch = event.touches && event.touches[0];
  if (!touch) return;
  const delta = touchStartY.value - touch.clientY;
  const nextHeight = Math.min(
    Math.max(touchStartHeight.value + delta, heights.value.collapsed),
    heights.value.full
  );
  dragHeight.value = nextHeight;
}

function handleTouchEnd() {
  const nextState = getNearestState(currentHeight.value);
  dragHeight.value = null;
  emit('update:modelValue', nextState);
}

function toggleState() {
  if (props.modelValue === 'collapsed') emit('update:modelValue', 'half');
  else if (props.modelValue === 'half') emit('update:modelValue', 'full');
  else emit('update:modelValue', 'collapsed');
}

onMounted(() => {
  const sys = uni.getSystemInfoSync();
  windowHeight.value = sys.windowHeight || 780;
});
</script>

<style lang="scss" scoped>
.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  transition: transform 180ms ease;
}

.sheet-shell {
  min-height: 100vh;
  padding: 0 20rpx;
  border-radius: 36rpx 36rpx 0 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 252, 0.96));
  box-shadow: 0 -20rpx 40rpx rgba(19, 38, 58, 0.14);
}

.handle-row {
  padding: 14rpx 0 10rpx;
  display: flex;
  justify-content: center;
}

.handle-bar {
  width: 88rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #c8d3de;
}

.state-row {
  display: flex;
  gap: 10rpx;
  justify-content: center;
  padding-bottom: 12rpx;
}

.state-pill {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #eef3f7;
  color: #607386;
  font-size: 22rpx;
}

.state-pill.active {
  background: #133452;
  color: #f7fbff;
}

.sheet-scroll {
  height: calc(100vh - 110rpx);
}
</style>
