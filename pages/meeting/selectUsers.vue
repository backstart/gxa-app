<template>
  <view class="page pageBg" :style="{ paddingTop: (safeTop + 8) + 'px' }">
    <view class="nav">
      <text class="back" @tap="goBack">‹</text>
      <text class="title">{{ pageTitle }}</text>
      <text class="placeholder"></text>
    </view>

    <view class="search-wrap">
      <input
        v-model.trim="keyword"
        class="search-input"
        placeholder="搜索姓名/岗位"
        placeholder-class="ph"
      />
    </view>

    <scroll-view scroll-y class="list">
      <view
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-item"
        :class="{ active: selectedIds.includes(user.id) }"
        @tap="toggleUser(user)"
      >
        <view class="left">
          <text class="name">{{ user.name }}</text>
          <text class="dept">{{ user.dept }}</text>
        </view>
        <view class="check">
          <text v-if="selectedIds.includes(user.id)" class="checked">✓</text>
          <text v-else class="unchecked">○</text>
        </view>
      </view>
      <view v-if="!filteredUsers.length" class="empty">暂无可选人员</view>
    </scroll-view>

    <!-- 固定吸底操作栏：左取消右确定，确定按钮展示已选数量 -->
    <view class="bottom-bar">
      <button class="btn ghost" @tap="goBack">取消</button>
      <button class="btn primary" :disabled="selectedIds.length === 0" @tap="confirmSelect">
        确定（{{ selectedIds.length }}）
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import { MEETING_USERS } from '@/common/data/meeting.js';

const safeTop = ref(getStatusBarHeight() || 0);
const keyword = ref('');
const selectedIds = ref([]);
const eventChannelRef = ref(null);
const selectMode = ref('multi');

const users = ref(MEETING_USERS);

onLoad((query) => {
  // 选择模式：single=单选（主持人），multi=多选（参会人员）。
  selectMode.value = query?.mode === 'single' ? 'single' : 'multi';
  const ids = (query?.selectedIds || '').split(',').filter(Boolean);
  // 单选模式只保留首个默认值，多选模式保留全部默认值。
  selectedIds.value = selectMode.value === 'single' ? ids.slice(0, 1) : ids;
  // 通过页面实例拿到 eventChannel，以便回传创建页。
  const instance = getCurrentInstance();
  eventChannelRef.value = instance?.proxy?.getOpenerEventChannel?.() || null;
});

const pageTitle = computed(() => (selectMode.value === 'single' ? '选择主持人' : '选择参会人员'));

const filteredUsers = computed(() => {
  const kw = keyword.value.toLowerCase();
  if (!kw) return users.value;
  return users.value.filter((user) => `${user.name}|${user.dept}`.toLowerCase().includes(kw));
});

function toggleUser(user) {
  // 单选模式下点击即替换；再次点击同一人可取消选择。
  if (selectMode.value === 'single') {
    selectedIds.value = selectedIds.value.includes(user.id) ? [] : [user.id];
    return;
  }
  if (selectedIds.value.includes(user.id)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== user.id);
  } else {
    selectedIds.value = [...selectedIds.value, user.id];
  }
}

function confirmSelect() {
  if (!selectedIds.value.length) return;
  const selectedUsers = users.value.filter((user) => selectedIds.value.includes(user.id));
  eventChannelRef.value?.emit('selected', selectedUsers);
  uni.navigateBack();
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
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

.search-wrap {
  padding: 0 24rpx;
  margin-top: 10rpx;
}

.search-input {
  width: 100%;
  height: 76rpx;
  border-radius: 16rpx;
  background: #f5f7fb;
  padding: 0 20rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.ph {
  color: #9aa4b2;
}

.list {
  height: calc(100vh - 340rpx);
  padding: 16rpx 24rpx 0;
  box-sizing: border-box;
}

.user-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.user-item.active {
  border: 2rpx solid #1677ff;
  background: #edf3ff;
}

.left {
  min-width: 0;
}

.name {
  display: block;
  font-size: 34rpx;
  color: #1f2d40;
  font-weight: 600;
}

.dept {
  display: block;
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #7a8799;
}

.check {
  width: 40rpx;
  text-align: center;
}

.checked {
  color: #1677ff;
  font-size: 36rpx;
}

.unchecked {
  color: #a3adba;
  font-size: 34rpx;
}

.empty {
  text-align: center;
  color: #9aa4b2;
  font-size: 28rpx;
  margin-top: 80rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  gap: 16rpx;
  z-index: 99;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  border: none;
  line-height: 88rpx;
}

.btn::after {
  border: none;
}

.btn.ghost {
  background: #f4f6f8;
  color: #666;
}

.btn.primary {
  background: #1677ff;
  color: #fff;
}

.btn.primary[disabled] {
  background: #bcd7ff;
  color: #fff;
}
</style>
