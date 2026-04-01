import { getConfiguredMapPageUrl } from './mapEmbed.js';

const MAP_SERVICE_BASE_KEY = 'intelligence_map_service_base_url';

export const DEFAULT_NATIVE_MAP_BOOTSTRAP = {
  center: [113.4445, 22.4915],
  zoom: 13,
  layers: ['places'],
  theme: 'light',
  source: 'local-default',
  featureToggles: {},
};

function resolveOrigin(url) {
  const text = String(url || '').trim();
  const match = text.match(/^https?:\/\/[^/]+/i);
  return match ? match[0] : '';
}

function getMapServiceBaseUrl() {
  return uni.getStorageSync(MAP_SERVICE_BASE_KEY) || resolveOrigin(getConfiguredMapPageUrl()) || '';
}

function appendQuery(url, query) {
  if (!url || !query || typeof query !== 'object') return url;
  const search = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return search ? `${url}${url.includes('?') ? '&' : '?'}${search}` : url;
}

async function requestMapService({ path, query, fallback }) {
  const baseUrl = getMapServiceBaseUrl();
  if (!baseUrl) {
    return typeof fallback === 'function' ? fallback(null) : fallback;
  }

  try {
    const response = await uni.request({
      url: appendQuery(`${String(baseUrl).replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`, query),
      method: 'GET',
      timeout: 5000,
      header: {
        'Content-Type': 'application/json',
      },
    });

    const [error, result] = response;
    if (error) throw error;
    const statusCode = Number(result?.statusCode || 0);
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`HTTP ${statusCode}`);
    }
    return result?.data?.data ?? result?.data;
  } catch (error) {
    console.warn('[native-map] bootstrap fallback', error);
    return typeof fallback === 'function' ? fallback(error) : fallback;
  }
}

function normalizeCenter(center) {
  if (!Array.isArray(center) || center.length < 2) {
    return DEFAULT_NATIVE_MAP_BOOTSTRAP.center.slice();
  }

  const lng = Number(center[0]);
  const lat = Number(center[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return DEFAULT_NATIVE_MAP_BOOTSTRAP.center.slice();
  }

  return [lng, lat];
}

export async function getNativeMapBootstrapConfig(options = {}) {
  const fallback = {
    ...DEFAULT_NATIVE_MAP_BOOTSTRAP,
    center: DEFAULT_NATIVE_MAP_BOOTSTRAP.center.slice(),
    layers: Array.isArray(options.layers) && options.layers.length
      ? options.layers.slice()
      : DEFAULT_NATIVE_MAP_BOOTSTRAP.layers.slice(),
  };

  const result = await requestMapService({
    path: '/api/embed/config',
    fallback: () => fallback,
  });

  return {
    center: normalizeCenter(result?.defaultCenter || result?.center),
    zoom: Number(result?.defaultZoom || fallback.zoom) || fallback.zoom,
    layers: Array.isArray(result?.defaultLayers) && result.defaultLayers.length
      ? result.defaultLayers.slice()
      : fallback.layers.slice(),
    theme: result?.defaultTheme || fallback.theme,
    source: result?.generatedAtUtc ? 'embed-config' : fallback.source,
    featureToggles: result?.featureToggles || fallback.featureToggles,
  };
}
