<template>
  <view class="place-detail pageBg">
    <view class="statuBar"></view>

    <view class="card header-card" v-if="place">
      <view class="header-top">
        <view>
          <view class="place-name">{{ place.name }}</view>
          <view class="place-sub">棋牌/麻将</view>
        </view>
      </view>

      <view class="info-grid">
        <view class="info-item">
          <text class="label">负责人</text>
          <text class="value">{{ place.ownerName || '--' }}</text>
        </view>
        <view class="info-item">
          <text class="label">电话</text>
          <text class="value link" @click="callPhone(place.ownerPhone)">{{ place.ownerPhone || '--' }}</text>
        </view>
        <view class="info-item" v-if="managerName">
          <text class="label">管理员</text>
          <text class="value">{{ managerName }}</text>
        </view>
        <view class="info-item" v-if="managerPhone">
          <text class="label">电话</text>
          <text class="value link" @click="callPhone(managerPhone)">{{ managerPhone }}</text>
        </view>
      </view>

      <view class="info-line">
        <text class="label">地址</text>
        <text class="value link" @click="copyAddress">{{ place.address }}</text>
      </view>
      <view class="info-line">
        <text class="label">最近走访</text>
        <text class="value">{{ place.lastVisitAt || '暂无记录' }}</text>
      </view>

      <com-tag :taglist="tagList"></com-tag>
    </view>

    <view v-if="!isTabScrollable" class="iconTabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['iconTabItem', activeTab === tab.key ? 'iconTabActive' : '']"
        @click="activeTab = tab.key"
      >
        <text class="iconTabIcon">{{ tab.icon }}</text>
        <text class="iconTabLabel">{{ tab.label }}</text>
        <text v-if="tab.badge" class="iconTabBadge">{{ tab.badge }}</text>
      </view>
    </view>
    <scroll-view v-else class="iconTabsScroll" scroll-x>
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['iconTabItemFixed', activeTab === tab.key ? 'iconTabActive' : '']"
        @click="activeTab = tab.key"
      >
        <text class="iconTabIcon">{{ tab.icon }}</text>
        <text class="iconTabLabel">{{ tab.label }}</text>
        <text v-if="tab.badge" class="iconTabBadge">{{ tab.badge }}</text>
      </view>
    </scroll-view>

    <view class="card tab-card">
      <view v-if="activeTab === 'records'">
        <view v-if="recordList.length === 0" class="empty">暂无检查记录</view>
        <view v-for="item in recordList" :key="item.visitId" class="list-item" @click="openRecord(item)">
          <view class="thumb"></view>
          <view class="list-body">
            <view class="list-title">{{ item.content }}</view>
            <view class="list-sub">类型：{{ item.visitType || '检查' }}</view>
            <view class="list-meta">{{ item.visitAt }} · {{ item.visitorName || '--' }}</view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'archive'">
        <view v-if="archiveItems.length === 0" class="empty">暂无档案</view>
        <view v-for="item in archiveItems" :key="item.id" class="listItem" @click="openArchive(item)">
          <view class="listItemContent">
            <view class="listItemTitle">
              <text>{{ item.title }}</text>
              <text v-if="item.itemType === 'MODULE'" class="placeTag placeTagPrimary">模块</text>
            </view>
            <view class="listItemMeta">
              <text>{{ item.subTitle }}</text>
              <text v-if="item.rightText" :class="['infoValue', dueClass(item.rightText)]">{{ item.rightText }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'incidents'">
        <view v-if="incidents.length === 0" class="empty">暂无关联警情</view>
        <view v-for="item in incidents" :key="item.id" class="list-item" @click="openIncident(item)">
          <view class="thumb"></view>
          <view class="list-body">
            <view class="list-title">{{ item.title }}</view>
            <view class="list-sub">{{ item.address }}</view>
            <view class="list-meta">{{ item.time || '--' }} · {{ item.riskLevel || '--' }}</view>
          </view>
        </view>
      </view>

      <view v-else>
        <view class="empty">暂无内容</view>
      </view>
    </view>

    <view class="action-bar" v-if="actionVisible">
      <button type="primary" class="action-btn" @click="handleAction">{{ actionLabel }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, getPlaceVisits, getIncidents } from '@/common/database.js';

const placeId = ref('');
const place = ref(null);
const profile = ref(null);
const visits = ref([]);
const incidents = ref([]);
const activeTab = ref('');

const managerName = computed(() => place.value?.managerName || place.value?.manager?.name || '');
const managerPhone = computed(() => place.value?.managerPhone || place.value?.manager?.phone || '');

const tags = computed(() => {
  const list = [];
  if (place.value?.focusLevel === '重点') list.push('重点场所');
  if (profile.value?.primary?.riskGambleFlag) list.push('涉赌风险');
  (place.value?.modules || []).forEach((m) => list.push(moduleLabel(m)));
  return Array.from(new Set(list));
});
const tagList = computed(() => tags.value.map((t) => ({ tag: t })));

const actionLabel = computed(() => {
  if (activeTab.value === 'records') return '新增走访';
  if (activeTab.value === 'archive') return '新增档案';
  if (activeTab.value === 'incidents') return '新增关联警情';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

const tabs = computed(() => ([
  { key: 'records', label: '检查记录', icon: '📋', badge: visits.value.length || '' },
  { key: 'archive', label: '档案', icon: '📁', badge: '' },
  { key: 'incidents', label: '关联警情', icon: '📌', badge: incidents.value.length || '' },
]));

const isTabScrollable = computed(() => tabs.value.length > 4);

const mockRecords = [
  {
    visitId: 'mock-1',
    content: '检查消防通道，未发现安全隐患。',
    visitType: '例行检查',
    visitAt: '2025-09-18 10:20',
    visitorName: '张三、李四',
  },
  {
    visitId: 'mock-2',
    content: '核验证照信息，档案齐全。',
    visitType: '证照核验',
    visitAt: '2025-09-05 15:10',
    visitorName: '王五',
  },
  {
    visitId: 'mock-3',
    content: '检查营业秩序，发现轻微噪音问题。',
    visitType: '专项检查',
    visitAt: '2025-08-28 20:30',
    visitorName: '赵六',
  },
];

const recordList = computed(() => (visits.value.length ? visits.value : mockRecords));
const archiveItems = computed(() => buildArchiveItems());

// 加载场所、档案、走访与关联警情数据
function loadData() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  visits.value = getPlaceVisits().filter((v) => v.placeId === placeId.value).sort((a, b) => (a.visitAt < b.visitAt ? 1 : -1));
  incidents.value = getIncidents().slice(0, 4);
}

watch(tabs, (list) => {
  if (!list.length) return;
  if (!list.find((t) => t.key === activeTab.value)) {
    activeTab.value = list[0].key;
  }
}, { immediate: true });

// 映射模块类型到中文名称
function moduleLabel(type) {
  const map = { BILLIARD: '台球', CHESS_CARD: '棋牌', NETBAR: '网吧', FOOTBATH: '足浴', KTV: 'KTV' };
  return map[type] || type;
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
    payload: item,
  })) : buildFallbackArchives().map((item) => ({
    id: item.id,
    itemType: 'LICENSE',
    title: item.title,
    subTitle: item.docNo ? `编号：${item.docNo}` : '编号：—',
    rightText: item.dueDate || '',
    payload: item,
  }));
  items.push(...licenseItems);

  items.push({
    id: 'basic_info',
    itemType: 'BASIC',
    title: '基础信息',
    subTitle: `麻将台 ${primary.mahjongTableCount || '--'}｜棋牌包间 ${primary.chessRoomCount || '--'}｜涉赌 ${primary.riskGambleFlag ? '是' : '否'}｜营业 ${primary.businessHours || '--'}`,
    rightText: '',
    payload: {
      mahjongTableCount: primary.mahjongTableCount,
      chessRoomCount: primary.chessRoomCount,
      riskGambleFlag: primary.riskGambleFlag,
      businessHours: primary.businessHours,
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
      payload: data,
    });
  });
  return items;
}

function moduleSubTitle(type, data) {
  if (!data || Object.keys(data).length === 0) return '待完善';
  if (type === 'CHESS_CARD') return `麻将台 ${data.mahjongTableCount ?? '--'}｜棋牌包间 ${data.chessRoomCount ?? '--'}`;
  if (type === 'BILLIARD') return `台球桌 ${data.tableCount ?? '--'}`;
  if (type === 'NETBAR') return `机位 ${data.seatCount ?? '--'}`;
  if (type === 'FOOTBATH') return `包间 ${data.roomCount ?? '--'}｜从业 ${data.staffCount ?? '--'}`;
  return '待完善';
}

function daysTo(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  const target = new Date(`${dateStr} 00:00:00`);
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function dueClass(dateStr) {
  const days = daysTo(dateStr);
  if (days <= 7) return 'infoValueDanger';
  if (days <= 30) return 'infoValueWarning';
  return '';
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

// 生成模块摘要字段用于展示
function moduleSummary(tabKey) {
  if (!tabKey.startsWith('module_')) return [];
  const type = tabKey.replace('module_', '');
  const data = profile.value?.modules?.[type];
  if (!data) return [];
  if (type === 'BILLIARD') return [{ label: '台球桌数', value: data.tableCount || 0 }, { label: '营业时间', value: data.businessHours || '--' }];
  if (type === 'CHESS_CARD') return [{ label: '麻将台数', value: data.mahjongTableCount || 0 }, { label: '棋牌包间', value: data.chessRoomCount || 0 }];
  if (type === 'NETBAR') return [{ label: '机位数', value: data.seatCount || 0 }, { label: '实名系统', value: data.realNameSystem || '--' }];
  if (type === 'FOOTBATH') return [{ label: '包间数', value: data.roomCount || 0 }, { label: '从业人数', value: data.staffCount || 0 }];
  return [];
}

// 跳转到对应模块详情页
function goModule(tabKey) {
  if (!tabKey.startsWith('module_')) return;
  const type = tabKey.replace('module_', '');
  const map = {
    BILLIARD: '/pages/place/modules/billiard',
    CHESS_CARD: '/pages/place/modules/chessCard',
    NETBAR: '/pages/place/modules/netbar',
    FOOTBATH: '/pages/place/modules/footbath',
  };
  const base = map[type];
  if (!base) {
    uni.showToast({ title: '暂无模块页', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `${base}?placeId=${placeId.value}` });
}

// 底部主按钮动作分发
function handleAction() {
  if (activeTab.value === 'records') {
    goVisit();
    return;
  }
  if (activeTab.value === 'archive') {
    uni.showToast({ title: '新增档案', icon: 'none' });
    return;
  }
  if (activeTab.value === 'incidents') {
    uni.showToast({ title: '新增关联警情', icon: 'none' });
    return;
  }
}

// 跳转新增走访页面
function goVisit() {
  uni.navigateTo({ url: `/pages/place/visit/add?placeId=${placeId.value}` });
}

// 跳转派单创建页并带入场所来源
function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}` });
}

// 拨打电话
function callPhone(phone) {
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone });
}

// 复制场所地址
function copyAddress() {
  if (!place.value?.address) return;
  uni.setClipboardData({ data: place.value.address });
}

// 查看走访/检查记录详情
function openRecord(item) {
  uni.showModal({ title: '检查记录', content: item.content || '--', showCancel: false });
}

// 查看关联警情摘要
function openIncident(item) {
  uni.showModal({ title: '关联警情', content: item.title || '--', showCancel: false });
}

function openArchive(item) {
  uni.navigateTo({ url: `/pages/place/archive/detail?placeId=${placeId.value}&itemId=${item.id}` });
}

onLoad((query) => {
  placeId.value = query.placeId || '';
});
onShow(loadData);
</script>

<style lang="scss" scoped>
.place-detail {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 16rpx;
}
.header-card {
  padding: 20rpx;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}
.place-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2b3a;
}
.place-sub {
  margin-top: 6rpx;
  color: #6e7a89;
  font-size: 24rpx;
}
.header-actions {
  display: flex;
  gap: 8rpx;
}
.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx 20rpx;
}
.info-item {
  display: flex;
  flex-direction: column;
}
.info-line {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
}
.label {
  color: #6b7785;
  font-size: 24rpx;
}
.value {
  color: #1f2b3a;
  font-size: 26rpx;
}
.value.link {
  color: #0f75ff;
}
.chips {
  margin-top: 12rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}
.chip {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  font-size: 22rpx;
  color: #344150;
}
.iconTabs {
  display: flex;
  gap: 12rpx;
  padding: 6rpx 6rpx 12rpx;
}
.iconTabsScroll {
  padding: 6rpx 6rpx 12rpx;
  white-space: nowrap;
}
.iconTabItem,
.iconTabItemFixed {
  background: #f6f8fb;
  border-radius: 16rpx;
  padding: 12rpx;
  text-align: center;
  position: relative;
}
.iconTabItem {
  flex: 1;
  min-width: 0;
}
.iconTabItemFixed {
  display: inline-block;
  width: 180rpx;
  margin-right: 12rpx;
}
.iconTabActive {
  background: #eaf3ff;
  color: #0f75ff;
}
.iconTabIcon {
  font-size: 32rpx;
  display: block;
}
.iconTabLabel {
  font-size: 24rpx;
  margin-top: 4rpx;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.iconTabBadge {
  position: absolute;
  top: -6rpx;
  right: 18rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  border-radius: 12rpx;
  padding: 2rpx 8rpx;
}
.tab-card {
  padding: 10rpx 18rpx 18rpx;
}
.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10rpx;
}
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx 24rpx;
  background: #fff;
  border-top: 1px solid #eef1f4;
}
.action-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
}
.list-item {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1px solid #f1f3f5;
}
.list-item:last-child {
  border-bottom: none;
}
.listItem {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1px solid #f1f3f5;
}
.listItem:last-child {
  border-bottom: none;
}
.listItemContent {
  flex: 1;
}
.listItemTitle {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2b3a;
  display: flex;
  gap: 8rpx;
  align-items: center;
}
.listItemMeta {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6e7a89;
  display: flex;
  justify-content: space-between;
}
.thumb {
  width: 90rpx;
  height: 90rpx;
  border-radius: 12rpx;
  background: #e9edf2;
}
.list-body {
  flex: 1;
}
.list-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2b3a;
}
.list-sub {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6e7a89;
}
.list-meta {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #9aa3af;
}
.info-card {
  background: #f6f8fb;
  border-radius: 14rpx;
  padding: 14rpx;
}
.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.infoValue {
  color: #1f2b3a;
  font-size: 24rpx;
}
.infoValueWarning {
  color: #c88719;
}
.infoValueDanger {
  color: #d64545;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 20rpx 0;
}
</style>
