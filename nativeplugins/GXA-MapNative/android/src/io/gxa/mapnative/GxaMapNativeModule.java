package io.gxa.mapnative;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.Nullable;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

public class GxaMapNativeModule extends UniModule {
    private static final String TAG = "GxaMapNative";
    private static final String ENGINE_NAME = "maplibre-android-native";
    private static final String MAPLIBRE_CLASS = "org.maplibre.android.MapLibre";
    private static final String MAPVIEW_CLASS = "org.maplibre.android.maps.MapView";
    private static final NativeMapEventEmitter emitter = new NativeMapEventEmitter();

    @Nullable
    private static NativeMapController controller;

    @UniJSMethod(uiThread = true)
    public Map<String, Object> getCapabilities() {
        RuntimeCheck runtime = inspectRuntime();
        Map<String, Object> payload = new HashMap<>();
        payload.put("rendersBasemap", runtime.ready);
        payload.put("supportsMarkers", runtime.ready);
        payload.put("supportsViewportInset", runtime.ready);
        payload.put("provider", "gxa-platform");
        payload.put("engine", ENGINE_NAME);
        payload.put("status", runtime.status);
        payload.put("reason", runtime.reason);
        payload.put("details", runtime.details());
        return payload;
    }

    @UniJSMethod(uiThread = true)
    public void onEvent(UniJSCallback callback) {
        emitter.bind(callback);
        emitter.emit("bridgeReady", null, "native bridge ready");
    }

    @UniJSMethod(uiThread = true)
    public void mount(JSONObject options) {
        String stage = "mount-received";
        JSONObject payload = options == null ? new JSONObject() : options;
        JSONObject basemap = payload.optJSONObject("basemap");
        String sourceType = basemap == null ? "" : basemap.optString("sourceType", "");
        String styleUrl = basemap == null ? "" : basemap.optString("styleUrl", "");
        String tilesUrl = basemap == null ? "" : basemap.optString("tilesUrl", "");
        String nativeTileUrlTemplate = basemap == null ? "" : basemap.optString("nativeTileUrlTemplate", "");
        Map<String, Object> basemapInfo = new HashMap<>();
        basemapInfo.put("sourceType", sourceType);
        basemapInfo.put("styleUrl", styleUrl);
        basemapInfo.put("tilesUrl", tilesUrl);
        basemapInfo.put("nativeTileUrlTemplate", nativeTileUrlTemplate);
        emitter.emit("basemap", basemapInfo, "module mount basemap");
        Log.i(TAG, "mount basemap sourceType=" + sourceType
            + " styleUrl=" + styleUrl
            + " tilesUrl=" + tilesUrl
            + " nativeTileUrlTemplate=" + nativeTileUrlTemplate);
        GxaMapNativeStore.setMountOptions(payload);
        GxaMapNativeStore.setCameraState(extractCameraFromMount(payload));
        GxaMapNativeStore.setMounted(true);

        RuntimeCheck runtime = inspectRuntime();
        stage = "runtime-check";
        if (!runtime.ready) {
            emitMountError(stage, runtime.reason, runtime.details());
            return;
        }

        stage = "activity-check";
        Activity activity = getActivity();
        if (activity == null) {
            Map<String, Object> extra = runtime.details();
            extra.put("stage", stage);
            extra.put("uniContext", mUniSDKInstance == null || mUniSDKInstance.getContext() == null
                ? "null"
                : mUniSDKInstance.getContext().getClass().getName());
            emitMountError(stage, "activity-unavailable", extra);
            return;
        }

        try {
            stage = "controller-init";
            if (controller == null) {
                controller = new NativeMapController(emitter);
            }

            stage = "controller-mount";
            controller.mount(activity, payload);

            stage = "state-sync";
            controller.setViewportInset(GxaMapNativeStore.getViewportInset());
            controller.setActiveLayers(GxaMapNativeStore.getActiveLayers());
            controller.drawGeoJson(GxaMapNativeStore.getGeoJson());
            controller.selectObject(GxaMapNativeStore.getSelectedObject());
            controller.setMarkers(GxaMapNativeStore.getMarkers());

            Map<String, Object> info = runtime.details();
            info.put("stage", "ready");
            emitter.emit("native-status", info, "mount success");
            Log.i(TAG, "mount success");
        } catch (Throwable error) {
            Map<String, Object> extra = runtime.details();
            extra.put("stage", stage);
            extra.put("errorClass", error.getClass().getName());
            extra.put("errorMessage", String.valueOf(error.getMessage()));
            emitMountError(stage, "controller-init-failed", extra);
        }
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
    public void setMarkers(String value) {
        GxaMapNativeStore.setMarkers(parseArrayPayload(value));
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
    public void setActiveLayers(String value) {
        GxaMapNativeStore.setActiveLayers(parseArrayPayload(value));
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

    private void emitMountError(String stage, String reason, Map<String, Object> extra) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("stage", stage);
        payload.put("reason", reason);
        if (extra != null && !extra.isEmpty()) {
            payload.putAll(extra);
        }
        String message = "mount failed at " + stage + ": " + reason;
        emitter.emit("error", payload, message);
        Log.e(TAG, message + " payload=" + payload);
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

    private static JSONArray parseArrayPayload(@Nullable String value) {
        if (value == null || value.trim().isEmpty()) {
            return new JSONArray();
        }
        try {
            return new JSONArray(value);
        } catch (JSONException error) {
            Log.w(TAG, "parse array payload failed, fallback to empty array: " + error.getMessage());
            return new JSONArray();
        }
    }

    private static RuntimeCheck inspectRuntime() {
        RuntimeCheck check = new RuntimeCheck();
        check.mapLibrePresent = checkClassPresent(MAPLIBRE_CLASS, check, "mapLibreMissing");
        check.mapViewPresent = checkClassPresent(MAPVIEW_CLASS, check, "mapViewMissing");
        check.ready = check.mapLibrePresent && check.mapViewPresent;

        if (check.ready) {
            check.status = "ready";
            check.reason = "runtime-ready";
        } else if (!check.mapLibrePresent) {
            check.status = "dependency-missing";
            check.reason = "maplibre-class-missing";
        } else {
            check.status = "dependency-missing";
            check.reason = "mapview-class-missing";
        }
        return check;
    }

    private static boolean checkClassPresent(String className, RuntimeCheck check, String key) {
        try {
            Class.forName(className);
            return true;
        } catch (Throwable error) {
            check.errors.put(key, error.getClass().getName() + ": " + String.valueOf(error.getMessage()));
            return false;
        }
    }

    private static final class RuntimeCheck {
        boolean ready;
        boolean mapLibrePresent;
        boolean mapViewPresent;
        String status = "unknown";
        String reason = "unknown";
        Map<String, Object> errors = new HashMap<>();

        Map<String, Object> details() {
            Map<String, Object> details = new HashMap<>();
            details.put("mapLibreClass", MAPLIBRE_CLASS);
            details.put("mapViewClass", MAPVIEW_CLASS);
            details.put("mapLibrePresent", mapLibrePresent);
            details.put("mapViewPresent", mapViewPresent);
            details.put("errors", new HashMap<>(errors));
            return details;
        }
    }
}
