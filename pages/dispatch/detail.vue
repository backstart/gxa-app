<template>
  <view class="dispatch-detail pageBg">
    <view class="statuBar"></view>

    <view class="card">
      <view class="head-row">
        <view>
          <view class="title">{{ titleText }}</view>
          <view class="sub">执行人：{{ detail.assignedUserName || '-' }}</view>
        </view>
        <text :class="['status', detail.status || 'pending']">{{ statusText(detail.status) }}</text>
      </view>
      <view class="info-row">
        <text class="label">风险</text>
        <text>{{ detail.risk || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="label">截止</text>
        <text>{{ detail.deadline || '-' }}（{{ countdownText }}）</text>
      </view>
      <view class="info-row">
        <text class="label">创建</text>
        <text>{{ fmt(detail.createdAt) }}</text>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">关联对象</text>
      </view>
      <view v-if="entities.length" class="entity-list">
        <view class="entity-card" v-for="item in entities" :key="item.id" @click="openEntity(item)">
          <view class="ec-title">{{ item.name || item.title }}</view>
          <view class="ec-meta">{{ item.address || item.area || item.community || '' }}</view>
          <view class="ec-risk">{{ item.riskLevel || item.risk }}</view>
        </view>
      </view>
      <view v-else class="empty">暂无关联对象</view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">任务说明</text>
      </view>
      <view class="desc">{{ detail.desc || '无' }}</view>
      <view class="actions">
        <button size="mini" @click="copyDesc">复制说明</button>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">关联任务</text>
      </view>
      <view v-if="task" class="entity-card" @click="openTask">
        <view class="ec-title">{{ task.title }}</view>
        <view class="ec-meta">{{ task.address }}</view>
        <view class="ec-risk">{{ task.riskLevel }}</view>
      </view>
      <view v-else class="empty">暂无关联任务</view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">日志</text>
      </view>
      <view v-if="detail.logs && detail.logs.length" class="timeline">
        <view class="log" v-for="log in detail.logs" :key="log.time + log.action">
          <view class="dot"></view>
          <view class="log-body">
            <view class="log-action">{{ log.action }}</view>
            <view class="log-time">{{ fmt(log.time) }}</view>
          </view>
        </view>
      </view>
      <view v-else class="empty">暂无日志</view>
    </view>

    <view class="action-bar">
      <button size="mini" class="ghost-btn" @click="remind">催办</button>
      <button size="mini" class="ghost-btn" @click="reassign">改派</button>
      <button type="primary" class="submit-btn" @click="markDone">标记完成</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  getDispatches,
  saveDispatches,
  getKeyPlaces,
  getKeyPersons,
  getDisputes,
  getPatrolPoints,
  getIncidents,
  getTasks,
  getTodos,
  saveTodos,
} from '@/common/database.js';

const detail = ref({});
const entities = ref([]);
const task = ref(null);
const dispatchId = ref('');

const titleText = computed(() => {
  if (!detail.value.taskType) return '派单详情';
  return `${taskTypeLabel(detail.value.taskType)} - ${detail.value.entityTitle || ''}`;
});

const countdownText = computed(() => {
  if (!detail.value.deadline) return '未设置';
  const end = new Date(detail.value.deadline).getTime();
  if (Number.isNaN(end)) return '时间格式错误';
  const diff = end - Date.now();
  if (diff <= 0) return '已超时';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}小时${m}分`;
});

function taskTypeLabel(val) {
  const map = {
    INCIDENT_FOLLOW: '警情跟进',
    PATROL: '巡逻',
    PLACE_VISIT: '场所走访/检查',
    KEY_PERSON_VISIT: '重点人走访/核查',
    DISPUTE_VISIT: '矛盾纠纷回访',
  };
  return map[val] || val || '';
}

function statusText(status) {
  const map = { pending: '待处理', assigned: '待处理', in_progress: '处理中', done: '已完成', DONE: '已完成' };
  return map[status] || '待处理';
}

function fmt(t) {
  if (!t) return '--';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function loadDetail(id) {
  const list = getDispatches();
  const rec = list.find((i) => i.dispatchId === id);
  if (!rec) {
    uni.showToast({ title: '未找到派单', icon: 'none' });
    return;
  }
  detail.value = rec;
  loadEntities(rec);
  loadTask(rec.relatedTaskId);
}

function loadEntities(rec) {
  const ids = rec.entityIds || [];
  let source = [];
  if (rec.entityType === 'KEY_PLACE') source = getKeyPlaces();
  if (rec.entityType === 'KEY_PERSON') source = getKeyPersons();
  if (rec.entityType === 'DISPUTE') source = getDisputes();
  if (rec.entityType === 'PATROL_POINT') source = getPatrolPoints();
  if (rec.entityType === 'INCIDENT') {
    source = getIncidents().map((i) => ({ ...i, name: i.title }));
  }
  entities.value = source.filter((s) => ids.includes(s.id));
}

function loadTask(taskId) {
  if (!taskId) {
    task.value = null;
    return;
  }
  const list = getTasks();
  task.value = list.find((t) => t.id === taskId) || null;
}

function copyDesc() {
  if (!detail.value.desc) {
    uni.showToast({ title: '无说明', icon: 'none' });
    return;
  }
  uni.setClipboardData({
    data: detail.value.desc,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  });
}

function openEntity(item) {
  if (item.url) {
    uni.navigateTo({ url: item.url });
  } else {
    uni.showToast({ title: '暂无详情页', icon: 'none' });
  }
}

function openTask() {
  if (task.value?.url) {
    uni.navigateTo({ url: task.value.url });
  } else {
    uni.showToast({ title: '暂无任务详情', icon: 'none' });
  }
}

function pushLog(action) {
  const logs = detail.value.logs || [];
  logs.unshift({ time: new Date().toISOString(), action });
  detail.value.logs = logs;
}

function saveDetail() {
  const list = getDispatches().map((d) => (d.dispatchId === detail.value.dispatchId ? detail.value : d));
  saveDispatches(list);
}

function updateTodos(status) {
  const todos = getTodos().map((t) =>
    t.type === 'order' && t.refId === detail.value.dispatchId ? { ...t, status: status || t.status } : t
  );
  saveTodos(todos);
}

function remind() {
  pushLog('催办');
  saveDetail();
  uni.showToast({ title: '已催办', icon: 'success' });
}

function reassign() {
  const users = ['李警官', '王警官', '张警官'];
  uni.showActionSheet({
    itemList: users,
    success: (res) => {
      const name = users[res.tapIndex];
      detail.value.assignedUserName = name;
      pushLog(`改派给 ${name}`);
      saveDetail();
      uni.showToast({ title: '已改派', icon: 'success' });
    },
  });
}

function markDone() {
  detail.value.status = 'DONE';
  pushLog('标记完成');
  saveDetail();
  updateTodos('done');
  uni.showToast({ title: '已完成', icon: 'success' });
}

onLoad((query) => {
  dispatchId.value = query.dispatchId || '';
  loadDetail(dispatchId.value);
});
</script>

<style lang="scss" scoped>
.dispatch-detail {
  min-height: 100vh;
  padding: 0 24rpx 120rpx;
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
  color: #fff;
  background: #0f75ff;
}
.status.done,
.status.DONE {
  background: #1b9d5d;
}
.status.pending {
  background: #ff9a5f;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  color: #1f2b3a;
  .label {
    color: #6b7785;
  }
}

.section-head {
  margin-bottom: 10rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.entity-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.entity-card {
  padding: 12rpx;
  border-radius: 12rpx;
  background: #f6f8fb;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.ec-title {
  font-size: 30rpx;
  font-weight: 600;
}
.ec-meta {
  margin-top: 4rpx;
  color: #6b7785;
  font-size: 24rpx;
}
.ec-risk {
  margin-top: 4rpx;
  color: #d64545;
  font-size: 24rpx;
}

.desc {
  font-size: 28rpx;
  color: #1f2b3a;
  margin-bottom: 8rpx;
}

.actions {
  display: flex;
  gap: 10rpx;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.log {
  display: flex;
  gap: 10rpx;
  align-items: flex-start;
}
.dot {
  width: 10rpx;
  height: 10rpx;
  background: #0f75ff;
  border-radius: 50%;
  margin-top: 8rpx;
}
.log-body {
  flex: 1;
  background: #f6f8fb;
  border-radius: 10rpx;
  padding: 10rpx 12rpx;
}
.log-action {
  font-size: 28rpx;
  color: #1f2b3a;
}
.log-time {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #97a1ad;
}

.empty {
  text-align: center;
  color: #97a1ad;
  padding: 12rpx 0;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10rpx 20rpx 20rpx;
  background: rgba(255,255,255,0.95);
  display: flex;
  gap: 10rpx;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 10rpx;
  padding: 0 14rpx;
}
.submit-btn {
  flex: 1;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}
</style>
