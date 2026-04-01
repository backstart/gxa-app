<template>
  <view class="native-map">
    <view v-if="enabled" ref="surfaceRef" class="native-map__surface" @tap="handleSurfaceTap">
      <view class="native-map__grid"></view>
      <view class="native-map__water native-map__water--one"></view>
      <view class="native-map__water native-map__water--two"></view>
      <view class="native-map__road native-map__road--one"></view>
      <view class="native-map__road native-map__road--two"></view>
      <view class="native-map__road native-map__road--three"></view>

      <view
        v-for="label in mapLabels"
        :key="label.id"
        :class="['native-map__label', label.className]"
      >
        {{ label.text }}
      </view>

      <view
        v-for="marker in renderMarkers"
        :key="marker.id"
        class="native-map__marker"
        :class="marker.id === renderState.selectedId ? 'active' : ''"
        :style="{ left: marker.left, top: marker.top }"
        @tap.stop="handleMarkerTap(marker)"
      >
        <view class="native-map__marker-dot" :style="{ backgroundColor: marker.color }"></view>
        <text class="native-map__marker-label">{{ marker.label }}</text>
      </view>

      <view class="native-map__head">
        <text class="native-map__title">NativeMapAdapter</text>
        <text class="native-map__meta">中心 {{ renderCenterText }} · Z{{ renderZoomText }}</text>
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

      <view class="native-map__bottom-shade" :style="{ height: `${viewportBottomPx}px` }"></view>
    </view>

    <view v-else class="native-map__placeholder">
      <view class="native-map__placeholder-card">
        <text class="native-map__placeholder-title">地图已暂停加载</text>
        <text class="native-map__placeholder-desc">当前地图承载层已抽象为原生优先模式，可在需要时手动恢复。</text>
        <view class="native-map__placeholder-btn" @tap="emit('activate-request')">
          <text class="native-map__placeholder-btn-text">点击加载地图</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { createMapAdapter } from '../adapters/map/createMapAdapter.js';
import { MAP_ADAPTER_TYPES } from '../adapters/map/types.js';

const props = defineProps({
  enabled: { type: Boolean, default: true },
  src: { type: String, default: '' },
});

const emit = defineEmits(['ready', 'map-event', 'activate-request']);

const surfaceRef = ref(null);
const renderState = reactive({
  ready: false,
  center: [113.4445, 22.4915],
  zoom: 12,
  layers: [],
  markers: [],
  selectedId: '',
  viewportInset: { bottom: 0 },
  mode: 'native-preview',
});

const mapLabels = [
  { id: 'road-1', text: '桂南路', className: 'native-map__label--one' },
  { id: 'road-2', text: '福耀片区', className: 'native-map__label--two' },
  { id: 'road-3', text: '龙井路', className: 'native-map__label--three' },
];

const visibleLayerPills = computed(() => {
  if (!renderState.layers.length) return ['警情', '场所', '人员'];
  return renderState.layers.slice(0, 3);
});

const renderCenterText = computed(
  () => `${renderState.center[0].toFixed(4)}, ${renderState.center[1].toFixed(4)}`
);
const renderZoomText = computed(() => Number(renderState.zoom || 0).toFixed(1));
const viewportBottomPx = computed(() => Math.max(Number(renderState.viewportInset?.bottom || 0), 0));

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

onMounted(() => {
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
    },
  });
  adapter.setSource(props.src);
  adapter.init();
  emit('ready', controller);
});

onUnmounted(() => {
  adapter.destroy();
});

function handleSurfaceTap(event) {
  const touch = event.changedTouches && event.changedTouches[0];
  const system = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
  const width = Number(system.windowWidth || 375);
  const height = Number(system.windowHeight || 780);
  const x = Number(touch?.clientX ?? touch?.x ?? width / 2);
  const y = Number(touch?.clientY ?? touch?.y ?? height / 2);
  const relativeX = x / width - 0.5;
  const relativeY = y / height - 0.5;
  const lng = Number((renderState.center[0] + relativeX * 0.06).toFixed(6));
  const lat = Number((renderState.center[1] - relativeY * 0.04).toFixed(6));
  adapter.notifyMapClick({ lng, lat });
}

function handleMarkerTap(marker) {
  adapter.notifyMarkerClick(marker);
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

.native-map__surface {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(110, 186, 133, 0.18), transparent 22%),
    radial-gradient(circle at 84% 18%, rgba(66, 153, 225, 0.14), transparent 20%),
    linear-gradient(180deg, #eef3eb 0%, #dce6ef 100%);
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

.native-map__head {
  position: absolute;
  left: 24rpx;
  top: 24rpx;
  z-index: 9;
  display: grid;
  gap: 6rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16rpx 28rpx rgba(17, 39, 57, 0.1);
}

.native-map__title {
  color: #1f3346;
  font-size: 26rpx;
  font-weight: 700;
}

.native-map__meta {
  color: #5f7386;
  font-size: 20rpx;
}

.native-map__layers {
  position: absolute;
  right: 24rpx;
  top: 30rpx;
  z-index: 9;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10rpx;
  max-width: 320rpx;
}

.native-map__layer-pill {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(15, 31, 46, 0.68);
  color: #f7fbff;
  font-size: 20rpx;
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
