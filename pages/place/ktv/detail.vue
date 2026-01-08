<template>
  <view class="place-detail pageBg">
    <view class="statuBar"></view>

    <view class="card header-card" v-if="place">
      <view class="header-top">
        <view>
          <view class="place-name">{{ place.name }}</view>
          <view class="place-sub">KTV/夜场</view>
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
        <view class="tab-actions">
          <button size="mini" class="ghost-btn" @click="goVisit">新增走访</button>
        </view>
        <view v-if="recordList.length === 0" class="empty">暂无检查记录</view>
        <view v-for="item in recordList" :key="item.id" class="list-item" @click="openRecord(item)">
          <image class="thumb" :src="item.img" mode="aspectFill"></image>
          <view class="list-body">
            <view class="list-title">{{ item.title }}</view>
            <view class="list-sub">{{ item.maintxt }}</view>
            <view class="list-meta">检查时间：{{ item.time }} · 人员：{{ item.inspector }}</view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'staff'">
        <view class="tab-actions">
          <button size="mini" class="ghost-btn">新增人员</button>
        </view>
        <view v-if="staffList.length === 0" class="empty">暂无从业人员信息</view>
        <view v-for="item in staffList" :key="item.id" class="list-item" @click="openStaff(item)">
          <image class="thumb" :src="item.thumb" mode="aspectFill"></image>
          <view class="list-body">
            <view class="list-title">{{ item.name }}</view>
            <view class="list-sub">{{ item.role }}</view>
            <view class="list-meta">登记时间：{{ item.time }}</view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'archive'">
        <view class="tab-actions">
          <button size="mini" class="ghost-btn">新增档案</button>
        </view>
        <view v-if="archiveList.length === 0" class="empty">暂无档案</view>
        <view v-for="item in archiveList" :key="item.id" class="list-item" @click="openArchive(item)">
          <image class="thumb" :src="item.img" mode="aspectFill"></image>
          <view class="list-body">
            <view class="list-title">{{ item.title }}</view>
            <view class="list-sub">{{ item.maintxt }}</view>
          </view>
        </view>
        <view class="info-card">
          <view class="info-row"><text class="label">营业执照</text><text class="value">{{ profile?.primary.businessLicenseNo || '--' }}</text></view>
          <view class="info-row"><text class="label">到期</text><text :class="['value', dueClass(profile?.primary.businessLicenseDue)]">{{ profile?.primary.businessLicenseDue || '--' }}</text></view>
          <view class="info-row"><text class="label">特行许可</text><text class="value">{{ profile?.primary.specialLicenseNo || '--' }}</text></view>
          <view class="info-row"><text class="label">到期</text><text :class="['value', dueClass(profile?.primary.specialLicenseDue)]">{{ profile?.primary.specialLicenseDue || '--' }}</text></view>
          <view class="info-row"><text class="label">消防检查</text><text class="value">{{ profile?.primary.fireCheckDate || '--' }}</text></view>
          <view class="info-row"><text class="label">包厢数</text><text class="value">{{ profile?.primary.roomCount || '--' }}</text></view>
          <view class="info-row"><text class="label">营业时间</text><text class="value">{{ profile?.primary.businessHours || '--' }}</text></view>
          <view class="info-row"><text class="label">安保人数</text><text class="value">{{ profile?.primary.securityCount || '--' }}</text></view>
          <view class="info-row"><text class="label">风险标记</text><text class="value">{{ riskFlagsText }}</text></view>
        </view>
      </view>

      <view v-else-if="activeTab === 'incidents'">
        <view v-if="incidents.length === 0" class="empty">暂无关联警情</view>
        <view v-for="item in incidents" :key="item.id" class="list-item" @click="openIncident(item)">
          <image class="thumb" src="/static/venue/关联警情.png" mode="aspectFill"></image>
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

const riskFlagsText = computed(() => {
  const list = profile.value?.primary?.riskFlags || [];
  return list.length ? list.join(' / ') : '--';
});

const staffList = computed(() => {
  const count = profile.value?.primary?.securityCount || 0;
  const list = [];
  const total = Math.min(count || 0, 6);
  for (let i = 0; i < total; i += 1) {
    list.push({
      id: `staff-${i}`,
      name: `安保${i + 1}号`,
      role: '安保人员',
      thumb: '/static/venue/人员信息.png',
      time: '2025-09-01',
    });
  }
  return list;
});

const tags = computed(() => {
  const list = [];
  if (place.value?.focusLevel === '重点') list.push('重点场所');
  if (place.value?.focusLevel === '最小应急单位') list.push('最小应急单位');
  (profile.value?.primary?.riskFlags || []).forEach((t) => list.push(t));
  (place.value?.modules || []).forEach((m) => list.push(moduleLabel(m)));
  return Array.from(new Set(list));
});

const tagList = computed(() => tags.value.map((t) => ({ tag: t })));

const recordList = computed(() =>
  (visits.value.length ? visits.value : mockRecords).map((item, idx) => ({
    id: item.visitId || `record-${idx}`,
    title: item.title || '检查记录',
    maintxt: item.content || '暂无描述',
    img: '/static/venue/检查记录.png',
    time: item.visitAt || '--',
    inspector: item.visitorName || '--',
  }))
);

const mockRecords = [
  {
    visitId: 'mock-1',
    title: '安全检查',
    content: '抽查包厢与消防通道，未发现安全隐患。',
    visitAt: '2025-09-17 10:20',
    visitorName: '张三、李四',
  },
  {
    visitId: 'mock-2',
    title: '证照核验',
    content: '证照信息齐全，特行许可未到期。',
    visitAt: '2025-09-05 15:10',
    visitorName: '王五',
  },
  {
    visitId: 'mock-3',
    title: '未成年人排查',
    content: '未发现未成年人入内，登记台账完整。',
    visitAt: '2025-08-28 20:30',
    visitorName: '赵六',
  },
];

const archiveList = computed(() => [
  {
    id: 'archive-1',
    title: '营业执照',
    maintxt: `编号：${profile.value?.primary.businessLicenseNo || '--'}，到期：${profile.value?.primary.businessLicenseDue || '--'}`,
    img: '/static/venue/档案.png',
  },
  {
    id: 'archive-2',
    title: '特行许可',
    maintxt: `编号：${profile.value?.primary.specialLicenseNo || '--'}，到期：${profile.value?.primary.specialLicenseDue || '--'}`,
    img: '/static/venue/档案.png',
  },
  {
    id: 'archive-3',
    title: '消防检查',
    maintxt: `检查日期：${profile.value?.primary.fireCheckDate || '--'}`,
    img: '/static/venue/档案.png',
  },
]);

const tabs = computed(() => {
  const base = [
    { key: 'records', label: '检查记录', icon: '📋', badge: visits.value.length || '' },
    { key: 'staff', label: '从业人员', icon: '👥', badge: staffList.value.length || '' },
    { key: 'archive', label: '档案', icon: '📁', badge: expiringCount.value || '' },
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

const expiringCount = computed(() => {
  const dates = [profile.value?.primary?.businessLicenseDue, profile.value?.primary?.specialLicenseDue].filter(Boolean);
  return dates.filter((d) => daysTo(d) <= 30).length;
});

const actionLabel = computed(() => {
  if (activeTab.value === 'records') return '新增走访';
  if (activeTab.value === 'staff') return '新增从业人员';
  if (activeTab.value === 'archive') return '新增档案';
  if (activeTab.value === 'incidents') return '新增关联警情';
  if (activeTab.value.startsWith('module_')) return '完善模块信息';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

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

function goVisit() {
  uni.navigateTo({ url: `/pages/place/visit/add?placeId=${placeId.value}` });
}

function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}` });
}

function handleAction() {
  if (activeTab.value === 'records') {
    goVisit();
    return;
  }
  if (activeTab.value === 'staff') {
    uni.showToast({ title: '新增从业人员', icon: 'none' });
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

function callPhone(phone) {
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone });
}

function copyAddress() {
  if (!place.value?.address) return;
  uni.setClipboardData({ data: place.value.address });
}

function openRecord(item) {
  uni.showModal({ title: item.title || '检查记录', content: item.maintxt || '--', showCancel: false });
}

function openStaff(item) {
  uni.showModal({ title: item.name || '从业人员', content: item.role || '--', showCancel: false });
}

function openArchive(item) {
  uni.showModal({ title: item.title || '档案', content: item.maintxt || '--', showCancel: false });
}

function openIncident(item) {
  uni.showModal({ title: '关联警情', content: item.title || '--', showCancel: false });
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
  if (days <= 7) return 'danger';
  if (days <= 30) return 'warn';
  return '';
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
.info-row .value.warn {
  color: #c88719;
}
.info-row .value.danger {
  color: #d64545;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 20rpx 0;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10rpx 20rpx 26rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
}

.action-btn {
  width: 100%;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}
</style>
