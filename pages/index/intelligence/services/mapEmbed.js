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

export function getMapEmbedOrigin() {
  return uni.getStorageSync('map_embed_origin') || '';
}

export function buildMapBridgeSrc(options = {}) {
  const view = {
    ...DEFAULT_MAP_VIEW,
    ...options,
  };

  const embeddedOrigin = String(getMapEmbedOrigin() || '').replace(/\/+$/, '');
  const embeddedUrl = embeddedOrigin
    ? `${embeddedOrigin}/map-resources/embedded.html?${buildQuery({
        mode: view.mode,
        center: formatCenter(view.center),
        zoom: view.zoom,
        layers: Array.isArray(view.layers) ? view.layers.join(',') : '',
        keyword: view.keyword || '',
        autoSearch: view.keyword ? 'true' : '',
      })}`
    : '';

  const bridgeQuery = buildQuery({
    embeddedUrl,
    mode: view.mode,
    center: formatCenter(view.center),
    zoom: view.zoom,
    layers: Array.isArray(view.layers) ? view.layers.join(',') : '',
  });

  return `/static/map/fuyaomap-bridge.html${bridgeQuery ? `?${bridgeQuery}` : ''}`;
}
