<template>
  <view class="duty pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <!-- 顶部标题与分段切换（胶囊样式） -->
    <view class="page-title">换班记录</view>
    <view class="tabs">
      <view v-for="t in tabs" :key="t.value" :class="['tab', activeTab===t.value?'active':'']" @click="activeTab=t.value">{{ t.label }}</view>
    </view>

    <!-- 列表区域可滚动，避免底部按钮遮挡 -->
    <scroll-view class="content" scroll-y>
      <view v-if="filtered.length===0" class="empty">暂无记录</view>
      <view v-else>
        <view class="card" v-for="item in filtered" :key="item.id">
          <view class="row-top">
            <text class="title">{{ item.fromDate }} ↔ {{ item.toDate }}</text>
            <text :class="['status', item.status]">{{ statusText(item) }}</text>
          </view>
          <view class="row">对方人员：{{ item.toUserName }}</view>
          <view class="row">我方日期：{{ item.fromDate }}（{{ typeText(item.fromType) }}）</view>
          <view class="row">对方日期：{{ item.toDate }}（{{ typeText(item.toType) }}）</view>
          <view class="row sub">审批进度：{{ progressText(item) }}</view>
          <view class="row sub">创建时间：{{ item.createdAt }}</view>

          <!-- 审批操作：只有当前用户具备对应领导角色时显示 -->
          <view class="actions" v-if="activeTab==='received' && canApprove(item)">
            <text class="link" @click="approve(item)">同意</text>
            <text class="link danger" @click="reject(item)">拒绝</text>
          </view>

          <!-- 发起人撤回：仅待审批时可撤回 -->
          <view class="actions" v-if="activeTab==='sent' && item.status==='pending'">
            <text class="link" @click="revoke(item)">撤回</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部固定按钮：发起换班申请 -->
    <view class="bottom-actions">
      <button class="action-btn primary" @click="goApply">发起换班</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getDutySwaps, saveDutySwaps, getDutyOverrides, saveDutyOverrides } from '@/common/database.js';

const safeTop = ref(0);
// 当前用户信息（mock），后续可替换为真实登录信息
const currentUser = { id: 'u1', name: '李警官', roles: ['leader_station_dept', 'leader_bureau'] };

const list = ref([]);
const activeTab = ref('sent');

const tabs = [
  { label: '我发起', value: 'sent' },
  { label: '我收到', value: 'received' },
  { label: '已完成', value: 'done' },
];

const filtered = computed(() => {
  if (activeTab.value === 'sent') {
    return list.value.filter((i) => i.fromUserId === currentUser.id && i.status !== 'approved' && i.status !== 'rejected' && i.status !== 'canceled');
  }
  if (activeTab.value === 'received') {
    return list.value.filter((i) => canApprove(i));
  }
  return list.value.filter((i) => ['approved', 'rejected', 'canceled'].includes(i.status));
});

function typeText(type) {
  // 状态类型转中文
  const map = { duty: '值班', work: '工作', rest: '休息' };
  return map[type] || type;
}

function statusText(item) {
  // 顶部状态标签
  if (item.status === 'approved') return '已同意';
  if (item.status === 'rejected') return '已拒绝';
  if (item.status === 'canceled') return '已撤回';
  return '待审批';
}

function progressText(item) {
  // 审批进度文案
  if (item.status === 'approved') return '双方领导已同意';
  if (item.status === 'rejected') return '已拒绝';
  if (item.approvals.myLeader.status !== 'approved') return '本班领导待审';
  if (item.approvals.otherLeader.status !== 'approved') return '对方领导待审';
  return '审批中';
}

function canApprove(item) {
  // 判断当前用户是否是待审批节点的领导
  if (!['pending', 'approving'].includes(item.status)) return false;
  if (item.approvals.myLeader.status === 'pending' && currentUser.roles.includes(item.approvals.myLeader.role)) return true;
  if (item.approvals.otherLeader.status === 'pending' && currentUser.roles.includes(item.approvals.otherLeader.role)) return true;
  return false;
}

function approve(item) {
  // 审批同意：更新对应节点
  uni.showModal({
    title: '审批意见',
    editable: true,
    placeholderText: '可填写意见',
    success: (res) => {
      if (!res.confirm) return;
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const next = list.value.map((i) => {
        if (i.id !== item.id) return i;
        const approvals = { ...i.approvals };
        if (approvals.myLeader.status === 'pending' && currentUser.roles.includes(approvals.myLeader.role)) {
          approvals.myLeader = { ...approvals.myLeader, status: 'approved', time: now, remark: res.content || '' };
        } else if (approvals.otherLeader.status === 'pending' && currentUser.roles.includes(approvals.otherLeader.role)) {
          approvals.otherLeader = { ...approvals.otherLeader, status: 'approved', time: now, remark: res.content || '' };
        }
        let status = i.status;
        if (approvals.myLeader.status === 'approved' && approvals.otherLeader.status === 'approved') {
          status = 'approved';
        } else {
          status = 'approving';
        }
        const updated = { ...i, approvals, status, updatedAt: now };
        if (status === 'approved') applySwap(updated);
        return updated;
      });
      list.value = next;
      saveDutySwaps(next);
      uni.showToast({ title: '已同意', icon: 'success' });
    },
  });
}

function reject(item) {
  // 审批拒绝：任一节点拒绝即结束
  uni.showModal({
    title: '拒绝原因',
    editable: true,
    placeholderText: '可填写原因',
    success: (res) => {
      if (!res.confirm) return;
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const next = list.value.map((i) => {
        if (i.id !== item.id) return i;
        const approvals = { ...i.approvals };
        if (approvals.myLeader.status === 'pending' && currentUser.roles.includes(approvals.myLeader.role)) {
          approvals.myLeader = { ...approvals.myLeader, status: 'rejected', time: now, remark: res.content || '' };
        } else if (approvals.otherLeader.status === 'pending' && currentUser.roles.includes(approvals.otherLeader.role)) {
          approvals.otherLeader = { ...approvals.otherLeader, status: 'rejected', time: now, remark: res.content || '' };
        }
        return { ...i, approvals, status: 'rejected', updatedAt: now };
      });
      list.value = next;
      saveDutySwaps(next);
      uni.showToast({ title: '已拒绝', icon: 'none' });
    },
  });
}

function revoke(item) {
  // 发起人撤回申请
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const next = list.value.map((i) => (i.id === item.id ? { ...i, status: 'canceled', updatedAt: now } : i));
  list.value = next;
  saveDutySwaps(next);
  uni.showToast({ title: '已撤回', icon: 'none' });
}

function applySwap(item) {
  // 审批通过后写入覆盖表（生效换班）
  const overrides = getDutyOverrides();
  overrides.push({ userId: item.fromUserId, date: item.fromDate, type: 'WORK', reason: 'swap', swapId: item.id });
  overrides.push({ userId: item.fromUserId, date: item.toDate, type: 'DUTY', reason: 'swap', swapId: item.id });
  overrides.push({ userId: item.toUserId, date: item.toDate, type: 'WORK', reason: 'swap', swapId: item.id });
  overrides.push({ userId: item.toUserId, date: item.fromDate, type: 'DUTY', reason: 'swap', swapId: item.id });
  saveDutyOverrides(overrides);
}

function goApply() {
  // 跳转到发起换班页面
  uni.navigateTo({ url: '/pages/duty/swapApply' });
}

onShow(() => {
  // 读取换班记录
  list.value = getDutySwaps();
});

onLoad(() => {
  // 计算安全区
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
});
</script>

<style lang="scss" scoped>
.duty {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  padding: calc(12rpx + env(safe-area-inset-top)) 24rpx calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.tab { padding: 8rpx 16rpx; border-radius: 999rpx; background: #f4f6f8; font-size: 24rpx; }
.tab.active { background: #eaf3ff; color: #1677ff; }
.content { flex: 1; width: 100%; }
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
.row-top { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 26rpx; font-weight: 600; }
.status { font-size: 22rpx; padding: 4rpx 10rpx; border-radius: 999rpx; background: #fff6e6; color: #c88719; }
.status.approved { background: #e6f7ed; color: #1b9d5d; }
.status.rejected, .status.canceled { background: #ffecec; color: #d64545; }
.row { margin-top: 6rpx; font-size: 24rpx; color: #1f2b3a; }
.row.sub { color: #6b7785; }
.actions { margin-top: 10rpx; display: flex; gap: 16rpx; }
.link { color: #1677ff; font-size: 24rpx; }
.link.danger { color: #d64545; }
.link:active { opacity: 0.6; }
.empty { text-align: center; color: #97a1ad; padding: 40rpx 0; }
.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(8px);
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.action-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  background: #1677ff;
  color: #fff;
}
</style>
