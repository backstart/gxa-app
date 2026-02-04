<template>
  <view class="leave pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <view class="page-title">我的休假</view>
    <view class="tabs">
      <view v-for="t in tabs" :key="t.value" :class="['tab', activeTab===t.value?'active':'']" @click="activeTab=t.value">{{ t.label }}</view>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="filtered.length===0" class="empty">暂无记录</view>
      <view v-else class="list">
        <view class="card" v-for="item in filtered" :key="item.id" @click="goDetail(item)">
          <view class="row-top">
            <text class="type">{{ typeText(item.leaveType) }}</text>
            <text :class="['status', item.status]">{{ statusText(item.status) }}</text>
          </view>
          <view class="row">{{ item.startDate }} 至 {{ item.endDate }} · {{ item.daysCount }}天</view>
          <view class="row sub">{{ nodeText(item) }}</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getLeaveRequests } from '@/common/database.js';

const safeTop = ref(0);
const activeTab = ref('all');
const list = ref([]);

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已撤回', value: 'revoked' },
];

const filtered = computed(() => {
  if (activeTab.value === 'all') return list.value;
  if (activeTab.value === 'pending') {
    return list.value.filter((i) => ['pending','approving'].includes(i.status));
  }
  return list.value.filter((i) => i.status === activeTab.value);
});

function statusText(status) {
  const map = {
    pending: '待审批',
    approving: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    revoked: '已撤回',
  };
  return map[status] || status;
}

function typeText(type) {
  const map = { annual: '年假', personal: '事假', sick: '病假', compensatory: '调休' };
  return map[type] || type;
}

function nodeText(item) {
  const roles = ['leader_station_dept','leader_bureau_political','leader_bureau'];
  const labels = ['派出所部门领导', '分局政工', '分局领导'];
  if (item.status === 'approved') return '审批已完成';
  if (item.status === 'rejected') return '已驳回';
  if (item.status === 'revoked') return '已撤回';
  const idx = item.currentStepIndex || 0;
  const role = roles[idx] || '';
  const label = labels[idx] || '';
  return role ? `待${label}审批` : '待审批';
}

function goDetail(item) {
  uni.navigateTo({ url: `/pages/leave/detail?id=${item.id}` });
}

onShow(() => {
  list.value = getLeaveRequests();
});

onLoad(() => {
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
});
</script>

<style lang="scss" scoped>
.leave {
  min-height: 100vh;
  padding: 12rpx 24rpx 24rpx;
  box-sizing: border-box;
}
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.tabs { display: flex; gap: 12rpx; flex-wrap: wrap; margin-bottom: 12rpx; }
.tab { padding: 8rpx 16rpx; border-radius: 999rpx; background: #f4f6f8; font-size: 24rpx; }
.tab.active { background: #eaf3ff; color: #1677ff; }
.content { height: calc(100vh - 180rpx); }
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 12rpx;
}
.row-top { display: flex; justify-content: space-between; align-items: center; }
.type { font-size: 28rpx; font-weight: 600; }
.status { font-size: 22rpx; padding: 4rpx 10rpx; border-radius: 999rpx; }
.status.pending, .status.approving { background: #fff6e6; color: #c88719; }
.status.approved { background: #e6f7ed; color: #1b9d5d; }
.status.rejected, .status.revoked { background: #ffecec; color: #d64545; }
.row { margin-top: 6rpx; font-size: 24rpx; color: #1f2b3a; }
.row.sub { color: #6b7785; }
.empty { text-align: center; color: #97a1ad; padding: 40rpx 0; }
</style>
