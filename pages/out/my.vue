<template>
  <view class="out pageBg">
    <view class="page-title">我的外出</view>
    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.value"
        :class="['tab', activeTab === t.value ? 'active' : '']"
        @click="activeTab = t.value"
      >
        {{ t.label }}
      </view>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="filtered.length === 0" class="empty">暂无记录</view>
      <view v-else>
        <view v-for="item in filtered" :key="item.id" class="card" @click="goDetail(item.id)">
          <view class="row-top">
            <text class="type-tag">{{ outTypeText(item.type) }}</text>
            <text :class="['status-tag', item.status]">{{ outStatusText(item.status) }}</text>
          </view>
          <view class="row">{{ item.startAt }} 至 {{ item.endAt }}</view>
          <view class="row">{{ item.destination }}</view>
          <view class="row sub">{{ item.reason }}</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { queryOutRequests } from '@/common/database.js';
const list = ref([]);
const activeTab = ref('all');
const currentUser = { id: 'u1', name: '李警官' };

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已撤回', value: 'cancelled' },
];

const filtered = computed(() => {
  // 根据 tab 过滤外出记录
  if (activeTab.value === 'all') return list.value;
  if (activeTab.value === 'pending') {
    return list.value.filter((i) => ['pending', 'approving'].includes(i.status));
  }
  return list.value.filter((i) => i.status === activeTab.value);
});

function outTypeText(type) {
  // 外出类型文案映射
  const map = { NORMAL: '普通外出', BUSINESS_TRIP: '出差外出', LEAVE_LINK: '休假关联' };
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

function goDetail(id) {
  // 进入外出详情页
  uni.navigateTo({ url: `/pages/out/detail?id=${id}` });
}

onShow(() => {
  // 每次进入页面刷新我的外出申请
  list.value = queryOutRequests({ applicantId: currentUser.id });
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
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.tab {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f4f6f8;
  font-size: 24rpx;
}
.tab.active {
  background: #eaf3ff;
  color: #1677ff;
}
.content {
  height: calc(100vh - 200rpx);
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
}
.status-tag.pending, .status-tag.approving { background: #fff6e6; color: #c88719; }
.status-tag.approved { background: #e6f7ed; color: #1b9d5d; }
.status-tag.rejected, .status-tag.cancelled { background: #ffecec; color: #d64545; }
.row {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #1f2b3a;
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
