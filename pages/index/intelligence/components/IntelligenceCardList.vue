<template>
  <view class="list-section">
    <view class="section-head">
      <text class="section-title">情报卡片</text>
      <text class="section-sub">{{ loading ? '加载中...' : `共 ${items.length} 条` }}</text>
    </view>

    <view v-if="loading" class="placeholder-list">
      <view v-for="index in 3" :key="index" class="placeholder-card"></view>
    </view>

    <view v-else-if="!items.length" class="empty-card">
      <text class="empty-title">暂无结果</text>
      <text class="empty-sub">当前筛选条件下没有可展示的情报对象</text>
    </view>

    <view v-else class="card-list">
      <view
        v-for="item in items"
        :key="item.id"
        :class="['intelligence-card', activeId === item.id ? 'active' : '']"
        @tap="emit('select', item)"
      >
        <view class="card-head">
          <view class="card-title-wrap">
            <text class="card-title">{{ item.title }}</text>
            <text :class="['risk-pill', riskClass(item.riskLevel)]">{{ item.riskLevel || '中' }}</text>
          </view>
          <text class="card-time">{{ item.updatedAtText }}</text>
        </view>

        <text class="card-subtitle">{{ item.subtitle }}</text>

        <view class="card-meta">
          <text class="meta-item">{{ item.metaLabel }}</text>
          <text class="meta-item">{{ item.address || '暂无地址' }}</text>
        </view>

        <view class="card-tags">
          <text v-for="tag in item.tags" :key="tag" class="tag-pill">{{ tag }}</text>
        </view>

        <view class="card-actions">
          <text class="action-text">{{ item.statusText }}</text>
          <text class="action-link" @tap.stop="emit('navigate', item)">
            {{ item.url ? '查看详情' : '定位查看' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  activeId: { type: String, default: '' },
});

const emit = defineEmits(['select', 'navigate']);

function riskClass(level) {
  if (level === '高') return 'high';
  if (level === '低') return 'low';
  return 'medium';
}
</script>

<style lang="scss" scoped>
.list-section {
  display: grid;
  gap: 14rpx;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #213446;
}

.section-sub {
  font-size: 22rpx;
  color: #6d8091;
}

.placeholder-list,
.card-list {
  display: grid;
  gap: 14rpx;
}

.placeholder-card,
.intelligence-card,
.empty-card {
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10rpx 24rpx rgba(18, 33, 47, 0.08);
}

.placeholder-card {
  height: 180rpx;
  background:
    linear-gradient(90deg, rgba(233, 239, 244, 0.9), rgba(246, 249, 251, 1), rgba(233, 239, 244, 0.9));
}

.intelligence-card.active {
  box-shadow: 0 16rpx 30rpx rgba(18, 63, 112, 0.18);
  border: 1px solid rgba(31, 124, 255, 0.22);
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-time {
  flex: 0 0 auto;
  font-size: 22rpx;
  color: #7c8ea0;
}

.risk-pill,
.tag-pill {
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
}

.risk-pill.high {
  color: #d24f3b;
  background: #ffebe7;
}

.risk-pill.medium {
  color: #bb7c1d;
  background: #fff2db;
}

.risk-pill.low {
  color: #228a52;
  background: #e8f8ef;
}

.card-subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #44576a;
  line-height: 1.5;
}

.card-meta {
  margin-top: 12rpx;
  display: grid;
  gap: 6rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #738597;
}

.card-tags {
  margin-top: 14rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.tag-pill {
  color: #42586b;
  background: #eef3f7;
}

.card-actions {
  margin-top: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-text {
  font-size: 22rpx;
  color: #6c7f91;
}

.action-link {
  font-size: 24rpx;
  color: #1779ff;
  font-weight: 600;
}

.empty-card {
  text-align: center;
}

.empty-title {
  display: block;
  font-size: 28rpx;
  color: #223547;
  font-weight: 700;
}

.empty-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #7c8ea0;
}
</style>
