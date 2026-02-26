// HCE 原生模块 JS 封装。
// 说明：统一处理插件可用性、事件格式与异常兜底，页面侧只关心业务事件。

let nativeModule = null;

function getNativeModule() {
  // 单例缓存：避免每次调用都重复 requireNativePlugin。
  if (nativeModule !== null) return nativeModule;
  try {
    // 仅 APP-PLUS 环境支持原生插件。
    nativeModule = (typeof uni !== 'undefined' && typeof uni.requireNativePlugin === 'function')
      ? uni.requireNativePlugin('GXA-NfcHce')
      : null;
  } catch (error) {
    nativeModule = null;
  }
  return nativeModule;
}

export function isHcePluginReady() {
  // 供业务页快速判断“插件是否可用”。
  return !!getNativeModule();
}

export function setHcePayload(payload) {
  // 写入本次会话 payload，HCE Service 收到 READ APDU 时会返回该数据。
  const mod = getNativeModule();
  if (!mod || typeof mod.setPayload !== 'function') return false;
  mod.setPayload(String(payload || ''));
  return true;
}

export function startHceSession(timeoutSeconds = 300) {
  // 启动会话计时（默认 300 秒），超时后原生侧会判定失效并拒绝读取。
  const mod = getNativeModule();
  if (!mod || typeof mod.startSession !== 'function') return false;
  mod.startSession(Number(timeoutSeconds) || 300);
  return true;
}

export function stopHceSession() {
  // 主动停止会话，通常在用户取消或页面离开时调用。
  const mod = getNativeModule();
  if (!mod || typeof mod.stopSession !== 'function') return false;
  mod.stopSession();
  return true;
}

export function getHceSessionStatus() {
  // 读取原生会话状态：用于“页面退出后仍可刷”的状态恢复展示。
  const mod = getNativeModule();
  if (!mod || typeof mod.getSessionStatus !== 'function') {
    return { active: false, remainingSeconds: 0, used: false };
  }
  const raw = mod.getSessionStatus();
  // 兼容原生返回空值的情况，统一给前端稳定结构。
  return {
    active: !!(raw && raw.active),
    remainingSeconds: Number((raw && raw.remainingSeconds) || 0),
    used: !!(raw && raw.used),
  };
}

export function onHceEvent(handler) {
  // 注册原生事件监听，使用 keepAlive 持续推送状态变化。
  const mod = getNativeModule();
  if (!mod || typeof mod.onEvent !== 'function') return false;
  mod.onEvent((raw) => {
    // 统一回调结构，兼容原生可能返回字符串或对象两种场景。
    if (typeof handler !== 'function') return;
    if (typeof raw === 'string') {
      handler({ type: raw, message: '' });
      return;
    }
    const type = (raw && raw.type) || 'UNKNOWN';
    const message = (raw && raw.message) || '';
    handler({ ...raw, type, message });
  });
  return true;
}
