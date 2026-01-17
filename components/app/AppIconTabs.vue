<template>
  <view>
    <view v-if="!isScrollable" class="iconTabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['iconTabItem', activeKey === tab.key ? 'iconTabActive' : '']"
        @click="selectTab(tab.key)"
      >
        <text class="iconTabIcon">{{ tab.icon }}</text>
        <text class="iconTabLabel">{{ tab.label }}</text>
        <text v-if="tab.badge" class="iconTabBadge">{{ tab.badge }}</text>
      </view>
    </view>
    <scroll-view v-else class="iconTabsScroll" scroll-x>
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['iconTabItemFixed', activeKey === tab.key ? 'iconTabActive' : '']"
        @click="selectTab(tab.key)"
      >
        <text class="iconTabIcon">{{ tab.icon }}</text>
        <text class="iconTabLabel">{{ tab.label }}</text>
        <text v-if="tab.badge" class="iconTabBadge">{{ tab.badge }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tabs: { type: Array, default: () => [] },
  activeKey: { type: String, default: '' },
});

const emit = defineEmits(['update:activeKey', 'change']);

const isScrollable = computed(() => props.tabs.length > 4);

function selectTab(key) {
  emit('update:activeKey', key);
  emit('change', key);
}
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.iconTabs {
  display: flex;
  gap: 12rpx;
  padding: 6rpx 6rpx 12rpx;
}
.iconTabsScroll {
  padding: 6rpx 6rpx 12rpx;
  white-space: nowrap;
}
.iconTabItem,
.iconTabItemFixed {
  background: #f6f8fb;
  border-radius: 16rpx;
  padding: 12rpx;
  text-align: center;
  position: relative;
}
.iconTabItem {
  flex: 1;
  min-width: 0;
}
.iconTabItemFixed {
  display: inline-block;
  width: 180rpx;
  margin-right: 12rpx;
}
.iconTabActive {
  background: #eaf3ff;
  color: #0f75ff;
}
.iconTabIcon {
  font-size: 32rpx;
  display: block;
}
.iconTabLabel {
  font-size: 24rpx;
  margin-top: 4rpx;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.iconTabBadge {
  position: absolute;
  top: -6rpx;
  right: 18rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  border-radius: 12rpx;
  padding: 2rpx 8rpx;
}
</style>
