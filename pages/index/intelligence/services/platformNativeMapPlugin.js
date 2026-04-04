const PLUGIN_ID = 'GXA-MapNative';

let cachedPlugin = null;
let cachedState = 'unknown';
let eventBridgeBound = false;
const listeners = new Set();

function isAppPlusRuntime() {
  if (typeof uni !== 'undefined' && typeof uni.requireNativePlugin === 'function') {
    return true;
  }
  if (typeof globalThis !== 'undefined' && !!globalThis.plus) {
    return true;
  }
  let systemInfo = {};
  try {
    systemInfo = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
  } catch (error) {
    systemInfo = {};
  }
  const platform = String(systemInfo.uniPlatform || systemInfo.platform || '').toLowerCase();
  return platform === 'app-plus';
}

function hasPluginShape(mod) {
  if (!mod || typeof mod !== 'object') return false;
  return (
    typeof mod.getCapabilities === 'function' &&
    typeof mod.mount === 'function' &&
    typeof mod.updateCamera === 'function' &&
    typeof mod.setMarkers === 'function' &&
    typeof mod.setViewportInset === 'function' &&
    typeof mod.drawGeoJSON === 'function' &&
    typeof mod.selectObject === 'function' &&
    typeof mod.destroy === 'function'
  );
}

function normalizeCapabilities(raw) {
  return {
    rendersBasemap: !!raw?.rendersBasemap,
    supportsMarkers: !!raw?.supportsMarkers,
    supportsViewportInset: !!raw?.supportsViewportInset,
    provider: raw?.provider || 'custom-native',
    engine: raw?.engine || 'unknown',
    status: raw?.status || 'unknown',
  };
}

function normalizeEvent(raw) {
  if (!raw) {
    return {
      type: 'unknown',
      payload: {},
      message: '',
    };
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return normalizeEvent(parsed);
    } catch (error) {
      return {
        type: raw,
        payload: {},
        message: '',
      };
    }
  }

  let payload = raw.payload;
  if (typeof payload === 'string' && payload) {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      payload = {};
    }
  }

  return {
    type: String(raw.type || 'unknown'),
    payload: payload && typeof payload === 'object' ? payload : {},
    message: String(raw.message || ''),
    ts: Number(raw.ts || Date.now()),
  };
}

function dispatchEvent(raw) {
  const event = normalizeEvent(raw);
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.warn('[platform-native-map] listener error', error);
    }
  });
}

function encodePayload(value, fallback) {
  try {
    return JSON.stringify(value ?? fallback);
  } catch (error) {
    return JSON.stringify(fallback);
  }
}

function ensureEventBridge(plugin) {
  if (!plugin || eventBridgeBound || typeof plugin.onEvent !== 'function') {
    return;
  }
  try {
    plugin.onEvent((raw) => {
      dispatchEvent(raw);
    });
    eventBridgeBound = true;
  } catch (error) {
    console.warn('[platform-native-map] bind event bridge failed', error);
  }
}

export function getPlatformNativeMapPlugin() {
  if (cachedState === 'ready') return cachedPlugin;

  try {
    if (!isAppPlusRuntime() || typeof uni === 'undefined' || typeof uni.requireNativePlugin !== 'function') {
      cachedState = 'unknown';
      cachedPlugin = null;
      return null;
    }

    const mod = uni.requireNativePlugin(PLUGIN_ID);
    if (!hasPluginShape(mod)) {
      cachedState = 'missing';
      cachedPlugin = null;
      return null;
    }

    cachedState = 'ready';
    cachedPlugin = mod;
    ensureEventBridge(cachedPlugin);
    return cachedPlugin;
  } catch (error) {
    cachedState = 'unknown';
    cachedPlugin = null;
    return null;
  }
}

export async function detectPlatformNativeMapCapability() {
  const plugin = getPlatformNativeMapPlugin();
  const capabilities = plugin && typeof plugin.getCapabilities === 'function'
    ? normalizeCapabilities(plugin.getCapabilities() || {})
    : normalizeCapabilities({});
  const runtimeStatus = String(capabilities.status || '').toLowerCase();
  const runtimeReason = String(capabilities.reason || '').trim();
  const runtimeReady = capabilities.rendersBasemap && runtimeStatus !== 'dependency-missing';
  return {
    enabled: !!plugin && runtimeReady,
    reason: !plugin
      ? (isAppPlusRuntime() ? 'plugin-missing' : 'not-app-plus')
      : (runtimeReady
        ? 'plugin-ready'
        : (runtimeReason
          ? runtimeReason
          : (runtimeStatus === 'dependency-missing' ? 'plugin-runtime-missing' : 'plugin-not-render-ready'))),
    pluginId: PLUGIN_ID,
    capabilities,
  };
}

export function mountPlatformNativeMap(options = {}) {
  const plugin = getPlatformNativeMapPlugin();
  if (!plugin) return false;
  try {
    ensureEventBridge(plugin);
    plugin.mount({
      containerId: options.containerId || '',
      center: options.center || [],
      zoom: Number(options.zoom || 13),
      basemap: options.basemap || null,
      layers: Array.isArray(options.layers) ? options.layers : [],
      layerConfig: Array.isArray(options.layerConfig) ? options.layerConfig : [],
    });
    return true;
  } catch (error) {
    console.warn('[platform-native-map] mount failed', error);
    return false;
  }
}

export function syncPlatformNativeMap(state = {}) {
  const plugin = getPlatformNativeMapPlugin();
  if (!plugin) return false;
  try {
    plugin.updateCamera({
      center: state.center || [],
      zoom: Number(state.zoom || 13),
    });
    plugin.setMarkers(encodePayload(Array.isArray(state.markers) ? state.markers : [], []));
    plugin.setViewportInset(state.viewportInset || {});
    if (typeof plugin.setActiveLayers === 'function') {
      plugin.setActiveLayers(encodePayload(Array.isArray(state.layers) ? state.layers : [], []));
    }
    if (typeof plugin.drawGeoJSON === 'function') {
      plugin.drawGeoJSON(state.geojson && typeof state.geojson === 'object' ? state.geojson : {
        type: 'FeatureCollection',
        features: [],
      });
    }
    if (typeof plugin.selectObject === 'function' && state.selectedObject && typeof state.selectedObject === 'object') {
      plugin.selectObject(state.selectedObject);
    }
    return true;
  } catch (error) {
    console.warn('[platform-native-map] sync failed', error);
    return false;
  }
}

export function destroyPlatformNativeMap(containerId = '') {
  const plugin = getPlatformNativeMapPlugin();
  if (!plugin) return false;
  try {
    plugin.destroy({
      containerId,
    });
    return true;
  } catch (error) {
    console.warn('[platform-native-map] destroy failed', error);
    return false;
  }
}

export function addPlatformNativeMapListener(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
