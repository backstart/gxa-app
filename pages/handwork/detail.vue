<template>
  <view class="detail pageBg">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ top: statusBarHeight + 'px' }">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
      <view class="nav-title">交接详情</view>
      <view class="nav-right">
        <button size="mini" class="nav-btn ghost" @click="copySummary">复制</button>
      </view>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="!record" class="card empty-card">
        <view class="empty">未找到交接记录</view>
        <button size="mini" @click="goBack">返回</button>
      </view>

      <view v-else>
        <view class="card">
        <view class="section-head">
          <text class="section-title">交接信息</text>
        </view>
        <view class="row"><text class="label">交接时间</text><text class="value">{{ record.handoverTime || record.createdAt }}</text></view>
        <view class="row"><text class="label">本班</text><text class="value">{{ record.currentShift || record.fromTeam || '' }}</text></view>
        <view class="row"><text class="label">下一班</text><text class="value">{{ record.nextShift?.name || record.toTeam || '' }}</text></view>
        <view class="row"><text class="label">事项统计</text><text class="value">共 {{ record.items.length }} 条，已确认 {{ confirmedCount }} 条</text></view>
        <view class="row column">
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
              <view>
                <view class="item-title">{{ typeLabel(item.type) }} · {{ item.title }}</view>
                <view class="item-meta">截止：{{ item.deadline || '--' }}</view>
              </view>
              <view class="badges">
                <text :class="['badge', riskClass(item.priority || item.risk)]">{{ item.priority || item.risk }}</text>
                <text class="badge status">{{ item.status || '未结' }}</text>
              </view>
            </view>
            <view class="row"><text class="label">安排给</text><text class="value">{{ item.assignedToUserName || '未指定' }}</text></view>
            <view class="row"><text class="label">需要回访</text><text class="value">{{ item.needVisit ? '是' : '否' }}</text></view>
            <view class="row"><text class="label">确认状态</text><text class="value">{{ item.confirmed ? '已确认' : '未确认' }}</text></view>
            <view class="row column">
              <text class="label">交接要求</text>
              <text class="remark">{{ item.requirement || '无' }}</text>
            </view>
            <view class="actions">
              <button size="mini" @click="openOrigin(item)">查看原事项详情</button>
            </view>
          </view>
        </view>
      </view>

        <view class="card">
        <view class="section-head">
          <text class="section-title">信息</text>
        </view>
        <view class="row"><text class="label">shiftId</text><text class="value">{{ record.shiftId }}</text></view>
        <view class="row"><text class="label">创建时间</text><text class="value">{{ record.createdAt }}</text></view>
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
const statusBarHeight = ref(0);

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
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}

function countType(item, type) {
  return (item.items || []).filter((i) => i.type === type).length;
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

function goBack() {
  uni.navigateBack();
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
  const rec = source.find((s) => s.recordId === recordId.value || s.shiftId === shiftId.value);
  record.value = rec || null;
}

onShow(() => {
  loadRecord();
});

onLoad((query) => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 0;
  if (query && query.recordId) recordId.value = query.recordId;
  if (query && query.shiftId) shiftId.value = query.shiftId;
});
</script>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.status-bar {
  width: 100%;
  background: transparent;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 24rpx;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}

.nav-left {
  width: 140rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
  color: #1f2b3a;
}
.back-icon { font-size: 36rpx; }
.back-text { font-size: 26rpx; }

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.nav-right {
  width: 140rpx;
  display: flex;
  justify-content: flex-end;
}

.nav-btn {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 14rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
}
.nav-btn.ghost {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
}

.content {
  flex: 1;
  padding: 12rpx 24rpx 40rpx;
}

.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
}
.section-head { margin-bottom: 8rpx; }
.section-title { font-size: 32rpx; font-weight: 700; }
.row { display: flex; justify-content: space-between; margin-top: 6rpx; }
.column { flex-direction: column; align-items: flex-start; }
.label { color: #6b7785; }
.value { color: #1f2b3a; }
.remark { color: #1f2b3a; white-space: pre-wrap; }
.group { margin-top: 10rpx; }
.group-head { font-size: 28rpx; color: #344150; margin-bottom: 6rpx; font-weight: 600; }
.item-card { padding: 12rpx; border-radius: 12rpx; background: #f6f8fb; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); margin-bottom: 10rpx; }
.item-head { display: flex; justify-content: space-between; align-items: center; }
.item-title { font-size: 30rpx; font-weight: 700; }
.item-meta { color: #6b7785; font-size: 24rpx; }
.badges { display: flex; gap: 6rpx; flex-wrap: wrap; }
.badge { padding: 6rpx 10rpx; border-radius: 10rpx; background: #eaf3ff; color: #0f75ff; }
.badge.status { background: #fff6e6; color: #c88719; }
.actions { margin-top: 8rpx; display: flex; justify-content: flex-end; }
.empty-card { text-align: center; }
.empty { color: #97a1ad; padding: 12rpx 0; }
.risk.high { background: #ffecec; color: #d64545; }
.risk.medium { background: #fff6e6; color: #c88719; }
.risk.low { background: #e6f7ed; color: #1b9d5d; }
</style>
