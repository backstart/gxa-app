<template>
  <view class="map-lab-page">
    <view class="map-lab-header" :style="{ paddingTop: `${safeTop + 8}px` }">
      <view class="map-lab-header__row">
        <view class="map-lab-header__back" @tap="goBack">
          <text class="map-lab-header__back-text">返回</text>
        </view>
        <view class="map-lab-header__title-wrap">
          <text class="map-lab-header__title">地图实验页</text>
          <text class="map-lab-header__sub">逐步验证 web-view 承载链路</text>
        </view>
      </view>
    </view>

    <view class="map-lab-stage">
      <web-view
        v-if="webviewVisible"
        id="mapLabWebview"
        class="map-lab-stage__webview"
        :src="activeSrc"
        @message="handleMessage"
      />
      <view v-else class="map-lab-stage__placeholder">
        <text class="map-lab-stage__placeholder-title">地图实验尚未开始</text>
        <text class="map-lab-stage__placeholder-desc">先选择一种承载方式，再点击“加载实验”。</text>
      </view>
    </view>

    <scroll-view class="map-lab-panel" scroll-y>
      <view class="map-lab-section">
        <text class="map-lab-section__title">实验模式</text>
        <view class="map-lab-mode-list">
          <view
            v-for="mode in modes"
            :key="mode.key"
            :class="['map-lab-mode', selectedMode === mode.key ? 'map-lab-mode--active' : '']"
            @tap="selectMode(mode.key)"
          >
            <text class="map-lab-mode__title">{{ mode.label }}</text>
            <text class="map-lab-mode__desc">{{ mode.desc }}</text>
          </view>
        </view>
      </view>

      <view class="map-lab-actions">
        <view class="map-lab-action map-lab-action--primary" @tap="loadSelectedMode">
          <text class="map-lab-action__text">加载实验</text>
        </view>
        <view class="map-lab-action" @tap="unloadWebview">
          <text class="map-lab-action__text map-lab-action__text--muted">卸载 web-view</text>
        </view>
      </view>

      <view class="map-lab-section">
        <text class="map-lab-section__title">当前状态</text>
        <view class="map-lab-card">
          <view class="map-lab-kv">
            <text class="map-lab-kv__label">当前模式</text>
            <text class="map-lab-kv__value">{{ currentMode.label }}</text>
          </view>
          <view class="map-lab-kv">
            <text class="map-lab-kv__label">加载状态</text>
            <text class="map-lab-kv__value">{{ statusText }}</text>
          </view>
          <view class="map-lab-kv">
            <text class="map-lab-kv__label">目标地址</text>
            <text class="map-lab-kv__value map-lab-kv__value--mono">{{ activeSrc || '--' }}</text>
          </view>
        </view>
      </view>

      <view class="map-lab-section">
        <text class="map-lab-section__title">事件日志</text>
        <view class="map-lab-card">
          <view v-if="!logs.length" class="map-lab-empty">
            <text class="map-lab-empty__text">当前还没有收到事件。</text>
          </view>
          <view v-for="item in logs" :key="item.id" class="map-lab-log">
            <text class="map-lab-log__time">{{ item.time }}</text>
            <text class="map-lab-log__text">{{ item.text }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';

const REMOTE_EMBED_LITE_URL = 'http://159.75.54.99:8002/embed/map?readonly=1&debug=1&lite=1';
const REMOTE_EMBED_URL = 'http://159.75.54.99:8002/embed/map?readonly=1&debug=1&kernel=1';
const LOCAL_BLANK_URL = '/static/map/lab-blank.html';
const LOCAL_BRIDGE_URL = '/static/map/fuyaomap-bridge.html?debugFallback=1&showHud=1';

const safeTop = ref(getStatusBarHeight() || 0);
const selectedMode = ref('blank');
const activeSrc = ref('');
const webviewVisible = ref(false);
const statusText = ref('未加载');
const logs = ref([]);
let logSeed = 0;

const modes = [
  {
    key: 'blank',
    label: '本地空白页',
    desc: '只验证最轻量 web-view 是否稳定。',
    src: LOCAL_BLANK_URL,
  },
  {
    key: 'bridge',
    label: '本地桥接页',
    desc: '验证本地静态 bridge 壳是否稳定。',
    src: LOCAL_BRIDGE_URL,
  },
  {
    key: 'remote-lite',
    label: '远程轻量页',
    desc: '加载远程嵌入页，但跳过地图内核初始化。',
    src: REMOTE_EMBED_LITE_URL,
  },
  {
    key: 'remote',
    label: '远程地图内核',
    desc: '直接验证 /embed/map 的地图内核是否会触发问题。',
    src: REMOTE_EMBED_URL,
  },
];

const currentMode = computed(
  () => modes.find((item) => item.key === selectedMode.value) || modes[0]
);

onLoad(() => {
  appendLog('实验页已打开，请手动选择模式并加载。');
});

onUnload(() => {
  unloadWebview();
});

function goBack() {
  uni.navigateBack();
}

function selectMode(modeKey) {
  selectedMode.value = modeKey;
  statusText.value = `已选择 ${currentMode.value.label}`;
  appendLog(`切换到模式：${currentMode.value.label}`);
}

function loadSelectedMode() {
  const mode = currentMode.value;
  unloadWebview(false);
  activeSrc.value = mode.src;
  webviewVisible.value = true;
  statusText.value = `正在加载 ${mode.label}`;
  appendLog(`开始加载：${mode.src}`);
}

function unloadWebview(append = true) {
  webviewVisible.value = false;
  activeSrc.value = '';
  statusText.value = '未加载';
  if (append) {
    appendLog('已卸载当前 web-view。');
  }
}

function handleMessage(event) {
  const list = Array.isArray(event?.detail?.data) ? event.detail.data : [event?.detail?.data];
  if (!list.length) {
    appendLog('收到空消息。');
    return;
  }

  list.forEach((raw) => {
    const message = raw?.data ?? raw;
    const type = message?.type || message?.event || 'unknown';
    statusText.value = `已收到事件 ${type}`;
    appendLog(`收到事件 ${type}: ${safeStringify(message)}`);
  });
}

function appendLog(text) {
  logSeed += 1;
  const now = new Date();
  const item = {
    id: `${Date.now()}-${logSeed}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    text,
  };
  logs.value = [item, ...logs.value].slice(0, 20);
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '[unserializable]';
  }
}
</script>

<style lang="scss" scoped>
.map-lab-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(72, 131, 255, 0.15), transparent 26%),
    linear-gradient(180deg, #edf4fb 0%, #e4edf6 100%);
}

.map-lab-header {
  padding-left: 24rpx;
  padding-right: 24rpx;
}

.map-lab-header__row {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.map-lab-header__back {
  min-width: 112rpx;
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 31, 46, 0.68);
  box-shadow: 0 12rpx 28rpx rgba(12, 28, 45, 0.18);
}

.map-lab-header__back-text {
  color: #f7fbff;
  font-size: 24rpx;
  font-weight: 700;
}

.map-lab-header__title-wrap {
  display: grid;
  gap: 4rpx;
}

.map-lab-header__title {
  color: #203243;
  font-size: 34rpx;
  font-weight: 700;
}

.map-lab-header__sub {
  color: #607588;
  font-size: 22rpx;
}

.map-lab-stage {
  margin: 20rpx 24rpx 0;
  height: 520rpx;
  overflow: hidden;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 24rpx 46rpx rgba(19, 43, 66, 0.08);
}

.map-lab-stage__webview {
  width: 100%;
  height: 100%;
}

.map-lab-stage__placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 36rpx;
  text-align: center;
}

.map-lab-stage__placeholder-title {
  color: #203243;
  font-size: 32rpx;
  font-weight: 700;
}

.map-lab-stage__placeholder-desc {
  color: #64788a;
  font-size: 24rpx;
  line-height: 1.7;
}

.map-lab-panel {
  height: calc(100vh - 620rpx);
  margin-top: 18rpx;
  padding: 0 24rpx 36rpx;
}

.map-lab-section {
  margin-top: 18rpx;
}

.map-lab-section__title {
  display: block;
  margin-bottom: 14rpx;
  color: #203243;
  font-size: 28rpx;
  font-weight: 700;
}

.map-lab-mode-list {
  display: grid;
  gap: 14rpx;
}

.map-lab-mode {
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14rpx 30rpx rgba(19, 43, 66, 0.07);
}

.map-lab-mode--active {
  background: linear-gradient(135deg, rgba(31, 124, 255, 0.16), rgba(255, 255, 255, 0.94));
  box-shadow: 0 18rpx 34rpx rgba(31, 124, 255, 0.12);
}

.map-lab-mode__title {
  display: block;
  color: #203243;
  font-size: 28rpx;
  font-weight: 700;
}

.map-lab-mode__desc {
  display: block;
  margin-top: 8rpx;
  color: #64788a;
  font-size: 23rpx;
  line-height: 1.6;
}

.map-lab-actions {
  margin-top: 18rpx;
  display: flex;
  gap: 16rpx;
}

.map-lab-action {
  flex: 1;
  min-height: 84rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 14rpx 30rpx rgba(19, 43, 66, 0.07);
}

.map-lab-action--primary {
  background: #1f7cff;
  box-shadow: 0 18rpx 34rpx rgba(31, 124, 255, 0.24);
}

.map-lab-action__text {
  color: #f7fbff;
  font-size: 26rpx;
  font-weight: 700;
}

.map-lab-action__text--muted {
  color: #44596c;
}

.map-lab-card {
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14rpx 30rpx rgba(19, 43, 66, 0.07);
}

.map-lab-kv + .map-lab-kv {
  margin-top: 14rpx;
}

.map-lab-kv__label {
  display: block;
  color: #64788a;
  font-size: 22rpx;
}

.map-lab-kv__value {
  display: block;
  margin-top: 6rpx;
  color: #203243;
  font-size: 26rpx;
  line-height: 1.6;
  word-break: break-all;
}

.map-lab-kv__value--mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 22rpx;
}

.map-lab-empty__text {
  color: #64788a;
  font-size: 24rpx;
}

.map-lab-log + .map-lab-log {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1px solid rgba(120, 145, 166, 0.14);
}

.map-lab-log__time {
  display: block;
  color: #7b8fa1;
  font-size: 21rpx;
}

.map-lab-log__text {
  display: block;
  margin-top: 6rpx;
  color: #203243;
  font-size: 24rpx;
  line-height: 1.6;
  word-break: break-all;
}
</style>
