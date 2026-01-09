<template>
  <view class="person-list pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view class="title">重点人员列表</view>
      <view class="sub">支持搜索、筛选与排序</view>
    </view>

    <view class="card filters">
      <input v-model="keyword" placeholder="搜索姓名/证件后四位/地址" />

      <view class="chip-row">
        <view
          v-for="type in typeOptions"
          :key="type"
          :class="['chip', selectedTypes.includes(type) ? 'active' : '']"
          @click="toggleType(type)"
        >
          {{ type }}
        </view>
      </view>

      <view class="filter-row">
        <view class="label">风险等级</view>
        <picker :range="riskOptions" @change="onRiskChange">
          <view class="picker">{{ selectedRisk || '全部' }}</view>
        </picker>
      </view>
      <view class="filter-row">
        <view class="label">状态</view>
        <picker :range="statusOptions" @change="onStatusChange">
          <view class="picker">{{ selectedStatus || '全部' }}</view>
        </picker>
      </view>
      <view class="filter-row">
        <view class="label">警务区</view>
        <picker :range="areaOptions" @change="onAreaChange">
          <view class="picker">{{ selectedArea || '全部' }}</view>
        </picker>
      </view>
      <view class="filter-row">
        <view class="label">排序</view>
        <picker :range="sortOptions" range-key="label" @change="onSortChange">
          <view class="picker">{{ sortLabel }}</view>
        </picker>
      </view>
    </view>

    <view v-if="displayList.length === 0" class="empty card">暂无数据</view>

    <view v-for="item in displayList" :key="item.personId" class="card person-card" @click="goDetail(item)">
      <view class="top">
        <view class="name">{{ maskName(item.name) }}</view>
        <view class="tag">{{ item.personType }}</view>
        <view :class="['badge', riskClass(item.riskLevel)]">{{ item.riskLevel }}</view>
        <view :class="['badge', statusClass(item.status)]">{{ item.status }}</view>
      </view>
      <view class="row"><text>责任民警</text><text>{{ item.officerName }}</text></view>
      <view class="row"><text>居住地</text><text>{{ item.address }}</text></view>
      <view class="row">
        <text>下次回访</text>
        <text :class="dueTextClass(item.nextVisitDue)">{{ dueText(item.nextVisitDue) }}</text>
      </view>
    </view>

    <view class="float-btn" @click="addPerson">新增重点人</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getKeyPersons, syncKeyPersonTodos } from '@/common/database.js';

const persons = ref([]);
const keyword = ref('');
const selectedTypes = ref([]);
const selectedRisk = ref('');
const selectedStatus = ref('');
const selectedArea = ref('');
const sortMode = ref('next');

const typeOptions = ['涉毒', '涉稳', '精神障碍', '刑释解教', '未保对象'];
const riskOptions = ['全部', '高', '中', '低'];
const statusOptions = ['全部', '在控', '关注', '失控', '迁出', '解除'];
const areaOptions = computed(() => ['全部', ...new Set(persons.value.map((p) => p.area))]);
const sortOptions = [
  { label: '按回访时间最近', value: 'next' },
  { label: '按风险等级优先', value: 'risk' },
];

const sortLabel = computed(() => sortOptions.find((o) => o.value === sortMode.value)?.label || '按回访时间最近');

function toggleType(type) {
  if (selectedTypes.value.includes(type)) {
    selectedTypes.value = selectedTypes.value.filter((t) => t !== type);
  } else {
    selectedTypes.value = [...selectedTypes.value, type];
  }
}

function onRiskChange(e) {
  const val = riskOptions[Number(e.detail.value)];
  selectedRisk.value = val === '全部' ? '' : val;
}

function onStatusChange(e) {
  const val = statusOptions[Number(e.detail.value)];
  selectedStatus.value = val === '全部' ? '' : val;
}

function onAreaChange(e) {
  const val = areaOptions.value[Number(e.detail.value)];
  selectedArea.value = val === '全部' ? '' : val;
}

function onSortChange(e) {
  sortMode.value = sortOptions[Number(e.detail.value)]?.value || 'next';
}

function maskName(name) {
  if (!name) return '-';
  return `${name.charAt(0)}*`;
}

function dueText(dateStr) {
  if (!dateStr) return '未设置';
  const days = dueDays(dateStr);
  if (days < 0) return `超期${Math.abs(days)}天`;
  return `剩余${days}天`;
}

function dueTextClass(dateStr) {
  if (!dateStr) return '';
  const days = dueDays(dateStr);
  if (days < 0) return 'danger';
  if (days <= 7) return 'warn';
  return '';
}

function dueDays(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(String(dateStr).replace(/-/g, '/'));
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - now.getTime()) / 86400000);
}

function riskClass(level) {
  if (level === '高') return 'danger';
  if (level === '中') return 'warn';
  return 'low';
}

function statusClass(status) {
  if (status === '失控') return 'danger';
  if (status === '关注') return 'warn';
  if (status === '在控') return 'ok';
  return 'muted';
}

const displayList = computed(() => {
  let list = [...persons.value];
  if (keyword.value) {
    const key = keyword.value;
    list = list.filter(
      (p) => (p.name || '').includes(key) || (p.idNoLast4 || '').includes(key) || (p.address || '').includes(key)
    );
  }
  if (selectedTypes.value.length) {
    list = list.filter((p) => selectedTypes.value.includes(p.personType));
  }
  if (selectedRisk.value) {
    list = list.filter((p) => p.riskLevel === selectedRisk.value);
  }
  if (selectedStatus.value) {
    list = list.filter((p) => p.status === selectedStatus.value);
  }
  if (selectedArea.value) {
    list = list.filter((p) => p.area === selectedArea.value);
  }
  if (sortMode.value === 'risk') {
    const rank = { 高: 1, 中: 2, 低: 3 };
    list.sort((a, b) => (rank[a.riskLevel] || 4) - (rank[b.riskLevel] || 4));
  } else {
    list.sort((a, b) => {
      const da = a.nextVisitDue ? new Date(String(a.nextVisitDue).replace(/-/g, '/')).getTime() : Infinity;
      const db = b.nextVisitDue ? new Date(String(b.nextVisitDue).replace(/-/g, '/')).getTime() : Infinity;
      return da - db;
    });
  }
  return list;
});

function goDetail(item) {
  uni.navigateTo({ url: `/pages/person/detail?personId=${item.personId}` });
}

function addPerson() {
  uni.showToast({ title: '新增功能待接入', icon: 'none' });
}

function load() {
  persons.value = getKeyPersons();
  syncKeyPersonTodos(persons.value);
}

onLoad((query) => {
  const filter = decodeURIComponent(query.filter || '');
  if (filter === 'due') {
    sortMode.value = 'next';
  } else if (filter.startsWith('type:')) {
    selectedTypes.value = [filter.replace('type:', '')];
  }
});

onShow(load);
</script>

<style lang="scss" scoped>
.person-list {
  min-height: 100vh;
  padding: 0 24rpx 80rpx;
  .statuBar {
    height: 40rpx;
  }
  .header {
    padding: 10rpx 0 14rpx;
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
    margin-bottom: 16rpx;
  }
  .filters {
    input {
      width: 100%;
      padding: 12rpx;
      border: 1px solid #e1e8f0;
      border-radius: 10rpx;
      font-size: 26rpx;
      background: #f8fafc;
      margin-bottom: 12rpx;
    }
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10rpx;
      margin-bottom: 12rpx;
      .chip {
        padding: 8rpx 14rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        background: #f6f8fb;
        color: #4f5a68;
        &.active {
          background: #eaf3ff;
          color: #0f75ff;
        }
      }
    }
    .filter-row {
      display: grid;
      grid-template-columns: 140rpx 1fr;
      align-items: center;
      margin-bottom: 10rpx;
      .label {
        color: #6e7a89;
        font-size: 26rpx;
      }
      .picker {
        padding: 12rpx;
        border: 1px solid #e1e8f0;
        border-radius: 10rpx;
        font-size: 26rpx;
        background: #f8fafc;
      }
    }
  }
  .person-card {
    .top {
      display: flex;
      align-items: center;
      gap: 10rpx;
      flex-wrap: wrap;
      margin-bottom: 6rpx;
      .name {
        font-size: 32rpx;
        font-weight: 700;
        color: #1f2b3a;
      }
      .tag {
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        background: #f6f8fb;
        color: #4f5a68;
      }
      .badge {
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        &.danger { background: #ffecec; color: #d64545; }
        &.warn { background: #fff6e6; color: #c88719; }
        &.low { background: #e6f7ed; color: #1b9d5d; }
        &.ok { background: #eaf3ff; color: #0f75ff; }
        &.muted { background: #f1f3f5; color: #6e7a89; }
      }
    }
    .row {
      display: flex;
      justify-content: space-between;
      font-size: 26rpx;
      color: #1f2b3a;
      margin: 4rpx 0;
      .danger { color: #d64545; }
      .warn { color: #c88719; }
    }
  }
  .empty {
    text-align: center;
    color: #97a1ad;
  }
  .float-btn {
    position: fixed;
    right: 24rpx;
    bottom: 40rpx;
    background: #0f75ff;
    color: #fff;
    padding: 16rpx 22rpx;
    border-radius: 40rpx;
    font-size: 26rpx;
    box-shadow: 0 8rpx 20rpx rgba(15, 117, 255, 0.25);
  }
}
</style>
