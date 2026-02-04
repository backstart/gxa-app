<template>
  <view class="leave pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <view class="page-title">待我审批</view>
    <scroll-view class="content" scroll-y>
      <view v-if="list.length===0" class="empty">暂无待审批</view>
      <view v-else>
        <view class="card" v-for="item in list" :key="item.id" @click="goDetail(item)">
          <view class="row-top">
            <text class="type">{{ typeText(item.leaveType) }}</text>
            <text class="status">待审批</text>
          </view>
          <view class="row">{{ item.applicantName }} · {{ item.deptName }}</view>
          <view class="row">{{ item.startDate }} 至 {{ item.endDate }} · {{ item.daysCount }}天</view>
          <view class="row sub">当前节点：{{ nodeText(item) }}</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getLeaveRequests } from '@/common/database.js';

const safeTop = ref(0);
const list = ref([]);

const currentUser = {
  id: 'u1',
  name: '李警官',
  deptName: '桂南派出所',
  roles: ['leader_station_dept'],
};

const roleLabels = {
  leader_station_dept: '派出所部门领导',
  leader_bureau_political: '分局政工',
  leader_bureau: '分局领导',
};

function nodeText(item) {
  // 当前审批节点文案
  const idx = item.currentStepIndex || 0;
  const step = item.steps && item.steps[idx];
  return roleLabels[step?.role] || '审批节点';
}

function typeText(type) {
  // 休假类型文案映射
  const map = { annual: '年假', personal: '事假', sick: '病假', compensatory: '调休' };
  return map[type] || type;
}

function goDetail(item) {
  // 跳转到详情页
  uni.navigateTo({ url: `/pages/leave/detail?id=${item.id}` });
}

onShow(() => {
  // 读取待我审批列表
  const all = getLeaveRequests();
  list.value = all.filter((i) => {
    if (!['pending','approving'].includes(i.status)) return false;
    const idx = i.currentStepIndex || 0;
    const step = i.steps && i.steps[idx];
    return step && currentUser.roles.includes(step.role);
  });
});

onLoad(() => {
  // 计算顶部安全区
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
.content { height: calc(100vh - 120rpx); }
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 12rpx;
}
.row-top { display: flex; justify-content: space-between; align-items: center; }
.type { font-size: 28rpx; font-weight: 600; }
.status { font-size: 22rpx; padding: 4rpx 10rpx; border-radius: 999rpx; background: #fff6e6; color: #c88719; }
.row { margin-top: 6rpx; font-size: 24rpx; color: #1f2b3a; }
.row.sub { color: #6b7785; }
.empty { text-align: center; color: #97a1ad; padding: 40rpx 0; }
</style>
