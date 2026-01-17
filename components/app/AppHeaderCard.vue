<template>
  <view class="card headerCard">
    <image class="headerCover" src="/static/logo.png" mode="aspectFill"></image>
    <view class="headerInfo">
      <view class="headerTitleRow">
        <view>
          <view class="headerTitle">{{ title }}</view>
          <view v-if="subTitle" class="headerSub">{{ subTitle }}</view>
        </view>
      </view>
      <view class="headerGrid">
        <view v-for="(row, idx) in infoRows" :key="idx" class="headerItem">
          <text class="label">{{ row.label }}</text>
          <text class="value">{{ row.value }}</text>
        </view>
      </view>
      <view v-if="tags && tags.length" class="headerTags">
        <text v-for="(tag, idx) in tags" :key="idx" class="tagChip">{{ tag }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  subTitle: { type: String, default: '' },
  infoRows: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.headerCard {
  display: flex;
  gap: 16rpx;
}
.headerCover {
  width: 140rpx;
  height: 140rpx;
  border-radius: 16rpx;
  background: #e9edf2;
  flex-shrink: 0;
}
.headerInfo {
  flex: 1;
  min-width: 0;
}
.headerTitleRow {
  display: flex;
  justify-content: space-between;
}
.headerTitle {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2b3a;
}
.headerSub {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6e7a89;
}
.headerGrid {
  margin-top: 10rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx 16rpx;
}
.headerItem {
  display: flex;
  flex-direction: column;
}
.label {
  font-size: 22rpx;
  color: #6b7785;
}
.value {
  font-size: 24rpx;
  color: #1f2b3a;
}
.headerTags {
  margin-top: 10rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}
.tagChip {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  background: #f4f6f8;
  color: #344150;
}
</style>
