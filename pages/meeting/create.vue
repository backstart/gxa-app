<template>
  <view class="page pageBg" :class="{ 'no-scroll': showTimePicker }" :style="{ paddingTop: (safeTop + 8) + 'px' }">
    <view class="nav">
      <text class="back" @tap="goBack">‹</text>
      <text class="title">创建会议</text>
      <text class="placeholder"></text>
    </view>

    <view class="card">
      <view class="form-item">
        <text class="label">会议主题</text>
        <input v-model.trim="form.title" class="input" placeholder="请输入会议主题" placeholder-class="ph" />
      </view>

      <view class="form-item">
        <text class="label">会议地点</text>
        <input v-model.trim="form.location" class="input" placeholder="请输入会议地点" placeholder-class="ph" />
      </view>

      <view class="form-item clickable" @tap="openTimePicker('start')">
        <text class="label">开始时间</text>
        <view class="value-wrap">
          <text class="time-text" :class="{ empty: !form.startTime }">{{ form.startTime ? formatTs(form.startTime) : '请选择时间' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="form-item clickable" @tap="openTimePicker('end')">
        <text class="label">结束时间</text>
        <view class="value-wrap">
          <text class="time-text" :class="{ empty: !form.endTime }">{{ form.endTime ? formatTs(form.endTime) : '可选时间' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="form-item clickable" @tap="goSelectHost">
        <text class="label">主持人</text>
        <view class="value-wrap">
          <text class="text-value">{{ selectedHost.name }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="form-item clickable" @tap="goSelectUsers">
        <text class="label">参会人员</text>
        <view class="value-wrap">
          <text class="text-value">{{ selectedUsers.length }}人</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <!-- 参会人员可视化区域：解决“只显示人数不直观”的问题 -->
      <view class="selected-user-tags">
        <view v-if="selectedUsers.length === 0" class="placeholder-tip">请选择参会人员</view>
        <view v-else class="tags-wrap">
          <view v-for="user in selectedUsers" :key="user.id" class="user-tag">
            <text class="tag-name">{{ user.name }}</text>
            <text class="tag-close" @tap.stop="removeUser(user.id)">×</text>
          </view>
        </view>
      </view>

      <view class="form-item no-border">
        <text class="label">重要会议</text>
        <switch :checked="form.isImportant" color="#ff4d4f" @change="onImportantChange" />
      </view>
    </view>

    <view class="footer-btn">
      <button class="primary-btn" @tap="submit">发布会议</button>
    </view>

    <!-- 时间选择弹层：全屏遮罩 + 底部弹出，层级高于底部发布按钮 -->
    <view v-if="showTimePicker" class="mask" @tap="closePicker">
      <view class="picker-sheet" @tap.stop>
        <view class="picker-title">{{ previewText }}</view>
        <picker-view class="picker-view" :indicator-style="indicatorStyle" :value="pickerValue" @change="onPickerChange">
          <picker-view-column>
            <view v-for="item in dateOptions" :key="item.value" class="picker-item">{{ item.label }}</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="item in hourOptions" :key="item" class="picker-item">{{ item }}</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="item in minuteOptions" :key="item" class="picker-item">{{ item }}</view>
          </picker-view-column>
        </picker-view>
        <view class="picker-actions">
          <!-- 这里改用 view 代替 button，规避 uni-app 原生 button 的默认内边距与阴影导致的“廉价感” -->
          <view class="picker-btn btn-cancel" @tap="closePicker">取消</view>
          <view class="picker-btn btn-ok" @tap="confirmPicker">确定</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { getStatusBarHeight } from '@/utils/system.js';
import { createMeeting, getCurrentMeetingUser } from '@/common/data/meeting.js';

const safeTop = ref(getStatusBarHeight() || 0);
const currentUser = ref(getCurrentMeetingUser());
const selectedHost = ref(getCurrentMeetingUser());

const form = reactive({
  title: '',
  location: '',
  startTime: 0,
  endTime: 0,
  isImportant: false,
});

const selectedUsers = ref([]);

// 时间选择器状态：统一管理开始/结束时间，避免两套弹层状态重复。
const showTimePicker = ref(false);
const pickerTarget = ref('start');
const pickerValue = ref([30, 0, 0]);
const indicatorStyle = 'height: 84rpx;';

const ONE_DAY = 24 * 60 * 60 * 1000;
const dateOptions = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const list = [];
  // 选择范围前后各30天，满足会议通知场景且不会让选择器过长。
  for (let i = -30; i <= 30; i += 1) {
    const ts = today.getTime() + i * ONE_DAY;
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    const week = '日一二三四五六'[d.getDay()];
    list.push({
      value: `${y}-${m}-${day}`,
      label: `${m}月${day}日`,
      fullLabel: `${y}年${m}月${day}日 星期${week}`,
    });
  }
  return list;
});

const hourOptions = Array.from({ length: 24 }, (_, i) => `${i}`.padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => `${i}`.padStart(2, '0'));

const previewText = computed(() => {
  const [dIndex, hIndex, mIndex] = pickerValue.value;
  const d = dateOptions.value[dIndex] || dateOptions.value[30];
  return `${d?.fullLabel || ''} ${hourOptions[hIndex]}:${minuteOptions[mIndex]}`;
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

function openTimePicker(target) {
  pickerTarget.value = target;
  const val = target === 'start' ? form.startTime : form.endTime;
  const baseTs = val || form.startTime || Date.now();
  const d = new Date(baseTs);
  const dateKey = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  const dateIndex = dateOptions.value.findIndex((item) => item.value === dateKey);
  pickerValue.value = [Math.max(dateIndex, 0), d.getHours(), d.getMinutes()];
  showTimePicker.value = true;
}

function onPickerChange(e) {
  pickerValue.value = e.detail.value;
}

function closePicker() {
  showTimePicker.value = false;
}

function confirmPicker() {
  const [dateIndex, hourIndex, minuteIndex] = pickerValue.value;
  const dateObj = dateOptions.value[dateIndex];
  if (!dateObj) return closePicker();
  const ts = new Date(`${dateObj.value} ${hourOptions[hourIndex]}:${minuteOptions[minuteIndex]}`.replace(/-/g, '/')).getTime();

  if (pickerTarget.value === 'start') {
    form.startTime = ts;
    // 开始时间变更时，若结束时间早于开始时间则清空，避免无效区间。
    if (form.endTime && form.endTime <= form.startTime) form.endTime = 0;
  } else {
    if (form.startTime && ts <= form.startTime) {
      uni.showToast({ title: '结束时间需晚于开始时间', icon: 'none' });
      return;
    }
    form.endTime = ts;
  }
  closePicker();
}

function onImportantChange(e) {
  form.isImportant = Boolean(e.detail.value);
}

function goSelectHost() {
  // 主持人选择改为复用“选择参会人员”页面，但以单选模式进入，保证交互一致。
  uni.navigateTo({
    url: `/pages/meeting/selectUsers?mode=single&selectedIds=${selectedHost.value.id}`,
    events: {
      selected(users) {
        if (users?.length) selectedHost.value = users[0];
      },
    },
  });
}

function goSelectUsers() {
  const selectedIds = selectedUsers.value.map((item) => item.id).join(',');
  // 保持 eventChannel 回传机制不变，避免跨页面状态同步复杂化。
  uni.navigateTo({
    url: `/pages/meeting/selectUsers?mode=multi&selectedIds=${selectedIds}`,
    events: {
      selected(users) {
        selectedUsers.value = users;
      },
    },
  });
}

function removeUser(userId) {
  selectedUsers.value = selectedUsers.value.filter((item) => item.id !== userId);
}

function submit() {
  if (!form.title) return uni.showToast({ title: '请填写会议主题', icon: 'none' });
  if (!form.location) return uni.showToast({ title: '请填写会议地点', icon: 'none' });
  if (!form.startTime) return uni.showToast({ title: '请选择开始时间', icon: 'none' });
  if (form.endTime && form.endTime <= form.startTime) return uni.showToast({ title: '结束时间需晚于开始时间', icon: 'none' });

  // 参会人集合包含“主持人 + 已选参会人”，避免出现主持人未在参会列表中的数据不一致。
  const participants = Array.from(new Set([selectedHost.value.id, ...selectedUsers.value.map((item) => item.id)]));
  const participantConfirm = {};
  participants.forEach((uid) => {
    participantConfirm[uid] = { status: 'unconfirmed' };
  });
  // 创建人若也在参会列表中，则默认视为已确认参加。
  if (participants.includes(currentUser.value.id)) {
    participantConfirm[currentUser.value.id] = { status: 'confirmed', confirmTime: Date.now() };
  }

  createMeeting({
    id: `meet-${Date.now()}`,
    title: form.title,
    location: form.location,
    startTime: form.startTime,
    endTime: form.endTime || undefined,
    hostId: selectedHost.value.id,
    hostName: selectedHost.value.name,
    creatorId: currentUser.value.id,
    participants,
    participantConfirm,
    isImportant: form.isImportant,
    createTime: Date.now(),
  });

  uni.showToast({ title: '会议创建成功', icon: 'success' });
  setTimeout(() => {
    uni.navigateBack();
  }, 300);
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(116rpx + env(safe-area-inset-bottom));
}

.no-scroll {
  // 弹窗展示时禁用页面滚动，避免背景跟随手势滚动。
  height: 100vh;
  overflow: hidden;
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

.card {
  margin: 12rpx 24rpx 0;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.form-item {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  border-bottom: 1px solid #edf1f5;
  gap: 12rpx;
}

.form-item.no-border {
  border-bottom: none;
}

.label {
  width: 132rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #5f6d80;
}

.input {
  flex: 1;
  min-width: 0;
  height: 68rpx;
  border-radius: 14rpx;
  background: #f5f7fb;
  padding: 0 18rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #1f2d40;
}

.ph {
  color: #a1acba;
}

.value-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.time-text,
.text-value {
  font-size: 28rpx;
  color: #1f2d40;
}

.time-text.empty {
  color: #a1acba;
}

.arrow {
  flex-shrink: 0;
  color: #adb7c4;
  font-size: 30rpx;
}

.clickable {
  cursor: pointer;
}

.selected-user-tags {
  padding: 14rpx 0 18rpx;
  border-bottom: 1px solid #edf1f5;
}

.placeholder-tip {
  font-size: 24rpx;
  color: #9aa4b2;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.user-tag {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #eef4ff;
}

.tag-name {
  font-size: 24rpx;
  color: #1677ff;
}

.tag-close {
  font-size: 24rpx;
  color: #5f7ac2;
}

.footer-btn {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.08);
  z-index: 20;
}

.primary-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 14rpx;
  border: none;
  background: #1677ff;
  color: #fff;
  font-size: 30rpx;
}

.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 999;
}

.picker-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
  padding: 18rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.2s ease-out;
}

.picker-title {
  text-align: center;
  font-size: 34rpx;
  color: #1f2d40;
  font-weight: 700;
  margin-bottom: 10rpx;
}

.picker-view {
  width: 100%;
  height: 420rpx;
}

.picker-item {
  line-height: 84rpx;
  text-align: center;
  font-size: 30rpx;
  color: #253144;
}

.picker-actions {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.picker-btn {
  // 统一按钮尺寸与排版，让“取消/确定”更像原生 App 底部操作按钮。
  height: 84rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.btn-cancel {
  color: #667085;
  background: #f5f7fb;
  border: 1rpx solid #d8dee8;
}

.btn-ok {
  color: #ffffff;
  background: linear-gradient(135deg, #3a8bff, #1677ff);
  box-shadow: 0 8rpx 18rpx rgba(22, 119, 255, 0.22);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
