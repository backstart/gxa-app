function joinUrl(baseUrl, path) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const nextPath = String(path || '').replace(/^\/+/, '');
  if (!base) return '';
  if (base.endsWith('/api') && nextPath.startsWith('api/')) {
    return `${base}/${nextPath.slice(4)}`;
  }
  return `${base}/${nextPath}`;
}

function appendQuery(url, query) {
  if (!url || !query || typeof query !== 'object') return url;
  const search = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return search ? `${url}${url.includes('?') ? '&' : '?'}${search}` : url;
}

export function getApiBaseUrl() {
  return uni.getStorageSync('gxa_api_base_url') || '';
}

export async function requestWithFallback({
  path,
  method = 'GET',
  query,
  data,
  timeout = 6000,
  fallback,
}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return typeof fallback === 'function' ? fallback(null) : fallback;
  }

  try {
    const response = await uni.request({
      url: appendQuery(joinUrl(baseUrl, path), query),
      method,
      data,
      timeout,
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
    console.warn('[intelligence/http] fallback to mock', error);
    return typeof fallback === 'function' ? fallback(error) : fallback;
  }
}
