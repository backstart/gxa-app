<template>
  <view class="tag-container">
    <text
      v-for="(tagItem, index) in normalizedTags"
      :key="index"
      :class="['cellView', tagItem.type || 'normal']"
    >
      {{ tagItem.tag }}
    </text>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  taglist: {
    type: Array,
    default() {
      return [{ tag: '文字1' }, { tag: '文字2' }, { tag: '文字3' }];
    },
  },
});

const normalizedTags = computed(() =>
  (props.taglist || []).map((item) => {
    if (typeof item === 'string') return { tag: item, type: 'normal' };
    return { tag: item.tag || '', type: item.type || 'normal' };
  }).filter((item) => item.tag)
);
</script>

<style lang="scss" scoped>
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  width: 100%;
}

.cellView {
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  line-height: 1.4;
  color: #344150;
  background: #f4f6f8;
}

.cellView.key {
  color: #0f75ff;
  background: #eaf3ff;
}

.cellView.danger {
  color: #d64545;
  background: #ffecec;
}
</style>
