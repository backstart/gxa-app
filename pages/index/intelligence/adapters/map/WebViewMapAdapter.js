import { MAP_BRIDGE_SOURCE, MAP_EVENT_TYPES } from './types.js';

function escapeScriptValue(payload) {
  return JSON.stringify(payload).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
}

export class WebViewMapAdapter {
  constructor(options = {}) {
    this.host = null;
    this.source = '';
    this.lastZoom = null;
    this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : null;
  }

  setHost(host) {
    this.host = host;
  }

  setSource(source) {
    this.source = source || '';
  }

  init() {}

  setCenter(center) {
    this.dispatch('set-center', { center });
  }

  setZoom(zoom) {
    this.dispatch('set-zoom', { zoom });
  }

  flyTo(payload) {
    this.dispatch('fly-to', payload);
  }

  addMarker(marker) {
    this.addMarkers([marker]);
  }

  addMarkers(markers) {
    this.dispatch('set-marker', { markers, flyTo: false });
  }

  clearMarkers() {
    this.dispatch('clear-marker', {});
  }

  setActiveLayers(layers) {
    this.dispatch('set-layers', { layers });
  }

  drawGeoJSON(featureCollection) {
    this.dispatch('draw-geojson', { featureCollection });
  }

  selectObject(object) {
    this.dispatch('select-object', { object });
  }

  setViewportInset(inset) {
    this.dispatch('set-viewport-inset', { inset });
  }

  destroy() {
    this.host = null;
  }

  dispatch(type, payload) {
    if (!this.host || typeof this.host.evalJS !== 'function') {
      return false;
    }
    const message = { type, payload: payload || {} };
    const script = `window.__GXA_MAP_BRIDGE__ && window.__GXA_MAP_BRIDGE__.receiveHostMessage(${escapeScriptValue(
      message
    )});`;
    return this.host.evalJS(script);
  }

  handleMessageEvent(event) {
    const list = Array.isArray(event?.detail?.data) ? event.detail.data : [event?.detail?.data];
    list.forEach((raw) => {
      const message = raw?.data ?? raw;
      const normalized = this.normalizeMessage(message);
      if (!normalized || !this.onEvent) return;
      this.onEvent(normalized);
    });
  }

  normalizeMessage(message) {
    if (!message || typeof message !== 'object') return null;

    if (message.source === MAP_BRIDGE_SOURCE) {
      return {
        type: message.type,
        payload: message.payload || {},
        raw: message,
      };
    }

    if (message.source !== 'fuyaomap-embedded') {
      return null;
    }

    const rawType = String(message.type || '');
    const payload = message.payload || {};
    if (rawType === 'map-ready') return { type: MAP_EVENT_TYPES.READY, payload, raw: message };
    if (rawType === 'map-click') return { type: MAP_EVENT_TYPES.MAP_CLICK, payload, raw: message };
    if (rawType === 'marker-click') return { type: MAP_EVENT_TYPES.MARKER_CLICK, payload, raw: message };
    if (rawType === 'feature-located') return { type: MAP_EVENT_TYPES.OBJECT_SELECT, payload, raw: message };
    if (rawType === 'layers-ready' || rawType === 'layers-changed') {
      return { type: MAP_EVENT_TYPES.LAYERS_CHANGE, payload, raw: message };
    }
    if (rawType === 'viewport-change') {
      const currentZoom = Number(payload.zoom);
      if (Number.isFinite(currentZoom) && currentZoom !== this.lastZoom && this.onEvent) {
        this.onEvent({ type: MAP_EVENT_TYPES.ZOOM_END, payload, raw: message });
        this.lastZoom = currentZoom;
      }
      return { type: MAP_EVENT_TYPES.MOVE_END, payload, raw: message };
    }
    return null;
  }
}
