package io.gxa.nfchce;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.nfc.NfcAdapter;
import android.nfc.cardemulation.CardEmulation;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

/**
 * uni-app 原生模块入口。
 * JS 通过 uni.requireNativePlugin("GXA-NfcHce") 调用本类公开方法。
 */
public class NfcHceModule extends UniModule {
    private static UniJSCallback keepAliveCallback;
    private static final String HCE_AID = "F0010203040506";

    private static void emit(String type, String message) {
        // 统一回调结构，JS 侧按 type/message 解析即可。
        if (keepAliveCallback == null) return;
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("message", message == null ? "" : message);
        payload.put("ts", System.currentTimeMillis());
        keepAliveCallback.invokeAndKeepAlive(payload);
    }

    /**
     * HostApduService 内部事件转发到 JS 层。
     */
    public static void emitFromService(String type, String message) {
        emit(type, message);
    }

    @UniJSMethod(uiThread = true)
    public void onEvent(UniJSCallback callback) {
        // 通过 keepAlive 持续回调 READY/TAG_READ/SUCCESS/ERROR。
        keepAliveCallback = callback;
    }

    @UniJSMethod(uiThread = true)
    public void setPayload(String payload) {
        // JS 写入当前授权报文，供 HostApduService 在 READ DATA 时返回。
        NfcHceStore.setPayload(payload);
    }

    @UniJSMethod(uiThread = true)
    public void startSession(int timeoutSeconds) {
        // 启动前先做设备能力校验，防止 JS 侧误调用导致无响应。
        Context context = mUniSDKInstance == null ? null : mUniSDKInstance.getContext();
        if (context == null) {
            emit("ERROR", "上下文不可用");
            return;
        }

        NfcAdapter adapter = NfcAdapter.getDefaultAdapter(context);
        if (adapter == null) {
            emit("ERROR", "设备不支持NFC");
            return;
        }
        if (!adapter.isEnabled()) {
            emit("ERROR", "NFC未开启");
            return;
        }

        // 默认会话时长由 JS 传入（建议 300 秒），原生侧只做兜底校验。
        NfcHceStore.startSession(timeoutSeconds);

        // 前台优先路由：部分机型不主动分发 APDU 给三方 HCE，需显式设为 preferred service。
        try {
            if (context instanceof Activity) {
                Activity activity = (Activity) context;
                CardEmulation emulation = CardEmulation.getInstance(adapter);
                ComponentName service = new ComponentName(context, NfcHceHostService.class);
                boolean preferredOk = emulation.setPreferredService(activity, service);
                boolean defaultForAid = emulation.isDefaultServiceForAid(service, HCE_AID);
                emit("DEBUG", "PREFERRED_SERVICE_" + preferredOk);
                emit("DEBUG", "DEFAULT_FOR_AID_" + defaultForAid);
            } else {
                emit("DEBUG", "CONTEXT_NOT_ACTIVITY");
            }
        } catch (Throwable error) {
            emit("DEBUG", "PREFERRED_SERVICE_ERR_" + error.getClass().getSimpleName());
        }

        // READY 表示手机端已进入可读状态，提示用户靠近钥匙盒。
        emit("READY", "HCE会话已启动");
    }

    @UniJSMethod(uiThread = true)
    public void stopSession() {
        // 主动撤销前台优先路由，避免影响其它 NFC 应用。
        Context context = mUniSDKInstance == null ? null : mUniSDKInstance.getContext();
        try {
            if (context instanceof Activity) {
                NfcAdapter adapter = NfcAdapter.getDefaultAdapter(context);
                if (adapter != null) {
                    CardEmulation emulation = CardEmulation.getInstance(adapter);
                    emulation.unsetPreferredService((Activity) context);
                }
            }
        } catch (Throwable ignore) {
            // 忽略撤销异常，避免影响 stop 主流程。
        }

        NfcHceStore.stopSession();
        // 主动停止会话属于正常流程（页面退出/用户取消），不作为错误上报。
        emit("STOPPED", "SESSION_STOPPED");
    }

    @UniJSMethod(uiThread = true)
    public Map<String, Object> getSessionStatus() {
        // 提供会话状态查询，支持“页面退出后重新进入”时恢复 UI 提示。
        Map<String, Object> payload = new HashMap<>();
        payload.put("active", NfcHceStore.isActive());
        payload.put("remainingSeconds", NfcHceStore.getRemainingSeconds());
        payload.put("used", NfcHceStore.isUsed());
        return payload;
    }
}
