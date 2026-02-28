<template>
  <AppPage>
    <view class="zone-list-page">
      <!-- 顶部搜索区：领导查看时仍保留统一搜索入口，便于快速定位任务。 -->
      <view class="search-row">
        <input
          v-model="keyword"
          class="search-input"
          :placeholder="typeConfig.placeholder"
          placeholder-class="search-ph"
          confirm-type="search"
          @confirm="loadData"
        />
        <text class="search-btn" @tap="loadData">搜索</text>
      </view>

      <!-- 领导视角卡片统一为 4 个口径：待处理/24h内到期/逾期/全部。 -->
      <view class="summary-row">
        <view
          v-for="card in leaderCards"
          :key="card.key"
          :class="['summary-card', viewMode === card.key ? 'active' : '']"
          @tap="switchView(card.key)"
        >
          <text class="summary-label">{{ card.label }}</text>
          <text :class="['summary-value', card.key === 'overdue' ? 'danger' : '']">{{ card.value }}</text>
        </view>
      </view>

      <view class="list-wrap">
        <view v-if="displayList.length === 0" class="empty-text">暂无{{ typeConfig.title }}数据</view>
        <view
          v-for="item in displayList"
          :key="item.id"
          class="list-card"
          hover-class="card-hover"
        >
          <image class="card-cover" src="/static/logo.png" mode="aspectFill" />
          <view class="card-main">
            <view class="name-row">
              <text class="name">{{ item.title }}</text>
              <text :class="['pill', riskClass(item.risk)]">{{ item.risk }}</text>
              <text :class="['pill', statusClass(item.status)]">{{ item.statusText }}</text>
            </view>

            <text class="meta-line">{{ item.subtitle || '暂无摘要信息' }}</text>

            <view class="info-row">
              <text class="meta-line single-line">截止：{{ formatDeadlineAt(item.deadlineTs) }}</text>
              <text v-if="item.isOverdue" class="overtime-text">{{ item.deadlineText }}</text>
            </view>

            <view class="info-row">
              <!-- 责任民警统一文案，不再额外显示“未分配”灰色标记，避免视觉宽度不齐。 -->
              <text class="meta-line single-line">责任民警：{{ displayOfficerName(item) }}</text>
              <view class="right-actions">
                <!-- 仅未分配时显示指派按钮；已分配时保留占位，保证每条卡片右侧对齐。 -->
                <text v-if="isUnassigned(item)" class="action-btn assign-btn" @tap.stop="handleAssign(item)">指派</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import {
  ZONE_TASK_TYPE_CONFIG,
  getZoneTasks,
  sortZoneTasks,
  updateZoneTaskAssignee,
} from '@/common/data/zoneTasks.js';

const pageType = ref('alarm');
const keyword = ref('');
const viewMode = ref('pending');
const baseList = ref([]);

const typeConfig = computed(() => ZONE_TASK_TYPE_CONFIG[pageType.value] || ZONE_TASK_TYPE_CONFIG.alarm);

const searchedList = computed(() => {
  const key = keyword.value.trim().toLowerCase();
  if (!key) return baseList.value;
  return baseList.value.filter((item) => {
    // 搜索覆盖标题/摘要/责任民警/引用编号，满足领导按关键词快速检索需求。
    const text = `${item.title}|${item.subtitle}|${item.officerName}|${item.refId}`.toLowerCase();
    return text.includes(key);
  });
});

const leaderCounts = computed(() => ({
  pending: searchedList.value.filter((item) => item.isPending).length,
  dueSoon: searchedList.value.filter((item) => item.isDueSoon).length,
  overdue: searchedList.value.filter((item) => item.isOverdue).length,
  all: searchedList.value.length,
}));

const leaderCards = computed(() => [
  { key: 'pending', label: '待处理', value: leaderCounts.value.pending },
  { key: 'dueSoon', label: '24h内到期', value: leaderCounts.value.dueSoon },
  { key: 'overdue', label: '逾期', value: leaderCounts.value.overdue },
  { key: 'all', label: '全部', value: leaderCounts.value.all },
]);

const displayList = computed(() => {
  const filtered = filterByLeaderMode(searchedList.value, viewMode.value);
  return sortZoneTasks(filtered);
});

function filterByLeaderMode(list = [], mode = 'all') {
  // 统一模式过滤：所有 type 共用同一套口径，避免页面行为分裂。
  if (mode === 'pending') return list.filter((item) => item.isPending);
  if (mode === 'dueSoon') return list.filter((item) => item.isDueSoon);
  if (mode === 'overdue') return list.filter((item) => item.isOverdue);
  return list;
}

function loadData() {
  baseList.value = getZoneTasks(pageType.value);
}

function switchView(mode) {
  viewMode.value = mode;
}

function riskClass(level) {
  if (level === '高') return 'risk-high';
  if (level === '中') return 'risk-mid';
  return 'risk-low';
}

function statusClass(status) {
  if (status === 'done') return 'status-ok';
  if (status === 'processing') return 'status-warn';
  return 'status-danger';
}

function isUnassigned(item) {
  const name = String(item?.officerName || '').trim();
  // 领导视角按“无ID/无姓名/待分配文案”统一判定未分配。
  return !item?.officerId || !name || name.includes('未分配') || name.includes('待分配');
}

function displayOfficerName(item) {
  return String(item?.officerName || '').trim() || '—';
}

function formatDeadlineAt(deadlineTs) {
  if (!deadlineTs) return '未设置截止';
  const date = new Date(deadlineTs);
  if (Number.isNaN(date.getTime())) return '未设置截止';
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function handleAssign(item) {
  // 复用“任务指派-选择执行人”页面，保持全局一致的选人交互。
  const url =
    `/pages/dispatch/selectUser` +
    `?selectedId=${encodeURIComponent(item?.officerId || '')}` +
    `&from=zoneTasks` +
    `&taskType=${encodeURIComponent(pageType.value)}` +
    `&taskId=${encodeURIComponent(item?.id || '')}` +
    `&title=${encodeURIComponent(item?.title || '')}` +
    `&returnUrl=${encodeURIComponent(`/pages/zoneTasks/list?type=${pageType.value}`)}`;

  uni.navigateTo({
    url,
    events: {
      selected: (payload) => {
        if (!payload?.id) return;
        // 选择执行人后立即持久化并刷新，确保当前页和重进后都一致。
        updateZoneTaskAssignee(pageType.value, item.id, {
          id: payload.id,
          name: payload.name || '',
        });
        loadData();
        uni.showToast({ title: `已指派给${payload.name || '执行人'}`, icon: 'none' });
      },
    },
  });
}

onLoad((query) => {
  const nextType = String(query?.type || 'alarm');
  pageType.value = ZONE_TASK_TYPE_CONFIG[nextType] ? nextType : 'alarm';
  viewMode.value = 'pending';
});

onShow(loadData);
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.zone-list-page {
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
  font-size: 26rpx;
}

.summary-row {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
}

.summary-card {
  background: #fff;
  border-radius: 14rpx;
  padding: 14rpx 10rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6rpx;
  min-width: 0;
}

.summary-card.active {
  background: #f2f7ff;
  box-shadow: inset 0 0 0 1px #dbe8ff;
}

.summary-label {
  font-size: 22rpx;
  color: #6b7785;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-value {
  font-size: 40rpx;
  line-height: 1;
  color: #1677ff;
  font-weight: 700;
}

.summary-value.danger {
  color: #d64545;
}

.list-wrap {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.list-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 14rpx;
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  box-sizing: border-box;
  min-width: 0;
}

.card-hover {
  opacity: 0.95;
}

.card-cover {
  width: 104rpx;
  height: 104rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.card-main {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.name {
  flex: 1;
  min-width: 0;
  font-size: 32rpx;
  color: #1f2b3a;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pill {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;
}

.risk-high {
  background: #ffecec;
  color: #d64545;
}

.risk-mid {
  background: #fff6e6;
  color: #be7b05;
}

.risk-low {
  background: #e8f8ef;
  color: #1f8f55;
}

.status-danger {
  background: #fff1f0;
  color: #cf3f3f;
}

.status-warn {
  background: #eef4ff;
  color: #225ecc;
}

.status-ok {
  background: #ecf8ef;
  color: #23784a;
}

.meta-line {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #7a7a7a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.single-line {
  margin-top: 0;
}

.info-row {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.overtime-text {
  flex-shrink: 0;
  color: #d64545;
  font-size: 22rpx;
}

.right-actions {
  width: 140rpx;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  font-size: 26rpx;
  line-height: 1.3;
  border-radius: 999rpx;
  padding: 6rpx 18rpx;
}

.assign-btn {
  color: #0f6fff;
  background: #edf4ff;
}

.empty-text {
  text-align: center;
  color: #9aa4b2;
  font-size: 26rpx;
  padding: 80rpx 0;
}
</style>
