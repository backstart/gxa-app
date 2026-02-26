<template>
  <AppPage>
    <view class="visit-detail pageBg">
      <view v-if="!objectDetail" class="card empty-card">
        <text class="empty-text">未找到走访对象</text>
      </view>

      <template v-else>
        <!-- 头部对象信息：把走访前必看信息集中一屏展示 -->
        <view class="card profile-card">
          <view class="title-row">
            <text class="name">{{ objectDetail.name }}</text>
            <text :class="['pill', riskClass(objectDetail.riskLevel)]">{{ objectDetail.riskLevel || '中' }}</text>
          </view>
          <text class="sub-line">{{ objectDetail.subName }} · {{ objectDetail.area }}</text>
          <text class="sub-line">地址：{{ objectDetail.address || '暂无地址' }}</text>
          <text class="sub-line">责任民警：{{ objectDetail.officerName || '未配置' }}</text>
          <com-tag class="tag-group" :taglist="objectDetail.tags || []" />
        </view>

        <!-- 状态条：用于判断是否逾期、是否需要继续补录 -->
        <view class="card status-card">
          <view class="status-row">
            <text class="label">上次走访</text>
            <text class="value">{{ latestRecord ? formatDateTime(latestRecord.visitAt) : '暂无' }}</text>
          </view>
          <view class="status-row">
            <text class="label">下次回访</text>
            <text class="value">{{ objectDetail.nextVisitAt || '未设置' }}</text>
          </view>
          <view class="status-row">
            <text class="label">当前状态</text>
            <text :class="['pill', statusClass(objectDetail.visitStatus)]">{{ visitStatusText(objectDetail.visitStatus) }}</text>
          </view>
          <view v-if="draftRecord" class="draft-tip">存在未提交草稿，可直接继续填写。</view>
        </view>

        <!-- 关联操作：与任务指派/源对象联动 -->
        <view class="card links-card">
          <text class="section-title">关联操作</text>
          <view class="link-row">
            <text class="link-text" @tap="openSourcePage">查看原对象详情</text>
            <text class="link-text" @tap="goDispatchAssign">关联任务指派</text>
            <text class="link-text" @tap="goHistory">更多记录</text>
          </view>
        </view>

        <!-- 历史记录：支持折叠，避免首屏被长列表挤占 -->
        <view class="card history-card">
          <view class="head-row">
            <text class="section-title">走访历史</text>
            <text class="toggle-link" @tap="toggleHistory">{{ showAllHistory ? '收起' : '展开全部' }}</text>
          </view>
          <view v-if="historyList.length === 0" class="empty-text">暂无历史记录</view>
          <view
            v-for="item in visibleHistory"
            :key="item.recordId"
            class="history-item"
            @tap="openRecord(item)"
          >
            <view class="history-top">
              <text class="history-title">{{ item.visitType || '走访记录' }}</text>
              <text :class="['pill', statusClass(item.status)]">{{ visitStatusText(item.status) }}</text>
            </view>
            <text class="history-meta">{{ formatDateTime(item.visitAt) }} · {{ visitResultText(item.result) }}</text>
            <text class="history-content">{{ item.content || '未填写走访内容' }}</text>
          </view>
        </view>
      </template>

      <!-- 底部固定按钮：两步完成“开始走访 -> 快速记录” -->
      <view v-if="objectDetail" class="bottom-bar">
        <button class="btn ghost" @tap="startVisit">{{ draftRecord ? '继续走访' : '开始走访' }}</button>
        <button class="btn primary" @tap="startRectify">新增整改项</button>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import comTag from '@/components/com-tag/com-tag.vue';
import {
  getVisitObjects,
  getVisitRecordsByObject,
  getVisitDraftByObject,
} from '@/common/database.js';
import {
  formatDateTime,
  visitResultText,
  visitStatusText,
  riskClass,
  statusClass,
} from './helper.js';

const objectId = ref('');
const objectDetail = ref(null);
const historyList = ref([]);
const draftRecord = ref(null);
const showAllHistory = ref(false);

const latestRecord = computed(() => historyList.value[0] || null);
const visibleHistory = computed(() => (showAllHistory.value ? historyList.value : historyList.value.slice(0, 3)));

function reloadDetail() {
  // 详情统一从聚合对象与记录中读取，避免“对象信息”和“历史信息”脱节
  const all = getVisitObjects();
  objectDetail.value = all.find((item) => item.objectId === objectId.value) || null;
  historyList.value = getVisitRecordsByObject(objectId.value);
  draftRecord.value = getVisitDraftByObject(objectId.value);
}

function toggleHistory() {
  showAllHistory.value = !showAllHistory.value;
}

function startVisit() {
  // 存在草稿则继续编辑，不存在草稿则创建新走访记录
  if (draftRecord.value) {
    uni.navigateTo({
      url: `/pages/visit/edit?objectId=${encodeURIComponent(objectId.value)}&draftId=${encodeURIComponent(draftRecord.value.draftId)}`,
    });
    return;
  }
  uni.navigateTo({ url: `/pages/visit/edit?objectId=${encodeURIComponent(objectId.value)}` });
}

function startRectify() {
  // 进入编辑页并聚焦整改项区域，减少二次操作
  const base = `/pages/visit/edit?objectId=${encodeURIComponent(objectId.value)}&focusRectify=1`;
  if (draftRecord.value) {
    uni.navigateTo({ url: `${base}&draftId=${encodeURIComponent(draftRecord.value.draftId)}` });
    return;
  }
  uni.navigateTo({ url: base });
}

function openSourcePage() {
  if (!objectDetail.value?.sourceUrl) {
    uni.showToast({ title: '暂无源对象页面', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: objectDetail.value.sourceUrl });
}

function goDispatchAssign() {
  // 保留任务指派联动入口，后续可按 objectId 自动带入关联对象
  uni.navigateTo({ url: '/pages/dispatch/assign' });
}

function goHistory() {
  uni.navigateTo({ url: '/pages/visit/history' });
}

function openRecord(item) {
  // 当前版本先跳转编辑页查看并可补录；后续可扩展独立记录详情页
  uni.navigateTo({
    url: `/pages/visit/edit?objectId=${encodeURIComponent(item.objectId)}&recordId=${encodeURIComponent(item.recordId)}`,
  });
}

onLoad((query) => {
  objectId.value = query?.objectId || '';
});

onShow(() => {
  reloadDetail();
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-detail {
  padding: 16rpx 24rpx calc(148rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
}

.profile-card,
.status-card,
.history-card,
.links-card {
  margin-bottom: 14rpx;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.name {
  flex: 1;
  min-width: 0;
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2b3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-line {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7785;
}

.tag-group {
  margin-top: 8rpx;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0;
}

.label {
  flex: 0 0 auto;
  font-size: 24rpx;
  color: #6b7785;
}

.value {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #1f2b3a;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.draft-tip {
  margin-top: 8rpx;
  color: #1677ff;
  font-size: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.link-row {
  margin-top: 10rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.link-text,
.toggle-link {
  font-size: 24rpx;
  color: #1677ff;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.history-item {
  padding: 12rpx 0;
  border-bottom: 1px solid #eef2f7;
}

.history-item:last-child {
  border-bottom: none;
}

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.history-title {
  font-size: 26rpx;
  color: #1f2b3a;
  font-weight: 600;
}

.history-meta {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #6b7785;
}

.history-content {
  margin-top: 4rpx;
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

.risk-high,
.status-danger {
  color: #d64545;
  background: #ffecec;
}

.risk-mid,
.status-warn {
  color: #c88719;
  background: #fff6e6;
}

.risk-low,
.status-ok {
  color: #1b9d5d;
  background: #e6f7ed;
}

.status-normal {
  color: #6b7785;
  background: #f4f6f8;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 12rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
}

.btn {
  flex: 1;
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.btn.ghost {
  background: #f4f6f8;
  color: #344150;
}

.btn.primary {
  background: #1677ff;
  color: #fff;
}

.empty-card {
  text-align: center;
  padding: 28rpx 0;
}

.empty-text {
  color: #98a2b3;
  font-size: 24rpx;
}
</style>

