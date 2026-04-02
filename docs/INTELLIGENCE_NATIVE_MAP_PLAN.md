# 情报页原生地图承载说明

## 当前默认承载路径

情报页默认走 `NativeMapAdapter`，并优先探测 `GXA-MapNative` 插件：

1. `pages/index/intelligence/services/mapEmbed.js` 默认适配器是 `native`
2. `platformNativeMapPlugin.js` 调用 `GXA-MapNative.getCapabilities()`
3. 当 `rendersBasemap=true` 时直接走原生插件渲染底图
4. 仅当插件缺失或明确报错时，才回退 `WebViewMapAdapter`

## 分层结构

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

- `pages/index/intelligence/adapters/map/NativeMapAdapter.js`
- `pages/index/intelligence/adapters/map/WebViewMapAdapter.js`

service 层：

- `pages/index/intelligence/services/nativeMap.js`
- `pages/index/intelligence/services/intelligence.js`
- `pages/index/intelligence/services/platformNativeMapPlugin.js`

## GXA-MapNative 当前能力

插件入口：

- `nativeplugins/GXA-MapNative/android/src/io/gxa/mapnative/GxaMapNativeModule.java`

状态缓存：

- `nativeplugins/GXA-MapNative/android/src/io/gxa/mapnative/GxaMapNativeStore.java`

内置地图运行页：

- `nativeplugins/GXA-MapNative/android/assets/gxa-map-native/index.html`

当前已支持：

- 底图渲染（消费 `styleUrl + tilesUrl`）
- `center/zoom` 相机更新
- marker 同步与点击事件
- 视口 inset 同步（底部面板避让）
- 地图事件回传：`ready/mapClick/markerClick/moveEnd/zoomEnd/error`

## 数据来源

原生地图初始化配置由 `nativeMap.js` 拉取：

- `GET /api/embed/config`

关键字段：

- `defaultCenter`
- `defaultZoom`
- `styleUrl`
- `tilesUrl`
- `defaultLayers`

点位联动由 `nativeMap.js` 拉取：

- `GET /api/embed/bbox`

## Native 与 WebView 职责

`NativeMapAdapter`：

- 正式默认路径
- 负责地图承载、事件回传、面板联动

`WebViewMapAdapter`：

- 仅失败兜底与调试路径
- 默认不启用

## 当前限制与下一步

当前 `GXA-MapNative` 仍是“插件 + 内置地图内核”方案，不是纯 Android 地图库直连渲染。下一步建议：

1. 补齐 `drawGeoJSON/selectObject` 的插件侧实现
2. 把 `setActiveLayers` 从关键字匹配升级为配置映射
3. 评估替换为纯原生地图引擎（保留现有 adapter/service 层不变）
