# PLATFORM_NATIVE_MAP_PLUGIN

## 当前实现结论

`GXA-MapNative` 默认承载路径已经切到 Android 原生 Map 引擎，不再依赖 `android/assets/gxa-map-native/index.html` 作为主渲染内核。

当前主引擎：

- `engine: maplibre-android-native`
- `rendersBasemap: true`

## 初始化链路

1. 页面层通过 `nativeMap.js` 请求 `GET /api/embed/config`
2. `NativeMapAdapter` 把 `styleUrl/tilesUrl/defaultCenter/defaultZoom/layerConfig` 写入状态
3. `NativeMapContainer` 调用 `mountPlatformNativeMap()`
4. `platformNativeMapPlugin.js` 调用插件 `mount(...)`
5. Android 插件：
   - 读取 style JSON
   - 把 `pmtiles://` source 改写为 `/api/embed/native/tiles/{z}/{x}/{y}.pbf?pmtilesUrl=...`
   - 用原生 MapView 加载 style

## mount 参数

```json
{
  "containerId": "intelligenceNativeMap",
  "center": [113.3926, 22.5159],
  "zoom": 11.8,
  "layers": ["shops", "areas"],
  "layerConfig": [
    { "key": "shops", "entityType": "shop", "name": "店铺", "minZoom": 12 },
    { "key": "areas", "entityType": "area", "name": "区域", "minZoom": 9 }
  ],
  "basemap": {
    "provider": "platform-config",
    "source": "embed-config",
    "tilesUrl": "http://159.75.54.99:8002/tiles/city.pmtiles",
    "styleUrl": "http://159.75.54.99:8002/map-resources/styles/amap-like.json",
    "nativeTileUrlTemplate": "http://159.75.54.99:8002/api/embed/native/tiles/{z}/{x}/{y}.pbf?pmtilesUrl={pmtilesUrl}",
    "kind": "platform-config"
  }
}
```

## 支持的方法

- `getCapabilities()`
- `onEvent(callback)`
- `mount(options)`
- `updateCamera(options)`
- `setMarkers(markers)`
- `setViewportInset(inset)`
- `setActiveLayers(layers)`
- `drawGeoJSON(featureCollection)`
- `selectObject(object)`
- `destroy(options)`

## 事件回传

统一结构：

```json
{
  "type": "ready",
  "payload": {},
  "message": "",
  "ts": 1712050000000
}
```

事件类型：

- `bridgeReady`
- `ready`
- `mapClick`
- `markerClick`
- `moveEnd`
- `zoomEnd`
- `objectSelect`
- `error`

## legacy/debug 说明

`android/assets/gxa-map-native/index.html` 仍保留在仓库中，仅用于兼容或调试。默认承载链路不再使用该 HTML 内核。
