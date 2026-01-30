<template>
  <view class="handwork pageBg">
    <scroll-view
      class="content"
      scroll-y
      :scroll-top="scrollTopTarget"
      scroll-with-animation
      @scroll="onScroll"
    >
      <view class="page-sub">昨日未结事项：{{ filteredItems.length }} 条</view>

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

      <view id="filterBar" class="filter-bar origin" :class="{ hidden: isSticky }">
        <view class="filter-btn" :class="{ active: isFilterActive('time') || panelType === 'time' }" @click="handleFilterClick('time')">
          <text>{{ timeLabel }}</text>
          <text :class="['arrow', panelType === 'time' ? 'open' : '']">▾</text>
        </view>
        <view class="filter-btn" :class="{ active: isFilterActive('types') || panelType === 'types' }" @click="handleFilterClick('types')">
          <text>{{ typeFilterLabel }}</text>
          <text :class="['arrow', panelType === 'types' ? 'open' : '']">▾</text>
        </view>
        <view class="filter-btn" :class="{ active: isFilterActive('risks') || panelType === 'risks' }" @click="handleFilterClick('risks')">
          <text>{{ riskLabel }}</text>
          <text :class="['arrow', panelType === 'risks' ? 'open' : '']">▾</text>
        </view>
        <view class="filter-btn" :class="{ active: isFilterActive('group') || panelType === 'group' }" @click="handleFilterClick('group')">
          <text>{{ groupLabel }}</text>
          <text :class="['arrow', panelType === 'group' ? 'open' : '']">▾</text>
        </view>
      </view>

      <view v-if="filteredItems.length === 0" class="empty">暂无未结事项</view>
      <view v-for="group in groupedItems" :key="group.type" class="group">
        <view class="group-head">{{ groupLabelText(group) }}（{{ group.items.length }}）</view>
        <view v-for="item in group.items" :key="item.id" class="item-card">
          <view class="item-head" @click="toggleExpand(item.id)">
            <view>
              <view class="item-title">{{ item.title }}</view>
              <view class="item-meta">{{ item.address || '' }}</view>
            </view>
            <view class="item-right">
              <view class="badges">
                <text :class="['badge', riskClass(item.risk)]">{{ item.risk }}</text>
                <text :class="['badge', 'status']">{{ item.status || '未结' }}</text>
                <text class="badge deadline">截止：{{ item.deadline || '--' }}</text>
              </view>
              <view class="handover-check">
                <text class="check-label">已交代</text>
                <switch :checked="item.assign.confirmed" @change="(e)=>setConfirmed(item.id, e.detail.value)" />
              </view>
            </view>
          </view>
          <view v-if="expandedIds.includes(item.id)" class="form">
            <view class="form-row column">
              <text class="label">交代备注</text>
              <textarea class="textarea" v-model="item.assign.note" placeholder="可补充交代要点" />
            </view>
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
              <view class="inline-actions">
                <button size="mini" @click="applyTemplate(item)">套用模板</button>
                <button size="mini" @click="copyItem(item)">复制摘要</button>
              </view>
            </view>
            <view class="form-row">
              <button size="mini" @click="openDetail(item)">查看详情</button>
              <button size="mini" @click="removeItem(item.id)">移出交接</button>
            </view>
          </view>
        </view>
      </view>
    </view>

      <view class="card">
      <view class="section-head">
        <text class="section-title">交接摘要</text>
      </view>
      <view class="summary-line">共 {{ filteredItems.length }} 条：警情 {{ countByType('alert') }} / 任务 {{ countByType('task') }} / 纠纷 {{ countByType('dispute') }} / 派单 {{ countByType('order') }}</view>
      <view class="summary-line">已确认 {{ confirmedCount }} 条，未确认 {{ filteredItems.length - confirmedCount }} 条</view>
      <view v-if="missingList.length" class="warning">
        待补全：{{ missingList.join('、') }}
      </view>
    </view>
    </scroll-view>

    <view class="action-bar">
      <button class="ghost-btn" @click="goHistory">查看历史</button>
      <button type="primary" class="submit-btn" :class="{ disabled: !canSubmit }" @click="handleSubmit">提交交接单</button>
    </view>

    <view v-if="isSticky" class="filter-bar fixed">
      <view class="filter-btn" :class="{ active: isFilterActive('time') || panelType === 'time' }" @click="handleFilterClick('time')">
        <text>{{ timeLabel }}</text>
        <text :class="['arrow', panelType === 'time' ? 'open' : '']">▾</text>
      </view>
      <view class="filter-btn" :class="{ active: isFilterActive('types') || panelType === 'types' }" @click="handleFilterClick('types')">
        <text>{{ typeFilterLabel }}</text>
        <text :class="['arrow', panelType === 'types' ? 'open' : '']">▾</text>
      </view>
      <view class="filter-btn" :class="{ active: isFilterActive('risks') || panelType === 'risks' }" @click="handleFilterClick('risks')">
        <text>{{ riskLabel }}</text>
        <text :class="['arrow', panelType === 'risks' ? 'open' : '']">▾</text>
      </view>
      <view class="filter-btn" :class="{ active: isFilterActive('group') || panelType === 'group' }" @click="handleFilterClick('group')">
        <text>{{ groupLabel }}</text>
        <text :class="['arrow', panelType === 'group' ? 'open' : '']">▾</text>
      </view>
    </view>

    <view v-if="panelVisible" class="filter-mask" :style="{ top: panelTop + 'px' }" @click="closePanel"></view>
    <view v-if="panelVisible" class="filter-panel" :style="{ top: panelTop + 'px' }" :class="{ small: panelType === 'time' || panelType === 'group' }" @click.stop>
      <view class="panel-title">{{ panelTitle }}</view>
      <scroll-view class="panel-body" scroll-y>
        <view v-if="panelType === 'time' || panelType === 'group'" class="panel-options">
          <view
            v-for="opt in panelListOptions"
            :key="opt.value"
            :class="['panel-option', panelListValue === opt.value ? 'active':'']"
            @click="setPanelSingle(opt.value)"
          >
            <text>{{ opt.label }}</text>
            <text v-if="panelListValue === opt.value" class="check">✓</text>
          </view>
        </view>
        <view v-else class="panel-options chips">
          <view
            v-for="opt in panelOptions"
            :key="opt.value"
            :class="['chip', isTempSelected(opt.value) ? 'active' : '']"
            @click="toggleTemp(opt.value)"
          >
            {{ opt.label }}
          </view>
        </view>
      </scroll-view>
      <view class="panel-actions">
        <button class="ghost-btn" @click="resetPanel">重置</button>
        <button class="primary-btn" @click="applyPanel">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance, nextTick } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import {
  getIncidents,
  getTasks,
  getDisputes,
  getDispatches,
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
const items = ref([]);
const expandedIds = ref([]);
const scrollTop = ref(0);
const scrollTopTarget = ref(0);
const hasMeasured = ref(false);

const filters = reactive({
  timeRange: 'yesterday',
  types: ['alert', 'task', 'dispute', 'order'],
  risks: ['高', '中', '低'],
  groupBy: 'type',
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
  if (filters.groupBy === 'risk') {
    const groups = { 高: [], 中: [], 低: [] };
    filteredItems.value.forEach((i) => groups[i.risk]?.push(i));
    return Object.keys(groups)
      .filter((k) => groups[k].length)
      .map((k) => ({ type: k, items: groups[k] }));
  }
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

const panelType = ref('');
const tempFilters = reactive({ timeRange: 'yesterday', types: [], risks: [], groupBy: 'type' });
const panelTop = ref(0);
const filterBarOffset = ref(0);
const filterBarHeight = ref(0);
const instance = getCurrentInstance();

const panelVisible = computed(() => !!panelType.value);
const panelTitle = computed(() => {
  if (panelType.value === 'time') return '选择时间';
  if (panelType.value === 'types') return '选择类型';
  if (panelType.value === 'risks') return '选择风险';
  if (panelType.value === 'group') return '选择分组';
  return '';
});
const panelOptions = computed(() => {
  if (panelType.value === 'types') return typeOptions;
  if (panelType.value === 'risks') return riskOptions.map((r) => ({ value: r, label: r }));
  return [];
});
const groupOptions = [
  { value: 'type', label: '按类型分组' },
  { value: 'risk', label: '按风险分组' },
];
const panelListOptions = computed(() => (panelType.value === 'group' ? groupOptions : timeRanges));
const panelListValue = computed(() => (panelType.value === 'group' ? tempFilters.groupBy : tempFilters.timeRange));

const timeLabel = computed(() => timeRanges.find((t) => t.value === filters.timeRange)?.label || '时间');
const typeFilterLabel = computed(() => {
  if (filters.types.length === typeOptions.length) return '全部类型';
  return `类型(${filters.types.length})`;
});
const riskLabel = computed(() => {
  if (filters.risks.length === riskOptions.length) return '全部风险';
  return `风险(${filters.risks.length})`;
});
const groupLabel = computed(() => (filters.groupBy === 'type' ? '按类型分组' : '按风险分组'));

const expandedAll = computed(() => filteredItems.value.length > 0 && expandedIds.value.length === filteredItems.value.length);
const canSubmit = computed(() => !!nextShift.id || !!nextShift.name);
const isSticky = computed(() => filterBarOffset.value > 0 && scrollTop.value >= filterBarOffset.value - 2);

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

function toggleExpandAll() {
  expandAll(!expandedAll.value);
}

function toggleGroupBy() {
  filters.groupBy = filters.groupBy === 'type' ? 'risk' : 'type';
}

function isFilterActive(type) {
  if (type === 'time') return filters.timeRange !== 'yesterday';
  if (type === 'types') return filters.types.length !== typeOptions.length;
  if (type === 'risks') return filters.risks.length !== riskOptions.length;
  if (type === 'group') return filters.groupBy !== 'type';
  return false;
}

function openPanel(type) {
  panelType.value = type;
  tempFilters.timeRange = filters.timeRange;
  tempFilters.types = [...filters.types];
  tempFilters.risks = [...filters.risks];
  tempFilters.groupBy = filters.groupBy;
  nextTick(() => {
    measureFilterBar();
    if (isSticky.value && filterBarHeight.value) {
      panelTop.value = filterBarHeight.value;
    }
  });
}

function measureFilterBar(force = false) {
  if (hasMeasured.value && !force) {
    panelTop.value = filterBarHeight.value || panelTop.value;
    return;
  }
  if (isSticky.value && hasMeasured.value && !force) {
    panelTop.value = filterBarHeight.value || panelTop.value;
    return;
  }
  const query = uni.createSelectorQuery().in(instance);
  query.select('.content').boundingClientRect();
  query.select('.filter-bar.origin').boundingClientRect();
  query.exec((res) => {
    const contentRect = res?.[0];
    const barRect = res?.[1];
    if (!barRect || !contentRect) return;
    filterBarHeight.value = barRect.height || 0;
    panelTop.value = filterBarHeight.value;
    filterBarOffset.value = barRect.top - contentRect.top + scrollTop.value;
    if (filterBarOffset.value > 0) hasMeasured.value = true;
  });
}

function handleFilterClick(type) {
  if (panelType.value === type) {
    closePanel();
    return;
  }
  if (!isSticky.value) {
    measureFilterBar();
    setTimeout(() => {
      scrollToFilterBar();
      setTimeout(() => {
        openPanel(type);
      }, 180);
    }, 60);
    return;
  }
  panelTop.value = filterBarHeight.value || panelTop.value;
  openPanel(type);
}

function onScroll(e) {
  scrollTop.value = e.detail.scrollTop || 0;
  if (!hasMeasured.value) {
    measureFilterBar(true);
  }
}

function closePanel() {
  panelType.value = '';
}

function resetPanel() {
  if (panelType.value === 'time') tempFilters.timeRange = 'yesterday';
  if (panelType.value === 'types') tempFilters.types = typeOptions.map((t) => t.value);
  if (panelType.value === 'risks') tempFilters.risks = [...riskOptions];
  if (panelType.value === 'group') tempFilters.groupBy = 'type';
}

function applyPanel() {
  filters.timeRange = tempFilters.timeRange;
  filters.types = [...tempFilters.types];
  filters.risks = [...tempFilters.risks];
  filters.groupBy = tempFilters.groupBy;
  closePanel();
}

function isTempSelected(val) {
  if (panelType.value === 'types') return tempFilters.types.includes(val);
  if (panelType.value === 'risks') return tempFilters.risks.includes(val);
  return false;
}

function toggleTemp(val) {
  if (panelType.value === 'types') {
    if (tempFilters.types.includes(val)) tempFilters.types = tempFilters.types.filter((v) => v !== val);
    else tempFilters.types.push(val);
  }
  if (panelType.value === 'risks') {
    if (tempFilters.risks.includes(val)) tempFilters.risks = tempFilters.risks.filter((v) => v !== val);
    else tempFilters.risks.push(val);
  }
}

function setPanelSingle(val) {
  if (panelType.value === 'group') tempFilters.groupBy = val;
  if (panelType.value === 'time') tempFilters.timeRange = val;
}

function scrollToFilterBar() {
  const target = Math.max(0, filterBarOffset.value);
  if (scrollTopTarget.value === target) {
    scrollTopTarget.value = target - 1;
    nextTick(() => {
      scrollTopTarget.value = target;
    });
  } else {
    scrollTopTarget.value = target;
  }
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

function groupLabelText(group) {
  if (filters.groupBy === 'risk') return `${group.type}风险`;
  return typeLabel(group.type);
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
      note: '',
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

function setConfirmed(id, val) {
  updateItem(id, (item) => {
    item.assign.confirmed = val;
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

function insertRemarkTemplate() {
  const tpl = '风险点：\n重点关注：\n待办提醒：';
  if (!overallRemark.value) {
    overallRemark.value = tpl;
  } else {
    overallRemark.value = `${overallRemark.value}\n${tpl}`;
  }
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
  const content = buildSummaryText();
  uni.showModal({
    title: '交接单摘要',
    content,
    confirmText: '复制',
    cancelText: '关闭',
    success: (res) => {
      if (res.confirm) uni.setClipboardData({ data: content });
    },
  });
}

function goHistory() {
  uni.navigateTo({ url: '/pages/handwork/history' });
}

function openDetail(item) {
  if (item.url) uni.navigateTo({ url: item.url });
  else uni.showToast({ title: '暂无详情', icon: 'none' });
}

function handleSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请先选择接班人/组', icon: 'none' });
    return;
  }
  submit();
}

function copyItem(item) {
  const text = `${typeLabel(item.type)}｜${item.title}\n风险：${item.risk}  截止：${item.assign.deadline || '--'}\n交接给：${item.assign.assigneeName || '未指定'}\n交接要求：${item.assign.requirement || ''}\n交代备注：${item.assign.note || ''}`;
  uni.setClipboardData({ data: text });
}

function buildSummaryText() {
  const highRisk = filteredItems.value.filter((i) => i.risk === '高').map((i) => i.title);
  const lines = [];
  lines.push(`交接时间：${handoverTime.value}`);
  lines.push(`本班：${currentShift} -> 接班：${nextShift.name || '未指定'}`);
  lines.push(`未结事项：警情 ${countByType('alert')} / 任务 ${countByType('task')} / 纠纷 ${countByType('dispute')} / 派单 ${countByType('order')}`);
  lines.push(`已交代 ${confirmedCount.value} 条 / 未交代 ${filteredItems.value.length - confirmedCount.value} 条`);
  if (highRisk.length) lines.push(`高风险清单：${highRisk.join('、')}`);
  lines.push(`总体备注：${overallRemark.value || '无'}`);
  return lines.join('\n');
}

function submit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请选择接班人/组', icon: 'none' });
    return;
  }
  const firstMissing = filteredItems.value.find((i) => !i.assign.assigneeName || !i.assign.deadline || !i.assign.requirement);
  if (firstMissing) {
    uni.showToast({ title: `请补全：${firstMissing.title}`, icon: 'none' });
    return;
  }
  const highRiskUnchecked = filteredItems.value.find((i) => i.risk === '高' && !i.assign.confirmed);
  if (highRiskUnchecked) {
    uni.showModal({
      title: '高风险未交代',
      content: '仍有高风险事项未勾选“已交代”，是否继续提交？',
      success: (res) => {
        if (res.confirm) doSubmit();
      },
    });
    return;
  }
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
      note: i.assign.note || '',
    })),
    createdAt: new Date().toISOString(),
  };
  const list = [record, ...getShifts()];
  saveShifts(list);
  saveHandworkRecords(list);

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
  uni.navigateTo({ url: `/pages/handwork/detail?recordId=${recordId}` });
}

function mapTypeToTodo(t) {
  const map = { alert: 'alert', task: 'task', dispute: 'dispute', order: 'order' };
  return map[t] || 'task';
}

onShow(() => {
  loadData();
  nextTick(() => {
    setTimeout(() => measureFilterBar(true), 120);
  });
});

onLoad(() => {
  nextTick(() => {
    setTimeout(() => measureFilterBar(true), 120);
  });
});
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

.filter-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  gap: 12rpx;
  padding: 10rpx 0 12rpx;
  background: #fff;
  border-bottom: 1px solid #eef1f5;
  overflow-x: auto;
  white-space: nowrap;
}
.filter-bar.origin.hidden {
  visibility: hidden;
  pointer-events: none;
}
.filter-bar.fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 10rpx 24rpx 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}
.filter-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  color: #606a75;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #fff;
  border: 1px solid #e2e7ee;
  flex: 0 0 auto;
}
.filter-btn.active {
  color: #ff8a00;
  border-color: #ff8a00;
  background: #fff7ec;
}
.filter-btn .arrow { font-size: 18rpx; transition: transform 0.2s ease; }
.filter-btn .arrow.open { transform: rotate(180deg); }
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

.filter-mask {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
}
.filter-panel {
  position: fixed;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 0 0 20rpx 20rpx;
  z-index: 1001;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}
.filter-panel.small {
  max-height: 40vh;
}
.panel-title {
  padding: 18rpx 24rpx 8rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.panel-body {
  padding: 0 24rpx 20rpx;
  flex: 1;
}
.panel-options { display: flex; flex-direction: column; gap: 10rpx; }
.panel-option {
  padding: 16rpx 18rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-option.active { background: #fff3e0; color: #ff8a00; }
.panel-option .check { color: #ff8a00; font-weight: 600; }
.panel-actions {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #eef1f5;
}
.panel-actions .ghost-btn {
  flex: 1;
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
}
.panel-actions .primary-btn {
  flex: 1;
  background: linear-gradient(90deg, #ff8a00, #ffb34d);
  color: #fff;
  border-radius: 12rpx;
}
</style>
