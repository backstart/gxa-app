<template>
  <view class="place-list pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">重点场所列表</view>
        <view class="sub">{{ headerSub }}</view>
      </view>
    </view>

    <view class="card filter-card">
      <view class="filter-row">
        <text class="label">搜索</text>
        <input class="input" v-model="searchKey" placeholder="名称/地址/负责人" />
      </view>
      <view class="filter-row">
        <text class="label">风险</text>
        <view class="chips">
          <view v-for="r in riskOptions" :key="r" :class="['chip', riskFilter === r ? 'active' : '']" @click="riskFilter = r">
            {{ r }}
          </view>
        </view>
      </view>
      <view class="filter-row">
        <text class="label">到期</text>
        <view class="chips">
          <view v-for="d in dueOptions" :key="d.value" :class="['chip', dueFilter === d.value ? 'active' : '']" @click="dueFilter = d.value">
            {{ d.label }}
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <view v-if="filtered.length === 0" class="empty">暂无数据</view>
      <view v-for="place in filtered" :key="place.placeId" class="place-card" @click="goDetail(place)">
        <view class="place-head">
          <view>
            <view class="place-title">{{ place.name }}</view>
            <view class="place-meta">{{ place.address }}</view>
          </view>
          <text :class="['badge', riskClass(place.riskLevel)]">{{ place.riskLevel }}</text>
        </view>
        <view class="place-tags">
          <text class="tag type">{{ typeLabel(place.primaryType) }}</text>
          <text v-for="m in place.modules" :key="m" class="tag module">{{ moduleLabel(m) }}</text>
        </view>
        <view class="place-foot">
          <text :class="['due', dueClass(place.nextVisitDue)]">{{ dueText(place.nextVisitDue) }}</text>
          <button size="mini" class="ghost-btn" @click.stop="callOwner(place)">拨号</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces } from '@/common/database.js';

const filterType = ref('');
const searchKey = ref('');
const riskFilter = ref('全部');
const dueFilter = ref('ALL');
const list = ref([]);

const riskOptions = ['全部', '高', '中', '低'];
const dueOptions = [
  { value: 'ALL', label: '全部' },
  { value: 'DUE', label: '临期' },
  { value: 'OVERDUE', label: '超期' },
];

const headerSub = computed(() => {
  if (!filterType.value) return '全部重点场所';
  if (filterType.value === 'COMPLEX') return '复合业态场所';
  return typeLabel(filterType.value);
});

const filtered = computed(() => {
  const key = searchKey.value.trim();
  return list.value.filter((p) => {
    if (filterType.value) {
      if (filterType.value === 'COMPLEX' && (p.modules || []).length === 0) return false;
      if (filterType.value !== 'COMPLEX' && p.primaryType !== filterType.value) return false;
    }
    if (riskFilter.value !== '全部' && p.riskLevel !== riskFilter.value) return false;
    if (dueFilter.value !== 'ALL') {
      const days = diffDays(p.nextVisitDue);
      if (dueFilter.value === 'DUE' && (days < 0 || days > 7)) return false;
      if (dueFilter.value === 'OVERDUE' && days >= 0) return false;
    }
    if (!key) return true;
    return [p.name, p.address, p.ownerName, p.ownerPhone].some((f) => (f || '').includes(key));
  });
});

function diffDays(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  const target = new Date(`${dateStr} 00:00:00`);
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function dueText(dateStr) {
  const days = diffDays(dateStr);
  if (!dateStr) return '未设置走访';
  if (days < 0) return `已超期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  return `还剩 ${days} 天`;
}

function dueClass(dateStr) {
  const days = diffDays(dateStr);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'due';
  return 'normal';
}

function riskClass(risk) {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}

function typeLabel(type) {
  const map = {
    KTV: 'KTV/夜场',
    RENTAL: '出租屋',
    NETBAR: '网吧',
    FOOTBATH: '足浴',
    CHESS_CARD: '棋牌/麻将',
    COMPLEX: '复合业态',
  };
  return map[type] || type;
}

function moduleLabel(m) {
  const map = {
    BILLIARD: '台球',
    CHESS_CARD: '棋牌',
    NETBAR: '网吧',
    FOOTBATH: '足浴',
    KTV: 'KTV',
  };
  return map[m] || m;
}

function loadData() {
  list.value = getPlaces();
}

function goDetail(place) {
  const map = {
    KTV: '/pages/place/ktv/detail',
    RENTAL: '/pages/place/rental/detail',
    NETBAR: '/pages/place/netbar/detail',
    FOOTBATH: '/pages/place/footbath/detail',
    CHESS_CARD: '/pages/place/chess/detail',
  };
  const base = map[place.primaryType] || '/pages/place/ktv/detail';
  uni.navigateTo({ url: `${base}?placeId=${place.placeId}` });
}

function callOwner(place) {
  if (!place.ownerPhone) {
    uni.showToast({ title: '暂无电话', icon: 'none' });
    return;
  }
  uni.makePhoneCall({ phoneNumber: place.ownerPhone });
}

onLoad((query) => {
  filterType.value = query.filterType || '';
});
onShow(loadData);
</script>

<style lang="scss" scoped>
.place-list {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
}
.header {
  padding: 10rpx 0 20rpx;
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
.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  .label {
    width: 90rpx;
    font-size: 26rpx;
    color: #344150;
  }
}
.input {
  flex: 1;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 12rpx 14rpx;
  font-size: 26rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.chip {
  padding: 8rpx 14rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  font-size: 24rpx;
}
.chip.active {
  background: #0f75ff;
  color: #fff;
}
.place-card {
  padding: 16rpx;
  border-radius: 14rpx;
  background: #f6f8fb;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 12rpx;
}
.place-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.place-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2b3a;
}
.place-meta {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6e7a89;
}
.badge {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  background: #eaf3ff;
  color: #0f75ff;
}
.badge.high {
  background: #ffecec;
  color: #d64545;
}
.badge.medium {
  background: #fff6e6;
  color: #c88719;
}
.badge.low {
  background: #e6f7ed;
  color: #1b9d5d;
}
.place-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 8rpx;
}
.tag {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  background: #eaf3ff;
  color: #0f75ff;
}
.tag.module {
  background: #f4f6f8;
  color: #344150;
}
.place-foot {
  margin-top: 10rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.due {
  font-size: 24rpx;
  color: #6b7785;
}
.due.due {
  color: #c88719;
}
.due.overdue {
  color: #d64545;
}
.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 20rpx 0;
}
</style>
