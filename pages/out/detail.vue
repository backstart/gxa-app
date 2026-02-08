<template>
  <view class="out pageBg">
    <scroll-view class="content" scroll-y>
      <view v-if="!record" class="empty">未找到外出记录</view>
      <view v-else>
        <view class="card">
          <view class="row-top">
            <text class="title">{{ outTypeText(record.type) }}</text>
            <text :class="['status-tag', record.status]">{{ outStatusText(record.status) }}</text>
          </view>
          <view class="row">申请人：{{ record.applicantName }}（{{ record.deptName }}）</view>
          <view class="row">时间：{{ record.startAt }} 至 {{ record.endAt }}</view>
          <view class="row">去向：{{ record.destination }}</view>
          <view class="row">事由：{{ record.reason }}</view>
          <!-- 休假关联外出可跳转回休假详情 -->
          <view v-if="record.linkedLeaveId" class="row">
            关联休假：
            <text class="link-text" @click="goLeave(record.linkedLeaveId)">{{ record.linkedLeaveId }}</text>
          </view>
          <view v-if="record.linkedLeaveAutoPass" class="row sub-row">审批方式：随休假最终审批自动同步通过</view>
        </view>

        <view class="card">
          <view class="section-title">审批流</view>
          <view v-for="node in record.flowNodes || []" :key="node.role" class="node-item">
            <view class="node-head">
              <text class="node-title">{{ roleText(node.role) }}</text>
              <text :class="['node-status', node.status]">{{ nodeStatusText(node.status) }}</text>
            </view>
            <view class="node-meta">审批人：{{ node.approverName || '—' }}</view>
            <view class="node-meta">时间：{{ node.time || '—' }}</view>
            <view class="node-meta" v-if="node.comment">意见：{{ node.comment }}</view>
          </view>
        </view>

        <view class="card">
          <view class="section-title">操作日志</view>
          <view v-if="!(record.logs || []).length" class="empty-log">暂无日志</view>
          <view v-for="(log, idx) in record.logs || []" :key="`${log.time}-${idx}`" class="log-item">
            <view class="log-top">{{ log.action }} · {{ log.operator || '系统' }}</view>
            <view class="log-meta">{{ log.note }}</view>
            <view class="log-meta">{{ log.time }}</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="record && canApprove" class="bottom-bar">
      <!-- 按需求调整按钮顺序：左侧驳回，右侧同意 -->
      <button class="reject-btn" @click="reject">驳回</button>
      <button class="approve-btn" @click="approve">同意</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { findOutRequestById, getOutRequests, saveOutRequests } from '@/common/database.js';
const record = ref(null);

const currentUser = {
  id: 'u1',
  name: '李警官',
  roles: ['leader_station_dept'],
};

const canApprove = computed(() => {
  // 当前节点角色匹配且状态处于审批中，允许审批
  if (!record.value) return false;
  // 休假关联外出由系统自动同步，不允许人工审批
  if (record.value.linkedLeaveAutoPass) return false;
  if (!['pending', 'approving'].includes(record.value.status)) return false;
  const node = (record.value.flowNodes || []).find((i) => i.role === record.value.currentNodeKey);
  return !!node && currentUser.roles.includes(node.role);
});

function nowText() {
  // 统一生成 YYYY-MM-DD HH:mm 时间文本
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function outTypeText(type) {
  // 外出类型文案映射
  const map = { NORMAL: '普通外出', BUSINESS_TRIP: '出差外出', LEAVE_LINK: '休假关联外出' };
  return map[type] || type;
}

function outStatusText(status) {
  // 外出状态文案映射
  const map = {
    draft: '草稿',
    pending: '待审批',
    approving: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    cancelled: '已撤回',
  };
  return map[status] || status;
}

function roleText(role) {
  // 审批角色文案映射
  const map = {
    leader_station_dept: '派出所本部门领导',
    leader_bureau_political: '分局政工',
    leader_bureau: '分局领导',
  };
  return map[role] || role;
}

function nodeStatusText(status) {
  // 节点状态文案映射
  const map = { pending: '待处理', approved: '已同意', rejected: '已驳回' };
  return map[status] || status;
}

function updateRecord(next) {
  // 更新单条外出记录并写回存储（仅保留一份 list 声明，避免重复变量）
  const list = getOutRequests().map((item) => (item.id === next.id ? next : item));
  saveOutRequests(list);
  record.value = next;
}

function approve() {
  // 同意当前节点并推进审批流
  if (!record.value) return;
  const now = nowText();
  const next = { ...record.value, flowNodes: [...(record.value.flowNodes || [])], logs: [...(record.value.logs || [])] };
  const idx = next.flowNodes.findIndex((node) => node.role === next.currentNodeKey);
  if (idx < 0) return;
  next.flowNodes[idx] = {
    ...next.flowNodes[idx],
    status: 'approved',
    comment: '同意',
    time: now,
    approverId: currentUser.id,
    approverName: currentUser.name,
  };
  next.logs.push({ action: 'APPROVE', note: `节点同意：${next.flowNodes[idx].role}`, operator: currentUser.name, time: now });
  const pendingIdx = next.flowNodes.findIndex((node) => node.status === 'pending');
  if (pendingIdx >= 0) {
    next.currentNodeKey = next.flowNodes[pendingIdx].role;
    next.status = 'approving';
  } else {
    next.currentNodeKey = 'done';
    next.status = 'approved';
  }
  next.updatedAt = now;
  updateRecord(next);
  uni.showToast({ title: '已同意', icon: 'success' });
}

function reject() {
  // 驳回当前节点并结束流程
  if (!record.value) return;
  uni.showModal({
    title: '驳回原因',
    editable: true,
    placeholderText: '请填写驳回原因',
    success: (res) => {
      if (!res.confirm) return;
      if (!res.content) {
        uni.showToast({ title: '请填写驳回原因', icon: 'none' });
        return;
      }
      const now = nowText();
      const next = { ...record.value, flowNodes: [...(record.value.flowNodes || [])], logs: [...(record.value.logs || [])] };
      const idx = next.flowNodes.findIndex((node) => node.role === next.currentNodeKey);
      if (idx < 0) return;
      next.flowNodes[idx] = {
        ...next.flowNodes[idx],
        status: 'rejected',
        comment: res.content,
        time: now,
        approverId: currentUser.id,
        approverName: currentUser.name,
      };
      next.logs.push({ action: 'REJECT', note: `节点驳回：${res.content}`, operator: currentUser.name, time: now });
      next.currentNodeKey = 'done';
      next.status = 'rejected';
      next.updatedAt = now;
      updateRecord(next);
      uni.showToast({ title: '已驳回', icon: 'none' });
    },
  });
}

function goLeave(leaveId) {
  // 跳转到关联休假详情页
  uni.navigateTo({ url: `/pages/leave/detail?id=${leaveId}` });
}

onLoad((query) => {
  // 根据路由参数加载外出详情
  if (query?.id) {
    record.value = findOutRequestById(query.id) || null;
  }
});
</script>

<style lang="scss" scoped>
.out {
  min-height: 100vh;
  padding: 12rpx 24rpx 120rpx;
  box-sizing: border-box;
}
.content {
  height: calc(100vh - 120rpx);
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
.row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 30rpx;
  font-weight: 600;
}
.status-tag {
  font-size: 22rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
}
.status-tag.pending, .status-tag.approving { background: #fff6e6; color: #c88719; }
.status-tag.approved { background: #e6f7ed; color: #1b9d5d; }
.status-tag.rejected, .status-tag.cancelled { background: #ffecec; color: #d64545; }
.row {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #1f2b3a;
  word-break: break-all;
}
.row.sub-row {
  color: #6b7785;
}
.link-text {
  color: #1677ff;
}
.section-title {
  font-size: 26rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}
.node-item {
  padding: 10rpx 0;
  border-bottom: 1px solid #f1f3f5;
}
.node-item:last-child {
  border-bottom: none;
}
.node-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.node-title {
  font-size: 24rpx;
  font-weight: 600;
}
.node-status {
  font-size: 22rpx;
  padding: 2rpx 8rpx;
  border-radius: 999rpx;
}
.node-status.pending { background: #fff6e6; color: #c88719; }
.node-status.approved { background: #e6f7ed; color: #1b9d5d; }
.node-status.rejected { background: #ffecec; color: #d64545; }
.node-meta {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #6b7785;
}
.log-item {
  padding: 8rpx 0;
  border-bottom: 1px solid #f1f3f5;
}
.log-item:last-child {
  border-bottom: none;
}
.log-top {
  font-size: 22rpx;
  color: #1f2b3a;
}
.log-meta {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #6b7785;
}
.empty-log, .empty {
  text-align: center;
  color: #97a1ad;
  padding: 24rpx 0;
}
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
