<template>
  <view class="person-index pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">重点人员</view>
        <view class="sub">分类统计与临期回访</view>
      </view>
    </view>

    <view class="card grid">
      <view class="grid-item" @click="goList('all')">
        <view class="count">{{ total }}</view>
        <view class="label">全部重点人</view>
      </view>
      <view class="grid-item warn" @click="goList('due')">
        <view class="count">{{ dueCount }}</view>
        <view class="label">临期回访</view>
      </view>
      <view v-for="item in typeCounts" :key="item.type" class="grid-item" @click="goList(`type:${item.type}`)">
        <view class="count">{{ item.count }}</view>
        <view class="label">{{ item.type }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getKeyPersons, syncKeyPersonTodos } from '@/common/database.js';

const persons = ref([]);
const types = ['涉毒', '涉稳', '精神障碍', '刑释解教', '未保对象'];

const total = computed(() => persons.value.length);

const typeCounts = computed(() =>
  types.map((type) => ({
    type,
    count: persons.value.filter((p) => p.personType === type).length,
  }))
);

const dueCount = computed(() => persons.value.filter((p) => isDueSoon(p.nextVisitDue)).length);

function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(String(dateStr).replace(/-/g, '/'));
  due.setHours(0, 0, 0, 0);
  const days = Math.floor((due.getTime() - now.getTime()) / 86400000);
  return days <= 7;
}

function goList(filter) {
  const url = `/pages/person/list?filter=${encodeURIComponent(filter)}`;
  uni.navigateTo({ url });
}

function load() {
  persons.value = getKeyPersons();
  syncKeyPersonTodos(persons.value);
}

onShow(load);
</script>

<style lang="scss" scoped>
.person-index {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
  .statuBar {
    height: 40rpx;
  }
  .header {
    padding: 10rpx 0 16rpx;
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
  }
  .card {
    background: rgba(255, 255, 255, 0.92);
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14rpx;
  }
  .grid-item {
    background: #f6f8fb;
    border-radius: 14rpx;
    padding: 18rpx 16rpx;
    text-align: center;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
    .count {
      font-size: 40rpx;
      font-weight: 700;
      color: #0f75ff;
    }
    .label {
      margin-top: 8rpx;
      font-size: 26rpx;
      color: #1f2b3a;
    }
    &.warn {
      background: #fff6e6;
      .count { color: #c88719; }
    }
  }
}
</style>
