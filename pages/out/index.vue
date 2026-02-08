<template>
  <view class="out pageBg">
    <view class="page-title">外出报备</view>
    <view class="card-list">
      <view class="card" @click="go('/pages/out/apply')">
        <view class="card-title">发起外出</view>
        <view class="card-sub">提交普通外出或出差外出申请</view>
      </view>
      <view class="card" @click="go('/pages/out/my')">
        <view class="card-title">我的外出</view>
        <view class="card-sub">查看我发起的外出申请与状态</view>
      </view>
      <view class="card" :class="{ disabled: !canApprove }" @click="goApprove">
        <view class="card-title">待我审批</view>
        <view class="card-sub">处理当前轮到我审批的外出申请</view>
        <view v-if="!canApprove" class="tip">无权限</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
const currentUser = {
  id: 'u1',
  name: '李警官',
  deptName: '桂南派出所',
  roles: ['leader_station_dept'],
};

const canApprove = computed(() => currentUser.roles && currentUser.roles.length > 0);

function go(url) {
  // 统一处理外出模块内部跳转
  uni.navigateTo({ url });
}

function goApprove() {
  // 仅审批角色允许进入“待我审批”
  if (!canApprove.value) return;
  go('/pages/out/approve');
}

</script>

<style lang="scss" scoped>
.out {
  min-height: 100vh;
  padding: 12rpx 24rpx 24rpx;
  box-sizing: border-box;
}
.page-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2b3a;
  margin-bottom: 16rpx;
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2b3a;
}
.card-sub {
  margin-top: 6rpx;
  color: #6b7785;
  font-size: 24rpx;
}
.card.disabled {
  opacity: 0.6;
}
.tip {
  margin-top: 8rpx;
  color: #97a1ad;
  font-size: 22rpx;
}
</style>
