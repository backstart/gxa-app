<template>
  <!-- 页面根容器改名，避免与状态标签类名冲突 -->
  <view class="duty-page pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <!-- 主体滚动区域，确保日历完整显示 -->
    <scroll-view class="content" scroll-y>
      <view class="page-title">值班</view>

      <!-- 日历卡片：自适应高度，7 列等分网格，固定 42 格 -->
      <view class="card calendar-card">
        <view class="calendar-head">
          <text class="nav" @click="prevMonth">‹</text>
          <text class="month">{{ monthTitle }}</text>
          <text class="nav" @click="nextMonth">›</text>
        </view>
        <view class="week-row">
          <text v-for="d in weekNames" :key="d" class="week-item">{{ d }}</text>
        </view>
        <view class="calendar-grid">
          <view
            v-for="(d, i) in calendarDays"
            :key="d.dateStr || ('empty-' + i)"
            :class="['day-cell', d.inMonth ? '' : 'empty', d.isSelected ? 'selected' : '' ]"
            :data-date="d.dateStr"
            :data-in-month="d.inMonth"
            @tap="onDayTap"
          >
            <!-- 日期数字使用 text，避免被样式挤压隐藏 -->
            <text class="day-num">{{ d.inMonth ? d.day : '' }}</text>
            <!-- 只要是当月日期就渲染状态，避免 DUTY 被 v-if 吞掉 -->
            <text v-if="d.inMonth" class="status-tag" :class="d.statusType">{{ d.statusText }}</text>
          </view>
        </view>
      </view>

      <!-- 当天详情卡片 -->
      <view class="card">
        <view class="section-title">当天详情</view>
        <!-- 换班记录置顶展示（有记录才显示） -->
        <view v-if="selectedSwaps.length" class="swap-block">
          <view class="swap-title">换班记录</view>
          <view v-for="s in selectedSwaps" :key="s.id" class="swap-item" @click="goSwapDetail(s)">
            <view class="swap-row">
              <text class="swap-name">对方：{{ s.toUserName }}</text>
              <text class="swap-status">{{ swapStatusText(s) }}</text>
            </view>
            <view class="swap-sub">我方：{{ s.fromDate }} ｜ 对方：{{ s.toDate }}</view>
          </view>
        </view>
        <view class="detail-row">
          <text class="label">日期</text>
          <text class="value">{{ selectedDate }}</text>
        </view>
        <view class="detail-row">
          <text class="label">状态</text>
          <text :class="['value', 'status-text', selectedStatusType]">{{ selectedStatusText }}</text>
        </view>
        <view class="detail-row">
          <text class="label">备忘录</text>
          <text class="value muted" v-if="!selectedMemos.length">暂无备忘录</text>
        </view>
        <!-- 备忘录列表：支持左滑编辑/删除 -->
        <view class="memo-list" @click="closeSwipe">
          <!-- 给 SwipeRow 传入与备忘录卡片一致的背景色，避免默认状态露出右侧操作区底色 -->
          <SwipeRow
            v-for="m in selectedMemos"
            :key="m.id"
            class="memo-swipe-row"
            style="--swipe-content-bg:#f7f9fb;"
            :row-id="m.id"
            :open-id="openMemoId"
            @open="openSwipe"
            @close="closeSwipe"
            @edit="editMemo"
            @delete="deleteMemo"
          >
            <view class="memo-item">
              <view class="memo-title">{{ m.title || '备忘录' }}</view>
              <view class="memo-content">{{ m.content }}</view>
              <view v-if="m.remindAt" class="memo-remind">提醒：{{ m.remindAt }}</view>
            </view>
          </SwipeRow>
        </view>
        <view class="detail-actions">
          <text class="link" @click="goMemo">新增备忘录</text>
          <text class="link" @click="goSwapList">换班</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部固定按钮栏，避免遮挡内容 -->
    <view class="bottom-actions">
      <button class="action-btn primary" @click="goMemo">新增备忘录</button>
      <button class="action-btn secondary" @click="goSwapList">换班</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getDutyMemos, saveDutyMemos, getDutyOverrides, getDutyAnchor, getDutySwaps } from '@/common/database.js';

const safeTop = ref(0);
const currentUser = { id: 'u1', name: '李警官' };
const weekNames = ['日','一','二','三','四','五','六'];

const currentMonth = ref(new Date());
const calendarDays = ref([]);
const selectedDate = ref('');
const selectedStatusType = ref('tag-work');
const selectedStatusText = ref('工作');
// 当天备忘录列表（支持多条）
const selectedMemos = ref([]);
// 当天相关换班记录列表（置顶展示）
const selectedSwaps = ref([]);
// 当前展开的备忘录行 id（用于左滑互斥）
const openMemoId = ref('');

// 引入全局左滑组件，统一管理左滑交互与样式遮挡
import SwipeRow from '@/components/SwipeRow.vue';

const monthTitle = computed(() => {
  const d = currentMonth.value;
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
});

function formatDate(y, m, d) {
  // 格式化日期为 YYYY-MM-DD
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getAnchor() {
  // 获取当前用户锚点配置
  const list = getDutyAnchor();
  return list.find((i) => i.userId === currentUser.id) || list[0];
}

function getOverrideMap() {
  // 获取当前用户覆盖表
  const list = getDutyOverrides();
  return list.filter((i) => i.userId === currentUser.id);
}

function getSwapOverrides(dateStr) {
  // 获取指定日期覆盖配置
  return getOverrideMap().find((i) => i.date === dateStr) || null;
}

function dutyDay(dateStr) {
  // 按周期判断是否值班日
  const anchor = getAnchor();
  const anchorDate = new Date(anchor.anchorDate.replace(/-/g, '/'));
  const cur = new Date(dateStr.replace(/-/g, '/'));
  const diff = Math.floor((cur - anchorDate) / 86400000);
  return diff % anchor.cycleDays === 0;
}

function isRestByWeekend(dateStr) {
  // 根据周末值班规则判断休息（只影响周五/六/日/一的休息标记）
  const d = new Date(dateStr.replace(/-/g, '/'));
  const day = d.getDay();
  if (day === 0 || day === 1) {
    const sat = new Date(d); sat.setDate(d.getDate() - (day === 0 ? 1 : 2));
    const satStr = formatDate(sat.getFullYear(), sat.getMonth() + 1, sat.getDate());
    if (dutyDay(satStr)) return true;
  }
  if (day === 5 || day === 6) {
    const sun = new Date(d); sun.setDate(d.getDate() + (day === 5 ? 2 : 1));
    const sunStr = formatDate(sun.getFullYear(), sun.getMonth() + 1, sun.getDate());
    if (dutyDay(sunStr)) return true;
  }
  return false;
}

function normalizeType(type) {
  // 统一状态类型为小写，避免 duty 文案缺失
  const map = { DUTY: 'duty', WORK: 'work', REST: 'rest' };
  return map[type] || type;
}

function typeToClass(type) {
  // 状态样式统一加 tag- 前缀，避免与页面根类名冲突
  const map = { duty: 'tag-duty', work: 'tag-work', rest: 'tag-rest' };
  return map[type] || 'tag-work';
}

function typeToText(type) {
  // 状态类型转中文文案
  const map = { duty: '值班', work: '工作', rest: '休息' };
  return map[type] || '';
}

function getDayStatus(dateStr) {
  // 统一计算状态，优先级：换班覆盖 > 值班日 > 周末休息 > 工作
  const override = getSwapOverrides(dateStr);
  if (override) {
    const type = normalizeType(override.type);
    return { type: typeToClass(type), text: typeToText(type) };
  }
  const isDuty = dutyDay(dateStr);
  if (isDuty) return { type: 'tag-duty', text: '值班' };
  if (isRestByWeekend(dateStr)) return { type: 'tag-rest', text: '休息' };
  return { type: 'tag-work', text: '工作' };
}

function buildCalendar() {
  // 构建当月日历网格
  const date = currentMonth.value;
  const y = date.getFullYear();
  const m = date.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const days = [];
  // 前置空格，保证当月第一天对齐正确星期
  for (let i = 0; i < firstDay; i += 1) {
    days.push({ key: `e-${i}`, inMonth: false, day: '' });
  }
  // 当月日期填充
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateStr = formatDate(y, m + 1, d);
    // 兜底：如果状态为空，默认设置为工作，避免文案不显示
    const status = getDayStatus(dateStr) || { type: 'tag-work', text: '工作' };
    days.push({
      key: dateStr,
      inMonth: true,
      day: d,
      dateStr,
      statusType: status.type,
      statusText: status.text,
      isSelected: selectedDate.value === dateStr,
    });
  }
  // 补齐到 42 格，保持 6 行布局
  const total = 42;
  while (days.length < total) {
    days.push({ key: `e-${days.length}`, inMonth: false, day: '' });
  }
  calendarDays.value = days;
}

function onDayTap(e) {
  // 通过 dataset 取日期，避免复用导致点击错位
  const { date, inMonth } = e.currentTarget.dataset || {};
  if (!date || inMonth === false || inMonth === 'false') return;
  selectedDate.value = date;
  refreshSelected();
  buildCalendar();
}

function refreshSelected() {
  // 刷新选中日期信息
  if (!selectedDate.value) return;
  // 刷新列表时关闭已展开的左滑行，避免状态残留
  openMemoId.value = '';
  const status = getDayStatus(selectedDate.value);
  selectedStatusType.value = status.type;
  selectedStatusText.value = status.text;
  // 读取当天全部备忘录，按更新时间倒序
  const memos = getDutyMemos()
    .filter((m) => m.userId === currentUser.id && m.date === selectedDate.value)
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  selectedMemos.value = memos;
  // 读取当天相关换班记录（涉及 fromDate/toDate）
  const swaps = getDutySwaps().filter((s) => s.fromDate === selectedDate.value || s.toDate === selectedDate.value);
  selectedSwaps.value = swaps;
}

function goMemo() {
  // 跳转备忘录页面
  if (!selectedDate.value) return;
  uni.navigateTo({ url: `/pages/duty/memo?date=${selectedDate.value}` });
}

function goSwapList() {
  // 跳转换班模块
  uni.navigateTo({ url: '/pages/duty/swap' });
}

function goSwapDetail(item) {
  // 跳转到换班记录页（列表中可查看详情）
  uni.navigateTo({ url: '/pages/duty/swap' });
}

function swapStatusText(item) {
  // 换班审批状态文案
  const map = { pending: '待审批', approving: '审批中', approved: '已同意', rejected: '已拒绝', canceled: '已撤回' };
  return map[item.status] || '待审批';
}

function openSwipe(id) {
  // 记录当前展开的备忘录行
  openMemoId.value = id;
}

function closeSwipe() {
  // 关闭已展开的备忘录行
  openMemoId.value = '';
}

function editMemo(id) {
  // 进入备忘录编辑
  uni.navigateTo({ url: `/pages/duty/memo?date=${selectedDate.value}&memoId=${id}` });
}

function deleteMemo(id) {
  // 删除备忘录（确认后从本地存储移除）
  uni.showModal({
    title: '删除备忘录',
    content: '确认删除该备忘录？',
    success: (res) => {
      if (!res.confirm) return;
      const list = getDutyMemos().filter((m) => m.id !== id);
      saveDutyMemos(list);
      refreshSelected();
    },
  });
}

function prevMonth() {
  // 切换上个月
  const d = currentMonth.value;
  currentMonth.value = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  buildCalendar();
}

function nextMonth() {
  // 切换下个月
  const d = currentMonth.value;
  currentMonth.value = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  buildCalendar();
}

onShow(() => {
  // 初始化选中日期并刷新日历
  if (!selectedDate.value) {
    const today = new Date();
    selectedDate.value = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }
  refreshSelected();
  buildCalendar();
});

onLoad(() => {
  // 计算顶部安全区，避免与系统状态栏重叠
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
});
</script>

<style lang="scss" scoped>
/* 页面根容器改名为 .duty-page，避免与状态标签类名冲突 */
.duty-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  /* 顶部与底部安全区留白，避免遮挡 */
  padding: calc(12rpx + env(safe-area-inset-top)) 24rpx calc(160rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  width: 100%;
}
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 16rpx; margin-bottom: 16rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08); box-sizing: border-box; }
.calendar-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.nav { font-size: 32rpx; color: #1f2b3a; width: 48rpx; text-align: center; }
.month { font-size: 28rpx; font-weight: 600; }
.week-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6rpx; margin-bottom: 6rpx; }
.week-item { text-align: center; font-size: 22rpx; color: #6b7785; }
.calendar-grid {
  /* 7 列等分，保持规则网格 */
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6rpx;
  /* App 端 aspect-ratio 支持不稳定，使用固定行高并从顶部排列 */
  grid-auto-rows: 104rpx;
  align-content: start;
  box-sizing: border-box;
}
.day-cell {
  /* 取消 aspect-ratio，改用固定高度避免 WebView 拉伸成“通天长条” */
  height: 104rpx;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rpx 0;
  background: #f8f9fb;
  font-size: 22rpx;
  color: #1f2b3a;
  box-sizing: border-box;
}
.day-cell.empty { background: transparent; }
.day-cell.selected { border: 2rpx solid #1677ff; }
.day-num { font-size: 24rpx; pointer-events: none; }
/* 状态标签使用 status-tag + tag- 前缀，避免与根容器类名冲突 */
.status-tag { margin-top: 2rpx; font-size: 20rpx; pointer-events: none; }
.status-tag.tag-duty { color: #1677ff; }
.status-tag.tag-work { color: #6b7785; }
.status-tag.tag-rest { color: #2ecc71; }
.section-title { font-size: 26rpx; font-weight: 600; margin-bottom: 8rpx; }
.detail-row { display: flex; align-items: center; gap: 8rpx; margin-top: 6rpx; font-size: 24rpx; color: #1f2b3a; }
.label { color: #6b7785; width: 120rpx; flex: 0 0 120rpx; white-space: nowrap; }
.value { flex: 1; min-width: 0; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.muted { color: #97a1ad; }
.status-text.tag-duty { color: #1677ff; }
.status-text.tag-work { color: #6b7785; }
.status-text.tag-rest { color: #2ecc71; }
.detail-actions { margin-top: 10rpx; display: flex; gap: 16rpx; }
.link { color: #1677ff; font-size: 24rpx; }
.link:active { opacity: 0.6; }
/* 换班记录区块：置顶展示，样式紧凑 */
.swap-block { margin-bottom: 12rpx; }
.swap-title { font-size: 24rpx; font-weight: 600; margin-bottom: 6rpx; }
.swap-item { background: #f7f9fb; border-radius: 12rpx; padding: 10rpx 12rpx; margin-bottom: 8rpx; }
.swap-row { display: flex; justify-content: space-between; align-items: center; font-size: 22rpx; }
.swap-name { color: #1f2b3a; }
.swap-status { color: #6b7785; }
.swap-sub { margin-top: 4rpx; font-size: 20rpx; color: #97a1ad; }
/* 备忘录列表样式：卡片内列表，避免撑爆页面 */
.memo-list { margin-top: 8rpx; display: flex; flex-direction: column; gap: 8rpx; }
/* 左滑行容器宽度固定为 100%，避免父级布局导致右侧留白 */
.memo-swipe-row { width: 100%; box-sizing: border-box; border-radius: 12rpx; overflow: hidden; }
/* 备忘录内容区保持实色背景，避免操作区透出 */
.memo-item { width: 100%; box-sizing: border-box; background: #f7f9fb; border-radius: 12rpx; padding: 10rpx 12rpx; }
.memo-title { font-size: 24rpx; font-weight: 600; color: #1f2b3a; margin-bottom: 4rpx; }
.memo-content { font-size: 22rpx; color: #6b7785; line-height: 32rpx; }
.memo-remind { margin-top: 4rpx; font-size: 20rpx; color: #97a1ad; }
.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(8px);
  display: flex;
  gap: 12rpx;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.action-btn.primary { background: #1677ff; color: #fff; }
.action-btn.secondary { background: #2ecc71; color: #fff; }
</style>
