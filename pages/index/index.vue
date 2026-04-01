<template>
  <view class="intelligence-page">
    <!-- #ifndef APP-PLUS -->
    <MapContainer
      class="map-layer"
      :enabled="mapEnabled"
      :src="mapSrc"
      @ready="handleMapControllerReady"
      @activate-request="handleMapActivate"
      @map-event="handleMapEvent"
    />
    <!-- #endif -->
    <!-- #ifdef APP-PLUS -->
    <view class="map-layer app-safe-map-shell">
      <view class="app-safe-map-shell__grid"></view>
      <view class="app-safe-map-shell__glow app-safe-map-shell__glow--one"></view>
      <view class="app-safe-map-shell__glow app-safe-map-shell__glow--two"></view>
      <view class="app-safe-map-shell__road app-safe-map-shell__road--one"></view>
      <view class="app-safe-map-shell__road app-safe-map-shell__road--two"></view>
      <view class="app-safe-map-shell__road app-safe-map-shell__road--three"></view>
      <view class="app-safe-map-shell__label app-safe-map-shell__label--one">桂南路</view>
      <view class="app-safe-map-shell__label app-safe-map-shell__label--two">福耀片区</view>
      <view class="app-safe-map-shell__label app-safe-map-shell__label--three">龙井路</view>
      <view class="app-safe-map-shell__card">
        <text class="app-safe-map-shell__title">首页暂以稳定背景运行</text>
        <text class="app-safe-map-shell__desc">当前基座下，情报页首屏直接挂载地图 web-view 仍会触发原生崩溃。已回退为稳定地图风格背景，底部情报面板继续正常使用。</text>
      </view>
    </view>
    <!-- #endif -->

    <view class="top-overlay" :style="{ paddingTop: `${safeTop + 8}px` }">
      <view class="title-pill">
        <text class="title-text">情报中心</text>
      </view>
      <view class="status-pill">
        <text class="status-text">{{ currentAction.label }} · {{ summary.total }} 条</text>
      </view>
    </view>
    <!-- #ifdef APP-PLUS -->
    <view class="map-lab-entry" :style="{ top: `${safeTop + 84}px` }" @tap="openMapLab">
      <text class="map-lab-entry__text">地图实验页</text>
    </view>
    <!-- #endif -->

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
// #ifndef APP-PLUS
import MapContainer from './intelligence/components/MapContainer.vue';
// #endif
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
  mapEnabled,
  mapSrc,
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

function openMapLab() {
  uni.navigateTo({
    url: '/pages/map/lab',
  });
}
</script>

<style lang="scss" scoped>
.intelligence-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #dbe5ef;
}

.map-layer {
  position: absolute;
  inset: 0;
}

.app-safe-map-shell {
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 12%, rgba(42, 132, 255, 0.24), transparent 24%),
    radial-gradient(circle at 86% 18%, rgba(0, 194, 168, 0.18), transparent 22%),
    linear-gradient(180deg, #e8f0f6 0%, #dbe5ef 100%);
}

.app-safe-map-shell__grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 48rpx 48rpx;
  opacity: 0.46;
}

.app-safe-map-shell__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(18rpx);
  opacity: 0.7;
}

.app-safe-map-shell__glow--one {
  top: 12%;
  left: -8%;
  width: 280rpx;
  height: 280rpx;
  background: rgba(47, 128, 237, 0.26);
}

.app-safe-map-shell__glow--two {
  right: -10%;
  top: 28%;
  width: 360rpx;
  height: 360rpx;
  background: rgba(12, 186, 154, 0.16);
}

.app-safe-map-shell__road {
  position: absolute;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.76);
  box-shadow:
    0 0 0 1px rgba(196, 208, 220, 0.4),
    0 10rpx 22rpx rgba(17, 39, 57, 0.06);
}

.app-safe-map-shell__road--one {
  left: -8%;
  top: 34%;
  width: 74%;
  height: 18rpx;
  transform: rotate(-10deg);
}

.app-safe-map-shell__road--two {
  right: -12%;
  top: 52%;
  width: 66%;
  height: 18rpx;
  transform: rotate(18deg);
}

.app-safe-map-shell__road--three {
  left: 20%;
  bottom: 18%;
  width: 48%;
  height: 14rpx;
  transform: rotate(76deg);
}

.app-safe-map-shell__label {
  position: absolute;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.82);
  color: #607588;
  font-size: 20rpx;
  box-shadow: 0 8rpx 18rpx rgba(17, 39, 57, 0.06);
}

.app-safe-map-shell__label--one {
  left: 24%;
  top: 32%;
}

.app-safe-map-shell__label--two {
  left: 52%;
  top: 22%;
}

.app-safe-map-shell__label--three {
  right: 16%;
  top: 48%;
}

.app-safe-map-shell__card {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 156rpx;
  padding: 24rpx 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 20rpx 44rpx rgba(17, 39, 57, 0.1);
}

.app-safe-map-shell__title {
  display: block;
  color: #203243;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.3;
}

.app-safe-map-shell__desc {
  display: block;
  margin-top: 12rpx;
  color: #5f7386;
  font-size: 24rpx;
  line-height: 1.7;
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

.map-lab-entry {
  position: absolute;
  right: 24rpx;
  z-index: 24;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 72rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16rpx 32rpx rgba(17, 39, 57, 0.14);
}

.map-lab-entry__text {
  color: #1f3346;
  font-size: 24rpx;
  font-weight: 700;
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
