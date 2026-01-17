<template>
  <view class="listItem" @click="$emit('click')">
    <image v-if="showLeftImage" class="listItemImage" :src="leftImage" mode="aspectFill"></image>
    <view class="listItemContent">
      <view class="listItemTitle">
        <text>{{ title }}</text>
        <text v-if="tag" class="listTag">{{ tag }}</text>
        <slot name="titleExtra"></slot>
      </view>
      <view v-if="subTitle" class="listItemMeta">{{ subTitle }}</view>
      <view v-if="meta" class="listItemMeta">{{ meta }}</view>
      <slot></slot>
    </view>
    <view v-if="rightText" class="listItemRight">{{ rightText }}</view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subTitle: { type: String, default: '' },
  meta: { type: String, default: '' },
  rightText: { type: String, default: '' },
  leftImage: { type: String, default: '/static/logo.png' },
  showLeftImage: { type: Boolean, default: true },
  tag: { type: String, default: '' },
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.listTag {
  margin-left: 8rpx;
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
  background: #eaf3ff;
  color: #0f75ff;
}
.listItemRight {
  font-size: 24rpx;
  color: #6e7a89;
}
</style>
