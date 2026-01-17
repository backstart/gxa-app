
<template>
  <AppPage>
    <view class="place-detail pageBg">
      <AppHeaderCard
        v-if="place"
        :title="place.name"
        subTitle="KTV/夜场"
        :infoRows="headerInfoRows"
        :tags="tags"
      />

      <AppIconTabs :tabs="tabs" v-model:activeKey="activeTab" />

      <view class="card tab-card">
        <view v-if="activeTab === 'records'">
          <AppEmpty v-if="recordList.length === 0" text="暂无检查记录" />
          <AppListItem
            v-for="item in recordList"
            :key="item.id"
            :title="item.title"
            :subTitle="item.maintxt"
            :meta="`检查时间：${item.time} · 人员：${item.inspector}`"
            :leftImage="item.img"
            @click="openRecord(item)"
          />
        </view>

        <view v-else-if="activeTab === 'staff'">
          <view class="filterBar">
            <view class="filterItem" @click="toggleFilter('type')">
              <text>{{ staffTypeFilter }}</text>
              <text class="filterArrow">▼</text>
            </view>
            <view class="filterItem" @click="toggleFilter('status')">
              <text>{{ staffStatusFilter }}</text>
              <text class="filterArrow">▼</text>
            </view>
          </view>
          <view v-if="filterOpen" class="filterMask" @click="filterOpen = ''"></view>
          <view v-if="filterOpen" class="filterPanel">
            <view
              v-for="item in filterOptions"
              :key="item"
              class="filterOption"
              @click="selectFilter(item)"
            >
              {{ item }}
            </view>
          </view>
          <view class="tabActionBar stats">
            <text>总人数 {{ staffStats.total }}</text>
            <text>在岗 {{ staffStats.onJob }}</text>
            <text>离职 {{ staffStats.offJob }}</text>
          </view>
          <AppEmpty v-if="filteredStaffList.length === 0" text="暂无人员信息" />
          <AppListItem
            v-for="item in filteredStaffList"
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
import { getPlaces, getPlaceProfiles, getPlaceVisits, getIncidents } from '@/common/database.js';
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

const staffTypeOptions = ['全部', '保安', '前台', '服务员', '经理', '收银', '保洁', '其他'];
const staffStatusOptions = ['全部', '在岗', '离职', '请假', '临时'];
const staffTypeFilter = ref('全部');
const staffStatusFilter = ref('全部');
const filterOpen = ref('');

const filterOptions = computed(() => {
  if (filterOpen.value === 'type') return staffTypeOptions;
  if (filterOpen.value === 'status') return staffStatusOptions;
  return [];
});

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
    idCardPhotos: item.idCardPhotos || [],
    portraitPhotos: item.portraitPhotos || [],
    remark: item.remark || '',
    time: item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 10) : new Date(item.createdAt || Date.now()).toISOString().slice(0, 10),
    thumb: (item.portraitPhotos && item.portraitPhotos[0]) || '/static/logo.png',
  }));
});

const filteredStaffList = computed(() => {
  return staffList.value.filter((item) => {
    const typeOk = staffTypeFilter.value === '全部' || item.staffType === staffTypeFilter.value;
    const statusOk = staffStatusFilter.value === '全部' || item.status === staffStatusFilter.value;
    return typeOk && statusOk;
  });
});

const staffStats = computed(() => {
  const list = staffList.value;
  return {
    total: list.length,
    onJob: list.filter((s) => s.status === '在岗').length,
    offJob: list.filter((s) => s.status === '离职').length,
  };
});

const tags = computed(() => {
  const list = [];
  if (place.value?.focusLevel === '重点') list.push('重点场所');
  if (place.value?.focusLevel === '最小应急单位') list.push('最小应急单位');
  (profile.value?.primary?.riskFlags || []).forEach((t) => list.push(t));
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

const recordList = computed(() =>
  (visits.value.length ? visits.value : mockRecords).map((item, idx) => ({
    id: item.visitId || `record-${idx}`,
    title: item.title || '检查记录',
    maintxt: item.content || '暂无描述',
    img: '/static/logo.png',
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

const archiveItems = computed(() => buildArchiveItems());

const tabs = computed(() => {
  const base = [
    { key: 'records', label: '检查记录', icon: '📋', badge: visits.value.length || '' },
    { key: 'staff', label: '人员信息', icon: '👥', badge: staffList.value.length || '' },
    { key: 'archive', label: '档案', icon: '📁', badge: expiringCount.value || '' },
    { key: 'incidents', label: '关联警情', icon: '📌', badge: incidents.value.length || '' },
  ];
  return base;
});

const expiringCount = computed(() => {
  return archiveItems.value.filter((item) => item.itemType === 'LICENSE' && daysTo(item.rightText) <= 30).length;
});

const actionLabel = computed(() => {
  if (activeTab.value === 'records') return '新增走访';
  if (activeTab.value === 'staff') return '新增人员';
  if (activeTab.value === 'archive') return '新增档案';
  if (activeTab.value === 'incidents') return '新增关联警情';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

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

// 跳转新增走访页面
function goVisit() {
  uni.navigateTo({ url: `/pages/place/visit/add?placeId=${placeId.value}` });
}

// 跳转派单创建页并带入场所来源
function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}` });
}

// 底部主按钮动作分发
function handleAction() {
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

// 拨打电话
function callPhone(phone) {
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone });
}

// 查看走访/检查记录详情
function openRecord(item) {
  uni.showModal({ title: item.title || '检查记录', content: item.maintxt || '--', showCancel: false });
}

// 打开人员操作菜单
function openStaff(item) {
  uni.navigateTo({ url: `/pages/place/staff/detail?placeId=${placeId.value}&staffId=${item.id}` });
}

// 打开档案操作菜单
function openArchive(item) {
  if (item.itemType === 'BASIC') {
    uni.navigateTo({ url: `/pages/place/basic/detail?placeId=${placeId.value}` });
    return;
  }
  uni.navigateTo({ url: `/pages/place/archive/detail?placeId=${placeId.value}&itemId=${item.id}` });
}

// 切换人员筛选下拉
function toggleFilter(key) {
  filterOpen.value = filterOpen.value === key ? '' : key;
}

// 选择人员筛选项并关闭下拉
function selectFilter(item) {
  if (filterOpen.value === 'type') {
    staffTypeFilter.value = item;
  } else if (filterOpen.value === 'status') {
    staffStatusFilter.value = item;
  }
  filterOpen.value = '';
}

// 查看关联警情摘要
function openIncident(item) {
  uni.showModal({ title: '关联警情', content: item.title || '--', showCancel: false });
}

// 构建档案列表项
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
    subTitle: `包厢 ${primary.boxCount ?? primary.roomCount ?? '--'}｜安保 ${primary.securityCount || '--'}｜营业 ${primary.businessHours || '--'}`,
    rightText: '',
    status: '',
    payload: {
      boxCount: primary.boxCount ?? primary.roomCount,
      securityCount: primary.securityCount,
      businessHours: primary.businessHours,
      riskFlags: primary.riskFlags || [],
    },
  });

  const moduleKeys = new Set([
    ...((place.value?.modules || []) || []),
    ...Object.keys(profile.value?.modules || {}),
  ]);
  const moduleList = Array.from(moduleKeys);
  moduleList.forEach((type) => {
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

function moduleSubTitle(type, data) {
  if (!data || Object.keys(data).length === 0) return '待完善';
  if (type === 'CHESS_CARD') {
    const mahjong = data.mahjongTableCount ?? '--';
    const chess = data.chessRoomCount ?? '--';
    return `麻将台 ${mahjong}｜棋牌包间 ${chess}`;
  }
  if (type === 'BILLIARD') {
    const count = data.tableCount ?? '--';
    return `台球桌 ${count}`;
  }
  if (type === 'NETBAR') {
    const count = data.seatCount ?? '--';
    return `机位 ${count}`;
  }
  if (type === 'FOOTBATH') {
    const rooms = data.roomCount ?? '--';
    const staff = data.staffCount ?? '--';
    return `包间 ${rooms}｜从业 ${staff}`;
  }
  return '待完善';
}

function dueStatus(dateStr) {
  if (!dateStr) return '';
  const days = daysTo(dateStr);
  if (days <= 7) return 'danger';
  if (days <= 30) return 'warn';
  return '';
}


// 生成 fallback 档案列表
function buildFallbackArchives() {
  const arr = [];
  arr.push({
    id: 'archive-1',
    title: '营业执照',
    docNo: profile.value?.primary?.businessLicenseNo || '',
    dueDate: profile.value?.primary?.businessLicenseDue || '',
    note: '',
    photos: [],
    docNoText: profile.value?.primary.businessLicenseNo ? `编号：${profile.value?.primary.businessLicenseNo}` : '编号：--',
  });
  arr.push({
    id: 'archive-2',
    title: '特行许可',
    docNo: profile.value?.primary?.specialLicenseNo || '',
    dueDate: profile.value?.primary?.specialLicenseDue || '',
    note: '',
    photos: [],
    docNoText: profile.value?.primary.specialLicenseNo ? `编号：${profile.value?.primary.specialLicenseNo}` : '编号：--',
  });
  return arr;
}

// 返回状态标签样式
function statusTagClass(status) {
  if (status === '在岗') return 'placeTagNormal';
  if (status === '离职') return 'placeTagWarning';
  if (status === '请假') return 'placeTagPrimary';
  return 'placeTagWarning';
}

// 计算距离日期的天数
function daysTo(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  const target = new Date(`${dateStr} 00:00:00`);
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

// 返回到期时间的颜色样式
function dueClass(dateStr) {
  const days = daysTo(dateStr);
  if (days <= 7) return 'infoValueDanger';
  if (days <= 30) return 'infoValueWarning';
  return '';
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
.sectionCard {
  background: #f6f8fb;
  border-radius: 14rpx;
  padding: 14rpx;
  margin-bottom: 12rpx;
}
.infoGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
}
.infoItem {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.infoLabel {
  color: #6b7785;
  font-size: 22rpx;
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
.filterBar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 10rpx;
}
.filterItem {
  flex: 1;
  background: #f6f8fb;
  border-radius: 12rpx;
  padding: 12rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1f2b3a;
  font-size: 24rpx;
}
.filterArrow {
  color: #8a96a3;
  font-size: 20rpx;
}
.filterMask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 20;
}
.filterPanel {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 340rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 12rpx 0;
  z-index: 21;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.12);
}
.filterOption {
  padding: 14rpx 24rpx;
  font-size: 26rpx;
  color: #1f2b3a;
}
.tabFilters {
  display: flex;
  gap: 10rpx;
}
.tabActionBtn {
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 8rpx 14rpx;
  font-size: 24rpx;
  color: #1f2b3a;
}
.tabActionBtn.primary {
  background: #0f75ff;
  color: #fff;
}
.tabActionBtn.ghost {
  background: #fff;
  border: 1px solid #d0d6de;
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
.info-row .value.warn {
  color: #c88719;
}
.info-row .value.danger {
  color: #d64545;
}
</style>

