# 情报页原生地图方案（运行态对齐版）

## 2026-04-02 依赖接入收口

- `GXA-MapNative` 当前保持 `integrateType = aar`，但 AAR 已切换为 fat-aar 产物。
- MapLibre Android 运行时（class + so）已内嵌到插件 AAR，避免仅编译可见、运行时缺类。
- 插件 `getCapabilities()` 与 `mount()` 已增强诊断，能区分：
  - `maplibre-class-missing`
  - `mapview-class-missing`
  - `activity-unavailable`
  - `controller-init-failed`

> 只有在依赖接入真实可用（`status=ready`）后，页面层状态治理才有意义继续推进。

## 当前真实行为

- 情报页地图默认走 `NativeMapContainer` + `GXA-MapNative`。
- 首屏不再渲染 preview 假地图；只显示统一 loading 遮罩，等待原生地图 ready。
- tabbar 切换回情报页时，会创建新的 `page session`，并通过 `mapSessionKey` 强制重建地图容器。
- 地图请求链路保持：
  - 首屏关键请求：`GET /api/embed/config`
  - 非首屏阻塞请求：`/api/embed/layers`、`/api/embed/bbox`、`/api/embed/geojson/*`、`/api/embed/object/*`

## 关键修复点

### 1) 首屏闪屏治理

- `NativeMapContainer` 去掉默认 preview 渲染路径。
- 增加统一启动遮罩：`checking/mounting/not-ready` 时显示 loading，避免透明页透出旧页面内容。
- 仅在失败时显示简洁失败卡片，debug 模式下才展示失败原因文本。

### 2) 地图初始化与恢复

- `MapContainer` 增加 `sessionKey`，native/webview 子容器按 key 重建。
- `useIntelligencePage` 在 `onShow` 生成新 session，`onHide` 销毁 mapController，确保原生宿主生命周期收口。
- `nativeMap.js` 增加 basemap 字段兜底：当后端配置缺字段时，回落到
  - `styleUrl: /map-resources/styles/amap-like.json`
  - `tilesUrl: /tiles/city.pmtiles`
  - `nativeTileUrlTemplate: /api/embed/native/tiles/{z}/{x}/{y}.pbf?pmtilesUrl={pmtilesUrl}`
- Android 插件 manifest 明确 `usesCleartextTraffic=true`，避免 HTTP 地图资源在原生层被系统策略阻断。

### 3) tabbar 切换后的状态隔离

- `useIntelligencePage` 引入 page session 与 request sequence 双重防护：
  - 切页后旧请求回包不会覆盖当前页状态
  - action/搜索切换后旧请求回包不会覆盖当前 action
- `onHide` 统一清理：
  - `mapController`
  - 启动超时 timer
  - viewport debounce timer
  - pending payload / map data sync 标记
- 关键状态在 session 中重建或重新拉取，避免跨 tab 污染。

## 启动状态机

- `idle -> checking -> mounting -> ready/failed`
- `plugin-not-render-ready` 仍归类为 `mounting` 等待态。
- 仅明确失败原因才进入 `failed`。

## 超时与失败策略

- `/api/embed/*` 请求 timeout 统一 `30000ms`。
- 非关键请求失败仅记录日志，不改写首屏控制流。
- stale response 会被丢弃，不再污染当前页面。

## 当前入口与主控

- 情报页入口：`pages/index/index.vue`
- 地图容器：`pages/index/intelligence/components/MapContainer.vue`
- 原生容器：`pages/index/intelligence/components/NativeMapContainer.vue`
- 页面状态主控：`pages/index/intelligence/composables/useIntelligencePage.js`
- 请求与超时：`pages/index/intelligence/services/nativeMap.js`
