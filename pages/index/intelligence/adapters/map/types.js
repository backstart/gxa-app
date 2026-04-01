export const MAP_ADAPTER_TYPES = {
  WEBVIEW: 'webview',
  NATIVE: 'native',
};

export const MAP_EVENT_TYPES = {
  READY: 'ready',
  MAP_CLICK: 'mapClick',
  MARKER_CLICK: 'markerClick',
  OBJECT_SELECT: 'objectSelect',
  MOVE_END: 'moveEnd',
  ZOOM_END: 'zoomEnd',
  LAYERS_CHANGE: 'layersChange',
  ERROR: 'error',
};

export const MAP_BRIDGE_SOURCE = 'GxaMapBridge';

export const MAP_ADAPTER_TODO = 'TODO: replace WebViewMapAdapter with NativeMapAdapter when native-view / 原生地图接入完成。';
