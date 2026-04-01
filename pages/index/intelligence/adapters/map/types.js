export const MAP_ADAPTER_TYPES = {
  WEBVIEW: 'webview',
  NATIVE: 'native',
};

/**
 * @typedef {Object} IMapAdapter
 * @property {(payload?: object) => void} init
 * @property {() => void} destroy
 * @property {(center: number[]|{lng:number,lat:number}|string) => void} setCenter
 * @property {(zoom: number|string) => void} setZoom
 * @property {(payload?: object) => void} flyTo
 * @property {(marker: object) => void} addMarker
 * @property {(markers?: object[]) => void} addMarkers
 * @property {() => void} clearMarkers
 * @property {(layers?: string[]) => void} setActiveLayers
 * @property {(featureCollection?: object) => void} drawGeoJSON
 * @property {(object?: object) => void} selectObject
 * @property {(inset?: object) => void} setViewportInset
 */

export const MAP_ADAPTER_METHODS = [
  'init',
  'destroy',
  'setCenter',
  'setZoom',
  'flyTo',
  'addMarker',
  'addMarkers',
  'clearMarkers',
  'setActiveLayers',
  'drawGeoJSON',
  'selectObject',
  'setViewportInset',
];

export const MAP_EVENT_TYPES = {
  READY: 'ready',
  MAP_CLICK: 'mapClick',
  MARKER_CLICK: 'markerClick',
  OBJECT_SELECT: 'objectSelect',
  MOVE_END: 'moveEnd',
  ZOOM_END: 'zoomEnd',
  LAYERS_CHANGE: 'layersChange',
  MARKERS_CHANGE: 'markersChange',
  ERROR: 'error',
};

export const MAP_BRIDGE_SOURCE = 'GxaMapBridge';
export const MAP_HOST_SOURCE = 'GxaMapHost';

export const MAP_ADAPTER_TODO = 'TODO: replace NativeMapAdapter preview renderer with a real native-view / 原生地图实现 when plugin/runtime is ready.';

export function isMapAdapter(value) {
  return MAP_ADAPTER_METHODS.every((method) => typeof value?.[method] === 'function');
}
