package io.gxa.mapnative;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.util.Base64;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

/**
 * GXA native map module.
 *
 * Implementation notes:
 * - Render engine: Android WebView + local MapLibre/PMTiles runtime in plugin assets.
 * - Basemap input: styleUrl + tilesUrl from /api/embed/config.
 * - UI host: attach native view on top of activity, reserve bottom inset for panel interaction.
 */
public class GxaMapNativeModule extends UniModule {
    private static final String ASSET_INDEX_URL = "file:///android_asset/gxa-map-native/index.html";
    private static final String JS_BRIDGE_NAME = "GxaNativeBridge";
    private static final int DEFAULT_TOP_INSET_PX = 64;

    private static UniJSCallback keepAliveCallback;
    private static FrameLayout mapHost;
    private static WebView mapWebView;

    private static void emit(String type, @Nullable Object payload, @Nullable String message) {
        if (keepAliveCallback == null) return;
        Map<String, Object> event = new HashMap<>();
        event.put("type", type == null ? "unknown" : type);
        event.put("payload", payload);
        event.put("message", message == null ? "" : message);
        event.put("ts", System.currentTimeMillis());
        keepAliveCallback.invokeAndKeepAlive(event);
    }

    @UniJSMethod(uiThread = true)
    public Map<String, Object> getCapabilities() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("rendersBasemap", true);
        payload.put("supportsMarkers", true);
        payload.put("supportsViewportInset", true);
        payload.put("provider", "gxa-platform");
        payload.put("engine", "android-webview-maplibre-pmtiles");
        payload.put("status", "ready");
        return payload;
    }

    @UniJSMethod(uiThread = true)
    public void onEvent(UniJSCallback callback) {
        keepAliveCallback = callback;
        emit("bridgeReady", null, "GXA-MapNative bridge ready");
    }

    @UniJSMethod(uiThread = true)
    public void mount(JSONObject options) {
        JSONObject payload = options == null ? new JSONObject() : options;
        GxaMapNativeStore.setMountOptions(payload);
        GxaMapNativeStore.setCameraState(extractCameraFromMount(payload));
        GxaMapNativeStore.setMounted(true);
        runOnUiThread(() -> {
            Activity activity = getActivity();
            if (activity == null) {
                emit("error", null, "activity unavailable");
                return;
            }
            ensureHost(activity);
            ensureWebView(activity);
            applyViewportInset();
            flushToJs();
            emit("mount", jsonToMap(payload), "mounted");
        });
    }

    @UniJSMethod(uiThread = true)
    public void updateCamera(JSONObject options) {
        GxaMapNativeStore.setCameraState(options);
        runOnUiThread(() -> {
            callJs("updateCamera", GxaMapNativeStore.getCameraState());
            emit("camera", jsonToMap(options), "camera updated");
        });
    }

    @UniJSMethod(uiThread = true)
    public void setMarkers(JSONArray value) {
        GxaMapNativeStore.setMarkers(value);
        runOnUiThread(() -> {
            callJs("setMarkers", GxaMapNativeStore.getMarkers());
            Map<String, Object> payload = new HashMap<>();
            payload.put("count", GxaMapNativeStore.getMarkers().length());
            emit("markersChange", payload, "markers updated");
        });
    }

    @UniJSMethod(uiThread = true)
    public void setViewportInset(JSONObject inset) {
        GxaMapNativeStore.setViewportInset(inset);
        runOnUiThread(() -> {
            applyViewportInset();
            callJs("setViewportInset", GxaMapNativeStore.getViewportInset());
        });
    }

    @UniJSMethod(uiThread = true)
    public void setActiveLayers(JSONArray value) {
        GxaMapNativeStore.setActiveLayers(value);
        runOnUiThread(() -> callJs("setActiveLayers", GxaMapNativeStore.getActiveLayers()));
    }

    @UniJSMethod(uiThread = true)
    public void destroy(JSONObject options) {
        GxaMapNativeStore.reset();
        runOnUiThread(() -> {
            if (mapWebView != null) {
                try {
                    mapWebView.loadUrl("about:blank");
                    mapWebView.removeJavascriptInterface(JS_BRIDGE_NAME);
                    mapWebView.stopLoading();
                    mapWebView.destroy();
                } catch (Throwable ignore) {
                    // noop
                }
            }
            if (mapHost != null) {
                Object parent = mapHost.getParent();
                if (parent instanceof ViewGroup) {
                    ((ViewGroup) parent).removeView(mapHost);
                }
            }
            mapWebView = null;
            mapHost = null;
            emit("destroy", jsonToMap(options), "destroyed");
        });
    }

    private void runOnUiThread(@NonNull Runnable action) {
        Activity activity = getActivity();
        if (activity == null) {
            action.run();
            return;
        }
        activity.runOnUiThread(action);
    }

    @Nullable
    private Activity getActivity() {
        if (mUniSDKInstance == null) return null;
        if (mUniSDKInstance.getContext() instanceof Activity) {
            return (Activity) mUniSDKInstance.getContext();
        }
        return null;
    }

    private void ensureHost(@NonNull Activity activity) {
        if (mapHost != null) {
            if (mapHost.getParent() == null) {
                attachHost(activity);
            }
            return;
        }
        mapHost = new FrameLayout(activity);
        mapHost.setTag("gxa-map-native-host");
        mapHost.setBackgroundColor(Color.TRANSPARENT);
        attachHost(activity);
    }

    private void attachHost(@NonNull Activity activity) {
        ViewGroup root = activity.findViewById(android.R.id.content);
        if (root == null || mapHost == null) return;
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        );
        mapHost.setLayoutParams(params);
        root.addView(mapHost);
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    private void ensureWebView(@NonNull Activity activity) {
        if (mapWebView != null) return;
        mapWebView = new WebView(activity);
        mapWebView.setBackgroundColor(Color.TRANSPARENT);
        mapWebView.addJavascriptInterface(new JsBridge(), JS_BRIDGE_NAME);
        mapWebView.setWebChromeClient(new WebChromeClient());
        mapWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                flushToJs();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                String message = error == null ? "unknown webview error" : String.valueOf(error.getDescription());
                emit("error", null, message);
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                String message = description == null ? "unknown webview error" : description;
                emit("error", null, message);
            }
        });

        WebSettings settings = mapWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        if (mapHost != null) {
            mapHost.removeAllViews();
            mapHost.addView(mapWebView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));
        }

        mapWebView.loadUrl(ASSET_INDEX_URL);
    }

    private void applyViewportInset() {
        if (mapHost == null) return;
        int topInset = DEFAULT_TOP_INSET_PX;
        int rightInset = 0;
        int bottomInset = 0;
        int leftInset = 0;
        JSONObject inset = GxaMapNativeStore.getViewportInset();
        if (inset != null) {
            topInset = Math.max(0, inset.optInt("top", DEFAULT_TOP_INSET_PX));
            rightInset = Math.max(0, inset.optInt("right", 0));
            bottomInset = inset.optInt("bottom", 0);
            leftInset = Math.max(0, inset.optInt("left", 0));
        }
        if (bottomInset < 0) bottomInset = 0;

        ViewGroup.LayoutParams layoutParams = mapHost.getLayoutParams();
        if (layoutParams instanceof FrameLayout.LayoutParams) {
            FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) layoutParams;
            params.topMargin = topInset;
            params.rightMargin = rightInset;
            params.bottomMargin = bottomInset;
            params.leftMargin = leftInset;
            mapHost.setLayoutParams(params);
        }
    }

    private void flushToJs() {
        callJs("mount", GxaMapNativeStore.getMountOptions());
        callJs("updateCamera", GxaMapNativeStore.getCameraState());
        callJs("setMarkers", GxaMapNativeStore.getMarkers());
        callJs("setActiveLayers", GxaMapNativeStore.getActiveLayers());
        callJs("setViewportInset", GxaMapNativeStore.getViewportInset());
    }

    private void callJs(String method, Object payload) {
        if (mapWebView == null) return;
        String json = payloadToJson(payload);
        String encoded = Base64.encodeToString(json.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
        String script = "window.__GXA_NATIVE_MAP__&&window.__GXA_NATIVE_MAP__." + method + "('" + encoded + "');";
        mapWebView.evaluateJavascript(script, null);
    }

    private String payloadToJson(Object payload) {
        if (payload == null) return "{}";
        if (payload instanceof JSONObject) return ((JSONObject) payload).toString();
        if (payload instanceof JSONArray) return ((JSONArray) payload).toString();
        return String.valueOf(payload);
    }

    private Map<String, Object> jsonToMap(JSONObject value) {
        Map<String, Object> result = new HashMap<>();
        if (value == null) return result;
        JSONArray names = value.names();
        if (names == null) return result;
        for (int i = 0; i < names.length(); i++) {
            String key = names.optString(i);
            if (key == null) continue;
            result.put(key, value.opt(key));
        }
        return result;
    }

    private JSONObject extractCameraFromMount(JSONObject mountOptions) {
        JSONObject camera = new JSONObject();
        if (mountOptions == null) return camera;
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

    private static final class JsBridge {
        @JavascriptInterface
        public void postEvent(String payload) {
            if (payload == null || payload.isEmpty()) return;
            try {
                JSONObject json = new JSONObject(payload);
                String type = json.optString("type", "unknown");
                Object eventPayload = json.has("payload") ? json.opt("payload") : null;
                String message = json.optString("message", "");
                if ("ready".equalsIgnoreCase(type)) {
                    GxaMapNativeStore.setPageReady(true);
                }
                emit(type, eventPayload, message);
            } catch (Throwable error) {
                emit("error", null, "bridge parse error: " + error.getMessage());
            }
        }
    }
}
