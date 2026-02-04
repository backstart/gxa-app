<template>
  <view class="duty pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <scroll-view class="content" scroll-y>
      <view class="page-title">值班</view>

      <view class="card">
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
            v-for="d in calendarDays"
            :key="d.key"
            :class="['day-cell', d.inMonth ? '' : 'empty', d.isSelected ? 'selected' : '' ]"
            @click="selectDay(d)"
          >
            <view class="day-num">{{ d.day }}</view>
            <view v-if="d.inMonth" :class="['duty', statusClass(d.status)]">{{ statusText(d.status) }}</view>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">当天详情</view>
        <view class="detail-row">
          <text class="label">日期</text>
          <text class="value">{{ selectedDate }}</text>
        </view>
        <view class="detail-row">
          <text class="label">状态</text>
          <text :class="['value', 'status-text', statusClass(selectedStatus)]">{{ statusText(selectedStatus) }}</text>
        </view>
        <view class="detail-row">
          <text class="label">备忘录</text>
          <text class="value" v-if="selectedMemo">{{ selectedMemo.content }}</text>
          <text class="value muted" v-else>暂无备忘录</text>
        </view>
        <view class="detail-actions">
          <text class="link" @click="goMemo">{{ selectedMemo ? '编辑备忘录' : '新增备忘录' }}</text>
          <text class="link" @click="goSwapList">换班</text>
        </view>
      </view>
    </scroll-view>

    <view class="float-actions">
      <view class="float-btn" @click="goMemo">新增备忘录</view>
      <view class="float-btn secondary" @click="goSwapList">换班</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getDutyMemos, getDutyOverrides, getDutyAnchor, getDutySwaps } from '@/common/database.js';

const safeTop = ref(0);
const currentUser = { id: 'u1', name: '李警官' };
const weekNames = ['日','一','二','三','四','五','六'];

const currentMonth = ref(new Date());
const calendarDays = ref([]);
const selectedDate = ref('');
const selectedStatus = ref('WORK');
const selectedMemo = ref(null);

const monthTitle = computed(() => {
  const d = currentMonth.value;
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
});

function formatDate(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getAnchor() {
  const list = getDutyAnchor();
  return list.find((i) => i.userId === currentUser.id) || list[0];
}

function getOverrideMap() {
  const list = getDutyOverrides();
  return list.filter((i) => i.userId === currentUser.id);
}

function getSwapOverrides(dateStr) {
  return getOverrideMap().find((i) => i.date === dateStr) || null;
}

function dutyDay(dateStr) {
  const anchor = getAnchor();
  const anchorDate = new Date(anchor.anchorDate.replace(/-/g, '/'));
  const cur = new Date(dateStr.replace(/-/g, '/'));
  const diff = Math.floor((cur - anchorDate) / 86400000);
  return diff % anchor.cycleDays === 0;
}

function isRestByWeekend(dateStr) {
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

function getStatus(dateStr) {
  const override = getSwapOverrides(dateStr);
  if (override) return override.type;
  if (isRestByWeekend(dateStr)) return 'REST';
  return dutyDay(dateStr) ? 'DUTY' : 'WORK';
}

function buildCalendar() {
  const date = currentMonth.value;
  const y = date.getFullYear();
  const m = date.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i += 1) {
    days.push({ key: `e-${i}`, inMonth: false, day: '' });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateStr = formatDate(y, m + 1, d);
    const status = getStatus(dateStr);
    days.push({
      key: dateStr,
      inMonth: true,
      day: d,
      dateStr,
      status,
      isSelected: selectedDate.value === dateStr,
    });
  }
  const total = 42;
  while (days.length < total) {
    days.push({ key: `e-${days.length}`, inMonth: false, day: '' });
  }
  calendarDays.value = days;
}

function statusText(status) {
  if (status === 'DUTY') return '值班';
  if (status === 'REST') return '休息';
  return '工作';
}

function statusClass(status) {
  if (status === 'DUTY') return 'duty';
  if (status === 'REST') return 'rest';
  return 'work';
}

function selectDay(day) {
  if (!day.inMonth) return;
  selectedDate.value = day.dateStr;
  refreshSelected();
  buildCalendar();
}

function refreshSelected() {
  if (!selectedDate.value) return;
  selectedStatus.value = getStatus(selectedDate.value);
  const memos = getDutyMemos().filter((m) => m.userId === currentUser.id && m.date === selectedDate.value);
  selectedMemo.value = memos[0] || null;
}

function goMemo() {
  if (!selectedDate.value) return;
  const id = selectedMemo.value?.id || '';
  const qs = id ? `&memoId=${id}` : '';
  uni.navigateTo({ url: `/pages/duty/memo?date=${selectedDate.value}${qs}` });
}

function goSwapList() {
  uni.navigateTo({ url: '/pages/duty/swap_list' });
}

function prevMonth() {
  const d = currentMonth.value;
  currentMonth.value = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  buildCalendar();
}

function nextMonth() {
  const d = currentMonth.value;
  currentMonth.value = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  buildCalendar();
}

onShow(() => {
  if (!selectedDate.value) {
    const today = new Date();
    selectedDate.value = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }
  refreshSelected();
  buildCalendar();
});

onLoad(() => {
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
});
</script>

<style lang="scss" scoped>
.duty { min-height: 100vh; padding: 12rpx 24rpx 140rpx; box-sizing: border-box; }
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 16rpx; margin-bottom: 16rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08); }
.calendar-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.nav { font-size: 32rpx; color: #1f2b3a; }
.month { font-size: 28rpx; font-weight: 600; }
.week-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6rpx; margin-bottom: 6rpx; }
.week-item { text-align: center; font-size: 22rpx; color: #6b7785; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6rpx; }
.day-cell { height: 84rpx; border-radius: 10rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8f9fb; font-size: 22rpx; color: #1f2b3a; }
.day-cell.empty { background: transparent; }
.day-cell.selected { border: 2rpx solid #1677ff; }
.day-num { font-size: 24rpx; }
.duty { margin-top: 2rpx; font-size: 20rpx; }
.duty.duty { color: #1677ff; }
.duty.work { color: #6b7785; }
.duty.rest { color: #2ecc71; }
.section-title { font-size: 26rpx; font-weight: 600; margin-bottom: 8rpx; }
.detail-row { display: flex; justify-content: space-between; margin-top: 6rpx; font-size: 24rpx; color: #1f2b3a; }
.label { color: #6b7785; }
.value { flex: 1; text-align: right; }
.muted { color: #97a1ad; }
.status-text.duty { color: #1677ff; }
.status-text.work { color: #6b7785; }
.status-text.rest { color: #2ecc71; }
.detail-actions { margin-top: 10rpx; display: flex; gap: 16rpx; }
.link { color: #1677ff; font-size: 24rpx; }
.float-actions { position: fixed; right: 24rpx; bottom: calc(24rpx + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12rpx; }
.float-btn { background: #1677ff; color: #fff; padding: 12rpx 18rpx; border-radius: 999rpx; font-size: 24rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.12); }
.float-btn.secondary { background: #2ecc71; }
</style>
