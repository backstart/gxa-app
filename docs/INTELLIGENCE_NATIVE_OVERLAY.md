# 情报页原生地图叠层说明

## 问题背景

在 App 端，原生地图视图不是普通 DOM。若直接全屏挂载原生地图，Web 层的 `z-index` 无法保证压在地图之上，表现为：顶部浮层与底部面板被原生层盖住。

## 当前处理方案（方案 A）

- 保持“地图铺底 + 面板浮层”方向，不改成上下分区布局
- 情报页仍由 `pages/index/index.vue` 承载：
  - 地图层：`MapContainer -> NativeMapContainer`
  - 浮层：`top-overlay`
  - 面板：`BottomSheet`
- 通过原生插件 `setViewportInset` 控制原生地图可视区域，给顶部和底部 UI 预留承载空间
  - `top-overlay` 使用顶部 inset
  - `BottomSheet` 三态切换驱动底部 inset 动态更新

## 关键实现点

1. `NativeMapController.setViewportInset()` 不再要求 map 必须 ready。
2. 在 map 初始化完成后，会再次应用最近一次 inset，避免启动时序导致的遮挡。
3. `NativeMapContainer` 首屏不再默认显示 preview 假地图，只显示 loading；native 失败才进入 preview/fallback。

## 后续增强原则

- 页面业务 UI 继续保留在页面层组件，不把业务卡片写入插件层
- 地图与 UI 的空间关系统一通过 `setViewportInset` 管理
- 若新增原生浮层能力，也应保持 `MapAdapter` 接口不变，避免页面层耦合平台实现
