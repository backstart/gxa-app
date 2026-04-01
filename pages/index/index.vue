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
    <web-view
      id="intelligenceMapWebview"
      class="map-layer"
      :src="appPlusMapSrc"
      @message="handleAppPlusMapMessage"
    />
    <view v-if="showAppPlusMapFallback" class="app-safe-map-fallback">
      <text class="app-safe-map-fallback__title">地图暂时不可用</text>
      <text class="app-safe-map-fallback__desc">{{ appPlusFallbackText }}</text>
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
// #ifndef APP-PLUS
import MapContainer from './intelligence/components/MapContainer.vue';
// #endif
import { MAP_BRIDGE_SOURCE, MAP_EVENT_TYPES } from './intelligence/adapters/map/types.js';
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

const APP_PLUS_MAP_WEBVIEW_ID = 'intelligenceMapWebview';
const showAppPlusMapFallback = ref(false);
const appPlusFallbackText = ref('请稍后重试，底部情报面板仍可继续使用。');
const appPlusMapSrc = computed(() => resolveAppPlusMapSrc(mapSrc.value));

let appPlusMapContext = null;
let appPlusMapReady = false;
let appPlusReadyTimer = null;
let appPlusPendingMessages = [];

const appPlusMapController = {
  init() {},
  setCenter(center) {
    postAppPlusMapCommand('setCenter', { center });
  },
  setZoom(zoom) {
    postAppPlusMapCommand('setZoom', { zoom });
  },
  flyTo(payload) {
    postAppPlusMapCommand('flyTo', payload);
  },
  addMarker(marker) {
    postAppPlusMapCommand('addMarkers', { markers: [marker] });
  },
  addMarkers(markers) {
    postAppPlusMapCommand('addMarkers', { markers });
  },
  clearMarkers() {
    postAppPlusMapCommand('clearMarkers', {});
  },
  setActiveLayers(layers) {
    postAppPlusMapCommand('setActiveLayers', { layers });
  },
  drawGeoJSON(featureCollection) {
    postAppPlusMapCommand('drawGeoJSON', { geojson: featureCollection });
  },
  selectObject(object) {
    if (Array.isArray(object?.coordinate) && object.coordinate.length >= 2) {
      postAppPlusMapCommand('flyTo', {
        center: object.coordinate,
        zoom: object.mapZoom || 15,
        duration: 600,
        essential: true,
      });
    }
  },
  setViewportInset(inset) {
    postAppPlusMapCommand('setViewportInset', { inset });
  },
  destroy() {},
};

onMounted(() => {
  // #ifdef APP-PLUS
  appPlusMapContext = resolveAppPlusMapContext();
  appPlusMapReady = false;
  appPlusPendingMessages = [];
  showAppPlusMapFallback.value = false;
  appPlusFallbackText.value = '请稍后重试，底部情报面板仍可继续使用。';
  if (appPlusMapContext) {
    startAppPlusReadyTimer();
    handleMapControllerReady(appPlusMapController);
  } else {
    showAppPlusMapFallback.value = true;
    appPlusFallbackText.value = '当前调试基座不支持地图桥接控制，页面已降级为仅加载地图背景。';
  }
  // #endif
});

onUnmounted(() => {
  clearAppPlusReadyTimer();
});

function startAppPlusReadyTimer() {
  clearAppPlusReadyTimer();
  appPlusReadyTimer = setTimeout(() => {
    showAppPlusMapFallback.value = true;
  }, 12000);
}

function clearAppPlusReadyTimer() {
  if (!appPlusReadyTimer) return;
  clearTimeout(appPlusReadyTimer);
  appPlusReadyTimer = null;
}

function postAppPlusMapCommand(type, payload) {
  const message = { type, payload: payload || {} };
  if (!appPlusMapReady || !appPlusMapContext) {
    appPlusPendingMessages.push(message);
    if (appPlusPendingMessages.length > 40) {
      appPlusPendingMessages = appPlusPendingMessages.slice(-40);
    }
    return;
  }

  appPlusMapContext.postMessage(message);
}

function flushAppPlusPendingMessages() {
  if (!appPlusMapReady || !appPlusMapContext || !appPlusPendingMessages.length) {
    return;
  }

  const messages = appPlusPendingMessages.slice();
  appPlusPendingMessages = [];
  messages.forEach((message) => {
    appPlusMapContext.postMessage(message);
  });
}

function handleAppPlusMapMessage(event) {
  const list = Array.isArray(event?.detail?.data) ? event.detail.data : [event?.detail?.data];
  list.forEach((raw) => {
    const normalized = normalizeAppPlusMapMessage(raw?.data ?? raw);
    if (!normalized) return;

    if (normalized.type === MAP_EVENT_TYPES.READY) {
      appPlusMapReady = true;
      showAppPlusMapFallback.value = false;
      clearAppPlusReadyTimer();
      flushAppPlusPendingMessages();
    }

    if (normalized.type === MAP_EVENT_TYPES.ERROR) {
      showAppPlusMapFallback.value = true;
      appPlusFallbackText.value = '地图加载失败，请稍后重试。';
      clearAppPlusReadyTimer();
    }

    handleMapEvent(normalized);
  });
}

function normalizeAppPlusMapMessage(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  if (message.source === MAP_BRIDGE_SOURCE || message.source === 'gxa-map-bridge') {
    return {
      type: message.type,
      payload: message.payload || {},
      raw: message,
    };
  }

  if (message.source === 'fuyaomap-embedded') {
    const rawType = String(message.type || '');
    const payload = message.payload || {};

    if (rawType === 'map-ready') return { type: MAP_EVENT_TYPES.READY, payload, raw: message };
    if (rawType === 'map-click') return { type: MAP_EVENT_TYPES.MAP_CLICK, payload, raw: message };
    if (rawType === 'marker-click') return { type: MAP_EVENT_TYPES.MARKER_CLICK, payload, raw: message };
    if (rawType === 'feature-located') return { type: MAP_EVENT_TYPES.OBJECT_SELECT, payload, raw: message };
    if (rawType === 'layers-ready' || rawType === 'layers-changed') {
      return { type: MAP_EVENT_TYPES.LAYERS_CHANGE, payload, raw: message };
    }
    if (rawType === 'viewport-change') {
      return { type: MAP_EVENT_TYPES.MOVE_END, payload, raw: message };
    }
  }

  return null;
}

function resolveAppPlusMapSrc(source) {
  if (!source) {
    return '';
  }

  if (source.indexOf('/static/map/fuyaomap-bridge.html') === -1) {
    return source;
  }

  try {
    const queryIndex = source.indexOf('?');
    if (queryIndex === -1) {
      return source;
    }

    const query = source.slice(queryIndex + 1);
    const segments = query.split('&');
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      if (!segment) continue;
      const splitIndex = segment.indexOf('=');
      const rawKey = splitIndex === -1 ? segment : segment.slice(0, splitIndex);
      if (decodeURIComponent(rawKey) !== 'embeddedUrl') {
        continue;
      }
      const rawValue = splitIndex === -1 ? '' : segment.slice(splitIndex + 1);
      return decodeURIComponent(rawValue) || source;
    }
    return source;
  } catch (error) {
    return source;
  }
}

function resolveAppPlusMapContext() {
  if (!uni || typeof uni.createWebViewContext !== 'function') {
    return null;
  }

  try {
    return uni.createWebViewContext(APP_PLUS_MAP_WEBVIEW_ID);
  } catch (error) {
    return null;
  }
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

.app-safe-map-fallback {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 180rpx;
  z-index: 6;
  padding: 28rpx 30rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 20rpx 44rpx rgba(17, 39, 57, 0.1);
}

.app-safe-map-fallback__title {
  display: block;
  color: #203243;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.3;
}

.app-safe-map-fallback__desc {
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
