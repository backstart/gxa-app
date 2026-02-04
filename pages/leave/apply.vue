<template>
  <view class="leave pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <scroll-view class="content" scroll-y>
      <view class="page-title">发起休假</view>

      <view class="card">
        <view class="section-title">休假类别</view>
        <view class="type-list">
          <view
            v-for="t in leaveTypes"
            :key="t.value"
            :class="['type-item', leaveType === t.value ? 'active' : '']"
            @click="selectType(t.value)"
          >
            {{ t.label }}
          </view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">日期选择</view>
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
            :class="['day-cell', d.inMonth ? '' : 'empty', d.disabled ? 'disabled' : '', d.inRange ? 'in-range' : '', d.isStart ? 'range-start' : '', d.isEnd ? 'range-end' : '' ]"
            @click="selectDay(d)"
          >
            <view class="day-num">{{ d.day }}</view>
            <view v-if="d.inMonth" :class="['duty', dutyClass(d.dutyLevel)]">{{ dutyText(d.dutyLevel) }}</view>
          </view>
        </view>
        <view class="range-info">
          <text>开始：{{ startDate || '—' }}</text>
          <text>结束：{{ endDate || '—' }}</text>
          <text>天数：{{ daysCount }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-title">事由</view>
        <textarea class="textarea" v-model="reason" placeholder="请输入休假事由" />
      </view>

      <view class="card">
        <view class="section-title">附件（可选）</view>
        <view class="attach-list">
          <view v-for="(img, idx) in attachments" :key="idx" class="attach-item">
            <image :src="img" mode="aspectFill" />
          </view>
          <view class="attach-add" @click="addAttachment">+ 添加</view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button type="primary" class="submit-btn" @click="submit">提交申请</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getLeaveRequests, saveLeaveRequests } from '@/common/database.js';

const safeTop = ref(0);
const currentUser = {
  id: 'u1',
  name: '李警官',
  deptName: '桂南派出所',
};

const leaveTypes = [
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '病假', value: 'sick' },
  { label: '调休', value: 'compensatory' },
];

const leaveType = ref('');
const reason = ref('');
const attachments = ref([]);

const startDate = ref('');
const endDate = ref('');

const weekNames = ['日','一','二','三','四','五','六'];
const currentMonth = ref(new Date());
const calendarDays = ref([]);
const dutyCacheKey = 'db_leave_duty_cache';

const monthTitle = computed(() => {
  const d = currentMonth.value;
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
});

const daysCount = computed(() => {
  if (!startDate.value) return 0;
  if (!endDate.value) return 1;
  const a = new Date(startDate.value.replace(/-/g, '/'));
  const b = new Date(endDate.value.replace(/-/g, '/'));
  const diff = Math.floor((b - a) / 86400000) + 1;
  return diff > 0 ? diff : 0;
});

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function loadDutyMap(monthKey, daysInMonth) {
  const cache = uni.getStorageSync(dutyCacheKey) || {};
  if (cache[monthKey]) return cache[monthKey];
  const map = {};
  for (let i = 1; i <= daysInMonth; i += 1) {
    const dateStr = `${monthKey}-${String(i).padStart(2, '0')}`;
    let level = 0;
    if (i % 15 === 0) level = 1;
    else if (i % 7 === 0) level = 2;
    map[dateStr] = level;
  }
  cache[monthKey] = map;
  uni.setStorageSync(dutyCacheKey, cache);
  return map;
}

function buildCalendar() {
  const date = currentMonth.value;
  const y = date.getFullYear();
  const m = date.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthKey = getMonthKey(date);
  const dutyMap = loadDutyMap(monthKey, daysInMonth);

  const days = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 0; i < firstDay; i += 1) {
    days.push({ key: `e-${i}`, inMonth: false, day: '' });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateStr = formatDate(y, m + 1, d);
    const dateObj = new Date(dateStr.replace(/-/g, '/'));
    const disabled = dateObj < today;
    const dutyLevel = dutyMap[dateStr] || 0;
    const inRange = isInRange(dateStr);
    days.push({
      key: dateStr,
      inMonth: true,
      day: d,
      dateStr,
      dutyLevel,
      disabled,
      inRange,
      isStart: startDate.value === dateStr,
      isEnd: endDate.value === dateStr,
    });
  }
  const total = 42;
  while (days.length < total) {
    days.push({ key: `e-${days.length}`, inMonth: false, day: '' });
  }
  calendarDays.value = days;
}

function isInRange(dateStr) {
  if (!startDate.value) return false;
  if (!endDate.value) return dateStr === startDate.value;
  return dateStr >= startDate.value && dateStr <= endDate.value;
}

function dutyText(level) {
  if (level === 1) return '一级';
  if (level === 2) return '二级';
  return '常态';
}

function dutyClass(level) {
  if (level === 1) return 'level-1';
  if (level === 2) return 'level-2';
  return 'level-0';
}

function selectType(val) {
  leaveType.value = val;
  if (startDate.value) {
    const ok = validateRange(startDate.value, endDate.value || startDate.value);
    if (!ok) {
      startDate.value = '';
      endDate.value = '';
    }
  }
  buildCalendar();
}

function selectDay(day) {
  if (!day.inMonth || day.disabled) return;
  if (!leaveType.value) {
    uni.showToast({ title: '请先选择休假类别', icon: 'none' });
    return;
  }
  if (!startDate.value || endDate.value) {
    startDate.value = day.dateStr;
    endDate.value = '';
  } else {
    if (day.dateStr < startDate.value) {
      startDate.value = day.dateStr;
      endDate.value = '';
    } else {
      endDate.value = day.dateStr;
    }
  }
  const end = endDate.value || startDate.value;
  const ok = validateRange(startDate.value, end);
  if (!ok) {
    startDate.value = '';
    endDate.value = '';
  }
  buildCalendar();
}

function validateRange(start, end) {
  if (!start || !end) return true;
  if (end < start) return false;
  const dates = getDatesBetween(start, end);
  if (dates.length > 30) {
    uni.showToast({ title: '休假天数不可超过30天', icon: 'none' });
    return false;
  }
  const dutyLevels = dates.map((d) => getDutyLevel(d));
  if (dutyLevels.some((l) => l === 1)) {
    uni.showToast({ title: '一级勤务期间不可休假', icon: 'none' });
    return false;
  }
  if (dutyLevels.some((l) => l === 2) && leaveType.value !== 'annual') {
    uni.showToast({ title: '二级勤务期间除年假外不可休假', icon: 'none' });
    return false;
  }
  return true;
}

function getDutyLevel(dateStr) {
  const monthKey = dateStr.slice(0, 7);
  const cache = uni.getStorageSync(dutyCacheKey) || {};
  const map = cache[monthKey];
  if (!map) return 0;
  return map[dateStr] || 0;
}

function getDatesBetween(start, end) {
  const res = [];
  const s = new Date(start.replace(/-/g, '/'));
  const e = new Date(end.replace(/-/g, '/'));
  const cur = new Date(s);
  while (cur <= e) {
    res.push(formatDate(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()));
    cur.setDate(cur.getDate() + 1);
  }
  return res;
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

function addAttachment() {
  attachments.value.push('/static/logo.png');
}

function submit() {
  if (!leaveType.value) {
    uni.showToast({ title: '请选择休假类别', icon: 'none' });
    return;
  }
  if (!startDate.value || !endDate.value) {
    uni.showToast({ title: '请选择休假日期', icon: 'none' });
    return;
  }
  if (!reason.value) {
    uni.showToast({ title: '请输入事由', icon: 'none' });
    return;
  }

  const id = `leave-${Date.now()}`;
  const steps = [
    { role: 'leader_station_dept', approverId: 'r1', approverName: '王所长', status: 'pending', comment: '', time: '' },
    { role: 'leader_bureau_political', approverId: 'r2', approverName: '政工处', status: 'pending', comment: '', time: '' },
    { role: 'leader_bureau', approverId: 'r3', approverName: '分局领导', status: 'pending', comment: '', time: '' },
  ];

  const record = {
    id,
    applicantId: currentUser.id,
    applicantName: currentUser.name,
    deptName: currentUser.deptName,
    leaveType: leaveType.value,
    startDate: startDate.value,
    endDate: endDate.value,
    daysCount: daysCount.value,
    reason: reason.value,
    attachments: attachments.value,
    status: 'pending',
    currentStepIndex: 0,
    steps,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };

  const list = [record, ...getLeaveRequests()];
  saveLeaveRequests(list);
  uni.showToast({ title: '提交成功', icon: 'success' });
  uni.navigateTo({ url: `/pages/leave/detail?id=${id}` });
}

watch([startDate, endDate], () => buildCalendar());

onLoad(() => {
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
  buildCalendar();
});
</script>

<style lang="scss" scoped>
.leave {
  min-height: 100vh;
  padding: 12rpx 24rpx 120rpx;
  box-sizing: border-box;
}
.content {
  height: calc(100vh - 120rpx);
}
.page-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
  margin-bottom: 12rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  color: #1f2b3a;
}
.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.type-item {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #f4f6f8;
  font-size: 24rpx;
  color: #344150;
}
.type-item.active {
  background: #e6f7ed;
  color: #1b9d5d;
}
.calendar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.nav { font-size: 32rpx; color: #1f2b3a; }
.month { font-size: 28rpx; font-weight: 600; }
.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6rpx;
  margin-bottom: 6rpx;
}
.week-item { text-align: center; font-size: 22rpx; color: #6b7785; }
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6rpx;
}
.day-cell {
  height: 84rpx;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fb;
  font-size: 22rpx;
  color: #1f2b3a;
}
.day-cell.empty { background: transparent; }
.day-cell.disabled { color: #c0c6cf; }
.day-cell.in-range { background: #dff4e7; }
.day-cell.range-start,
.day-cell.range-end { background: #35b36a; color: #fff; }
.day-num { font-size: 24rpx; }
.duty { margin-top: 2rpx; font-size: 20rpx; }
.duty.level-1 { color: #d64545; }
.duty.level-2 { color: #c88719; }
.duty.level-0 { color: #97a1ad; }
.range-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #6b7785;
}
.textarea {
  width: 100%;
  min-height: 140rpx;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 12rpx;
  box-sizing: border-box;
}
.attach-list { display: flex; gap: 10rpx; flex-wrap: wrap; }
.attach-item image { width: 96rpx; height: 96rpx; border-radius: 10rpx; }
.attach-add {
  width: 96rpx;
  height: 96rpx;
  border-radius: 10rpx;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #6b7785;
}
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.submit-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #27ae60, #5fd18c);
  color: #fff;
  font-weight: 600;
}
</style>
