# PLATFORM_NATIVE_MAP_PLUGIN

## 插件 ID

- `GXA-MapNative`

## 初始化链路

1. 页面调用 `getNativeMapBootstrapConfig()` 拉取 `/api/embed/config`
2. `NativeMapAdapter` 写入 `basemap/styleUrl/tilesUrl/center/zoom`
3. `NativeMapContainer` 调用 `mountPlatformNativeMap()`
4. `platformNativeMapPlugin.js` 调用原生插件 `mount`
5. Android 插件加载 `android/assets/gxa-map-native/index.html`，渲染底图

## mount 参数

```json
{
  "containerId": "intelligenceNativeMap",
  "center": [113.4445, 22.4915],
  "zoom": 13,
  "layers": ["places", "shops"],
  "basemap": {
    "provider": "platform-config",
    "source": "embed-config",
    "tilesUrl": "http://159.75.54.99:8002/tiles/city.pmtiles",
    "styleUrl": "http://159.75.54.99:8002/map-resources/styles/amap-like.json",
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
- `destroy(options)`

## getCapabilities 约定

当前插件返回：

- `rendersBasemap: true`
- `supportsMarkers: true`
- `supportsViewportInset: true`
- `engine: "android-webview-maplibre-pmtiles"`
- `status: "ready"`

## 事件回传结构

统一事件结构：

```json
{
  "type": "ready",
  "payload": {},
  "message": "",
  "ts": 1712050000000
}
```

当前已回传事件：

- `bridgeReady`
- `ready`
- `mapClick`
- `markerClick`
- `moveEnd`
- `zoomEnd`
- `error`

## URL 处理策略

插件运行页会对 `styleUrl` 做资源绝对化处理：

- `sprite`
- `glyphs`
- `sources[*].url`
- `sources[*].tiles[]`

并把 `pmtiles://` 指向 `tilesUrl`，用于消费平台 PMTiles 资源。
