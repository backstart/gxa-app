# GXA-MapNative（Android 原生渲染）

## 定位

`GXA-MapNative` 是情报页默认地图承载插件。

当前主路径已经从“插件 + 内置 HTML 地图内核”升级为：

- Android 原生 `MapView` 渲染（MapLibre Android SDK）
- 插件直接消费 `/api/embed/config` 提供的 `styleUrl + tilesUrl`
- 通过 `/api/embed/native/tiles/{z}/{x}/{y}.pbf` 代理 PMTiles 数据

`android/assets/gxa-map-native/index.html` 仅保留为 legacy/debug 兼容资源，不再是默认承载内核。

## 能力

- `rendersBasemap = true`
- `supportsMarkers = true`
- `supportsViewportInset = true`
- `engine = maplibre-android-native`
- 支持事件：
  - `ready`
  - `mapClick`
  - `markerClick`
  - `moveEnd`
  - `zoomEnd`
  - `objectSelect`
  - `error`

## JS 调用接口

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

## 关键目录

- `android/src/io/gxa/mapnative/GxaMapNativeModule.java`
- `android/src/io/gxa/mapnative/NativeMapController.java`
- `android/src/io/gxa/mapnative/NativeMapStyleResolver.java`
- `android/src/io/gxa/mapnative/GxaMapNativeStore.java`
