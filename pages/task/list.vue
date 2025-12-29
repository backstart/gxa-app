<template>
  <view class="task-list pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">任务列表</view>
        <view class="sub">主防任务概览</view>
      </view>
      <button size="mini" class="ghost-btn">新建任务（本地）</button>
    </view>

    <view class="card filters">
      <view class="filter-row">
        <text class="label">范围</text>
        <view class="chips">
          <view v-for="item in rangeOptions" :key="item.value" :class="['chip', filters.range === item.value ? 'active' : '']" @click="filters.range = item.value">{{ item.label }}</view>
        </view>
      </view>
      <view class="filter-row">
        <text class="label">状态</text>
        <view class="chips">
          <view v-for="item in statusOptions" :key="item.value" :class="['chip', filters.status === item.value ? 'active' : '']" @click="filters.status = item.value">{{ item.label }}</view>
        </view>
      </view>
      <view class="filter-row">
        <text class="label">类型</text>
        <view class="chips">
          <view v-for="item in typeOptions" :key="item.value" :class="['chip', filters.type === item.value ? 'active' : '']" @click="filters.type = item.value">{{ item.label }}</view>
        </view>
      </view>
    </view>

    <view class="card list-card">
      <view v-if="filteredTasks.length === 0" class="empty">暂无任务</view>
      <view v-for="item in filteredTasks" :key="item.id" class="task-item" @click="goDetail(item)">
        <view class="row-top">
          <view class="type">{{ taskTypeLabel(item.type) }}</view>
          <text :class="['status', item.status]">{{ statusText(item.status) }}</text>
        </view>
        <view class="title-line">
          <text class="risk" :class="riskClass(item.riskLevel)">{{ item.riskLevel || '中' }}</text>
          <text class="title">{{ item.title }}</text>
        </view>
        <view class="meta">{{ item.address || item.entityTitle || '' }}</view>
        <view class="meta">截止：{{ item.deadline || '--' }}（{{ countdown(item.deadline) }}）</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getTasks } from '@/common/database.js';

const tasks = ref([]);

const filters = ref({
  range: 'mine',
  status: 'all',
  type: 'all',
});

const rangeOptions = [
  { value: 'mine', label: '我的' },
  { value: 'area', label: '辖区' },
];

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: 'TODO' },
  { value: 'done', label: 'DONE' },
  { value: 'overdue', label: '超期' },
  { value: 'due_soon', label: '临期' },
];

const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'VISIT', label: '走访' },
  { value: 'CHECK', label: '排查' },
  { value: 'FOLLOW', label: '回访' },
  { value: 'PATROL', label: '巡逻' },
  { value: 'INCIDENT', label: '临查' },
];

const filteredTasks = computed(() => {
  let list = tasks.value;
  if (filters.value.status === 'pending') list = list.filter((t) => t.status === 'pending');
  if (filters.value.status === 'done') list = list.filter((t) => t.status === 'done' || t.status === 'DONE');
  if (filters.value.type !== 'all') list = list.filter((t) => (t.type || '').includes(filters.value.type));
  return list;
});

function taskTypeLabel(type) {
  const map = {
    PATROL: '巡逻',
    VISIT: '走访',
    CHECK: '排查',
    FOLLOW: '回访',
    INCIDENT: '临查',
    PLACE_VISIT: '场所走访',
    KEY_PERSON_VISIT: '重点人走访',
    DISPUTE_VISIT: '纠纷回访',
  };
  return map[type] || type || '任务';
}

function statusText(status) {
  const map = { pending: '待处理', done: '已完成', DONE: '已完成', overdue: '超期', due_soon: '临期' };
  return map[status] || '待处理';
}

function riskClass(risk) {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}

function countdown(deadline) {
  if (!deadline) return '未设置';
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return '格式错误';
  const diff = end - Date.now();
  if (diff <= 0) return '已超时';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}小时${m}分`;
}

function goDetail(item) {
  uni.navigateTo({ url: `/pages/task/detail?taskId=${item.id}` });
}

onShow(() => {
  tasks.value = getTasks();
});
</script>

<style lang="scss" scoped>
.task-list {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
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
    .ghost-btn {
      border: 1px solid #d0d6de;
      background: #fff;
      color: #1f2b3a;
      padding: 10rpx 18rpx;
      border-radius: 12rpx;
    }
  }
  .card {
    background: rgba(255,255,255,0.92);
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
    margin-bottom: 16rpx;
  }
  .filters .filter-row {
    margin-bottom: 10rpx;
    .label {
      display: block;
      font-size: 28rpx;
      color: #344150;
      margin-bottom: 6rpx;
    }
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
  }
  .chip {
    padding: 12rpx 18rpx;
    border-radius: 12rpx;
    background: #f4f6f8;
    color: #1f2b3a;
    font-size: 26rpx;
  }
  .chip.active {
    background: #0f75ff;
    color: #fff;
    font-weight: 600;
  }
  .list-card .task-item {
    padding: 14rpx 0;
    border-bottom: 1px solid #f1f3f5;
    &:last-child { border-bottom: none; }
  }
  .row-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .type {
    font-size: 28rpx;
    color: #1f2b3a;
    font-weight: 600;
  }
  .status {
    padding: 6rpx 12rpx;
    border-radius: 12rpx;
    background: #eaf3ff;
    color: #0f75ff;
    &.done,&.DONE { background: #e6f7ed; color: #1b9d5d; }
    &.overdue { background: #ffecec; color: #d64545; }
    &.due_soon { background: #fff6e6; color: #c88719; }
  }
  .title-line {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-top: 6rpx;
  }
  .risk {
    padding: 6rpx 10rpx;
    border-radius: 10rpx;
    font-size: 22rpx;
    &.high { background: #ffecec; color: #d64545; }
    &.medium { background: #fff6e6; color: #c88719; }
    &.low { background: #e6f7ed; color: #1b9d5d; }
  }
  .title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2b3a;
  }
  .meta {
    margin-top: 4rpx;
    color: #6b7785;
    font-size: 24rpx;
  }
  .empty {
    text-align: center;
    color: #97a1ad;
    padding: 20rpx 0;
  }
}
</style>
