import { computed, ref } from 'vue';
import { onHide, onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import {
  INTELLIGENCE_ACTIONS,
  getIntelligenceList,
  getIntelligenceSummary,
  getMapMarkersFromItems,
  mergeMapMarkers,
} from '../services/intelligence.js';
import {
  buildWebViewMapSrc,
  DEFAULT_MAP_VIEW,
  isDebugMapFallbackEnabled,
  resolvePreferredMapAdapter,
  shouldAutoLoadMap,
} from '../services/mapEmbed.js';
import {
  getNativeMapBootstrapConfig,
  getNativeMapGeoJSON,
  getNativeMapObjectGeometry,
  getNativeMapViewportPoints,
} from '../services/nativeMap.js';

const ADAPTER_NATIVE = 'native';
const ADAPTER_WEBVIEW = 'webview';
const NATIVE_READY_TIMEOUT_MS = 15000;

export function useIntelligencePage() {
  const safeTop = ref(getStatusBarHeight() || 0);
  const safeBottom = ref(0);
  const keyword = ref('');
  const committedKeyword = ref('');
  const sheetState = ref('half');
  const activeActionKey = ref('alerts');
  const actions = ref([]);
  const items = ref([]);
  const loading = ref(false);
  const summary = ref({ total: 0, highRisk: 0, mapped: 0, domainCounts: {} });
  const selectedItemId = ref('');
  const mapAdapterType = ref(resolvePreferredMapAdapter());
  const mapEnabled = ref(shouldAutoLoadMap());
  const mapSrc = ref(buildWebViewMapSrc(DEFAULT_MAP_VIEW));
  const mapInitialView = ref(null);
  const mapController = ref(null);
  const mapReady = ref(false);
  const nativeStartupState = ref('idle');
  const allowWebViewFallback = ref(false);
  const windowHeight = ref(780);
  const lastViewport = ref(null);
  const viewportMarkers = ref([]);
  const nativeFailureFallbackApplied = ref(false);
  const pendingViewportPayload = ref(null);
  const pendingMapDataSync = ref(false);
  let viewportTimer = null;
  let nativeStartupTimer = null;

  const currentAction = computed(
    () => INTELLIGENCE_ACTIONS.find((item) => item.key === activeActionKey.value) || INTELLIGENCE_ACTIONS[0]
  );

  const searchPlaceholder = computed(() => '搜索警情、人员、场所');
  const summaryText = computed(() => {
    if (!items.value.length) return '等待加载情报数据';
    const selected = items.value.find((item) => item.id === selectedItemId.value);
    if (selected) return `当前选中：${selected.title}`;
    return `当前展示 ${items.value.length} 条 ${currentAction.value.label}`;
  });

  function refreshActionCounters() {
    actions.value = INTELLIGENCE_ACTIONS.map((item) => ({
      ...item,
      count: summary.value.domainCounts[item.key] || 0,
    }));
  }

  function resolveViewportInset(state) {
    const h = Number(windowHeight.value || 780);
    const collapsed = Math.round(h * 0.28);
    const half = Math.round(h * 0.56);
    const full = Math.round(h * 0.88);
    const top = Math.max(Number(safeTop.value || 0) + 56, 56);
    const bottom = state === 'collapsed'
      ? collapsed
      : (state === 'full' ? full : half);
    return { top, right: 0, bottom, left: 0 };
  }

  function syncMapLayers() {
    if (!mapController.value) return;
    mapController.value.setActiveLayers(currentAction.value.mapLayers || []);
    mapController.value.setViewportInset(resolveViewportInset(sheetState.value));
  }

  function focusSelection() {
    if (!mapController.value) return;
    const selected = items.value.find((item) => item.id === selectedItemId.value) || items.value[0];
    if (!selected || !selected.coordinate) return;
    mapController.value.flyTo({
      center: selected.coordinate,
      zoom: selected.mapZoom || 14,
      duration: 900,
    });
  }

  function syncMapMarkers(focusSelected = true) {
    if (!mapController.value) return;
    const selectedMarkers = getMapMarkersFromItems(
      selectedItemId.value
        ? items.value.filter((item) => item.id === selectedItemId.value)
        : items.value.slice(0, 3)
    );
    const markers = mergeMapMarkers(viewportMarkers.value, selectedMarkers);
    mapController.value.clearMarkers();
    mapController.value.addMarkers(markers);
    syncMapLayers();
    if (focusSelected) {
      focusSelection();
    }
  }

  async function syncDomainGeoJson() {
    if (!mapController.value || !mapReady.value) return;
    if (mapAdapterType.value !== ADAPTER_NATIVE) return;
    const featureCollection = await getNativeMapGeoJSON({
      domain: activeActionKey.value,
      items: items.value,
      keyword: committedKeyword.value,
      limit: 200,
    });
    mapController.value.drawGeoJSON(featureCollection);
  }

  async function loadSummary() {
    summary.value = await getIntelligenceSummary({ keyword: committedKeyword.value });
    refreshActionCounters();
  }

  async function loadDomain(options = {}) {
    loading.value = true;
    try {
      const list = await getIntelligenceList({
        domain: activeActionKey.value,
        keyword: committedKeyword.value,
      });
      items.value = list;
      if (!list.find((item) => item.id === selectedItemId.value)) {
        selectedItemId.value = list[0]?.id || '';
      }
      syncMapMarkers(options.focusSelected !== false);
      pendingMapDataSync.value = true;
      if (mapReady.value) {
        await refreshMapDataForCurrentDomain({ focusSelected: options.focusSelected !== false });
      }
    } finally {
      loading.value = false;
    }
  }

  async function refreshPage(options = {}) {
    await loadSummary();
    await loadDomain(options);
  }

  async function loadMapBootstrap() {
    mapInitialView.value = await getNativeMapBootstrapConfig({
      layers: currentAction.value.mapLayers,
    });
  }

  async function loadViewportMarkers(options = {}) {
    if (!mapReady.value) return;
    if (mapAdapterType.value !== ADAPTER_NATIVE) {
      viewportMarkers.value = getMapMarkersFromItems(items.value.slice(0, 24));
      syncMapMarkers(false);
      return;
    }
    const center = options.center || mapInitialView.value?.center || items.value[0]?.coordinate || DEFAULT_MAP_VIEW.center;
    const zoom = options.zoom || mapInitialView.value?.zoom || items.value[0]?.mapZoom || DEFAULT_MAP_VIEW.zoom;
    const layers = options.layers || currentAction.value.mapLayers;
    viewportMarkers.value = await getNativeMapViewportPoints({
      center,
      zoom,
      layers,
      items: items.value,
    });
    syncMapMarkers(false);
  }

  function scheduleViewportReload(payload = {}) {
    pendingViewportPayload.value = payload;
    if (!mapReady.value) return;
    if (viewportTimer) {
      clearTimeout(viewportTimer);
    }
    viewportTimer = setTimeout(() => {
      loadViewportMarkers(payload);
    }, 180);
  }

  async function refreshMapDataForCurrentDomain(options = {}) {
    if (!mapController.value || !mapReady.value) return;
    const center = items.value[0]?.coordinate || mapInitialView.value?.center || DEFAULT_MAP_VIEW.center;
    const zoom = items.value[0]?.mapZoom || mapInitialView.value?.zoom || DEFAULT_MAP_VIEW.zoom;
    const layers = currentAction.value.mapLayers;

    await Promise.allSettled([
      loadViewportMarkers({ center, zoom, layers }),
      syncDomainGeoJson(),
    ]);
    syncMapMarkers(options.focusSelected !== false);
    pendingMapDataSync.value = false;
  }

  function handleSearch() {
    committedKeyword.value = keyword.value.trim();
    refreshPage();
  }

  function handleActionSelect(key) {
    if (key === activeActionKey.value) return;
    activeActionKey.value = key;
    if (sheetState.value === 'collapsed') {
      sheetState.value = 'half';
    }
    loadMapBootstrap();
    refreshPage({ focusSelected: false });
  }

  async function handleCardSelect(item) {
    selectedItemId.value = item.id;
    if (!mapController.value || !item.coordinate) return;

    const objectGeometry = mapAdapterType.value === ADAPTER_NATIVE
      ? await getNativeMapObjectGeometry({
        domain: activeActionKey.value,
        item,
      })
      : {
        center: Array.isArray(item.coordinate) ? item.coordinate.slice() : null,
        zoom: item.mapZoom || 15,
        featureCollection: null,
      };
    const selectPayload = {
      id: item.id,
      coordinate: objectGeometry?.center || item.coordinate,
      center: objectGeometry?.center || item.coordinate,
      mapZoom: objectGeometry?.zoom || item.mapZoom || 15,
    };

    mapController.value.flyTo({
      center: selectPayload.center,
      zoom: selectPayload.mapZoom,
      duration: 900,
    });
    mapController.value.selectObject(selectPayload);
    if (objectGeometry?.featureCollection) {
      mapController.value.drawGeoJSON(objectGeometry.featureCollection);
    }

    scheduleViewportReload({
      center: selectPayload.center,
      zoom: selectPayload.mapZoom,
      layers: currentAction.value.mapLayers,
    });
  }

  function handleCardNavigate(item) {
    if (item.url) {
      uni.navigateTo({ url: item.url });
      return;
    }
    handleCardSelect(item);
  }

  function handleMapControllerReady(controller) {
    mapController.value = controller;
    nativeStartupState.value = mapAdapterType.value === ADAPTER_NATIVE ? 'mounting' : 'ready';
    if (mapInitialView.value) {
      mapController.value.init(mapInitialView.value);
    }
    syncMapLayers();
    syncMapMarkers(false);
  }

  function handleMapActivate() {
    mapEnabled.value = true;
  }

  function fallbackToWebViewByNativeFailure(message = '') {
    if (nativeFailureFallbackApplied.value) return;
    if (mapAdapterType.value !== ADAPTER_NATIVE) return;
    if (isWaitingNativeMessage(message)) {
      nativeStartupState.value = 'mounting';
      return;
    }

    if (!allowWebViewFallback.value) {
      nativeFailureFallbackApplied.value = true;
      nativeStartupState.value = 'failed';
      stopNativeStartupTimer();
      console.warn('[intelligence] native map failed, keep native path without webview fallback:', message || 'unknown');
      return;
    }

    nativeFailureFallbackApplied.value = true;
    stopNativeStartupTimer();
    mapAdapterType.value = ADAPTER_WEBVIEW;
    mapEnabled.value = true;
    mapSrc.value = buildWebViewMapSrc({
      ...DEFAULT_MAP_VIEW,
      center: mapInitialView.value?.center || DEFAULT_MAP_VIEW.center,
      zoom: mapInitialView.value?.zoom || DEFAULT_MAP_VIEW.zoom,
      layers: currentAction.value.mapLayers,
      keyword: committedKeyword.value,
    });

    if (message) {
      console.warn('[intelligence] native map failed, fallback to webview:', message);
    }
  }

  function handleMapEvent(event) {
    if (!event) return;
    if (event.type === 'native-status') {
      const phase = String(event.payload?.phase || '').trim();
      const reason = String(event.payload?.reason || '').trim();
      if (phase) {
        nativeStartupState.value = phase;
      }
      if (phase === 'failed' && shouldFallbackOnNativeReason(reason)) {
        fallbackToWebViewByNativeFailure(reason);
      }
      return;
    }
    if (event.type === 'ready') {
      mapReady.value = true;
      nativeStartupState.value = 'ready';
      stopNativeStartupTimer();
      syncMapLayers();
      syncMapMarkers(false);
      if (pendingMapDataSync.value) {
        refreshMapDataForCurrentDomain({ focusSelected: false });
      } else {
        syncDomainGeoJson();
      }
      if (pendingViewportPayload.value) {
        scheduleViewportReload(pendingViewportPayload.value);
        pendingViewportPayload.value = null;
      }
      return;
    }
    if (event.type === 'markerClick' || event.type === 'objectSelect') {
      const nextId = String(event.payload?.id || event.payload?.item?.id || '');
      if (!nextId) return;
      const hit = items.value.find((item) => item.id === nextId);
      if (hit) {
        selectedItemId.value = hit.id;
      }
      return;
    }
    if (event.type === 'moveEnd' || event.type === 'zoomEnd') {
      lastViewport.value = event.payload || null;
      scheduleViewportReload({
        center: event.payload?.center,
        zoom: event.payload?.zoom,
        layers: event.payload?.layers || currentAction.value.mapLayers,
      });
      return;
    }
    if (event.type === 'error') {
      const message = event.payload?.message || '';
      if (isWaitingNativeMessage(message)) {
        nativeStartupState.value = 'mounting';
        return;
      }
      fallbackToWebViewByNativeFailure(message);
    }
  }

  function handleSheetStateChange(nextState) {
    sheetState.value = nextState;
    if (mapController.value) {
      mapController.value.setViewportInset(resolveViewportInset(nextState));
    }
  }

  function startNativeStartupTimer() {
    stopNativeStartupTimer();
    if (mapAdapterType.value !== ADAPTER_NATIVE) return;
    nativeStartupState.value = 'checking';
    nativeStartupTimer = setTimeout(() => {
      if (mapAdapterType.value !== ADAPTER_NATIVE) return;
      if (mapReady.value) return;
      fallbackToWebViewByNativeFailure('native-ready-timeout');
    }, NATIVE_READY_TIMEOUT_MS);
  }

  function stopNativeStartupTimer() {
    if (!nativeStartupTimer) return;
    clearTimeout(nativeStartupTimer);
    nativeStartupTimer = null;
  }

  function isWaitingNativeMessage(message) {
    const text = String(message || '').toLowerCase();
    return text.includes('plugin-not-render-ready')
      || text.includes('waiting-ready')
      || text.includes('mounting')
      || text.includes('bridge')
      || text.includes('initializing');
  }

  function shouldFallbackOnNativeReason(reason) {
    const text = String(reason || '').toLowerCase();
    if (!text) return false;
    if (isWaitingNativeMessage(text)) return false;
    return text.includes('plugin-missing')
      || text.includes('plugin-runtime-missing')
      || text.includes('mount-failed')
      || text.includes('native-mount-failed')
      || text.includes('native dependency missing')
      || text.includes('not-app-plus')
      || text.includes('load style failed');
  }

  function ensureTransparentPageWebview() {
    // #ifdef APP-PLUS
    try {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const webview = current?.$getAppWebview?.();
      if (webview && typeof webview.setStyle === 'function') {
        webview.setStyle({
          background: '#00000000',
        });
      }
    } catch (error) {
      console.warn('[intelligence] set transparent webview failed', error);
    }
    // #endif
  }

  onShow(() => {
    const sys = uni.getSystemInfoSync();
    safeBottom.value = sys.safeAreaInsets?.bottom || 0;
    windowHeight.value = sys.windowHeight || 780;
    mapAdapterType.value = resolvePreferredMapAdapter();
    allowWebViewFallback.value = isDebugMapFallbackEnabled() || mapAdapterType.value === ADAPTER_WEBVIEW;
    mapEnabled.value = shouldAutoLoadMap();
    nativeFailureFallbackApplied.value = false;
    mapReady.value = false;
    nativeStartupState.value = 'idle';
    pendingMapDataSync.value = false;
    pendingViewportPayload.value = null;
    mapSrc.value = buildWebViewMapSrc({
      ...DEFAULT_MAP_VIEW,
      layers: currentAction.value.mapLayers,
      keyword: committedKeyword.value,
    });
    ensureTransparentPageWebview();
    startNativeStartupTimer();
    loadMapBootstrap();
    refreshPage({ focusSelected: false });
  });

  onHide(() => {
    stopNativeStartupTimer();
  });

  refreshActionCounters();

  return {
    safeTop,
    safeBottom,
    keyword,
    searchPlaceholder,
    actions,
    activeActionKey,
    currentAction,
    summary,
    summaryText,
    items,
    loading,
    selectedItemId,
    mapAdapterType,
    mapEnabled,
    mapSrc,
    mapInitialView,
    sheetState,
    handleSearch,
    handleActionSelect,
    handleCardSelect,
    handleCardNavigate,
    handleMapControllerReady,
    handleMapActivate,
    handleMapEvent,
    handleSheetStateChange,
  };
}
