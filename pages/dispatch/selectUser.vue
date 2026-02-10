<template>
  <view class="select-page pageBg">
    <view class="header">
      <text class="title">选择执行人</text>
      <text class="sub-title">点击人员后确认返回任务指派页</text>
    </view>

    <view class="search-wrap">
      <input v-model="keyword" class="search-input" placeholder="搜索姓名/岗位" />
    </view>

    <scroll-view class="list" scroll-y>
      <view v-if="filteredList.length === 0" class="empty">暂无可选人员</view>
      <view
        v-for="item in filteredList"
        :key="item.id"
        :class="['row', selectedId === item.id ? 'row-active' : '']"
        @tap="selectedId = item.id"
      >
        <view class="row-main">
          <text class="name">{{ item.name }}</text>
          <text class="meta">{{ item.post }}</text>
        </view>
        <text class="check">{{ selectedId === item.id ? '✓' : '○' }}</text>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="btn ghost" @tap="cancel">取消</button>
      <button class="btn primary" @tap="confirm">确定</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 先使用本地 mock 人员列表，后续可替换为组织架构接口
const users = ref([
  { id: 'u1', name: '李警官', post: '桂南警务区' },
  { id: 'u2', name: '王警官', post: '龙石警务区' },
  { id: 'u3', name: '张警官', post: '巡逻组' },
]);

const selectedId = ref('');
const keyword = ref('');

const filteredList = computed(() => {
  if (!keyword.value) return users.value;
  const key = keyword.value.trim();
  return users.value.filter((item) => item.name.includes(key) || item.post.includes(key));
});

function cancel() {
  uni.navigateBack();
}

function confirm() {
  if (!selectedId.value) {
    uni.showToast({ title: '请选择执行人', icon: 'none' });
    return;
  }
  const selected = users.value.find((item) => item.id === selectedId.value);
  const channel = getEventChannel();
  if (channel) channel.emit('selected', selected || null);
  uni.navigateBack();
}

function getEventChannel() {
  // 使用 eventChannel 回传执行人，保证页面间数据传输简单且隔离
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  return current?.getOpenerEventChannel ? current.getOpenerEventChannel() : null;
}

onLoad((query) => {
  // 进入页面时回显当前已选执行人
  selectedId.value = query?.selectedId || '';
});
</script>

<style lang="scss" scoped>
.select-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20rpx 24rpx calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
}

.header {
  margin-bottom: 12rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.sub-title {
  display: block;
  margin-top: 6rpx;
  color: #6e7a89;
  font-size: 24rpx;
}

.search-wrap {
  margin-bottom: 12rpx;
}

.search-input {
  width: 100%;
  height: 74rpx;
  line-height: 74rpx;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 12rpx;
  padding: 0 16rpx;
  box-sizing: border-box;
}

.list {
  flex: 1;
  min-height: 200rpx;
}

.empty {
  text-align: center;
  color: #8b96a5;
  padding: 32rpx 0;
  font-size: 26rpx;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 10rpx;
  padding: 14rpx;
  background: #fff;
  border-radius: 12rpx;
  border: 1px solid transparent;
}

.row-active {
  border-color: #1677ff;
  background: #edf5ff;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2b3a;
}

.meta {
  display: block;
  margin-top: 4rpx;
  color: #6b7785;
  font-size: 24rpx;
}

.check {
  color: #1677ff;
  font-size: 30rpx;
  flex-shrink: 0;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12rpx;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
}

.btn {
  flex: 1;
  border-radius: 12rpx;
  height: 72rpx;
  line-height: 72rpx;
}

.btn.ghost {
  background: #f4f6f8;
  color: #6e7a89;
}

.btn.primary {
  background: #1677ff;
  color: #fff;
}
</style>
