<template>
  <view class="workbench pageBg">
    <!-- 顶部态势头：保留渐变背景，并根据状态栏高度下移内容，避免遮挡系统信息。 -->
    <view class="header-wrap" :style="{ paddingTop: (statusBarH + 12) + 'px' }">
      <view class="header-row">
        <text class="title">工作台</text>
        <text class="date">{{ todayText }}</text>
      </view>
      <view class="summary-line">
        今日待办 {{ stats.todoTotal }} ｜ 超期 {{ stats.overdueTotal }} ｜ 高风险 {{ stats.highRiskTotal }}
      </view>
    </view>

    <!-- 四大战区态势卡：2x2 展示，点击卡片跳转对应业务页。 -->
    <view class="card module-grid">
      <view
        v-for="item in moduleCards"
        :key="item.key"
        class="module-card"
        hover-class="pressing"
        @click="goModule(item)"
      >
        <view class="module-head">
          <text class="module-title">{{ item.title }}</text>
          <text v-if="item.warningCount > 0" class="warn-dot">{{ item.warningCount }}</text>
        </view>
        <view class="module-value">{{ item.total }}</view>
        <view class="module-sub">{{ item.subA.label }} {{ item.subA.value }}</view>
        <view class="module-sub">{{ item.subB.label }} {{ item.subB.value }}</view>
      </view>
    </view>

    <!-- 风险提醒：只突出“严重超期/高风险/24小时临期”三件最紧急的事。 -->
    <view class="card risk-panel">
      <view class="section-head">
        <text class="section-title">风险提醒</text>
        <text class="section-sub">红橙优先</text>
      </view>
      <view
        v-for="item in riskPanel"
        :key="item.key"
        class="risk-item"
        :class="item.tone"
        hover-class="pressing"
        @click="goRisk(item)"
      >
        <text class="risk-label">{{ item.label }}</text>
        <text class="risk-value">{{ item.value }}</text>
      </view>
    </view>

    <!-- 今日必做：按超期/临期/普通分组，避免全部混在一起难以判断优先级。 -->
    <view class="card todo-card">
      <view class="section-head">
        <text class="section-title">今日必做</text>
        <text class="section-sub">按紧急排序</text>
      </view>

      <view v-if="stats.todoTotal === 0" class="empty">暂无待办</view>

      <template v-else>
        <view v-if="todoGroups.overdueList.length" class="group-block">
          <view class="group-title danger">超期（{{ todoGroups.overdueList.length }}）</view>
          <view
            v-for="item in todoGroups.overdueList"
            :key="item.id"
            class="todo-item"
            hover-class="pressing"
            @click="goTodoDetail(item)"
          >
            <view class="todo-main">
              <view class="todo-title">{{ item.title }}</view>
              <view class="todo-tags">
                <text class="tag type">{{ item.typeText }}</text>
                <text class="tag risk" :class="riskClass(item.risk)">{{ item.risk }}</text>
              </view>
              <view class="todo-deadline">{{ item.deadlineText }}</view>
            </view>
            <button
              class="todo-action"
              :class="todoActionClass(item.status)"
              size="mini"
              @click.stop="advanceTodoStatus(item)"
            >
              {{ todoActionText(item.status) }}
            </button>
          </view>
        </view>

        <view v-if="todoGroups.dueSoonList.length" class="group-block">
          <view class="group-title warn">24小时内到期（{{ todoGroups.dueSoonList.length }}）</view>
          <view
            v-for="item in todoGroups.dueSoonList"
            :key="item.id"
            class="todo-item"
            hover-class="pressing"
            @click="goTodoDetail(item)"
          >
            <view class="todo-main">
              <view class="todo-title">{{ item.title }}</view>
              <view class="todo-tags">
                <text class="tag type">{{ item.typeText }}</text>
                <text class="tag risk" :class="riskClass(item.risk)">{{ item.risk }}</text>
              </view>
              <view class="todo-deadline">{{ item.deadlineText }}</view>
            </view>
            <button
              class="todo-action"
              :class="todoActionClass(item.status)"
              size="mini"
              @click.stop="advanceTodoStatus(item)"
            >
              {{ todoActionText(item.status) }}
            </button>
          </view>
        </view>

        <view v-if="todoGroups.normalList.length" class="group-block">
          <view class="group-title normal">其他待办（{{ todoGroups.normalList.length }}）</view>
          <view
            v-for="item in todoGroups.normalList"
            :key="item.id"
            class="todo-item"
            hover-class="pressing"
            @click="goTodoDetail(item)"
          >
            <view class="todo-main">
              <view class="todo-title">{{ item.title }}</view>
              <view class="todo-tags">
                <text class="tag type">{{ item.typeText }}</text>
                <text class="tag risk" :class="riskClass(item.risk)">{{ item.risk }}</text>
              </view>
              <view class="todo-deadline">{{ item.deadlineText }}</view>
            </view>
            <button
              class="todo-action"
              :class="todoActionClass(item.status)"
              size="mini"
              @click.stop="advanceTodoStatus(item)"
            >
              {{ todoActionText(item.status) }}
            </button>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  getTodos,
  queryVisitObjects,
  saveTodos,
} from '@/common/database.js';
import { getStatusBarHeight } from '@/utils/system.js';

// 状态栏高度：优先读取系统值，确保顶部摘要在刘海屏/沉浸式机型中不被压住。
const statusBarH = ref(getStatusBarHeight() || 0);
const todayText = ref('');
const todos = ref([]);
const visitObjects = ref([]);

const typeTextMap = {
  alert: '警情',
  task: '任务',
  dispute: '纠纷',
  order: '派单',
  key_person: '重点人',
};

// 风险分值：用于“高风险优先”排序，分值越大优先级越高。
const riskWeightMap = { 高: 3, 中: 2, 低: 1 };

function formatDateForHeader(date = new Date()) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 统一解析截止时间：兼容“HH:mm/今日/YYYY-MM-DD HH:mm”等本地 mock 格式。
function parseDeadline(deadline) {
  const raw = String(deadline || '').trim();
  if (!raw) return null;
  const now = new Date();
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

function formatDuration(ms) {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ms >= day) return `${Math.floor(ms / day)}天`;
  if (ms >= hour) return `${Math.floor(ms / hour)}小时`;
  return `${Math.max(1, Math.floor(ms / minute))}分钟`;
}

function buildDeadlineText(deadlineTs) {
  if (!deadlineTs) return '未设置截止';
  const diff = deadlineTs - Date.now();
  if (diff < 0) return `已超期 ${formatDuration(Math.abs(diff))}`;
  return `剩余 ${formatDuration(diff)}`;
}

function isTodayTime(ts) {
  if (!ts) return false;
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

// 基础待办装饰：在不改原数据结构的前提下补齐排序与分组字段。
const decoratedTodos = computed(() => {
  return todos.value
    .map((item) => {
      const deadlineDate = parseDeadline(item.deadline);
      const deadlineTs = deadlineDate ? deadlineDate.getTime() : null;
      const isOverdue = deadlineTs ? deadlineTs < Date.now() : false;
      const isDueSoon = deadlineTs ? deadlineTs >= Date.now() && deadlineTs - Date.now() <= 24 * 3600 * 1000 : false;
      const riskScore = riskWeightMap[item.risk] || 0;
      return {
        ...item,
        typeText: typeTextMap[item.type] || '其他',
        deadlineTs,
        isOverdue,
        isDueSoon,
        overdueHours: deadlineTs ? Math.floor((Date.now() - deadlineTs) / 3600000) : 0,
        riskScore,
        deadlineText: buildDeadlineText(deadlineTs),
      };
    })
    .filter((item) => item.status !== 'done');
});

function sortByUrgency(a, b) {
  // 排序规则：超期优先 > 风险高优先 > 截止更近优先。
  if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
  if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
  if (a.deadlineTs && b.deadlineTs) return a.deadlineTs - b.deadlineTs;
  if (a.deadlineTs) return -1;
  if (b.deadlineTs) return 1;
  return 0;
}

const sortedTodos = computed(() => [...decoratedTodos.value].sort(sortByUrgency));

// 今日必做分组：超期、24小时内临期、普通待办三段展示。
const todoGroups = computed(() => {
  const overdueList = sortedTodos.value.filter((item) => item.isOverdue);
  const dueSoonList = sortedTodos.value.filter((item) => !item.isOverdue && item.isDueSoon);
  const normalList = sortedTodos.value.filter((item) => !item.isOverdue && !item.isDueSoon);
  return { overdueList, dueSoonList, normalList };
});

const visitOverview = computed(() => {
  const visitList = visitObjects.value;
  const total = visitList.filter((item) => item.visitStatus !== 'done').length;
  const today = visitList.filter((item) => item.dueStatus === 'today' || item.dueStatus === 'upcoming').length;
  const overdue = visitList.filter((item) => item.dueStatus === 'overdue').length;
  const highRisk = visitList.filter((item) => item.riskLevel === '高' && item.visitStatus !== 'done').length;
  return { total, today, overdue, highRisk };
});

const alarmTodos = computed(() => sortedTodos.value.filter((item) => item.type === 'alert'));
const disputeTodos = computed(() => sortedTodos.value.filter((item) => item.type === 'dispute'));
const caseTodos = computed(() => sortedTodos.value.filter((item) => item.type === 'task' || item.type === 'order'));

const stats = computed(() => {
  const todoTotal = sortedTodos.value.length;
  const overdueTotal = todoGroups.value.overdueList.length + visitOverview.value.overdue;
  const highRiskTotal =
    sortedTodos.value.filter((item) => item.risk === '高').length + visitOverview.value.highRisk;
  return { todoTotal, overdueTotal, highRiskTotal };
});

// 四大战区态势卡：统一从本地待办+走访对象聚合，便于后续替换 API。
const moduleCards = computed(() => {
  const closedToday = todos.value.filter((item) => item.status === 'done' && isTodayTime(parseDeadline(item.deadline)?.getTime())).length;
  return [
    {
      key: 'alarm',
      title: '警情',
      total: alarmTodos.value.length,
      subA: { label: '未回告', value: alarmTodos.value.filter((item) => item.status === 'pending').length },
      subB: { label: '超期', value: alarmTodos.value.filter((item) => item.isOverdue).length },
      warningCount: alarmTodos.value.filter((item) => item.isOverdue || item.risk === '高').length,
      // 警情卡片统一进入警情列表页，列表再承接详情与处理动作。
      url: '/pages/alarm/list',
    },
    {
      key: 'visit',
      title: '走访',
      total: visitOverview.value.total,
      subA: { label: '今日', value: visitOverview.value.today },
      subB: { label: '逾期', value: visitOverview.value.overdue },
      warningCount: visitOverview.value.overdue,
      url: '/pages/visit/index',
    },
    {
      key: 'revisit',
      title: '回访纠纷',
      total: disputeTodos.value.length,
      subA: { label: '待回访', value: disputeTodos.value.length },
      subB: { label: '临期(24h)', value: disputeTodos.value.filter((item) => item.isDueSoon).length },
      warningCount: disputeTodos.value.filter((item) => item.isOverdue || item.risk === '高').length,
      // 回访纠纷卡片进入纠纷回访列表页，便于统一筛选与处理。
      url: '/pages/revisit/list',
    },
    {
      key: 'case',
      title: '案件执法',
      total: caseTodos.value.length,
      subA: { label: '临期任务', value: caseTodos.value.filter((item) => item.isDueSoon).length },
      subB: { label: '今日闭环', value: closedToday },
      warningCount: caseTodos.value.filter((item) => item.isOverdue || item.risk === '高').length,
      // 案件执法卡片进入案件执法列表页，聚合任务与派单。
      url: '/pages/case/list',
    },
  ];
});

const riskPanel = computed(() => {
  const severeOverdue =
    sortedTodos.value.filter((item) => item.isOverdue && item.overdueHours >= 24).length +
    visitObjects.value.filter((item) => item.dueStatus === 'overdue' && item.riskLevel === '高').length;
  const highRisk =
    sortedTodos.value.filter((item) => item.risk === '高').length +
    visitObjects.value.filter((item) => item.riskLevel === '高' && item.visitStatus !== 'done').length;
  const due24h = sortedTodos.value.filter((item) => item.isDueSoon).length;
  return [
    { key: 'severeOverdue', label: '严重超期', value: severeOverdue, tone: 'danger', url: '/pages/task/list' },
    { key: 'highRisk', label: '高风险对象/任务', value: highRisk, tone: 'warn', url: '/pages/visit/index?tab=overdue' },
    { key: 'due24h', label: '24小时内到期', value: due24h, tone: 'normal', url: '/pages/work/work' },
  ];
});

function loadData() {
  // 统一数据入口：本地 mock / storage 读取，后续替换 API 仅需改这里。
  todayText.value = formatDateForHeader();
  todos.value = getTodos();
  visitObjects.value = queryVisitObjects({
    tab: 'ALL',
    area: 'ALL',
    risk: 'ALL',
    status: 'ALL',
    due: 'ALL',
    keyword: '',
  });
}

function goModule(item) {
  if (!item?.url) {
    uni.showToast({ title: '功能开发中', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: item.url });
}

function goRisk(item) {
  if (!item?.url) {
    uni.showToast({ title: '功能开发中', icon: 'none' });
    return;
  }
  if (item.url === '/pages/work/work') {
    uni.showToast({ title: '当前已在工作台', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: item.url });
}

function goTodoDetail(item) {
  if (item.url) {
    uni.navigateTo({ url: item.url });
    return;
  }
  const refId = item.refId || '';
  let target = '/pages/index/index';
  if (item.type === 'alert') target = `/pages/policeDetail/policeDetail?id=${refId}`;
  else if (item.type === 'task') target = `/pages/task/detail?taskId=${refId}`;
  else if (item.type === 'dispute') target = `/pages/venue/venue?id=${refId}`;
  else if (item.type === 'order') target = `/pages/dispatch/detail?dispatchId=${refId}`;
  uni.navigateTo({ url: target });
}

function riskClass(risk) {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}

function todoActionText(status) {
  if (status === 'pending') return '开始处理';
  if (status === 'processing') return '标记完成';
  return '已完成';
}

function todoActionClass(status) {
  if (status === 'pending') return 'primary';
  if (status === 'processing') return 'secondary';
  return 'disabled';
}

function advanceTodoStatus(item) {
  // 仅更新本地状态：pending -> processing -> done，满足工作台快速流转诉求。
  const list = getTodos();
  const idx = list.findIndex((todo) => todo.id === item.id);
  if (idx < 0) return;
  const current = list[idx];
  let nextStatus = current.status;
  if (current.status === 'pending') nextStatus = 'processing';
  else if (current.status === 'processing') nextStatus = 'done';
  else return;

  list[idx] = {
    ...current,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
  saveTodos(list);
  loadData();
  uni.showToast({
    title: nextStatus === 'done' ? '已标记完成' : '已开始处理',
    icon: 'none',
  });
}

onMounted(() => {
  const sys = uni.getSystemInfoSync();
  statusBarH.value = sys.statusBarHeight || statusBarH.value || 0;
});

onShow(loadData);
</script>

<style lang="scss" scoped>
.workbench {
  min-height: 100vh;
  padding: 0 24rpx 32rpx;
  box-sizing: border-box;
}

.header-wrap {
  margin: 0 -24rpx 16rpx;
  padding: 0 24rpx 20rpx;
  background: linear-gradient(135deg, #e8f7ef 0%, #edf6ff 100%);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 42rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.date {
  font-size: 24rpx;
  color: #5f6d80;
  background: rgba(255, 255, 255, 0.7);
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
}

.summary-line {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #405166;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(18, 38, 63, 0.08);
  margin-bottom: 16rpx;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.module-card {
  border-radius: 16rpx;
  padding: 16rpx;
  background: linear-gradient(180deg, #fafdff 0%, #ffffff 100%);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}

.module-title {
  font-size: 26rpx;
  color: #324155;
  white-space: nowrap;
}

.warn-dot {
  min-width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  text-align: center;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: #ffe6e6;
  color: #d64545;
  font-size: 20rpx;
}

.module-value {
  margin-top: 8rpx;
  font-size: 44rpx;
  line-height: 1.1;
  font-weight: 700;
  color: #0f75ff;
}

.module-sub {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #627185;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.section-sub {
  font-size: 24rpx;
  color: #7a8798;
}

.risk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 14rpx;
  padding: 14rpx 16rpx;
  margin-bottom: 10rpx;
}

.risk-item:last-child {
  margin-bottom: 0;
}

.risk-item.danger {
  background: #fff0f0;
  color: #c93b3b;
}

.risk-item.warn {
  background: #fff7eb;
  color: #b86a00;
}

.risk-item.normal {
  background: #eef5ff;
  color: #1f57bb;
}

.risk-label {
  font-size: 26rpx;
}

.risk-value {
  font-size: 34rpx;
  font-weight: 700;
}

.group-block {
  margin-bottom: 14rpx;
}

.group-block:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.group-title.danger {
  color: #d64545;
}

.group-title.warn {
  color: #c88719;
}

.group-title.normal {
  color: #6b7785;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 0;
  border-bottom: 1px solid #eef2f7;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-main {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 30rpx;
  color: #1f2b3a;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-tags {
  margin-top: 6rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.tag {
  padding: 4rpx 10rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
}

.tag.type {
  background: #eaf3ff;
  color: #0f75ff;
}

.tag.risk.high {
  background: #ffecec;
  color: #d64545;
}

.tag.risk.medium {
  background: #fff6e6;
  color: #c88719;
}

.tag.risk.low {
  background: #e6f7ed;
  color: #1b9d5d;
}

.todo-deadline {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7785;
}

.todo-action {
  width: 152rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  padding: 0;
  flex-shrink: 0;
}

.todo-action.primary {
  background: linear-gradient(90deg, #0f75ff, #4a99ff);
  color: #fff;
  border: none;
}

.todo-action.secondary {
  background: #eef4ff;
  color: #0f75ff;
  border: 1px solid #c9dcff;
}

.todo-action.disabled {
  background: #eef1f5;
  color: #a0a8b3;
  border: 1px solid #dde3ea;
}

.empty {
  text-align: center;
  padding: 24rpx 0;
  color: #97a1ad;
  font-size: 26rpx;
}

.pressing {
  opacity: 0.75;
}
</style>
