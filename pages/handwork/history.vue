<template>
  <view class="history pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <scroll-view class="content" scroll-y>
      <view class="card filters">
        <view class="chips">
          <view v-for="t in timeRanges" :key="t.value" :class="['chip', filters.timeRange === t.value ? 'active':'']" @click="filters.timeRange = t.value">{{ t.label }}</view>
        </view>
        <view class="searchWrap">
          <input class="search" v-model="filters.keyword" placeholder="搜索备注/交接人/事项" />
        </view>
      </view>

      <view v-if="filtered.length === 0" class="card empty-card">
        <view class="empty">暂无交接记录</view>
      </view>

      <view v-else class="list">
        <view class="card item" v-for="item in filtered" :key="item._id" @click="goDetail(item)">
          <view class="row-top">
            <view class="time">{{ item.handoverTime || item.createdAt }}</view>
            <view class="row-top-right">
              <text :class="['status-tag', statusClass(item)]">{{ statusText(item) }}</text>
              <text class="arrow">></text>
            </view>
          </view>
          <view class="row-two-col">
            <view class="col">
              <text class="label">本班</text>
              <text class="value">{{ item.currentShift || (item.fromTeam || '') }}</text>
            </view>
            <view class="col">
              <text class="label">下一班</text>
              <text class="value">{{ item.nextShift?.name || item.toTeam || '' }}</text>
            </view>
          </view>
          <view class="row-stats">
            <text class="value">事项：警情 {{ countType(item,'alert') }} / 任务 {{ countType(item,'task') }} / 纠纷 {{ countType(item,'dispute') }} / 派单 {{ countType(item,'order') }} · 共 {{ (item.items || []).length }}</text>
            <text class="value confirm">确认：{{ confirmedCount(item) }}/{{ (item.items || []).length }}</text>
          </view>
          <view v-if="item.overallRemark" class="row-remark">
            <text class="label">备注</text>
            <text class="remark clamp">{{ item.overallRemark }}</text>
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
const safeTop = ref(0);
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
  let list = [...shifts.value].map((i) => ({ ...i, _id: getRecordId(i) }));
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
      (i.items || []).some((it) => (it.title || '').includes(kw))
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

function statusText(item) {
  const total = (item.items || []).length;
  const confirmed = confirmedCount(item);
  if (!total) return '待补全';
  return confirmed === total ? '已确认' : '未完成';
}

function statusClass(item) {
  const total = (item.items || []).length;
  const confirmed = confirmedCount(item);
  if (!total) return 'pending';
  return confirmed === total ? 'done' : 'doing';
}

function getRecordId(item) {
  return item.recordId || item.shiftId || item.handoverId || [
    item.handoverTime || item.createdAt || '',
    item.currentShift || item.fromTeam || '',
    item.nextShift?.name || item.toTeam || '',
  ].join('_');
}

function goDetail(item) {
  uni.navigateTo({ url: '/pages/handwork/detail?id=' + item._id });
}

onShow(() => {
  const list = getHandworkRecords();
  shifts.value = list.length ? list : getShifts();
});

onLoad(() => {
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset);
});
</script>

<style lang="scss" scoped>
.history {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

.content {
  flex: 1;
  padding: 12rpx 24rpx 40rpx;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
  width: 100%;
  box-sizing: border-box;
}
.filters {
  box-sizing: border-box;
  .chips { display: flex; gap: 10rpx; margin-bottom: 8rpx; flex-wrap: wrap; }
  .chip { padding: 8rpx 12rpx; border-radius: 999rpx; background: #f4f6f8; font-size: 24rpx; }
  .chip.active { background: #eaf3ff; color: #0f75ff; }
  .searchWrap { width: 100%; box-sizing: border-box; }
  .search { width: 100%; background: #f4f6f8; border-radius: 12rpx; padding: 12rpx 14rpx; box-sizing: border-box; }
}
.list .item {
  padding: 16rpx;
  box-sizing: border-box;
}
.row-top { display: flex; justify-content: space-between; align-items: center; gap: 12rpx; }
.row-top-right { display: flex; align-items: center; gap: 8rpx; flex: 0 0 auto; }
.time { font-size: 30rpx; font-weight: 600; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arrow { color: #6b7785; width: 24rpx; text-align: right; flex: 0 0 24rpx; }
.status-tag { padding: 6rpx 12rpx; border-radius: 999rpx; font-size: 22rpx; }
.status-tag.done { background: #e6f7ed; color: #1b9d5d; }
.status-tag.doing { background: #fff6e6; color: #c88719; }
.status-tag.pending { background: #f1f3f5; color: #6b7785; }
.row-two-col { margin-top: 10rpx; display: flex; gap: 12rpx; min-width: 0; width: 100%; box-sizing: border-box; }
.col { flex: 1 1 0; min-width: 0; display: flex; align-items: center; gap: 8rpx; }
.row-stats { margin-top: 10rpx; display: flex; justify-content: space-between; align-items: center; gap: 12rpx; min-width: 0; width: 100%; box-sizing: border-box; }
.label { color: #6b7785; flex: 0 0 auto; white-space: nowrap; }
.value { color: #1f2b3a; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.confirm { flex: 0 0 auto; color: #6b7785; }
.row-remark { margin-top: 10rpx; display: flex; gap: 8rpx; min-width: 0; width: 100%; box-sizing: border-box; }
.remark { color: #6b7785; flex: 1; min-width: 0; }
.clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}
.empty { text-align: center; color: #97a1ad; }
.empty-card { text-align: center; }
</style>
