<template>
  <AppPage @scroll="onPageScroll">
    <view class="visit-list pageBg" @tap="handlePageTap">
      <!-- 搜索栏：默认中性色，减少视觉干扰 -->
      <view class="search-row">
        <input
          v-model="filters.keyword"
          class="search-input"
          placeholder="名称/地址/责任民警"
          placeholder-class="search-ph"
          confirm-type="search"
          @confirm="reloadList"
        />
        <text class="search-btn" @tap="reloadList">搜索</text>
      </view>

      <!-- 横向 Tab：固定一行，超出后左右滑动 -->
      <scroll-view class="tab-scroll" scroll-x :scroll-into-view="tabIntoView" :show-scrollbar="false">
        <view class="tab-track">
          <view
            v-for="tab in tabs"
            :id="`visit-tab-${tab.value}`"
            :key="tab.value"
            :class="['tab-item', filters.tab === tab.value ? 'active' : '']"
            @tap="switchTab(tab.value)"
          >
            {{ tab.label }}
          </view>
        </view>
      </scroll-view>

      <!-- 筛选条：交互样式与重点场所列表保持同类体验 -->
      <view id="visitFilterBar" class="filter-row">
        <view
          v-for="item in filterItems"
          :key="item.key"
          :class="['filter-item', dropdown.visible && dropdown.key === item.key ? 'active' : '']"
          @tap.stop="openDropdown(item.key)"
        >
          <text class="filter-label">{{ filterLabel(item.key) }}</text>
          <text class="filter-arrow">{{ dropdown.visible && dropdown.key === item.key ? '▴' : '▾' }}</text>
        </view>
      </view>

      <!-- 列表内容 -->
      <view class="list-wrap">
        <view v-if="list.length === 0" class="empty-text">暂无走访对象</view>
        <view
          v-for="item in list"
          :key="item.objectId"
          class="list-card"
          hover-class="card-hover"
          @tap="startVisit(item)"
        >
          <image class="card-cover" src="/static/logo.png" mode="aspectFill" />
          <view class="card-main">
            <view class="card-name-row">
              <text class="card-name">{{ item.name }}</text>
              <text :class="['pill', riskClass(item.riskLevel)]">{{ item.riskLevel || '中' }}</text>
            </view>
            <text class="card-sub">{{ item.address || '暂无地址' }}</text>
            <text class="card-sub">责任民警：{{ item.officerName || '未配置' }}</text>
            <com-tag class="tag-group" :taglist="displayTags(item)" />
            <view class="bottom-row">
              <text class="bottom-meta">最近走访：{{ item.lastVisitAt || '暂无' }}</text>
              <text class="start-link" @tap.stop="startVisit(item)">开始走访</text>
            </view>
          </view>
          <view class="card-side">
            <text :class="['pill', statusClass(item.visitStatus)]">{{ visitStatusText(item.visitStatus) }}</text>
            <text v-if="item.dueStatus === 'overdue'" class="overdue-text">已逾期</text>
            <text v-else class="distance-text">{{ item.distanceKm }}km</text>
          </view>
        </view>
      </view>

      <!-- 下拉筛选面板：从筛选条底部弹出 -->
      <view
        v-if="dropdown.visible"
        class="sheet-layer"
        :style="{ top: `${dropdownTop}px` }"
        @touchmove.stop.prevent
      >
        <view class="sheet-panel" @tap.stop>
          <view class="sheet-body">
            <view
              v-for="option in panelOptions"
              :key="option.value"
              :class="['sheet-option', draftValue === option.value ? 'active' : '']"
              @tap.stop="draftValue = option.value"
            >
              {{ option.label }}
            </view>
          </view>
          <view class="sheet-actions">
            <text class="sheet-btn ghost" @tap.stop="resetCurrentFilter">重置</text>
            <text class="sheet-btn primary" @tap.stop="confirmCurrentFilter">确定</text>
          </view>
        </view>
        <view class="sheet-mask" @tap="closeDropdown"></view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, reactive, ref } from 'vue';
import { onReady, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import comTag from '@/components/com-tag/com-tag.vue';
import { VISIT_TAB_OPTIONS, queryVisitObjects } from '@/common/database.js';
import {
  VISIT_AREA_OPTIONS,
  VISIT_RISK_OPTIONS,
  VISIT_STATUS_OPTIONS,
  VISIT_DUE_OPTIONS,
  visitStatusText,
  riskClass,
  statusClass,
} from './helper.js';
import { getVisitStartUrl } from '@/common/routes/visit.js';

const instance = getCurrentInstance();
const tabs = VISIT_TAB_OPTIONS;
const tabIntoView = ref('');
const list = ref([]);

const filters = reactive({
  keyword: '',
  tab: 'ALL',
  area: 'ALL',
  risk: 'ALL',
  status: 'ALL',
  due: 'ALL',
});

const filterItems = [
  { key: 'area' },
  { key: 'risk' },
  { key: 'status' },
  { key: 'due' },
];

const dropdown = reactive({
  visible: false,
  key: '',
});
const draftValue = ref('ALL');
const dropdownTop = ref(0);

const panelOptions = computed(() => {
  if (dropdown.key === 'area') return VISIT_AREA_OPTIONS;
  if (dropdown.key === 'risk') return VISIT_RISK_OPTIONS;
  if (dropdown.key === 'status') return VISIT_STATUS_OPTIONS;
  if (dropdown.key === 'due') return VISIT_DUE_OPTIONS;
  return [];
});

function filterLabel(key) {
  // 筛选行显示当前已选值，减少用户记忆负担
  if (key === 'area') return VISIT_AREA_OPTIONS.find((i) => i.value === filters.area)?.label || '全部辖区';
  if (key === 'risk') return VISIT_RISK_OPTIONS.find((i) => i.value === filters.risk)?.label || '全部风险';
  if (key === 'status') return VISIT_STATUS_OPTIONS.find((i) => i.value === filters.status)?.label || '全部状态';
  if (key === 'due') return VISIT_DUE_OPTIONS.find((i) => i.value === filters.due)?.label || '全部到期';
  return '';
}

function reloadList() {
  // 列表统一查询入口：保证 Tab、搜索、筛选同步生效
  list.value = queryVisitObjects({
    keyword: filters.keyword,
    tab: filters.tab,
    area: filters.area,
    risk: filters.risk,
    status: filters.status,
    due: filters.due,
  });
}

function switchTab(value) {
  filters.tab = value;
  tabIntoView.value = `visit-tab-${value}`;
  reloadList();
}

function openDropdown(key) {
  if (dropdown.visible && dropdown.key === key) {
    closeDropdown();
    return;
  }
  dropdown.key = key;
  dropdown.visible = true;
  if (key === 'area') draftValue.value = filters.area;
  if (key === 'risk') draftValue.value = filters.risk;
  if (key === 'status') draftValue.value = filters.status;
  if (key === 'due') draftValue.value = filters.due;
  // 面板打开时动态测量筛选行底部位置，确保“从筛选条下方弹出”
  nextTick(measureDropdownTop);
}

function closeDropdown() {
  dropdown.visible = false;
  dropdown.key = '';
}

function resetCurrentFilter() {
  // 重置仅影响当前筛选维度，避免误清空其他条件
  draftValue.value = 'ALL';
}

function confirmCurrentFilter() {
  if (dropdown.key === 'area') filters.area = draftValue.value;
  if (dropdown.key === 'risk') filters.risk = draftValue.value;
  if (dropdown.key === 'status') filters.status = draftValue.value;
  if (dropdown.key === 'due') filters.due = draftValue.value;
  closeDropdown();
  reloadList();
}

function handlePageTap() {
  if (dropdown.visible) closeDropdown();
}

function onPageScroll() {
  // 滚动时更新面板位置，避免不同机型上面板与筛选条脱节
  if (dropdown.visible) measureDropdownTop();
}

function measureDropdownTop() {
  if (!instance) return;
  const query = uni.createSelectorQuery().in(instance);
  query.select('#visitFilterBar').boundingClientRect();
  query.exec((res) => {
    dropdownTop.value = Number(res?.[0]?.bottom || 160);
  });
}

function displayTags(item) {
  // 标签最多展示 3 个，避免卡片高度失控
  return (item.tags || []).slice(0, 3);
}

function startVisit(item) {
  // 统一跳转到“详情页底部新增走访/新增回访”同一路由，避免列表页与详情页分叉
  const targetType = item?.objectSource === 'PERSON' ? 'person' : 'place';
  const url = getVisitStartUrl({ targetType, targetId: item?.objectId });
  if (!url) {
    // 兜底提示：当目标ID缺失或路由映射异常时，避免点击无响应
    uni.showToast({ title: '未找到新增走访页面', icon: 'none' });
    return;
  }
  uni.navigateTo({ url });
}

onShow(() => {
  reloadList();
});

onReady(() => {
  nextTick(measureDropdownTop);
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-list {
  padding: 16rpx 24rpx 28rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
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
  color: #fff;
  font-size: 28rpx;
  background: #1677ff;
}

.tab-scroll {
  margin-top: 12rpx;
  width: 100%;
  white-space: nowrap;
}

.tab-track {
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 6rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
  position: relative;
}

.tab-item.active {
  color: #1677ff;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 15%;
  right: 15%;
  bottom: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: #1677ff;
}

.filter-row {
  margin-top: 10rpx;
  background: #fff;
  border-radius: 14rpx;
  padding: 10rpx 8rpx;
  display: flex;
  gap: 8rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.05);
}

.filter-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 8rpx 4rpx;
}

.filter-label {
  font-size: 24rpx;
  color: #1f2b3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-arrow {
  font-size: 18rpx;
  color: #6b7785;
}

.filter-item.active .filter-label,
.filter-item.active .filter-arrow {
  color: #1677ff;
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
  opacity: 0.86;
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

.card-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.card-name {
  flex: 1;
  min-width: 0;
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2b3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-sub {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6b7785;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-group {
  margin-top: 6rpx;
}

.bottom-row {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.bottom-meta {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  color: #8a95a6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.start-link {
  flex: 0 0 auto;
  font-size: 24rpx;
  color: #1677ff;
}

.card-side {
  flex: 0 0 auto;
  min-width: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.pill {
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
}

.risk-high,
.status-danger {
  color: #d64545;
  background: #ffecec;
}

.risk-mid,
.status-warn {
  color: #c88719;
  background: #fff6e6;
}

.risk-low,
.status-ok {
  color: #1b9d5d;
  background: #e6f7ed;
}

.status-normal {
  color: #6b7785;
  background: #f4f6f8;
}

.distance-text {
  font-size: 22rpx;
  color: #6b7785;
}

.overdue-text {
  font-size: 22rpx;
  color: #d64545;
}

.empty-text {
  text-align: center;
  padding: 36rpx 0;
  color: #98a2b3;
  font-size: 24rpx;
}

.sheet-layer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.sheet-panel {
  background: #fff;
  border-radius: 0 0 24rpx 24rpx;
  overflow: hidden;
  max-height: 56vh;
}

.sheet-body {
  max-height: 44vh;
  overflow-y: auto;
  padding: 14rpx 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  box-sizing: border-box;
}

.sheet-option {
  min-width: calc(33.333% - 8rpx);
  text-align: center;
  padding: 14rpx 12rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  background: #f8fafc;
  font-size: 24rpx;
  color: #1f2b3a;
  box-sizing: border-box;
}

.sheet-option.active {
  color: #1677ff;
  border-color: #1677ff;
  background: #f0f7ff;
}

.sheet-actions {
  display: flex;
  gap: 12rpx;
  padding: 14rpx 24rpx calc(14rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #eef2f7;
}

.sheet-btn {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  padding: 14rpx 0;
  border-radius: 12rpx;
}

.sheet-btn.ghost {
  color: #6b7785;
  background: #f4f6f8;
}

.sheet-btn.primary {
  color: #fff;
  background: #1677ff;
}

.sheet-mask {
  flex: 1;
  background: rgba(0, 0, 0, 0.45);
}
</style>
