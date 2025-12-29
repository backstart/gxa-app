<template>
  <view class="task-detail pageBg">
    <view class="statuBar"></view>

    <view class="card">
      <view class="head-row">
        <view>
          <view class="title">{{ task.title || '任务详情' }}</view>
          <view class="sub">来源：派单 / 手工</view>
        </view>
        <text :class="['status', task.status]">{{ statusText(task.status) }}</text>
      </view>
      <view class="info-row">
        <text class="label">风险</text>
        <text>{{ task.riskLevel || '中' }}</text>
      </view>
      <view class="info-row">
        <text class="label">截止</text>
        <text>{{ task.deadline || '--' }}（{{ countdown(task.deadline) }}）</text>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">任务详情</text>
      </view>
      <view class="info-row">
        <text class="label">对象/地址</text>
        <text>{{ task.address || task.entityTitle || '--' }}</text>
      </view>
      <view class="desc">{{ task.desc || '无说明' }}</view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">反馈</text>
      </view>
      <view class="form-item">
        <text class="label">定位</text>
        <view class="input-row">
          <text>{{ feedback.location || '未获取' }}</text>
          <button size="mini" @click="mockLocation">获取定位</button>
        </view>
      </view>
      <view class="form-item">
        <text class="label">照片</text>
        <view class="photos">
          <image v-for="(p, idx) in feedback.photos" :key="idx" :src="p" class="photo" mode="aspectFill"></image>
          <button size="mini" @click="addPhoto">添加照片</button>
        </view>
      </view>
      <view class="form-item">
        <text class="label">文字说明</text>
        <textarea v-model="feedback.text" class="textarea" placeholder="请输入反馈说明" />
      </view>
      <view class="form-item switch-row">
        <text class="label">发现新风险</text>
        <switch :checked="feedback.newRisk" @change="(e)=> feedback.newRisk = e.detail.value" />
      </view>
      <view class="form-item">
        <text class="label">音频（mock）</text>
        <view class="input-row">
          <text>{{ feedback.audio || '未录制' }}</text>
          <button size="mini" @click="mockAudio">录音占位</button>
        </view>
      </view>
      <view class="actions">
        <button size="mini" type="primary" @click="submitFeedback">提交反馈</button>
      </view>
    </view>

    <view class="action-bar">
      <button type="primary" class="submit-btn" @click="markDone">标记完成</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getTasks, saveTasks, getTodos, saveTodos } from '@/common/database.js';

const task = ref({});
const feedback = ref({
  location: '',
  photos: [],
  text: '',
  newRisk: false,
  audio: '',
});
let taskId = '';

function statusText(status) {
  const map = { pending: '待处理', done: '已完成', DONE: '已完成' };
  return map[status] || '待处理';
}

function countdown(deadline) {
  if (!deadline) return '未设置';
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return '格式错误';
  const diff = end - Date.now();
  if (diff <= 0) return '已超时';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}小时${m}分`;
}

function mockLocation() {
  feedback.value.location = '桂南片区（mock）';
}

function addPhoto() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      feedback.value.photos = [...feedback.value.photos, res.tempFilePaths[0]];
    },
  });
}

function mockAudio() {
  feedback.value.audio = 'mock-audio.mp3';
}

function submitFeedback() {
  if (!feedback.value.text && feedback.value.photos.length === 0) {
    uni.showToast({ title: '请填写文字或添加照片', icon: 'none' });
    return;
  }
  const list = getTasks().map((t) => {
    if (t.id === taskId) {
      const fb = t.feedbacks || [];
      fb.push({
        ...feedback.value,
        time: new Date().toISOString(),
      });
      return { ...t, feedbacks: fb };
    }
    return t;
  });
  saveTasks(list);
  task.value = list.find((t) => t.id === taskId) || {};
  uni.showToast({ title: '已提交反馈', icon: 'success' });
}

function markDone() {
  if (!(task.value.feedbacks && task.value.feedbacks.length)) {
    uni.showToast({ title: '请先提交反馈', icon: 'none' });
    return;
  }
  const hasPhoto = task.value.feedbacks.some((f) => f.photos && f.photos.length);
  if (!hasPhoto) {
    uni.showToast({ title: '至少需一张照片', icon: 'none' });
    return;
  }
  const list = getTasks().map((t) => (t.id === taskId ? { ...t, status: 'DONE' } : t));
  saveTasks(list);
  const todos = getTodos().map((td) =>
    td.type === 'task' && td.refId === taskId ? { ...td, status: 'done' } : td
  );
  saveTodos(todos);
  task.value = list.find((t) => t.id === taskId) || {};
  uni.showToast({ title: '已完成', icon: 'success' });
}

onLoad((query) => {
  taskId = query.taskId || '';
  const list = getTasks();
  task.value = list.find((t) => t.id === taskId) || {};
});
</script>

<style lang="scss" scoped>
.task-detail {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
}
.card {
  margin-top: 16rpx;
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
.head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 36rpx;
  font-weight: 700;
}
.sub {
  margin-top: 4rpx;
  color: #6e7a89;
  font-size: 24rpx;
}
.status {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  background: #eaf3ff;
  color: #0f75ff;
  &.DONE,&.done { background: #e6f7ed; color: #1b9d5d; }
}
.info-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  color: #1f2b3a;
  .label { color: #6b7785; }
}
.section-head {
  margin-bottom: 10rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 700;
}
.desc {
  font-size: 28rpx;
  color: #1f2b3a;
  margin-top: 6rpx;
}
.form-item {
  margin-bottom: 12rpx;
  .label { display: block; margin-bottom: 6rpx; color: #344150; font-size: 28rpx; }
}
.input-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f4f6f8;
  padding: 12rpx 14rpx;
  border-radius: 12rpx;
}
.photos {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}
.photo {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  background: #eee;
}
.textarea {
  width: 100%;
  height: 180rpx;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 14rpx;
  font-size: 28rpx;
}
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
.action-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 10rpx 20rpx 20rpx;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.submit-btn {
  width: 100%;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 12rpx 0;
}
</style>
