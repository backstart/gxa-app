<template>
  <AppPage>
    <view class="place-list pageBg">
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
        <AppEmpty v-if="filtered.length === 0" text="暂无数据" />
        <AppListItem
          v-for="place in filtered"
          :key="place.placeId"
          :title="place.name"
          :subTitle="place.address"
          :leftImage="place.frontPhoto || '/static/logo.png'"
          @click="goDetail(place)"
        >
          <template #titleExtra>
            <text :class="['badge', riskClass(place.riskLevel)]">{{ place.riskLevel }}</text>
          </template>
          <view class="place-tags">
            <text class="tag type">{{ typeLabel(place.primaryType) }}</text>
            <text v-for="m in place.modules" :key="m" class="tag module">{{ moduleLabel(m) }}</text>
          </view>
          <view class="place-foot">
            <text :class="['due', dueClass(place.nextVisitDue)]">{{ dueText(place.nextVisitDue) }}</text>
          </view>
        </AppListItem>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces } from '@/common/database.js';
import AppPage from '@/components/app/AppPage.vue';
import AppListItem from '@/components/app/AppListItem.vue';
import AppEmpty from '@/components/app/AppEmpty.vue';

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
  return typeLabel(filterType.value);
});

const filtered = computed(() => {
  const key = searchKey.value.trim();
  return list.value.filter((p) => {
    if (filterType.value) {
      if (p.primaryType !== filterType.value) return false;
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

onLoad((query) => {
  filterType.value = query.filterType || '';
});
onShow(loadData);
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.place-list {
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
  margin-top: 10rpx;
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
  margin-top: 8rpx;
  display: flex;
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
</style>
