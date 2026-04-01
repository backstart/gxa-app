<template>
  <view class="map-container">
    <web-view
      v-if="shouldRenderWebview"
      ref="webviewRef"
      class="map-webview"
      :src="activeSrc"
      @message="handleMessage"
    />
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
  adapterType: { type: String, default: MAP_ADAPTER_TYPES.WEBVIEW },
});

const emit = defineEmits(['ready', 'map-event']);

const webviewRef = ref(null);
const shouldRenderWebview = ref(false);
const activeSrc = ref('');
const showFallback = ref(false);
const fallbackText = ref('请稍后重试，底部情报面板仍可继续使用。');
let readyTimer = null;
let mountTimer = null;

const adapter = createMapAdapter(props.adapterType, {
  onEvent(event) {
    if (event?.type === 'ready') {
      showFallback.value = false;
      clearReadyTimer();
    }
    if (event?.type === 'error') {
      showFallback.value = true;
      fallbackText.value = '地图加载失败，请稍后重试。';
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

function handleMessage(event) {
  adapter.handleMessageEvent(event);
}

watch(
  () => props.src,
  (nextSrc) => {
    adapter.setSource(nextSrc);
    scheduleWebviewMount(nextSrc);
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
  scheduleWebviewMount(props.src);
  emit('ready', controller);
});

onUnmounted(() => {
  clearMountTimer();
  clearReadyTimer();
  adapter.destroy();
});

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

defineExpose(controller);
</script>

<style lang="scss" scoped>
.map-container,
.map-webview {
  width: 100%;
  height: 100%;
}

.map-container {
  position: relative;
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
