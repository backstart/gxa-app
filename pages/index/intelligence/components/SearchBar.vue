<template>
  <view class="search-bar">
    <view class="search-shell">
      <text class="search-icon">搜</text>
      <input
        :value="modelValue"
        class="search-input"
        :placeholder="placeholder"
        placeholder-class="search-placeholder"
        confirm-type="search"
        @input="emit('update:modelValue', $event.detail.value)"
        @confirm="emit('search')"
      />
      <text v-if="modelValue" class="clear-btn" @tap="emit('update:modelValue', '')">清空</text>
    </view>
    <view class="search-btn" @tap="emit('search')">搜索</view>
  </view>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜索警情、人员、场所' },
});

const emit = defineEmits(['update:modelValue', 'search']);
</script>

<style lang="scss" scoped>
.search-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12rpx;
}

.search-shell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 18rpx;
  height: 78rpx;
  border-radius: 999rpx;
  background: #f8fbfe;
  box-shadow: inset 0 0 0 1px #d9e3ed;
}

.search-icon {
  flex: 0 0 auto;
  color: #5d7084;
  font-size: 30rpx;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 78rpx;
  padding: 0 14rpx;
  font-size: 26rpx;
  color: #223547;
}

.search-placeholder {
  color: #91a1b1;
}

.clear-btn,
.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 78rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
}

.clear-btn {
  flex: 0 0 auto;
  color: #6b7d8f;
}

.search-btn {
  min-width: 128rpx;
  padding: 0 28rpx;
  background: linear-gradient(135deg, #1f7cff, #59a2ff);
  color: #f8fbff;
  box-shadow: 0 14rpx 24rpx rgba(31, 124, 255, 0.24);
}
</style>
