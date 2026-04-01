import { MAP_EVENT_TYPES } from './types.js';

const DEFAULT_CENTER = [113.4445, 22.4915];
const DEFAULT_ZOOM = 12;

export class NativeMapAdapter {
  constructor(options = {}) {
    this.host = null;
    this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : null;
    this.state = {
      ready: false,
      center: DEFAULT_CENTER.slice(),
      zoom: DEFAULT_ZOOM,
      layers: [],
      markers: [],
      geojson: null,
      selectedId: '',
      viewportInset: { bottom: 0 },
      source: '',
      mode: 'native-preview',
    };
  }

  setHost(host) {
    this.host = host || null;
  }

  setSource(source) {
    this.state.source = source || '';
    this.pushState();
  }

  init(payload = {}) {
    if (payload.center) {
      this.state.center = normalizeCenter(payload.center) || this.state.center;
    }
    if (Number.isFinite(Number(payload.zoom))) {
      this.state.zoom = Number(payload.zoom);
    }
    this.state.ready = true;
    this.pushState();
    this.emit(MAP_EVENT_TYPES.READY, {
      mode: this.state.mode,
      center: this.state.center.slice(),
      zoom: this.state.zoom,
      layers: this.state.layers.slice(),
      markers: this.state.markers.slice(),
    });
  }

  setCenter(center) {
    const nextCenter = normalizeCenter(center);
    if (!nextCenter) return;
    this.state.center = nextCenter;
    this.pushState();
    this.emit(MAP_EVENT_TYPES.MOVE_END, {
      center: nextCenter.slice(),
      zoom: this.state.zoom,
      layers: this.state.layers.slice(),
    });
  }

  setZoom(zoom) {
    const nextZoom = Number(zoom);
    if (!Number.isFinite(nextZoom)) return;
    this.state.zoom = nextZoom;
    this.pushState();
    this.emit(MAP_EVENT_TYPES.ZOOM_END, {
      center: this.state.center.slice(),
      zoom: this.state.zoom,
      layers: this.state.layers.slice(),
    });
  }

  flyTo(payload = {}) {
    const nextCenter = normalizeCenter(payload.center) || this.state.center;
    const nextZoom = Number.isFinite(Number(payload.zoom)) ? Number(payload.zoom) : this.state.zoom;
    this.state.center = nextCenter.slice();
    this.state.zoom = nextZoom;
    this.pushState();
    this.emit(MAP_EVENT_TYPES.MOVE_END, {
      center: this.state.center.slice(),
      zoom: this.state.zoom,
      layers: this.state.layers.slice(),
    });
    this.emit(MAP_EVENT_TYPES.ZOOM_END, {
      center: this.state.center.slice(),
      zoom: this.state.zoom,
      layers: this.state.layers.slice(),
    });
  }

  addMarker(marker) {
    if (!marker) return;
    this.addMarkers([marker]);
  }

  addMarkers(markers = []) {
    const normalized = normalizeMarkers(markers);
    if (!normalized.length) return;
    const markerMap = new Map(this.state.markers.map((item) => [item.id, item]));
    normalized.forEach((item) => {
      markerMap.set(item.id, item);
    });
    this.state.markers = Array.from(markerMap.values());
    this.pushState();
    this.emit(MAP_EVENT_TYPES.MARKERS_CHANGE, {
      markers: this.state.markers.slice(),
    });
  }

  clearMarkers() {
    this.state.markers = [];
    this.state.selectedId = '';
    this.pushState();
    this.emit(MAP_EVENT_TYPES.MARKERS_CHANGE, {
      markers: [],
    });
  }

  setActiveLayers(layers = []) {
    this.state.layers = Array.isArray(layers) ? layers.filter(Boolean) : [];
    this.pushState();
    this.emit(MAP_EVENT_TYPES.LAYERS_CHANGE, {
      layers: this.state.layers.slice(),
    });
  }

  drawGeoJSON(featureCollection) {
    this.state.geojson = featureCollection || null;
    this.pushState();
  }

  selectObject(object) {
    const nextCenter = normalizeCenter(object?.coordinate || object?.center);
    if (object?.id) {
      this.state.selectedId = String(object.id);
    }
    if (nextCenter) {
      this.state.center = nextCenter;
      if (Number.isFinite(Number(object?.mapZoom))) {
        this.state.zoom = Number(object.mapZoom);
      }
    }
    this.pushState();
    this.emit(MAP_EVENT_TYPES.OBJECT_SELECT, {
      id: object?.id ? String(object.id) : '',
      item: object || null,
      center: this.state.center.slice(),
    });
  }

  setViewportInset(inset = {}) {
    this.state.viewportInset = {
      ...this.state.viewportInset,
      ...inset,
    };
    this.pushState();
  }

  handleMessageEvent() {}

  notifyMapClick(payload = {}) {
    this.emit(MAP_EVENT_TYPES.MAP_CLICK, {
      ...payload,
      center: this.state.center.slice(),
      zoom: this.state.zoom,
    });
  }

  notifyMarkerClick(marker) {
    if (!marker) return;
    this.state.selectedId = String(marker.id || '');
    this.pushState();
    this.emit(MAP_EVENT_TYPES.MARKER_CLICK, {
      id: marker.id ? String(marker.id) : '',
      item: marker,
      lng: marker.lng,
      lat: marker.lat,
    });
  }

  destroy() {
    this.host = null;
    this.state.ready = false;
  }

  pushState() {
    if (!this.host || typeof this.host.syncState !== 'function') {
      return;
    }
    this.host.syncState({
      ready: this.state.ready,
      center: this.state.center.slice(),
      zoom: this.state.zoom,
      layers: this.state.layers.slice(),
      markers: this.state.markers.slice(),
      geojson: this.state.geojson,
      selectedId: this.state.selectedId,
      viewportInset: { ...this.state.viewportInset },
      source: this.state.source,
      mode: this.state.mode,
    });
  }

  emit(type, payload) {
    if (!this.onEvent) return;
    this.onEvent({
      type,
      payload: payload || {},
      raw: payload || {},
    });
  }
}

function normalizeCenter(center) {
  if (Array.isArray(center) && center.length >= 2) {
    const lng = Number(center[0]);
    const lat = Number(center[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  if (center && typeof center === 'object') {
    const lng = Number(center.lng);
    const lat = Number(center.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  if (typeof center === 'string' && center.includes(',')) {
    const parts = center.split(',');
    if (parts.length >= 2) {
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return [lng, lat];
      }
    }
  }

  return null;
}

function normalizeMarkers(markers = []) {
  return markers
    .map((item, index) => {
      const lng = Number(item?.lng);
      const lat = Number(item?.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return null;
      }
      return {
        id: String(item.id || `marker-${index + 1}`),
        lng,
        lat,
        label: item.label || '',
        color: item.color || '#1f7cff',
        objectType: item.objectType || '',
        raw: item,
      };
    })
    .filter(Boolean);
}
