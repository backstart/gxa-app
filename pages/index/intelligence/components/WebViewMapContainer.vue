<template>
  <view class="map-container">
    <web-view
      v-if="enabled && shouldRenderWebview"
      ref="webviewRef"
      class="map-webview"
      :src="activeSrc"
      @message="handleMessage"
    />
    <view v-if="!enabled" class="map-placeholder">
      <view class="map-placeholder__content">
        <text class="map-placeholder__title">地图已暂停加载</text>
        <text class="map-placeholder__desc">当前为 WebView fallback，可按需手动恢复。</text>
        <view class="map-placeholder__button" @tap="emit('activate-request')">
          <text class="map-placeholder__button-text">点击加载 WebView 地图</text>
        </view>
      </view>
    </view>
    <view class="map-badge">
      <text class="map-badge__text">WebView Fallback</text>
    </view>
    <view v-if="showFallback" class="map-fallback">
      <text class="map-fallback__title">地图暂时不可用</text>
      <text class="map-fallback__desc">{{ fallbackText }}</text>
    </view>
  </view>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { createMapAdapter } from '../adapters/map/createMapAdapter.js';
import { MAP_ADAPTER_TYPES } from '../adapters/map/types.js';

const props = defineProps({
  src: { type: String, required: true },
  enabled: { type: Boolean, default: true },
});

const emit = defineEmits(['ready', 'map-event', 'activate-request']);

const webviewRef = ref(null);
const shouldRenderWebview = ref(false);
const activeSrc = ref('');
const showFallback = ref(false);
const fallbackText = ref('请稍后重试，底部情报面板仍可继续使用。');
let readyTimer = null;
let mountTimer = null;

const adapter = createMapAdapter(MAP_ADAPTER_TYPES.WEBVIEW, {
  onEvent(event) {
    if (event?.type === 'ready') {
      showFallback.value = false;
      clearReadyTimer();
    }
    if (event?.type === 'error') {
      showFallback.value = true;
      fallbackText.value = 'WebView 地图加载失败，请稍后重试。';
      clearReadyTimer();
    }
    emit('map-event', event);
  },
});

const controller = {
  init(payload) {
    adapter.init(payload);
  },
  setCenter(center) {
    adapter.setCenter(center);
  },
  setZoom(zoom) {
    adapter.setZoom(zoom);
  },
  flyTo(payload) {
    adapter.flyTo(payload);
  },
  addMarker(marker) {
    adapter.addMarker(marker);
  },
  addMarkers(markers) {
    adapter.addMarkers(markers);
  },
  clearMarkers() {
    adapter.clearMarkers();
  },
  setActiveLayers(layers) {
    adapter.setActiveLayers(layers);
  },
  drawGeoJSON(featureCollection) {
    adapter.drawGeoJSON(featureCollection);
  },
  selectObject(object) {
    adapter.selectObject(object);
  },
  setViewportInset(inset) {
    adapter.setViewportInset(inset);
  },
  destroy() {
    adapter.destroy();
  },
};

watch(
  () => props.src,
  (nextSrc) => {
    adapter.setSource(nextSrc);
    scheduleWebviewMount(nextSrc);
  }
);

watch(
  () => props.enabled,
  (nextEnabled) => {
    if (nextEnabled) {
      scheduleWebviewMount(props.src);
      return;
    }
    clearMountTimer();
    clearReadyTimer();
    shouldRenderWebview.value = false;
    activeSrc.value = '';
  }
);

onMounted(() => {
  adapter.setHost({
    evalJS(script) {
      const host = webviewRef.value;
      if (!host || typeof host.evalJS !== 'function') {
        return false;
      }
      host.evalJS(script);
      return true;
    },
  });
  adapter.setSource(props.src);
  if (props.enabled) {
    scheduleWebviewMount(props.src);
  }
  emit('ready', controller);
});

onUnmounted(() => {
  clearMountTimer();
  clearReadyTimer();
  adapter.destroy();
});

function handleMessage(event) {
  adapter.handleMessageEvent(event);
}

function clearReadyTimer() {
  if (!readyTimer) return;
  clearTimeout(readyTimer);
  readyTimer = null;
}

function startReadyTimer() {
  clearReadyTimer();
  readyTimer = setTimeout(() => {
    showFallback.value = true;
  }, 12000);
}

function clearMountTimer() {
  if (!mountTimer) return;
  clearTimeout(mountTimer);
  mountTimer = null;
}

function scheduleWebviewMount(nextSrc) {
  clearMountTimer();
  clearReadyTimer();
  showFallback.value = false;
  fallbackText.value = '请稍后重试，底部情报面板仍可继续使用。';
  shouldRenderWebview.value = false;
  activeSrc.value = '';

  if (!nextSrc) {
    return;
  }

  mountTimer = setTimeout(async () => {
    activeSrc.value = nextSrc;
    shouldRenderWebview.value = true;
    await nextTick();
    startReadyTimer();
  }, 450);
}
</script>

<style lang="scss" scoped>
.map-container,
.map-webview {
  width: 100%;
  height: 100%;
}

.map-container {
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(84, 145, 255, 0.22), transparent 28%),
    linear-gradient(180deg, #eef4f8 0%, #dbe6ef 100%);
}

.map-badge {
  position: absolute;
  right: 24rpx;
  top: 24rpx;
  z-index: 6;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(15, 31, 46, 0.72);
}

.map-badge__text {
  color: #f7fbff;
  font-size: 20rpx;
}

.map-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.map-placeholder__content {
  width: 100%;
  max-width: 520rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20rpx 42rpx rgba(20, 44, 65, 0.12);
}

.map-placeholder__title {
  display: block;
  color: #1f3346;
  font-size: 30rpx;
  font-weight: 700;
}

.map-placeholder__desc {
  display: block;
  margin-top: 10rpx;
  color: #667b8f;
  font-size: 24rpx;
  line-height: 1.6;
}

.map-placeholder__button {
  margin-top: 18rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 76rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #1f7cff;
  box-shadow: 0 16rpx 28rpx rgba(31, 124, 255, 0.24);
}

.map-placeholder__button-text {
  color: #f7fbff;
  font-size: 26rpx;
  font-weight: 700;
}

.map-fallback {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 28rpx;
  z-index: 5;
  display: grid;
  gap: 8rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18rpx 36rpx rgba(20, 44, 65, 0.12);
}

.map-fallback__title {
  color: #1f3346;
  font-size: 28rpx;
  font-weight: 700;
}

.map-fallback__desc {
  color: #667b8f;
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
