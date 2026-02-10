<template>
  <!-- 使用系统导航栏后，页面顶部不再自绘 header，避免双返回与顶部留白 -->
  <view class="dispatch pageBg">
    <!-- 卡片A：任务类型 -->
    <view class="card">
      <view class="section-head">
        <text class="section-title">任务类型</text>
        <text class="section-sub">必选</text>
      </view>
      <view class="chips">
        <view
          v-for="item in taskTypes"
          :key="item.value"
          :class="['chip', form.taskType === item.value ? 'active' : '']"
          @tap.stop="selectTaskType(item.value)"
        >
          {{ item.label }}
        </view>
      </view>
    </view>

    <!-- 卡片B：关联对象 -->
    <view class="card">
      <view class="section-head">
        <text class="section-title">关联对象</text>
        <text class="section-sub">{{ currentEntityLabel }}</text>
      </view>

      <view class="selected-list" v-if="selectedEntities.length">
        <view class="selected-card" v-for="item in selectedEntities" :key="item.id">
          <view class="selected-main">
            <text class="sel-title">{{ item.name }}</text>
            <text class="sel-meta">{{ item.type }} · {{ item.riskLevel }}</text>
          </view>
          <!-- 交互元素改用 view，避免 text 在部分端点击命中不稳定 -->
          <view class="remove-link" @tap.stop="removeEntity(item.id)">移除</view>
        </view>
      </view>
      <view v-else class="empty-text">未选择关联对象</view>

      <view class="row-actions">
        <!-- 改为跳转独立选择页，避免弹层在模拟器/真机事件模型差异导致的不稳定 -->
        <view class="choose-btn" @tap.stop="openEntitySelectPage">选择关联对象</view>
      </view>
    </view>

    <!-- 卡片C：指派信息 -->
    <view class="card">
      <view class="section-head">
        <text class="section-title">指派信息</text>
        <text class="section-sub">必填项</text>
      </view>

      <view class="form-item">
        <text class="label">执行人</text>
        <view class="input-row">
          <text class="value-text">{{ form.assigneeName || '请选择执行人' }}</text>
          <!-- 改为跳转独立选择页，交互与“交接班选择事项”保持一致 -->
          <view class="row-btn" @tap.stop="openUserSelectPage">选择</view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">截止时间</text>
        <picker mode="datetime" @change="onDeadlineChange">
          <view class="input-row">
            <text class="value-text">{{ form.deadline || '请选择截止时间' }}</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">风险等级</text>
        <view class="chips">
          <view
            v-for="item in riskOptions"
            :key="item"
            :class="['chip', form.risk === item ? 'active' : '']"
            @tap="form.risk = item"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">必须回访</text>
        <view class="switch-row">
          <switch :checked="form.mustVisit" @change="onVisitToggle" />
        </view>
      </view>
    </view>

    <!-- 卡片D：任务说明 -->
    <view class="card">
      <view class="section-head">
        <text class="section-title">任务说明</text>
        <text class="section-sub">必填</text>
      </view>
      <textarea v-model="form.desc" class="textarea" placeholder="请输入任务说明" />
    </view>

    <!-- 固定底部提交：预留 safe-area，避免被手势条遮挡 -->
    <view class="action-bar">
      <button type="primary" class="submit-btn" @tap="submit">提交派单</button>
    </view>

  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  addDispatch,
  getPlaces,
  getTasks,
  getTodos,
  saveTasks,
  saveTodos,
} from '@/common/database.js';

const taskTypes = [
  { value: 'INCIDENT_FOLLOW', label: '警情跟进' },
  { value: 'PATROL', label: '巡逻' },
  { value: 'PLACE_VISIT', label: '场所走访/检查' },
  { value: 'KEY_PERSON_VISIT', label: '重点人走访/核查' },
  { value: 'DISPUTE_VISIT', label: '矛盾纠纷回访' },
];

const riskOptions = ['高', '中', '低'];

const form = reactive({
  taskType: '',
  entityType: '',
  entities: [],
  assigneeId: '',
  assigneeName: '',
  deadline: '',
  risk: '中',
  mustVisit: false,
  desc: '',
});

const sourceModule = ref('');

const currentEntityType = computed(() => {
  switch (form.taskType) {
    case 'PLACE_VISIT':
      return 'KEY_PLACE';
    case 'KEY_PERSON_VISIT':
      return 'KEY_PERSON';
    case 'INCIDENT_FOLLOW':
      return 'INCIDENT';
    case 'DISPUTE_VISIT':
      return 'DISPUTE';
    case 'PATROL':
      return 'PATROL_POINT';
    default:
      return '';
  }
});

const currentEntityLabel = computed(() => {
  const map = {
    KEY_PLACE: '场所',
    KEY_PERSON: '重点人',
    INCIDENT: '警情',
    DISPUTE: '纠纷',
    PATROL_POINT: '巡逻点',
  };
  return map[currentEntityType.value] || '请选择关联对象';
});

const selectedEntities = computed(() => form.entities || []);

function resetForm() {
  form.taskType = '';
  form.entityType = '';
  form.entities = [];
  form.assigneeId = '';
  form.assigneeName = '';
  form.deadline = '';
  form.risk = '中';
  form.mustVisit = false;
  form.desc = '';
  sourceModule.value = '';
}

function selectTaskType(val) {
  form.taskType = val;
  form.entityType = currentEntityType.value;
  form.entities = [];
  form.mustVisit = val === 'DISPUTE_VISIT' || val === 'KEY_PERSON_VISIT';
  generateDesc();
}

function openEntitySelectPage() {
  if (!form.taskType) {
    // 关联对象依赖任务类型来决定数据来源，未选类型时先提示用户
    uni.showToast({ title: '请先选择任务类型', icon: 'none' });
    return;
  }
  // 通过独立选择页处理选择流程，规避弹层在模拟器与真机事件模型差异问题
  uni.navigateTo({
    url: `/pages/dispatch/selectEntity?taskType=${encodeURIComponent(form.taskType)}&selectedIds=${encodeURIComponent((form.entities || []).map((item) => item.id).join(','))}`,
    events: {
      selected: (payload) => {
        // 选择页回传后统一更新表单，保持原有风险/说明联动逻辑
        const entities = Array.isArray(payload?.entities) ? payload.entities : [];
        form.entities = [...entities];
        updateRiskFromEntities();
        generateDesc();
      },
    },
  });
}

function removeEntity(id) {
  form.entities = form.entities.filter((e) => e.id !== id);
  updateRiskFromEntities();
  generateDesc();
}

function openUserSelectPage() {
  // 执行人改为跳转独立选择页，交互与“交接班选择事项”一致
  uni.navigateTo({
    url: `/pages/dispatch/selectUser?selectedId=${encodeURIComponent(form.assigneeId || '')}`,
    events: {
      selected: (payload) => {
        // 选择页返回后直接回填执行人
        if (!payload?.id) return;
        form.assigneeId = payload.id;
        form.assigneeName = payload.name || '';
      },
    },
  });
}

function onDeadlineChange(e) {
  form.deadline = e.detail.value;
}

function onVisitToggle(e) {
  form.mustVisit = e.detail.value;
}

function updateRiskFromEntities() {
  if (!form.entities.length) {
    form.risk = '中';
    return;
  }
  const ranks = { 高: 3, 中: 2, 低: 1 };
  const max = form.entities.reduce((acc, cur) => Math.max(acc, ranks[cur.riskLevel] || 1), 1);
  form.risk = Object.keys(ranks).find((k) => ranks[k] === max) || '中';
}

function generateDesc() {
  if (!form.taskType || !form.entities.length) {
    form.desc = '';
    return;
  }
  const name = form.entities[0].name || form.entities[0].title;
  const moduleNote = sourceModule.value ? `重点检查【${moduleLabel(sourceModule.value)}】模块。` : '';
  const tplMap = {
    PLACE_VISIT: `对娱乐场所【${name}】开展走访检查，核查台账与安全隐患，发现问题及时反馈整改。${moduleNote}`,
    KEY_PERSON_VISIT: `对重点人【${name}】进行走访核查，了解动态与风险，发现异常及时上报。`,
    INCIDENT_FOLLOW: `对警情【${name}】开展跟进处置，跟踪进展并及时反馈。`,
    DISPUTE_VISIT: `对纠纷【${name}】进行回访，了解进度与情绪，必要时再次介入调处。`,
    PATROL: form.entities.length
      ? `对巡逻点【${form.entities.map((e) => e.name).join('、')}】开展巡逻，关注可疑情况并上报。`
      : '开展巡逻任务，关注可疑情况并上报。',
  };
  form.desc = tplMap[form.taskType] || '';
}

function moduleLabel(type) {
  const map = {
    BILLIARD: '台球',
    CHESS_CARD: '棋牌',
    NETBAR: '网吧',
    FOOTBATH: '足浴',
    KTV: 'KTV',
  };
  return map[type] || type;
}

function applySource(query) {
  if (!query || !query.sourceType) return;
  if (query.sourceType === 'KEY_PLACE') {
    form.taskType = 'PLACE_VISIT';
    form.entityType = 'KEY_PLACE';
    sourceModule.value = query.module || '';
    const place = getPlaces().find((p) => p.placeId === query.sourceId) || null;
    if (place) {
      form.entities = [{
        id: place.placeId,
        name: place.name,
        address: place.address,
        riskLevel: place.riskLevel || '中',
        type: '重点场所',
      }];
    }
    form.mustVisit = false;
    updateRiskFromEntities();
    generateDesc();
  }
}

function validate() {
  if (!form.taskType) return '请选择任务类型';
  if (form.taskType !== 'PATROL' && !form.entities.length) return '请选择关联对象';
  if (!form.assigneeId) return '请选择执行人';
  if (!form.deadline) return '请选择截止时间';
  if (!form.desc) return '请填写任务说明';
  return '';
}

function buildDispatchRecord(relatedTaskId) {
  const nowId = `disp-${Date.now()}`;
  const title = form.entities[0]?.name || form.entities[0]?.title || '巡逻任务';
  return {
    dispatchId: nowId,
    taskType: form.taskType,
    entityType: currentEntityType.value,
    entityIds: form.entities.map((e) => e.id),
    entityTitle: title,
    assignedUserId: form.assigneeId,
    assignedUserName: form.assigneeName,
    deadline: form.deadline,
    risk: form.risk,
    mustVisit: form.mustVisit,
    desc: form.desc,
    status: 'pending',
    createdAt: new Date().toISOString(),
    relatedTaskId,
    logs: [{ time: new Date().toISOString(), action: '派单创建' }],
  };
}

function buildTaskRecord(taskId, dispatchId) {
  const title = form.entities[0]?.name || form.entities[0]?.title || '巡逻任务';
  return {
    id: taskId,
    title,
    address: form.entities[0]?.address || form.entities[0]?.area || '',
    riskLevel: form.risk,
    refDispatchId: dispatchId,
    url: `/pages/dispatch/detail?dispatchId=${dispatchId}`,
  };
}

function submit() {
  const err = validate();
  if (err) {
    uni.showToast({ title: err, icon: 'none' });
    return;
  }
  const taskId = `task-${Date.now()}`;
  const dispatchRecord = buildDispatchRecord(taskId);

  addDispatch(dispatchRecord);

  const tasks = getTasks();
  tasks.unshift(buildTaskRecord(taskId, dispatchRecord.dispatchId));
  saveTasks(tasks);

  const todos = getTodos();
  todos.unshift({
    id: `todo-${dispatchRecord.dispatchId}`,
    type: 'order',
    refId: dispatchRecord.dispatchId,
    title: dispatchRecord.entityTitle,
    risk: dispatchRecord.risk,
    deadline: dispatchRecord.deadline,
    status: 'pending',
    url: `/pages/dispatch/detail?dispatchId=${dispatchRecord.dispatchId}`,
  });
  todos.unshift({
    id: `todo-${taskId}`,
    type: 'task',
    refId: taskId,
    title: dispatchRecord.entityTitle,
    risk: dispatchRecord.risk,
    deadline: dispatchRecord.deadline,
    status: 'pending',
    url: `/pages/task/detail?taskId=${taskId}`,
  });
  saveTodos(todos);

  uni.showToast({ title: '派单创建成功', icon: 'success' });
  uni.navigateTo({ url: `/pages/dispatch/detail?dispatchId=${dispatchRecord.dispatchId}` });
}

onLoad((query) => {
  resetForm();
  applySource(query || {});
});
</script>

<style lang="scss" scoped>
.dispatch {
  min-height: 100vh;
  padding: 24rpx 24rpx calc(168rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 16rpx;
  box-sizing: border-box;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.section-sub {
  font-size: 24rpx;
  color: #6e7a89;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.chip {
  padding: 12rpx 18rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  color: #1f2b3a;
  font-size: 28rpx;
  // 明确可点击区域，避免部分机型父级样式干扰点击命中
  pointer-events: auto;
}

.chip.active {
  background: #1677ff;
  color: #fff;
  font-weight: 600;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.selected-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx;
  border-radius: 12rpx;
  background: #f6f8fb;
  box-sizing: border-box;
}

.selected-main {
  flex: 1;
  min-width: 0;
}

.sel-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2b3a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sel-meta {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6b7785;
}

.remove-link {
  font-size: 24rpx;
  color: #1677ff;
  flex-shrink: 0;
}

.empty-text {
  color: #8b96a5;
  font-size: 30rpx;
  padding: 8rpx 0;
}

.row-actions {
  margin-top: 12rpx;
  display: flex;
  justify-content: center;
}

.choose-btn {
  padding: 14rpx 28rpx;
  border-radius: 12rpx;
  background: #1677ff;
  color: #fff;
  font-size: 28rpx;
  pointer-events: auto;
}

.link-btn {
  color: #1677ff;
  font-size: 26rpx;
}

.form-item {
  margin-bottom: 14rpx;
}

.label {
  display: block;
  margin-bottom: 8rpx;
  font-size: 30rpx;
  color: #344150;
}

.input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  min-height: 78rpx;
  padding: 0 14rpx;
  background: #f4f6f8;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.value-text {
  flex: 1;
  min-width: 0;
  color: #1f2b3a;
  font-size: 30rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-btn {
  flex-shrink: 0;
  min-width: 92rpx;
  text-align: center;
  padding: 10rpx 0;
  border-radius: 10rpx;
  border: 1px solid #d8dee6;
  color: #1f2b3a;
  font-size: 28rpx;
  background: #fff;
  pointer-events: auto;
}

.switch-row {
  min-height: 78rpx;
  display: flex;
  align-items: center;
}

.textarea {
  width: 100%;
  height: 220rpx;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 16rpx;
  box-sizing: border-box;
  font-size: 28rpx;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
  z-index: 20;
}

.submit-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  font-size: 32rpx;
}

</style>
