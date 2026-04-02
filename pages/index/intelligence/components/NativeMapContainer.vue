<template>
  <view class="native-map">
    <view
      v-if="enabled"
      class="native-map__surface"
      @touchstart="handlePreviewTouchStart"
      @touchmove.stop.prevent="handlePreviewTouchMove"
      @touchend="handlePreviewTouchEnd"
      @touchcancel="handlePreviewTouchEnd"
    >
      <!-- #ifdef APP-PLUS -->
      <view
        v-if="usePlatformNativePlugin"
        :id="mapId"
        class="native-map__core"
      />
      <!-- #endif -->

      <view v-if="showPreviewFallback" :class="['native-map__preview', previewScene.className]">
        <view class="native-map__grid"></view>
        <view class="native-map__water native-map__water--one"></view>
        <view class="native-map__water native-map__water--two"></view>
        <view class="native-map__road native-map__road--one"></view>
        <view class="native-map__road native-map__road--two"></view>
        <view class="native-map__road native-map__road--three"></view>
      </view>

      <view v-if="showLoadingMask" class="native-map__loading">
        <view class="native-map__loading-dot"></view>
        <text class="native-map__loading-text">地图加载中</text>
      </view>

      <view class="native-map__overlay">
        <view v-if="showOverlayMeta" class="native-map__mode-badge">
          <text class="native-map__mode-badge-text">{{ mapModePill }}</text>
        </view>

        <view
          v-for="label in showOverlayMeta ? mapLabels : []"
          :key="label.id"
          :class="['native-map__label', label.className]"
        >
          {{ label.text }}
        </view>

        <view v-if="showOverlayMeta" class="native-map__layers">
          <text
            v-for="layer in visibleLayerPills"
            :key="layer"
            class="native-map__layer-pill"
          >
            {{ layer }}
          </text>
        </view>

        <view v-if="showPreviewFallback" class="native-map__preview-markers">
          <view
            v-for="marker in renderMarkers"
            :key="marker.id"
            class="native-map__marker"
            :class="marker.id === renderState.selectedId ? 'active' : ''"
            :style="{ left: marker.left, top: marker.top }"
            @tap.stop="handlePreviewMarkerTap(marker)"
          >
            <view class="native-map__marker-dot" :style="{ backgroundColor: marker.color }"></view>
            <text class="native-map__marker-label">{{ marker.label }}</text>
          </view>
        </view>

        <view class="native-map__bottom-shade" :style="{ height: `${viewportBottomPx}px` }"></view>
      </view>
    </view>

    <view v-else class="native-map__placeholder">
      <view class="native-map__placeholder-card">
        <text class="native-map__placeholder-title">地图已暂停加载</text>
        <text class="native-map__placeholder-desc">当前默认优先使用原生地图承载，可在需要时手动恢复。</text>
        <view class="native-map__placeholder-btn" @tap="emit('activate-request')">
          <text class="native-map__placeholder-btn-text">点击加载地图</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { createMapAdapter } from '../adapters/map/createMapAdapter.js';
import { MAP_ADAPTER_TYPES } from '../adapters/map/types.js';
import {
  detectPlatformNativeMapCapability,
  mountPlatformNativeMap,
  syncPlatformNativeMap,
  destroyPlatformNativeMap,
  addPlatformNativeMapListener,
} from '../services/platformNativeMapPlugin.js';

const mapId = 'intelligenceNativeMap';

const props = defineProps({
  enabled: { type: Boolean, default: true },
  src: { type: String, default: '' },
  initialView: { type: Object, default: null },
});

const emit = defineEmits(['ready', 'map-event', 'activate-request']);

const gestureState = reactive({
  mode: '',
  startCenter: [113.4445, 22.4915],
  startZoom: 13,
  startTouch: null,
  startDistance: 0,
});
const renderState = reactive({
  ready: false,
  center: [113.4445, 22.4915],
  zoom: 13,
  layers: [],
  markers: [],
  geojson: null,
  selectedId: '',
  selectedObject: null,
  viewportInset: { bottom: 0 },
  mode: 'native-preview',
  source: 'local-default',
  layerConfig: [],
  basemap: {
    provider: 'platform-config',
    source: 'local-default',
    tilesUrl: '',
    styleUrl: '',
    nativeTileUrlTemplate: '',
    kind: 'config-only',
  },
});

const usePlatformNativePlugin = ref(false);
const capabilityResolved = ref(false);
const nativeStartupPhase = ref('idle');
const allowPreviewFallback = ref(false);
let removeNativeMapListener = null;
const runtimeCapability = reactive({
  checked: false,
  enabled: false,
  reason: 'pending',
});

const visibleLayerPills = computed(() => {
  if (!renderState.layers.length) return ['警情', '场所', '人员'];
  return renderState.layers.slice(0, 4);
});

const showPreviewFallback = computed(() =>
  allowPreviewFallback.value
  && capabilityResolved.value
  && nativeStartupPhase.value === 'failed'
  && !usePlatformNativePlugin.value
);
const showLoadingMask = computed(() =>
  props.enabled && (
    !capabilityResolved.value
    || nativeStartupPhase.value === 'checking'
    || nativeStartupPhase.value === 'mounting'
    || (usePlatformNativePlugin.value && !renderState.ready)
  )
);
const mapModePill = computed(() => (showPreviewFallback.value ? '原生失败回退' : '原生启动中'));
const showOverlayMeta = computed(() => showPreviewFallback.value);

const viewportBottomPx = computed(() => Math.max(Number(renderState.viewportInset?.bottom || 0), 0));

const activeSceneKey = computed(() => resolveSceneKey(renderState.layers));

const previewScene = computed(() => {
  const sceneMap = {
    alerts: {
      className: 'native-map__preview--alerts',
      labels: ['桂南路口', '福耀警务室', '龙井坊KTV'],
    },
    places: {
      className: 'native-map__preview--places',
      labels: ['龙井坊KTV', '桂南便利店', '悦来网吧'],
    },
    people: {
      className: 'native-map__preview--people',
      labels: ['桂南路口', '警务站', '龙井坊KTV'],
    },
    handling: {
      className: 'native-map__preview--handling',
      labels: ['出警点A', '桂南路口', '联动警务站'],
    },
    patrol: {
      className: 'native-map__preview--patrol',
      labels: ['巡防卡点', '桂南警务站', '龙井坊KTV'],
    },
  };

  return sceneMap[activeSceneKey.value] || sceneMap.alerts;
});

const mapLabels = computed(() => {
  const source = renderState.markers
    .slice(0, 3)
    .map((marker, index) => ({
      id: `marker-label-${marker.id || index + 1}`,
      text: marker.label || previewScene.value.labels[index] || `点位${index + 1}`,
      className: [`native-map__label--one`, `native-map__label--two`, `native-map__label--three`][index] || 'native-map__label--one',
    }));

  if (source.length) {
    return source;
  }

  return previewScene.value.labels.map((text, index) => ({
    id: `scene-label-${index + 1}`,
    text,
    className: [`native-map__label--one`, `native-map__label--two`, `native-map__label--three`][index] || 'native-map__label--one',
  }));
});

const renderMarkers = computed(() =>
  renderState.markers.map((marker, index) => {
    const projected = projectMarker(marker, index, renderState.center, renderState.zoom);
    return {
      ...marker,
      left: `${projected.left}%`,
      top: `${projected.top}%`,
    };
  })
);

const adapter = createMapAdapter(MAP_ADAPTER_TYPES.NATIVE, {
  onEvent(event) {
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
  () => props.initialView,
  (nextView) => {
    if (!nextView || typeof nextView !== 'object') return;
    adapter.init(nextView);
  },
  { deep: true }
);

watch(
  () => props.enabled,
  (nextEnabled) => {
    if (nextEnabled && props.initialView) {
      adapter.init(props.initialView);
    }
  }
);

watch(
  () => ({
    center: renderState.center,
    zoom: renderState.zoom,
    markers: renderState.markers,
    geojson: renderState.geojson,
    layers: renderState.layers,
    layerConfig: renderState.layerConfig,
    selectedObject: renderState.selectedObject,
    viewportInset: renderState.viewportInset,
  }),
  () => {
    if (!usePlatformNativePlugin.value) return;
    syncPlatformNativeMap({
      center: renderState.center.slice(),
      zoom: renderState.zoom,
      markers: renderState.markers.slice(),
      geojson: renderState.geojson && typeof renderState.geojson === 'object' ? { ...renderState.geojson } : null,
      layers: renderState.layers.slice(),
      layerConfig: Array.isArray(renderState.layerConfig) ? renderState.layerConfig.slice() : [],
      selectedObject: renderState.selectedObject && typeof renderState.selectedObject === 'object'
        ? { ...renderState.selectedObject }
        : null,
      viewportInset: { ...renderState.viewportInset },
    });
  },
  { deep: true }
);

onMounted(async () => {
  allowPreviewFallback.value = String(uni.getStorageSync('intelligence_native_preview_debug') || '') === '1';
  adapter.setHost({
    syncState(nextState) {
      if (!nextState || typeof nextState !== 'object') return;
      if (Array.isArray(nextState.center)) renderState.center = nextState.center.slice();
      if (Number.isFinite(Number(nextState.zoom))) renderState.zoom = Number(nextState.zoom);
      if (Array.isArray(nextState.layers)) renderState.layers = nextState.layers.slice();
      if (Array.isArray(nextState.markers)) renderState.markers = nextState.markers.slice();
      if (nextState.geojson && typeof nextState.geojson === 'object') renderState.geojson = { ...nextState.geojson };
      if (typeof nextState.selectedId === 'string') renderState.selectedId = nextState.selectedId;
      if (Array.isArray(nextState.layerConfig)) renderState.layerConfig = nextState.layerConfig.slice();
      if (nextState.selectedObject && typeof nextState.selectedObject === 'object') {
        renderState.selectedObject = { ...nextState.selectedObject };
      }
      if (nextState.viewportInset) renderState.viewportInset = { ...renderState.viewportInset, ...nextState.viewportInset };
      if (typeof nextState.ready === 'boolean') renderState.ready = nextState.ready;
      if (nextState.mode) renderState.mode = nextState.mode;
      if (nextState.source) renderState.source = nextState.source;
      if (nextState.basemap) renderState.basemap = { ...renderState.basemap, ...nextState.basemap };
    },
  });

  adapter.setSource(props.src);
  adapter.init(props.initialView || {});
  renderState.ready = false;
  nativeStartupPhase.value = 'checking';

  await resolvePlatformNativeMode();
  removeNativeMapListener = addPlatformNativeMapListener(handlePlatformNativeEvent);
  if (usePlatformNativePlugin.value) {
    await nextTick();
    const mounted = mountPlatformNativeMap({
      containerId: mapId,
      center: renderState.center.slice(),
      zoom: renderState.zoom,
      basemap: { ...renderState.basemap },
      layers: renderState.layers.slice(),
      layerConfig: Array.isArray(renderState.layerConfig) ? renderState.layerConfig.slice() : [],
    });
    if (!mounted) {
      nativeStartupPhase.value = 'failed';
      usePlatformNativePlugin.value = false;
      emitNativeError('native-mount-failed');
    } else {
      nativeStartupPhase.value = 'mounting';
      emit('map-event', {
        type: 'native-status',
        payload: {
          phase: 'mounting',
          reason: 'mounting',
        },
      });
    }
  }

  emit('ready', controller);
});

onUnmounted(() => {
  if (typeof removeNativeMapListener === 'function') {
    removeNativeMapListener();
  }
  destroyPlatformNativeMap(mapId);
  adapter.destroy();
});

async function resolvePlatformNativeMode() {
  // #ifdef APP-PLUS
  nativeStartupPhase.value = 'checking';
  const capability = await detectPlatformNativeMapCapability();
  runtimeCapability.checked = true;
  runtimeCapability.enabled = capability.enabled;
  runtimeCapability.reason = capability.reason;
  capabilityResolved.value = true;

  if (capability.enabled || capability.reason === 'plugin-not-render-ready') {
    usePlatformNativePlugin.value = true;
    renderState.mode = capability.enabled ? 'native-platform-plugin' : 'native-platform-plugin-pending';
    renderState.ready = false;
    nativeStartupPhase.value = 'mounting';
    emit('map-event', {
      type: 'native-status',
      payload: {
        phase: 'mounting',
        reason: capability.reason,
      },
      raw: capability,
    });
    return;
  }
  usePlatformNativePlugin.value = false;
  renderState.mode = 'native-preview';
  renderState.ready = true;
  nativeStartupPhase.value = 'failed';
  emitNativeError(capability.reason || 'native plugin unavailable', capability);
  // #endif

  // #ifndef APP-PLUS
  runtimeCapability.checked = true;
  runtimeCapability.enabled = false;
  runtimeCapability.reason = 'not-app-plus';
  capabilityResolved.value = true;
  usePlatformNativePlugin.value = false;
  renderState.mode = 'native-preview';
  renderState.ready = true;
  nativeStartupPhase.value = 'failed';
  emit('map-event', {
    type: 'native-status',
    payload: {
      phase: 'failed',
      reason: 'not-app-plus',
    },
    raw: {},
  });
  // #endif
}

function handlePreviewMarkerTap(marker) {
  adapter.notifyMarkerClick(marker);
}

function handlePlatformNativeEvent(event) {
  if (!event || typeof event !== 'object') return;
  const type = String(event.type || '');
  const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};

  if (type === 'ready') {
    renderState.ready = true;
    nativeStartupPhase.value = 'ready';
    emit('map-event', {
      type: 'native-status',
      payload: {
        phase: 'ready',
        reason: 'native-ready',
      },
      raw: event,
    });
    emit('map-event', {
      type: 'ready',
      payload,
      raw: event,
    });
    return;
  }

  if (type === 'mapClick') {
    adapter.notifyMapClick({
      lng: Number(payload.lng),
      lat: Number(payload.lat),
    });
    return;
  }

  if (type === 'markerClick') {
    const hit = renderState.markers.find((item) => String(item.id) === String(payload.id));
    if (hit) {
      adapter.notifyMarkerClick(hit);
    } else {
      emit('map-event', {
        type: 'markerClick',
        payload,
        raw: event,
      });
    }
    return;
  }

  if (type === 'objectSelect') {
    emit('map-event', {
      type: 'objectSelect',
      payload,
      raw: event,
    });
    return;
  }

  if (type === 'moveEnd') {
    if (Array.isArray(payload.center) && payload.center.length >= 2) {
      adapter.setCenter(payload.center);
    }
    return;
  }

  if (type === 'zoomEnd') {
    if (Number.isFinite(Number(payload.zoom))) {
      adapter.setZoom(Number(payload.zoom));
    }
    return;
  }

  if (type === 'error') {
    const message = event.message || payload.message || 'native plugin render failed';
    if (isPendingNativeMessage(message)) {
      nativeStartupPhase.value = 'mounting';
      emit('map-event', {
        type: 'native-status',
        payload: {
          phase: 'mounting',
          reason: message,
        },
        raw: event,
      });
      return;
    }
    nativeStartupPhase.value = 'failed';
    usePlatformNativePlugin.value = false;
    emitNativeError(message, event);
  }
}

function emitNativeError(message, raw = {}) {
  emit('map-event', {
    type: 'native-status',
    payload: {
      phase: 'failed',
      reason: message,
    },
    raw,
  });
  emit('map-event', {
    type: 'error',
    payload: {
      message,
    },
    raw,
  });
}

function isPendingNativeMessage(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('plugin-not-render-ready')
    || text.includes('waiting-ready')
    || text.includes('mounting')
    || text.includes('bridge');
}

function handlePreviewTouchStart(event) {
  if (usePlatformNativePlugin.value || !capabilityResolved.value) return;
  const touches = normalizeTouches(event);
  if (!touches.length) return;

  gestureState.startCenter = renderState.center.slice();
  gestureState.startZoom = renderState.zoom;

  if (touches.length >= 2) {
    gestureState.mode = 'pinch';
    gestureState.startDistance = getTouchDistance(touches[0], touches[1]);
    return;
  }

  gestureState.mode = 'pan';
  gestureState.startTouch = touches[0];
}

function handlePreviewTouchMove(event) {
  if (usePlatformNativePlugin.value || !capabilityResolved.value) return;
  const touches = normalizeTouches(event);
  if (!touches.length) return;

  if (touches.length >= 2) {
    if (gestureState.mode !== 'pinch') {
      gestureState.mode = 'pinch';
      gestureState.startDistance = getTouchDistance(touches[0], touches[1]);
      gestureState.startZoom = renderState.zoom;
      return;
    }

    const distance = getTouchDistance(touches[0], touches[1]);
    if (!gestureState.startDistance) return;
    const scale = distance / gestureState.startDistance;
    const nextZoom = clampZoom(gestureState.startZoom + Math.log(scale) / Math.log(2));
    renderState.zoom = Number(nextZoom.toFixed(1));
    return;
  }

  if (gestureState.mode !== 'pan' || !gestureState.startTouch) {
    gestureState.mode = 'pan';
    gestureState.startTouch = touches[0];
    gestureState.startCenter = renderState.center.slice();
    return;
  }

  const currentTouch = touches[0];
  const deltaX = currentTouch.clientX - gestureState.startTouch.clientX;
  const deltaY = currentTouch.clientY - gestureState.startTouch.clientY;
  const lngPerPixel = 0.00018 / Math.max(renderState.zoom / 12, 0.7);
  const latPerPixel = lngPerPixel * 0.72;
  renderState.center = [
    Number((gestureState.startCenter[0] - deltaX * lngPerPixel).toFixed(6)),
    Number((gestureState.startCenter[1] + deltaY * latPerPixel).toFixed(6)),
  ];
}

function handlePreviewTouchEnd() {
  if (usePlatformNativePlugin.value || !capabilityResolved.value) return;
  if (!gestureState.mode) return;
  adapter.flyTo({
    center: renderState.center.slice(),
    zoom: renderState.zoom,
    duration: 0,
  });
  gestureState.mode = '';
  gestureState.startTouch = null;
  gestureState.startDistance = 0;
}

function clampZoom(value) {
  const zoom = Number(value || 13);
  if (!Number.isFinite(zoom)) return 13;
  return Math.max(5, Math.min(18, Math.round(zoom)));
}

function projectMarker(marker, index, center, zoom) {
  const lngSpan = Math.max(0.008, 0.16 / Math.max(Number(zoom || 12), 8));
  const latSpan = lngSpan * 0.72;
  const left = clamp(50 + ((marker.lng - center[0]) / lngSpan) * 38, 10, 90);
  const top = clamp(50 - ((marker.lat - center[1]) / latSpan) * 30, 14, 86);
  if (Number.isFinite(left) && Number.isFinite(top)) {
    return { left, top };
  }
  const fallback = [
    { left: 50, top: 48 },
    { left: 34, top: 60 },
    { left: 66, top: 38 },
    { left: 72, top: 58 },
    { left: 24, top: 36 },
  ][index] || { left: 50, top: 50 };
  return fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeTouches(event) {
  return Array.isArray(event?.touches) ? event.touches : [];
}

function getTouchDistance(a, b) {
  const dx = Number(a?.clientX || 0) - Number(b?.clientX || 0);
  const dy = Number(a?.clientY || 0) - Number(b?.clientY || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function resolveSceneKey(layers = []) {
  if (layers.includes('places')) return 'places';
  if (layers.includes('pois')) return 'people';
  if (layers.includes('boundaries')) return 'patrol';
  if (layers.includes('shops')) return 'handling';
  return 'alerts';
}

</script>

<style lang="scss" scoped>
.native-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.native-map__surface,
.native-map__core,
.native-map__preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.native-map__preview {
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(110, 186, 133, 0.18), transparent 22%),
    radial-gradient(circle at 84% 18%, rgba(66, 153, 225, 0.14), transparent 20%),
    linear-gradient(180deg, #eef3eb 0%, #dce6ef 100%);
}

.native-map__preview--alerts {
  background:
    radial-gradient(circle at 12% 30%, rgba(255, 117, 84, 0.18), transparent 18%),
    radial-gradient(circle at 82% 74%, rgba(255, 187, 92, 0.16), transparent 18%),
    linear-gradient(180deg, #eef3eb 0%, #dce6ef 100%);
}

.native-map__preview--places {
  background:
    radial-gradient(circle at 12% 30%, rgba(63, 147, 255, 0.18), transparent 18%),
    radial-gradient(circle at 82% 74%, rgba(116, 176, 255, 0.15), transparent 18%),
    linear-gradient(180deg, #edf5fb 0%, #d9e6f4 100%);
}

.native-map__preview--people {
  background:
    radial-gradient(circle at 12% 30%, rgba(69, 196, 129, 0.16), transparent 18%),
    radial-gradient(circle at 82% 74%, rgba(141, 225, 184, 0.14), transparent 18%),
    linear-gradient(180deg, #eef7f1 0%, #dbece4 100%);
}

.native-map__preview--handling {
  background:
    radial-gradient(circle at 12% 30%, rgba(255, 178, 62, 0.2), transparent 18%),
    radial-gradient(circle at 82% 74%, rgba(255, 215, 140, 0.18), transparent 18%),
    linear-gradient(180deg, #fbf4e8 0%, #eee3cf 100%);
}

.native-map__preview--patrol {
  background:
    radial-gradient(circle at 12% 30%, rgba(126, 104, 255, 0.16), transparent 18%),
    radial-gradient(circle at 82% 74%, rgba(177, 157, 255, 0.16), transparent 18%),
    linear-gradient(180deg, #f2effb 0%, #e4def5 100%);
}

.native-map__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.native-map__loading {
  position: absolute;
  inset: 0;
  z-index: 11;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: rgba(219, 229, 239, 0.22);
  pointer-events: none;
}

.native-map__loading-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 999rpx;
  background: #2e7df6;
  box-shadow:
    0 0 0 10rpx rgba(46, 125, 246, 0.12),
    0 0 0 22rpx rgba(46, 125, 246, 0.08);
}

.native-map__loading-text {
  color: #51667a;
  font-size: 24rpx;
}

.native-map__mode-badge {
  position: absolute;
  left: 24rpx;
  bottom: 164rpx;
  z-index: 10;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(15, 31, 46, 0.72);
  box-shadow: 0 12rpx 24rpx rgba(17, 39, 57, 0.12);
}

.native-map__mode-badge-text {
  color: #f7fbff;
  font-size: 20rpx;
  font-weight: 700;
}

.native-map__grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 46rpx 46rpx;
  opacity: 0.48;
}

.native-map__water,
.native-map__road {
  position: absolute;
  border-radius: 999rpx;
}

.native-map__water {
  background: rgba(170, 212, 241, 0.66);
}

.native-map__water--one {
  left: -8%;
  top: 22%;
  width: 42%;
  height: 16%;
  transform: rotate(-10deg);
}

.native-map__water--two {
  right: -10%;
  top: 62%;
  width: 34%;
  height: 12%;
  transform: rotate(14deg);
}

.native-map__road {
  background: rgba(255, 255, 255, 0.78);
  box-shadow:
    0 0 0 1px rgba(200, 210, 220, 0.45),
    0 10rpx 18rpx rgba(17, 39, 57, 0.06);
}

.native-map__road--one {
  left: -8%;
  top: 34%;
  width: 74%;
  height: 18rpx;
  transform: rotate(-10deg);
}

.native-map__road--two {
  right: -12%;
  top: 52%;
  width: 66%;
  height: 18rpx;
  transform: rotate(18deg);
}

.native-map__road--three {
  left: 20%;
  bottom: 18%;
  width: 48%;
  height: 14rpx;
  transform: rotate(76deg);
}

.native-map__label {
  position: absolute;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.84);
  color: #607588;
  font-size: 20rpx;
  box-shadow: 0 8rpx 18rpx rgba(17, 39, 57, 0.06);
}

.native-map__label--one {
  left: 24%;
  top: 32%;
}

.native-map__label--two {
  left: 52%;
  top: 22%;
}

.native-map__label--three {
  right: 16%;
  top: 48%;
}

.native-map__layers {
  position: absolute;
  right: 24rpx;
  top: 126rpx;
  z-index: 9;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10rpx;
  max-width: 360rpx;
}

.native-map__layer-pill {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(15, 31, 46, 0.68);
  color: #f7fbff;
  font-size: 20rpx;
}

.native-map__preview-markers {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}

.native-map__marker {
  position: absolute;
  transform: translate(-50%, -100%);
  display: grid;
  justify-items: center;
  gap: 8rpx;
  z-index: 8;
}

.native-map__marker-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 999rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 12rpx 20rpx rgba(17, 39, 57, 0.12);
}

.native-map__marker-label {
  max-width: 180rpx;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(20, 44, 65, 0.78);
  color: #f8fbff;
  font-size: 20rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.native-map__marker.active .native-map__marker-dot {
  transform: scale(1.2);
}

.native-map__bottom-shade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 7;
  background: linear-gradient(180deg, rgba(220, 230, 239, 0), rgba(220, 230, 239, 0.96));
  pointer-events: none;
}

.native-map__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.native-map__placeholder-card {
  width: 100%;
  max-width: 520rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20rpx 42rpx rgba(20, 44, 65, 0.12);
}

.native-map__placeholder-title {
  display: block;
  color: #1f3346;
  font-size: 30rpx;
  font-weight: 700;
}

.native-map__placeholder-desc {
  display: block;
  margin-top: 10rpx;
  color: #667b8f;
  font-size: 24rpx;
  line-height: 1.6;
}

.native-map__placeholder-btn {
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

.native-map__placeholder-btn-text {
  color: #f7fbff;
  font-size: 26rpx;
  font-weight: 700;
}
</style>
