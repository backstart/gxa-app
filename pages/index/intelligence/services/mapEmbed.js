function formatCenter(center) {
  if (!Array.isArray(center) || center.length < 2) return '';
  return `${center[0]},${center[1]}`;
}

function buildQuery(query) {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export const DEFAULT_MAP_VIEW = {
  center: [113.4445, 22.4915],
  zoom: 12,
  mode: 'view',
  layers: ['shops', 'areas'],
  keyword: '',
};

export const DEFAULT_REAL_MAP_PAGE_URL = 'http://159.75.54.99:8002/map';
export const DEFAULT_REAL_MAP_EMBED_URL = 'http://159.75.54.99:8002/map-resources/embedded.html';

const MAP_PAGE_URL_KEY = 'intelligence_map_page_url';
const MAP_EMBED_URL_KEY = 'intelligence_map_embed_url';
const MAP_DEBUG_FALLBACK_KEY = 'intelligence_map_debug_fallback';
const MAP_DEBUG_HUD_KEY = 'intelligence_map_debug_hud';

export function getConfiguredMapPageUrl() {
  return uni.getStorageSync(MAP_PAGE_URL_KEY) || DEFAULT_REAL_MAP_PAGE_URL;
}

export function getConfiguredMapEmbedUrl() {
  return uni.getStorageSync(MAP_EMBED_URL_KEY) || DEFAULT_REAL_MAP_EMBED_URL;
}

export function isDebugMapFallbackEnabled() {
  const value = uni.getStorageSync(MAP_DEBUG_FALLBACK_KEY);
  return value === true || value === '1' || value === 1;
}

export function isDebugMapHudEnabled() {
  const value = uni.getStorageSync(MAP_DEBUG_HUD_KEY);
  return value === true || value === '1' || value === 1;
}

export function buildMapBridgeSrc(options = {}) {
  const view = {
    ...DEFAULT_MAP_VIEW,
    ...options,
  };

  const pageUrl = getConfiguredMapPageUrl();
  const embeddedUrl = `${String(getConfiguredMapEmbedUrl() || '').replace(/\/+$/, '')}?${buildQuery({
    mode: view.mode,
    center: formatCenter(view.center),
    zoom: view.zoom,
    layers: Array.isArray(view.layers) ? view.layers.join(',') : '',
    keyword: view.keyword || '',
    autoSearch: view.keyword ? 'true' : '',
  })}`;

  const bridgeQuery = buildQuery({
    embeddedUrl,
    pageUrl,
    mode: view.mode,
    center: formatCenter(view.center),
    zoom: view.zoom,
    layers: Array.isArray(view.layers) ? view.layers.join(',') : '',
    debugFallback: isDebugMapFallbackEnabled() ? '1' : '',
    showHud: isDebugMapHudEnabled() ? '1' : '',
  });

  return `/static/map/fuyaomap-bridge.html${bridgeQuery ? `?${bridgeQuery}` : ''}`;
}
