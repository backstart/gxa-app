<template>
  <view class="out pageBg">
    <view class="page-title">外出待审批</view>
    <scroll-view class="content" scroll-y>
      <view v-if="list.length === 0" class="empty">暂无待审批</view>
      <view v-else>
        <!-- 列表页不再直接审批，整卡点击进入详情页处理审批 -->
        <view
          v-for="item in list"
          :key="item.id"
          class="card clickable-card"
          hover-class="card-hover"
          @click="goDetail(item.id)"
        >
          <view class="row-top">
            <text class="type-tag">{{ outTypeText(item.type) }}</text>
            <text class="status-tag">待审批</text>
          </view>
          <view class="row">{{ item.applicantName }} · {{ item.deptName }}</view>
          <view class="row">{{ item.startAt }} 至 {{ item.endAt }}</view>
          <view class="row sub">{{ item.destination }} ｜ {{ item.reason }}</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getOutRequests } from '@/common/database.js';
const list = ref([]);

const currentUser = {
  id: 'u1',
  name: '李警官',
  roles: ['leader_station_dept'],
};

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
  // 列表页只负责跳详情，审批动作统一在详情页完成
  uni.navigateTo({ url: `/pages/out/detail?id=${id}` });
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
  box-sizing: border-box;
}
.clickable-card {
  // 点击整卡进入详情，避免只点文字区域才可跳转
  cursor: pointer;
}
.card-hover {
  // 轻微按压态，增强移动端可点击反馈
  opacity: 0.86;
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
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row.sub {
  color: #6b7785;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 40rpx 0;
}
</style>
