<template>
  <view class="leave pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <scroll-view class="content" scroll-y>
      <view v-if="!record" class="empty">未找到休假记录</view>
      <view v-else>
        <view class="card">
          <view class="row-top">
            <text class="title">{{ typeText(record.leaveType) }}</text>
            <text :class="['status', record.status]">{{ statusText(record.status) }}</text>
          </view>
          <view class="row">申请人：{{ record.applicantName }}（{{ record.deptName }}）</view>
          <view class="row">日期：{{ record.startDate }} 至 {{ record.endDate }} · {{ record.daysCount }}天</view>
          <view class="row">事由：{{ record.reason }}</view>
        </view>

        <view class="card">
          <view class="section-title">审批进度</view>
          <view v-for="(s, idx) in record.steps" :key="s.role" class="step">
            <view class="step-head">
              <text class="step-title">{{ stepLabel(s.role) }}</text>
              <text :class="['step-status', stepStatusClass(s.status, idx)]">{{ stepStatusText(s.status, idx) }}</text>
            </view>
            <view class="step-meta">审批人：{{ s.approverName || '—' }}</view>
            <view class="step-meta">时间：{{ formatTime(s.time) }}</view>
            <view class="step-meta" v-if="s.comment">意见：{{ s.comment }}</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="record && canApprove" class="bottom-bar">
      <!-- 按需求：休假审批仅保留“同意/驳回”两个审批动作 -->
      <button class="approve-btn" @click="approve">同意</button>
      <button class="reject-btn" @click="reject">驳回</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getLeaveRequests, saveLeaveRequests, syncLinkedOutOnLeaveApproved } from '@/common/database.js';

const safeTop = ref(0);
const record = ref(null);
const currentUser = {
  id: 'u1',
  name: '李警官',
  deptName: '桂南派出所',
  roles: ['leader_station_dept'],
};

const canApprove = computed(() => {
  if (!record.value) return false;
  if (!['pending','approving'].includes(record.value.status)) return false;
  const idx = record.value.currentStepIndex || 0;
  const step = record.value.steps && record.value.steps[idx];
  return step && currentUser.roles.includes(step.role);
});

function typeText(type) {
  // 休假类型文案映射
  const map = { annual: '年假', personal: '事假', sick: '病假', compensatory: '调休' };
  return map[type] || type;
}

function statusText(status) {
  // 状态文案映射
  const map = {
    pending: '待审批',
    approving: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    revoked: '已撤回',
  };
  return map[status] || status;
}

function stepLabel(role) {
  // 审批角色文案映射
  const map = {
    leader_station_dept: '派出所部门领导',
    leader_bureau_political: '分局政工',
    leader_bureau: '分局领导',
  };
  return map[role] || role;
}

function stepStatusText(status, idx) {
  // 构建节点状态文案
  if (status === 'approved') return '已同意';
  if (status === 'rejected') return '已驳回';
  if (record.value && idx === record.value.currentStepIndex && ['pending','approving'].includes(record.value.status)) return '待审批';
  return '待处理';
}

function stepStatusClass(status, idx) {
  // 构建节点状态样式
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (record.value && idx === record.value.currentStepIndex && ['pending','approving'].includes(record.value.status)) return 'pending';
  return 'pending';
}

function formatTime(val) {
  // 格式化时间文本
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) {
    return String(val).replace('T', ' ').replace('Z', '').replace('.000', '');
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function updateRecord(next) {
  // 持久化更新后的记录
  const list = getLeaveRequests().map((i) => (i.id === next.id ? next : i));
  saveLeaveRequests(list);
  record.value = next;
}

function approve() {
  // 同意当前节点
  if (!record.value) return;
  uni.showModal({
    title: '审批意见',
    editable: true,
    placeholderText: '可填写意见',
    success: (res) => {
      if (!res.confirm) return;
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const next = { ...record.value };
      const idx = next.currentStepIndex || 0;
      next.steps = next.steps.map((s, i) => (i === idx ? { ...s, status: 'approved', comment: res.content || '', time: now } : s));
      if (idx >= next.steps.length - 1) {
        next.status = 'approved';
      } else {
        next.currentStepIndex = idx + 1;
        next.status = 'approving';
      }
      next.updatedAt = now;
      updateRecord(next);
      // 仅在休假最终通过时，联动将关联外出自动审批通过
      if (next.status === 'approved') {
        syncLinkedOutOnLeaveApproved(next.id);
      }
      uni.showToast({ title: '已同意', icon: 'success' });
    },
  });
}

function reject() {
  // 驳回当前节点
  if (!record.value) return;
  uni.showModal({
    title: '驳回原因',
    editable: true,
    placeholderText: '请填写驳回原因',
    success: (res) => {
      if (!res.confirm) return;
      if (!res.content) {
        uni.showToast({ title: '驳回原因必填', icon: 'none' });
        return;
      }
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const next = { ...record.value };
      const idx = next.currentStepIndex || 0;
      next.steps = next.steps.map((s, i) => (i === idx ? { ...s, status: 'rejected', comment: res.content || '', time: now } : s));
      next.status = 'rejected';
      next.updatedAt = now;
      updateRecord(next);
      uni.showToast({ title: '已驳回', icon: 'none' });
    },
  });
}

onLoad((query) => {
  // 加载记录并计算安全区
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
  const id = query?.id;
  if (id) {
    const list = getLeaveRequests();
    record.value = list.find((i) => i.id === id) || null;
  }
});
</script>

<style lang="scss" scoped>
.leave {
  min-height: 100vh;
  padding: 12rpx 24rpx 120rpx;
  box-sizing: border-box;
}
.content { height: calc(100vh - 120rpx); }
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 12rpx;
}
.row-top { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 30rpx; font-weight: 600; }
.status { font-size: 22rpx; padding: 4rpx 10rpx; border-radius: 999rpx; }
.status.pending, .status.approving { background: #fff6e6; color: #c88719; }
.status.approved { background: #e6f7ed; color: #1b9d5d; }
.status.rejected, .status.revoked { background: #ffecec; color: #d64545; }
.row { margin-top: 6rpx; font-size: 24rpx; color: #1f2b3a; }
.section-title { font-size: 26rpx; font-weight: 600; margin-bottom: 10rpx; }
.step { padding: 10rpx 0; border-bottom: 1px solid #f1f3f5; }
.step:last-child { border-bottom: none; }
.step-head { display: flex; justify-content: space-between; align-items: center; }
.step-title { font-size: 24rpx; font-weight: 600; }
.step-status { font-size: 22rpx; padding: 2rpx 8rpx; border-radius: 999rpx; }
.step-status.pending { background: #fff6e6; color: #c88719; }
.step-status.approved { background: #e6f7ed; color: #1b9d5d; }
.step-status.rejected { background: #ffecec; color: #d64545; }
.step-meta { margin-top: 4rpx; font-size: 22rpx; color: #6b7785; }
.empty { text-align: center; color: #97a1ad; padding: 40rpx 0; }
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 12rpx;
  background: #fff;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.ghost-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  background: #fff;
  border: 1px solid #d0d6de;
}
.approve-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  background: #2ecc71;
  color: #fff;
}
.reject-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  background: #ff6b6b;
  color: #fff;
}
</style>
