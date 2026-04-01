<template>
  <view class="native-map">
    <view v-if="enabled" class="native-map__surface">
      <!-- #ifdef APP-PLUS -->
      <map
        v-if="useSystemMap"
        :id="mapId"
        class="native-map__core"
        :longitude="mapLongitude"
        :latitude="mapLatitude"
        :scale="mapScale"
        :markers="nativeMarkers"
        :polygons="nativePolygons"
        :enable-scroll="true"
        :enable-zoom="true"
        :show-location="false"
        :enable-poi="true"
        @tap="handleMapTap"
        @markertap="handleMarkerTap"
        @regionchange="handleRegionChange"
      />
      <!-- #endif -->

      <view v-if="!useSystemMap" :class="['native-map__preview', previewScene.className]">
        <view class="native-map__grid"></view>
        <view class="native-map__water native-map__water--one"></view>
        <view class="native-map__water native-map__water--two"></view>
        <view class="native-map__road native-map__road--one"></view>
        <view class="native-map__road native-map__road--two"></view>
        <view class="native-map__road native-map__road--three"></view>
      </view>

      <view class="native-map__overlay">
        <view
          v-for="label in mapLabels"
          :key="label.id"
          :class="['native-map__label', label.className]"
        >
          {{ label.text }}
        </view>

        <view class="native-map__layers">
          <text
            v-for="layer in visibleLayerPills"
            :key="layer"
            class="native-map__layer-pill"
          >
            {{ layer }}
          </text>
        </view>

        <view v-if="!useSystemMap" class="native-map__preview-markers">
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
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { createMapAdapter } from '../adapters/map/createMapAdapter.js';
import { MAP_ADAPTER_TYPES } from '../adapters/map/types.js';

const MARKER_ICON_PATH = '/static/tabBar/index-h.png';
const mapId = 'intelligenceNativeMap';

const props = defineProps({
  enabled: { type: Boolean, default: true },
  src: { type: String, default: '' },
  initialView: { type: Object, default: null },
});

const emit = defineEmits(['ready', 'map-event', 'activate-request']);

const instance = getCurrentInstance();
const mapContext = ref(null);
const renderState = reactive({
  ready: false,
  center: [113.4445, 22.4915],
  zoom: 13,
  layers: [],
  markers: [],
  selectedId: '',
  viewportInset: { bottom: 0 },
  mode: 'native-preview',
  source: 'local-default',
  geojson: null,
});

const useSystemMap = ref(false);
// #ifdef APP-PLUS
useSystemMap.value = true;
// #endif

const visibleLayerPills = computed(() => {
  if (!renderState.layers.length) return ['警情', '场所', '人员'];
  return renderState.layers.slice(0, 4);
});

const viewportBottomPx = computed(() => Math.max(Number(renderState.viewportInset?.bottom || 0), 0));
const mapLongitude = computed(() => Number(renderState.center[0] || 113.4445));
const mapLatitude = computed(() => Number(renderState.center[1] || 22.4915));
const mapScale = computed(() => clampZoom(renderState.zoom));

const activeSceneKey = computed(() => resolveSceneKey(renderState.layers));

const previewScene = computed(() => {
  const sceneMap = {
    alerts: {
      className: 'native-map__preview--alerts',
      labels: [
        { id: 'road-1', text: '桂南路', className: 'native-map__label--one' },
        { id: 'road-2', text: '纠纷高发区', className: 'native-map__label--two' },
        { id: 'road-3', text: '布控网格', className: 'native-map__label--three' },
      ],
    },
    places: {
      className: 'native-map__preview--places',
      labels: [
        { id: 'road-1', text: '龙井坊KTV', className: 'native-map__label--one' },
        { id: 'road-2', text: '重点场所', className: 'native-map__label--two' },
        { id: 'road-3', text: '巡查路线', className: 'native-map__label--three' },
      ],
    },
    people: {
      className: 'native-map__preview--people',
      labels: [
        { id: 'road-1', text: '居住片区', className: 'native-map__label--one' },
        { id: 'road-2', text: '重点人员', className: 'native-map__label--two' },
        { id: 'road-3', text: '走访路线', className: 'native-map__label--three' },
      ],
    },
    handling: {
      className: 'native-map__preview--handling',
      labels: [
        { id: 'road-1', text: '出警路线', className: 'native-map__label--one' },
        { id: 'road-2', text: '警力调度', className: 'native-map__label--two' },
        { id: 'road-3', text: '警情联动', className: 'native-map__label--three' },
      ],
    },
    patrol: {
      className: 'native-map__preview--patrol',
      labels: [
        { id: 'road-1', text: '巡防路线', className: 'native-map__label--one' },
        { id: 'road-2', text: '卡点布控', className: 'native-map__label--two' },
        { id: 'road-3', text: '片区边界', className: 'native-map__label--three' },
      ],
    },
  };

  return sceneMap[activeSceneKey.value] || sceneMap.alerts;
});

const mapLabels = computed(() => previewScene.value.labels);

const nativeMarkerPayload = computed(() => {
  const lookup = {};
  const list = renderState.markers.map((marker, index) => {
    const nativeId = index + 1;
    lookup[nativeId] = marker;
    return {
      id: nativeId,
      longitude: Number(marker.lng),
      latitude: Number(marker.lat),
      iconPath: MARKER_ICON_PATH,
      width: 26,
      height: 26,
      alpha: marker.id === renderState.selectedId ? 1 : 0.9,
      anchor: {
        x: 0.5,
        y: 1,
      },
      callout: {
        content: marker.label || '点位',
        display: 'ALWAYS',
        padding: 6,
        borderRadius: 18,
        fontSize: 12,
        color: '#ffffff',
        bgColor: marker.color || '#1f7cff',
      },
    };
  });
  return {
    list,
    lookup,
  };
});

const nativeMarkers = computed(() => nativeMarkerPayload.value.list);

const nativePolygons = computed(() => toNativePolygons(renderState.geojson));

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

onMounted(async () => {
  adapter.setHost({
    syncState(nextState) {
      if (!nextState || typeof nextState !== 'object') return;
      if (Array.isArray(nextState.center)) renderState.center = nextState.center.slice();
      if (Number.isFinite(Number(nextState.zoom))) renderState.zoom = Number(nextState.zoom);
      if (Array.isArray(nextState.layers)) renderState.layers = nextState.layers.slice();
      if (Array.isArray(nextState.markers)) renderState.markers = nextState.markers.slice();
      if (typeof nextState.selectedId === 'string') renderState.selectedId = nextState.selectedId;
      if (nextState.viewportInset) renderState.viewportInset = { ...renderState.viewportInset, ...nextState.viewportInset };
      if (typeof nextState.ready === 'boolean') renderState.ready = nextState.ready;
      if (nextState.mode) renderState.mode = nextState.mode;
      if (nextState.source) renderState.source = nextState.source;
      if (nextState.geojson !== undefined) renderState.geojson = nextState.geojson;
    },
  });

  adapter.setSource(props.src);
  adapter.init(props.initialView || {});

  if (useSystemMap.value) {
    await nextTick();
    tryCreateMapContext();
  }

  emit('ready', controller);
});

onUnmounted(() => {
  adapter.destroy();
});

function tryCreateMapContext() {
  if (typeof uni.createMapContext !== 'function') return;
  try {
    mapContext.value = uni.createMapContext(mapId, instance?.proxy);
  } catch (error) {
    console.warn('[NativeMapContainer] createMapContext failed', error);
    mapContext.value = null;
  }
}

function handleMapTap(event) {
  const detail = event?.detail || {};
  if (Number.isFinite(Number(detail.longitude)) && Number.isFinite(Number(detail.latitude))) {
    adapter.notifyMapClick({
      lng: Number(detail.longitude),
      lat: Number(detail.latitude),
    });
    return;
  }
  adapter.notifyMapClick({
    lng: renderState.center[0],
    lat: renderState.center[1],
  });
}

function handleMarkerTap(event) {
  const nativeId = Number(event?.detail?.markerId);
  const marker = nativeMarkerPayload.value.lookup[nativeId];
  if (!marker) return;
  adapter.notifyMarkerClick(marker);
}

function handlePreviewMarkerTap(marker) {
  adapter.notifyMarkerClick(marker);
}

function handleRegionChange(event) {
  const stage = event?.type || event?.detail?.type;
  if (stage && stage !== 'end') return;
  syncViewportState();
}

function syncViewportState() {
  if (!mapContext.value) return;

  try {
    if (typeof mapContext.value.getCenterLocation === 'function') {
      mapContext.value.getCenterLocation({
        success(res) {
          if (Number.isFinite(Number(res?.longitude)) && Number.isFinite(Number(res?.latitude))) {
            adapter.setCenter([Number(res.longitude), Number(res.latitude)]);
          }
        },
      });
    }

    if (typeof mapContext.value.getScale === 'function') {
      mapContext.value.getScale({
        success(res) {
          const scale = Number(res?.scale);
          if (Number.isFinite(scale)) {
            adapter.setZoom(scale);
          }
        },
      });
    }
  } catch (error) {
    console.warn('[NativeMapContainer] syncViewportState failed', error);
  }
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

function resolveSceneKey(layers = []) {
  if (layers.includes('places')) return 'places';
  if (layers.includes('pois')) return 'people';
  if (layers.includes('boundaries')) return 'patrol';
  if (layers.includes('shops')) return 'handling';
  return 'alerts';
}

function toNativePolygons(featureCollection) {
  const features = Array.isArray(featureCollection?.features) ? featureCollection.features : [];
  return features
    .map((feature, index) => {
      const geometry = feature?.geometry;
      if (!geometry || !Array.isArray(geometry.coordinates)) return null;

      if (geometry.type === 'Polygon') {
        const points = toPolygonPoints(geometry.coordinates[0]);
        if (!points.length) return null;
        return {
          points,
          strokeWidth: 2,
          strokeColor: '#1f7cff',
          fillColor: 'rgba(31,124,255,0.16)',
          zIndex: 1 + index,
        };
      }

      if (geometry.type === 'MultiPolygon') {
        const firstPolygon = geometry.coordinates[0];
        const points = toPolygonPoints(firstPolygon && firstPolygon[0]);
        if (!points.length) return null;
        return {
          points,
          strokeWidth: 2,
          strokeColor: '#1f7cff',
          fillColor: 'rgba(31,124,255,0.16)',
          zIndex: 1 + index,
        };
      }

      return null;
    })
    .filter(Boolean);
}

function toPolygonPoints(points = []) {
  return points
    .map((point) => ({
      longitude: Number(point?.[0]),
      latitude: Number(point?.[1]),
    }))
    .filter((point) => Number.isFinite(point.longitude) && Number.isFinite(point.latitude));
}
</script>

<style lang="scss" scoped>
.native-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(84, 145, 255, 0.22), transparent 28%),
    linear-gradient(180deg, #eef4f8 0%, #dbe6ef 100%);
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
