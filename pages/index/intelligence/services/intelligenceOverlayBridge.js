const MAIN_TO_OVERLAY_EVENT = 'intelligence-overlay:main-to-overlay';
const OVERLAY_TO_MAIN_EVENT = 'intelligence-overlay:overlay-to-main';
const SUBNVUE_ID = 'intelligence-overlay';
let overlayEventSeq = 0;

export const INTELLIGENCE_OVERLAY_EVENTS = {
  MAIN_TO_OVERLAY_EVENT,
  OVERLAY_TO_MAIN_EVENT,
  SUBNVUE_ID,
};

function getCurrentPageWebview() {
  // #ifdef APP-PLUS
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  return current?.$getAppWebview?.() || null;
  // #endif
  // #ifndef APP-PLUS
  return null;
  // #endif
}

function safeCall(fn, fallback = null) {
  try {
    return fn();
  } catch (error) {
    return fallback;
  }
}

function normalizeOverlayEventPayload(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    if (!raw.length) return null;
    return normalizeOverlayEventPayload(raw[0]);
  }
  if (raw.detail && typeof raw.detail === 'object') {
    return normalizeOverlayEventPayload(raw.detail.data ?? raw.detail);
  }
  if (raw.data && typeof raw.data === 'object') {
    return normalizeOverlayEventPayload(raw.data);
  }
  if (typeof raw !== 'object') return null;
  if (!raw.type && raw.payload && typeof raw.payload === 'object' && raw.payload.type) {
    return normalizeOverlayEventPayload(raw.payload);
  }
  return raw;
}

export function emitOverlayUiEvent(type, payload = {}) {
  const message = {
    id: ++overlayEventSeq,
    type: String(type || ''),
    payload: payload && typeof payload === 'object' ? payload : {},
    at: Date.now(),
  };
  uni.$emit(OVERLAY_TO_MAIN_EVENT, message);
  // #ifdef APP-PLUS
  safeCall(() => {
    const current = plus.webview.currentWebview();
    const opener = current?.opener?.();
    if (!opener || typeof opener.evalJS !== 'function') return;
    const serialized = JSON.stringify(message).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    opener.evalJS(`window.__INTELLIGENCE_OVERLAY_BRIDGE__&&window.__INTELLIGENCE_OVERLAY_BRIDGE__('${serialized}')`);
  });
  // #endif
}

export function createIntelligenceOverlayBridge() {
  let subNVue = null;
  let boundMainHandler = null;
  let enabled = false;

  function resolveSubNVue() {
    const webview = getCurrentPageWebview();
    if (!webview || typeof webview.getSubNVueById !== 'function') return null;
    return safeCall(() => webview.getSubNVueById(SUBNVUE_ID), null);
  }

  function ensureSubNVue() {
    if (subNVue) return subNVue;
    subNVue = resolveSubNVue();
    return subNVue;
  }

  function sendToOverlay(type, payload = {}) {
    if (!enabled) return;
    const event = {
      type: String(type || ''),
      payload: payload && typeof payload === 'object' ? payload : {},
      at: Date.now(),
    };
    uni.$emit(MAIN_TO_OVERLAY_EVENT, event);
    const target = ensureSubNVue();
    if (target && typeof target.postMessage === 'function') {
      safeCall(() => target.postMessage(event));
    }
    console.info('[overlay-bridge]', {
      direction: 'main-to-overlay',
      type: event.type,
    });
  }

  return {
    init() {
      // #ifdef APP-PLUS
      const target = ensureSubNVue();
      if (!target) {
        enabled = false;
        return false;
      }
      enabled = true;
      return true;
      // #endif
      // #ifndef APP-PLUS
      enabled = false;
      return false;
      // #endif
    },
    isEnabled() {
      return enabled;
    },
    show() {
      if (!enabled) return;
      const target = ensureSubNVue();
      if (!target || typeof target.show !== 'function') return;
      safeCall(() => target.show('none'));
      sendToOverlay('show');
    },
    hide() {
      if (!enabled) return;
      const target = ensureSubNVue();
      if (!target || typeof target.hide !== 'function') return;
      safeCall(() => target.hide('none'));
      sendToOverlay('hide');
    },
    syncState(state) {
      sendToOverlay('sync-state', state);
    },
    send(type, payload) {
      sendToOverlay(type, payload);
    },
    onOverlayEvent(handler) {
      if (typeof handler !== 'function') return () => {};
      const wrapped = (rawEvent) => {
        const event = normalizeOverlayEventPayload(rawEvent);
        if (!event || typeof event !== 'object') return;
        handler(event);
      };
      boundMainHandler = wrapped;
      uni.$on(OVERLAY_TO_MAIN_EVENT, wrapped);
      return () => {
        if (!boundMainHandler) return;
        uni.$off(OVERLAY_TO_MAIN_EVENT, boundMainHandler);
        boundMainHandler = null;
      };
    },
    destroy() {
      if (boundMainHandler) {
        uni.$off(OVERLAY_TO_MAIN_EVENT, boundMainHandler);
        boundMainHandler = null;
      }
      if (enabled) {
        this.hide();
      }
      enabled = false;
      subNVue = null;
    },
  };
}
