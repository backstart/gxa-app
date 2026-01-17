<template>
  <view class="archive-detail pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view class="title">档案详情</view>
      <view class="sub">{{ place?.name || '重点场所' }}</view>
    </view>

    <view v-if="!item" class="card empty">未找到档案信息</view>

    <view v-else class="card">
      <view v-if="item.itemType === 'LICENSE'" class="section">
        <view class="row"><text>类型</text><text>{{ item.title }}</text></view>
        <view class="row"><text>编号</text><text>{{ item.payload?.docNo || '—' }}</text></view>
        <view class="row">
          <text>到期时间</text>
          <text :class="dueClass(item.payload?.dueDate)">{{ item.payload?.dueDate || '—' }}</text>
        </view>
        <view class="row"><text>备注</text><text>{{ item.payload?.note || '—' }}</text></view>
        <view class="row photos">
          <text>照片</text>
          <view class="photoRow">
            <image v-for="(img, idx) in (item.payload?.photos || [])" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
            <text v-if="!(item.payload?.photos || []).length">—</text>
          </view>
        </view>
      </view>

      <view v-else-if="item.itemType === 'BASIC'" class="section">
        <view class="row"><text>包厢数</text><text>{{ item.payload?.roomCount || '--' }}</text></view>
        <view class="row"><text>安保人数</text><text>{{ item.payload?.securityCount || '--' }}</text></view>
        <view class="row"><text>营业时间</text><text>{{ item.payload?.businessHours || '--' }}</text></view>
        <view class="row"><text>消防检查</text><text>{{ item.payload?.fireCheckDate || '--' }}</text></view>
      </view>

      <view v-else class="section">
        <view class="row"><text>模块类型</text><text>{{ item.title }}</text></view>
        <view v-if="!hasModuleData" class="empty">暂无模块信息</view>
        <view v-else>
          <view v-for="row in moduleRows" :key="row.label" class="row">
            <text>{{ row.label }}</text>
            <text>{{ row.value }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="footer">
      <button class="ghost" @click="edit">完善信息 / 编辑</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles } from '@/common/database.js';

const placeId = ref('');
const itemId = ref('');
const place = ref(null);
const profile = ref(null);
const item = ref(null);

function load() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  const items = buildArchiveItems();
  item.value = items.find((i) => i.id === itemId.value) || null;
}

function buildArchiveItems() {
  const items = [];
  const primary = profile.value?.primary || {};
  const archives = primary.archives || [];
  const licenseItems = archives.length ? archives.map((item) => ({
    id: item.id,
    itemType: 'LICENSE',
    title: item.docType || '证照',
    subTitle: `编号：${item.docNo || '—'}`,
    rightText: item.dueDate || '',
    status: dueStatus(item.dueDate),
    payload: item,
  })) : buildFallbackArchives().map((item) => ({
    id: item.id,
    itemType: 'LICENSE',
    title: item.title,
    subTitle: item.docNo ? `编号：${item.docNo}` : '编号：—',
    rightText: item.dueDate || '',
    status: dueStatus(item.dueDate),
    payload: item,
  }));
  items.push(...licenseItems);

  items.push({
    id: 'basic_info',
    itemType: 'BASIC',
    title: '基础信息',
    subTitle: `包厢 ${primary.roomCount || '--'}｜安保 ${primary.securityCount || '--'}｜营业 ${primary.businessHours || '--'}`,
    rightText: '',
    status: '',
    payload: {
      roomCount: primary.roomCount,
      securityCount: primary.securityCount,
      businessHours: primary.businessHours,
      fireCheckDate: primary.fireCheckDate,
    },
  });

  const moduleKeys = new Set([
    ...((place.value?.modules || []) || []),
    ...Object.keys(profile.value?.modules || {}),
  ]);
  Array.from(moduleKeys).forEach((type) => {
    const data = profile.value?.modules?.[type] || {};
    items.push({
      id: `module_${type}`,
      itemType: 'MODULE',
      title: `${moduleLabel(type)}模块`,
      subTitle: moduleSubTitle(type, data),
      rightText: '',
      status: '',
      payload: data,
    });
  });
  return items;
}

function buildFallbackArchives() {
  const arr = [];
  arr.push({
    id: 'archive-1',
    title: '营业执照',
    docNo: profile.value?.primary?.businessLicenseNo || '',
    dueDate: profile.value?.primary?.businessLicenseDue || '',
    note: '',
    photos: [],
  });
  arr.push({
    id: 'archive-2',
    title: '特行许可',
    docNo: profile.value?.primary?.specialLicenseNo || '',
    dueDate: profile.value?.primary?.specialLicenseDue || '',
    note: '',
    photos: [],
  });
  arr.push({
    id: 'archive-3',
    title: '消防检查',
    docNo: '',
    dueDate: profile.value?.primary?.fireCheckDate || '',
    note: '',
    photos: [],
  });
  return arr;
}

function moduleLabel(type) {
  const map = { BILLIARD: '台球', CHESS_CARD: '棋牌', NETBAR: '网吧', FOOTBATH: '足浴', KTV: 'KTV' };
  return map[type] || type;
}

function moduleSubTitle(type, data) {
  if (!data || Object.keys(data).length === 0) return '待完善';
  if (type === 'CHESS_CARD') return `麻将台 ${data.mahjongTableCount ?? '--'}｜棋牌包间 ${data.chessRoomCount ?? '--'}`;
  if (type === 'BILLIARD') return `台球桌 ${data.tableCount ?? '--'}`;
  if (type === 'NETBAR') return `机位 ${data.seatCount ?? '--'}`;
  if (type === 'FOOTBATH') return `包间 ${data.roomCount ?? '--'}｜从业 ${data.staffCount ?? '--'}`;
  return '待完善';
}

function dueStatus(dateStr) {
  if (!dateStr) return '';
  const days = daysTo(dateStr);
  if (days <= 7) return 'danger';
  if (days <= 30) return 'warn';
  return '';
}

function daysTo(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  const target = new Date(`${dateStr} 00:00:00`);
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function dueClass(dateStr) {
  const status = dueStatus(dateStr);
  if (status === 'danger') return 'danger';
  if (status === 'warn') return 'warn';
  return '';
}

const moduleRows = computed(() => {
  if (!item.value || item.value.itemType !== 'MODULE') return [];
  const type = item.value.id.replace('module_', '');
  const data = item.value.payload || {};
  if (type === 'CHESS_CARD') {
    return [
      { label: '麻将台数', value: data.mahjongTableCount ?? '--' },
      { label: '棋牌包间', value: data.chessRoomCount ?? '--' },
    ];
  }
  if (type === 'BILLIARD') {
    return [{ label: '台球桌数', value: data.tableCount ?? '--' }];
  }
  if (type === 'NETBAR') {
    return [
      { label: '机位数', value: data.seatCount ?? '--' },
      { label: '实名系统', value: data.realNameSystem || '--' },
    ];
  }
  if (type === 'FOOTBATH') {
    return [
      { label: '包间数', value: data.roomCount ?? '--' },
      { label: '从业人数', value: data.staffCount ?? '--' },
    ];
  }
  return [];
});

const hasModuleData = computed(() => {
  return item.value?.itemType === 'MODULE' && Object.keys(item.value.payload || {}).length > 0;
});

function edit() {
  uni.showToast({ title: '编辑功能待接入', icon: 'none' });
}

onLoad((query) => {
  placeId.value = query.placeId || '';
  itemId.value = query.itemId || '';
});

onShow(load);
</script>

<style lang="scss" scoped>
.archive-detail {
  min-height: 100vh;
  padding: 0 24rpx 80rpx;
  .statuBar { height: 40rpx; }
  .header {
    padding: 10rpx 0 14rpx;
    .title { font-size: 44rpx; font-weight: 700; color: #1f2b3a; }
    .sub { margin-top: 6rpx; color: #6e7a89; font-size: 26rpx; }
  }
  .card {
    background: #fff;
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
    margin-bottom: 16rpx;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10rpx;
    font-size: 26rpx;
    color: #1f2b3a;
    &.photos { align-items: flex-start; }
  }
  .photoRow {
    display: flex;
    gap: 8rpx;
    flex-wrap: wrap;
  }
  .photoThumb {
    width: 80rpx;
    height: 80rpx;
    border-radius: 10rpx;
    background: #e9edf2;
  }
  .danger { color: #d64545; }
  .warn { color: #c88719; }
  .empty {
    text-align: center;
    color: #97a1ad;
  }
  .footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 20rpx;
    padding: 0 24rpx;
    .ghost {
      width: 100%;
      background: #f6f8fb;
      color: #1f2b3a;
      border: 1px solid #d0d6de;
      border-radius: 12rpx;
    }
  }
}
</style>
