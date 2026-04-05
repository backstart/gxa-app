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
- App 端浮层改为 `subNVue` 原生覆盖层，不再依赖普通 Vue DOM 叠在地图上：
  - 地图层：`MapContainer`（native/degraded）
  - 覆盖层：`pages/index/overlay.nvue`
  - 通信桥：`pages/index/intelligence/services/intelligenceOverlayBridge.js`
- 首屏优先尝试 native，`checking/mounting` 不再独占灰底，容器会保持可见降级底图层。
- native 失败时不再灰底空白，切入 degraded 地图表面（优先 `degraded-platform-real`，其次 `degraded-platform-default-fallback`）。
- WebView 仅在显式开启 debug fallback 时启用，不再作为常规自动兜底。
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

- `idle -> checking -> waiting-basemap -> mounting -> ready/failed -> degraded`
- `plugin-not-render-ready` 仍归类为 `mounting` 等待态。
- `failed` 表示 native 运行时失败；随后转入 `degraded`，并通过可见地图表面路径兜底。

## 地图可见路径（新增）

- `[map-surface] path=native-platform-real`
- `[map-surface] path=native-platform-default-fallback`
- `[map-surface] path=degraded-platform-real`
- `[map-surface] path=degraded-platform-default-fallback`
- `[map-surface] path=preview-only`

说明：底图“来源类型”与“是否已有可见地图表面”已拆分。即便 `sourceType=platform-real`，只要 native 尚未出图，也会先进入 degraded 可见路径，避免灰底/空白。

## 2026-04-05 补充：App 端 overlay 改为 subNVue

- 根因：App 端 `web-view/native` 地图层是原生高层视图，普通 Vue DOM 无法稳定覆盖，继续调 `z-index/CSS` 无法根治“地图和面板轮流出现”。
- 方案：
  - App 端不再直接渲染 DOM 版 `top-overlay + BottomSheet`。
  - 改为 `subNVue` 承载顶部 pill 与 BottomSheet 全量内容。
  - H5/非 app-plus 仍保留 DOM 版 overlay 作为开发兜底。
- subNVue 查找顺序：
  - 优先 `uni.getSubNVueById('intelligence-overlay')`
  - 兜底 `currentWebview.getSubNVueById('intelligence-overlay')`
  - 仅两者都失败时才记录 `overlay-subnvue-missing`
- 通信模型：
  - 主页面 -> subNVue：`init/sync-state/sync-sheet-state`。
  - subNVue -> 主页面：`overlay-mounted/overlay-ready/search/select-action/select-card/navigate-card/change-sheet-state/keyword-change`。
- 稳定性收口：
  - 主页面 overlay 初始化支持重试（避免首帧拿不到 subNVue）。
  - DOM overlay 仅在收到 `overlay-mounted/overlay-ready` 后才隐藏，避免“地图有了但面板没了”。
  - overlay 事件按 `event.id` 去重，避免 `uni.$emit + evalJS` 双通道重复触发业务动作。

## 2026-04-05 补充：degraded 可见层与 preview-only 解耦

- 新增 `DegradedBasemapSurface`，当 `sourceType` 为 `platform-real` 或 `platform-default-fallback` 且 native 未 ready 时，优先显示可渲染的 degraded 底图层。
- degraded 底图不再走 `web-view -> degraded.html -> iframe -> /embed/map` 嵌套链路，改为独立最小页 `static/map/fuyaomap-degraded.html` 单页直渲染。
- `fuyaomap-degraded.html` 直接读取 `styleUrl/tilesUrl/nativeTileUrlTemplate` 初始化 MapLibre，成功后只回传 `source=degraded-basemap,type=ready`。
- `DegradedBasemapSurface` 生命周期改为：`idle -> loading -> visible-unconfirmed -> ready/failed`。
- 外层不再用“12 秒未收到 ready”直接判失败；超时改为长超时兜底（30 秒），且只在“完全无响应”时才失败。
- 一旦进入 `visible-unconfirmed`，不再自动卸载 degraded surface，避免 `degraded -> preview-only -> degraded` 循环抖动。
- `preview-only` 只在两种场景出现：
  - `styleUrl/tilesUrl` 不可用；
  - degraded 底图层初始化失败。
- 日志新增 `map-surface` 明细字段（`phase/src/styleUrl/tilesUrl/nativeTileUrlTemplate`），用于核对“底图来源”与“实际显示路径”是否一致。

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
