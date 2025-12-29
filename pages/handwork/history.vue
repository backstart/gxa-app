<template>
  <view class="history pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">交接班历史</view>
      </view>
      <button size="mini" class="ghost-btn" @click="goHandover">返回交接班</button>
    </view>

    <view class="card filters">
      <view class="chips">
        <view v-for="t in timeRanges" :key="t.value" :class="['chip', filters.timeRange === t.value ? 'active':'']" @click="filters.timeRange = t.value">{{ t.label }}</view>
      </view>
      <input class="search" v-model="filters.keyword" placeholder="搜索备注/交接人/事项" />
    </view>

    <view v-if="filtered.length === 0" class="card empty-card">
      <view class="empty">暂无交接记录</view>
      <button size="mini" type="primary" @click="goHandover">去创建交接</button>
    </view>

    <view v-else class="list">
      <view class="card item" v-for="item in filtered" :key="item.shiftId" @click="goDetail(item)">
        <view class="row-top">
          <view class="time">{{ item.handoverTime || item.createdAt }}</view>
          <text class="arrow">></text>
        </view>
        <view class="row">
          <text class="label">本班</text>
          <text class="value">{{ item.currentShift || (item.fromTeam || '') }}</text>
        </view>
        <view class="row">
          <text class="label">下一班</text>
          <text class="value">{{ item.nextShift?.name || item.toTeam || '' }}</text>
        </view>
        <view class="row">
          <text class="label">事项</text>
          <text class="value">共 {{ item.items.length }} 条，警情 {{ countType(item,'alert') }} / 任务 {{ countType(item,'task') }} / 纠纷 {{ countType(item,'dispute') }} / 派单 {{ countType(item,'order') }}</text>
        </view>
        <view class="row">
          <text class="label">已确认</text>
          <text class="value">{{ confirmedCount(item) }} / {{ item.items.length }}</text>
        </view>
        <view class="row remark">
          <text class="label">备注</text>
          <text class="value">{{ (item.overallRemark || '').slice(0,40) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getShifts } from '@/common/database.js';

const shifts = ref([]);
const filters = ref({
  timeRange: 'all',
  keyword: '',
});

const timeRanges = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: 'all', label: '全部' },
];

const filtered = computed(() => {
  let list = [...shifts.value];
  const now = Date.now();
  if (filters.value.timeRange === '7d') {
    const from = now - 7 * 24 * 3600 * 1000;
    list = list.filter((i) => new Date(i.handoverTime || i.createdAt).getTime() >= from);
  } else if (filters.value.timeRange === '30d') {
    const from = now - 30 * 24 * 3600 * 1000;
    list = list.filter((i) => new Date(i.handoverTime || i.createdAt).getTime() >= from);
  }
  if (filters.value.keyword) {
    const kw = filters.value.keyword;
    list = list.filter((i) =>
      (i.overallRemark || '').includes(kw) ||
      (i.currentShift || '').includes(kw) ||
      (i.nextShift?.name || '').includes(kw) ||
      i.items.some((it) => (it.title || '').includes(kw))
    );
  }
  return list.sort((a,b) => new Date(b.handoverTime || b.createdAt) - new Date(a.handoverTime || a.createdAt));
});

function countType(item, type) {
  return (item.items || []).filter((i) => i.type === type).length;
}

function confirmedCount(item) {
  return (item.items || []).filter((i) => i.confirmed).length;
}

function goDetail(item) {
  uni.navigateTo({ url: '/pages/handwork/detail?shiftId=' + item.shiftId });
}

function goHandover() {
  uni.navigateTo({ url: '/pages/handwork/handwork' });
}

onShow(() => {
  shifts.value = getShifts();
});
</script>

<style lang="scss" scoped>
.history {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
}
.header {
  padding: 10rpx 0 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title { font-size: 44rpx; font-weight: 700; }
  .ghost-btn { border: 1px solid #d0d6de; background: #fff; color: #1f2b3a; padding: 10rpx 18rpx; border-radius: 12rpx; }
}
.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
}
.filters {
  .chips { display: flex; gap: 10rpx; margin-bottom: 8rpx; }
  .chip { padding: 10rpx 14rpx; border-radius: 12rpx; background: #f4f6f8; }
  .chip.active { background: #0f75ff; color: #fff; }
  .search { background: #f4f6f8; border-radius: 12rpx; padding: 12rpx 14rpx; }
}
.list .item {
  padding: 12rpx;
}
.row-top { display: flex; justify-content: space-between; align-items: center; }
.time { font-size: 30rpx; font-weight: 600; }
.arrow { color: #6b7785; }
.row { margin-top: 6rpx; display: flex; justify-content: space-between; }
.label { color: #6b7785; }
.value { color: #1f2b3a; }
.remark .value { color: #6b7785; }
.empty { text-align: center; color: #97a1ad; }
.empty-card { text-align: center; }
</style>
