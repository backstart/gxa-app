<template>
  <AppPage>
    <view class="place-detail pageBg">
      <AppHeaderCard
        v-if="place"
        :title="place.name"
        subTitle="出租屋"
        :infoRows="headerInfoRows"
        :tags="tags"
      />

      <AppIconTabs :tabs="tabs" v-model:activeKey="activeTab" />

      <view class="card tab-card">
        <view v-if="activeTab === 'rooms'">
          <view class="room-grid">
            <view
              v-for="room in rooms"
              :key="room.roomNo"
              :class="['room-card', room.occupied && !room.registered ? 'warn' : '']"
              @click="showRoom(room)"
            >
              <view class="room-no">{{ room.roomNo }}</view>
              <view class="room-meta">{{ room.occupied ? '已入住' : '空置' }}</view>
              <view class="room-meta">{{ room.tenantMasked || '--' }}</view>
              <view class="room-badge">{{ room.registered ? '已登记' : '未登记' }}</view>
            </view>
          </view>
        </view>

        <view v-else-if="activeTab === 'records'">
          <AppEmpty v-if="recordList.length === 0" text="暂无走访记录" />
          <AppListItem
            v-for="item in recordList"
            :key="item.visitId"
            :title="item.content"
            :subTitle="`类型：${item.visitType || '走访'}`"
            :meta="`${item.visitAt} · ${item.visitorName || '--'}`"
            leftImage="/static/logo.png"
            @click="openRecord(item)"
          />
        </view>

        <view v-else-if="activeTab === 'staff'">
          <view class="tabActionBar stats">
            <text>总人数 {{ staffStats.total }}</text>
            <text>在岗 {{ staffStats.onJob }}</text>
            <text>离职 {{ staffStats.offJob }}</text>
          </view>
          <AppEmpty v-if="staffList.length === 0" text="暂无人员信息" />
          <AppListItem
            v-for="item in staffList"
            :key="item.id"
            :title="item.name"
            :leftImage="item.thumb"
            @click="openStaff(item)"
          >
            <template #titleExtra>
              <text class="placeTag placeTagPrimary">{{ item.staffType }}</text>
              <text :class="['placeTag', statusTagClass(item.status)]">{{ item.status }}</text>
            </template>
            <view class="listItemMeta">
              <text class="link" @click.stop="callPhone(item.phone)">{{ item.phone || '--' }}</text>
              <text>证件 {{ item.idNoMasked || '--' }}</text>
            </view>
          </AppListItem>
        </view>

        <view v-else-if="activeTab === 'archive'">
          <AppEmpty v-if="archiveItems.length === 0" text="暂无档案" />
          <AppListItem
            v-for="item in archiveItems"
            :key="item.id"
            :title="item.title"
            :showLeftImage="false"
            @click="openArchive(item)"
          >
            <template #titleExtra>
              <text v-if="item.itemType === 'MODULE'" class="placeTag placeTagPrimary">模块</text>
            </template>
            <view class="listItemMeta">
              <text>{{ item.subTitle }}</text>
              <text v-if="item.rightText" :class="['infoValue', dueClass(item.rightText)]">{{ item.rightText }}</text>
            </view>
          </AppListItem>
        </view>

        <view v-else-if="activeTab === 'incidents'">
          <AppEmpty v-if="incidents.length === 0" text="暂无关联警情" />
          <AppListItem
            v-for="item in incidents"
            :key="item.id"
            :title="item.title"
            :subTitle="item.address"
            :meta="`${item.time || '--'} · ${item.riskLevel || '--'}`"
            leftImage="/static/logo.png"
            @click="openIncident(item)"
          />
        </view>

        <view v-else>
          <AppEmpty text="暂无内容" />
        </view>
      </view>

      <AppBottomBar v-if="actionVisible" :label="actionLabel" @click="handleAction" />
    </view>
  </AppPage>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, getPlaceVisits, getIncidents, updateProfile } from '@/common/database.js';
import AppPage from '@/components/app/AppPage.vue';
import AppHeaderCard from '@/components/app/AppHeaderCard.vue';
import AppIconTabs from '@/components/app/AppIconTabs.vue';
import AppListItem from '@/components/app/AppListItem.vue';
import AppEmpty from '@/components/app/AppEmpty.vue';
import AppBottomBar from '@/components/app/AppBottomBar.vue';

const placeId = ref('');
const place = ref(null);
const profile = ref(null);
const visits = ref([]);
const incidents = ref([]);
const activeTab = ref('');

const rooms = computed(() => profile.value?.primary?.rooms || []);
const managerName = computed(() => place.value?.managerName || place.value?.manager?.name || '');
const managerPhone = computed(() => place.value?.managerPhone || place.value?.manager?.phone || '');
const staffList = computed(() => {
  const members = profile.value?.primary?.staffMembers || [];
  return members.map((item) => ({
    id: item.id,
    name: item.name,
    staffType: item.staffType || '其他',
    status: item.status || '在岗',
    phone: item.phone || '',
    idNoMasked: item.idNoMasked || '',
    thumb: (item.portraitPhotos && item.portraitPhotos[0]) || '/static/logo.png',
  }));
});
const staffStats = computed(() => ({
  total: staffList.value.length,
  onJob: staffList.value.filter((s) => s.status === '在岗').length,
  offJob: staffList.value.filter((s) => s.status === '离职').length,
}));

const tags = computed(() => {
  const list = [];
  if (place.value?.focusLevel === '重点') list.push('重点场所');
  (place.value?.modules || []).forEach((m) => list.push(moduleLabel(m)));
  return Array.from(new Set(list));
});
const headerInfoRows = computed(() => {
  const rows = [
    { label: '负责人', value: place.value?.ownerName || '--' },
    { label: '电话', value: place.value?.ownerPhone || '--' },
  ];
  if (managerName.value) rows.push({ label: '管理员', value: managerName.value });
  if (managerPhone.value) rows.push({ label: '电话', value: managerPhone.value });
  rows.push({ label: '地址', value: place.value?.address || '--' });
  rows.push({ label: '最近走访', value: place.value?.lastVisitAt || '暂无记录' });
  return rows;
});

const actionLabel = computed(() => {
  if (activeTab.value === 'rooms') return '新增房间';
  if (activeTab.value === 'records') return '新增走访';
  if (activeTab.value === 'staff') return '新增人员';
  if (activeTab.value === 'archive') return '新增档案';
  if (activeTab.value === 'incidents') return '新增关联警情';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

const tabs = computed(() => {
  const base = [
    { key: 'rooms', label: '房间', icon: '🏠', badge: rooms.value.length || '' },
    { key: 'records', label: '走访记录', icon: '📋', badge: visits.value.length || '' },
    { key: 'staff', label: '人员信息', icon: '👥', badge: staffList.value.length || '' },
    { key: 'archive', label: '档案', icon: '📁', badge: '' },
    { key: 'incidents', label: '关联警情', icon: '📌', badge: incidents.value.length || '' },
  ];
  return base;
});

const mockRecords = [
  {
    visitId: 'mock-1',
    content: '入户登记核查，发现1户信息需补录。',
    visitType: '例行走访',
    visitAt: '2025-09-17 09:40',
    visitorName: '张三',
  },
  {
    visitId: 'mock-2',
    content: '租住情况复核，住户信息一致。',
    visitType: '信息核查',
    visitAt: '2025-09-03 15:20',
    visitorName: '李四',
  },
  {
    visitId: 'mock-3',
    content: '消防设施检查，通道畅通。',
    visitType: '安全检查',
    visitAt: '2025-08-26 19:05',
    visitorName: '王五',
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
    subTitle: `房间 ${primary.roomsCount ?? rooms.value.length}｜备案 ${primary.recordStatus || '--'}｜房东 ${primary.landlordName || primary.landlord || '--'}｜楼栋 ${primary.building || '--'}`,
    rightText: '',
    payload: {
      landlordName: primary.landlordName || primary.landlord,
      landlordPhone: primary.landlordPhone,
      recordStatus: primary.recordStatus,
      building: primary.building,
      unit: primary.unit,
      floor: primary.floor,
      roomsCount: primary.roomsCount ?? rooms.value.length,
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
  if (activeTab.value === 'rooms') {
    uni.showToast({ title: '新增房间', icon: 'none' });
    return;
  }
  if (activeTab.value === 'records') {
    goVisit();
    return;
  }
  if (activeTab.value === 'staff') {
    uni.navigateTo({ url: `/pages/place/staff/edit?placeId=${placeId.value}&mode=add` });
    return;
  }
  if (activeTab.value === 'archive') {
    uni.navigateTo({ url: `/pages/place/archive/edit?placeId=${placeId.value}&mode=add` });
    return;
  }
  if (activeTab.value === 'incidents') {
    uni.showToast({ title: '新增关联警情', icon: 'none' });
    return;
  }
}

// 写回房间信息变更
function updateRooms(roomsValue) {
  updateProfile(placeId.value, { primary: { rooms: roomsValue } });
  if (profile.value?.primary) profile.value.primary.rooms = roomsValue;
}

// 显示房间详情并允许快捷修改
function showRoom(room) {
  uni.showActionSheet({
    itemList: ['切换入住状态', '切换登记状态'],
    success: (res) => {
      const roomsValue = rooms.value.map((r) => ({ ...r }));
      const idx = roomsValue.findIndex((r) => r.roomNo === room.roomNo);
      if (idx < 0) return;
      if (res.tapIndex === 0) roomsValue[idx].occupied = !roomsValue[idx].occupied;
      if (res.tapIndex === 1) roomsValue[idx].registered = !roomsValue[idx].registered;
      updateRooms(roomsValue);
    },
  });
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

// 查看走访记录详情
function openRecord(item) {
  uni.showModal({ title: '走访记录', content: item.content || '--', showCancel: false });
}

function openStaff(item) {
  uni.navigateTo({ url: `/pages/place/staff/detail?placeId=${placeId.value}&staffId=${item.id}` });
}

// 查看关联警情摘要
function openIncident(item) {
  uni.showModal({ title: '关联警情', content: item.title || '--', showCancel: false });
}

function openArchive(item) {
  if (item.itemType === 'BASIC') {
    uni.navigateTo({ url: `/pages/place/basic/detail?placeId=${placeId.value}` });
    return;
  }
  uni.navigateTo({ url: `/pages/place/archive/detail?placeId=${placeId.value}&itemId=${item.id}` });
}

function statusTagClass(status) {
  if (status === '在岗') return 'placeTagNormal';
  if (status === '离职') return 'placeTagWarning';
  if (status === '请假') return 'placeTagPrimary';
  return 'placeTagWarning';
}

onLoad((query) => {
  placeId.value = query.placeId || '';
});
onShow(loadData);
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.place-detail {
  padding: 0 24rpx 140rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 16rpx;
}
.link {
  color: #0f75ff;
}
.tab-card {
  padding: 10rpx 18rpx 18rpx;
}
.tabActionBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  margin-bottom: 10rpx;
}
.tabActionBar.stats {
  justify-content: flex-start;
  color: #6e7a89;
  font-size: 24rpx;
  gap: 20rpx;
}
.room-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}
.room-card {
  background: #f6f8fb;
  border-radius: 12rpx;
  padding: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}
.room-card.warn {
  background: #fff2f0;
}
.room-no {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2b3a;
}
.room-meta {
  font-size: 24rpx;
  color: #6e7a89;
  margin-top: 4rpx;
}
.room-badge {
  margin-top: 6rpx;
  display: inline-block;
  padding: 4rpx 8rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  background: #eaf3ff;
  color: #0f75ff;
}
.placeTag {
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
}
.placeTagPrimary {
  background: #eaf3ff;
  color: #0f75ff;
}
.placeTagNormal {
  background: #e6f7ed;
  color: #1b9d5d;
}
.placeTagWarning {
  background: #fff6e6;
  color: #c88719;
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
</style>

