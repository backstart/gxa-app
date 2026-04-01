# 情报页地图默认加载修复说明

## 本次修复目标

本次只修复 `gxa-app` 的情报 tabbar 页面，不重写其他业务模块。

修复内容：

- 情报页默认不再显示本地 `GXA Map Bridge / MOCK / READY` 占位地图
- 默认加载真实地图地址 `http://159.75.54.99:8002/map`
- 地图承载仍保留桥接层，便于后续替换为原生地图
- 底部面板继续使用三态结构：`collapsed / half / full`
- 快捷入口切换继续驱动卡片列表和地图 marker 联动
- 本地 mock 地图改为 debug fallback，不再作为默认展示

## 涉及文件

- `pages/index/index.vue`
- `pages/index/intelligence/components/MapContainer.vue`
- `pages/index/intelligence/services/mapEmbed.js`
- `static/map/fuyaomap-bridge.html`

## 默认地图配置

地图地址配置集中在 `pages/index/intelligence/services/mapEmbed.js`。

默认值：

- 页面地址：`http://159.75.54.99:8002/map`
- 嵌入地址：`http://159.75.54.99:8002/map-resources/embedded.html`

可选本地覆盖键：

- `intelligence_map_page_url`
- `intelligence_map_embed_url`
- `intelligence_map_debug_fallback`
- `intelligence_map_debug_hud`

示例：

```js
uni.setStorageSync('intelligence_map_page_url', 'http://159.75.54.99:8002/map');
uni.setStorageSync('intelligence_map_embed_url', 'http://159.75.54.99:8002/map-resources/embedded.html');
uni.setStorageSync('intelligence_map_debug_fallback', '1');
uni.setStorageSync('intelligence_map_debug_hud', '1');
```

## 当前页面行为

### 默认路径

1. 情报页进入 `pages/index/index.vue`
2. `MapContainer.vue` 承载 `web-view`
3. `mapEmbed.js` 生成桥接页地址
4. `static/map/fuyaomap-bridge.html` 默认加载真实嵌入页
5. 底部面板独立展示搜索框、快捷入口和情报卡片

### 调试回退路径

仅当 `intelligence_map_debug_fallback=1` 时：

- 桥接页才会启用本地 mock 地图
- 便于在真实桥接异常时排查页面联动

仅当 `intelligence_map_debug_hud=1` 时：

- 才会显示桥接调试 HUD

## 验证方式

### 本地运行

1. 使用 HBuilderX 打开 `D:\Code\gxa\gxa-app`
2. 运行到 App 端
3. 打开 tabbar 的“情报”页

### 验证项

1. 地图默认显示真实地图，不应再看到 `GXA Map Bridge / MOCK / READY`
2. 底部面板可在 `collapsed / half / full` 三态之间切换
3. 点击“警情 / 场所 / 人员 / 处警 / 巡防”后，卡片列表切换
4. 点击卡片后，页面不应因地图桥接未完全就绪而阻塞
5. 打开 `intelligence_map_debug_fallback=1` 后，才出现本地 mock 地图

## 后续建议

- 如果 Fuyao embed 页补充更完整的宿主协议，可继续完善 `WebViewMapAdapter.js`
- 后续替换为 `NativeMapAdapter.js` 时，页面层和底部面板结构无需重写
