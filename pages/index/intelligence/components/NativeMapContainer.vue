<template>
  <view class="native-map">
    <view
      v-if="enabled"
      :class="['native-map__surface', mapVisualStateClass]"
    >
      <!-- #ifdef APP-PLUS -->
      <view
        v-if="showNativeCore"
        :id="mapId"
        class="native-map__core"
      />
      <!-- #endif -->

      <DegradedBasemapSurface
        v-if="showDegradedBasemapSurface"
        class="native-map__degraded"
        :enabled="enabled"
        :center="renderState.center"
        :zoom="renderState.zoom"
        :layers="renderState.layers"
        :basemap="renderState.basemap"
        @status="handleDegradedSurfaceStatus"
      />

      <view v-if="showDegradedPreview" class="native-map__preview">
        <view class="native-map__preview-grid"></view>
        <view class="native-map__preview-road native-map__preview-road--a"></view>
        <view class="native-map__preview-road native-map__preview-road--b"></view>
        <view class="native-map__preview-road native-map__preview-road--c"></view>
        <view class="native-map__preview-lake native-map__preview-lake--a"></view>
        <view class="native-map__preview-lake native-map__preview-lake--b"></view>
        <view
          v-for="marker in previewMarkers"
          :key="marker.id"
          class="native-map__preview-marker"
          :class="{ 'native-map__preview-marker--selected': marker.selected }"
          :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
        >
          <text
            v-if="marker.showLabel"
            class="native-map__preview-marker-label"
          >{{ marker.label }}</text>
        </view>
      </view>

      <view v-if="showLoadingMask" class="native-map__loading">
        <view class="native-map__loading-dot"></view>
        <text class="native-map__loading-text">地图加载中</text>
      </view>

      <view v-else-if="showFailureMask" class="native-map__failure">
        <text class="native-map__failure-title">地图暂不可用</text>
        <text class="native-map__failure-desc">{{ failureText }}</text>
      </view>

      <view class="native-map__bottom-shade" :style="{ height: `${viewportBottomPx}px` }"></view>
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
import { isDebugMapFallbackEnabled } from '../services/mapEmbed.js';
import DegradedBasemapSurface from './DegradedBasemapSurface.vue';
import {
  detectPlatformNativeMapCapability,
  mountPlatformNativeMap,
  syncPlatformNativeMap,
  destroyPlatformNativeMap,
  addPlatformNativeMapListener,
} from '../services/platformNativeMapPlugin.js';

const mapId = `intelligenceNativeMap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const props = defineProps({
  enabled: { type: Boolean, default: true },
  src: { type: String, default: '' },
  initialView: { type: Object, default: null },
});

const emit = defineEmits(['ready', 'map-event', 'activate-request']);

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
  mode: 'native-startup',
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
const nativeFailureReason = ref('');
const debugPreviewEnabled = ref(false);
const lastBasemapSignature = ref('');
const nativeMountRequested = ref(false);
const degradedSurfacePhase = ref('idle');
const degradedSurfaceError = ref('');
let removeNativeMapListener = null;
let nativeReadyTimer = null;

const viewportBottomPx = computed(() => Math.max(Number(renderState.viewportInset?.bottom || 0), 0));
const showNativeCore = computed(() =>
  props.enabled && usePlatformNativePlugin.value
);
const basemapSourceType = computed(() => String(renderState.basemap?.sourceType || '').trim());
const hasRenderableBasemap = computed(() => {
  const styleUrl = String(renderState.basemap?.styleUrl || '').trim();
  const tilesUrl = String(renderState.basemap?.tilesUrl || '').trim();
  return !!styleUrl && !!tilesUrl;
});
const showNativeReadySurface = computed(() =>
  props.enabled
  && showNativeCore.value
  && renderState.ready
  && nativeStartupPhase.value === 'ready'
);
const mapSurfacePath = computed(() => {
  if (!props.enabled) return 'disabled';
  if (showNativeReadySurface.value) {
    return basemapSourceType.value === 'platform-real'
      ? 'native-platform-real'
      : 'native-platform-default-fallback';
  }

  if (showDegradedBasemapSurface.value) {
    return basemapSourceType.value === 'platform-real'
      ? 'degraded-platform-real'
      : 'degraded-platform-default-fallback';
  }

  return 'preview-only';
});
const showDegradedBasemapSurface = computed(() =>
  props.enabled
  && !showNativeReadySurface.value
  && hasRenderableBasemap.value
  && degradedSurfacePhase.value !== 'failed'
);
const showDegradedPreview = computed(() =>
  props.enabled
  && !showNativeReadySurface.value
  && (!hasRenderableBasemap.value || degradedSurfacePhase.value === 'failed')
);
const showLoadingMask = computed(() =>
  props.enabled
  && !showNativeReadySurface.value
  && mapSurfacePath.value === 'preview-only'
  && degradedSurfacePhase.value !== 'failed'
  && (
    !capabilityResolved.value
    || nativeStartupPhase.value === 'checking'
    || nativeStartupPhase.value === 'waiting-basemap'
    || nativeStartupPhase.value === 'mounting'
  )
);
const showFailureMask = computed(() =>
  props.enabled
  && !showLoadingMask.value
  && !showNativeReadySurface.value
  && mapSurfacePath.value === 'preview-only'
  && degradedSurfacePhase.value === 'failed'
  && (nativeStartupPhase.value === 'failed' || nativeStartupPhase.value === 'degraded')
);
const previewMarkers = computed(() => {
  const list = Array.isArray(renderState.markers) ? renderState.markers.slice(0, 80) : [];
  if (!list.length) return [];

  const centerLng = Number(renderState.center?.[0] || 113.4445);
  const centerLat = Number(renderState.center?.[1] || 22.4915);
  const zoom = Math.max(6, Number(renderState.zoom || 12));
  const lngScale = 180 * (zoom / 12);
  const latScale = 220 * (zoom / 12);

  return list.map((item, index) => {
    const id = String(item?.id || `preview-${index + 1}`);
    const lng = Number(item?.lng);
    const lat = Number(item?.lat);
    const hash = hashMarkerId(id);
    const dx = Number.isFinite(lng) ? (lng - centerLng) * lngScale : ((hash % 43) - 21) * 0.7;
    const dy = Number.isFinite(lat) ? (centerLat - lat) * latScale : ((((hash / 43) | 0) % 39) - 19) * 0.8;
    const x = clamp(8, 92, 50 + dx);
    const y = clamp(9, 88, 50 + dy);
    const selected = String(renderState.selectedId || '') === id;
    const label = String(item?.label || '').trim();
    return {
      id,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      selected,
      label: label || id,
      showLabel: selected || index < 4,
    };
  });
});
const mapVisualStateClass = computed(() => {
  if (showNativeReadySurface.value) {
    return 'native-map__surface--ready';
  }
  if (mapSurfacePath.value === 'degraded-platform-real' || mapSurfacePath.value === 'degraded-platform-default-fallback') {
    return 'native-map__surface--degraded';
  }
  if (showFailureMask.value) {
    return 'native-map__surface--failed';
  }
  return 'native-map__surface--loading';
});
const failureText = computed(() => {
  if (degradedSurfaceError.value) {
    return degradedSurfaceError.value;
  }
  if (debugPreviewEnabled.value && nativeFailureReason.value) {
    return nativeFailureReason.value;
  }
  return '请稍后重试，底部情报面板可继续使用。';
});

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
  () => props.src,
  (nextSrc) => {
    adapter.setSource(nextSrc);
  }
);

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
    if (!nextEnabled) {
      clearNativeReadyTimer();
      nativeStartupPhase.value = 'idle';
      renderState.ready = false;
      nativeFailureReason.value = '';
      nativeMountRequested.value = false;
      degradedSurfacePhase.value = 'idle';
      degradedSurfaceError.value = '';
      destroyPlatformNativeMap(mapId);
      return;
    }

    if (nextEnabled && props.initialView) {
      adapter.init(props.initialView);
    }

    if (nextEnabled && usePlatformNativePlugin.value) {
      tryMountPluginSurface('enabled-watch');
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
    if (!props.enabled || !usePlatformNativePlugin.value) return;
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

watch(
  () => mapSurfacePath.value,
  (path) => {
    if (!path || path === 'disabled') return;
    logMapSurfaceStatus(path, nativeFailureReason.value || nativeStartupPhase.value);
    emit('map-event', {
      type: 'map-surface',
      payload: {
        path,
        phase: nativeStartupPhase.value,
        sourceType: basemapSourceType.value,
        nativeReady: showNativeReadySurface.value,
        styleUrl: String(renderState.basemap?.styleUrl || ''),
        tilesUrl: String(renderState.basemap?.tilesUrl || ''),
        nativeTileUrlTemplate: String(renderState.basemap?.nativeTileUrlTemplate || ''),
      },
    });
  },
  { immediate: true }
);

watch(
  () => ({
    sourceType: renderState.basemap?.sourceType || '',
    styleUrl: renderState.basemap?.styleUrl || '',
    tilesUrl: renderState.basemap?.tilesUrl || '',
    nativeTileUrlTemplate: renderState.basemap?.nativeTileUrlTemplate || '',
  }),
  () => {
    if (hasRenderableBasemap.value && degradedSurfacePhase.value === 'failed') {
      degradedSurfacePhase.value = 'idle';
      degradedSurfaceError.value = '';
    }
    tryMountPluginSurface('basemap-sync');
  },
  { deep: true }
);

onMounted(async () => {
  debugPreviewEnabled.value = isDebugMapFallbackEnabled();

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
      if (nextState.basemap) {
        renderState.basemap = { ...renderState.basemap, ...nextState.basemap };
        logBasemapStatus('container-sync', renderState.basemap);
      }
    },
  });

  adapter.setSource(props.src);
  adapter.init(props.initialView || {});

  removeNativeMapListener = addPlatformNativeMapListener(handlePlatformNativeEvent);

  renderState.ready = false;
  nativeStartupPhase.value = 'checking';
  nativeFailureReason.value = '';
  degradedSurfacePhase.value = 'idle';
  degradedSurfaceError.value = '';

  await resolvePlatformNativeMode();
  tryMountPluginSurface('mounted');

  emit('ready', controller);
});

onUnmounted(() => {
  clearNativeReadyTimer();
  nativeMountRequested.value = false;
  if (typeof removeNativeMapListener === 'function') {
    removeNativeMapListener();
    removeNativeMapListener = null;
  }
  destroyPlatformNativeMap(mapId);
  adapter.destroy();
});

async function resolvePlatformNativeMode() {
  // #ifdef APP-PLUS
  nativeStartupPhase.value = 'checking';
  logMapSurfaceStatus('native-checking');
  const capability = await detectPlatformNativeMapCapability();
  capabilityResolved.value = true;

  if (capability.enabled || capability.reason === 'plugin-not-render-ready') {
    usePlatformNativePlugin.value = true;
    renderState.mode = capability.enabled ? 'native-platform-plugin' : 'native-platform-plugin-pending';
    renderState.ready = false;
    nativeStartupPhase.value = 'waiting-basemap';
    logMapSurfaceStatus('native-waiting-basemap', capability.reason || 'capability-ready');
    emit('map-event', {
      type: 'native-status',
      payload: {
        phase: 'waiting-basemap',
        reason: capability.reason || 'capability-ready',
      },
      raw: capability,
    });
    return;
  }

  enterDegradedMode(capability.reason || 'native plugin unavailable', capability);
  // #endif

  // #ifndef APP-PLUS
  capabilityResolved.value = true;
  enterDegradedMode('not-app-plus', {});
  // #endif
}

async function mountPluginSurface() {
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
    nativeMountRequested.value = false;
    enterDegradedMode('native-mount-failed');
    return false;
  }

  nativeStartupPhase.value = 'mounting';
  logMapSurfaceStatus('native-mounting', 'mounting');
  emit('map-event', {
    type: 'native-status',
    payload: {
      phase: 'mounting',
      reason: 'mounting',
    },
  });
  return true;
}

function handlePlatformNativeEvent(event) {
  if (!event || typeof event !== 'object') return;
  const type = String(event.type || '');
  const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};

  if (type === 'ready') {
    clearNativeReadyTimer();
    renderState.ready = true;
    nativeStartupPhase.value = 'ready';
    nativeFailureReason.value = '';
    degradedSurfacePhase.value = 'idle';
    degradedSurfaceError.value = '';
    logMapSurfaceStatus('native-ready');
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

  if (type === 'basemap') {
    logBasemapStatus('plugin-event', payload);
    emit('map-event', {
      type: 'basemap',
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
      scheduleNativeReadyTimeout();
      logMapSurfaceStatus('native-mounting', message);
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

    enterDegradedMode(message, event);
  }
}

function handleDegradedSurfaceStatus(status) {
  const phase = String(status?.phase || '').trim() || 'idle';
  degradedSurfacePhase.value = phase;
  degradedSurfaceError.value = phase === 'failed'
    ? String(status?.reason || 'degraded-surface-failed')
    : '';

  console.info('[map-surface]', {
    path: mapSurfacePath.value,
    phase: nativeStartupPhase.value,
    degradedPhase: degradedSurfacePhase.value,
    sourceType: basemapSourceType.value,
    nativeReady: showNativeReadySurface.value,
    styleUrl: String(status?.styleUrl || ''),
    tilesUrl: String(status?.tilesUrl || ''),
    nativeTileUrlTemplate: String(status?.nativeTileUrlTemplate || ''),
  });
}

function emitNativeError(message, raw = {}) {
  logMapSurfaceStatus('native-failed', message);
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

function emitDegradedStatus(reason, raw = {}) {
  logMapSurfaceStatus('degraded-preview', reason);
  emit('map-event', {
    type: 'native-status',
    payload: {
      phase: 'degraded',
      reason: reason || 'degraded-preview',
    },
    raw,
  });
}

function enterDegradedMode(reason, raw = {}) {
  clearNativeReadyTimer();
  nativeMountRequested.value = false;
  usePlatformNativePlugin.value = false;
  renderState.mode = 'native-degraded';
  renderState.ready = false;
  nativeStartupPhase.value = 'degraded';
  nativeFailureReason.value = reason || 'native-unavailable';
  if (degradedSurfacePhase.value === 'idle') {
    degradedSurfacePhase.value = hasRenderableBasemap.value ? 'loading' : 'failed';
  }
  emitNativeError(nativeFailureReason.value, raw);
  emitDegradedStatus(nativeFailureReason.value, raw);
}

function isPendingNativeMessage(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('plugin-not-render-ready')
    || text.includes('waiting-ready')
    || text.includes('mounting')
    || text.includes('bridge')
    || text.includes('initializing');
}

function clamp(min, max, value) {
  return Math.min(max, Math.max(min, Number(value || 0)));
}

function hashMarkerId(value) {
  const text = String(value || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function logMapSurfaceStatus(path, reason = '') {
  console.info('[intelligence][map-surface]', {
    path,
    reason: String(reason || ''),
    surfacePath: mapSurfacePath.value,
    phase: nativeStartupPhase.value,
    nativeEnabled: usePlatformNativePlugin.value,
    ready: renderState.ready,
    sourceType: basemapSourceType.value,
  });
}

function logBasemapStatus(stage, basemap) {
  if (!basemap || typeof basemap !== 'object') return;
  const sourceType = String(basemap.sourceType || '');
  const styleUrl = String(basemap.styleUrl || '');
  const tilesUrl = String(basemap.tilesUrl || '');
  const nativeTileUrlTemplate = String(basemap.nativeTileUrlTemplate || '');
  const isEmptyLocalSeed = stage === 'container-sync'
    && !sourceType
    && !styleUrl
    && !tilesUrl
    && !nativeTileUrlTemplate
    && String(basemap.source || '').trim() === 'local-default';
  if (isEmptyLocalSeed) return;
  const signature = `${stage}|${sourceType}|${styleUrl}|${tilesUrl}|${nativeTileUrlTemplate}`;
  if (lastBasemapSignature.value === signature) return;
  lastBasemapSignature.value = signature;
  const payload = {
    stage,
    sourceType,
    source: String(basemap.source || ''),
    styleUrl,
    tilesUrl,
    nativeTileUrlTemplate,
  };
  if (sourceType === 'platform-real') {
    console.info('[map-basemap]', payload);
    return;
  }
  console.warn('[map-basemap]', payload);
}

function scheduleNativeReadyTimeout() {
  clearNativeReadyTimer();
  nativeReadyTimer = setTimeout(() => {
    if (nativeStartupPhase.value !== 'mounting') return;
    if (renderState.ready) return;
    enterDegradedMode('native-ready-timeout');
  }, 15000);
}

function hasUsableBasemap() {
  const styleUrl = String(renderState.basemap?.styleUrl || '').trim();
  const tilesUrl = String(renderState.basemap?.tilesUrl || '').trim();
  return !!styleUrl && !!tilesUrl;
}

function tryMountPluginSurface(reason = '') {
  if (!props.enabled) return;
  if (!usePlatformNativePlugin.value) return;
  if (renderState.ready || nativeMountRequested.value) return;
  if (!hasUsableBasemap()) {
    nativeStartupPhase.value = 'waiting-basemap';
    logMapSurfaceStatus('native-waiting-basemap', reason || 'basemap-missing');
    emit('map-event', {
      type: 'native-status',
      payload: {
        phase: 'waiting-basemap',
        reason: reason || 'basemap-missing',
      },
    });
    return;
  }
  nativeMountRequested.value = true;
  nativeStartupPhase.value = 'mounting';
  scheduleNativeReadyTimeout();
  void mountPluginSurface();
}

function clearNativeReadyTimer() {
  if (!nativeReadyTimer) return;
  clearTimeout(nativeReadyTimer);
  nativeReadyTimer = null;
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
.native-map__core {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.native-map__degraded {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.native-map__surface--loading,
.native-map__surface--failed {
  background: #e9edf2;
}

.native-map__surface--ready {
  background: transparent;
}

.native-map__surface--degraded {
  background:
    radial-gradient(circle at top left, rgba(70, 136, 228, 0.14), transparent 30%),
    linear-gradient(180deg, #eff4f8 0%, #dbe6ef 100%);
}

.native-map__preview {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
}

.native-map__preview-grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(129, 149, 171, 0.07) 1px, transparent 1px) 0 0 / 62rpx 62rpx,
    linear-gradient(180deg, rgba(129, 149, 171, 0.07) 1px, transparent 1px) 0 0 / 62rpx 62rpx;
}

.native-map__preview-road {
  position: absolute;
  height: 14rpx;
  border-radius: 999rpx;
  background: rgba(246, 249, 252, 0.92);
  box-shadow: 0 8rpx 16rpx rgba(20, 44, 65, 0.08);
}

.native-map__preview-road--a {
  width: 56%;
  left: -2%;
  top: 34%;
  transform: rotate(-9deg);
}

.native-map__preview-road--b {
  width: 44%;
  right: -2%;
  top: 53%;
  transform: rotate(19deg);
}

.native-map__preview-road--c {
  width: 32%;
  left: 38%;
  bottom: 18%;
  transform: rotate(-22deg);
}

.native-map__preview-lake {
  position: absolute;
  border-radius: 999rpx;
  background: rgba(126, 188, 244, 0.32);
}

.native-map__preview-lake--a {
  width: 240rpx;
  height: 240rpx;
  left: -42rpx;
  top: 30%;
}

.native-map__preview-lake--b {
  width: 170rpx;
  height: 170rpx;
  right: -34rpx;
  bottom: 24%;
}

.native-map__preview-marker {
  position: absolute;
  z-index: 3;
  width: 20rpx;
  height: 20rpx;
  margin-left: -10rpx;
  margin-top: -10rpx;
  border-radius: 999rpx;
  background: #2285ff;
  box-shadow:
    0 0 0 4rpx rgba(255, 255, 255, 0.9),
    0 5rpx 11rpx rgba(16, 53, 90, 0.28);
}

.native-map__preview-marker--selected {
  background: #ff7c49;
  box-shadow:
    0 0 0 5rpx rgba(255, 255, 255, 0.94),
    0 8rpx 16rpx rgba(193, 92, 54, 0.36);
}

.native-map__preview-marker-label {
  position: absolute;
  left: 10rpx;
  top: -14rpx;
  max-width: 220rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(14, 32, 47, 0.72);
  color: #f5fbff;
  font-size: 20rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: rgba(233, 237, 242, 0.22);
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

.native-map__failure {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 28rpx;
  z-index: 11;
  display: grid;
  gap: 8rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18rpx 36rpx rgba(20, 44, 65, 0.12);
}

.native-map__failure-title {
  color: #1f3346;
  font-size: 28rpx;
  font-weight: 700;
}

.native-map__failure-desc {
  color: #667b8f;
  font-size: 24rpx;
  line-height: 1.5;
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
