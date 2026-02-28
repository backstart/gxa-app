<template>
  <view class="page pageBg" :style="{ paddingTop: (safeTop + 8) + 'px' }">
    <view class="nav">
      <text class="back" @tap="goBack">‹</text>
      <text class="title">会议通知</text>
      <text class="placeholder"></text>
    </view>

    <view class="search-row">
      <input
        v-model.trim="keyword"
        class="search-input"
        placeholder="搜索会议主题/主持人/地点"
        placeholder-class="ph"
        confirm-type="search"
      />
      <button class="search-btn" size="mini" @tap="noopSearch">搜索</button>
    </view>

    <view class="filter-row">
      <view
        v-for="item in filterTabs"
        :key="item.value"
        class="filter-card"
        :class="{ active: viewMode === item.value }"
        @tap="viewMode = item.value"
      >
        <text class="filter-label">{{ item.label }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="list-wrap">
      <view v-if="filteredMeetings.length">
        <view
          v-for="item in filteredMeetings"
          :key="item.id"
          class="meeting-card"
          :class="{ running: getMeetingStatus(item) === '进行中' }"
          hover-class="pressing"
          @tap="goDetail(item.id)"
        >
          <view class="card-head">
            <view class="head-left">
              <text class="meeting-title">{{ item.title }}</text>
              <text v-if="item.isImportant" class="tag-important">重要</text>
            </view>
            <text class="status">{{ getMeetingStatus(item) }}</text>
          </view>
          <view class="meta">时间：{{ formatRange(item.startTime, item.endTime) }}</view>
          <view class="meta">地点：{{ item.location }}</view>
          <view class="meta">主持人：{{ item.hostName }}</view>
          <view class="card-foot">
            <text class="confirm">已确认 {{ getConfirmCount(item).confirmed }}/{{ getConfirmCount(item).total }}</text>
            <button
              v-if="canConfirm(item)"
              class="confirm-btn"
              size="mini"
              @tap.stop="handleConfirm(item)"
            >
              确认参加
            </button>
            <text v-else class="confirmed-text">已确认</text>
          </view>
        </view>
      </view>
      <view v-else class="empty">暂无会议</view>
    </scroll-view>

    <!-- 底部固定新建按钮：替换右下角悬浮按钮，满足“固定在屏幕底部”需求 -->
    <view class="bottom-create">
      <button class="create-btn" @tap="goCreate">+ 新建会议</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import {
  checkMeetingReminders,
  confirmAttendance,
  getConfirmCount,
  getCurrentMeetingUser,
  getMeetingList,
  getMeetingStatus,
} from '@/common/data/meeting.js';

const safeTop = ref(getStatusBarHeight() || 0);
const keyword = ref('');
const viewMode = ref('today');
const meetings = ref([]);
const me = ref(getCurrentMeetingUser());

const filterTabs = [
  { value: 'today', label: '今日' },
  { value: 'unconfirmed', label: '未确认' },
  { value: 'week', label: '本周' },
  { value: 'all', label: '全部' },
];

function loadMeetings() {
  meetings.value = getMeetingList();
  me.value = getCurrentMeetingUser();
  // 页面展示时检查会前提醒，满足第一阶段本地通知要求。
  checkMeetingReminders();
}

function isToday(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isThisWeek(ts) {
  const d = new Date(ts);
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return d >= monday && d < sunday;
}

function canConfirm(item) {
  if (!(item.participants || []).includes(me.value.id)) return false;
  const status = item.participantConfirm?.[me.value.id]?.status;
  return status !== 'confirmed';
}

const filteredMeetings = computed(() => {
  const kw = keyword.value.toLowerCase();
  let list = meetings.value.filter((item) => {
    const text = `${item.title}|${item.location}|${item.hostName}`.toLowerCase();
    return !kw || text.includes(kw);
  });
  if (viewMode.value === 'today') list = list.filter((item) => isToday(item.startTime));
  if (viewMode.value === 'unconfirmed') list = list.filter((item) => canConfirm(item));
  if (viewMode.value === 'week') list = list.filter((item) => isThisWeek(item.startTime));
  return list;
});

function formatTs(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function formatRange(start, end) {
  if (!start) return '未设置';
  if (!end) return formatTs(start);
  return `${formatTs(start)} ~ ${formatTs(end)}`;
}

function handleConfirm(item) {
  confirmAttendance(item.id, me.value.id);
  uni.showToast({ title: '已确认参加', icon: 'none' });
  loadMeetings();
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/meeting/detail?id=${id}` });
}

function goCreate() {
  uni.navigateTo({ url: '/pages/meeting/create' });
}

function goBack() {
  uni.navigateBack();
}

function noopSearch() {
  // 按钮用于保持移动端搜索入口样式一致，过滤由 keyword 响应式驱动。
}

onShow(loadMeetings);
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  /* 预留底部固定按钮高度，避免列表最后几项被遮挡 */
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.nav {
  height: 84rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back,
.placeholder {
  width: 80rpx;
  font-size: 52rpx;
  line-height: 1;
  color: #1f2d40;
}

.title {
  font-size: 34rpx;
  color: #1f2d40;
  font-weight: 600;
}

.search-row {
  padding: 10rpx 24rpx 0;
  display: flex;
  gap: 12rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  background: #fff;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.ph {
  color: #9aa4b2;
}

.search-btn {
  width: 120rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  background: #1677ff;
  color: #fff;
  border: none;
  padding: 0;
  font-size: 28rpx;
}

.filter-row {
  margin: 16rpx 24rpx 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
}

.filter-card {
  background: #fff;
  border-radius: 14rpx;
  text-align: center;
  padding: 14rpx 0;
  color: #5a6678;
}

.filter-card.active {
  background: #eef4ff;
  color: #1677ff;
  font-weight: 600;
}

.filter-label {
  font-size: 26rpx;
}

.list-wrap {
  height: calc(100vh - 280rpx);
  padding: 16rpx 24rpx 0;
  box-sizing: border-box;
}

.meeting-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(20, 30, 60, 0.06);
  margin-bottom: 14rpx;
}

.meeting-card.running {
  border-left: 6rpx solid #20b56a;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.meeting-title {
  font-size: 30rpx;
  color: #223046;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #6f7b8b;
}

.tag-important {
  flex-shrink: 0;
  background: #ffe8e8;
  color: #d43f3f;
  font-size: 22rpx;
  border-radius: 10rpx;
  padding: 2rpx 10rpx;
}

.meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6f7b8b;
}

.card-foot {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.confirm {
  font-size: 24rpx;
  color: #4e5a6d;
}

.confirm-btn {
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 12rpx;
  background: #1677ff;
  color: #fff;
  border: none;
  padding: 0 22rpx;
  font-size: 24rpx;
}

.confirmed-text {
  font-size: 24rpx;
  color: #99a3b0;
}

.empty {
  margin-top: 80rpx;
  text-align: center;
  color: #98a2b0;
  font-size: 28rpx;
}

.bottom-create {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.08);
  z-index: 99;
}

.create-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 14rpx;
  border: none;
  background: #1677ff;
  color: #fff;
  font-size: 30rpx;
  line-height: 80rpx;
}

.create-btn::after {
  border: none;
}

.pressing {
  opacity: 0.75;
}
</style>
