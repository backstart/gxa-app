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
        <view v-if="basicRows.length === 0" class="empty">暂无基础信息</view>
        <view v-for="row in basicRows" :key="row.label" class="row">
          <text>{{ row.label }}</text>
          <text>{{ row.value }}</text>
        </view>
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
      boxCount: primary.boxCount ?? primary.roomCount,
      securityCount: primary.securityCount,
      businessHours: primary.businessHours,
      riskFlags: primary.riskFlags || [],
      landlordName: primary.landlordName || primary.landlord,
      landlordPhone: primary.landlordPhone,
      recordStatus: primary.recordStatus,
      building: primary.building,
      unit: primary.unit,
      floor: primary.floor,
      roomsCount: primary.roomsCount,
      seatCount: primary.seatCount,
      realNameSystem: primary.realNameSystem,
      minorControl: primary.minorControl,
      hasCCTV: primary.hasCCTV,
      roomCount: primary.roomCount,
      staffCount: primary.staffCount,
      riskPornFlag: primary.riskPornFlag,
      mahjongTableCount: primary.mahjongTableCount,
      chessRoomCount: primary.chessRoomCount,
      riskGambleFlag: primary.riskGambleFlag,
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

const basicRows = computed(() => {
  if (!item.value || item.value.itemType !== 'BASIC') return [];
  const p = item.value.payload || {};
  const rows = [];
  const pushRow = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    rows.push({ label, value });
  };
  const type = place.value?.primaryType || 'KTV';
  if (type === 'KTV') {
    pushRow('营业时间', p.businessHours);
    pushRow('包厢数', p.boxCount ?? p.roomCount);
    pushRow('安保人数', p.securityCount);
    if (p.riskFlags && p.riskFlags.length) pushRow('风险标签', p.riskFlags.join(' / '));
  }
  if (type === 'RENTAL') {
    pushRow('房东姓名', p.landlordName);
    pushRow('房东电话', p.landlordPhone);
    pushRow('备案状态', p.recordStatus);
    pushRow('楼栋', p.building);
    pushRow('单元', p.unit);
    pushRow('楼层', p.floor);
    pushRow('房间数', p.roomsCount);
  }
  if (type === 'NETBAR') {
    pushRow('机位数', p.seatCount);
    pushRow('实名系统', p.realNameSystem);
    pushRow('未成年人管控', p.minorControl);
    pushRow('营业时间', p.businessHours);
    if (p.hasCCTV !== undefined) pushRow('视频监控', p.hasCCTV ? '是' : '否');
  }
  if (type === 'FOOTBATH') {
    pushRow('包间数', p.roomCount);
    pushRow('从业人数', p.staffCount);
    if (p.riskPornFlag !== undefined) pushRow('涉黄风险', p.riskPornFlag ? '是' : '否');
    pushRow('营业时间', p.businessHours);
    if (p.hasCCTV !== undefined) pushRow('视频监控', p.hasCCTV ? '是' : '否');
  }
  if (type === 'CHESS_CARD') {
    pushRow('麻将台数', p.mahjongTableCount);
    pushRow('棋牌包间', p.chessRoomCount);
    if (p.riskGambleFlag !== undefined) pushRow('涉赌风险', p.riskGambleFlag ? '是' : '否');
    pushRow('营业时间', p.businessHours);
  }
  return rows;
});

function edit() {
  if (!item.value) return;
  if (item.value.itemType !== 'LICENSE') {
    uni.showToast({ title: '仅证照档案支持编辑', icon: 'none' });
    return;
  }
  const archives = profile.value?.primary?.archives || [];
  const hasArchive = archives.some((a) => a.id === item.value.id);
  const mode = hasArchive ? 'edit' : 'add';
  const url = hasArchive
    ? `/pages/place/archive/edit?placeId=${placeId.value}&mode=edit&archiveId=${item.value.id}`
    : `/pages/place/archive/edit?placeId=${placeId.value}&mode=add`;
  uni.navigateTo({ url });
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
