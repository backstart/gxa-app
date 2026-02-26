<template>
  <AppPage>
    <view class="draft-box pageBg">
      <view class="summary card">
        <view class="head-row">
          <view>
            <text class="title">草稿箱</text>
            <text class="desc">共 {{ list.length }} 条因网络问题未上传成功的走访记录</text>
          </view>
          <text class="link-blue" @tap="uploadAll">全部上传</text>
        </view>
      </view>

      <view v-if="!list.length" class="card empty-card">
        <text class="empty-text">暂无待上传记录</text>
      </view>

      <view v-for="item in list" :key="item.queueId" class="card row-card">
        <view class="row-head">
          <text class="row-title ellipsis">{{ item.objectName || '未命名对象' }}</text>
          <text :class="['status-pill', item.status === 'failed' ? 'failed' : 'pending']">
            {{ item.status === 'failed' ? '上传失败' : '待上传' }}
          </text>
        </view>

        <text class="row-note">{{ item.content || '暂无走访内容' }}</text>
        <text class="row-meta">时间：{{ item.visitAt || item.updatedAt || '-' }}</text>
        <text class="row-meta">错误：{{ item.lastError || '网络异常导致未上传' }}</text>

        <view class="row-actions">
          <text class="link-blue" @tap="uploadOne(item)">手动上传</text>
          <text class="link-blue" @tap="openEdit(item)">继续编辑</text>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import {
  getVisitQueue,
  getVisitRecords,
  retryVisitQueueItem,
  flushVisitQueue,
} from '@/common/database.js';

const list = ref([]);

function loadList() {
  // 草稿箱数据来源：上传队列 + 记录表关联，保证能看到对象、内容与错误原因
  const queue = getVisitQueue()
    .filter((item) => ['pending', 'failed'].includes(String(item.status || '')))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  const recordMap = new Map(getVisitRecords().map((item) => [item.recordId, item]));

  list.value = queue.map((item) => {
    const record = recordMap.get(item.recordId) || {};
    return {
      ...item,
      objectId: record.objectId || '',
      objectName: record.objectName || '',
      visitAt: record.visitAt || '',
      content: record.content || '',
    };
  });
}

function getOnlineStatus() {
  // 手动上传前先判断网络状态，避免无网时频繁失败
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => resolve(!['none', 'unknown'].includes(String(res.networkType || ''))),
      fail: () => resolve(false),
    });
  });
}

async function uploadOne(item) {
  const online = await getOnlineStatus();
  if (!online) {
    uni.showToast({ title: '当前无网络，请稍后重试', icon: 'none' });
    return;
  }
  // 单条手动上传：复用数据库层重试逻辑，成功后自动从队列移除
  const ret = retryVisitQueueItem(item.queueId, { online: true });
  if (ret?.success) uni.showToast({ title: '上传成功', icon: 'success' });
  else uni.showToast({ title: '上传失败，请重试', icon: 'none' });
  loadList();
}

async function uploadAll() {
  if (!list.value.length) {
    uni.showToast({ title: '暂无待上传记录', icon: 'none' });
    return;
  }
  const online = await getOnlineStatus();
  if (!online) {
    uni.showToast({ title: '当前无网络，请稍后重试', icon: 'none' });
    return;
  }
  // 批量上传：统一走队列批量重试，结果直接反馈成功/失败数量
  const result = flushVisitQueue({ online: true });
  uni.showToast({ title: `成功${result.success}条`, icon: 'none' });
  loadList();
}

function openEdit(item) {
  if (!item.objectId) {
    uni.showToast({ title: '对象信息缺失，无法继续编辑', icon: 'none' });
    return;
  }
  // 继续编辑：跳回走访编辑页，可补充内容后再次提交
  uni.navigateTo({
    url: `/pages/visit/edit?objectId=${encodeURIComponent(item.objectId)}&recordId=${encodeURIComponent(item.recordId)}`,
  });
}

onShow(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.draft-box {
  padding: 16rpx 24rpx 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 14rpx;
  margin-bottom: 12rpx;
  box-sizing: border-box;
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.title {
  display: block;
  font-size: 32rpx;
  color: #1f2b3a;
  font-weight: 700;
}

.desc {
  margin-top: 6rpx;
  display: block;
  font-size: 24rpx;
  color: #6b7785;
}

.empty-card {
  text-align: center;
  padding: 26rpx 0;
}

.empty-text {
  color: #98a2b3;
  font-size: 24rpx;
}

.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.row-title {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #1f2b3a;
  font-weight: 600;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-pill {
  flex: 0 0 auto;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
}

.status-pill.pending {
  color: #c88719;
  background: #fff6e6;
}

.status-pill.failed {
  color: #d64545;
  background: #ffecec;
}

.row-note {
  margin-top: 8rpx;
  display: block;
  font-size: 24rpx;
  color: #4b5563;
}

.row-meta {
  margin-top: 6rpx;
  display: block;
  font-size: 22rpx;
  color: #8a95a6;
}

.row-actions {
  margin-top: 10rpx;
  display: inline-flex;
  gap: 20rpx;
}

.link-blue {
  color: #1677ff;
  font-size: 24rpx;
}
</style>
