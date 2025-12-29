<template>
  <view class="handwork pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">交接班（逐条安排）</view>
        <view class="sub">昨日未结事项：{{ filteredItems.length }} 条</view>
      </view>
      <view class="header-actions">
        <button size="mini" class="ghost-btn" @click="goHistory">历史</button>
        <button size="mini" class="ghost-btn" @click="scrollToSummary">生成交接单</button>
      </view>
    </view>

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
        <text class="label">总体备注</text>
        <textarea class="textarea" v-model="overallRemark" placeholder="风险点、总体提醒" />
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">筛选</text>
      </view>
      <view class="chips">
        <view v-for="t in timeRanges" :key="t.value" :class="['chip', filters.timeRange === t.value ? 'active':'']" @click="filters.timeRange = t.value">{{ t.label }}</view>
      </view>
      <view class="chips">
        <view v-for="t in typeOptions" :key="t.value" :class="['chip', filters.types.includes(t.value)?'active':'']" @click="toggleType(t.value)">{{ t.label }}</view>
      </view>
      <view class="chips">
        <view v-for="r in riskOptions" :key="r" :class="['chip', filters.risks.includes(r)?'active':'']" @click="toggleRisk(r)">{{ r }}</view>
      </view>
      <view class="actions">
        <button size="mini" @click="expandAll(true)">展开全部</button>
        <button size="mini" @click="expandAll(false)">收起全部</button>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">未完成事项</text>
        <text class="section-sub">按类型分组</text>
      </view>
      <view v-if="filteredItems.length === 0" class="empty">暂无未结事项</view>
      <view v-for="group in groupedItems" :key="group.type" class="group">
        <view class="group-head">{{ typeLabel(group.type) }}（{{ group.items.length }}）</view>
        <view v-for="item in group.items" :key="item.id" class="item-card">
          <view class="item-head" @click="toggleExpand(item.id)">
            <view>
              <view class="item-title">{{ item.title }}</view>
              <view class="item-meta">{{ item.address || '' }}</view>
            </view>
            <view class="badges">
              <text :class="['badge', riskClass(item.risk)]">{{ item.risk }}</text>
              <text :class="['badge', 'status']">{{ item.status || '未结' }}</text>
              <text class="badge deadline">截止：{{ item.deadline || '--' }}</text>
            </view>
          </view>
          <view v-if="expandedIds.includes(item.id)" class="form">
            <view class="form-row">
              <text class="label">交接给</text>
              <picker :range="userNames" @change="(e)=>setAssignee(item.id, e.detail.value)">
                <view class="picker">{{ item.assign.assigneeName || nextShift.name || '请选择' }}</view>
              </picker>
            </view>
            <view class="form-row">
              <text class="label">截止时间</text>
              <picker mode="datetime" @change="(e)=>setDeadline(item.id,e.detail.value)">
                <view class="picker">{{ item.assign.deadline || defaultDeadline }}</view>
              </picker>
            </view>
            <view class="form-row">
              <text class="label">优先级</text>
              <view class="chips">
                <view v-for="r in riskOptions" :key="r" :class="['chip', item.assign.priority===r?'active':'']" @click="setPriority(item.id,r)">{{ r }}</view>
              </view>
            </view>
            <view class="form-row switch-row">
              <text class="label">需要回访</text>
              <switch :checked="item.assign.needVisit" @change="(e)=>setVisit(item.id,e.detail.value)" />
            </view>
            <view class="form-row column">
              <text class="label">交接要求</text>
              <textarea class="textarea" v-model="item.assign.requirement" placeholder="必填" />
              <button size="mini" @click="applyTemplate(item)">套用模板</button>
            </view>
            <view class="form-row">
              <button size="mini" @click="confirmItem(item.id)" :class="['ghost-btn', item.assign.confirmed?'active-confirm':'' ]">
                {{ item.assign.confirmed ? '已确认' : '标记已确认接收' }}
              </button>
              <button size="mini" @click="openDetail(item)">查看详情</button>
              <button size="mini" @click="removeItem(item.id)">移出交接</button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="card" ref="summaryRef">
      <view class="section-head">
        <text class="section-title">交接摘要</text>
      </view>
      <view class="summary-line">共 {{ filteredItems.length }} 条：警情 {{ countByType('alert') }} / 任务 {{ countByType('task') }} / 纠纷 {{ countByType('dispute') }} / 派单 {{ countByType('order') }}</view>
      <view class="summary-line">已确认 {{ confirmedCount }} 条，未确认 {{ filteredItems.length - confirmedCount }} 条</view>
      <view v-if="missingList.length" class="warning">
        待补全：{{ missingList.join('、') }}
      </view>
    </view>

    <view class="action-bar">
      <button type="primary" class="submit-btn" @click="submit">提交交接单</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  getIncidents,
  getTasks,
  getDisputes,
  getDispatches,
  getShifts,
  saveShifts,
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
const items = ref([]);
const expandedIds = ref([]);

const filters = reactive({
  timeRange: 'yesterday',
  types: ['alert', 'task', 'dispute', 'order'],
  risks: ['高', '中', '低'],
});

const timeRanges = [
  { value: 'yesterday', label: '昨日' },
  { value: '3d', label: '近3天' },
];
const typeOptions = [
  { value: 'alert', label: '警情' },
  { value: 'task', label: '任务' },
  { value: 'dispute', label: '纠纷' },
  { value: 'order', label: '派单' },
];
const riskOptions = ['高', '中', '低'];

const defaultDeadline = computed(() => {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d.toISOString().slice(0, 16).replace('T', ' ');
});

const filteredItems = computed(() => {
  return items.value.filter((i) => filters.types.includes(i.type) && filters.risks.includes(i.risk));
});

const groupedItems = computed(() => {
  const groups = { alert: [], task: [], dispute: [], order: [] };
  filteredItems.value.forEach((i) => groups[i.type].push(i));
  return Object.keys(groups)
    .filter((k) => groups[k].length)
    .map((k) => ({ type: k, items: groups[k] }));
});

const confirmedCount = computed(() => filteredItems.value.filter((i) => i.assign.confirmed).length);

const missingList = computed(() => {
  const arr = [];
  filteredItems.value.forEach((i) => {
    if (!i.assign.assigneeName || !i.assign.deadline || !i.assign.requirement) arr.push(i.title);
  });
  return arr;
});

const summaryRef = ref(null);

function onNextUserChange(e) {
  const idx = e.detail.value;
  nextShift.id = users[idx].id;
  nextShift.name = users[idx].name;
}

function toggleType(val) {
  if (filters.types.includes(val)) filters.types = filters.types.filter((t) => t !== val);
  else filters.types.push(val);
}

function toggleRisk(r) {
  if (filters.risks.includes(r)) filters.risks = filters.risks.filter((x) => x !== r);
  else filters.risks.push(r);
}

function expandAll(open) {
  expandedIds.value = open ? filteredItems.value.map((i) => i.id) : [];
}

function toggleExpand(id) {
  if (expandedIds.value.includes(id)) {
    expandedIds.value = expandedIds.value.filter((x) => x !== id);
  } else {
    expandedIds.value.push(id);
  }
}

function riskClass(risk) {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}

function typeLabel(t) {
  const map = { alert: '警情', task: '任务', dispute: '纠纷', order: '派单' };
  return map[t] || t;
}

function loadData() {
  const arr = [];
  getIncidents().forEach((i) => {
    arr.push(makeItem('alert', i.id, i.title, i.riskLevel || '中', i.address || '', i.status || '未结', i.url || '/pages/policeDetail/policeDetail'));
  });
  getTasks().forEach((t) => {
    if (t.status === 'DONE' || t.status === 'done') return;
    arr.push(makeItem('task', t.id, t.title, t.riskLevel || '中', t.address || '', t.status || '未结', `/pages/task/detail?taskId=${t.id}`));
  });
  getDisputes().forEach((d) => {
    arr.push(makeItem('dispute', d.id, d.title || d.name, d.riskLevel || '中', d.address || d.community || '', d.status || '未结', d.url || '/pages/policeDetail/policeDetail'));
  });
  getDispatches().forEach((d) => {
    if (d.status === 'DONE' || d.status === 'done') return;
    arr.push(makeItem('order', d.dispatchId, d.entityTitle || d.desc || '派单', d.risk || '中', '', d.status || '未结', `/pages/dispatch/detail?dispatchId=${d.dispatchId}`));
  });
  items.value = arr;
}

function makeItem(type, id, title, risk, address, status, url) {
  return {
    type,
    id,
    title,
    risk,
    address,
    status,
    url,
    deadline: defaultDeadline.value,
    assign: {
      assigneeId: nextShift.id,
      assigneeName: nextShift.name,
      deadline: defaultDeadline.value,
      requirement: '',
      priority: risk,
      needVisit: type === 'dispute',
      confirmed: false,
    },
  };
}

function setAssignee(id, idx) {
  const user = users[idx];
  updateItem(id, (item) => {
    item.assign.assigneeId = user.id;
    item.assign.assigneeName = user.name;
  });
}
function setDeadline(id, val) {
  updateItem(id, (item) => {
    item.assign.deadline = val;
  });
}
function setPriority(id, val) {
  updateItem(id, (item) => {
    item.assign.priority = val;
  });
}
function setVisit(id, val) {
  updateItem(id, (item) => {
    item.assign.needVisit = val;
  });
}
function confirmItem(id) {
  updateItem(id, (item) => {
    item.assign.confirmed = true;
  });
}
function removeItem(id) {
  items.value = items.value.filter((i) => i.id !== id);
  expandedIds.value = expandedIds.value.filter((x) => x !== id);
}
function updateItem(id, fn) {
  items.value = items.value.map((i) => {
    if (i.id === id) {
      const clone = { ...i, assign: { ...i.assign } };
      fn(clone);
      return clone;
    }
    return i;
  });
}

function applyTemplate(item) {
  const deadline = item.assign.deadline || defaultDeadline.value;
  const name = item.title;
  const addr = item.address || '';
  let tpl = '';
  if (item.type === 'alert') tpl = `请在${deadline}前完成回告/补录处置经过，重点关注：${addr || name}。`;
  if (item.type === 'task') tpl = `请按任务要求完成走访/巡逻并提交反馈（至少1张照片）。`;
  if (item.type === 'dispute') tpl = `请在${deadline}前完成回访并更新记录，必要时安排二次调处。`;
  if (item.type === 'order') tpl = `请跟进派单执行进度，必要时催办并记录反馈。`;
  updateItem(item.id, (it) => (it.assign.requirement = tpl));
}

function countByType(t) {
  return filteredItems.value.filter((i) => i.type === t).length;
}

function scrollToSummary() {
  uni.pageScrollTo({ selector: '#summary', duration: 300 });
}

function goHistory() {
  uni.navigateTo({ url: '/pages/handwork/history' });
}

function openDetail(item) {
  if (item.url) uni.navigateTo({ url: item.url });
  else uni.showToast({ title: '暂无详情', icon: 'none' });
}

function submit() {
  if (!nextShift.id && !nextShift.name) {
    uni.showToast({ title: '请选择接班人', icon: 'none' });
    return;
  }
  const firstMissing = filteredItems.value.find((i) => !i.assign.assigneeName || !i.assign.deadline || !i.assign.requirement);
  if (firstMissing) {
    uni.showToast({ title: `请补全：${firstMissing.title}`, icon: 'none' });
    return;
  }
  const record = {
    shiftId: `shift-${Date.now()}`,
    handoverTime: handoverTime.value,
    currentShift,
    nextShift: { ...nextShift },
    overallRemark: overallRemark.value,
    items: filteredItems.value.map((i) => ({
      type: i.type,
      refId: i.id,
      title: i.title,
      risk: i.risk,
      status: i.status,
      assignedToUserId: i.assign.assigneeId,
      assignedToUserName: i.assign.assigneeName,
      deadline: i.assign.deadline,
      requirement: i.assign.requirement,
      priority: i.assign.priority,
      needVisit: i.assign.needVisit,
      confirmed: i.assign.confirmed,
    })),
    createdAt: new Date().toISOString(),
  };
  const list = [record, ...getShifts()];
  saveShifts(list);

  // 待办同步
  const todos = getTodos();
  filteredItems.value.forEach((i) => {
    todos.unshift({
      id: `handover-${i.id}-${Date.now()}`,
      type: mapTypeToTodo(i.type),
      refId: i.id,
      title: `交接：${i.title}`,
      deadline: i.assign.deadline,
      status: 'pending',
      url: i.url || '/pages/index/index',
    });
  });
  saveTodos(todos);

  uni.showToast({ title: '交接成功', icon: 'success' });
  uni.navigateTo({ url: `/subPackages/shift/index` });
}

function mapTypeToTodo(t) {
  const map = { alert: 'alert', task: 'task', dispute: 'dispute', order: 'order' };
  return map[t] || 'task';
}

onShow(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.handwork {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
}
.header {
  padding: 10rpx 0 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title { font-size: 44rpx; font-weight: 700; }
  .sub { margin-top: 6rpx; color: #6e7a89; font-size: 26rpx; }
  .ghost-btn { border: 1px solid #d0d6de; background: #fff; color: #1f2b3a; padding: 10rpx 18rpx; border-radius: 12rpx; }
}
.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
}
.section-head { margin-bottom: 8rpx; display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 32rpx; font-weight: 700; }
.section-sub { font-size: 24rpx; color: #6e7a89; }
.form-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10rpx; }
.form-row.column { flex-direction: column; align-items: flex-start; }
.label { font-size: 28rpx; color: #344150; margin-right: 10rpx; }
.value { color: #1f2b3a; font-size: 28rpx; }
.picker { background: #f4f6f8; padding: 12rpx 14rpx; border-radius: 12rpx; min-width: 220rpx; }
.textarea { width: 100%; min-height: 140rpx; background: #f4f6f8; border-radius: 12rpx; padding: 14rpx; font-size: 28rpx; }
.chips { display: flex; flex-wrap: wrap; gap: 10rpx; margin: 8rpx 0; }
.chip { padding: 10rpx 14rpx; border-radius: 12rpx; background: #f4f6f8; font-size: 24rpx; }
.chip.active { background: #0f75ff; color: #fff; }
.actions { display: flex; gap: 10rpx; }
.group { margin-top: 10rpx; }
.group-head { font-size: 28rpx; color: #344150; margin-bottom: 6rpx; font-weight: 600; }
.item-card { padding: 12rpx; border-radius: 12rpx; background: #f6f8fb; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); margin-bottom: 10rpx; }
.item-head { display: flex; justify-content: space-between; align-items: center; }
.item-title { font-size: 30rpx; font-weight: 700; }
.item-meta { color: #6b7785; font-size: 24rpx; }
.badges { display: flex; gap: 6rpx; flex-wrap: wrap; }
.badge { padding: 6rpx 10rpx; border-radius: 10rpx; background: #eaf3ff; color: #0f75ff; }
.badge.status { background: #fff6e6; color: #c88719; }
.badge.deadline { background: #f4f6f8; color: #1f2b3a; }
.form { margin-top: 10rpx; display: flex; flex-direction: column; gap: 8rpx; }
.switch-row { justify-content: space-between; }
.ghost-btn.active-confirm { border-color: #1b9d5d; color: #1b9d5d; }
.empty { text-align: center; color: #97a1ad; padding: 12rpx 0; }
.summary-line { font-size: 28rpx; color: #1f2b3a; margin-bottom: 6rpx; }
.warning { color: #d64545; font-size: 26rpx; }
.action-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 10rpx 20rpx 20rpx; background: rgba(255,255,255,0.95); box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08); }
.submit-btn { width: 100%; background: linear-gradient(90deg, #0f75ff, #56a0ff); color: #fff; border-radius: 12rpx; }
.risk.high { background: #ffecec; color: #d64545; }
.risk.medium { background: #fff6e6; color: #c88719; }
.risk.low { background: #e6f7ed; color: #1b9d5d; }
</style>
