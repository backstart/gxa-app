package io.gxa.mapnative;

import androidx.annotation.NonNull;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

final class NativeMapStyleResolver {
    private static final int CONNECT_TIMEOUT_MS = 8_000;
    private static final int READ_TIMEOUT_MS = 8_000;

    private NativeMapStyleResolver() {
    }

    static String resolveStyleJson(@NonNull String styleUrl, @NonNull String tilesUrl, String nativeTileUrlTemplate) throws IOException, JSONException {
        String absoluteStyleUrl = toAbsoluteUrl(styleUrl, styleUrl);
        String styleRaw = fetchText(absoluteStyleUrl);
        JSONObject styleJson = new JSONObject(styleRaw);
        String tileApiTemplate = resolveNativeTileTemplate(absoluteStyleUrl, tilesUrl, nativeTileUrlTemplate);

        if (styleJson.has("glyphs")) {
            styleJson.put("glyphs", toAbsoluteUrl(styleJson.optString("glyphs"), absoluteStyleUrl));
        }
        if (styleJson.has("sprite")) {
            styleJson.put("sprite", toAbsoluteUrl(styleJson.optString("sprite"), absoluteStyleUrl));
        }

        JSONObject sources = styleJson.optJSONObject("sources");
        if (sources != null) {
            Iterator<String> keys = sources.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                JSONObject source = sources.optJSONObject(key);
                if (source == null) {
                    continue;
                }

                String sourceType = source.optString("type", "");
                String sourceUrl = source.optString("url", "");
                boolean isPmtiles = sourceUrl.startsWith("pmtiles://");

                if (isPmtiles) {
                    source.remove("url");
                    source.put("type", "vector");
                    source.put("tiles", new JSONArray().put(tileApiTemplate));
                    source.put("minzoom", source.optInt("minzoom", 0));
                    source.put("maxzoom", source.optInt("maxzoom", 14));
                    continue;
                }

                if (source.has("url")) {
                    source.put("url", toAbsoluteUrl(sourceUrl, absoluteStyleUrl));
                }

                JSONArray tiles = source.optJSONArray("tiles");
                if (tiles != null) {
                    JSONArray normalizedTiles = new JSONArray();
                    for (int i = 0; i < tiles.length(); i++) {
                        String tile = tiles.optString(i);
                        if (tile.startsWith("pmtiles://")) {
                            normalizedTiles.put(tileApiTemplate);
                        } else {
                            normalizedTiles.put(toAbsoluteUrl(tile, absoluteStyleUrl));
                        }
                    }
                    source.put("tiles", normalizedTiles);
                }
            }
        }

        return styleJson.toString();
    }

    static String buildNativeTileTemplate(@NonNull String styleUrl, @NonNull String tilesUrl) {
        String absoluteStyleUrl = toAbsoluteUrl(styleUrl, styleUrl);
        String absoluteTilesUrl = toAbsoluteUrl(tilesUrl, absoluteStyleUrl);
        URI styleUri = URI.create(absoluteStyleUrl);
        String origin = styleUri.getScheme() + "://" + styleUri.getAuthority();
        String encodedTilesUrl = URLEncoder.encode(absoluteTilesUrl, StandardCharsets.UTF_8);
        return origin + "/api/embed/native/tiles/{z}/{x}/{y}.pbf?pmtilesUrl=" + encodedTilesUrl;
    }

    static String resolveNativeTileTemplate(@NonNull String styleUrl, @NonNull String tilesUrl, String template) {
        String value = template == null ? "" : template.trim();
        if (value.isEmpty()) {
            return buildNativeTileTemplate(styleUrl, tilesUrl);
        }

        String absoluteTilesUrl = toAbsoluteUrl(tilesUrl, styleUrl);
        String normalizedTemplate = toAbsoluteUrl(value, styleUrl);
        String encodedTilesUrl = URLEncoder.encode(absoluteTilesUrl, StandardCharsets.UTF_8);
        return normalizedTemplate.replace("{pmtilesUrl}", encodedTilesUrl);
    }

    static String toAbsoluteUrl(String target, String baseUrl) {
        String value = target == null ? "" : target.trim();
        if (value.isEmpty()) {
            return "";
        }
        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value;
        }

        URI base = URI.create(baseUrl);
        if (value.startsWith("/")) {
            return base.getScheme() + "://" + base.getAuthority() + value;
        }

        String path = base.getPath();
        int slashIndex = path.lastIndexOf('/');
        String directory = slashIndex >= 0 ? path.substring(0, slashIndex + 1) : "/";
        return base.getScheme() + "://" + base.getAuthority() + directory + value;
    }

    private static String fetchText(String url) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) URI.create(url).toURL().openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "application/json");
        connection.setUseCaches(false);
        connection.connect();

        int statusCode = connection.getResponseCode();
        InputStream input = (statusCode >= 200 && statusCode < 300)
            ? connection.getInputStream()
            : connection.getErrorStream();
        if (input == null) {
            throw new IOException("style request failed with status " + statusCode);
        }

        try (InputStream stream = input; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = stream.read(buffer)) >= 0) {
                output.write(buffer, 0, read);
            }
            if (statusCode < 200 || statusCode >= 300) {
                throw new IOException("style request failed with status " + statusCode + ", body=" + output.toString(StandardCharsets.UTF_8));
            }
            return output.toString(StandardCharsets.UTF_8);
        } finally {
            connection.disconnect();
        }
    }
}
