<template>
  <AppPage>
    <view class="visit-history pageBg">
      <view class="search-row">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索对象/内容"
          placeholder-class="search-ph"
          confirm-type="search"
          @confirm="reload"
        />
        <text class="search-btn" @tap="reload">搜索</text>
      </view>

      <!-- 状态筛选：快速定位草稿、失败、已提交记录 -->
      <scroll-view class="tab-scroll" scroll-x :show-scrollbar="false">
        <view class="tab-track">
          <view
            v-for="item in statusTabs"
            :key="item.value"
            :class="['tab-item', statusFilter === item.value ? 'active' : '']"
            @tap="switchStatus(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <view class="list-wrap">
        <view v-if="rows.length === 0" class="empty-text">暂无记录</view>
        <view
          v-for="item in rows"
          :key="item.id"
          class="card row-card"
          hover-class="card-hover"
          @tap="openRow(item)"
        >
          <view class="row-top">
            <text class="row-title">{{ item.objectName }}</text>
            <text :class="['pill', statusClass(item.status)]">{{ visitStatusText(item.status) }}</text>
          </view>
          <text class="row-sub">{{ item.visitType }} · {{ item.area }} · {{ formatDateTime(item.visitAt || item.updatedAt) }}</text>
          <text class="row-content">{{ item.content || '暂无内容' }}</text>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { getVisitRecords, getVisitDrafts } from '@/common/database.js';
import { formatDateTime, visitStatusText, statusClass } from './helper.js';

const keyword = ref('');
const statusFilter = ref('ALL');
const records = ref([]);
const drafts = ref([]);

const statusTabs = [
  { value: 'ALL', label: '全部' },
  { value: 'submitted', label: '已提交' },
  { value: 'pending', label: '待提交' },
  { value: 'failed', label: '失败' },
  { value: 'draft', label: '草稿' },
];

const rows = computed(() => {
  // 历史页把正式记录和草稿统一展示，便于一线同事快速续写
  const merged = [
    ...records.value.map((item) => ({
      ...item,
      id: `rec-${item.recordId}`,
      rowType: 'record',
    })),
    ...drafts.value.map((item) => ({
      ...item,
      id: `draft-${item.draftId}`,
      status: 'draft',
      rowType: 'draft',
    })),
  ].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

  const key = keyword.value.trim().toLowerCase();
  return merged.filter((item) => {
    if (statusFilter.value !== 'ALL' && item.status !== statusFilter.value) return false;
    if (!key) return true;
    const text = `${item.objectName}|${item.content}|${item.area}`.toLowerCase();
    return text.includes(key);
  });
});

function reload() {
  records.value = getVisitRecords();
  drafts.value = getVisitDrafts();
}

function switchStatus(val) {
  statusFilter.value = val;
}

function openRow(item) {
  // 草稿进入编辑页，正式记录进入对象详情页
  if (item.rowType === 'draft') {
    uni.navigateTo({
      url: `/pages/visit/edit?objectId=${encodeURIComponent(item.objectId)}&draftId=${encodeURIComponent(item.draftId)}`,
    });
    return;
  }
  uni.navigateTo({ url: `/pages/visit/detail?objectId=${encodeURIComponent(item.objectId)}` });
}

onShow(() => {
  reload();
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-history {
  padding: 16rpx 24rpx 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.search-row {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 68rpx;
  border-radius: 999rpx;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 26rpx;
}

.search-ph {
  color: #98a2b3;
}

.search-btn {
  min-width: 108rpx;
  text-align: center;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 999rpx;
  color: #fff;
  background: #1677ff;
}

.tab-scroll {
  margin-top: 14rpx;
  width: 100%;
}

.tab-track {
  display: inline-flex;
  gap: 10rpx;
}

.tab-item {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f4f6f8;
  color: #4b5563;
  font-size: 24rpx;
}

.tab-item.active {
  color: #1677ff;
  background: #eaf3ff;
}

.list-wrap {
  margin-top: 14rpx;
}

.row-card {
  margin-bottom: 12rpx;
}

.card-hover {
  opacity: 0.86;
}

.row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10rpx;
}

.row-title {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2b3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-sub {
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #6b7785;
}

.row-content {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #4b5563;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pill {
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
}

.status-danger {
  color: #d64545;
  background: #ffecec;
}

.status-warn {
  color: #c88719;
  background: #fff6e6;
}

.status-ok {
  color: #1b9d5d;
  background: #e6f7ed;
}

.status-normal {
  color: #6b7785;
  background: #f4f6f8;
}

.empty-text {
  text-align: center;
  color: #98a2b3;
  font-size: 24rpx;
  padding: 34rpx 0;
}
</style>

