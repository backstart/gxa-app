<template>
  <view class="workbench pageBg">
    <!-- 顶部态势头：保留渐变背景，并根据状态栏高度下移内容，避免遮挡系统信息。 -->
    <!-- 头部内容下移但收紧高度：保留状态栏安全区，减少首屏空白。 -->
    <view class="header-wrap" :style="{ paddingTop: (statusBarH + 4) + 'px' }">
      <view class="header-row">
        <text class="title">工作台</text>
        <text class="date">{{ todayText }}</text>
      </view>
      <view class="summary-line">
        全辖区：今日待办 {{ zoneSummary.todayTotal }} ｜ 超期 {{ zoneSummary.overdueTotal }} ｜ 高风险 {{ zoneSummary.highRiskTotal }}
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
        <text class="section-title">全辖区风险提醒</text>
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

    <!-- 个人待办：按超期/紧急/一般分组，避免不同紧急程度混在一起。 -->
    <view class="card todo-card">
      <view class="section-head">
        <text class="section-title">个人待办</text>
        <text class="section-sub">按紧急程度</text>
      </view>

      <view v-if="myTodoStats.total === 0" class="empty">暂无待办</view>

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

        <view v-if="todoGroups.urgentList.length" class="group-block">
          <view class="group-title warn">紧急（{{ todoGroups.urgentList.length }}）</view>
          <view
            v-for="item in todoGroups.urgentList"
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
          <view class="group-title normal">一般（{{ todoGroups.normalList.length }}）</view>
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
  saveTodos,
} from '@/common/database.js';
import { getStatusBarHeight } from '@/utils/system.js';
import { getZoneModuleStats } from '@/common/data/zoneTasks.js';

// 状态栏高度：优先读取系统值，确保顶部摘要在刘海屏/沉浸式机型中不被压住。
const statusBarH = ref(getStatusBarHeight() || 0);
const todayText = ref('');
const todos = ref([]);
const zoneSnapshot = ref({
  summary: { todoTotal: 0, overdueTotal: 0, highRiskTotal: 0 },
  modules: {},
  listMap: { alarm: [], visit: [], revisit: [], case: [] },
});
const currentOfficer = ref('');

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

function resolveTodoOwner(item) {
  // 个人待办口径：优先用待办本身的 officerName，没有则默认当前登录警员。
  return item.officerName || currentOfficer.value || '李警官';
}

// 基础待办装饰：在不改原数据结构的前提下补齐排序与分组字段，并标记是否属于当前警员。
const decoratedTodos = computed(() => {
  return todos.value
    .map((item) => {
      const deadlineDate = parseDeadline(item.deadline);
      const deadlineTs = deadlineDate ? deadlineDate.getTime() : null;
      const isOverdue = deadlineTs ? deadlineTs < Date.now() : false;
      const isDueSoon = deadlineTs ? deadlineTs >= Date.now() && deadlineTs - Date.now() <= 24 * 3600 * 1000 : false;
      const riskScore = riskWeightMap[item.risk] || 0;
      const officerName = resolveTodoOwner(item);
      return {
        ...item,
        officerName,
        typeText: typeTextMap[item.type] || '其他',
        deadlineTs,
        isOverdue,
        isDueSoon,
        overdueHours: deadlineTs ? Math.floor((Date.now() - deadlineTs) / 3600000) : 0,
        riskScore,
        deadlineText: buildDeadlineText(deadlineTs),
        isMine: !officerName || officerName === currentOfficer.value,
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

const myTodos = computed(() => decoratedTodos.value.filter((item) => item.isMine));
const sortedTodos = computed(() => [...myTodos.value].sort(sortByUrgency));

// 个人待办分组：超期 > 紧急（24h内或高风险） > 一般。
const todoGroups = computed(() => {
  const overdueList = sortedTodos.value.filter((item) => item.isOverdue);
  const urgentList = sortedTodos.value.filter((item) => !item.isOverdue && (item.isDueSoon || item.risk === '高'));
  const normalList = sortedTodos.value.filter((item) => !item.isOverdue && !item.isDueSoon && item.risk !== '高');
  return { overdueList, urgentList, normalList };
});

const myTodoStats = computed(() => ({
  total: sortedTodos.value.length,
  overdue: todoGroups.value.overdueList.length,
  urgent: todoGroups.value.urgentList.length,
  normal: todoGroups.value.normalList.length,
}));

const zoneSummary = computed(() => {
  const summary = zoneSnapshot.value.summary || { todoTotal: 0, overdueTotal: 0, highRiskTotal: 0 };
  const listMap = zoneSnapshot.value.listMap || {};
  // 今日待办口径：全辖区内“今天需处理且未完成”的总数，避免与个人待办混用。
  const todayTotal = ['alarm', 'visit', 'revisit', 'case'].reduce((acc, key) => {
    const list = Array.isArray(listMap[key]) ? listMap[key] : [];
    return acc + list.filter((item) => item.isPending && item.isToday).length;
  }, 0);
  return {
    ...summary,
    todayTotal,
  };
});

// 四大战区态势卡：统一读取 zoneSnapshot，保证工作台与统一列表页口径一致。
const moduleCards = computed(() => {
  const modules = zoneSnapshot.value.modules || {};
  return [
    modules.alarm || { key: 'alarm', title: '警情', total: 0, subA: { label: '未回告', value: 0 }, subB: { label: '超期', value: 0 }, warningCount: 0, url: '/pages/zoneTasks/list?type=alarm' },
    modules.visit || { key: 'visit', title: '走访', total: 0, subA: { label: '今日', value: 0 }, subB: { label: '逾期', value: 0 }, warningCount: 0, url: '/pages/zoneTasks/list?type=visit' },
    modules.revisit || { key: 'revisit', title: '回访纠纷', total: 0, subA: { label: '待回访', value: 0 }, subB: { label: '临期(24h)', value: 0 }, warningCount: 0, url: '/pages/zoneTasks/list?type=revisit' },
    modules.case || { key: 'case', title: '案件执法', total: 0, subA: { label: '临期任务', value: 0 }, subB: { label: '今日闭环', value: 0 }, warningCount: 0, url: '/pages/zoneTasks/list?type=case' },
  ];
});

const riskPanel = computed(() => {
  const listMap = zoneSnapshot.value.listMap || {};
  const allZoneItems = ['alarm', 'visit', 'revisit', 'case'].flatMap((key) => listMap[key] || []);
  const severeOverdue = allZoneItems.filter((item) => item.isOverdue && item.deadlineTs && Date.now() - item.deadlineTs >= 24 * 3600 * 1000).length;
  const highRisk = allZoneItems.filter((item) => item.isPending && item.isHighRisk).length;
  const due24h = allZoneItems.filter((item) => item.isPending && item.isDueSoon).length;
  return [
    { key: 'severeOverdue', label: '严重超期', value: severeOverdue, tone: 'danger', url: '/pages/zoneTasks/list?type=alarm' },
    { key: 'highRisk', label: '高风险对象/任务', value: highRisk, tone: 'warn', url: '/pages/zoneTasks/list?type=visit' },
    { key: 'due24h', label: '24小时内到期', value: due24h, tone: 'normal', url: '/pages/zoneTasks/list?type=revisit' },
  ];
});

function loadData() {
  // 数据入口拆分：zoneSnapshot 只做全辖区口径；todos 则用于个人待办分组。
  todayText.value = formatDateForHeader();
  currentOfficer.value = uni.getStorageSync('userName') || '李警官';
  todos.value = getTodos();
  zoneSnapshot.value = getZoneModuleStats();
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
  padding: 0 24rpx 10rpx;
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
  margin-top: 6rpx;
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
