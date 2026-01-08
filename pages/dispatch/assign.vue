<template>
  <view class="dispatch pageBg">
    <view class="statuBar" :style="{height: barheight+'px'}"></view>
    <view class="header">
      <view>
        <view class="title">任务指派</view>
        <view class="sub">可指派警情/巡逻/场所走访/重点人走访等</view>
      </view>
      <button class="ghost-btn" size="mini" @click="resetForm">重置</button>
    </view>

    <!-- 卡片A 任务类型 -->
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
          @click="selectTaskType(item.value)"
        >
          {{ item.label }}
        </view>
      </view>
    </view>

    <!-- 卡片B 关联对象 -->
    <view class="card">
      <view class="section-head">
        <text class="section-title">关联对象</text>
        <text class="section-sub">{{ currentEntityLabel }}</text>
      </view>
      <view class="selected-list" v-if="selectedEntities.length">
        <view class="selected-card" v-for="item in selectedEntities" :key="item.id">
          <view class="sel-title">{{ item.name }}</view>
          <view class="sel-meta">{{ item.type }} · {{ item.riskLevel }}</view>
          <button size="mini" @click="removeEntity(item.id)">移除</button>
        </view>
      </view>
      <view v-else class="empty">未选择关联对象</view>
      <view class="actions">
        <button size="mini" type="primary" @click="openEntitySheet">选择关联对象</button>
      </view>
    </view>

    <!-- 卡片C 指派信息 -->
    <view class="card">
      <view class="section-head">
        <text class="section-title">指派信息</text>
        <text class="section-sub">必填项</text>
      </view>
      <view class="form-item">
        <text class="label">执行人</text>
        <view class="input-row">
          <view class="value">{{ form.assigneeName || '请选择执行人' }}</view>
          <button size="mini" @click="openUserSheet">选择</button>
        </view>
      </view>
      <view class="form-item">
        <text class="label">截止时间</text>
        <picker mode="datetime" @change="onDeadlineChange">
          <view class="value">{{ form.deadline || '请选择截止时间' }}</view>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">风险等级</text>
        <view class="chips">
          <view
            v-for="item in riskOptions"
            :key="item"
            :class="['chip', form.risk === item ? 'active' : '']"
            @click="form.risk = item"
          >
            {{ item }}
          </view>
        </view>
      </view>
      <view class="form-item">
        <text class="label">必须回访</text>
        <switch :checked="form.mustVisit" @change="onVisitToggle" />
      </view>
    </view>

    <!-- 卡片D 任务说明 -->
    <view class="card">
      <view class="section-head">
        <text class="section-title">任务说明</text>
        <text class="section-sub">必填</text>
      </view>
      <textarea v-model="form.desc" class="textarea" placeholder="请输入任务说明" />
      <view class="actions">
        <button size="mini" @click="resetTemplate">重置模板</button>
      </view>
    </view>

    <view class="action-bar">
      <button type="primary" class="submit-btn" @click="submit">提交派单</button>
    </view>

    <!-- 关联对象选择弹层 -->
    <view class="sheet" v-if="entitySheetVisible">
      <view class="sheet-body">
        <view class="sheet-head">
          <view class="sheet-title">选择 {{ currentEntityLabel }}</view>
          <button size="mini" @click="closeEntitySheet">关闭</button>
        </view>
        <input class="search" v-model="entitySearch" placeholder="搜索名称/编号" />
        <view class="sheet-list">
          <view
            v-for="item in filteredEntities"
            :key="item.id"
            :class="['entity-card', isEntitySelected(item.id) ? 'checked' : '']"
            @click="toggleEntity(item)"
          >
            <view class="ec-title">{{ item.name }}</view>
            <view class="ec-meta">{{ item.address || item.area || item.community || '' }}</view>
            <view class="ec-risk">{{ item.riskLevel }}</view>
          </view>
        </view>
        <view class="sheet-actions">
          <button type="primary" @click="confirmEntity">确认</button>
        </view>
      </view>
    </view>

    <!-- 执行人选择弹层 -->
    <view class="sheet" v-if="userSheetVisible">
      <view class="sheet-body">
        <view class="sheet-head">
          <view class="sheet-title">选择执行人</view>
          <button size="mini" @click="closeUserSheet">关闭</button>
        </view>
        <input class="search" v-model="userSearch" placeholder="搜索姓名/岗位" />
        <view class="sheet-list">
          <view
            v-for="user in filteredUsers"
            :key="user.id"
            class="entity-card"
            @click="selectUser(user)"
          >
            <view class="ec-title">{{ user.name }}</view>
            <view class="ec-meta">{{ user.post }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  addDispatch,
  getTodos,
  saveTodos,
  getPlaces,
  getKeyPlaces,
  getKeyPersons,
  getDisputes,
  getPatrolPoints,
  getIncidents,
  getTasks,
  saveTasks,
} from '@/common/database.js';
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());

const taskTypes = [
  { value: 'INCIDENT_FOLLOW', label: '警情跟进' },
  { value: 'PATROL', label: '巡逻' },
  { value: 'PLACE_VISIT', label: '场所走访/检查' },
  { value: 'KEY_PERSON_VISIT', label: '重点人走访/核查' },
  { value: 'DISPUTE_VISIT', label: '矛盾纠纷回访' },
];

const riskOptions = ['高', '中', '低'];

const usersMock = [
  { id: 'u1', name: '李警官', post: '桂南警务区' },
  { id: 'u2', name: '王警官', post: '龙石警务区' },
  { id: 'u3', name: '张警官', post: '巡逻组' },
];

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

const entitySheetVisible = ref(false);
const userSheetVisible = ref(false);
const entitySearch = ref('');
const userSearch = ref('');
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

const filteredEntities = computed(() => {
  let list = [];
  if (currentEntityType.value === 'KEY_PLACE') {
    const placeList = getPlaces().map((p) => ({
      id: p.placeId,
      name: p.name,
      address: p.address,
      area: p.area,
      riskLevel: p.riskLevel || '中',
      type: '重点场所',
    }));
    const legacy = getKeyPlaces().map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      riskLevel: p.riskLevel || '中',
      type: '重点场所',
    }));
    list = [...placeList, ...legacy];
  }
  if (currentEntityType.value === 'KEY_PERSON') list = getKeyPersons();
  if (currentEntityType.value === 'DISPUTE') list = getDisputes();
  if (currentEntityType.value === 'PATROL_POINT') list = getPatrolPoints();
  if (currentEntityType.value === 'INCIDENT') {
    list = getIncidents().map((i) => ({ ...i, name: i.title, riskLevel: i.riskLevel || '中', type: '警情' }));
  }
  if (!entitySearch.value) return list;
  return list.filter((item) =>
    (item.name || '').includes(entitySearch.value) ||
    (item.title || '').includes(entitySearch.value) ||
    (item.address || '').includes(entitySearch.value) ||
    (item.area || '').includes(entitySearch.value) ||
    (item.community || '').includes(entitySearch.value)
  );
});

const filteredUsers = computed(() => {
  if (!userSearch.value) return usersMock;
  return usersMock.filter(
    (u) => u.name.includes(userSearch.value) || u.post.includes(userSearch.value)
  );
});

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

function openEntitySheet() {
  if (!currentEntityType.value && form.taskType !== 'PATROL') {
    uni.showToast({ title: '请先选择任务类型', icon: 'none' });
    return;
  }
  entitySheetVisible.value = true;
}

function closeEntitySheet() {
  entitySheetVisible.value = false;
  entitySearch.value = '';
}

function isEntitySelected(id) {
  return form.entities.some((e) => e.id === id);
}

function toggleEntity(item) {
  if (form.taskType === 'PATROL') {
    if (isEntitySelected(item.id)) {
      form.entities = form.entities.filter((e) => e.id !== item.id);
    } else {
      form.entities = [...form.entities, item];
    }
  } else {
    form.entities = [item];
  }
}

function confirmEntity() {
  closeEntitySheet();
  updateRiskFromEntities();
  generateDesc();
}

function removeEntity(id) {
  form.entities = form.entities.filter((e) => e.id !== id);
  updateRiskFromEntities();
  generateDesc();
}

function openUserSheet() {
  userSheetVisible.value = true;
}
function closeUserSheet() {
  userSheetVisible.value = false;
  userSearch.value = '';
}
function selectUser(user) {
  form.assigneeId = user.id;
  form.assigneeName = user.name;
  closeUserSheet();
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
  const risk = Object.keys(ranks).find((k) => ranks[k] === max) || '中';
  form.risk = risk;
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

function resetTemplate() {
  generateDesc();
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
      form.entities = [
        {
          id: place.placeId,
          name: place.name,
          address: place.address,
          riskLevel: place.riskLevel || '中',
          type: '重点场所',
        },
      ];
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

  // 派单入库
  addDispatch(dispatchRecord);

  // 任务入库
  const tasks = getTasks();
  tasks.unshift(buildTaskRecord(taskId, dispatchRecord.dispatchId));
  saveTasks(tasks);

  // 待办入库
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
  padding: 0 24rpx 140rpx;

  .header {
    padding: 10rpx 0 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-size: 44rpx;
      font-weight: 700;
      color: #1f2b3a;
    }
    .sub {
      margin-top: 6rpx;
      color: #6e7a89;
      font-size: 26rpx;
    }
    .ghost-btn {
      border: 1px solid #d0d6de;
      background: #fff;
      color: #1f2b3a;
      padding: 10rpx 18rpx;
      border-radius: 12rpx;
    }
  }

  .card {
    background: rgba(255,255,255,0.92);
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
    margin-bottom: 16rpx;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
    .section-title {
      font-size: 32rpx;
      font-weight: 700;
      color: #1f2b3a;
    }
    .section-sub {
      font-size: 24rpx;
      color: #6e7a89;
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
  }
  .chip {
    padding: 12rpx 18rpx;
    border-radius: 12rpx;
    background: #f4f6f8;
    color: #1f2b3a;
    font-size: 26rpx;
  }
  .chip.active {
    background: #0f75ff;
    color: #fff;
    font-weight: 600;
  }

  .selected-list {
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }
  .selected-card {
    padding: 12rpx;
    border-radius: 12rpx;
    background: #f6f8fb;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  }
  .sel-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2b3a;
  }
  .sel-meta {
    margin-top: 4rpx;
    font-size: 24rpx;
    color: #6b7785;
  }

  .actions {
    margin-top: 12rpx;
    display: flex;
    gap: 10rpx;
  }

  .form-item {
    margin-bottom: 14rpx;
    .label {
      font-size: 28rpx;
      color: #344150;
      margin-bottom: 6rpx;
      display: block;
    }
    .input-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12rpx 14rpx;
      background: #f4f6f8;
      border-radius: 12rpx;
      font-size: 28rpx;
      color: #1f2b3a;
    }
    .value {
      flex: 1;
    }
  }

  .textarea {
    width: 100%;
    height: 200rpx;
    background: #f4f6f8;
    border-radius: 12rpx;
    padding: 16rpx;
    font-size: 28rpx;
  }

  .action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 10rpx 20rpx 26rpx;
    background: rgba(255,255,255,0.95);
    box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
  }
  .submit-btn {
    width: 100%;
    background: linear-gradient(90deg, #0f75ff, #56a0ff);
    color: #fff;
    border-radius: 12rpx;
  }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 99;
  }
  .sheet-body {
    width: 100%;
    max-height: 70%;
    background: #fff;
    border-radius: 16rpx 16rpx 0 0;
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }
  .sheet-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sheet-title {
    font-size: 30rpx;
    font-weight: 600;
  }
  .search {
    background: #f4f6f8;
    border-radius: 12rpx;
    padding: 12rpx 14rpx;
    font-size: 28rpx;
  }
  .sheet-list {
    flex: 1;
    overflow-y: auto;
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
  .entity-card.checked {
    border: 1px solid #0f75ff;
  }
  .ec-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2b3a;
  }
  .ec-meta {
    margin-top: 4rpx;
    font-size: 24rpx;
    color: #6b7785;
  }
  .ec-risk {
    margin-top: 4rpx;
    font-size: 24rpx;
    color: #d64545;
  }
  .sheet-actions {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
