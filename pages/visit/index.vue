<template>
  <AppPage>
    <view class="visit-index">
      <!-- 搜索栏作为首屏起点，符合“打开就能搜”的手机端心智 -->
      <view class="search-row">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="姓名/证件后四位/地址/责任民警"
          placeholder-class="search-ph"
          confirm-type="search"
          @confirm="reloadPageData"
        />
        <text class="search-btn" @tap="reloadPageData">搜索</text>
      </view>

      <!-- 功能入口行：参考详情页按钮行样式，仅保留“统计/草稿箱”两项 -->
      <view class="quick-row">
        <view class="quick-btn" hover-class="quick-btn-hover" @tap="goDashboard">
          <image class="quick-icon" src="/static/icons/stats.png" mode="aspectFit" />
          <text class="quick-text">统计</text>
        </view>
        <view class="quick-btn" hover-class="quick-btn-hover" @tap="goUnlinked">
          <image class="quick-icon" src="/static/icons/archive.png" mode="aspectFit" />
          <text class="quick-text">草稿箱</text>
          <text v-if="draftBoxCount > 0" class="quick-badge">{{ draftBoxCount }}</text>
        </view>
      </view>

      <!-- 对象类型切换保持不变：人员/场所共用同一套列表渲染 -->
      <view class="segment-wrap">
        <view
          :class="['segment-item', currentType === 'person' ? 'active' : '']"
          @tap="switchType('person')"
        >
          人员走访
        </view>
        <view
          :class="['segment-item', currentType === 'place' ? 'active' : '']"
          @tap="switchType('place')"
        >
          场所走访
        </view>
      </view>

      <!-- 四张统计卡：作为唯一视角切换入口，替代文字Tab -->
      <view class="summary-row">
        <view :class="['summary-card', currentView === 'today' ? 'active' : '']" @tap="switchView('today')">
          <text class="summary-label">今日</text>
          <text class="summary-value">{{ counts.today }}</text>
        </view>
        <view :class="['summary-card', currentView === 'overdue' ? 'active' : '']" @tap="switchView('overdue')">
          <text class="summary-label">逾期</text>
          <text class="summary-value danger">{{ counts.overdue }}</text>
        </view>
        <view :class="['summary-card', currentView === 'nearby' ? 'active' : '']" @tap="switchView('nearby')">
          <text class="summary-label">附近</text>
          <text class="summary-value">{{ counts.nearby }}</text>
        </view>
        <view :class="['summary-card', currentView === 'all' ? 'active' : '']" @tap="switchView('all')">
          <text class="summary-label">全部</text>
          <text class="summary-value">{{ counts.all }}</text>
        </view>
      </view>

      <!-- 主列表：手机端改为“点哪条就直接进入详情页新增走访同款页面” -->
      <view class="list-wrap">
        <view v-if="displayList.length === 0" class="empty-text">暂无可走访对象</view>
        <view
          v-for="item in displayList"
          :key="item.objectId"
          class="list-card"
          hover-class="card-hover"
          @tap="tapRow(item)"
        >
          <image class="card-cover" src="/static/logo.png" mode="aspectFill" />
          <view class="card-main">
            <view class="name-row">
              <text class="name">{{ item.name }}</text>
              <text :class="['pill', riskClass(item.riskLevel)]">{{ item.riskLevel || '中' }}</text>
              <text :class="['pill', dueClass(item.dueStatus)]">{{ dueText(item.dueStatus) }}</text>
            </view>
            <text class="sub-line">{{ item.subName || item.objectType || '未知类型' }}</text>
            <view class="addr-row">
              <text class="addr">{{ item.address || '暂无地址' }}</text>
              <text class="distance">{{ distanceText(item.distanceKm) }}</text>
            </view>
            <view class="bottom-row">
              <text class="recent">最近走访：{{ item.lastVisitAt || '暂无' }}</text>
              <!-- 右侧开始按钮与整行点击行为保持一致 -->
              <text class="start-small" @tap.stop="startVisit(item)">开始</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { queryVisitObjects, getVisitQueue } from '@/common/database.js';
import { riskClass } from './helper.js';
import { getVisitStartUrl } from '@/common/routes/visit.js';

const keyword = ref('');
const currentType = ref('person');
const currentView = ref('today');
const tabSpecifiedByRoute = ref(false);
const uploadQueue = ref([]);

// 当前筛选条件仍保留在页面层，便于后续接入抽屉筛选而不改数据结构
const activeFilter = reactive({
  area: 'ALL',
  category: 'ALL',
  risk: 'ALL',
  status: 'ALL',
  officer: 'ALL',
});

const allObjects = ref([]);

// 草稿箱数量：统计“待上传/上传失败”队列，便于手动上传重试
const draftBoxCount = computed(() =>
  uploadQueue.value.filter((item) => ['pending', 'failed'].includes(String(item.status || ''))).length
);

const typedObjects = computed(() => {
  if (currentType.value === 'person') return allObjects.value.filter((item) => item.objectSource === 'PERSON');
  return allObjects.value.filter((item) => item.objectSource === 'PLACE');
});

const filteredObjects = computed(() => {
  return typedObjects.value.filter((item) => {
    if (keyword.value.trim()) {
      const text = `${item.name}|${item.address}|${item.officerName}|${item.subName}`.toLowerCase();
      if (!text.includes(keyword.value.trim().toLowerCase())) return false;
    }
    if (activeFilter.area !== 'ALL' && item.area !== activeFilter.area) return false;
    if (activeFilter.category !== 'ALL' && (item.subName || item.objectType) !== activeFilter.category) return false;
    if (activeFilter.risk !== 'ALL' && item.riskLevel !== activeFilter.risk) return false;
    if (activeFilter.officer !== 'ALL' && (item.officerName || '') !== activeFilter.officer) return false;
    if (activeFilter.status !== 'ALL' && item.dueStatus !== activeFilter.status) return false;
    return true;
  });
});

const todayList = computed(() =>
  filteredObjects.value.filter((item) => item.dueStatus === 'today' || item.dueStatus === 'upcoming' || item.visitStatus === 'todo' || item.visitStatus === 'doing')
);
const overdueList = computed(() => filteredObjects.value.filter((item) => item.dueStatus === 'overdue' || item.visitStatus === 'overdue'));
const nearbyList = computed(() => filteredObjects.value.slice().sort((a, b) => Number(a.distanceKm || 0) - Number(b.distanceKm || 0)));

const displayList = computed(() => {
  if (currentView.value === 'overdue') return sortByPriority(overdueList.value);
  if (currentView.value === 'nearby') return sortByPriority(nearbyList.value);
  if (currentView.value === 'all') return sortAllList(filteredObjects.value);
  return sortByPriority(todayList.value);
});

const counts = computed(() => ({
  today: todayList.value.length,
  overdue: overdueList.value.length,
  nearby: nearbyList.value.length,
  // 全部卡片数量随当前“人员/场所”类型与搜索条件动态变化
  all: filteredObjects.value.length,
}));

function sortByPriority(list) {
  // 常规视角排序：高风险优先、逾期更久优先、距离更近优先
  const riskRank = { 高: 0, 中: 1, 低: 2 };
  return list.slice().sort((a, b) => {
    const riskA = riskRank[a.riskLevel] ?? 9;
    const riskB = riskRank[b.riskLevel] ?? 9;
    if (riskA !== riskB) return riskA - riskB;
    const overdueA = calcOverdueDays(a.nextVisitAt);
    const overdueB = calcOverdueDays(b.nextVisitAt);
    if (overdueA !== overdueB) return overdueB - overdueA;
    return Number(a.distanceKm || 999) - Number(b.distanceKm || 999);
  });
}

function sortAllList(list) {
  // “全部”视角排序：逾期优先 -> 高风险优先 -> 逾期天数多优先 -> 距离近优先
  const riskRank = { 高: 0, 中: 1, 低: 2 };
  return list.slice().sort((a, b) => {
    const overdueA = isOverdueItem(a) ? 0 : 1;
    const overdueB = isOverdueItem(b) ? 0 : 1;
    if (overdueA !== overdueB) return overdueA - overdueB;

    const riskA = riskRank[a.riskLevel] ?? 9;
    const riskB = riskRank[b.riskLevel] ?? 9;
    if (riskA !== riskB) return riskA - riskB;

    const daysA = calcOverdueDays(a.nextVisitAt);
    const daysB = calcOverdueDays(b.nextVisitAt);
    if (daysA !== daysB) return daysB - daysA;

    return Number(a.distanceKm || 999) - Number(b.distanceKm || 999);
  });
}

function isOverdueItem(item) {
  // 逾期判定统一封装，避免多个排序分支各写一套规则
  if (!item) return false;
  return item.dueStatus === 'overdue' || item.visitStatus === 'overdue' || calcOverdueDays(item.nextVisitAt) > 0;
}

function calcOverdueDays(nextVisitAt) {
  if (!nextVisitAt) return 0;
  const due = new Date(String(nextVisitAt).slice(0, 10).replace(/-/g, '/'));
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

function reloadPageData() {
  // 保持数据结构不变：仍由 queryVisitObjects 返回对象列表，页面层组合视图
  allObjects.value = queryVisitObjects({
    keyword: '',
    tab: 'ALL',
    area: 'ALL',
    risk: 'ALL',
    status: 'ALL',
    due: 'ALL',
  });
  // 首页角标改读上传队列：网络恢复后可在草稿箱手动上传
  uploadQueue.value = getVisitQueue();
  applyDefaultView();
}

function applyDefaultView() {
  // 默认视角：有逾期优先看逾期，否则看今日
  if (tabSpecifiedByRoute.value) return;
  if (counts.value.overdue > 0 && currentView.value === 'today') currentView.value = 'overdue';
}

function switchType(type) {
  currentType.value = type;
}

function switchView(view) {
  currentView.value = view;
}

function tapRow(item) {
  // 列表卡片交互改为“点即开始”，不再维护选中态
  startVisit(item);
}

function startVisit(item) {
  if (!item) {
    uni.showToast({ title: '暂无可走访对象', icon: 'none' });
    return;
  }
  // 跳转路由统一走公共方法，保证与详情页底部“新增走访/新增回访”同一路由
  const targetType = item.objectSource === 'PERSON' ? 'person' : 'place';
  const url = getVisitStartUrl({ targetType, targetId: item.objectId });
  if (!url) {
    uni.showToast({ title: '未找到走访页面', icon: 'none' });
    return;
  }
  uni.navigateTo({ url });
}

function dueText(status) {
  if (status === 'overdue') return '逾期';
  if (status === 'upcoming') return '临期';
  if (status === 'today') return '今日';
  return '正常';
}

function dueClass(status) {
  if (status === 'overdue') return 'due-overdue';
  if (status === 'upcoming' || status === 'today') return 'due-upcoming';
  return 'due-normal';
}

function distanceText(val) {
  const num = Number(val || 0);
  return Number.isFinite(num) ? `${num.toFixed(1)}km` : '-';
}

function goDashboard() {
  // 统计入口：按钮行直接跳转看板页
  uni.navigateTo({ url: '/pages/visit/dashboard' });
}

function goUnlinked() {
  // 草稿箱入口：集中处理网络失败导致的待上传记录
  uni.navigateTo({ url: '/pages/visit/unlinked' });
}

onLoad((query) => {
  // 支持外部参数：tab=today/overdue/nearby/all, type=person/place
  const tab = String(query?.tab || '');
  const type = String(query?.type || '');
  if (['today', 'overdue', 'nearby', 'all'].includes(tab)) {
    currentView.value = tab;
    tabSpecifiedByRoute.value = true;
  }
  if (['person', 'place'].includes(type)) currentType.value = type;
});

onShow(() => {
  // 每次回到首页都刷新，保证草稿箱角标与列表状态实时
  reloadPageData();
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-index {
  padding: 16rpx 24rpx 28rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 68rpx;
  border-radius: 999rpx;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 26rpx;
  color: #1f2b3a;
}

.search-ph {
  color: #98a2b3;
}

.search-btn {
  min-width: 108rpx;
  text-align: center;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 999rpx;
  background: #1677ff;
  color: #fff;
  font-size: 28rpx;
}

.quick-row {
  margin-top: 14rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.quick-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14rpx;
  padding: 14rpx 10rpx;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-sizing: border-box;
}

.quick-btn-hover {
  opacity: 0.86;
}

.quick-icon {
  width: 34rpx;
  height: 34rpx;
  flex: 0 0 auto;
}

.quick-text {
  font-size: 28rpx;
  color: #1677ff;
  font-weight: 500;
}

.quick-badge {
  position: absolute;
  right: 10rpx;
  top: 8rpx;
  min-width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  border-radius: 999rpx;
  padding: 0 8rpx;
  text-align: center;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  box-sizing: border-box;
}

.segment-wrap {
  margin-top: 14rpx;
  background: #eef2f7;
  border-radius: 14rpx;
  padding: 6rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6rpx;
}

.segment-item {
  text-align: center;
  padding: 12rpx 8rpx;
  font-size: 26rpx;
  color: #4b5563;
  border-radius: 10rpx;
}

.segment-item.active {
  background: #fff;
  color: #1677ff;
  font-weight: 600;
}

.summary-row {
  margin-top: 12rpx;
  /* 统计卡强制单行四列展示，避免再次折成两行 */
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
}

.summary-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12rpx;
  /* 缩小内边距，保证小屏上一行四卡也不拥挤 */
  padding: 10rpx 8rpx;
  box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.summary-card.active {
  background: #eaf3ff;
}

.summary-label {
  display: block;
  font-size: 21rpx;
  color: #6b7785;
  white-space: nowrap;
  text-align: center;
}

.summary-value {
  display: block;
  margin-top: 4rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #1677ff;
  line-height: 1;
  text-align: center;
}

.summary-value.danger {
  color: #d64545;
}

.list-wrap {
  margin-top: 14rpx;
}

.list-card {
  margin-bottom: 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 14rpx;
  display: flex;
  gap: 12rpx;
  box-sizing: border-box;
}

.card-hover {
  opacity: 0.88;
}

.card-cover {
  width: 110rpx;
  height: 110rpx;
  border-radius: 12rpx;
  flex: 0 0 auto;
}

.card-main {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.name {
  flex: 1;
  min-width: 0;
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill {
  flex: 0 0 auto;
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
}

.risk-high {
  color: #d64545;
  background: #ffecec;
}

.risk-mid {
  color: #c88719;
  background: #fff6e6;
}

.risk-low {
  color: #1b9d5d;
  background: #e6f7ed;
}

.due-overdue {
  color: #d64545;
  background: #ffecec;
}

.due-upcoming {
  color: #c88719;
  background: #fff6e6;
}

.due-normal {
  color: #6b7785;
  background: #f4f6f8;
}

.sub-line {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6b7785;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.addr-row {
  margin-top: 4rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.addr {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.distance {
  flex: 0 0 auto;
  font-size: 22rpx;
  color: #6b7785;
}

.bottom-row {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recent {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  color: #8a95a6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.start-small {
  font-size: 24rpx;
  color: #1677ff;
}

.empty-text {
  text-align: center;
  padding: 40rpx 0;
  font-size: 24rpx;
  color: #98a2b3;
}
</style>

