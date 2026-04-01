# 情报页地图重构说明

## 1. 当前新结构

情报 tabbar 入口仍然是 `pages/index/index`，但页面实现已经从旧的单文件 `nvue` 改成分层结构：

- `pages/index/index.vue`
  页面装配层，负责组合地图容器、底部面板、搜索和卡片列表。
- `pages/index/intelligence/components/`
  纯展示组件：
  - `MapContainer.vue`
  - `BottomSheet.vue`
  - `SearchBar.vue`
  - `QuickActions.vue`
  - `IntelligenceCardList.vue`
- `pages/index/intelligence/composables/useIntelligencePage.js`
  页面状态管理、地图联动、列表加载和交互编排。
- `pages/index/intelligence/services/`
  情报数据与地图嵌入地址服务：
  - `intelligence.js`
  - `http.js`
  - `mapEmbed.js`
- `pages/index/intelligence/adapters/map/`
  地图适配层：
  - `types.js`
  - `createMapAdapter.js`
  - `WebViewMapAdapter.js`
  - `NativeMapAdapter.js`
- `static/map/fuyaomap-bridge.html`
  第一阶段 web-view 过渡桥接页。

## 2. 各层分工

### 页面层

负责：

- 搜索框和搜索状态
- 快捷入口切换
- 底部三态面板
- 情报卡片列表
- 页面状态编排
- 触发 service 拉数
- 调用地图 adapter

### 地图承载层

当前由 `MapContainer.vue + WebViewMapAdapter.js + static/map/fuyaomap-bridge.html` 组成。

负责：

- 承载 web-view
- 统一地图控制方法
- 标准化地图事件
- 隔离 `web-view` 和 `evalJS` 细节

### service 层

负责：

- 情报页数据读取
- gxa-api 请求兜底
- mock fallback
- 地图点位数据转换
- 生成地图嵌入地址

### adapter 层

负责：

- 定义统一地图接口
- 将页面层的地图操作转为底层命令
- 将底层地图事件转成页面层消费的标准事件

## 3. 为什么先用 web-view 过渡

当前仓库不是 uni-app x 项目，也没有原生地图容器和 native-view 管线。

因此第一阶段先使用 web-view 承载地图 embed 页，优先达成：

- 情报页结构拆分
- 地图控制抽象
- 页面层和地图层解耦
- 后续平滑替换底层渲染实现

这样后续切换到原生地图时，重点改 adapter 和 `MapContainer`，页面层尽量不重写。

## 4. 后续替换为 native-view / 原生地图的方法

当前已经预留了 `NativeMapAdapter.js` 占位文件。

后续替换建议：

1. 在 `MapContainer.vue` 中新增原生承载分支。
2. 实现 `NativeMapAdapter.js` 的同名方法：
   - `init`
   - `setCenter`
   - `setZoom`
   - `flyTo`
   - `addMarker`
   - `addMarkers`
   - `clearMarkers`
   - `setActiveLayers`
   - `drawGeoJSON`
   - `selectObject`
3. 保持 `useIntelligencePage.js` 不改或少改。

## 5. 地图 embed 页接入方式

当前 app 不直接依赖 Fuyao embed 页内部消息细节，而是走桥接页：

- app 页面 -> `WebViewMapAdapter`
- `WebViewMapAdapter` -> `static/map/fuyaomap-bridge.html`
- bridge 页 -> Fuyao embed 页 或 本地 mock

真实地图接入方式：

1. `mapEmbed.js` 默认指向：
   - 页面地址 `http://159.75.54.99:8002/map`
   - 嵌入地址 `http://159.75.54.99:8002/map-resources/embedded.html`
2. 如需覆盖，可写入本地存储：
   - `intelligence_map_page_url`
   - `intelligence_map_embed_url`
3. bridge 页内部使用 iframe 转发宿主命令并回传标准事件

调试回退方式：

- 默认不再显示本地 mock 地图
- 仅在设置 `intelligence_map_debug_fallback=1` 时进入 mock 模式
- 仅在设置 `intelligence_map_debug_hud=1` 时显示桥接调试 HUD

## 6. 页面状态流转

主要状态：

- 面板状态：`collapsed | half | full`
- 当前域：`alerts | places | people | handling | patrol`
- 搜索词：输入态和提交态分离
- 列表项：当前域列表
- 地图状态：点位、图层、选中对象、视口

基本流程：

1. 页面展示时拉取 summary 和默认域列表
2. service 返回标准化情报数据
3. composable 把数据同步到地图 adapter
4. 地图 adapter 更新 marker / layer
5. 用户点击快捷入口
6. 页面切域并刷新列表
7. 地图同步切换 marker 和图层
8. 用户点击卡片
9. 地图定位并高亮当前对象
10. 地图事件回传后更新页面选中态

## 7. 本地运行与验证

### 启动方式

本项目当前更适合通过 HBuilderX 运行：

1. 打开 `D:\Code\gxa\gxa-app`
2. 运行到 App 或 H5

### 可选配置

如果要接入真实接口或覆盖默认地图地址，可在运行环境里设置：

- `gxa_api_base_url`
- `intelligence_map_page_url`
- `intelligence_map_embed_url`
- `intelligence_map_debug_fallback`
- `intelligence_map_debug_hud`

可以通过 `uni.setStorageSync` 在调试时写入。

示例：

```js
uni.setStorageSync('gxa_api_base_url', 'http://你的-gxa-api-host');
uni.setStorageSync('intelligence_map_page_url', 'http://你的-fuyaomapweb-host/map');
uni.setStorageSync('intelligence_map_embed_url', 'http://你的-fuyaomapweb-host/map-resources/embedded.html');
uni.setStorageSync('intelligence_map_debug_fallback', '1');
uni.setStorageSync('intelligence_map_debug_hud', '1');
```

### 验证项

1. 地图是否正常显示
   - 默认应直接加载真实地图嵌入页
   - 打开 `intelligence_map_debug_fallback=1` 后，才应显示本地 mock 地图

2. 底部面板是否可切换三态
   - 点击拖拽条可在折叠、半屏、全屏间切换
   - 手势上滑下滑后应自动吸附到最近状态

3. 搜索与快捷入口是否联动
   - 点击“场所/人员/警情/处警/巡防”后，列表切换
   - 地图 marker 同步变化

4. 地图事件是否回传页面
   - 点击地图 mock 区域应触发 `mapClick`
   - 点击 marker 应触发 `markerClick`
   - 点击卡片后应触发地图选中或飞行定位

## 8. 当前未完成项

- `NativeMapAdapter.js` 仍是占位实现
- `setViewportInset` 在真实 Fuyao embed 页中仍是桥接层保留接口，未直接驱动真实地图 padding
- `drawGeoJSON` 暂为预留命令，当前未在真实 embed 页落地
- gxa-api 的情报聚合接口尚未稳定，当前仍以 mock fallback 为主

## 9. 建议下一步

1. 在 gxa-api 增加情报聚合接口，替换 `intelligence.js` 的 mock 主路径。
2. 给 Fuyao embed 页补充统一的 `viewport padding` 控制接口。
3. 落地 `NativeMapAdapter`，将地图渲染从 web-view 迁移到 native-view / 原生组件。
