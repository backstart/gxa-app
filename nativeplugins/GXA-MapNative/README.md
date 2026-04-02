# GXA-MapNative（Android 最小可用）

## 说明

该插件是 `gxa-app` 情报页使用的自建底图原生插件。

目标：

- 不依赖第三方在线地图平台
- 由原生层承载内网地图底图
- JS 层通过统一接口传入：
  - `tilesUrl`
  - `styleUrl`
  - `center`
  - `zoom`
  - `markers`
  - `viewportInset`

## 当前阶段

当前已实现最小可用底图渲染链路：

- 引擎：Android 插件内置 MapLibre + PMTiles 运行页
- 资源来源：`/api/embed/config` 返回的 `styleUrl + tilesUrl`
- 能力：
  - `rendersBasemap = true`
  - `supportsMarkers = true`
  - `supportsViewportInset = true`
  - 基础事件：`ready/mapClick/markerClick/moveEnd/zoomEnd/error`

## JS 调用接口

- `getCapabilities()`
- `onEvent(callback)`
- `mount(options)`
- `updateCamera(options)`
- `setMarkers(markers)`
- `setViewportInset(inset)`
- `setActiveLayers(layers)`
- `destroy(options)`

## 后续原生实现建议

后续增强建议：

1. 进一步替换为纯原生地图 SDK 渲染（非 WebView 内核）
2. 补齐 GeoJSON 图层渲染与对象高亮
3. 完善多图层可见性控制策略

## 目录

- `android/src/io/gxa/mapnative/GxaMapNativeModule.java`
- `android/src/io/gxa/mapnative/GxaMapNativeStore.java`
