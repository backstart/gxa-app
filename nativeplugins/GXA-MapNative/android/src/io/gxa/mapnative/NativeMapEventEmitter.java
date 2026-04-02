package io.gxa.mapnative;

import androidx.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.bridge.UniJSCallback;

final class NativeMapEventEmitter {
    private UniJSCallback callback;

    void bind(@Nullable UniJSCallback target) {
        callback = target;
    }

    void emit(String type, @Nullable Object payload, @Nullable String message) {
        if (callback == null) {
            return;
        }

        Map<String, Object> event = new HashMap<>();
        event.put("type", type == null ? "unknown" : type);
        event.put("payload", payload);
        event.put("message", message == null ? "" : message);
        event.put("ts", System.currentTimeMillis());
        callback.invokeAndKeepAlive(event);
    }
}

