import { getConfiguredMapPageUrl } from './mapEmbed.js';
import {
  buildMockGeoJSONForDomain,
  buildMockGeoJSONForItem,
  getMapGeoTypeByDomain,
  getMapMarkersFromItems,
} from './intelligence.js';

const MAP_SERVICE_BASE_KEY = 'intelligence_map_service_base_url';
const MAP_REQUEST_TIMEOUT = 30000;
const DEFAULT_BASEMAP_STYLE_PATH = '/map-resources/styles/amap-like.json';
const DEFAULT_BASEMAP_TILES_PATH = '/tiles/city.pmtiles';
const DEFAULT_NATIVE_TILE_TEMPLATE = '/api/embed/native/tiles/{z}/{x}/{y}.pbf?pmtilesUrl={pmtilesUrl}';
const BASEMAP_SOURCE_PLATFORM_REAL = 'platform-real';
const BASEMAP_SOURCE_PLATFORM_DEFAULT_FALLBACK = 'platform-default-fallback';
const BASEMAP_SOURCE_LOCAL_PREVIEW = 'local-preview';
let cachedLayerConfig = [];
let layerConfigRequestTask = null;

export const DEFAULT_NATIVE_MAP_BOOTSTRAP = {
  center: [113.4445, 22.4915],
  zoom: 13,
  layers: ['places'],
  theme: 'light',
  source: 'local-default',
  featureToggles: {},
  layerConfig: [],
  basemap: {
    provider: 'platform-config',
    source: 'local-default',
    sourceType: BASEMAP_SOURCE_LOCAL_PREVIEW,
    tilesUrl: '',
    styleUrl: '',
    nativeTileUrlTemplate: '',
    kind: 'config-only',
    diagnostics: {
      reason: 'local-default',
      hasRealStyleUrl: false,
      hasRealTilesUrl: false,
      styleUrlProbe: 'skipped',
    },
  },
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
  const normalizedPath = normalizeRequestPath(path);
  if (!baseUrl) {
    console.warn('[native-map] request skip: missing base url', {
      path: normalizedPath,
    });
    return typeof fallback === 'function' ? fallback(null) : fallback;
  }
  const url = appendQuery(
    `${String(baseUrl).replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`,
    query
  );
  const startedAt = Date.now();

  try {
    const response = await uni.request({
      url,
      method: 'GET',
      timeout: MAP_REQUEST_TIMEOUT,
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
    const elapsed = Date.now() - startedAt;
    if (elapsed > 3000) {
      console.info('[native-map] request slow', {
        path: normalizedPath,
        url,
        timeout: MAP_REQUEST_TIMEOUT,
        elapsed,
      });
    }
    return result?.data?.data ?? result?.data;
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    console.warn('[native-map] request failed', {
      path: normalizedPath,
      url,
      timeout: MAP_REQUEST_TIMEOUT,
      elapsed,
      detail: normalizeRequestError(error),
    });
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

function hasHttpScheme(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function hasAnyScheme(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(String(value || '').trim());
}

function resolveAbsoluteUrl(url, baseUrl) {
  const text = String(url || '').trim();
  if (!text) return '';
  if (hasHttpScheme(text)) return text;
  if (hasAnyScheme(text)) return '';
  if (text.startsWith('//')) {
    const base = String(baseUrl || '').trim();
    const protocolMatch = base.match(/^(https?):\/\//i);
    const protocol = protocolMatch ? protocolMatch[1] : 'http';
    return `${protocol}:${text}`;
  }
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return text;
  return `${base}/${text.replace(/^\/+/, '')}`;
}

function pickPreferredBasemapUrl(baseUrl, candidates = []) {
  for (let i = 0; i < candidates.length; i += 1) {
    const resolved = resolveAbsoluteUrl(candidates[i], baseUrl);
    if (hasHttpScheme(resolved)) {
      return resolved;
    }
  }
  return '';
}

function normalizeBasemap(result, baseUrl, fallback) {
  const fallbackStyleUrl = resolveAbsoluteUrl(DEFAULT_BASEMAP_STYLE_PATH, baseUrl);
  const fallbackTilesUrl = resolveAbsoluteUrl(DEFAULT_BASEMAP_TILES_PATH, baseUrl);
  const fallbackNativeTileTemplate = resolveAbsoluteUrl(DEFAULT_NATIVE_TILE_TEMPLATE, baseUrl);

  const resolvedRealStyleUrl = pickPreferredBasemapUrl(baseUrl, [
    result?.styleUrl,
    result?.StyleUrl,
    result?.styleUrlAbsolute,
    result?.StyleUrlAbsolute,
  ]);
  const resolvedRealTilesUrl = pickPreferredBasemapUrl(baseUrl, [
    result?.tilesUrl,
    result?.TilesUrl,
    result?.tilesUrlAbsolute,
    result?.TilesUrlAbsolute,
  ]);
  const resolvedRealNativeTemplate = pickPreferredBasemapUrl(baseUrl, [
    result?.nativeTileUrlTemplate,
    result?.NativeTileUrlTemplate,
    result?.nativeTileUrlTemplateAbsolute,
    result?.NativeTileUrlTemplateAbsolute,
  ]);

  const explicitSourceType = normalizeBasemapSourceType(result?.basemapSourceType || result?.BasemapSourceType);
  const inferredSourceType = inferBasemapSourceType({
    explicitSourceType,
    styleUrl: resolvedRealStyleUrl,
    tilesUrl: resolvedRealTilesUrl,
  });

  const hasRealStyleUrl = !!resolvedRealStyleUrl;
  const hasRealTilesUrl = !!resolvedRealTilesUrl;
  const canUsePlatformReal = inferredSourceType === BASEMAP_SOURCE_PLATFORM_REAL && hasRealStyleUrl && hasRealTilesUrl;

  if (canUsePlatformReal) {
    return {
      provider: result?.provider || result?.mapProvider || fallback.provider,
      source: 'embed-config',
      sourceType: BASEMAP_SOURCE_PLATFORM_REAL,
      tilesUrl: resolvedRealTilesUrl,
      styleUrl: resolvedRealStyleUrl,
      nativeTileUrlTemplate: resolvedRealNativeTemplate || fallbackNativeTileTemplate,
      kind: 'platform-config',
      diagnostics: {
        reason: 'platform-real',
        hasRealStyleUrl,
        hasRealTilesUrl,
        styleUrlProbe: 'pending',
      },
    };
  }

  const fallbackReason = !hasRealStyleUrl || !hasRealTilesUrl
    ? 'missing-style-or-tiles'
    : `explicit-${inferredSourceType}`;
  return {
    provider: result?.provider || result?.mapProvider || fallback.provider,
    source: 'embed-default',
    sourceType: BASEMAP_SOURCE_PLATFORM_DEFAULT_FALLBACK,
    tilesUrl: resolvedRealTilesUrl || fallbackTilesUrl,
    styleUrl: resolvedRealStyleUrl || fallbackStyleUrl,
    nativeTileUrlTemplate: resolvedRealNativeTemplate || fallbackNativeTileTemplate,
    kind: 'platform-config',
    diagnostics: {
      reason: fallbackReason,
      hasRealStyleUrl,
      hasRealTilesUrl,
      styleUrlProbe: 'skipped',
    },
  };
}

function normalizeBasemapSourceType(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text === BASEMAP_SOURCE_PLATFORM_REAL) return BASEMAP_SOURCE_PLATFORM_REAL;
  if (text === BASEMAP_SOURCE_PLATFORM_DEFAULT_FALLBACK) return BASEMAP_SOURCE_PLATFORM_DEFAULT_FALLBACK;
  if (text === BASEMAP_SOURCE_LOCAL_PREVIEW) return BASEMAP_SOURCE_LOCAL_PREVIEW;
  return '';
}

function inferBasemapSourceType(options = {}) {
  if (options.explicitSourceType) {
    return options.explicitSourceType;
  }
  if (!options.styleUrl || !options.tilesUrl) {
    return BASEMAP_SOURCE_PLATFORM_DEFAULT_FALLBACK;
  }
  const styleLower = String(options.styleUrl).toLowerCase();
  const tilesLower = String(options.tilesUrl).toLowerCase();
  const styleIsDefault = styleLower.includes('/map-resources/styles/amap-like.json');
  const tilesIsDefault = tilesLower.includes('/tiles/city.pmtiles');
  return styleIsDefault || tilesIsDefault
    ? BASEMAP_SOURCE_PLATFORM_DEFAULT_FALLBACK
    : BASEMAP_SOURCE_PLATFORM_REAL;
}

async function probeBasemapStyleUrl(styleUrl) {
  const url = String(styleUrl || '').trim();
  if (!url) {
    return {
      ok: false,
      reason: 'empty-style-url',
    };
  }

  const startedAt = Date.now();
  try {
    const response = await uni.request({
      url,
      method: 'GET',
      timeout: 8000,
      header: {
        Accept: 'application/json',
      },
    });
    const { error, result } = normalizeUniRequestResponse(response);
    if (error) throw error;
    const statusCode = Number(result?.statusCode || 0);
    if (statusCode < 200 || statusCode >= 300) {
      return {
        ok: false,
        reason: `style-http-${statusCode}`,
      };
    }
    const data = result?.data;
    const style = typeof data === 'string' ? safeParseGeoJson(data) : data;
    if (!style || typeof style !== 'object') {
      return {
        ok: false,
        reason: 'style-json-invalid',
      };
    }
    if (!style.sources || typeof style.sources !== 'object') {
      return {
        ok: false,
        reason: 'style-sources-missing',
      };
    }
    return {
      ok: true,
      reason: 'style-ok',
      elapsed: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      reason: normalizeRequestError(error)?.message || 'style-request-failed',
      elapsed: Date.now() - startedAt,
    };
  }
}

async function ensureBasemapSourceOrder(basemap, baseUrl) {
  if (!basemap || typeof basemap !== 'object') {
    return {
      ...DEFAULT_NATIVE_MAP_BOOTSTRAP.basemap,
    };
  }

  if (basemap.sourceType !== BASEMAP_SOURCE_PLATFORM_REAL) {
    return basemap;
  }

  const probe = await probeBasemapStyleUrl(basemap.styleUrl);
  if (probe.ok) {
    return {
      ...basemap,
      diagnostics: {
        ...(basemap.diagnostics || {}),
        styleUrlProbe: 'ok',
        styleProbeReason: probe.reason,
        styleProbeElapsed: probe.elapsed || 0,
      },
    };
  }

  const fallbackStyleUrl = resolveAbsoluteUrl(DEFAULT_BASEMAP_STYLE_PATH, baseUrl);
  const fallbackTilesUrl = resolveAbsoluteUrl(DEFAULT_BASEMAP_TILES_PATH, baseUrl);
  const fallbackNativeTileTemplate = resolveAbsoluteUrl(DEFAULT_NATIVE_TILE_TEMPLATE, baseUrl);

  return {
    ...basemap,
    source: 'embed-default',
    sourceType: BASEMAP_SOURCE_PLATFORM_DEFAULT_FALLBACK,
    styleUrl: fallbackStyleUrl,
    tilesUrl: fallbackTilesUrl,
    nativeTileUrlTemplate: basemap.nativeTileUrlTemplate || fallbackNativeTileTemplate,
    diagnostics: {
      ...(basemap.diagnostics || {}),
      reason: 'platform-style-unreachable',
      styleUrlProbe: 'failed',
      styleProbeReason: probe.reason || 'style-request-failed',
      styleProbeElapsed: probe.elapsed || 0,
    },
  };
}

function logBasemapStatus(stage, basemap) {
  if (!basemap || typeof basemap !== 'object') return;
  const payload = {
    stage,
    sourceType: basemap.sourceType || 'unknown',
    source: basemap.source || '',
    styleUrl: basemap.styleUrl || '',
    tilesUrl: basemap.tilesUrl || '',
    nativeTileUrlTemplate: basemap.nativeTileUrlTemplate || '',
    diagnostics: basemap.diagnostics || {},
  };
  if (payload.sourceType === BASEMAP_SOURCE_PLATFORM_REAL) {
    console.info('[map-basemap]', payload);
    return;
  }
  console.warn('[map-basemap]', payload);
}

function normalizeLayerConfig(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => {
      const key = String(item?.key || '').trim();
      if (!key) return null;
      return {
        key,
        entityType: String(item?.entityType || '').trim(),
        name: String(item?.name || '').trim(),
        minZoom: Number(item?.minZoom || 0),
      };
    })
    .filter(Boolean);
}

function loadLayerConfig() {
  if (layerConfigRequestTask) return layerConfigRequestTask;
  layerConfigRequestTask = requestMapService({
    path: '/api/embed/layers',
    fallback: () => ({ layers: [] }),
  })
    .then((result) => {
      const next = normalizeLayerConfig(result?.layers);
      cachedLayerConfig = next.slice();
      return cachedLayerConfig.slice();
    })
    .catch(() => cachedLayerConfig.slice())
    .finally(() => {
      layerConfigRequestTask = null;
    });
  return layerConfigRequestTask;
}

async function getLayerConfigForBootstrap() {
  void loadLayerConfig();
  if (cachedLayerConfig.length) {
    return cachedLayerConfig.slice();
  }
  return cachedLayerConfig.slice();
}

export async function getNativeMapBootstrapConfig(options = {}) {
  const baseUrl = getMapServiceBaseUrl();
  const fallback = {
    ...DEFAULT_NATIVE_MAP_BOOTSTRAP,
    center: DEFAULT_NATIVE_MAP_BOOTSTRAP.center.slice(),
    layers: Array.isArray(options.layers) && options.layers.length
      ? options.layers.slice()
      : DEFAULT_NATIVE_MAP_BOOTSTRAP.layers.slice(),
    basemap: {
      ...DEFAULT_NATIVE_MAP_BOOTSTRAP.basemap,
    },
  };

  const result = await requestMapService({
    path: '/api/embed/config',
    fallback: () => fallback,
  });
  const layerConfig = await getLayerConfigForBootstrap();
  let basemap = normalizeBasemap(result, baseUrl, fallback.basemap);
  logBasemapStatus('config-normalized', basemap);
  basemap = await ensureBasemapSourceOrder(basemap, baseUrl);
  logBasemapStatus('config-final', basemap);

  return {
    center: normalizeCenter(result?.defaultCenter || result?.center),
    zoom: Number(result?.defaultZoom || fallback.zoom) || fallback.zoom,
    layers: Array.isArray(result?.defaultLayers) && result.defaultLayers.length
      ? result.defaultLayers.slice()
      : fallback.layers.slice(),
    theme: result?.defaultTheme || fallback.theme,
    source: result?.generatedAtUtc ? 'embed-config' : fallback.source,
    featureToggles: result?.featureToggles || fallback.featureToggles,
    layerConfig: layerConfig.length ? layerConfig : fallback.layerConfig.slice(),
    basemap,
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

function normalizeRequestPath(path) {
  const text = String(path || '').trim();
  if (!text) return '/';
  return text.startsWith('/') ? text : `/${text}`;
}

function normalizeRequestError(error) {
  if (!error) return { message: 'unknown' };
  if (typeof error === 'string') return { message: error };
  const message = String(error.errMsg || error.message || 'request error');
  const statusCode = Number(error.statusCode || error.code || 0);
  return {
    message,
    statusCode: Number.isFinite(statusCode) ? statusCode : 0,
  };
}
