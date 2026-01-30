<template>
  <view class="history pageBg">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ top: statusBarHeight + 'px' }">
      <view class="nav-left" @click="goHandover">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
      <view class="nav-title">交接班历史</view>
      <view class="nav-right"></view>
    </view>

    <scroll-view class="content" scroll-y>
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
        <view class="card item" v-for="item in filtered" :key="item.recordId || item.shiftId" @click="goDetail(item)">
          <view class="row-top">
            <view class="time">{{ item.handoverTime || item.createdAt }}</view>
            <text class="arrow">></text>
          </view>
          <view class="row-split">
            <text class="label">本班</text>
            <text class="value">{{ item.currentShift || (item.fromTeam || '') }}</text>
          </view>
          <view class="row-split">
            <text class="label">下一班</text>
            <text class="value">{{ item.nextShift?.name || item.toTeam || '' }}</text>
          </view>
          <view class="row-split">
            <text class="label">事项</text>
            <text class="value">警情 {{ countType(item,'alert') }} / 任务 {{ countType(item,'task') }} / 纠纷 {{ countType(item,'dispute') }} / 派单 {{ countType(item,'order') }}</text>
          </view>
          <view class="row-split">
            <text class="label">已确认</text>
            <text class="value">{{ confirmedText(item) }}</text>
          </view>
          <view class="row-split remark">
            <text class="label">备注</text>
            <text class="value">{{ (item.overallRemark || '').slice(0,60) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getHandworkRecords, getShifts } from '@/common/database.js';

const shifts = ref([]);
const statusBarHeight = ref(0);
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

function confirmedText(item) {
  const total = (item.items || []).length;
  const confirmed = confirmedCount(item);
  if (!total) return '未确认';
  return confirmed === total ? '已确认' : `未确认(${confirmed}/${total})`;
}

function goDetail(item) {
  const id = item.recordId || item.shiftId;
  uni.navigateTo({ url: '/pages/handwork/detail?recordId=' + id });
}

function goHandover() {
  uni.navigateTo({ url: '/pages/handwork/handwork' });
}

onShow(() => {
  const list = getHandworkRecords();
  shifts.value = list.length ? list : getShifts();
});

onLoad(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 0;
});
</script>

<style lang="scss" scoped>
.history {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.status-bar {
  width: 100%;
  background: transparent;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 24rpx;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}

.nav-left {
  width: 140rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
  color: #1f2b3a;
}
.back-icon { font-size: 36rpx; }
.back-text { font-size: 26rpx; }

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.nav-right {
  width: 140rpx;
}

.content {
  flex: 1;
  padding: 12rpx 24rpx 40rpx;
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
  .chip { padding: 8rpx 12rpx; border-radius: 999rpx; background: #f4f6f8; font-size: 24rpx; }
  .chip.active { background: #eaf3ff; color: #0f75ff; }
  .search { background: #f4f6f8; border-radius: 12rpx; padding: 12rpx 14rpx; }
}
.list .item {
  padding: 12rpx;
}
.row-top { display: flex; justify-content: space-between; align-items: center; }
.time { font-size: 30rpx; font-weight: 600; }
.arrow { color: #6b7785; }
.row-split { margin-top: 6rpx; display: flex; justify-content: space-between; gap: 12rpx; }
.label { color: #6b7785; }
.value { color: #1f2b3a; }
.remark .value { color: #6b7785; }
.empty { text-align: center; color: #97a1ad; }
.empty-card { text-align: center; }
</style>
