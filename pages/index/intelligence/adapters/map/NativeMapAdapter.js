import { MAP_ADAPTER_TODO } from './types.js';

export class NativeMapAdapter {
  constructor(options = {}) {
    this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : null;
  }

  init() {
    console.log('[NativeMapAdapter]', MAP_ADAPTER_TODO);
  }

  setHost() {}

  setSource() {}

  setCenter() {}

  setZoom() {}

  flyTo() {}

  addMarker() {}

  addMarkers() {}

  clearMarkers() {}

  setActiveLayers() {}

  drawGeoJSON() {}

  selectObject() {}

  setViewportInset() {}

  handleMessageEvent() {}

  destroy() {}
}
