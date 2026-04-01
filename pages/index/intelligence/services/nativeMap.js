import { getConfiguredMapPageUrl } from './mapEmbed.js';
import {
  buildMockGeoJSONForDomain,
  buildMockGeoJSONForItem,
  getMapGeoTypeByDomain,
  getMapMarkersFromItems,
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

    const { error, result } = normalizeUniRequestResponse(response);
    if (error) throw error;
    const statusCode = Number(result?.statusCode || 0);
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`HTTP ${statusCode}`);
    }
    return result?.data?.data ?? result?.data;
  } catch (error) {
    console.warn('[native-map] request fallback', error);
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

export async function getNativeMapViewportPoints(options = {}) {
  const center = normalizeCenter(options.center);
  const zoom = Number(options.zoom || DEFAULT_NATIVE_MAP_BOOTSTRAP.zoom) || DEFAULT_NATIVE_MAP_BOOTSTRAP.zoom;
  const layers = Array.isArray(options.layers) && options.layers.length
    ? options.layers.slice()
    : DEFAULT_NATIVE_MAP_BOOTSTRAP.layers.slice();
  const bbox = buildBboxByView(center, zoom);
  const fallback = getMapMarkersFromItems(options.items || []);

  const result = await requestMapService({
    path: '/api/embed/bbox',
    query: {
      minLng: bbox[0],
      minLat: bbox[1],
      maxLng: bbox[2],
      maxLat: bbox[3],
      zoom: Math.round(zoom),
      layers: layers.join(','),
      limit: options.limit || 60,
    },
    fallback: () => ({ items: [] }),
  });

  const list = Array.isArray(result?.items) ? result.items : [];
  const points = list
    .map((item, index) => {
      const lng = Number(item?.pointLongitude ?? item?.longitude);
      const lat = Number(item?.pointLatitude ?? item?.latitude);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      return {
        id: String(item.id || item.sourceFeatureId || item.sourceId || `viewport-${index + 1}`),
        lng,
        lat,
        label: item.displayName || item.name || item.originalName || '',
        color: resolveViewportColor(item.featureType || item.entityType || ''),
        objectType: item.entityType || item.featureType || '',
      };
    })
    .filter(Boolean);

  return points.length ? points : fallback;
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

function buildBboxByView(center, zoom) {
  const lng = Number(center[0] || DEFAULT_NATIVE_MAP_BOOTSTRAP.center[0]);
  const lat = Number(center[1] || DEFAULT_NATIVE_MAP_BOOTSTRAP.center[1]);
  const zoomBase = Math.max(Number(zoom || DEFAULT_NATIVE_MAP_BOOTSTRAP.zoom), 6);
  const lngSpan = 0.22 / (zoomBase / 10);
  const latSpan = lngSpan * 0.72;
  return [
    Number((lng - lngSpan).toFixed(6)),
    Number((lat - latSpan).toFixed(6)),
    Number((lng + lngSpan).toFixed(6)),
    Number((lat + latSpan).toFixed(6)),
  ];
}

function resolveViewportColor(type) {
  const key = String(type || '').toLowerCase();
  if (key.includes('shop')) return '#f4a524';
  if (key.includes('place')) return '#1f7cff';
  if (key.includes('poi')) return '#28a060';
  return '#1f7cff';
}

function normalizeUniRequestResponse(response) {
  if (Array.isArray(response)) {
    return {
      error: response[0],
      result: response[1],
    };
  }

  return {
    error: null,
    result: response,
  };
}
