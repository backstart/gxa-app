# 情报页地图接入修复说明

## 当前默认嵌入地址

`gxa-app` 情报页默认不再加载旧的静态嵌入页：

```text
http://159.75.54.99:8002/map-resources/embedded.html
```

当前默认改为：

```text
http://159.75.54.99:8002/embed/map
```

在 `APP-PLUS` 宿主下，默认会追加轻量模式参数：

```text
http://159.75.54.99:8002/embed/map?...&lite=1
```

对应配置文件：

- `pages/index/intelligence/services/mapEmbed.js`

## 根因

旧地址来自 `fuyaomapweb/public/map-resources/embedded.html`，这是一条早期静态兼容方案。

它的问题是：

- 页面直接加载 `public/map-resources/vendor/maplibre-gl.js`
- 该 vendor 文件不会经过 Vite 构建转译
- 在 Android WebView 下会先发生语法兼容错误
- 地图运行时因此进一步出现 `maplibregl is not defined`

所以旧 `embedded.html` 不能继续作为情报页默认地图承载方式。

## 当前页面结构

情报页入口：

- `pages/index/index.vue`

地图容器：

- `pages/index/intelligence/components/MapContainer.vue`

地图 adapter：

- `pages/index/intelligence/adapters/map/WebViewMapAdapter.js`

地图地址配置：

- `pages/index/intelligence/services/mapEmbed.js`

## 当前接入方式

页面仍然保持：

- 地图背景层
- 底部三态面板
- 搜索框
- 快捷入口
- 情报卡片列表

地图层默认直接接入真正嵌入路由 `/embed/map`，不再默认经过旧 static embedded.html。

但在 `APP-PLUS` 下，不再默认直接启动远程地图内核，而是优先进入嵌入轻量模式，避免当前 Android WebView 中 `MapLibre/WebGL` 初始化触发原生崩溃。

## fallback 与 debug

本地桥接页仍保留，但只作为调试 fallback。

调试开关：

- `intelligence_map_debug_fallback`
- `intelligence_map_debug_hud`
- `intelligence_map_force_lite`
- `intelligence_map_force_kernel`

示例：

```js
uni.setStorageSync('intelligence_map_debug_fallback', '1');
uni.setStorageSync('intelligence_map_debug_hud', '1');
uni.setStorageSync('intelligence_map_force_lite', '1');
```

如需强制测试远程地图内核：

```js
uni.setStorageSync('intelligence_map_force_kernel', '1');
```

## Android WebView 兼容性

地图平台侧已改为优先使用真正嵌入路由：

- `/embed/map`
- `/map/embed`

并在 `fuyaomapweb` 中将 Vite 构建目标下调到：

- `chrome61`

这样地图代码会进入正常构建产物，而不是直接执行旧 vendor 文件。

目前进一步验证结果是：

1. 本地 `web-view` 承载稳定
2. 远程轻量嵌入页稳定
3. 仅远程地图内核初始化会触发 App 原生崩溃

因此当前产品策略是：`APP-PLUS` 默认使用嵌入轻量模式，不影响其他 Web 项目继续正常使用地图内核。

当前首页处理方式：

1. `APP-PLUS` 下情报页背景直接加载 `/embed/map?...&lite=1`
2. 该页面显示轻量地图预览背景，不启动 `MapLibre/WebGL`
3. `kernel=1` 只用于地图实验页，不作为首页默认链路

## 本地运行

### gxa-app

1. 用 HBuilderX 打开 `D:\Code\gxa\gxa-app`
2. 运行到 App 端
3. 进入 tabbar 的“情报”页

### fuyaomapweb

```bash
cd D:\Code\map\fuyaomapweb
npm install
npm run build
```

## 验证项

1. 情报页不再显示 `Fuyao Embedded Map`、`VIEW / Failed`、`/map-resources/embedded.html`
2. 页面背景可见真实地图
3. 底部面板可在 `collapsed / half / full` 三态切换
4. 点击快捷入口后卡片列表切换
5. 地图失败时页面不会白屏，底部面板仍可用
