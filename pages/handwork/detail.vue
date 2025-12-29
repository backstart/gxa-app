<template>
  <view class="detail pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">交接详情</view>
      </view>
      <button size="mini" class="ghost-btn" @click="copySummary">复制交接摘要</button>
    </view>

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
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getShifts } from '@/common/database.js';

const record = ref(null);
const shiftId = ref('');

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

function copySummary() {
  if (!record.value) return;
  const lines = [];
  lines.push(`交接时间：${record.value.handoverTime || record.value.createdAt}`);
  lines.push(`本班：${record.value.currentShift || ''} -> 下一班：${record.value.nextShift?.name || ''}`);
  lines.push(`共 ${record.value.items.length} 条，已确认 ${confirmedCount.value} 条`);
  (record.value.items || []).forEach((i) => {
    lines.push(`${typeLabel(i.type)}-${i.title} | ${i.assignedToUserName || '未指定'} | 截止 ${i.deadline || '--'} | ${i.requirement ? i.requirement.slice(0,30) : ''}`);
  });
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

onShow((query) => {
  if (query && query.shiftId) shiftId.value = query.shiftId;
  const rec = getShifts().find((s) => s.shiftId === shiftId.value);
  record.value = rec || null;
});
</script>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
}
.header {
  padding: 10rpx 0 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title { font-size: 44rpx; font-weight: 700; }
  .ghost-btn { border: 1px solid #d0d6de; background: #fff; color: #1f2b3a; padding: 10rpx 18rpx; border-radius: 12rpx; }
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
