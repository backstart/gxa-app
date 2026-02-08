<template>
  <view class="out pageBg">
    <view class="page-title">外出待审批</view>
    <scroll-view class="content" scroll-y>
      <view v-if="list.length === 0" class="empty">暂无待审批</view>
      <view v-else>
        <view v-for="item in list" :key="item.id" class="card">
          <view class="row-top" @click="goDetail(item.id)">
            <text class="type-tag">{{ outTypeText(item.type) }}</text>
            <text class="status-tag">待审批</text>
          </view>
          <view class="row">{{ item.applicantName }} · {{ item.deptName }}</view>
          <view class="row">{{ item.startAt }} 至 {{ item.endAt }}</view>
          <view class="row sub">{{ item.destination }} ｜ {{ item.reason }}</view>
          <view class="actions">
            <text class="link-btn" @click="goDetail(item.id)">查看详情</text>
            <text class="link-btn approve" @click="approve(item)">同意</text>
            <text class="link-btn reject" @click="reject(item)">驳回</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getOutRequests, saveOutRequests } from '@/common/database.js';
const list = ref([]);

const currentUser = {
  id: 'u1',
  name: '李警官',
  roles: ['leader_station_dept'],
};

function nowText() {
  // 统一生成 YYYY-MM-DD HH:mm 时间文本
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function outTypeText(type) {
  // 外出类型文案映射
  const map = { NORMAL: '普通外出', BUSINESS_TRIP: '出差外出', LEAVE_LINK: '休假关联' };
  return map[type] || type;
}

function getCurrentNode(item) {
  // 根据 currentNodeKey 找到当前待审批节点
  const idx = (item.flowNodes || []).findIndex((node) => node.role === item.currentNodeKey);
  return { idx, node: idx >= 0 ? item.flowNodes[idx] : null };
}

function loadList() {
  // 按当前角色筛选“轮到我审批”的外出单
  const all = getOutRequests();
  list.value = all.filter((item) => {
    // 休假关联自动通过单不进入人工审批列表
    if (item.linkedLeaveAutoPass) return false;
    if (!['pending', 'approving'].includes(item.status)) return false;
    const { node } = getCurrentNode(item);
    if (!node) return false;
    return currentUser.roles.includes(node.role);
  });
}

function goDetail(id) {
  // 进入详情页执行完整审批操作
  uni.navigateTo({ url: `/pages/out/detail?id=${id}` });
}

function updateRecord(nextRecord) {
  // 持久化更新记录并刷新当前待审列表
  const listAll = getOutRequests().map((item) => (item.id === nextRecord.id ? nextRecord : item));
  saveOutRequests(listAll);
  loadList();
}

function approve(item) {
  // 当前节点同意并推进到下一节点
  const now = nowText();
  const next = { ...item, flowNodes: [...(item.flowNodes || [])], logs: [...(item.logs || [])] };
  const { idx } = getCurrentNode(next);
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

function reject(item) {
  // 当前节点驳回并结束流程
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
      const next = { ...item, flowNodes: [...(item.flowNodes || [])], logs: [...(item.logs || [])] };
      const { idx } = getCurrentNode(next);
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

onShow(() => {
  // 页面显示时刷新待审批数据
  loadList();
});

</script>

<style lang="scss" scoped>
.out {
  min-height: 100vh;
  padding: 12rpx 24rpx 24rpx;
  box-sizing: border-box;
}
.page-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
  margin-bottom: 12rpx;
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
.type-tag {
  font-size: 22rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  color: #1677ff;
  background: #eaf3ff;
}
.status-tag {
  font-size: 22rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  color: #c88719;
  background: #fff6e6;
}
.row {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #1f2b3a;
}
.row.sub {
  color: #6b7785;
}
.actions {
  margin-top: 10rpx;
  display: flex;
  gap: 18rpx;
}
.link-btn {
  color: #1677ff;
  font-size: 24rpx;
}
.link-btn.approve {
  color: #1b9d5d;
}
.link-btn.reject {
  color: #d64545;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 40rpx 0;
}
</style>
