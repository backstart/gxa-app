# GXA-MapNative（Android 原生地图插件）

## 当前集成方式

- `nativeplugins/GXA-MapNative/package.json`
  - `_dp_nativeplugin.android.integrateType = "aar"`
- 产物模式：AAR 集成（`android/GXA-MapNative-release.aar`）
- 关键变化：MapLibre 依赖（maplibre sdk/gestures/geojson/turf + timber）已并入插件 AAR，避免运行时缺类。
- 注意：**kotlin/okhttp/okio 不再并入插件 AAR**，避免云打包与宿主依赖发生 `DuplicateClasses`。

## 为什么这样改

此前使用 AAR 预编译模式时，MapLibre 运行时在部分自定义基座版本上会丢失，真机运行时报：

- `native dependency missing: org.maplibre.android.MapLibre`

改为 fat-aar 后，MapLibre 运行时随插件一起打包，运行时类可见性更稳定。

## Android 构建配置

文件：`nativeplugins/GXA-MapNative/android/build.gradle`

- `implementation 'org.maplibre.gl:android-sdk:11.13.5'`
- `implementation 'org.maplibre.gl:android-sdk-geojson:6.0.1'`
- `namespace 'io.gxa.mapnative'`
- 仓库使用 `google()` + `mavenCentral()`

文件：`nativeplugins/GXA-MapNative/android/gradle.properties`

- 保留 AndroidX 配置，不再使用 fat-aar 兼容参数。

## 重新制作自定义基座

1. 在 HBuilderX 中确认插件目录为 `nativeplugins/GXA-MapNative` 且 `integrateType=aar`。
2. 重新制作自定义调试基座（Android）。
3. 卸载旧基座并安装新基座后再运行情报页。
4. 建议同步提升 `manifest.json` 版本号，确保手机端不会“版本相同跳过更新”。

## 如何验证依赖已生效

### 真机验证

- `getCapabilities()` 返回：
  - `status = ready`
  - `reason = runtime-ready`
- 不再出现：`native dependency missing: org.maplibre.android.MapLibre`
- `mount()` 后可看到 `native-status` 的 `mount success`，并继续收到 `ready` 事件。

## 原生诊断说明

`GxaMapNativeModule` 已增强诊断：

- 区分：
  - `maplibre-class-missing`
  - `mapview-class-missing`
  - `activity-unavailable`
  - `controller-init-failed`
- `getCapabilities()` 返回 `status/reason/details`
- `mount()` 失败会标注 `stage`，便于真机快速定位失败阶段。
