# GXA-MapNative（Android 原生地图插件）

## 当前集成方式

- `nativeplugins/GXA-MapNative/package.json`
  - `_dp_nativeplugin.android.integrateType = "aar"`
- 产物模式：预编译 AAR
- 关键变化：AAR 通过 **fat-aar** 将 `org.maplibre.gl:android-sdk:11.13.5` 及其运行时内容内嵌进插件产物，避免宿主运行时缺类。

## 为什么这样改

此前仅在 `build.gradle` 使用 `api 'org.maplibre.gl:android-sdk:11.13.5'`，生成的插件 AAR 不会自动携带 Maven 传递依赖；
HBuilderX 自定义基座集成本地插件 AAR 时，也不会替插件再解析 Maven 依赖，导致真机运行时报：

- `native dependency missing: org.maplibre.android.MapLibre`

现在改为 fat-aar 后，`GXA-MapNative-release.aar` 自身包含：

- `org/maplibre/android/MapLibre.class`
- `org/maplibre/android/maps/MapView.class`
- `jni/*/libmaplibre.so`

## Android 构建配置

文件：`nativeplugins/GXA-MapNative/android/build.gradle`

- `apply plugin: 'com.kezong.fat-aar'`
- `embed('org.maplibre.gl:android-sdk:11.13.5') { transitive = true }`
- `namespace 'io.gxa.mapnative'`
- 仓库增加 `https://jitpack.io`（用于 fat-aar 插件）

文件：`nativeplugins/GXA-MapNative/android/gradle.properties`

- 增加：`android.experimental.legacyTransform.forceNonIncremental=true`

## 重新生成 AAR

在 `D:\Code\gxa\gxa-app\nativeplugins\GXA-MapNative\android` 执行：

```powershell
$env:JAVA_HOME='C:\Users\ckstart\AppData\Local\Temp\msjdk11\jdk-11.0.30+7'
$env:ANDROID_HOME='C:\Users\ckstart\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT='C:\Users\ckstart\AppData\Local\Android\Sdk'
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
.\gradlew.bat --no-daemon clean assembleRelease
Copy-Item .\build\outputs\aar\GXA-MapNative-android-release.aar .\GXA-MapNative-release.aar -Force
```

## 重新制作自定义基座

1. 在 HBuilderX 中确认插件目录为 `nativeplugins/GXA-MapNative` 且 `integrateType=aar`。
2. 重新制作自定义调试基座（Android）。
3. 卸载旧基座并安装新基座后再运行情报页。

## 如何验证依赖已生效

### 1) 离线验证 AAR 内容

```powershell
# 检查类
jar tf .\build\outputs\aar\GXA-MapNative-android-release.aar | findstr /i "org/maplibre/android/MapLibre.class"
# 检查 so
jar tf .\build\outputs\aar\GXA-MapNative-android-release.aar | findstr /i "libmaplibre.so"
```

### 2) 真机验证

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
