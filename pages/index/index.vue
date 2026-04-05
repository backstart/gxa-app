<template>
  <view class="intelligence-page">
    <MapContainer
      class="map-layer"
      :adapter-type="mapAdapterType"
      :enabled="mapEnabled"
      :src="mapSrc"
      :initial-view="mapInitialView"
      :session-key="mapSessionKey"
      @ready="handleMapControllerReady"
      @activate-request="handleMapActivate"
      @map-event="handleMapEvent"
    />

    <view v-if="showDomOverlay" class="top-overlay" :style="{ paddingTop: `${safeTop + 8}px` }">
      <view class="title-pill">
        <text class="title-text">情报中心</text>
      </view>
      <view class="status-pill">
        <text class="status-text">{{ currentAction.label }} · {{ summary.total }} 条</text>
      </view>
    </view>

    <BottomSheet
      v-if="showDomOverlay"
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { onHide, onShow } from '@dcloudio/uni-app';
import MapContainer from './intelligence/components/MapContainer.vue';
import BottomSheet from './intelligence/components/BottomSheet.vue';
import SearchBar from './intelligence/components/SearchBar.vue';
import QuickActions from './intelligence/components/QuickActions.vue';
import IntelligenceCardList from './intelligence/components/IntelligenceCardList.vue';
import { useIntelligencePage } from './intelligence/composables/useIntelligencePage.js';
import { createIntelligenceOverlayBridge } from './intelligence/services/intelligenceOverlayBridge.js';

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
  mapSessionKey,
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

const overlayBridge = createIntelligenceOverlayBridge();
const overlayChannelReady = ref(false);
const overlayUiReady = ref(false);
const showDomOverlay = computed(() => !overlayUiReady.value);
const OVERLAY_INIT_RETRY_MAX = 30;
const OVERLAY_INIT_RETRY_INTERVAL = 120;
const OVERLAY_EVENT_CACHE_LIMIT = 240;
const OVERLAY_READY_TIMEOUT_MS = 1500;

let stopOverlayListener = null;
let overlaySyncTimer = null;
let overlaySessionSeq = 0;
let overlayInitRetryTimer = null;
let overlayInitAttempts = 0;
let overlayReadyTimeoutTimer = null;
const handledOverlayEventIds = [];
const handledOverlayEventSet = new Set();

function buildOverlayStatePayload() {
  return {
    sessionSeq: overlaySessionSeq,
    safeTop: Number(safeTop.value || 0),
    safeBottom: Number(safeBottom.value || 0),
    keyword: String(keyword.value || ''),
    searchPlaceholder: String(searchPlaceholder.value || ''),
    actions: Array.isArray(actions.value) ? actions.value.slice() : [],
    activeActionKey: String(activeActionKey.value || ''),
    currentActionLabel: String(currentAction.value?.label || ''),
    summary: summary.value && typeof summary.value === 'object'
      ? { ...summary.value }
      : { total: 0, highRisk: 0, mapped: 0 },
    summaryText: String(summaryText.value || ''),
    items: Array.isArray(items.value) ? items.value.slice() : [],
    loading: !!loading.value,
    selectedItemId: String(selectedItemId.value || ''),
    sheetState: String(sheetState.value || 'half'),
  };
}

function syncOverlayStateNow(type = 'sync-state') {
  if (!overlayChannelReady.value) return;
  console.info('[intelligence][overlay-runtime]', {
    path: 'overlay-sync-state',
    type,
    overlayChannelReady: overlayChannelReady.value,
    overlayUiReady: overlayUiReady.value,
  });
  overlayBridge.send(type, buildOverlayStatePayload());
}

function scheduleOverlayStateSync(type = 'sync-state') {
  if (!overlayChannelReady.value) return;
  if (overlaySyncTimer) {
    clearTimeout(overlaySyncTimer);
    overlaySyncTimer = null;
  }
  overlaySyncTimer = setTimeout(() => {
    overlaySyncTimer = null;
    syncOverlayStateNow(type);
  }, 16);
}

function findItemById(id) {
  const text = String(id || '');
  if (!text) return null;
  return (Array.isArray(items.value) ? items.value : []).find((item) => String(item?.id || '') === text) || null;
}

function handleOverlayEvent(event) {
  if (!rememberOverlayEventId(event?.id)) return;
  const type = String(event?.type || '').trim();
  const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {};
  if (!type) return;
  if (type === 'overlay-mounted' || type === 'overlay-ready') {
    overlayUiReady.value = true;
    clearOverlayReadyTimeout();
    console.info('[intelligence][overlay-runtime]', {
      path: 'overlay-ready',
      eventType: type,
      overlayChannelReady: overlayChannelReady.value,
      overlayUiReady: overlayUiReady.value,
    });
    syncOverlayStateNow('init');
    return;
  }
  if (type === 'keyword-change') {
    keyword.value = String(payload.keyword || '');
    return;
  }
  if (type === 'search') {
    keyword.value = String(payload.keyword || keyword.value || '');
    handleSearch();
    return;
  }
  if (type === 'select-action') {
    const key = String(payload.key || '');
    if (key) handleActionSelect(key);
    return;
  }
  if (type === 'select-card') {
    const item = findItemById(payload.id);
    if (item) {
      handleCardSelect(item);
    }
    return;
  }
  if (type === 'navigate-card') {
    const item = findItemById(payload.id);
    if (item) {
      handleCardNavigate(item);
    }
    return;
  }
  if (type === 'change-sheet-state') {
    const state = String(payload.state || '');
    if (state) {
      handleSheetStateChange(state);
    }
  }
}

function clearOverlaySyncTimer() {
  if (!overlaySyncTimer) return;
  clearTimeout(overlaySyncTimer);
  overlaySyncTimer = null;
}

function clearOverlayReadyTimeout() {
  if (!overlayReadyTimeoutTimer) return;
  clearTimeout(overlayReadyTimeoutTimer);
  overlayReadyTimeoutTimer = null;
}

function clearOverlayInitRetryTimer() {
  if (!overlayInitRetryTimer) return;
  clearTimeout(overlayInitRetryTimer);
  overlayInitRetryTimer = null;
}

function startOverlayReadyTimeout() {
  clearOverlayReadyTimeout();
  overlayReadyTimeoutTimer = setTimeout(() => {
    overlayReadyTimeoutTimer = null;
    if (overlayUiReady.value) return;
    console.warn('[intelligence][overlay-runtime]', {
      path: 'overlay-fallback-dom',
      reason: 'overlay-ready-timeout',
      timeout: OVERLAY_READY_TIMEOUT_MS,
      overlayChannelReady: overlayChannelReady.value,
      overlayUiReady: overlayUiReady.value,
    });
  }, OVERLAY_READY_TIMEOUT_MS);
}

function rememberOverlayEventId(eventId) {
  const id = Number(eventId || 0);
  if (!id || Number.isNaN(id)) return true;
  if (handledOverlayEventSet.has(id)) return false;
  handledOverlayEventSet.add(id);
  handledOverlayEventIds.push(id);
  if (handledOverlayEventIds.length > OVERLAY_EVENT_CACHE_LIMIT) {
    const staleId = handledOverlayEventIds.shift();
    handledOverlayEventSet.delete(staleId);
  }
  return true;
}

function startOverlayListener() {
  if (typeof stopOverlayListener === 'function') return;
  stopOverlayListener = overlayBridge.onOverlayEvent(handleOverlayEvent);
}

function activateNativeOverlay() {
  overlayChannelReady.value = true;
  console.info('[intelligence][overlay-runtime]', {
    path: 'overlay-subnvue-found',
    overlayChannelReady: overlayChannelReady.value,
    overlayUiReady: overlayUiReady.value,
  });
  overlayBridge.show();
  syncOverlayStateNow('init');
  startOverlayReadyTimeout();
}

function tryInitNativeOverlay() {
  // #ifndef APP-PLUS
  return;
  // #endif
  if (overlayChannelReady.value) {
    scheduleOverlayStateSync('sync-state');
    return;
  }
  console.info('[intelligence][overlay-runtime]', {
    path: 'overlay-init-start',
    attempt: overlayInitAttempts + 1,
    overlayChannelReady: overlayChannelReady.value,
    overlayUiReady: overlayUiReady.value,
  });
  clearOverlayInitRetryTimer();
  overlayInitAttempts += 1;
  const ok = overlayBridge.init();
  if (ok) {
    activateNativeOverlay();
    return;
  }
  if (overlayInitAttempts >= OVERLAY_INIT_RETRY_MAX) {
    console.warn('[intelligence][overlay-runtime]', {
      path: 'overlay-fallback-dom',
      reason: 'overlay-subnvue-not-found',
      attempts: overlayInitAttempts,
      overlayChannelReady: overlayChannelReady.value,
      overlayUiReady: overlayUiReady.value,
    });
    return;
  }
  overlayInitRetryTimer = setTimeout(() => {
    overlayInitRetryTimer = null;
    tryInitNativeOverlay();
  }, OVERLAY_INIT_RETRY_INTERVAL);
}

function attachOverlayGlobalBridge() {
  // #ifdef APP-PLUS
  window.__INTELLIGENCE_OVERLAY_BRIDGE__ = (serialized) => {
    try {
      const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
      handleOverlayEvent(parsed);
    } catch (error) {
      console.warn('[overlay-bridge] parse overlay message failed', error);
    }
  };
  // #endif
}

function detachOverlayGlobalBridge() {
  // #ifdef APP-PLUS
  try {
    delete window.__INTELLIGENCE_OVERLAY_BRIDGE__;
  } catch (error) {
    window.__INTELLIGENCE_OVERLAY_BRIDGE__ = null;
  }
  // #endif
}

onMounted(() => {
  // #ifdef APP-PLUS
  attachOverlayGlobalBridge();
  overlaySessionSeq += 1;
  startOverlayListener();
  overlayInitAttempts = 0;
  tryInitNativeOverlay();
  // #endif
});

onUnmounted(() => {
  clearOverlayInitRetryTimer();
  clearOverlayReadyTimeout();
  clearOverlaySyncTimer();
  if (typeof stopOverlayListener === 'function') {
    stopOverlayListener();
    stopOverlayListener = null;
  }
  overlayBridge.destroy();
  overlayChannelReady.value = false;
  overlayUiReady.value = false;
  detachOverlayGlobalBridge();
});

onShow(() => {
  if (!overlayChannelReady.value) {
    tryInitNativeOverlay();
    return;
  }
  overlayBridge.show();
  scheduleOverlayStateSync('sync-state');
  if (!overlayUiReady.value) {
    startOverlayReadyTimeout();
  }
});

onHide(() => {
  if (!overlayChannelReady.value) return;
  overlayBridge.hide();
});

const overlayWatchSources = [
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
  sheetState,
];

overlayWatchSources.forEach((sourceRef) => {
  watch(sourceRef, () => {
    scheduleOverlayStateSync('sync-state');
  }, { deep: true });
});
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
