<template>
  <view class="key-pickup pageBg">
    <view class="panel">
      <view class="title">请靠近钥匙盒</view>
      <view class="subtitle">将手机背面贴近钥匙盒 NFC 感应区，保持 1-2 秒</view>

      <view class="info-card">
        <view class="info-row">
          <text class="label">车牌</text>
          <text class="value">{{ carInfo?.plateNo || '—' }}</text>
        </view>
        <view class="info-row">
          <text class="label">使用人</text>
          <text class="value">{{ useLog?.user || '—' }}</text>
        </view>
        <view class="info-row">
          <text class="label">用途</text>
          <text class="value">{{ useLog?.purpose || '—' }}</text>
        </view>
        <view class="info-row">
          <text class="label">登记时间</text>
          <text class="value">{{ useLog?.startTime || '—' }}</text>
        </view>
      </view>

      <view class="status-card" :class="`status-${sessionState}`">
        <text class="status-text">{{ statusText }}</text>
        <text v-if="sessionState === 'waiting' || sessionState === 'ready'" class="countdown">
          剩余授权 {{ remainSeconds }}s
        </text>
        <text v-if="errorText" class="error-text">{{ errorText }}</text>
      </view>
    </view>

    <view class="bottom-bar">
      <button class="btn ghost" @click="retrySession">重新开始</button>
      <button class="btn danger" @click="revokeSession">撤销授权</button>
      <button class="btn cancel-use" @click="confirmCancelUse">取消使用</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getCarById, getCarUseLogs, saveCarUseLogs, updateCar } from '@/common/database.js';
import { buildOpenBoxNfcPayload, buildOpenBoxPayload } from '@/utils/nfcPayload.js';
import {
  getHceSessionStatus,
  isHcePluginReady,
  onHceEvent,
  setHcePayload,
  startHceSession,
  stopHceSession,
} from '@/utils/nfcHce.js';

const SESSION_TIMEOUT_SECONDS = 300;
const STOP_HCE_DELAY_MS = 450;

const carId = ref('');
const logId = ref('');
const carInfo = ref(null);
const useLog = ref(null);
const sessionState = ref('idle'); // idle | ready | waiting | success | error
const remainSeconds = ref(SESSION_TIMEOUT_SECONDS);
const errorText = ref('');
let countdownTimer = null;
let finishTimer = null;
let readWatchdogTimer = null;
let debugProbeTimer = null;
let stopSessionTimer = null;
let sawNativeDebugEvent = false;
let eventBound = false;

const statusText = computed(() => {
  // 页面主状态文案统一在此计算，模板层只渲染文本，减少分支散落。
  if (sessionState.value === 'success') return '开箱成功，可取钥匙';
  if (sessionState.value === 'error') return '会话异常，请重试或撤销授权';
  if (sessionState.value === 'ready') return 'NFC 就绪，请靠近钥匙盒';
  if (sessionState.value === 'waiting') return '等待感应中...';
  return '准备启动 NFC 会话...';
});

function loadData() {
  // 读取当前车辆与本次用车登记记录，用于页面展示与授权签名。
  carInfo.value = getCarById(carId.value) || null;
  const logs = getCarUseLogs();
  // 兼容从列表直接“取钥匙”进来只带 carId 的场景：自动回退到当前 OPEN 记录。
  useLog.value = logs.find((item) => item.id === logId.value) || logs.find((item) => item.carId === carId.value && item.status === 'OPEN') || null;
  if (!logId.value && useLog.value?.id) {
    logId.value = useLog.value.id;
  }
}

function stopCountdown() {
  // 统一清理倒计时，避免重复 setInterval 导致秒数异常递减。
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function stopFinishTimer() {
  // 清理成功后的自动返回定时器，避免重复跳转。
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
}

function stopReadWatchdog() {
  // 清理读数看门狗，避免残留定时器导致误报“读取超时”。
  if (readWatchdogTimer) {
    clearTimeout(readWatchdogTimer);
    readWatchdogTimer = null;
  }
}

function stopDebugProbe() {
  if (debugProbeTimer) {
    clearTimeout(debugProbeTimer);
    debugProbeTimer = null;
  }
}

function stopStopSessionTimer() {
  if (stopSessionTimer) {
    clearTimeout(stopSessionTimer);
    stopSessionTimer = null;
  }
}

function startDebugProbe() {
  // 新插件会在 startSession 后主动上报 DEBUG 事件。
  // 若长时间收不到，通常说明运行包仍是旧基座/旧插件。
  stopDebugProbe();
  debugProbeTimer = setTimeout(() => {
    if (!sawNativeDebugEvent && (sessionState.value === 'waiting' || sessionState.value === 'ready')) {
      errorText.value = '未收到插件调试事件，当前很可能是旧基座/旧安装包。请重新打包并重装 App。';
    }
  }, 1500);
}

function startReadWatchdog() {
  // 已收到 SELECT_AID 但迟迟没有 READ/SUCCESS，给出明确诊断提示。
  stopReadWatchdog();
  readWatchdogTimer = setTimeout(() => {
    if (sessionState.value === 'waiting') {
      sessionState.value = 'error';
      errorText.value = '已识别钥匙盒，但未读取到授权数据（READ 超时）。请重试并检查盒子固件。';
    }
  }, 3000);
}

function stopSession() {
  // 主动停止会话：用于用户“撤销授权”或成功后清理状态。
  stopCountdown();
  stopFinishTimer();
  stopReadWatchdog();
  stopDebugProbe();
  stopStopSessionTimer();
  stopHceSession();
}

function handleTimeout() {
  // 会话超时后主动结束 HCE，要求用户重新发起，防止旧会话悬挂。
  sessionState.value = 'error';
  errorText.value = '授权已超时（5分钟），请重新开始。';
  stopSession();
}

function startCountdown(initialSeconds) {
  // 启动会话倒计时：支持用原生剩余时间恢复，避免页面重进后倒计时跳变。
  stopCountdown();
  remainSeconds.value = Math.max(0, Number(initialSeconds) || 0);
  countdownTimer = setInterval(() => {
    remainSeconds.value -= 1;
    if (remainSeconds.value <= 0) {
      stopCountdown();
      handleTimeout();
    }
  }, 1000);
}

function normalizeEventType(evt) {
  // 原生回调可能存在大小写差异，这里统一成大写枚举处理。
  return String((evt && evt.type) || '').toUpperCase();
}

function onNativeEvent(evt) {
  // 处理原生插件事件流：READY -> TAG_READ -> SUCCESS / ERROR。
  const type = normalizeEventType(evt);
  const message = String((evt && evt.message) || '');
  if (type === 'READY') {
    sessionState.value = 'ready';
    errorText.value = '';
    stopReadWatchdog();
    return;
  }
  if (type === 'TAG_READ') {
    // 链路已断开但仍收到 TAG_READ 的场景，直接给出可见错误提示，避免停留“等待感应中”。
    if (message.startsWith('DEACTIVATED_')) {
      sessionState.value = 'error';
      errorText.value = `NFC 链路中断（${message}），请重试。`;
      stopCountdown();
      stopReadWatchdog();
      return;
    }
    sessionState.value = 'waiting';
    if (message === 'SELECT_AID') {
      errorText.value = '已识别钥匙盒，正在读取授权数据...';
      startReadWatchdog();
    } else if (message === 'READ_DATA') {
      errorText.value = '';
      stopReadWatchdog();
    }
    return;
  }
  if (type === 'APDU') {
    sawNativeDebugEvent = true;
    console.log('[HCE APDU]', message);
    return;
  }
  if (type === 'DEBUG') {
    sawNativeDebugEvent = true;
    console.log('[HCE DEBUG]', message);
    return;
  }
  if (type === 'SUCCESS') {
    // 成功后先回写“已取钥匙”到车辆状态，再结束会话。
    applyPickupSuccess((evt && evt.boxTxnId) || `txn-${Date.now()}`);
    return;
  }
  if (type === 'ERROR') {
    sessionState.value = 'error';
    errorText.value = (evt && evt.message) || 'NFC 会话异常，请重试。';
    stopCountdown();
    stopReadWatchdog();
  }
}

function checkEnvironment() {
  // 环境检测分三层：
  // 1) 平台是否 APP-PLUS；
  // 2) 是否 Android；
  // 3) NFC 是否可用 + 插件是否已加载。
  // #ifndef APP-PLUS
  return { ok: false, message: '当前平台不支持 NFC-HCE，请使用 Android App。' };
  // #endif

  // #ifdef APP-PLUS
  if (plus.os.name !== 'Android') {
    return { ok: false, message: '仅 Android 支持钥匙盒 NFC 开箱。' };
  }
  try {
    const main = plus.android.runtimeMainActivity();
    const NfcAdapter = plus.android.importClass('android.nfc.NfcAdapter');
    const adapter = NfcAdapter.getDefaultAdapter(main);
    if (!adapter) return { ok: false, message: '设备不支持 NFC。' };
    if (!adapter.isEnabled()) return { ok: false, message: '请先在系统设置中开启 NFC。' };
  } catch (error) {
    return { ok: false, message: '无法读取 NFC 状态，请检查系统权限。' };
  }
  if (!isHcePluginReady()) {
    // 该提示通常代表当前运行基座未打入本地插件（最常见于默认基座）。
    return { ok: false, message: '未检测到 HCE 模块，请使用已集成 GXA-NfcHce 的自定义基座。' };
  }
  return { ok: true, message: '' };
  // #endif
}

function logPluginDiagnostics() {
  // 运行时插件诊断日志（仅用于排查“是否已打入基座/安装包”）。
  // 判定标准：
  // 1) mod 不为 null；
  // 2) setPayload/startSession/stopSession/onEvent 四个方法都存在。
  // 满足以上两点，说明当前运行包内已包含 GXA-NfcHce 插件。
  // #ifdef APP-PLUS
  try {
    const mod = typeof uni !== 'undefined' && typeof uni.requireNativePlugin === 'function'
      ? uni.requireNativePlugin('GXA-NfcHce')
      : null;
    console.log(
      '[NFC插件检测]',
      !!mod,
      mod && typeof mod.setPayload,
      mod && typeof mod.startSession,
      mod && typeof mod.stopSession,
      mod && typeof mod.onEvent,
    );
  } catch (error) {
    console.log('[NFC插件检测] require 异常', error && error.message ? error.message : error);
  }
  // #endif
}

function bindNativeEvent() {
  // 事件只绑定一次，避免重复进入页面时出现多次回调。
  if (eventBound) return;
  const ok = onHceEvent(onNativeEvent);
  eventBound = ok;
}

function startSessionFlow(forceRestart = false) {
  // 每次发起前先校验设备环境；失败则直接给出错误提示。
  const check = checkEnvironment();
  if (!check.ok) {
    sessionState.value = 'error';
    errorText.value = check.message;
    uni.showToast({ title: check.message, icon: 'none' });
    return;
  }

  if (!carId.value || !logId.value) {
    sessionState.value = 'error';
    errorText.value = '缺少车辆或登记信息，请返回重试。';
    return;
  }

  bindNativeEvent();
  if (!eventBound) {
    sessionState.value = 'error';
    errorText.value = '无法监听 NFC 回调事件。';
    return;
  }

  const status = getHceSessionStatus();
  // 若已有未使用且未超时的会话，直接复用，满足“退出页面/锁屏后台仍可刷”。
  if (!forceRestart && status.active && !status.used && status.remainingSeconds > 0) {
    sessionState.value = 'waiting';
    errorText.value = '';
    startCountdown(status.remainingSeconds);
    return;
  }

  // 会话被读取成功但页面未收到 SUCCESS 事件时，重新进入页面可做状态回写。
  if (!forceRestart && status.active && status.used) {
    applyPickupSuccess(`txn-${Date.now()}`);
    return;
  }

  if (forceRestart) {
    // 手动重试时先彻底撤销旧会话，避免状态脏读。
    stopSession();
  }

  // 先设置 payload，再启动会话；盒子端 READ DATA 读取到该数据后即可开箱。
  const payloadObject = buildOpenBoxPayload({ carId: carId.value, logId: logId.value });
  const payloadOk = setHcePayload(buildOpenBoxNfcPayload(payloadObject));
  if (!payloadOk) {
    sessionState.value = 'error';
    errorText.value = 'HCE 载荷写入失败（可能超长），请重试。';
    return;
  }

  sawNativeDebugEvent = false;
  stopDebugProbe();

  const startOk = startHceSession(SESSION_TIMEOUT_SECONDS);
  if (!startOk) {
    sessionState.value = 'error';
    errorText.value = 'HCE 会话启动失败。';
    return;
  }

  sessionState.value = 'waiting';
  errorText.value = '';
  stopReadWatchdog();
  startDebugProbe();
  startCountdown(SESSION_TIMEOUT_SECONDS);
}

function retrySession() {
  // 用户手动重试：强制重建会话。
  startSessionFlow(true);
}

function revokeSession() {
  // 用户主动撤销授权：立刻失效，后续盒子读取会返回 6985。
  stopSession();
  uni.showToast({ title: '已撤销授权', icon: 'none' });
  backToCarList();
}

function applyPickupSuccess(boxTxnId = '') {
  // 避免原生重复回调导致重复写库/重复返回。
  if (sessionState.value === 'success') return;
  // 成功后写回车辆 usingInfo，控制列表按钮从“取钥匙”切换到“结束用”。
  const currentCar = getCarById(carId.value) || {};
  const now = formatNow();
  const nextUsingInfo = {
    ...(currentCar.usingInfo || {}),
    keyPicked: true,
    keyPickedAt: now,
    boxTxnId: boxTxnId || '',
  };
  updateCar(carId.value, { usingInfo: nextUsingInfo });

  // 同步更新当前 OPEN 日志，保证后续追踪时能看到取钥匙时间与交易号。
  const list = getCarUseLogs();
  const idx = list.findIndex((item) => item.id === logId.value);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      keyPicked: true,
      keyPickedAt: now,
      boxTxnId: boxTxnId || '',
    };
    saveCarUseLogs(list);
  }

  sessionState.value = 'success';
  errorText.value = '';
  stopCountdown();
  stopReadWatchdog();
  uni.showToast({ title: '取钥匙成功', icon: 'success' });
  // 成功后延迟 stop，给钥匙盒侧留出完整接收 READ 响应的时间窗口。
  stopStopSessionTimer();
  stopSessionTimer = setTimeout(() => {
    stopHceSession();
    stopSessionTimer = null;
  }, STOP_HCE_DELAY_MS);
  stopFinishTimer();
  finishTimer = setTimeout(() => {
    backToCarList();
  }, 1000);
}

function confirmCancelUse() {
  // 取消使用属于“登记后未实际用车”的撤销路径，需二次确认防误触。
  uni.showModal({
    title: '确认取消使用？',
    content: '将撤销本次用车登记并释放车辆，是否继续？',
    confirmText: '继续',
    cancelText: '返回',
    success: (res) => {
      if (res.confirm) cancelUseAndRelease();
    },
  });
}

function cancelUseAndRelease() {
  // 第一步：立即停止 HCE 会话，确保钥匙盒后续无法继续读取授权。
  stopSession();

  // 第二步：释放车辆占用，恢复空闲状态。
  // 说明：取消使用不等于结束用车，不回填结束里程，仅清理 usingInfo。
  const currentCar = getCarById(carId.value) || {};
  updateCar(carId.value, {
    status: 'idle',
    currentMileage: currentCar.currentMileage ?? currentCar.currentOdo ?? currentCar.mileage ?? 0,
    usingInfo: null,
  });

  // 第三步：将对应日志标记为 canceled，保留审计链路，不做物理删除。
  const list = getCarUseLogs();
  const targetIndex = list.findIndex((item) => item.id === logId.value);
  const fallbackIndex = targetIndex >= 0
    ? targetIndex
    : list.findIndex((item) => item.carId === carId.value && String(item.status || '').toUpperCase() === 'OPEN');
  if (fallbackIndex >= 0) {
    list[fallbackIndex] = {
      ...list[fallbackIndex],
      status: 'CANCELED',
      canceledAt: formatNow(),
      cancelReason: 'user_cancel_before_pickup',
    };
    saveCarUseLogs(list);
  }

  uni.showToast({ title: '已取消使用，车辆已释放', icon: 'success' });
  setTimeout(() => backToCarList(), 350);
}

function backToCarList() {
  // 统一返回到警车调度页：按页面栈查找最近 car/list，避免落在 usecar/detail 中间页。
  const pages = getCurrentPages();
  const listIndex = pages.map((p) => p.route).lastIndexOf('pages/car/list');
  if (listIndex >= 0) {
    const delta = pages.length - listIndex - 1;
    uni.navigateBack({ delta: delta > 0 ? delta : 1 });
    return;
  }
  // 兜底：若栈内不存在列表页，则直接跳转列表，避免用户停留在中间页。
  uni.reLaunch({ url: '/pages/car/list' });
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onLoad((query) => {
  // 入口参数由 usecar.vue 或列表“取钥匙”按钮传入。
  carId.value = query.carId || '';
  logId.value = query.logId || '';
  // 页面加载即输出一次插件诊断信息，便于在真机控制台快速确认是否已集成插件。
  logPluginDiagnostics();
  loadData();
  startSessionFlow(false);
});

onUnload(() => {
  // 页面销毁时仅清理前端定时器，不主动 stop 原生会话。
  // 这样可满足“退出页面/锁屏后，5 分钟内仍可刷盒子”的业务要求。
  stopCountdown();
  stopFinishTimer();
  stopReadWatchdog();
  stopDebugProbe();
});
</script>

<style lang="scss" scoped>
.key-pickup {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24rpx;
  padding-bottom: 180rpx;
}

.panel {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(18, 38, 63, 0.08);
}

.title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.subtitle {
  margin-top: 8rpx;
  color: #6e7a89;
  font-size: 25rpx;
}

.info-card {
  margin-top: 20rpx;
  background: #f6f8fb;
  border-radius: 14rpx;
  padding: 16rpx;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #5f6b7a;
  font-size: 26rpx;
  flex: 0 0 auto;
}

.value {
  flex: 1;
  min-width: 0;
  text-align: right;
  color: #1f2b3a;
  font-size: 26rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-card {
  margin-top: 18rpx;
  border-radius: 14rpx;
  padding: 20rpx;
  background: #f2f7ff;
  border: 2rpx solid #d6e6ff;
}

.status-ready,
.status-waiting {
  background: #f2f7ff;
  border-color: #d6e6ff;
}

.status-success {
  background: #edf9ef;
  border-color: #bde8c5;
}

.status-error {
  background: #fff2f2;
  border-color: #ffd2d2;
}

.status-text {
  color: #1f2b3a;
  font-size: 30rpx;
  font-weight: 600;
}

.countdown {
  margin-top: 8rpx;
  display: block;
  color: #2575ff;
  font-size: 24rpx;
}

.error-text {
  margin-top: 8rpx;
  display: block;
  color: #d93025;
  font-size: 24rpx;
  line-height: 1.5;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 12rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -8rpx 24rpx rgba(18, 38, 63, 0.08);
}

.btn {
  flex: 1;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.ghost {
  background: #eef2f7;
  color: #34435a;
}

.danger {
  background: #ffeded;
  color: #d93025;
}

.cancel-use {
  // 取消使用按钮使用浅红描边，和“撤销授权”区分但保持警示语义。
  background: #fff;
  color: #c0392b;
  border: 1px solid #f3b5ae;
}
</style>
