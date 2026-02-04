<template>
  <view class="duty pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <view class="page-title">换班记录</view>
    <view class="tabs">
      <view v-for="t in tabs" :key="t.value" :class="['tab', activeTab===t.value?'active':'']" @click="activeTab=t.value">{{ t.label }}</view>
    </view>
    <scroll-view class="content" scroll-y>
      <view v-if="filtered.length===0" class="empty">暂无记录</view>
      <view v-else>
        <view class="card" v-for="item in filtered" :key="item.id">
          <view class="row-top">
            <text class="title">{{ item.fromUserName }} ↔ {{ item.toUserName }}</text>
            <text :class="['status', item.status]">{{ statusText(item.status) }}</text>
          </view>
          <view class="row">我方：{{ item.fromDate }} ｜ 对方：{{ item.toDate }}</view>
          <view class="row sub">{{ item.remark || '—' }}</view>
          <view class="actions" v-if="activeTab==='received' && item.status==='pending'">
            <text class="link" @click="agree(item)">同意</text>
            <text class="link danger" @click="reject(item)">拒绝</text>
          </view>
          <view class="actions" v-if="activeTab==='sent' && item.status==='pending'">
            <text class="link" @click="revoke(item)">撤回</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getDutySwaps, saveDutySwaps, getDutyOverrides, saveDutyOverrides } from '@/common/database.js';

const safeTop = ref(0);
const currentUser = { id: 'u1', name: '李警官' };
const list = ref([]);
const activeTab = ref('sent');

const tabs = [
  { label: '我发起', value: 'sent' },
  { label: '我收到', value: 'received' },
  { label: '已完成', value: 'done' },
];

const filtered = computed(() => {
  if (activeTab.value === 'sent') return list.value.filter((i) => i.fromUserId === currentUser.id && i.status !== 'approved');
  if (activeTab.value === 'received') return list.value.filter((i) => i.toUserId === currentUser.id && i.status === 'pending');
  return list.value.filter((i) => i.status === 'approved');
});

function statusText(s) {
  // 换班状态文案映射
  const map = { pending: '待确认', approved: '已同意', rejected: '已拒绝', revoked: '已撤回' };
  return map[s] || s;
}

function agree(item) {
  // 同意换班申请
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const next = list.value.map((i) => (i.id === item.id ? { ...i, status: 'approved', updatedAt: now } : i));
  list.value = next;
  saveDutySwaps(next);
  applySwap(item);
}

function reject(item) {
  // 拒绝换班申请
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const next = list.value.map((i) => (i.id === item.id ? { ...i, status: 'rejected', updatedAt: now } : i));
  list.value = next;
  saveDutySwaps(next);
}

function revoke(item) {
  // 撤回换班申请
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const next = list.value.map((i) => (i.id === item.id ? { ...i, status: 'revoked', updatedAt: now } : i));
  list.value = next;
  saveDutySwaps(next);
}

function applySwap(item) {
  // 应用双方换班覆盖
  const overrides = getDutyOverrides();
  overrides.push({ userId: item.fromUserId, date: item.fromDate, type: 'WORK', reason: 'swap', swapId: item.id });
  overrides.push({ userId: item.fromUserId, date: item.toDate, type: 'DUTY', reason: 'swap', swapId: item.id });
  overrides.push({ userId: item.toUserId, date: item.toDate, type: 'WORK', reason: 'swap', swapId: item.id });
  overrides.push({ userId: item.toUserId, date: item.fromDate, type: 'DUTY', reason: 'swap', swapId: item.id });
  saveDutyOverrides(overrides);
}

onShow(() => {
  // 读取换班列表
  list.value = getDutySwaps();
});

onLoad(() => {
  // 计算顶部安全区
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
});
</script>

<style lang="scss" scoped>
.duty { min-height: 100vh; padding: 12rpx 24rpx 24rpx; box-sizing: border-box; }
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.tabs { display: flex; gap: 12rpx; margin-bottom: 12rpx; }
.tab { padding: 8rpx 16rpx; border-radius: 999rpx; background: #f4f6f8; font-size: 24rpx; }
.tab.active { background: #eaf3ff; color: #1677ff; }
.card { background: #fff; border-radius: 16rpx; padding: 16rpx; margin-bottom: 12rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08); }
.row-top { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 26rpx; font-weight: 600; }
.status { font-size: 22rpx; padding: 4rpx 10rpx; border-radius: 999rpx; }
.status.pending { background: #fff6e6; color: #c88719; }
.status.approved { background: #e6f7ed; color: #1b9d5d; }
.status.rejected, .status.revoked { background: #ffecec; color: #d64545; }
.row { margin-top: 6rpx; font-size: 24rpx; color: #1f2b3a; }
.row.sub { color: #6b7785; }
.actions { margin-top: 10rpx; display: flex; gap: 16rpx; }
.link { color: #1677ff; font-size: 24rpx; }
.link.danger { color: #d64545; }
.empty { text-align: center; color: #97a1ad; padding: 40rpx 0; }
</style>
