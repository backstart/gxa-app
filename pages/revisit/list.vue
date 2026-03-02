<template>
  <AppPage>
    <view class="list-page">
      <!-- 搜索栏：与走访页面保持相同布局，减少跨模块学习成本。 -->
      <view class="search-row">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="纠纷主题/当事人/地址/责任民警"
          placeholder-class="search-ph"
          confirm-type="search"
          @confirm="loadData"
        />
        <text class="search-btn" @tap="loadData">搜索</text>
      </view>

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

      <!-- 回访纠纷统计视角：今日待回访/24h临期/逾期/全部。 -->
      <view class="summary-row">
        <view :class="['summary-card', viewMode === 'today' ? 'active' : '']" @tap="viewMode = 'today'">
          <text class="summary-label">今日待回访</text>
          <text class="summary-value">{{ stats.today }}</text>
        </view>
        <view :class="['summary-card', viewMode === 'dueSoon' ? 'active' : '']" @tap="viewMode = 'dueSoon'">
          <text class="summary-label">24小时内到期</text>
          <text class="summary-value">{{ stats.dueSoon }}</text>
        </view>
        <view :class="['summary-card', viewMode === 'overdue' ? 'active' : '']" @tap="viewMode = 'overdue'">
          <text class="summary-label">逾期</text>
          <text class="summary-value danger">{{ stats.overdue }}</text>
        </view>
        <view :class="['summary-card', viewMode === 'all' ? 'active' : '']" @tap="viewMode = 'all'">
          <text class="summary-label">全部</text>
          <text class="summary-value">{{ stats.all }}</text>
        </view>
      </view>

      <view class="list-wrap">
        <view v-if="displayList.length === 0" class="empty-text">暂无回访纠纷数据</view>
        <view
          v-for="item in displayList"
          :key="item.id"
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
            <text class="meta-line">地址：{{ item.address || '暂无地址' }}</text>
            <text class="meta-line">截止：{{ item.deadlineText }}</text>
            <view class="bottom-row">
              <text class="meta-line">责任民警：{{ item.officerName || '待分配' }}</text>
              <text class="start-small" @tap.stop="goDetail(item)">处理</text>
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
import { getDisputes, getTodos } from '@/common/database.js';

const keyword = ref('');
const viewMode = ref('today');
const revisitList = ref([]);
const draftCount = ref(0);

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
  const d = parseTime(value);
  if (!d) return value || '未设置';
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function normalizeStatus(todoStatus) {
  if (todoStatus === 'done') return 'done';
  if (todoStatus === 'processing') return 'processing';
  return 'pending';
}

function statusText(status) {
  if (status === 'done') return '已闭环';
  if (status === 'processing') return '处理中';
  return '待处理';
}

function buildDeadlineText(deadlineTs) {
  if (!deadlineTs) return '未设置';
  const diff = deadlineTs - Date.now();
  if (diff < 0) return `已超期 ${Math.ceil(Math.abs(diff) / 3600000)}小时`;
  return `${formatTime(deadlineTs)}`;
}

function loadData() {
  // 纠纷来源：disputes 基础信息 + todos(type=dispute) 状态/截止时间拼装。
  const disputeList = getDisputes();
  const todoMap = new Map(
    getTodos()
      .filter((item) => item.type === 'dispute')
      .map((item) => [item.refId, item])
  );
  revisitList.value = disputeList.map((item, index) => {
    const todo = todoMap.get(item.id);
    const deadline = parseTime(todo?.deadline || item.deadline || '');
    const deadlineTs = deadline?.getTime() || new Date(Date.now() + (index + 1) * 3 * 3600000).getTime();
    const status = normalizeStatus(todo?.status);
    const overdue = status !== 'done' && deadlineTs < Date.now();
    const dueSoon = status !== 'done' && deadlineTs >= Date.now() && deadlineTs - Date.now() <= 24 * 3600 * 1000;
    const today = status !== 'done' && new Date(deadlineTs).toDateString() === new Date().toDateString();
    return {
      id: item.id,
      title: `${item.title || '纠纷'}回访`,
      address: item.address || '',
      riskLevel: item.riskLevel || '中',
      officerName: todo?.officerName || '责任民警待分配',
      status,
      url: item.url || '/pages/venue/venue',
      deadlineTs,
      overdue,
      dueSoon,
      today,
      deadlineText: buildDeadlineText(deadlineTs),
    };
  });
  const draftList = uni.getStorageSync('revisit_draft_box') || [];
  draftCount.value = Array.isArray(draftList) ? draftList.length : 0;
}

const searchedList = computed(() => {
  const key = keyword.value.trim().toLowerCase();
  if (!key) return revisitList.value;
  return revisitList.value.filter((item) => {
    const text = `${item.title}|${item.address}|${item.officerName}`.toLowerCase();
    return text.includes(key);
  });
});

const sortedList = computed(() => {
  return searchedList.value.slice().sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.dueSoon !== b.dueSoon) return a.dueSoon ? -1 : 1;
    const riskA = riskRank[a.riskLevel] ?? 9;
    const riskB = riskRank[b.riskLevel] ?? 9;
    if (riskA !== riskB) return riskA - riskB;
    return a.deadlineTs - b.deadlineTs;
  });
});

const stats = computed(() => ({
  today: revisitList.value.filter((item) => item.today).length,
  dueSoon: revisitList.value.filter((item) => item.dueSoon).length,
  overdue: revisitList.value.filter((item) => item.overdue).length,
  all: revisitList.value.length,
}));

const displayList = computed(() => {
  if (viewMode.value === 'today') return sortedList.value.filter((item) => item.today);
  if (viewMode.value === 'dueSoon') return sortedList.value.filter((item) => item.dueSoon);
  if (viewMode.value === 'overdue') return sortedList.value.filter((item) => item.overdue);
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
  if (item?.url) {
    uni.navigateTo({ url: item.url });
    return;
  }
  uni.showToast({ title: '详情开发中', icon: 'none' });
}

function goStats() {
  uni.showToast({ title: '回访统计开发中', icon: 'none' });
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

