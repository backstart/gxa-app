<template>
  <view class="handwork pageBg">
    <scroll-view class="content" scroll-y>
      <view class="page-sub">昨日未结事项：{{ selectedCases.length }} 条</view>

      <view class="card">
      <view class="section-head">
        <text class="section-title">交接信息</text>
      </view>
      <view class="form-row">
        <text class="label">本班</text>
        <text class="value">{{ currentShift }}</text>
      </view>
      <view class="form-row">
        <text class="label">接班人/组</text>
        <picker :range="userNames" @change="onNextUserChange">
          <view class="picker">{{ nextShift.name || '请选择' }}</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="label">交接时间</text>
        <picker mode="datetime" @change="(e)=>handoverTime = e.detail.value">
          <view class="picker">{{ handoverTime }}</view>
        </picker>
      </view>
      <view class="form-row column">
        <view class="row-head">
          <text class="label">总体备注</text>
          <button size="mini" class="text-btn" @click="insertRemarkTemplate">插入模板</button>
        </view>
        <textarea class="textarea" v-model="overallRemark" placeholder="风险点、总体提醒" />
      </view>
    </view>

      <view class="card list-card">
      <view class="section-head">
        <text class="section-title">未完成事项</text>
        <view class="list-tools">
          <button size="mini" class="tool-btn" @click="toggleExpandAll">{{ expandedAll ? '收起' : '展开' }}</button>
        </view>
      </view>

      <view class="select-entry" @click="goSelectCase">
        <view>
          <view class="select-title">选择事项</view>
          <view class="select-sub">从警情中选择需要交接的事项</view>
        </view>
        <text class="select-arrow">></text>
      </view>

      <view v-if="selectedCases.length === 0" class="empty">尚未选择事项</view>
      <view v-else class="case-list">
        <view v-for="item in displayCases" :key="item.id" class="case-card">
          <view class="case-head">
            <text class="case-title">{{ item.title }}</text>
            <view class="case-tags">
              <text :class="['tag', riskClass(item.level)]">{{ item.level }}</text>
              <text class="tag status">{{ item.status }}</text>
            </view>
          </view>
          <view class="case-meta">编号：{{ item.no }}</view>
          <view class="case-row">
            <text class="case-addr">{{ item.addr }}</text>
            <text class="case-time">{{ item.time }}</text>
          </view>
          <view class="case-actions">
            <button size="mini" class="ghost-btn" @click="removeSelected(item.id)">移除</button>
          </view>
        </view>
        <view v-if="!expandedAll" class="case-more">共 {{ selectedCases.length }} 条</view>
      </view>
    </view>

      <view class="card">
      <view class="section-head">
        <text class="section-title">交接摘要</text>
      </view>
      <view class="summary-line">共 {{ selectedCases.length }} 条：高 {{ riskCount.high }} / 中 {{ riskCount.mid }} / 低 {{ riskCount.low }}</view>
    </view>
    </scroll-view>

    <view class="action-bar">
      <button class="ghost-btn" @click="goHistory">查看历史</button>
      <button type="primary" class="submit-btn" :class="{ disabled: !canSubmit }" @click="handleSubmit">提交交接单</button>
    </view>

  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import {
  getShifts,
  saveShifts,
  saveHandworkRecords,
  getTodos,
  saveTodos,
} from '@/common/database.js';

const currentShift = '本班：A组-李警官';
const users = [
  { id: 'u1', name: '李警官' },
  { id: 'u2', name: '王警官' },
  { id: 'u3', name: '张警官' },
  { id: 'u4', name: '陈警官' },
];
const userNames = users.map((u) => u.name);

const nextShift = reactive({ id: '', name: '' });
const handoverTime = ref(new Date().toISOString().slice(0, 16).replace('T', ' '));
const overallRemark = ref('');
const selectedCases = ref([]);
const showAll = ref(false);

const displayCases = computed(() => (showAll.value ? selectedCases.value : selectedCases.value.slice(0, 3)));
const expandedAll = computed(() => showAll.value);
const canSubmit = computed(() => !!nextShift.id || !!nextShift.name);
const riskCount = computed(() => {
  const map = { high: 0, mid: 0, low: 0 };
  selectedCases.value.forEach((c) => {
    if (c.level === '高') map.high += 1;
    else if (c.level === '中') map.mid += 1;
    else map.low += 1;
  });
  return map;
});

function onNextUserChange(e) {
  const idx = e.detail.value;
  nextShift.id = users[idx].id;
  nextShift.name = users[idx].name;
}

function toggleExpandAll() {
  showAll.value = !showAll.value;
}

function riskClass(risk) {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}

function goSelectCase() {
  uni.navigateTo({
    url: '/pages/handwork/selectCase',
    success: (res) => {
      res.eventChannel.on('select', (payload) => {
        if (!payload || !payload.id) return;
        const exists = selectedCases.value.some((c) => c.id === payload.id);
        if (exists) {
          uni.showToast({ title: '该警情已在交接列表中', icon: 'none' });
          return;
        }
        selectedCases.value = [payload, ...selectedCases.value];
      });
    },
  });
}

function removeSelected(id) {
  selectedCases.value = selectedCases.value.filter((c) => c.id !== id);
}

function insertRemarkTemplate() {
  const tpl = '风险点：\n重点关注：\n待办提醒：';
  if (!overallRemark.value) {
    overallRemark.value = tpl;
  } else {
    overallRemark.value = `${overallRemark.value}\n${tpl}`;
  }
}

function goHistory() {
  uni.navigateTo({ url: '/pages/handwork/history' });
}

function handleSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请先选择接班人/组', icon: 'none' });
    return;
  }
  if (!selectedCases.value.length) {
    uni.showToast({ title: '未选择事项', icon: 'none' });
    return;
  }
  submit();
}

function buildSummaryText() {
  const highRisk = selectedCases.value.filter((i) => i.level === '高').map((i) => i.title);
  const lines = [];
  lines.push(`交接时间：${handoverTime.value}`);
  lines.push(`本班：${currentShift} -> 接班：${nextShift.name || '未指定'}`);
  lines.push(`未结事项：共 ${selectedCases.value.length} 条，高 ${riskCount.value.high} / 中 ${riskCount.value.mid} / 低 ${riskCount.value.low}`);
  if (highRisk.length) lines.push(`高风险清单：${highRisk.join('、')}`);
  lines.push(`总体备注：${overallRemark.value || '无'}`);
  return lines.join('\n');
}

function submit() {
  doSubmit();
}

function doSubmit() {
  const recordId = `handover-${Date.now()}`;
  const record = {
    recordId,
    shiftId: recordId,
    handoverTime: handoverTime.value,
    currentShift,
    nextShift: { ...nextShift },
    overallRemark: overallRemark.value,
    items: selectedCases.value.map((i) => ({
      type: 'alert',
      refId: i.id,
      title: i.title,
      risk: i.level,
      status: i.status,
      assignedToUserId: nextShift.id,
      assignedToUserName: nextShift.name,
      deadline: '',
      requirement: '',
      priority: i.level,
      needVisit: false,
      confirmed: false,
      note: '',
    })),
    createdAt: new Date().toISOString(),
  };
  const list = [record, ...getShifts()];
  saveShifts(list);
  saveHandworkRecords(list);

  const todos = getTodos();
  selectedCases.value.forEach((i) => {
    todos.unshift({
      id: `handover-${i.id}-${Date.now()}`,
      type: 'alert',
      refId: i.id,
      title: `交接：${i.title}`,
      deadline: '',
      status: 'pending',
      url: '/pages/policeDetail/policeDetail',
    });
  });
  saveTodos(todos);

  uni.showToast({ title: '交接成功', icon: 'success' });
  uni.navigateTo({ url: `/pages/handwork/detail?recordId=${recordId}` });
}

</script>

<style lang="scss" scoped>
.handwork {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.handwork,
.handwork * {
  box-sizing: border-box;
}

.content {
  flex: 1;
  padding: 12rpx 24rpx calc(180rpx + env(safe-area-inset-bottom));
}

.page-sub {
  margin-bottom: 12rpx;
  color: #6e7a89;
  font-size: 26rpx;
}

.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
  width: 100%;
}
.section-head { margin-bottom: 8rpx; display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 32rpx; font-weight: 700; }
.section-sub { font-size: 24rpx; color: #6e7a89; }
.form-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10rpx; width: 100%; }
.form-row.column { flex-direction: column; align-items: flex-start; }
.label { font-size: 28rpx; color: #344150; margin-right: 10rpx; width: 120rpx; flex-shrink: 0; }
.value { color: #1f2b3a; font-size: 28rpx; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-head { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.text-btn { font-size: 24rpx; color: #0f75ff; background: transparent; padding: 0; }
.picker { background: #f4f6f8; padding: 12rpx 14rpx; border-radius: 12rpx; flex: 1; min-width: 0; }
.textarea { width: 100%; min-height: 140rpx; background: #f4f6f8; border-radius: 12rpx; padding: 14rpx; font-size: 28rpx; }
.chips { display: flex; flex-wrap: wrap; gap: 10rpx; margin: 8rpx 0; }
.chip { padding: 10rpx 14rpx; border-radius: 12rpx; background: #f4f6f8; font-size: 24rpx; }
.chip.active { background: #0f75ff; color: #fff; }

.list-tools { display: flex; gap: 10rpx; }
.tool-btn { height: 52rpx; line-height: 52rpx; padding: 0 16rpx; font-size: 24rpx; border-radius: 12rpx; background: #f4f6f8; color: #1f2b3a; }

.select-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 16rpx;
  border-radius: 12rpx;
  background: #f6f8fb;
  margin-bottom: 12rpx;
}
.select-title { font-size: 28rpx; color: #1f2b3a; font-weight: 600; }
.select-sub { font-size: 24rpx; color: #6b7785; margin-top: 4rpx; }
.select-arrow { color: #97a1ad; font-size: 28rpx; }
.group { margin-top: 10rpx; }
.group-head { font-size: 28rpx; color: #344150; margin-bottom: 6rpx; font-weight: 600; }
.item-card { padding: 12rpx; border-radius: 12rpx; background: #f6f8fb; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); margin-bottom: 10rpx; }
.item-head { display: flex; justify-content: space-between; align-items: center; }
.item-head > view { min-width: 0; flex: 1; }
.item-title { font-size: 30rpx; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta { color: #6b7785; font-size: 24rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6rpx; }
.badges { display: flex; gap: 6rpx; flex-wrap: wrap; justify-content: flex-end; }
.badge { padding: 6rpx 10rpx; border-radius: 10rpx; background: #eaf3ff; color: #0f75ff; }
.badge.status { background: #fff6e6; color: #c88719; }
.badge.deadline { background: #f4f6f8; color: #1f2b3a; }
.handover-check { display: flex; align-items: center; gap: 6rpx; font-size: 22rpx; color: #6b7785; }
.check-label { font-size: 22rpx; }
.form { margin-top: 10rpx; display: flex; flex-direction: column; gap: 8rpx; }
.switch-row { justify-content: space-between; }
.inline-actions { display: flex; gap: 10rpx; margin-top: 8rpx; }
.empty { text-align: center; color: #97a1ad; padding: 12rpx 0; }
.summary-line { font-size: 28rpx; color: #1f2b3a; margin-bottom: 6rpx; }
.warning { color: #d64545; font-size: 26rpx; }
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12rpx;
  padding: 12rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.action-bar .ghost-btn {
  flex: 1;
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
  height: 72rpx;
  line-height: 72rpx;
}
.submit-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: linear-gradient(90deg, #ff8a00, #ffb34d);
  color: #fff;
  border-radius: 12rpx;
}
.submit-btn.disabled { background: #eef1f5; color: #a0a8b3; }
.risk.high { background: #ffecec; color: #d64545; }
.risk.medium { background: #fff6e6; color: #c88719; }
.risk.low { background: #e6f7ed; color: #1b9d5d; }

.case-list { display: flex; flex-direction: column; gap: 10rpx; }
.case-card { padding: 12rpx; border-radius: 12rpx; background: #f6f8fb; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); }
.case-head { display: flex; justify-content: space-between; align-items: center; }
.case-title { font-size: 30rpx; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.case-tags { display: flex; gap: 6rpx; }
.tag { padding: 4rpx 10rpx; border-radius: 10rpx; font-size: 22rpx; }
.tag.status { background: #eef1f5; color: #6b7785; }
.case-meta { color: #6b7785; font-size: 24rpx; margin-top: 6rpx; }
.case-row { display: flex; justify-content: space-between; color: #6b7785; font-size: 24rpx; margin-top: 4rpx; gap: 8rpx; }
.case-addr { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.case-time { flex-shrink: 0; }
.case-actions { margin-top: 6rpx; display: flex; justify-content: flex-end; }
.case-more { text-align: center; color: #6b7785; font-size: 24rpx; padding: 6rpx 0; }
</style>
