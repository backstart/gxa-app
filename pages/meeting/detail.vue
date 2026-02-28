<template>
  <view class="page pageBg" :style="{ paddingTop: (safeTop + 8) + 'px' }">
    <view class="nav">
      <text class="back" @tap="goBack">‹</text>
      <text class="title">会议详情</text>
      <text class="placeholder"></text>
    </view>

    <view v-if="meeting" class="card">
      <view class="head">
        <text class="meeting-title">{{ meeting.title }}</text>
        <text v-if="meeting.isImportant" class="important">重要会议</text>
      </view>
      <view class="line">时间：{{ formatRange(meeting.startTime, meeting.endTime) }}</view>
      <view class="line">地点：{{ meeting.location }}</view>
      <view class="line">主持人：{{ meeting.hostName }}</view>
      <view class="line">状态：{{ getMeetingStatus(meeting) }}</view>
    </view>

    <view v-if="meeting" class="card">
      <view class="sub-title">参会人员</view>
      <view v-for="user in participantUsers" :key="user.id" class="person-row">
        <view class="person-left">
          <text class="person-name">{{ user.name }}</text>
          <text class="person-dept">{{ user.dept }}</text>
        </view>
        <view class="person-right">
          <text v-if="isConfirmed(user.id)" class="ok">已确认</text>
          <text v-else class="pending">未确认</text>
        </view>
      </view>
    </view>

    <view v-else class="empty">未找到会议</view>

    <view v-if="meeting && canConfirm(meeting)" class="bottom-bar">
      <button class="confirm-btn" @tap="handleConfirm">确认参加</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import {
  confirmAttendance,
  getCurrentMeetingUser,
  getMeetingList,
  getMeetingStatus,
  MEETING_USERS,
} from '@/common/data/meeting.js';

const safeTop = ref(getStatusBarHeight() || 0);
const meetingId = ref('');
const meeting = ref(null);
const me = ref(getCurrentMeetingUser());

onLoad((query) => {
  meetingId.value = query?.id || '';
});

function loadDetail() {
  const list = getMeetingList();
  meeting.value = list.find((item) => item.id === meetingId.value) || null;
}

const participantUsers = computed(() => {
  if (!meeting.value) return [];
  return (meeting.value.participants || []).map((uid) => {
    const hit = MEETING_USERS.find((u) => u.id === uid);
    return hit || { id: uid, name: uid, dept: '未知部门' };
  });
});

function isConfirmed(userId) {
  return meeting.value?.participantConfirm?.[userId]?.status === 'confirmed';
}

function canConfirm(item) {
  if (!(item?.participants || []).includes(me.value.id)) return false;
  const status = item?.participantConfirm?.[me.value.id]?.status;
  return status !== 'confirmed';
}

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

function handleConfirm() {
  if (!meeting.value) return;
  // 详情页确认参加后直接更新本地存储，并刷新当前页面状态。
  confirmAttendance(meeting.value.id, me.value.id);
  uni.showToast({ title: '已确认参加', icon: 'none' });
  loadDetail();
}

function goBack() {
  uni.navigateBack();
}

onShow(loadDetail);
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 24rpx calc(120rpx + env(safe-area-inset-bottom));
}

.nav {
  height: 84rpx;
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

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 18rpx;
  margin-top: 14rpx;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.meeting-title {
  font-size: 32rpx;
  color: #1f2d40;
  font-weight: 700;
}

.important {
  font-size: 22rpx;
  background: #ffe9e9;
  color: #d34747;
  border-radius: 10rpx;
  padding: 4rpx 10rpx;
}

.line {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #5f6d80;
}

.sub-title {
  font-size: 28rpx;
  color: #223046;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.person-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1px solid #eef2f6;
}

.person-row:last-child {
  border-bottom: none;
}

.person-left {
  min-width: 0;
}

.person-name {
  font-size: 28rpx;
  color: #223046;
}

.person-dept {
  margin-left: 10rpx;
  font-size: 24rpx;
  color: #8693a5;
}

.person-right .ok {
  font-size: 24rpx;
  color: #1f9d5e;
}

.person-right .pending {
  font-size: 24rpx;
  color: #c88719;
}

.empty {
  margin-top: 120rpx;
  text-align: center;
  color: #98a2b0;
  font-size: 28rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.confirm-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 14rpx;
  background: #1677ff;
  color: #fff;
  border: none;
  font-size: 28rpx;
}
</style>
