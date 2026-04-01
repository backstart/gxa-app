<template>
  <view class="map-host">
    <NativeMapContainer
      v-if="resolvedAdapterType === MAP_ADAPTER_TYPES.NATIVE"
      :enabled="enabled"
      :src="src"
      :initial-view="initialView"
      @ready="emit('ready', $event)"
      @map-event="emit('map-event', $event)"
      @activate-request="emit('activate-request')"
    />
    <WebViewMapContainer
      v-else
      :enabled="enabled"
      :src="src"
      :initial-view="initialView"
      @ready="emit('ready', $event)"
      @map-event="emit('map-event', $event)"
      @activate-request="emit('activate-request')"
    />
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { MAP_ADAPTER_TYPES } from '../adapters/map/types.js';
import NativeMapContainer from './NativeMapContainer.vue';
import WebViewMapContainer from './WebViewMapContainer.vue';

const props = defineProps({
  src: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  adapterType: { type: String, default: MAP_ADAPTER_TYPES.NATIVE },
  initialView: { type: Object, default: null },
});

const emit = defineEmits(['ready', 'map-event', 'activate-request']);

const resolvedAdapterType = computed(() =>
  props.adapterType === MAP_ADAPTER_TYPES.WEBVIEW ? MAP_ADAPTER_TYPES.WEBVIEW : MAP_ADAPTER_TYPES.NATIVE
);
</script>

<style lang="scss" scoped>
.map-host {
  width: 100%;
  height: 100%;
}
</style>
