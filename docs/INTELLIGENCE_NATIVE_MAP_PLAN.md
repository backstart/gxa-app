# 情报页原生地图方案（当前状态）

## 分阶段落地状态

当前处于“阶段二稳定化”迭代：

- 页面层 / adapter 层 / service 层结构保持不变
- 默认承载继续是 `NativeMapAdapter`
- 插件内核为 Android 原生 MapView 渲染
- `WebViewMapAdapter` 仅作为 native 明确失败时兜底
- 已去掉首屏默认 preview 假地图闪现，改为轻量 loading
- 情报页容器 webview 背景改为透明，原生地图宿主下沉到根视图底层，确保顶部与 BottomSheet 可见
- 已引入 native 启动状态机，避免 `plugin-not-render-ready` 过早触发 WebView fallback

## 当前默认链路

1. `pages/index/index.vue` 渲染情报页
2. `useIntelligencePage.js` 初始化地图配置、列表与面板
3. `nativeMap.js` 拉取：
   - `GET /api/embed/config`
   - `GET /api/embed/layers`（非首屏阻塞）
   - `GET /api/embed/bbox`
   - `GET /api/embed/geojson/{type}`
   - `GET /api/embed/object/{type}/{id}`
4. `NativeMapAdapter` 输出统一地图控制协议
5. `platformNativeMapPlugin.js` 调用 `GXA-MapNative`
6. 插件原生渲染底图并回传事件

## 关键能力

- 原生底图：`styleUrl + tilesUrl`
- marker：`setMarkers`
- 相机：`updateCamera/flyTo`
- 面板避让：`setViewportInset`（在 map 未 ready 前也会先作用于原生容器边距）
- 图层切换：`setActiveLayers`（基于 `/api/embed/layers` 的 key/entityType 映射）
- GeoJSON：`drawGeoJSON`
- 对象选中：`selectObject`

## 与 WebView 路径关系

- Native 是正式路径
- WebView 是 fallback/debug 路径
- `nativeplugins/GXA-MapNative/android/assets/gxa-map-native/index.html` 仅保留 legacy/debug，不再是主路径

## 首屏与容错策略

- 首屏关键请求只有 `/api/embed/config`，`/api/embed/layers` 改为预热请求，不阻塞首屏出图
- `/api/embed/*` 请求超时统一为 `30000ms`
- 请求失败日志包含：`path`、`url`、`elapsed`、`detail`，便于定位具体超时接口
- native 启动状态机：`idle -> checking -> mounting -> ready/failed`
- `plugin-not-render-ready` 归类为 `mounting` 阶段等待状态，不再直接 fallback
- 仅当插件缺失、运行时依赖缺失、mount 失败、原生渲染明确报错、或 ready 超时（15s）时才触发 WebView fallback
- 进入 WebView fallback 后，不再请求 native 扩展接口（`/api/embed/geojson/*`、`/api/embed/bbox`）

## 当前限制

- 原生层当前聚焦最小可用能力，复杂符号化渲染仍可继续增强
- `setActiveLayers` 仍依赖服务端 key/entityType 与样式层命名的一致性

## 下一步建议

1. 对 style layer 与业务 layer key 建立可配置映射（服务端下发）
2. 增加对象高亮样式（非仅相机定位）
3. 加入离线缓存与瓦片预取策略（内网弱网场景）
