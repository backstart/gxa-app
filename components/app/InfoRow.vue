<template>
  <view class="infoRow" :class="{ clickable }" @click="handleClick">
    <text class="infoLabel">{{ label }}</text>
    <text class="infoValue" :class="{ empty: !displayValue, clamp: maxLines === 2 }">
      {{ displayValue || '—' }}
    </text>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number], default: '' },
  clickable: { type: Boolean, default: false },
  maxLines: { type: Number, default: 2 },
});

const emit = defineEmits(['click']);

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return '';
  return String(props.value).trim();
});

function handleClick() {
  if (!props.clickable) return;
  emit('click');
}
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.infoRow {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 4rpx 0;
}
.infoLabel {
  width: 120rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #6b7785;
}
.infoValue {
  flex: 1;
  font-size: 24rpx;
  color: #1f2b3a;
  line-height: 1.4;
}
.infoValue.empty {
  color: #9aa3af;
}
.infoValue.clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.infoRow.clickable .infoValue {
  color: #0f75ff;
}
</style>
