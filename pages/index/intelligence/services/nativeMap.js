import { getConfiguredMapPageUrl } from './mapEmbed.js';
import {
  buildMockGeoJSONForDomain,
  buildMockGeoJSONForItem,
  getMapGeoTypeByDomain,
} from './intelligence.js';

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

function safeParseGeoJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
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

export async function getNativeMapGeoJSON(options = {}) {
  const domain = options.domain || 'alerts';
  const type = options.type || getMapGeoTypeByDomain(domain);
  const fallback = buildMockGeoJSONForDomain(domain, options.items || []);

  const result = await requestMapService({
    path: `/api/embed/geojson/${type}`,
    query: {
      keyword: options.keyword || '',
      limit: options.limit || 80,
    },
    fallback: () => ({ geoJson: fallback }),
  });

  return normalizeFeatureCollection(result?.geoJson || result || fallback, fallback);
}

export async function getNativeMapObjectGeometry(options = {}) {
  const item = options.item || null;
  const domain = options.domain || 'alerts';
  const fallbackCollection = buildMockGeoJSONForItem(item, domain);

  if (!item?.mapObjectType || !item?.mapObjectId) {
    return {
      center: Array.isArray(item?.coordinate) ? item.coordinate.slice() : null,
      zoom: item?.mapZoom || 15,
      featureCollection: fallbackCollection,
      source: 'mock-item',
    };
  }

  const result = await requestMapService({
    path: `/api/embed/object/${item.mapObjectType}/${item.mapObjectId}`,
    fallback: () => null,
  });

  const geometry = safeParseGeoJson(result?.geometryGeoJson || result?.GeometryGeoJson);
  return {
    center: Number.isFinite(Number(result?.longitude)) && Number.isFinite(Number(result?.latitude))
      ? [Number(result.longitude), Number(result.latitude)]
      : Array.isArray(item?.coordinate)
        ? item.coordinate.slice()
        : null,
    zoom: item?.mapZoom || 15,
    featureCollection: normalizeFeatureCollection(geometry ? toFeatureCollection(geometry, result) : fallbackCollection, fallbackCollection),
    source: geometry ? 'embed-object' : 'mock-item',
  };
}

function toFeatureCollection(geometry, item) {
  if (geometry?.type === 'FeatureCollection') {
    return geometry;
  }

  if (geometry?.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [geometry],
    };
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: item?.id || item?.Id || '',
        properties: {
          id: item?.id || item?.Id || '',
          name: item?.displayName || item?.name || '',
        },
        geometry,
      },
    ],
  };
}

function normalizeFeatureCollection(value, fallback) {
  const collection = safeParseGeoJson(value);
  if (collection?.type === 'FeatureCollection' && Array.isArray(collection.features)) {
    return collection;
  }
  return fallback || {
    type: 'FeatureCollection',
    features: [],
  };
}
