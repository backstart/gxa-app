<template>
  <view class="place-detail pageBg">
    <view class="statuBar"></view>

    <view class="card header-card" v-if="place">
      <view class="header-top">
        <view>
          <view class="place-name">{{ place.name }}</view>
          <view class="place-sub">网吧</view>
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

    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', activeTab === tab.key ? 'active' : '']"
        @click="activeTab = tab.key"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ tab.label }}</text>
        <text v-if="tab.badge" class="badge">{{ tab.badge }}</text>
      </view>
    </view>

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
        <view class="info-card">
          <view class="info-row"><text class="label">机位数</text><text class="value">{{ profile?.primary.seatCount || '--' }}</text></view>
          <view class="info-row"><text class="label">实名系统</text><text class="value">{{ profile?.primary.realNameSystem || '--' }}</text></view>
          <view class="info-row"><text class="label">未成年人管控</text><text class="value">{{ profile?.primary.minorControl || '--' }}</text></view>
          <view class="info-row"><text class="label">营业时间</text><text class="value">{{ profile?.primary.businessHours || '--' }}</text></view>
          <view class="info-row"><text class="label">监控情况</text><text class="value">{{ profile?.primary.hasCCTV ? '正常' : '缺失' }}</text></view>
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
        <view class="tab-actions">
          <button size="mini" class="ghost-btn" @click="goModule(activeTab)">进入模块详情</button>
        </view>
        <view class="info-card">
          <view class="info-row" v-for="row in moduleSummary(activeTab)" :key="row.label">
            <text class="label">{{ row.label }}</text>
            <text class="value">{{ row.value }}</text>
          </view>
        </view>
        <view v-if="moduleSummary(activeTab).length === 0" class="empty">请完善模块信息</view>
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
  (place.value?.modules || []).forEach((m) => list.push(moduleLabel(m)));
  return Array.from(new Set(list));
});
const tagList = computed(() => tags.value.map((t) => ({ tag: t })));

const actionLabel = computed(() => {
  if (activeTab.value === 'records') return '新增走访';
  if (activeTab.value === 'archive') return '新增档案';
  if (activeTab.value === 'incidents') return '新增关联警情';
  if (activeTab.value.startsWith('module_')) return '完善模块信息';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

const tabs = computed(() => {
  const base = [
    { key: 'records', label: '检查记录', icon: '📋', badge: visits.value.length || '' },
    { key: 'archive', label: '档案', icon: '📁', badge: '' },
    { key: 'incidents', label: '关联警情', icon: '📌', badge: incidents.value.length || '' },
  ];
  const moduleTabs = (place.value?.modules || []).map((m) => ({
    key: `module_${m}`,
    label: moduleLabel(m),
    icon: '🧩',
    badge: '',
  }));
  return [...base, ...moduleTabs];
});

const mockRecords = [
  {
    visitId: 'mock-1',
    content: '实名登记系统正常，抽查无异常。',
    visitType: '例行检查',
    visitAt: '2025-09-16 14:30',
    visitorName: '张三',
  },
  {
    visitId: 'mock-2',
    content: '未成年人管控台账完整。',
    visitType: '专项检查',
    visitAt: '2025-09-02 19:10',
    visitorName: '李四',
  },
  {
    visitId: 'mock-3',
    content: '监控设备运行正常。',
    visitType: '设备巡检',
    visitAt: '2025-08-25 11:40',
    visitorName: '王五',
  },
];

const recordList = computed(() => (visits.value.length ? visits.value : mockRecords));

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

function moduleLabel(type) {
  const map = { BILLIARD: '台球', CHESS_CARD: '棋牌', NETBAR: '网吧', FOOTBATH: '足浴', KTV: 'KTV' };
  return map[type] || type;
}

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
  if (activeTab.value.startsWith('module_')) {
    goModule(activeTab.value);
  }
}

function goVisit() {
  uni.navigateTo({ url: `/pages/place/visit/add?placeId=${placeId.value}` });
}

function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}` });
}

function callPhone(phone) {
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone });
}

function copyAddress() {
  if (!place.value?.address) return;
  uni.setClipboardData({ data: place.value.address });
}

function openRecord(item) {
  uni.showModal({ title: '检查记录', content: item.content || '--', showCancel: false });
}

function openIncident(item) {
  uni.showModal({ title: '关联警情', content: item.title || '--', showCancel: false });
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
.tab-bar {
  display: flex;
  gap: 12rpx;
  padding: 6rpx 6rpx 12rpx;
  overflow-x: auto;
}
.tab-item {
  min-width: 140rpx;
  background: #f6f8fb;
  border-radius: 16rpx;
  padding: 12rpx;
  text-align: center;
  position: relative;
}
.tab-item.active {
  background: #eaf3ff;
  color: #0f75ff;
}
.tab-icon {
  font-size: 32rpx;
  display: block;
}
.tab-label {
  font-size: 24rpx;
  margin-top: 4rpx;
}
.badge {
  position: absolute;
  top: 6rpx;
  right: 10rpx;
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
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 20rpx 0;
}
</style>
