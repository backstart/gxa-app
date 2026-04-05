# 情报页原生地图方案（可见性收口版）

## 2026-04-04 关键变更

- `GXA-MapNative` 保持 `integrateType = aar`，并将 MapLibre 运行时（含 kotlin/okhttp/gestures）并入 `GXA-MapNative-release.aar`，避免 `maplibre-class-missing`。
- 底图来源拆分为三类并强制打日志：
  - `platform-real`
  - `platform-default-fallback`
  - `local-preview`
- `NativeMapContainer` 新增可见性状态收口：
  - `idle/checking/mounting/ready/failed/degraded`
  - 首屏只显示 loading，不再默认先闪 preview。
  - native 明确失败后进入 `degraded-preview`，保证地图区域不空白。
- 页面日志统一输出运行路径：`native-ready/native-mounting/native-runtime-missing/degraded-preview/degraded-webview`。
- 底图日志统一输出 `[map-basemap]`，可直接看到 `sourceType/styleUrl/tilesUrl/nativeTileUrlTemplate`。

## 当前真实行为

- 情报页地图默认走 `NativeMapContainer` + `GXA-MapNative`。
- 首屏优先尝试 native，`checking/mounting` 仅显示 loading。
- native 失败时不再灰底空白，切入 degraded preview（保留 marker 可视化）。
- 若 `sourceType=platform-real` 且 native 失败，自动切到 degraded webview 优先保留平台真实底图。
- tabbar 切换回情报页时，会创建新的 `page session`，并通过 `mapSessionKey` 强制重建地图容器。
- 地图请求链路保持：
  - 首屏关键请求：`GET /api/embed/config`
  - 非首屏阻塞请求：`/api/embed/layers`、`/api/embed/bbox`、`/api/embed/geojson/*`、`/api/embed/object/*`

## 关键修复点

### 1) 首屏闪屏治理

- preview 不再首屏默认展示。
- `checking/mounting` 显示 loading。
- native 明确失败才进入 `degraded-preview`。

### 2) 地图初始化与恢复

- `MapContainer` 增加 `sessionKey`，native/webview 子容器按 key 重建。
- `useIntelligencePage` 在 `onShow` 生成新 session，`onHide` 销毁 mapController，确保原生宿主生命周期收口。
- `nativeMap.js` 增加 basemap 字段兜底：当后端配置缺字段时，回落到
  - `styleUrl: /map-resources/styles/amap-like.json`
  - `tilesUrl: /tiles/city.pmtiles`
  - `nativeTileUrlTemplate: /api/embed/native/tiles/{z}/{x}/{y}.pbf?pmtilesUrl={pmtilesUrl}`
- Android 插件 manifest 明确 `usesCleartextTraffic=true`，避免 HTTP 地图资源在原生层被系统策略阻断。
- plugin 接入保持 aar 模式，更新 `GXA-MapNative-release.aar` 后需重新制作并安装新自定义基座（建议同步提升 manifest 版本号）。

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

- `idle -> checking -> mounting -> ready/failed -> degraded`
- `plugin-not-render-ready` 仍归类为 `mounting` 等待态。
- `failed` 表示 native 运行时失败；随后转入 `degraded` 保证地图可见。

## 超时与失败策略

- `/api/embed/*` 请求 timeout 统一 `30000ms`。
- 非关键请求失败仅记录日志，不改写首屏控制流。
- stale response 会被丢弃，不再污染当前页面。
- `plugin-runtime-missing`、`native-mount-failed` 等 native 失败仅触发 degraded，不再导致地图区空白。
- 平台底图可用性检查会先探测 `styleUrl`；探测失败会明确日志并降为 `platform-default-fallback`。

## 底图来源判定

- `/api/embed/config` 返回 `styleUrl/tilesUrl/nativeTileUrlTemplate` + `basemapSourceType`（以及 absolute 字段）。
- App 端 `nativeMap.js` 按顺序选择：
  - `platform-real`：优先使用服务端真实地址。
  - `platform-default-fallback`：仅在真实底图不可用时回落默认 `amap-like/city.pmtiles`。
  - `local-preview`：仅开发预览链路，不作为正式底图。
- 所有路径都会打印 `[map-basemap]`，用于真机快速确认当前是否为平台真实底图。

## 当前入口与主控

- 情报页入口：`pages/index/index.vue`
- 地图容器：`pages/index/intelligence/components/MapContainer.vue`
- 原生容器：`pages/index/intelligence/components/NativeMapContainer.vue`
- 页面状态主控：`pages/index/intelligence/composables/useIntelligencePage.js`
- 请求与超时：`pages/index/intelligence/services/nativeMap.js`
