<template>
  <view class="duty pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <!-- 表单区域可滚动，避免被底部按钮遮挡 -->
    <scroll-view class="content" scroll-y>
      <view class="page-title">备忘录</view>
      <view class="card">
        <view class="row"><text class="label">日期</text><text class="value">{{ date }}</text></view>
        <input class="input" v-model="title" placeholder="标题（可选）" />
        <textarea class="textarea" v-model="content" placeholder="请输入内容" />
        <view class="row">
          <text class="label">提醒时间</text>
          <picker mode="datetime" @change="(e)=>remindAt = e.detail.value">
            <text class="link">{{ remindAt || '不提醒' }}</text>
          </picker>
        </view>
      </view>
    </scroll-view>
    <!-- 底部操作栏固定在安全区之上 -->
    <view class="bottom-bar">
      <button class="ghost" @click="remove">删除</button>
      <button type="primary" class="btn" @click="save">保存</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getDutyMemos, saveDutyMemos } from '@/common/database.js';

const safeTop = ref(0);
const date = ref('');
const memoId = ref('');
const title = ref('');
const content = ref('');
const remindAt = ref('');
const currentUser = { id: 'u1', name: '李警官' };

function save() {
  // 保存备忘录（新增或更新）
  if (!content.value) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const list = getDutyMemos();
  if (memoId.value) {
    const next = list.map((m) => (m.id === memoId.value ? { ...m, title: title.value, content: content.value, remindAt: remindAt.value, updatedAt: now } : m));
    saveDutyMemos(next);
  } else {
    const id = `memo-${Date.now()}`;
    list.unshift({ id, userId: currentUser.id, date: date.value, title: title.value, content: content.value, remindAt: remindAt.value, createdAt: now, updatedAt: now });
    saveDutyMemos(list);
  }
  uni.showToast({ title: '已保存', icon: 'success' });
  uni.navigateBack();
}

function remove() {
  // 删除备忘录
  if (!memoId.value) {
    uni.navigateBack();
    return;
  }
  const list = getDutyMemos().filter((m) => m.id !== memoId.value);
  saveDutyMemos(list);
  uni.showToast({ title: '已删除', icon: 'none' });
  uni.navigateBack();
}

onLoad((query) => {
  // 加载备忘录并计算安全区
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
  date.value = query?.date || '';
  memoId.value = query?.memoId || '';
  if (memoId.value) {
    const memo = getDutyMemos().find((m) => m.id === memoId.value);
    if (memo) {
      title.value = memo.title || '';
      content.value = memo.content || '';
      remindAt.value = memo.remindAt || '';
      date.value = memo.date;
    }
  }
});
</script>

<style lang="scss" scoped>
.duty {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  /* 顶部/底部安全区留白，避免遮挡 */
  padding: calc(12rpx + env(safe-area-inset-top)) 24rpx calc(140rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.content { flex: 1; width: 100%; }
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 16rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08); }
.row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.label { color: #6b7785; font-size: 24rpx; }
.value { color: #1f2b3a; font-size: 24rpx; }
.input { background: #f4f6f8; border-radius: 12rpx; padding: 12rpx; margin-bottom: 12rpx; }
.textarea { background: #f4f6f8; border-radius: 12rpx; padding: 12rpx; min-height: 200rpx; }
.link { color: #1677ff; font-size: 24rpx; }
.link:active { opacity: 0.6; }
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 12rpx;
  background: #fff;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.ghost { flex: 1; border: 1px solid #d0d6de; background: #fff; height: 72rpx; line-height: 72rpx; border-radius: 12rpx; }
.btn { flex: 1; height: 72rpx; line-height: 72rpx; border-radius: 12rpx; background: #1677ff; color: #fff; }
</style>
