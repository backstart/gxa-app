<template>
  <view class="swipe-row" @click="onRowClick">
    <!-- 右侧操作区：默认被内容层遮住，只有左滑后才会露出 -->
    <view class="swipe-actions">
      <view class="action edit" @click.stop="emitEdit">编辑</view>
      <view class="action delete" @click.stop="emitDelete">删除</view>
    </view>

    <!-- 内容层：通过位移实现左滑，层级高于操作区 -->
    <view
      class="swipe-content"
      :style="contentStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 内层容器：强制 slot 宽度铺满，避免右侧露底 -->
      <view class="swipe-content-inner">
        <slot />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  rowId: { type: String, required: true },
  openId: { type: String, default: '' },
});
const emit = defineEmits(['open', 'close', 'edit', 'delete']);

// 操作区总宽度（编辑+删除），与样式保持一致
const actionWidthRpx = 140;
const actionWidthPx = uni.upx2px(actionWidthRpx);

const startX = ref(0);
const startY = ref(0);
const translateX = ref(0);
const dragging = ref(false);

// 当前行是否处于展开状态（由父组件 openId 统一控制，保证同时只展开一条）
const isOpen = computed(() => props.openId === props.rowId);

watch(isOpen, (val) => {
  // 外部状态变化时同步位移
  translateX.value = val ? -actionWidthPx : 0;
});

const contentStyle = computed(() => ({
  transform: `translateX(${translateX.value}px)`,
  transition: dragging.value ? 'none' : 'transform 0.2s ease',
}));

function onTouchStart(e) {
  // 记录起始触点，用于计算横向滑动距离
  const touch = e.touches[0];
  startX.value = touch.clientX;
  startY.value = touch.clientY;
  dragging.value = false;
}

function onTouchMove(e) {
  // 仅处理“横向左滑优先”的手势，避免影响纵向滚动
  const touch = e.touches[0];
  const dx = touch.clientX - startX.value;
  const dy = touch.clientY - startY.value;
  if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
  dragging.value = true;
  // 位移区间限制在 [-actionWidth, 0]
  translateX.value = Math.min(0, Math.max(dx, -actionWidthPx));
}

function onTouchEnd() {
  // 超过 35% 宽度则展开，否则回弹关闭
  if (!dragging.value) return;
  const threshold = actionWidthPx * 0.35;
  const shouldOpen = Math.abs(translateX.value) > threshold;
  if (shouldOpen) emit('open', props.rowId);
  else emit('close');
  dragging.value = false;
}

function onRowClick() {
  // 点击内容区域时，如果当前已展开则收起
  if (isOpen.value) emit('close');
}

function emitEdit() {
  // 触发编辑事件
  emit('edit', props.rowId);
}

function emitDelete() {
  // 触发删除事件
  emit('delete', props.rowId);
}
</script>

<style lang="scss" scoped>
.swipe-row {
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 140rpx;
  display: flex;
  z-index: 1;
}

.action {
  flex: 1;
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit { background: #1677ff; }
.delete { background: #ff4d4f; }

.swipe-content {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  /* 内容层默认不透明，确保未左滑时完全遮住右侧操作区 */
  background: var(--swipe-content-bg, #fff);
}

.swipe-content-inner {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}
</style>
