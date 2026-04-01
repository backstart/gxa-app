<template>
  <view class="quick-actions">
    <view
      v-for="item in actions"
      :key="item.key"
      :class="['action-card', activeKey === item.key ? 'active' : '']"
      @tap="emit('select', item.key)"
    >
      <view class="action-icon" :style="{ background: item.iconBg }">
        <text class="action-emoji">{{ item.icon }}</text>
      </view>
      <text class="action-label">{{ item.label }}</text>
      <text v-if="item.count > 0" class="action-count">{{ item.count }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  actions: { type: Array, default: () => [] },
  activeKey: { type: String, default: '' },
});

const emit = defineEmits(['select']);
</script>

<style lang="scss" scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12rpx;
}

.action-card {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 8rpx;
  padding: 18rpx 8rpx 14rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 10rpx 24rpx rgba(20, 42, 64, 0.08);
}

.action-card.active {
  background: linear-gradient(180deg, #17324b, #294b67);
}

.action-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-emoji {
  font-size: 34rpx;
}

.action-label {
  font-size: 22rpx;
  color: #304455;
}

.action-card.active .action-label {
  color: #f7fbff;
}

.action-count {
  position: absolute;
  right: 10rpx;
  top: 10rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: #ff5b47;
  color: #fff;
  text-align: center;
  line-height: 30rpx;
  font-size: 20rpx;
}
</style>
