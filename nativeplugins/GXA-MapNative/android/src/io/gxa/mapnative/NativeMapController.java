package io.gxa.mapnative;

import android.app.Activity;
import android.graphics.Color;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;
import org.maplibre.android.MapLibre;
import org.maplibre.android.annotations.Marker;
import org.maplibre.android.annotations.MarkerOptions;
import org.maplibre.android.camera.CameraPosition;
import org.maplibre.android.camera.CameraUpdateFactory;
import org.maplibre.android.geometry.LatLng;
import org.maplibre.android.maps.MapView;
import org.maplibre.android.maps.MapLibreMap;
import org.maplibre.android.maps.Style;
import org.maplibre.android.style.layers.CircleLayer;
import org.maplibre.android.style.layers.FillLayer;
import org.maplibre.android.style.layers.Layer;
import org.maplibre.android.style.layers.LineLayer;
import org.maplibre.android.style.layers.Property;
import org.maplibre.android.style.sources.GeoJsonSource;
import org.maplibre.geojson.FeatureCollection;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

import static org.maplibre.android.style.layers.PropertyFactory.circleColor;
import static org.maplibre.android.style.layers.PropertyFactory.circleOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.circleRadius;
import static org.maplibre.android.style.layers.PropertyFactory.fillColor;
import static org.maplibre.android.style.layers.PropertyFactory.fillOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.lineColor;
import static org.maplibre.android.style.layers.PropertyFactory.lineOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.lineWidth;
import static org.maplibre.android.style.layers.PropertyFactory.visibility;

final class NativeMapController {
    private static final String GEOJSON_SOURCE_ID = "gxa-native-geojson-source";
    private static final String GEOJSON_FILL_LAYER_ID = "gxa-native-geojson-fill";
    private static final String GEOJSON_LINE_LAYER_ID = "gxa-native-geojson-line";
    private static final String GEOJSON_POINT_LAYER_ID = "gxa-native-geojson-point";

    private final NativeMapEventEmitter emitter;
    private final Map<String, Marker> markerById = new HashMap<>();
    private final Map<Long, String> markerIdByInternalId = new HashMap<>();
    private final List<String> activeLayers = new ArrayList<>();
    private final Map<String, List<String>> layerTokensByKey = new HashMap<>();
    private JSONObject latestViewportInset = new JSONObject();

    @Nullable
    private FrameLayout host;
    @Nullable
    private Activity activity;
    @Nullable
    private MapView mapView;
    @Nullable
    private MapLibreMap map;
    private double lastZoom = Double.NaN;

    NativeMapController(@NonNull NativeMapEventEmitter emitter) {
        this.emitter = emitter;
    }

    void mount(@NonNull Activity activity, @NonNull JSONObject options) {
        try {
            this.activity = activity;
            ensureHost(activity);
            parseLayerConfig(options.optJSONArray("layerConfig"));
            ensureMapView(activity, options);
            applyCamera(options.opt("center"), options.optDouble("zoom", 12d), true);
            setActiveLayers(options.optJSONArray("layers"));
            emitter.emit("mount", null, "mounted");
        } catch (Throwable error) {
            emitter.emit("error", null, "native mount failed: " + error.getMessage());
        }
    }

    void updateCamera(@Nullable JSONObject options) {
        if (options == null) {
            return;
        }
        applyCamera(options.opt("center"), options.optDouble("zoom", Double.NaN), false);
    }

    void setMarkers(@Nullable JSONArray markers) {
        if (map == null) {
            return;
        }
        clearMarkers();
        if (markers == null) {
            return;
        }

        for (int i = 0; i < markers.length(); i++) {
            JSONObject item = markers.optJSONObject(i);
            if (item == null) {
                continue;
            }
            String id = String.valueOf(item.opt("id"));
            double lng = item.optDouble("lng", Double.NaN);
            double lat = item.optDouble("lat", Double.NaN);
            if (id.isEmpty() || !Double.isFinite(lng) || !Double.isFinite(lat)) {
                continue;
            }

            Marker marker = map.addMarker(new MarkerOptions()
                .position(new LatLng(lat, lng))
                .title(item.optString("label", "")));
            markerById.put(id, marker);
            markerIdByInternalId.put(marker.getId(), id);
        }
    }

    void setViewportInset(@Nullable JSONObject inset) {
        if (inset == null) {
            return;
        }
        latestViewportInset = inset;
        int top = Math.max(0, inset.optInt("top", 56));
        int right = Math.max(0, inset.optInt("right", 0));
        int bottom = Math.max(0, inset.optInt("bottom", 0));
        int left = Math.max(0, inset.optInt("left", 0));
        if (map != null) {
            map.setPadding(left, top, right, bottom);
        }
    }

    void setActiveLayers(@Nullable JSONArray layers) {
        activeLayers.clear();
        List<String> allAvailableKeys = new ArrayList<>(layerTokensByKey.keySet());
        if (layers != null) {
            for (int i = 0; i < layers.length(); i++) {
                String key = layers.optString(i, "").trim();
                if (!key.isEmpty()) {
                    activeLayers.add(key.toLowerCase(Locale.ROOT));
                }
            }
        }
        if (activeLayers.isEmpty() && !allAvailableKeys.isEmpty()) {
            activeLayers.addAll(allAvailableKeys);
        }
        applyActiveLayers();
    }

    void drawGeoJson(@Nullable JSONObject featureCollection) {
        if (map == null) {
            return;
        }
        Style style = map.getStyle();
        if (style == null) {
            return;
        }

        ensureGeoJsonLayers(style);
        GeoJsonSource source = style.getSourceAs(GEOJSON_SOURCE_ID);
        if (source == null) {
            return;
        }

        try {
            String json = featureCollection == null ? "{\"type\":\"FeatureCollection\",\"features\":[]}" : featureCollection.toString();
            source.setGeoJson(FeatureCollection.fromJson(json));
        } catch (Throwable error) {
            emitter.emit("error", null, "drawGeoJSON failed: " + error.getMessage());
        }
    }

    void selectObject(@Nullable JSONObject object) {
        if (object == null || object.length() == 0) {
            return;
        }
        Object centerValue = object.opt("coordinate");
        if (!(centerValue instanceof JSONArray)) {
            centerValue = object.opt("center");
        }
        double zoom = object.optDouble("mapZoom", Double.NaN);
        applyCamera(centerValue, zoom, false);
        emitter.emit("objectSelect", object, "object selected");
    }

    void destroy() {
        if (map != null) {
            map = null;
        }
        clearMarkers();
        if (mapView != null) {
            mapView.onPause();
            mapView.onStop();
            mapView.onDestroy();
            mapView = null;
        }
        if (host != null) {
            Object parent = host.getParent();
            if (parent instanceof ViewGroup) {
                ((ViewGroup) parent).removeView(host);
            }
            host = null;
        }
        activity = null;
        activeLayers.clear();
        layerTokensByKey.clear();
        latestViewportInset = new JSONObject();
    }

    private void ensureHost(@NonNull Activity activity) {
        if (host != null && host.getParent() != null) {
            return;
        }
        if (host == null) {
            host = new FrameLayout(activity);
            host.setTag("gxa-map-native-host");
            host.setBackgroundColor(Color.TRANSPARENT);
        }

        ViewGroup root = activity.findViewById(android.R.id.content);
        if (root == null) {
            return;
        }
        if (host.getParent() == null) {
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            );
            root.addView(host, 0, params);
        }
    }

    private void ensureMapView(@NonNull Activity activity, @NonNull JSONObject mountOptions) throws Exception {
        if (mapView != null && map != null) {
            return;
        }

        MapLibre.getInstance(activity);
        mapView = new MapView(activity);
        mapView.onCreate(null);
        mapView.onStart();
        mapView.onResume();

        if (host != null) {
            host.removeAllViews();
            host.addView(mapView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));
        }

        mapView.getMapAsync(mapLibreMap -> {
            map = mapLibreMap;
            bindMapEvents();
            setViewportInset(latestViewportInset);
            loadStyle(mountOptions);
        });
    }

    private void loadStyle(@NonNull JSONObject mountOptions) {
        if (map == null) {
            return;
        }
        JSONObject basemap = mountOptions.optJSONObject("basemap");
        String styleUrl = basemap == null ? "" : basemap.optString("styleUrl", "");
        String tilesUrl = basemap == null ? "" : basemap.optString("tilesUrl", "");
        String nativeTileUrlTemplate = basemap == null ? "" : basemap.optString("nativeTileUrlTemplate", "");
        if (styleUrl.isEmpty() || tilesUrl.isEmpty()) {
            emitter.emit("error", null, "styleUrl/tilesUrl missing");
            return;
        }

        new Thread(() -> {
            try {
                String styleJson = NativeMapStyleResolver.resolveStyleJson(styleUrl, tilesUrl, nativeTileUrlTemplate);
                if (map == null) {
                    return;
                }
                Activity currentActivity = activity;
                if (currentActivity == null) {
                    return;
                }
                currentActivity.runOnUiThread(() -> {
                    if (map == null) {
                        return;
                    }
                    map.setStyle(new Style.Builder().fromJson(styleJson), style -> {
                        ensureGeoJsonLayers(style);
                        applyActiveLayers();
                        emitter.emit("ready", buildCameraPayload(), "native map ready");
                    });
                });
            } catch (Throwable error) {
                emitter.emit("error", null, "load style failed: " + error.getMessage());
            }
        }).start();
    }

    private void bindMapEvents() {
        if (map == null) {
            return;
        }

        map.addOnMapClickListener(point -> {
            JSONObject payload = new JSONObject();
            try {
                payload.put("lng", point.getLongitude());
                payload.put("lat", point.getLatitude());
            } catch (Throwable ignore) {
                // noop
            }
            emitter.emit("mapClick", payload, "");
            return false;
        });

        map.setOnMarkerClickListener(marker -> {
            String id = markerIdByInternalId.get(marker.getId());
            JSONObject payload = new JSONObject();
            try {
                payload.put("id", id == null ? "" : id);
                payload.put("lng", marker.getPosition().getLongitude());
                payload.put("lat", marker.getPosition().getLatitude());
            } catch (Throwable ignore) {
                // noop
            }
            emitter.emit("markerClick", payload, "");
            return false;
        });

        map.addOnCameraIdleListener(() -> {
            JSONObject payload = buildCameraPayload();
            double zoom = map == null ? Double.NaN : map.getCameraPosition().zoom;
            emitter.emit("moveEnd", payload, "");
            if (!Double.isNaN(lastZoom) && Math.abs(zoom - lastZoom) < 0.00001d) {
                return;
            }
            lastZoom = zoom;
            emitter.emit("zoomEnd", payload, "");
        });
    }

    private JSONObject buildCameraPayload() {
        JSONObject payload = new JSONObject();
        if (map == null) {
            return payload;
        }
        try {
            CameraPosition camera = map.getCameraPosition();
            JSONArray center = new JSONArray();
            center.put(camera.target.getLongitude());
            center.put(camera.target.getLatitude());
            payload.put("center", center);
            payload.put("zoom", camera.zoom);
        } catch (Throwable ignore) {
            // noop
        }
        return payload;
    }

    private void applyCamera(@Nullable Object centerValue, double zoom, boolean immediate) {
        if (map == null) {
            return;
        }

        LatLng current = map.getCameraPosition().target;
        LatLng target = current;
        if (centerValue instanceof JSONArray) {
            JSONArray center = (JSONArray) centerValue;
            double lng = center.optDouble(0, Double.NaN);
            double lat = center.optDouble(1, Double.NaN);
            if (Double.isFinite(lng) && Double.isFinite(lat)) {
                target = new LatLng(lat, lng);
            }
        }

        double targetZoom = Double.isFinite(zoom) ? zoom : map.getCameraPosition().zoom;
        if (immediate) {
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(target, targetZoom));
        } else {
            map.animateCamera(CameraUpdateFactory.newLatLngZoom(target, targetZoom), 450);
        }
    }

    private void ensureGeoJsonLayers(@NonNull Style style) {
        GeoJsonSource source = style.getSourceAs(GEOJSON_SOURCE_ID);
        if (source == null) {
            source = new GeoJsonSource(GEOJSON_SOURCE_ID, FeatureCollection.fromFeatures(new ArrayList<>()));
            style.addSource(source);
        }

        if (style.getLayer(GEOJSON_FILL_LAYER_ID) == null) {
            FillLayer fill = new FillLayer(GEOJSON_FILL_LAYER_ID, GEOJSON_SOURCE_ID);
            fill.setProperties(
                fillColor("#3b82f6"),
                fillOpacity(0.18f),
                visibility(Property.VISIBLE)
            );
            style.addLayer(fill);
        }

        if (style.getLayer(GEOJSON_LINE_LAYER_ID) == null) {
            LineLayer line = new LineLayer(GEOJSON_LINE_LAYER_ID, GEOJSON_SOURCE_ID);
            line.setProperties(
                lineColor("#1f6fe5"),
                lineWidth(2.4f),
                lineOpacity(0.92f),
                visibility(Property.VISIBLE)
            );
            style.addLayer(line);
        }

        if (style.getLayer(GEOJSON_POINT_LAYER_ID) == null) {
            CircleLayer circle = new CircleLayer(GEOJSON_POINT_LAYER_ID, GEOJSON_SOURCE_ID);
            circle.setProperties(
                circleColor("#ef4444"),
                circleRadius(4.8f),
                circleOpacity(0.94f),
                visibility(Property.VISIBLE)
            );
            style.addLayer(circle);
        }
    }

    private void applyActiveLayers() {
        if (map == null) {
            return;
        }
        Style style = map.getStyle();
        if (style == null) {
            return;
        }
        List<Layer> styleLayers = style.getLayers();
        if (styleLayers == null || styleLayers.isEmpty()) {
            return;
        }

        for (Layer layer : styleLayers) {
            String id = layer.getId() == null ? "" : layer.getId().toLowerCase(Locale.ROOT);
            boolean isBusiness = isBusinessLayer(id);

            if (!isBusiness || activeLayers.isEmpty()) {
                layer.setProperties(visibility(Property.VISIBLE));
                continue;
            }

            boolean visible = matchesAnyActiveLayer(id);
            layer.setProperties(visibility(visible ? Property.VISIBLE : Property.NONE));
        }
    }

    private void parseLayerConfig(@Nullable JSONArray layerConfig) {
        layerTokensByKey.clear();
        if (layerConfig == null || layerConfig.length() == 0) {
            installDefaultLayerConfig();
            return;
        }

        for (int i = 0; i < layerConfig.length(); i++) {
            JSONObject item = layerConfig.optJSONObject(i);
            if (item == null) {
                continue;
            }
            String key = item.optString("key", "").trim().toLowerCase(Locale.ROOT);
            if (key.isEmpty()) {
                continue;
            }
            String entityType = item.optString("entityType", "").trim().toLowerCase(Locale.ROOT);
            List<String> tokens = new ArrayList<>();
            tokens.add(key);
            if (!entityType.isEmpty()) {
                tokens.add(entityType);
            }
            layerTokensByKey.put(key, tokens);
        }

        if (layerTokensByKey.isEmpty()) {
            installDefaultLayerConfig();
        }
    }

    private void installDefaultLayerConfig() {
        layerTokensByKey.put("shops", toTokens("shops", "shop", "alert", "handling"));
        layerTokensByKey.put("areas", toTokens("areas", "area"));
        layerTokensByKey.put("pois", toTokens("pois", "poi", "people"));
        layerTokensByKey.put("places", toTokens("places", "place"));
        layerTokensByKey.put("boundaries", toTokens("boundaries", "boundary", "patrol"));
    }

    private List<String> toTokens(String... values) {
        List<String> tokens = new ArrayList<>();
        for (String value : values) {
            String item = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
            if (!item.isEmpty()) {
                tokens.add(item);
            }
        }
        return tokens;
    }

    private boolean isBusinessLayer(String layerId) {
        if (layerTokensByKey.isEmpty()) {
            return false;
        }
        for (List<String> tokens : layerTokensByKey.values()) {
            for (String token : tokens) {
                if (layerId.contains(token)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean matchesAnyActiveLayer(String layerId) {
        for (String key : activeLayers) {
            List<String> tokens = layerTokensByKey.get(key);
            if (tokens == null || tokens.isEmpty()) {
                if (layerId.contains(key)) {
                    return true;
                }
                continue;
            }
            for (String token : tokens) {
                if (layerId.contains(token)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void clearMarkers() {
        if (map != null) {
            map.clear();
        }
        markerById.clear();
        markerIdByInternalId.clear();
    }
}
