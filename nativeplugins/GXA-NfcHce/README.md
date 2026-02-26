# GXA-NfcHce（Android）

## 说明
本插件用于 uni-app APP-PLUS Android 环境下的 NFC HCE（Host Card Emulation）卡模拟。

手机端通过 `setPayload` 写入授权数据，钥匙盒（STM32 + NFC 读卡器）读取到 APDU 响应后即可执行开箱。

## JS 调用接口
- `setPayload(payloadString)`
- `startSession(timeoutSeconds)`
- `stopSession()`
- `onEvent(callback)` 回调事件：`READY` / `TAG_READ` / `SUCCESS` / `ERROR`

## AID
当前示例 AID：`F0010203040506`

## 目录
- `android/src/io/gxa/nfchce/NfcHceModule.java`
- `android/src/io/gxa/nfchce/NfcHceHostService.java`
- `android/src/io/gxa/nfchce/NfcHceStore.java`
- `android/res/xml/apduservice.xml`
- `android/AndroidManifest.xml`

## 注意
1. 设备需支持 NFC + HCE（Android 5.0+）。
2. 正式环境请替换共享密钥与签名策略。
3. 若项目使用离线打包，请确保本地原生插件已被 HBuilderX 正确识别并参与构建。
