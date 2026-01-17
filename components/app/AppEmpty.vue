<template>
  <view class="appEmpty">
    <image class="emptyLogo" src="/static/logo.png" mode="aspectFill"></image>
    <view class="emptyText">{{ text }}</view>
  </view>
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无数据' },
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.appEmpty {
  padding: 24rpx 0;
  text-align: center;
  color: #97a1ad;
}
.emptyLogo {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  margin-bottom: 8rpx;
}
.emptyText {
  font-size: 24rpx;
}
</style>
