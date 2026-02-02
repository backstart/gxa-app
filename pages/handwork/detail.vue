<template>
  <view class="detail pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <scroll-view class="content" scroll-y>
      <view v-if="!record" class="card empty-card">
        <view class="empty">未找到交接记录</view>
      </view>

      <view v-else>
        <view class="card">
          <view class="section-head">
            <text class="section-title">交接信息</text>
            <button size="mini" class="ghost-btn" @click="copySummary">复制摘要</button>
          </view>
          <view class="row info-row"><text class="label">交接时间</text><text class="value">{{ record.handoverTime || record.createdAt }}</text></view>
          <view class="row info-row"><text class="label">本班</text><text class="value">{{ record.currentShift || record.fromTeam || '' }}</text></view>
          <view class="row info-row"><text class="label">接班人</text><text class="value">{{ record.nextShift?.name || record.toTeam || '' }}</text></view>
          <view class="row info-row"><text class="label">事项统计</text><text class="value">警情 {{ countType(record,'alert') }} / 任务 {{ countType(record,'task') }} / 纠纷 {{ countType(record,'dispute') }} / 派单 {{ countType(record,'order') }} / 共 {{ (record.items || []).length }} 条</text></view>
          <view class="row column info-row">
            <text class="label">总体备注</text>
            <text class="remark">{{ record.overallRemark || '无' }}</text>
          </view>
        </view>

        <view class="card">
        <view class="section-head">
          <text class="section-title">交接事项</text>
        </view>
          <view v-for="group in groupedItems" :key="group.type" class="group">
          <view class="group-head">{{ typeLabel(group.type) }}（{{ group.items.length }}）</view>
          <view v-for="item in group.items" :key="item.refId" class="item-card">
            <view class="item-head">
              <view class="item-left">
                <view class="item-title single-line">{{ item.title || '—' }}</view>
              </view>
              <view class="badges">
                <text :class="['badge', riskClass(item.priority || item.risk)]">{{ item.priority || item.risk || '—' }}</text>
                <text class="badge status">{{ item.status || '未结' }}</text>
              </view>
            </view>
            <view class="item-meta">{{ metaLine(item) }}</view>
            <view v-if="item.requirement" class="item-remark clamp-2">{{ item.requirement }}</view>
            <view v-if="hasOrigin(item)" class="actions-lite">
              <text class="link" @click="openOrigin(item)">查看原事项</text>
            </view>
          </view>
        </view>
      </view>

        <view class="card">
          <view class="section-head">
            <text class="section-title">信息</text>
          </view>
          <view class="row info-row"><text class="label">记录ID</text><text class="value">{{ record.recordId || record.shiftId }}</text></view>
          <view class="row info-row"><text class="label">创建时间</text><text class="value">{{ formatTime(record.createdAt) }}</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { getHandworkRecords, getShifts } from '@/common/database.js';

const record = ref(null);
const shiftId = ref('');
const recordId = ref('');
const routeId = ref('');
const safeTop = ref(0);

const groupedItems = computed(() => {
  if (!record.value) return [];
  const groups = { alert: [], task: [], dispute: [], order: [] };
  (record.value.items || []).forEach((i) => groups[i.type]?.push(i));
  return Object.keys(groups)
    .filter((k) => groups[k].length)
    .map((k) => ({ type: k, items: groups[k] }));
});

const confirmedCount = computed(() => (record.value?.items || []).filter((i) => i.confirmed).length);

function typeLabel(t) {
  const map = { alert: '警情', task: '任务', dispute: '纠纷', order: '派单' };
  return map[t] || t;
}

function riskClass(risk) {
  if (risk === '高') return 'risk-high';
  if (risk === '中') return 'risk-medium';
  return 'risk-low';
}

function countType(item, type) {
  return (item.items || []).filter((i) => i.type === type).length;
}

function getRecordId(item) {
  return item.recordId || item.shiftId || item.handoverId || [
    item.handoverTime || item.createdAt || '',
    item.currentShift || item.fromTeam || '',
    item.nextShift?.name || item.toTeam || '',
  ].join('_');
}

function metaLine(item) {
  const time = item.deadline ? `截止 ${formatTime(item.deadline)}` : '截止 —';
  const confirmed = item.confirmed ? '已交代' : '未交代';
  return `${time} · ${confirmed}`;
}

function hasOrigin(item) {
  return !!item.refId && ['alert', 'task', 'dispute', 'order'].includes(item.type);
}

function formatTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) {
    return String(val).replace('T', ' ').replace('Z', '').replace('.000', '');
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function copySummary() {
  if (!record.value) return;
  const lines = [];
  const highRisk = (record.value.items || []).filter((i) => i.risk === '高').map((i) => i.title);
  lines.push(`交接时间：${record.value.handoverTime || record.value.createdAt}`);
  lines.push(`本班：${record.value.currentShift || ''} -> 接班：${record.value.nextShift?.name || ''}`);
  lines.push(`未结事项：警情 ${countType(record.value,'alert')} / 任务 ${countType(record.value,'task')} / 纠纷 ${countType(record.value,'dispute')} / 派单 ${countType(record.value,'order')}`);
  lines.push(`已交代 ${confirmedCount.value} 条 / 未交代 ${(record.value.items || []).length - confirmedCount.value} 条`);
  if (highRisk.length) lines.push(`高风险清单：${highRisk.join('、')}`);
  lines.push(`总体备注：${record.value.overallRemark || '无'}`);
  uni.setClipboardData({ data: lines.join('\n') });
}

function openOrigin(item) {
  let url = '/pages/index/index';
  if (item.type === 'alert') url = `/pages/policeDetail/policeDetail?id=${item.refId}`;
  if (item.type === 'task') url = `/pages/task/detail?taskId=${item.refId}`;
  if (item.type === 'dispute') url = `/pages/dispute/detail?disputeId=${item.refId}`;
  if (item.type === 'order') url = `/pages/dispatch/detail?dispatchId=${item.refId}`;
  uni.navigateTo({ url });
}

function loadRecord() {
  const list = getHandworkRecords();
  const source = list.length ? list : getShifts();
  const rec = source.find((s) => {
    if (routeId.value) return getRecordId(s) === routeId.value;
    return s.recordId === recordId.value || s.shiftId === shiftId.value;
  });
  record.value = rec || null;
}

onShow(() => {
  loadRecord();
});

onLoad((query) => {
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset);
  if (query && query.id) routeId.value = query.id;
  if (query && query.recordId) recordId.value = query.recordId;
  if (query && query.shiftId) shiftId.value = query.shiftId;
});
</script>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

.content {
  flex: 1;
  padding: 12rpx 24rpx 40rpx;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
  width: 100%;
  box-sizing: border-box;
}
.section-head { margin-bottom: 8rpx; display: flex; justify-content: space-between; align-items: center; gap: 12rpx; }
.section-title { font-size: 32rpx; font-weight: 700; }
.row { display: flex; justify-content: space-between; margin-top: 6rpx; min-width: 0; width: 100%; box-sizing: border-box; }
.info-row { align-items: flex-start; }
.column { flex-direction: column; align-items: flex-start; }
.label { color: #6b7785; width: 140rpx; flex: 0 0 140rpx; white-space: nowrap; }
.value { color: #1f2b3a; flex: 1 1 auto; min-width: 0; word-break: break-all; }
.remark { color: #1f2b3a; white-space: pre-wrap; }
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}
.group { margin-top: 10rpx; }
.group-head { font-size: 28rpx; color: #344150; margin-bottom: 6rpx; font-weight: 600; }
.item-card { padding: 12rpx; border-radius: 12rpx; background: #f6f8fb; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); margin-bottom: 10rpx; box-sizing: border-box; }
.item-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8rpx; }
.item-left { flex: 1; min-width: 0; }
.item-title { font-size: 30rpx; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.single-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta { color: #6b7785; font-size: 24rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-remark { color: #1f2b3a; font-size: 24rpx; margin-top: 6rpx; }
.badges { display: flex; gap: 6rpx; flex-wrap: wrap; flex: 0 0 auto; }
.badge { padding: 6rpx 10rpx; border-radius: 10rpx; background: #eaf3ff; color: #0f75ff; }
.badge.status { background: #fff6e6; color: #c88719; }
.actions-lite { margin-top: 8rpx; display: flex; justify-content: flex-start; }
.link { color: #3b7cff; font-size: 24rpx; padding: 6rpx 0; }
.empty-card { text-align: center; }
.empty { color: #97a1ad; padding: 12rpx 0; }
.badge.risk-high { background: #ffecec; color: #d64545; }
.badge.risk-medium { background: #fff6e6; color: #c88719; }
.badge.risk-low { background: #e6f7ed; color: #1b9d5d; }

.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 16rpx;
  font-size: 24rpx;
}
</style>
