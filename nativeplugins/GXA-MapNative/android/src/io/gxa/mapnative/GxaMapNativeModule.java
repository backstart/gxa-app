package io.gxa.mapnative;

import android.app.Activity;

import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

public class GxaMapNativeModule extends UniModule {
    private static final NativeMapEventEmitter emitter = new NativeMapEventEmitter();
    @Nullable
    private static NativeMapController controller;

    @UniJSMethod(uiThread = true)
    public Map<String, Object> getCapabilities() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("rendersBasemap", true);
        payload.put("supportsMarkers", true);
        payload.put("supportsViewportInset", true);
        payload.put("provider", "gxa-platform");
        payload.put("engine", "maplibre-android-native");
        payload.put("status", "ready");
        return payload;
    }

    @UniJSMethod(uiThread = true)
    public void onEvent(UniJSCallback callback) {
        emitter.bind(callback);
        emitter.emit("bridgeReady", null, "native bridge ready");
    }

    @UniJSMethod(uiThread = true)
    public void mount(JSONObject options) {
        JSONObject payload = options == null ? new JSONObject() : options;
        GxaMapNativeStore.setMountOptions(payload);
        GxaMapNativeStore.setCameraState(extractCameraFromMount(payload));
        GxaMapNativeStore.setMounted(true);

        Activity activity = getActivity();
        if (activity == null) {
            emitter.emit("error", null, "activity unavailable");
            return;
        }

        if (controller == null) {
            controller = new NativeMapController(emitter);
        }
        controller.mount(activity, payload);
        controller.setViewportInset(GxaMapNativeStore.getViewportInset());
        controller.setActiveLayers(GxaMapNativeStore.getActiveLayers());
        controller.drawGeoJson(GxaMapNativeStore.getGeoJson());
        controller.selectObject(GxaMapNativeStore.getSelectedObject());
        controller.setMarkers(GxaMapNativeStore.getMarkers());
    }

    @UniJSMethod(uiThread = true)
    public void updateCamera(JSONObject options) {
        JSONObject payload = options == null ? new JSONObject() : options;
        GxaMapNativeStore.setCameraState(payload);
        if (controller != null) {
            controller.updateCamera(payload);
        }
    }

    @UniJSMethod(uiThread = true)
    public void setMarkers(JSONArray value) {
        GxaMapNativeStore.setMarkers(value);
        if (controller != null) {
            controller.setMarkers(GxaMapNativeStore.getMarkers());
        }
    }

    @UniJSMethod(uiThread = true)
    public void setViewportInset(JSONObject inset) {
        GxaMapNativeStore.setViewportInset(inset);
        if (controller != null) {
            controller.setViewportInset(GxaMapNativeStore.getViewportInset());
        }
    }

    @UniJSMethod(uiThread = true)
    public void setActiveLayers(JSONArray value) {
        GxaMapNativeStore.setActiveLayers(value);
        if (controller != null) {
            controller.setActiveLayers(GxaMapNativeStore.getActiveLayers());
        }
    }

    @UniJSMethod(uiThread = true)
    public void drawGeoJSON(JSONObject value) {
        GxaMapNativeStore.setGeoJson(value);
        if (controller != null) {
            controller.drawGeoJson(GxaMapNativeStore.getGeoJson());
        }
    }

    @UniJSMethod(uiThread = true)
    public void selectObject(JSONObject value) {
        GxaMapNativeStore.setSelectedObject(value);
        if (controller != null) {
            controller.selectObject(GxaMapNativeStore.getSelectedObject());
        }
    }

    @UniJSMethod(uiThread = true)
    public void destroy(JSONObject options) {
        if (controller != null) {
            controller.destroy();
            controller = null;
        }
        GxaMapNativeStore.reset();
        emitter.emit("destroy", options == null ? new HashMap<>() : jsonToMap(options), "destroyed");
    }

    @Nullable
    private Activity getActivity() {
        if (mUniSDKInstance == null) {
            return null;
        }
        if (mUniSDKInstance.getContext() instanceof Activity) {
            return (Activity) mUniSDKInstance.getContext();
        }
        return null;
    }

    private static JSONObject extractCameraFromMount(JSONObject mountOptions) {
        JSONObject camera = new JSONObject();
        if (mountOptions == null) {
            return camera;
        }
        try {
            Object center = mountOptions.opt("center");
            Object zoom = mountOptions.opt("zoom");
            camera.put("center", center == null ? new JSONArray() : center);
            camera.put("zoom", zoom);
        } catch (Throwable ignore) {
            // noop
        }
        return camera;
    }

    private static Map<String, Object> jsonToMap(JSONObject value) {
        Map<String, Object> result = new HashMap<>();
        if (value == null) {
            return result;
        }
        JSONArray names = value.names();
        if (names == null) {
            return result;
        }
        for (int i = 0; i < names.length(); i++) {
            String key = names.optString(i);
            if (key == null || key.isEmpty()) {
                continue;
            }
            result.put(key, value.opt(key));
        }
        return result;
    }
}
