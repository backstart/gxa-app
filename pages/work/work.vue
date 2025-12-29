<template>
  <view class="workbench pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">工作台</view>
        <view class="sub">今日概览与待办</view>
      </view>
      <view class="date">{{ today }}</view>
    </view>

    <view class="card metrics">
      <view class="metric" v-for="item in metrics" :key="item.key">
        <view class="metric-top">
          <text class="metric-title">{{ item.title }}</text>
          <view class="dot"></view>
        </view>
        <view class="metric-value">{{ item.value }}</view>
        <view class="metric-desc">{{ item.desc }}</view>
      </view>
    </view>

    <view class="card todo">
      <view class="section-head">
        <text class="section-title">我的待办</text>
        <text class="section-sub">警情/任务/纠纷/派单</text>
      </view>
      <view v-if="todos.length === 0" class="empty">暂无待办</view>
      <view v-for="item in todos" :key="item.id" class="todo-item" @click="goDetail(item)">
        <view class="todo-main">
          <view class="todo-title">{{ item.title }}</view>
          <view class="todo-tags">
            <text class="tag type">{{ typeText[item.type] || '其他' }}</text>
            <text class="tag risk" :class="riskClass(item.risk)">{{ item.risk }}</text>
          </view>
        </view>
        <view class="todo-meta">
          <text class="deadline">截止：{{ item.deadline }}</text>
          <text :class="['status', item.status]">{{ statusText[item.status] || '处理中' }}</text>
        </view>
      </view>
    </view>

    <view class="card shortcuts">
      <view class="section-head">
        <text class="section-title">快捷入口</text>
        <text class="section-sub">高频功能直达</text>
      </view>
      <view class="grid">
        <view class="grid-item" v-for="item in shortcuts" :key="item.key" @click="goShortcut(item)">
          <view class="grid-icon">{{ item.emoji }}</view>
          <view class="grid-text">{{ item.title }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMetrics, getTodos, getShortcuts } from '@/common/database.js';

const today = ref(new Date().toLocaleDateString());

const metrics = ref([]);
const todos = ref([]);
const shortcuts = ref([]);

const statusText = {
  pending: '待处理',
  processing: '处理中',
  done: '已完成',
};

const typeText = {
  alert: '警情',
  task: '任务',
  dispute: '纠纷',
  order: '派单',
};

function loadData() {
  metrics.value = getMetrics();
  todos.value = getTodos();
  const baseShortcuts = getShortcuts();
  const extra = [
    { key: 'taskList', title: '任务列表', emoji: '📋', url: '/pages/task/list' },
    { key: 'disputeList', title: '纠纷列表', emoji: '🧭', url: '/pages/dispute/list' },
    { key: 'dispatchCreate', title: '派单创建', emoji: '📝', url: '/pages/dispatch/assign' },
    { key: 'command', title: '图上指挥', emoji: '🗺️', url: '/subPackages/map/index' },
  ];
  shortcuts.value = [...baseShortcuts, ...extra];
}

// 待办跳转，根据类型或配置的 url 导航
function goDetail(item) {
  if (item.url) {
    uni.navigateTo({ url: item.url });
    return;
  }
  const refId = item.refId || '';
  let target = '/pages/index/index';
  if (item.type === 'alert') {
    target = `/pages/policeDetail/policeDetail?id=${refId}`;
  } else if (item.type === 'task') {
    target = `/pages/task/detail?taskId=${refId}`;
  } else if (item.type === 'dispute') {
    target = `/pages/dispute/detail?disputeId=${refId}`;
  } else if (item.type === 'order') {
    target = `/pages/dispatch/detail?dispatchId=${refId}`;
  }
  uni.navigateTo({ url: target });
}

// 风险等级样式
function riskClass(risk) {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}

// 快捷入口跳转
function goShortcut(item) {
  const target = item.url || '/pages/index/index';
  uni.navigateTo({ url: target });
}

onShow(loadData);
</script>

<style lang="scss" scoped>
.workbench {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;

  .statuBar {
    height: 40rpx;
  }

  .header {
    padding: 10rpx 0 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-size: 44rpx;
      font-weight: 700;
      color: #1f2b3a;
    }
    .sub {
      margin-top: 6rpx;
      color: #6e7a89;
      font-size: 26rpx;
    }
    .date {
      background: #eaf3ff;
      color: #0f75ff;
      padding: 10rpx 16rpx;
      border-radius: 12rpx;
      font-size: 26rpx;
      font-weight: 600;
    }
  }

  .card {
    background: rgba(255,255,255,0.92);
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
    margin-bottom: 16rpx;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12rpx;
    .metric {
      padding: 16rpx;
      border-radius: 14rpx;
      background: linear-gradient(180deg, #fafdff, #ffffff);
      box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
    }
    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .metric-title {
        font-size: 28rpx;
        color: #344150;
      }
      .dot {
        width: 10rpx;
        height: 10rpx;
        background: #0f75ff;
        border-radius: 50%;
      }
    }
    .metric-value {
      margin: 10rpx 0 6rpx;
      font-size: 44rpx;
      font-weight: 700;
      color: #0f75ff;
    }
    .metric-desc {
      font-size: 24rpx;
      color: #6b7785;
    }
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
    .section-title {
      font-size: 32rpx;
      font-weight: 700;
      color: #1f2b3a;
    }
    .section-sub {
      font-size: 24rpx;
      color: #6e7a89;
    }
  }

  .todo {
    .todo-item {
      padding: 14rpx 0;
      border-bottom: 1px solid #f1f3f5;
      &:last-child {
        border-bottom: none;
      }
    }
    .todo-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .todo-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #1f2b3a;
      flex: 1;
    }
    .todo-tags {
      display: flex;
      gap: 8rpx;
      margin-left: 12rpx;
    }
    .tag {
      padding: 6rpx 12rpx;
      border-radius: 12rpx;
      font-size: 22rpx;
      &.type { background: #eaf3ff; color: #0f75ff; }
      &.risk { background: #ffecec; color: #d64545; }
      &.high { background: #ffecec; color: #d64545; }
      &.medium { background: #fff6e6; color: #c88719; }
      &.low { background: #e6f7ed; color: #1b9d5d; }
    }
    .todo-meta {
      margin-top: 8rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 24rpx;
      color: #6b7785;
      .status {
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        &.pending { background: #eaf3ff; color: #0f75ff; }
        &.processing { background: #fff6e6; color: #c88719; }
        &.done { background: #e6f7ed; color: #1b9d5d; }
      }
    }
    .empty {
      text-align: center;
      color: #97a1ad;
      padding: 20rpx 0;
    }
  }

  .shortcuts {
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14rpx;
    }
    .grid-item {
      background: #f6f8fb;
      border-radius: 14rpx;
      padding: 18rpx 10rpx;
      text-align: center;
      box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
    }
    .grid-icon {
      font-size: 40rpx;
      margin-bottom: 8rpx;
    }
    .grid-text {
      font-size: 26rpx;
      color: #1f2b3a;
    }
  }
}
</style>
