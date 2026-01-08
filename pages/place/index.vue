<template>
  <view class="place-index pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">重点场所</view>
        <view class="sub">类型/模块入口与统计概览</view>
      </view>
    </view>

    <view class="card grid">
      <view class="grid-item" v-for="item in entries" :key="item.key" @click="goList(item)">
        <view class="grid-top">
          <text class="emoji">{{ item.emoji }}</text>
          <text class="count">{{ item.count }}</text>
        </view>
        <view class="grid-title">{{ item.title }}</view>
        <view class="grid-sub">{{ item.sub }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getPlaces } from '@/common/database.js';

const entries = ref([]);

function getCount(list, filterType) {
  if (!filterType) return list.length;
  if (filterType === 'COMPLEX') {
    return list.filter((p) => (p.modules || []).length > 0).length;
  }
  return list.filter((p) => p.primaryType === filterType).length;
}

function loadData() {
  const list = getPlaces();
  entries.value = [
    { key: 'all', title: '全部重点场所', sub: '全量清单与筛选', emoji: '📍', filterType: '', count: getCount(list) },
    { key: 'ktv', title: 'KTV/夜场', sub: '娱乐场所重点核查', emoji: '🎤', filterType: 'KTV', count: getCount(list, 'KTV') },
    { key: 'rental', title: '出租屋', sub: '流动人口与登记', emoji: '🏠', filterType: 'RENTAL', count: getCount(list, 'RENTAL') },
    { key: 'netbar', title: '网吧', sub: '实名系统与未成年', emoji: '🕹️', filterType: 'NETBAR', count: getCount(list, 'NETBAR') },
    { key: 'footbath', title: '足浴', sub: '治安风险巡查', emoji: '💆', filterType: 'FOOTBATH', count: getCount(list, 'FOOTBATH') },
    { key: 'chess', title: '棋牌/麻将', sub: '涉赌风险排查', emoji: '🀄', filterType: 'CHESS_CARD', count: getCount(list, 'CHESS_CARD') },
    { key: 'complex', title: '复合业态', sub: '多模块经营场所', emoji: '🏬', filterType: 'COMPLEX', count: getCount(list, 'COMPLEX') },
  ];
}

function goList(item) {
  const url = item.filterType ? `/pages/place/list?filterType=${item.filterType}` : '/pages/place/list';
  uni.navigateTo({ url });
}

onShow(loadData);
</script>

<style lang="scss" scoped>
.place-index {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
}
.header {
  padding: 10rpx 0 20rpx;
  .title {
    font-size: 44rpx;
    font-weight: 700;
    color: #1f2b3a;
  }
  .sub {
    margin-top: 6rpx;
    color: #6e7a89;
    font-size: 26rpx;
  }
}
.card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}
.grid-item {
  background: #f6f8fb;
  border-radius: 16rpx;
  padding: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}
.grid-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}
.emoji {
  font-size: 36rpx;
}
.count {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f75ff;
}
.grid-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2b3a;
}
.grid-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6e7a89;
}
</style>
