<template>
  <view class="select-page pageBg">
    <view class="header">
      <text class="title">选择{{ entityLabel }}</text>
      <text class="sub-title">{{ isMulti ? '可多选，点击确定后返回' : '单选，点击确定后返回' }}</text>
    </view>

    <view class="search-wrap">
      <input v-model="keyword" class="search-input" placeholder="搜索名称/地址/编号" />
    </view>

    <scroll-view class="list" scroll-y>
      <view v-if="filteredList.length === 0" class="empty">暂无可选对象</view>
      <view
        v-for="item in filteredList"
        :key="item.id"
        :class="['row', isSelected(item.id) ? 'row-active' : '']"
        @tap="toggleItem(item)"
      >
        <view class="row-main">
          <text class="name">{{ item.name }}</text>
          <text class="meta">{{ item.address || item.area || item.community || '—' }}</text>
          <text class="risk">风险：{{ item.riskLevel || '中' }}</text>
        </view>
        <text class="check">{{ isSelected(item.id) ? '✓' : '○' }}</text>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="btn ghost" @tap="cancel">取消</button>
      <button class="btn primary" @tap="confirm">确定</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  getDisputes,
  getIncidents,
  getKeyPersons,
  getKeyPlaces,
  getPatrolPoints,
  getPlaces,
} from '@/common/database.js';

const taskType = ref('');
const selectedIds = ref([]);
const keyword = ref('');

const entityType = computed(() => {
  // 根据任务类型映射关联对象类型，保证与指派页口径一致
  switch (taskType.value) {
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

const entityLabel = computed(() => {
  const map = {
    KEY_PLACE: '场所',
    KEY_PERSON: '重点人',
    INCIDENT: '警情',
    DISPUTE: '纠纷',
    PATROL_POINT: '巡逻点',
  };
  return map[entityType.value] || '关联对象';
});

const isMulti = computed(() => taskType.value === 'PATROL');

const sourceList = computed(() => {
  let list = [];
  if (entityType.value === 'KEY_PLACE') {
    // 场所数据兼容新旧两套存储字段，统一在选择页里合并展示
    const placeList = getPlaces().map((item) => ({
      id: item.placeId,
      name: item.name,
      address: item.address,
      area: item.area,
      riskLevel: item.riskLevel || '中',
      type: '重点场所',
    }));
    const legacy = getKeyPlaces().map((item) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      area: item.area,
      riskLevel: item.riskLevel || '中',
      type: '重点场所',
    }));
    list = [...placeList, ...legacy];
  }
  if (entityType.value === 'KEY_PERSON') list = getKeyPersons();
  if (entityType.value === 'DISPUTE') list = getDisputes();
  if (entityType.value === 'PATROL_POINT') list = getPatrolPoints();
  if (entityType.value === 'INCIDENT') {
    list = getIncidents().map((item) => ({
      ...item,
      name: item.title,
      riskLevel: item.riskLevel || '中',
      type: '警情',
    }));
  }
  return list;
});

const filteredList = computed(() => {
  if (!keyword.value) return sourceList.value;
  return sourceList.value.filter((item) => {
    const key = keyword.value.trim();
    return (item.name || '').includes(key) ||
      (item.title || '').includes(key) ||
      (item.address || '').includes(key) ||
      (item.area || '').includes(key) ||
      (item.community || '').includes(key);
  });
});

function isSelected(id) {
  return selectedIds.value.includes(id);
}

function toggleItem(item) {
  // 巡逻任务支持多选，其他任务保持单选，行为与原任务指派页一致
  if (isMulti.value) {
    if (isSelected(item.id)) {
      selectedIds.value = selectedIds.value.filter((id) => id !== item.id);
    } else {
      selectedIds.value = [...selectedIds.value, item.id];
    }
    return;
  }
  selectedIds.value = [item.id];
}

function cancel() {
  uni.navigateBack();
}

function confirm() {
  // 单选任务必须选中一项；巡逻任务允许多选，但为空时仍提示用户
  if (!selectedIds.value.length) {
    uni.showToast({ title: `请选择${entityLabel.value}`, icon: 'none' });
    return;
  }
  const picked = sourceList.value.filter((item) => selectedIds.value.includes(item.id));
  const channel = getEventChannel();
  if (channel) channel.emit('selected', { entities: picked });
  uni.navigateBack();
}

function getEventChannel() {
  // 使用 eventChannel 把选择结果回传到任务指派页，避免全局缓存污染
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  return current?.getOpenerEventChannel ? current.getOpenerEventChannel() : null;
}

onLoad((query) => {
  // 读取来源页面传参，确保回显上次已选项
  taskType.value = query?.taskType || '';
  selectedIds.value = (query?.selectedIds || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
});
</script>

<style lang="scss" scoped>
.select-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20rpx 24rpx calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
}

.header {
  margin-bottom: 12rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.sub-title {
  display: block;
  margin-top: 6rpx;
  color: #6e7a89;
  font-size: 24rpx;
}

.search-wrap {
  margin-bottom: 12rpx;
}

.search-input {
  width: 100%;
  height: 74rpx;
  line-height: 74rpx;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 12rpx;
  padding: 0 16rpx;
  box-sizing: border-box;
}

.list {
  flex: 1;
  min-height: 200rpx;
}

.empty {
  text-align: center;
  color: #8b96a5;
  padding: 32rpx 0;
  font-size: 26rpx;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 10rpx;
  padding: 14rpx;
  background: #fff;
  border-radius: 12rpx;
  border: 1px solid transparent;
}

.row-active {
  border-color: #1677ff;
  background: #edf5ff;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2b3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: block;
  margin-top: 4rpx;
  color: #6b7785;
  font-size: 24rpx;
}

.risk {
  display: block;
  margin-top: 2rpx;
  color: #d64545;
  font-size: 22rpx;
}

.check {
  color: #1677ff;
  font-size: 30rpx;
  flex-shrink: 0;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12rpx;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
}

.btn {
  flex: 1;
  border-radius: 12rpx;
  height: 72rpx;
  line-height: 72rpx;
}

.btn.ghost {
  background: #f4f6f8;
  color: #6e7a89;
}

.btn.primary {
  background: #1677ff;
  color: #fff;
}
</style>
