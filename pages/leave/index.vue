<template>
  <view class="leave pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <view class="page-title">休假</view>
    <view class="card-list">
      <view class="card" @click="go('/pages/leave/apply')">
        <view class="card-title">发起休假</view>
        <view class="card-sub">提交新的休假申请</view>
      </view>
      <view class="card" @click="go('/pages/leave/my')">
        <view class="card-title">我的申请</view>
        <view class="card-sub">查看提交记录与进度</view>
      </view>
      <view class="card" :class="{ disabled: !canApprove }" @click="goApprove">
        <view class="card-title">待我审批</view>
        <view class="card-sub">审批待处理的休假单</view>
        <view v-if="!canApprove" class="tip">无权限</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const safeTop = ref(0);
const currentUser = {
  id: 'u1',
  name: '李警官',
  deptName: '桂南派出所',
  roles: ['leader_station_dept'],
};

const canApprove = computed(() => currentUser.roles && currentUser.roles.length > 0);

function go(url) {
  // 跳转到对应休假页面
  uni.navigateTo({ url });
}

function goApprove() {
  // 有审批角色时进入待审批列表
  if (!canApprove.value) return;
  go('/pages/leave/approve');
}

onLoad(() => {
  // 计算顶部安全区高度
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
