<template>
  <view class="map-container">
    <web-view
      ref="webviewRef"
      class="map-webview"
      :src="src"
      @message="handleMessage"
    />
  </view>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { createMapAdapter } from '../adapters/map/createMapAdapter.js';
import { MAP_ADAPTER_TYPES } from '../adapters/map/types.js';

const props = defineProps({
  src: { type: String, required: true },
  adapterType: { type: String, default: MAP_ADAPTER_TYPES.WEBVIEW },
});

const emit = defineEmits(['ready', 'map-event']);

const webviewRef = ref(null);

const adapter = createMapAdapter(props.adapterType, {
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

function handleMessage(event) {
  adapter.handleMessageEvent(event);
}

watch(
  () => props.src,
  (nextSrc) => {
    adapter.setSource(nextSrc);
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
  emit('ready', controller);
});

onUnmounted(() => {
  adapter.destroy();
});

defineExpose(controller);
</script>

<style lang="scss" scoped>
.map-container,
.map-webview {
  width: 100%;
  height: 100%;
}
</style>
