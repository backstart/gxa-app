# 情报页原生地图承载分阶段方案

## 当前分阶段策略

本轮改造按三步推进：

1. 阶段一：先把情报页的地图承载层抽象出来，页面层不再直接依赖 H5 `web-view`
2. 阶段二：在 `gxa-app` 内落一个最小可运行的 `NativeMapAdapter + NativeMapContainer`
3. 阶段三：把旧 H5 embed 页降级为兼容 / debug 路线，不再作为 App 默认正式承载方案

## 当前结构

情报页入口：

- `pages/index/index.vue`

页面层：

- `pages/index/index.vue`
- `pages/index/intelligence/composables/useIntelligencePage.js`

组件层：

- `pages/index/intelligence/components/MapContainer.vue`
- `pages/index/intelligence/components/NativeMapContainer.vue`
- `pages/index/intelligence/components/WebViewMapContainer.vue`
- `pages/index/intelligence/components/BottomSheet.vue`
- `pages/index/intelligence/components/SearchBar.vue`
- `pages/index/intelligence/components/QuickActions.vue`
- `pages/index/intelligence/components/IntelligenceCardList.vue`

adapter 层：

- `pages/index/intelligence/adapters/map/types.js`
- `pages/index/intelligence/adapters/map/createMapAdapter.js`
- `pages/index/intelligence/adapters/map/NativeMapAdapter.js`
- `pages/index/intelligence/adapters/map/WebViewMapAdapter.js`

service 层：

- `pages/index/intelligence/services/intelligence.js`
- `pages/index/intelligence/services/mapEmbed.js`
- `pages/index/intelligence/services/nativeMap.js`

## 页面层 / adapter 层 / service 层职责

页面层负责：

- 搜索框
- 快捷入口
- 底部三态面板
- 情报卡片列表
- 页面状态联动

adapter 层负责：

- 抽象统一地图接口
- 屏蔽原生承载与 WebView 承载差异
- 统一地图事件和地图控制命令

service 层负责：

- 情报 mock / 数据获取
- marker 数据转换
- 地图地址、fallback 条件与调试开关

## 统一地图接口

当前约定的方法：

- `init`
- `destroy`
- `setCenter`
- `setZoom`
- `flyTo`
- `addMarker`
- `addMarkers`
- `clearMarkers`
- `setActiveLayers`
- `drawGeoJSON`
- `selectObject`
- `setViewportInset`

当前约定的事件：

- `ready`
- `mapClick`
- `markerClick`
- `objectSelect`
- `moveEnd`
- `zoomEnd`
- `layersChange`
- `markersChange`
- `error`

## NativeMapAdapter 与 WebViewMapAdapter 的定位

`NativeMapAdapter`

- 当前是 App 侧原生优先承载骨架
- 在 `APP-PLUS` 下优先使用 uni-app 原生 `map` 组件承载
- 非 App 或原生能力不可用时回退到轻量预览渲染
- 不依赖 H5 `web-view` 作为默认首页承载
- 目标是后续继续替换成真正的 `native-view / 原生地图 SDK`

`WebViewMapAdapter`

- 保留为 fallback / debug / compatibility
- 不再作为默认正式承载方案
- 只在显式切到 `webview` 时启用

## 当前默认承载方式

当前默认策略：

- `gxa-app` 情报页优先走 `NativeMapAdapter`
- `WebViewMapAdapter` 仅作为 fallback
- `mapEmbed.js` 中仍保留 H5 embed 地址拼装能力，供兼容和实验页使用

默认适配器切换规则：

1. 若显式设置 `intelligence_map_force_native=1`，强制原生
2. 若显式设置 `intelligence_map_force_webview=1`，强制 WebView
3. 若设置 `intelligence_map_adapter=webview`，走 WebView
4. 其他情况默认 `native`

## 当前阶段完成情况

阶段一：

- 已完成
- 情报页已改成页面层 + adapter/service 层结构
- 页面不再把 H5 embed 协议写死在页面逻辑里

阶段二：

- 已完成最小可用骨架
- 已落 `NativeMapContainer` 和 `NativeMapAdapter`
- `APP-PLUS` 下已优先切到 uni-app 原生 `map` 组件
- 已接入 `/api/embed/config` 作为原生地图初始化配置来源
- 已接入 `/api/embed/geojson/{type}` 作为当前分类区域绘制来源
- 已接入 `/api/embed/object/{type}/{id}` 作为选中卡片的对象几何详情来源
- 当前仍不是正式地图 SDK 深度接入版，图层和 GeoJSON 能力还是最小可用

阶段三：

- 进行中
- H5 embed 页已经降级为兼容 / debug 路线
- 还需要在后续把真实原生地图能力补齐

## 当前已知限制

- 当前 `NativeMapAdapter` 还不是高德 / MapLibre 原生 SDK
- 当前原生容器支持中心点、缩放、marker、地图点击、区域变化、视口 inset 和基础 polygon
- 复杂矢量底图、真实 bbox 渲染、GeoJSON 全量渲染细节仍需下一阶段接入原生能力

## 后续剩余工作

1. 引入真正的原生地图运行时或插件
2. 用原生 SDK 替换 `NativeMapContainer` 的预览渲染实现
3. 增加真实视野查询、bbox 拉取和附近查询
4. 把对象详情联动从 mock fallback 收敛到真实业务对象 id
5. 把 WebView 路线进一步收口到实验页和兼容场景
