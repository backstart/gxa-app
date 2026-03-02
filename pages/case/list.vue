<template>
  <AppPage>
    <view class="list-page">
      <!-- 搜索栏：与走访页保持统一结构，降低跨模块使用成本。 -->
      <view class="search-row">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="案件名称/任务名称/承办人/地址"
          placeholder-class="search-ph"
          confirm-type="search"
          @confirm="loadData"
        />
        <text class="search-btn" @tap="loadData">搜索</text>
      </view>

      <!-- 入口按钮行：保留统计与草稿箱入口，样式与其它业务列表一致。 -->
      <view class="quick-row">
        <view class="quick-btn" hover-class="quick-btn-hover" @tap="goStats">
          <image class="quick-icon" src="/static/icons/stats.png" mode="aspectFit" />
          <text class="quick-text">统计</text>
        </view>
        <view class="quick-btn" hover-class="quick-btn-hover" @tap="goDrafts">
          <image class="quick-icon" src="/static/icons/archive.png" mode="aspectFit" />
          <text class="quick-text">草稿箱</text>
          <text v-if="draftCount > 0" class="quick-badge">{{ draftCount }}</text>
        </view>
      </view>

      <!-- 四张统计卡：临期任务/超期任务/今日闭环/全部。 -->
      <view class="summary-row">
        <view :class="['summary-card', viewMode === 'dueSoon' ? 'active' : '']" @tap="viewMode = 'dueSoon'">
          <text class="summary-label">临期任务</text>
          <text class="summary-value">{{ stats.dueSoon }}</text>
        </view>
        <view :class="['summary-card', viewMode === 'overdue' ? 'active' : '']" @tap="viewMode = 'overdue'">
          <text class="summary-label">超期任务</text>
          <text class="summary-value danger">{{ stats.overdue }}</text>
        </view>
        <view :class="['summary-card', viewMode === 'closedToday' ? 'active' : '']" @tap="viewMode = 'closedToday'">
          <text class="summary-label">今日闭环</text>
          <text class="summary-value">{{ stats.closedToday }}</text>
        </view>
        <view :class="['summary-card', viewMode === 'all' ? 'active' : '']" @tap="viewMode = 'all'">
          <text class="summary-label">全部</text>
          <text class="summary-value">{{ stats.all }}</text>
        </view>
      </view>

      <view class="list-wrap">
        <view v-if="displayList.length === 0" class="empty-text">暂无案件执法数据</view>
        <view
          v-for="item in displayList"
          :key="item.uid"
          class="list-card"
          hover-class="card-hover"
          @tap="goDetail(item)"
        >
          <image class="card-cover" src="/static/logo.png" mode="aspectFill" />
          <view class="card-main">
            <view class="name-row">
              <text class="name">{{ item.title }}</text>
              <text :class="['pill', riskClass(item.riskLevel)]">{{ item.riskLevel }}</text>
              <text :class="['pill', statusClass(item.status)]">{{ statusText(item.status) }}</text>
            </view>
            <text class="meta-line">类型：{{ item.typeText }}</text>
            <text class="meta-line">截止：{{ item.deadlineText }}</text>
            <view class="bottom-row">
              <text class="meta-line">承办人：{{ item.officerName }}</text>
              <text class="start-small" @tap.stop="goDetail(item)">{{ item.status === 'done' ? '查看' : '处理' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { getTasks, getTodos } from '@/common/database.js';

const keyword = ref('');
const viewMode = ref('dueSoon');
const caseList = ref([]);
const draftCount = ref(0);

// 风险等级用于排序，数值越小优先级越高。
const riskRank = { 高: 0, 中: 1, 低: 2 };

function parseTime(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(':');
    const t = new Date();
    t.setHours(Number(h), Number(m), 0, 0);
    return t;
  }
  if (raw === '今日') {
    const t = new Date();
    t.setHours(23, 59, 59, 0);
    return t;
  }
  const t = new Date(raw.replace(/-/g, '/'));
  if (Number.isNaN(t.getTime())) return null;
  return t;
}

function formatTime(value) {
  const d = value instanceof Date ? value : parseTime(value);
  if (!d) return value || '未设置';
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function isToday(ts) {
  if (!ts) return false;
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function normalizeStatus(rawStatus) {
  // 兼容任务与待办两套状态字段，统一到 pending/processing/done。
  if (rawStatus === 'done' || rawStatus === 'completed' || rawStatus === 'closed') return 'done';
  if (rawStatus === 'processing' || rawStatus === 'in_progress') return 'processing';
  return 'pending';
}

function statusText(status) {
  if (status === 'done') return '已完成';
  if (status === 'processing') return '处理中';
  return '待处理';
}

function buildDeadlineText(deadlineTs) {
  if (!deadlineTs) return '未设置';
  const diff = deadlineTs - Date.now();
  if (diff < 0) return `已超期 ${Math.ceil(Math.abs(diff) / 3600000)}小时`;
  return `剩余 ${Math.ceil(diff / 3600000)}小时`;
}

function mapTaskType(type) {
  if (type === 'PATROL') return '执法任务';
  if (type === 'CASE') return '案件';
  return '案件执法';
}

function mapTodosToCaseItem(todo) {
  const deadline = parseTime(todo.deadline);
  const deadlineTs = deadline?.getTime() || null;
  const status = normalizeStatus(todo.status);
  const doneAtTs = parseTime(todo.doneAt)?.getTime() || null;
  return {
    uid: `order-${todo.id}`,
    id: todo.refId || todo.id,
    title: todo.title || '执法派单',
    typeText: '执法派单',
    officerName: todo.officerName || '承办民警待分配',
    riskLevel: todo.risk || '中',
    status,
    url: todo.url || `/pages/dispatch/detail?dispatchId=${todo.refId || todo.id}`,
    deadlineTs,
    deadlineText: buildDeadlineText(deadlineTs),
    overdue: status !== 'done' && !!deadlineTs && deadlineTs < Date.now(),
    dueSoon: status !== 'done' && !!deadlineTs && deadlineTs >= Date.now() && deadlineTs - Date.now() <= 24 * 3600 * 1000,
    closedToday: status === 'done' && isToday(doneAtTs || deadlineTs),
  };
}

function loadData() {
  // 统一聚合任务与派单，保证“案件执法列表”能展示完整待办视角。
  const taskList = getTasks();
  const todos = getTodos();
  const taskTodoMap = new Map(todos.filter((item) => item.type === 'task').map((item) => [item.refId, item]));
  const orderTodos = todos.filter((item) => item.type === 'order');

  const mappedTasks = taskList.map((task, index) => {
    const taskTodo = taskTodoMap.get(task.id);
    const deadlineDate = parseTime(taskTodo?.deadline || task.deadline);
    const deadlineTs = deadlineDate?.getTime() || new Date(Date.now() + (index + 2) * 3600000).getTime();
    const status = normalizeStatus(taskTodo?.status || task.status);
    const doneAtTs = parseTime(taskTodo?.doneAt || task.doneAt)?.getTime() || null;
    return {
      uid: `task-${task.id}`,
      id: task.id,
      title: task.title || '未命名任务',
      typeText: mapTaskType(task.type),
      officerName: task.officerName || taskTodo?.officerName || '承办民警待分配',
      riskLevel: taskTodo?.risk || task.riskLevel || '中',
      status,
      url: task.url || `/pages/task/detail?taskId=${task.id}`,
      deadlineTs,
      deadlineText: buildDeadlineText(deadlineTs),
      overdue: status !== 'done' && deadlineTs < Date.now(),
      dueSoon: status !== 'done' && deadlineTs >= Date.now() && deadlineTs - Date.now() <= 24 * 3600 * 1000,
      closedToday: status === 'done' && isToday(doneAtTs || deadlineTs),
    };
  });

  caseList.value = [...mappedTasks, ...orderTodos.map(mapTodosToCaseItem)];
  const draftList = uni.getStorageSync('case_draft_box') || [];
  draftCount.value = Array.isArray(draftList) ? draftList.length : 0;
}

const searchedList = computed(() => {
  const key = keyword.value.trim().toLowerCase();
  if (!key) return caseList.value;
  return caseList.value.filter((item) => {
    const text = `${item.id}|${item.title}|${item.typeText}|${item.officerName}`.toLowerCase();
    return text.includes(key);
  });
});

const sortedList = computed(() => {
  return searchedList.value.slice().sort((a, b) => {
    // 排序规则：超期优先 > 临期优先 > 风险高优先 > 截止更近优先。
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.dueSoon !== b.dueSoon) return a.dueSoon ? -1 : 1;
    const riskA = riskRank[a.riskLevel] ?? 9;
    const riskB = riskRank[b.riskLevel] ?? 9;
    if (riskA !== riskB) return riskA - riskB;
    if (a.deadlineTs && b.deadlineTs) return a.deadlineTs - b.deadlineTs;
    if (a.deadlineTs) return -1;
    if (b.deadlineTs) return 1;
    return 0;
  });
});

const stats = computed(() => ({
  dueSoon: caseList.value.filter((item) => item.dueSoon).length,
  overdue: caseList.value.filter((item) => item.overdue).length,
  closedToday: caseList.value.filter((item) => item.closedToday).length,
  all: caseList.value.length,
}));

const displayList = computed(() => {
  if (viewMode.value === 'dueSoon') return sortedList.value.filter((item) => item.dueSoon);
  if (viewMode.value === 'overdue') return sortedList.value.filter((item) => item.overdue);
  if (viewMode.value === 'closedToday') return sortedList.value.filter((item) => item.closedToday);
  return sortedList.value;
});

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

function goDetail(item) {
  // 案件详情页当前未开发：按需求点击列表仅提示，不执行跳转，避免进入无效页面。
  uni.showToast({ title: `${item?.title || '该案件'}详情开发中`, icon: 'none' });
}

function goStats() {
  uni.showToast({ title: '案件统计开发中', icon: 'none' });
}

function goDrafts() {
  uni.showToast({ title: '草稿箱开发中', icon: 'none' });
}

onShow(loadData);
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.list-page {
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

.summary-row {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
}

.summary-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12rpx;
  padding: 10rpx 8rpx;
  box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.summary-card.active {
  background: #eaf3ff;
}

.summary-label {
  display: block;
  font-size: 20rpx;
  color: #6b7785;
  white-space: nowrap;
  text-align: center;
}

.summary-value {
  display: block;
  margin-top: 4rpx;
  font-size: 36rpx;
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
  font-size: 32rpx;
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

.status-danger {
  color: #d64545;
  background: #ffecec;
}

.status-warn {
  color: #c88719;
  background: #fff6e6;
}

.status-ok {
  color: #1b9d5d;
  background: #e6f7ed;
}

.meta-line {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6b7785;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-row {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.start-small {
  font-size: 24rpx;
  color: #1677ff;
  flex: 0 0 auto;
}

.empty-text {
  text-align: center;
  padding: 40rpx 0;
  font-size: 24rpx;
  color: #98a2b3;
}
</style>

