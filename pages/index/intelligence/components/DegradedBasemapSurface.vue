<template>
  <view class="degraded-surface">
    <web-view
      v-if="enabled && activeSrc"
      class="degraded-surface__webview"
      :src="activeSrc"
      @message="handleMessage"
      @load="handleLoad"
      @error="handleError"
    />
    <view v-if="showLoading" class="degraded-surface__loading">
      <view class="degraded-surface__loading-dot"></view>
      <text class="degraded-surface__loading-text">降级底图加载中</text>
    </view>
    <view v-else-if="showFailed" class="degraded-surface__failed">
      <text class="degraded-surface__failed-text">降级底图加载失败</text>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { buildDegradedBasemapSrc, DEFAULT_MAP_VIEW } from '../services/mapEmbed.js';

const VISIBLE_CONFIRM_TIMEOUT_MS = 4500;
const READY_TIMEOUT_MS = 30000;

const props = defineProps({
  enabled: { type: Boolean, default: true },
  center: { type: Array, default: () => DEFAULT_MAP_VIEW.center.slice() },
  zoom: { type: Number, default: DEFAULT_MAP_VIEW.zoom },
  layers: { type: Array, default: () => DEFAULT_MAP_VIEW.layers.slice() },
  basemap: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['status']);

const activeSrc = ref('');
const phase = ref('idle');
const basemapSignature = ref('');
const activeAttemptId = ref(0);
const currentAttemptActivity = ref(false);
let readyTimer = null;
let visibleConfirmTimer = null;

const showLoading = computed(() => phase.value === 'loading');
const showFailed = computed(() => phase.value === 'failed');

watch(
  () => props.enabled,
  (enabled) => {
    if (!enabled) {
      clearReadyTimer();
      activeSrc.value = '';
      phase.value = 'idle';
      basemapSignature.value = '';
      currentAttemptActivity.value = false;
      emitStatus();
      return;
    }
    ensureSurface();
  },
  { immediate: true }
);

watch(
  () => ({
    sourceType: String(props.basemap?.sourceType || ''),
    styleUrl: String(props.basemap?.styleUrl || ''),
    tilesUrl: String(props.basemap?.tilesUrl || ''),
    nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
  }),
  () => {
    ensureSurface();
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  ensureSurface();
});

onUnmounted(() => {
  clearReadyTimer();
});

function ensureSurface() {
  if (!props.enabled) return;
  const styleUrl = String(props.basemap?.styleUrl || '').trim();
  const tilesUrl = String(props.basemap?.tilesUrl || '').trim();
  const sourceType = String(props.basemap?.sourceType || '').trim();
  if (!styleUrl || !tilesUrl) {
    clearReadyTimer();
    phase.value = 'failed';
    activeSrc.value = '';
    currentAttemptActivity.value = false;
    logFailed({
      reason: 'missing-style-or-tiles',
      sourceType,
      styleUrl,
      tilesUrl,
      nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || '').trim(),
    });
    emitStatus();
    return;
  }

  const nextSignature = `${sourceType}|${styleUrl}|${tilesUrl}|${String(props.basemap?.nativeTileUrlTemplate || '').trim()}`;
  if (nextSignature === basemapSignature.value && activeSrc.value) {
    return;
  }
  basemapSignature.value = nextSignature;
  activeAttemptId.value += 1;
  currentAttemptActivity.value = false;
  const src = buildDegradedBasemapSrc({
    center: Array.isArray(props.center) && props.center.length >= 2 ? props.center.slice() : DEFAULT_MAP_VIEW.center.slice(),
    zoom: Number.isFinite(Number(props.zoom)) ? Number(props.zoom) : DEFAULT_MAP_VIEW.zoom,
    layers: Array.isArray(props.layers) ? props.layers.slice() : DEFAULT_MAP_VIEW.layers.slice(),
    basemap: {
      sourceType,
      styleUrl,
      tilesUrl,
      nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || '').trim(),
    },
  });
  activeSrc.value = src;
  phase.value = 'loading';
  logLoading({
    sourceType,
    styleUrl,
    tilesUrl,
    nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || '').trim(),
    src,
    attemptId: activeAttemptId.value,
  });
  console.info('[map-surface]', {
    path: 'degraded-src-built',
    phase: phase.value,
    sourceType,
    styleUrl,
    tilesUrl,
    nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || '').trim(),
    src,
  });
  emitStatus();
  startLifecycleTimers(activeAttemptId.value);
}

function handleMessage(event) {
  const list = Array.isArray(event?.detail?.data) ? event.detail.data : [event?.detail?.data];
  for (let i = 0; i < list.length; i += 1) {
    const message = normalizeMessage(list[i]?.data ?? list[i]);
    if (!message) continue;
    if (String(message?.source || '') !== 'degraded-basemap') continue;
    markAttemptActivity();
    if (String(message?.type || '').toLowerCase() === 'status') {
      promoteToVisibleUnconfirmed('status-message');
      console.info('[map-surface]', {
        path: 'degraded-status',
        phase: phase.value,
        src: activeSrc.value,
        sourceType: String(props.basemap?.sourceType || ''),
        styleUrl: String(props.basemap?.styleUrl || ''),
        tilesUrl: String(props.basemap?.tilesUrl || ''),
        nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
        payload: message?.payload || {},
      });
      continue;
    }
    if (isReadyMessage(message)) {
      clearReadyTimer();
      phase.value = 'ready';
      console.info('[map-surface]', {
        path: 'degraded-ready',
        phase: phase.value,
        src: activeSrc.value,
        sourceType: String(props.basemap?.sourceType || ''),
        styleUrl: String(props.basemap?.styleUrl || ''),
        tilesUrl: String(props.basemap?.tilesUrl || ''),
        nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
        payload: message?.payload || {},
      });
      emitStatus();
      return;
    }
    if (isErrorMessage(message)) {
      clearReadyTimer();
      phase.value = 'failed';
      logFailed({
        sourceType: String(props.basemap?.sourceType || ''),
        styleUrl: String(props.basemap?.styleUrl || ''),
        tilesUrl: String(props.basemap?.tilesUrl || ''),
        nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
        payload: message?.payload || {},
        src: activeSrc.value,
      });
      emitStatus(message?.message || message?.type || 'degraded-map-error');
      return;
    }
  }
}

function handleLoad() {
  markAttemptActivity();
  promoteToVisibleUnconfirmed('webview-load');
}

function handleError(errorEvent) {
  clearReadyTimer();
  phase.value = 'failed';
  logFailed({
    sourceType: String(props.basemap?.sourceType || ''),
    styleUrl: String(props.basemap?.styleUrl || ''),
    tilesUrl: String(props.basemap?.tilesUrl || ''),
    nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
    reason: 'webview-error',
    payload: errorEvent?.detail || errorEvent || {},
    src: activeSrc.value,
  });
  emitStatus('degraded-webview-error');
}

function normalizeMessage(message) {
  if (!message) return null;
  if (typeof message === 'string') {
    try {
      return JSON.parse(message);
    } catch (error) {
      return { type: message };
    }
  }
  if (typeof message !== 'object') return null;
  return message;
}

function isReadyMessage(message) {
  const source = String(message?.source || '').toLowerCase();
  const type = String(message?.type || '').toLowerCase();
  return source === 'degraded-basemap' && type === 'ready';
}

function isErrorMessage(message) {
  const source = String(message?.source || '').toLowerCase();
  const type = String(message?.type || '').toLowerCase();
  return source === 'degraded-basemap' && type === 'error';
}

function startLifecycleTimers(attemptId) {
  clearReadyTimer();
  visibleConfirmTimer = setTimeout(() => {
    if (attemptId !== activeAttemptId.value) return;
    if (phase.value !== 'loading') return;
    promoteToVisibleUnconfirmed('visible-confirm-timeout');
  }, VISIBLE_CONFIRM_TIMEOUT_MS);

  readyTimer = setTimeout(() => {
    if (attemptId !== activeAttemptId.value) return;
    if (phase.value !== 'loading') return;
    if (currentAttemptActivity.value) {
      promoteToVisibleUnconfirmed('ready-timeout-with-activity');
      return;
    }
    phase.value = 'failed';
    logFailed({
      sourceType: String(props.basemap?.sourceType || ''),
      styleUrl: String(props.basemap?.styleUrl || ''),
      tilesUrl: String(props.basemap?.tilesUrl || ''),
      nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
      reason: 'degraded-no-response-timeout',
      src: activeSrc.value,
    });
    emitStatus('degraded-no-response-timeout');
  }, READY_TIMEOUT_MS);
}

function clearReadyTimer() {
  if (visibleConfirmTimer) {
    clearTimeout(visibleConfirmTimer);
    visibleConfirmTimer = null;
  }
  if (!readyTimer) return;
  clearTimeout(readyTimer);
  readyTimer = null;
}

function markAttemptActivity() {
  currentAttemptActivity.value = true;
}

function promoteToVisibleUnconfirmed(reason = '') {
  if (phase.value !== 'loading') return;
  phase.value = 'visible-unconfirmed';
  logVisibleUnconfirmed(reason);
  emitStatus(reason || 'visible-unconfirmed');
}

function logLoading(payload = {}) {
  console.info('[map-surface]', {
    path: 'degraded-loading',
    phase: phase.value,
    ...payload,
  });
}

function logVisibleUnconfirmed(reason = '') {
  console.info('[map-surface]', {
    path: 'degraded-visible-unconfirmed',
    phase: phase.value,
    src: activeSrc.value,
    reason: String(reason || ''),
    sourceType: String(props.basemap?.sourceType || ''),
    styleUrl: String(props.basemap?.styleUrl || ''),
    tilesUrl: String(props.basemap?.tilesUrl || ''),
    nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
  });
}

function logFailed(payload = {}) {
  console.error('[map-surface]', {
    path: 'degraded-failed',
    phase: phase.value,
    ...payload,
  });
}

function emitStatus(reason = '') {
  emit('status', {
    phase: phase.value,
    reason: String(reason || ''),
    src: activeSrc.value,
    sourceType: String(props.basemap?.sourceType || ''),
    styleUrl: String(props.basemap?.styleUrl || ''),
    tilesUrl: String(props.basemap?.tilesUrl || ''),
    nativeTileUrlTemplate: String(props.basemap?.nativeTileUrlTemplate || ''),
    attemptId: activeAttemptId.value,
  });
}
</script>

<style lang="scss" scoped>
.degraded-surface {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.degraded-surface__webview {
  width: 100%;
  height: 100%;
}

.degraded-surface__loading,
.degraded-surface__failed {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  pointer-events: none;
}

.degraded-surface__loading-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 999rpx;
  background: #2e7df6;
  box-shadow: 0 0 0 8rpx rgba(46, 125, 246, 0.12);
}

.degraded-surface__loading-text,
.degraded-surface__failed-text {
  font-size: 22rpx;
  color: #5f7285;
}
</style>
