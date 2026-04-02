package io.gxa.mapnative;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Native map runtime state cache.
 * The module keeps a single map host instance and synchronizes state with JS bridge.
 */
public class GxaMapNativeStore {
    private static JSONObject mountOptions = new JSONObject();
    private static JSONObject cameraState = new JSONObject();
    private static JSONArray markers = new JSONArray();
    private static JSONObject viewportInset = new JSONObject();
    private static JSONArray activeLayers = new JSONArray();
    private static boolean pageReady = false;
    private static boolean mounted = false;

    public static synchronized void setMountOptions(JSONObject value) {
        mountOptions = value == null ? new JSONObject() : value;
    }

    public static synchronized JSONObject getMountOptions() {
        return mountOptions;
    }

    public static synchronized void setCameraState(JSONObject value) {
        cameraState = value == null ? new JSONObject() : value;
    }

    public static synchronized JSONObject getCameraState() {
        return cameraState;
    }

    public static synchronized void setMarkers(JSONArray value) {
        markers = value == null ? new JSONArray() : value;
    }

    public static synchronized JSONArray getMarkers() {
        return markers;
    }

    public static synchronized void setViewportInset(JSONObject value) {
        viewportInset = value == null ? new JSONObject() : value;
    }

    public static synchronized JSONObject getViewportInset() {
        return viewportInset;
    }

    public static synchronized void setActiveLayers(JSONArray value) {
        activeLayers = value == null ? new JSONArray() : value;
    }

    public static synchronized JSONArray getActiveLayers() {
        return activeLayers;
    }

    public static synchronized void setPageReady(boolean value) {
        pageReady = value;
    }

    public static synchronized boolean isPageReady() {
        return pageReady;
    }

    public static synchronized void setMounted(boolean value) {
        mounted = value;
    }

    public static synchronized boolean isMounted() {
        return mounted;
    }

    public static synchronized void reset() {
        mountOptions = new JSONObject();
        cameraState = new JSONObject();
        markers = new JSONArray();
        viewportInset = new JSONObject();
        activeLayers = new JSONArray();
        pageReady = false;
        mounted = false;
    }
}
