<template>
  <view class="intelligence-page">
    <MapContainer
      class="map-layer"
      :adapter-type="mapAdapterType"
      :enabled="mapEnabled"
      :src="mapSrc"
      :initial-view="mapInitialView"
      @ready="handleMapControllerReady"
      @activate-request="handleMapActivate"
      @map-event="handleMapEvent"
    />

    <view class="top-overlay" :style="{ paddingTop: `${safeTop + 8}px` }">
      <view class="title-pill">
        <text class="title-text">情报中心</text>
      </view>
      <view class="status-pill">
        <text class="status-text">{{ currentAction.label }} · {{ summary.total }} 条</text>
      </view>
    </view>

    <BottomSheet
      :model-value="sheetState"
      :safe-bottom="safeBottom"
      @update:modelValue="handleSheetStateChange"
    >
      <view class="panel-content">
        <SearchBar
          v-model="keyword"
          :placeholder="searchPlaceholder"
          @search="handleSearch"
        />

        <QuickActions
          :actions="actions"
          :active-key="activeActionKey"
          @select="handleActionSelect"
        />

        <view class="summary-card">
          <view class="summary-head">
            <text class="summary-title">{{ currentAction.label }}</text>
            <text class="summary-sub">{{ summaryText }}</text>
          </view>
          <view class="summary-metrics">
            <view class="metric">
              <text class="metric-label">总量</text>
              <text class="metric-value">{{ summary.total }}</text>
            </view>
            <view class="metric">
              <text class="metric-label">高风险</text>
              <text class="metric-value accent">{{ summary.highRisk }}</text>
            </view>
            <view class="metric">
              <text class="metric-label">已定位</text>
              <text class="metric-value">{{ summary.mapped }}</text>
            </view>
          </view>
        </view>

        <IntelligenceCardList
          :items="items"
          :loading="loading"
          :active-id="selectedItemId"
          @select="handleCardSelect"
          @navigate="handleCardNavigate"
        />
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import MapContainer from './intelligence/components/MapContainer.vue';
import BottomSheet from './intelligence/components/BottomSheet.vue';
import SearchBar from './intelligence/components/SearchBar.vue';
import QuickActions from './intelligence/components/QuickActions.vue';
import IntelligenceCardList from './intelligence/components/IntelligenceCardList.vue';
import { useIntelligencePage } from './intelligence/composables/useIntelligencePage.js';

const {
  safeTop,
  safeBottom,
  keyword,
  searchPlaceholder,
  actions,
  activeActionKey,
  currentAction,
  summary,
  summaryText,
  items,
  loading,
  selectedItemId,
  mapAdapterType,
  mapEnabled,
  mapSrc,
  mapInitialView,
  sheetState,
  handleSearch,
  handleActionSelect,
  handleCardSelect,
  handleCardNavigate,
  handleMapControllerReady,
  handleMapActivate,
  handleMapEvent,
  handleSheetStateChange,
} = useIntelligencePage();
</script>

<style lang="scss" scoped>
.intelligence-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: transparent;
}

.map-layer {
  position: absolute;
  inset: 0;
}

.top-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 24rpx;
  padding-right: 24rpx;
  pointer-events: none;
}

.title-pill,
.status-pill {
  border-radius: 999rpx;
  background: rgba(15, 31, 46, 0.62);
  backdrop-filter: blur(12px);
  box-shadow: 0 12rpx 28rpx rgba(12, 28, 45, 0.18);
}

.title-pill {
  padding: 14rpx 18rpx;
}

.status-pill {
  padding: 14rpx 18rpx;
}

.title-text,
.status-text {
  color: #f7fbff;
  font-size: 24rpx;
}

.title-text {
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.panel-content {
  display: grid;
  gap: 18rpx;
}

.summary-card {
  padding: 20rpx;
  border-radius: 24rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.86), transparent 30%),
    linear-gradient(135deg, rgba(14, 123, 255, 0.12), rgba(255, 255, 255, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16rpx;
}

.summary-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #203243;
}

.summary-sub {
  font-size: 22rpx;
  color: #5c7083;
}

.summary-metrics {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.metric {
  padding: 14rpx 12rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.82);
}

.metric-label {
  display: block;
  font-size: 22rpx;
  color: #64788a;
}

.metric-value {
  display: block;
  margin-top: 6rpx;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1;
  color: #1f3346;
}

.metric-value.accent {
  color: #de5a39;
}
</style>

<style lang="scss">
page {
  background: transparent !important;
}

.uni-page-body,
.uni-page-wrapper {
  background: transparent !important;
}
</style>
