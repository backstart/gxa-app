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
  const mapSessionKey = ref(0);
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
  let activePageSessionId = 0;
  let bootstrapReqSeq = 0;
  let summaryReqSeq = 0;
  let domainReqSeq = 0;
  let viewportReqSeq = 0;
  let geoReqSeq = 0;
  let objectReqSeq = 0;

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

  function beginPageSession() {
    activePageSessionId += 1;
    mapSessionKey.value = activePageSessionId;
    return activePageSessionId;
  }

  function invalidatePageSession() {
    activePageSessionId += 1;
  }

  function isSessionActive(sessionId) {
    return Number(sessionId) === Number(activePageSessionId);
  }

  function clearViewportTimer() {
    if (!viewportTimer) return;
    clearTimeout(viewportTimer);
    viewportTimer = null;
  }

  function clearAllAsyncGuards() {
    bootstrapReqSeq += 1;
    summaryReqSeq += 1;
    domainReqSeq += 1;
    viewportReqSeq += 1;
    geoReqSeq += 1;
    objectReqSeq += 1;
    pendingViewportPayload.value = null;
    pendingMapDataSync.value = false;
  }

  function teardownMapController() {
    if (mapController.value && typeof mapController.value.destroy === 'function') {
      try {
        mapController.value.destroy();
      } catch (error) {
        console.warn('[intelligence] destroy map controller failed', error);
      }
    }
    mapController.value = null;
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

  async function syncDomainGeoJson(options = {}) {
    if (!mapController.value || !mapReady.value) return;
    if (mapAdapterType.value !== ADAPTER_NATIVE) return;

    const sessionId = options.sessionId ?? activePageSessionId;
    const actionKey = options.actionKey || activeActionKey.value;
    const requestId = ++geoReqSeq;

    const featureCollection = await getNativeMapGeoJSON({
      domain: actionKey,
      items: items.value,
      keyword: committedKeyword.value,
      limit: 200,
    });

    if (!isSessionActive(sessionId) || requestId !== geoReqSeq || actionKey !== activeActionKey.value) {
      return;
    }

    mapController.value.drawGeoJSON(featureCollection);
  }

  async function loadSummary(options = {}) {
    const sessionId = options.sessionId ?? activePageSessionId;
    const requestId = ++summaryReqSeq;
    const nextSummary = await getIntelligenceSummary({ keyword: committedKeyword.value });

    if (!isSessionActive(sessionId) || requestId !== summaryReqSeq) {
      return false;
    }

    summary.value = nextSummary;
    refreshActionCounters();
    return true;
  }

  async function loadDomain(options = {}) {
    const sessionId = options.sessionId ?? activePageSessionId;
    const actionKey = options.actionKey || activeActionKey.value;
    const requestId = ++domainReqSeq;

    if (isSessionActive(sessionId)) {
      loading.value = true;
    }

    try {
      const list = await getIntelligenceList({
        domain: actionKey,
        keyword: committedKeyword.value,
      });

      if (!isSessionActive(sessionId) || requestId !== domainReqSeq || actionKey !== activeActionKey.value) {
        return false;
      }

      items.value = list;
      if (!list.find((item) => item.id === selectedItemId.value)) {
        selectedItemId.value = list[0]?.id || '';
      }
      syncMapMarkers(options.focusSelected !== false);
      pendingMapDataSync.value = true;
      if (mapReady.value) {
        await refreshMapDataForCurrentDomain({
          focusSelected: options.focusSelected !== false,
          sessionId,
          actionKey,
        });
      }
      return true;
    } finally {
      if (isSessionActive(sessionId) && requestId === domainReqSeq) {
        loading.value = false;
      }
    }
  }

  async function refreshPage(options = {}) {
    const sessionId = options.sessionId ?? activePageSessionId;
    const actionKey = options.actionKey || activeActionKey.value;

    await Promise.allSettled([
      loadSummary({ sessionId }),
      loadDomain({ ...options, sessionId, actionKey }),
    ]);
  }

  async function loadMapBootstrap(options = {}) {
    const sessionId = options.sessionId ?? activePageSessionId;
    const actionKey = options.actionKey || activeActionKey.value;
    const requestId = ++bootstrapReqSeq;

    const bootstrap = await getNativeMapBootstrapConfig({
      layers: currentAction.value.mapLayers,
    });

    if (!isSessionActive(sessionId) || requestId !== bootstrapReqSeq || actionKey !== activeActionKey.value) {
      return false;
    }

    mapInitialView.value = bootstrap;
    if (mapController.value) {
      mapController.value.init(bootstrap);
      syncMapLayers();
    }
    return true;
  }

  async function loadViewportMarkers(options = {}) {
    if (!mapReady.value) return;

    const sessionId = options.sessionId ?? activePageSessionId;
    const actionKey = options.actionKey || activeActionKey.value;
    const requestId = ++viewportReqSeq;

    if (mapAdapterType.value !== ADAPTER_NATIVE) {
      if (!isSessionActive(sessionId) || requestId !== viewportReqSeq || actionKey !== activeActionKey.value) {
        return;
      }
      viewportMarkers.value = getMapMarkersFromItems(items.value.slice(0, 24));
      syncMapMarkers(false);
      return;
    }

    const center = options.center || mapInitialView.value?.center || items.value[0]?.coordinate || DEFAULT_MAP_VIEW.center;
    const zoom = options.zoom || mapInitialView.value?.zoom || items.value[0]?.mapZoom || DEFAULT_MAP_VIEW.zoom;
    const layers = options.layers || currentAction.value.mapLayers;

    const points = await getNativeMapViewportPoints({
      center,
      zoom,
      layers,
      items: items.value,
    });

    if (!isSessionActive(sessionId) || requestId !== viewportReqSeq || actionKey !== activeActionKey.value) {
      return;
    }

    viewportMarkers.value = points;
    syncMapMarkers(false);
  }

  function scheduleViewportReload(payload = {}) {
    const scopedPayload = {
      ...payload,
      sessionId: activePageSessionId,
      actionKey: activeActionKey.value,
    };
    pendingViewportPayload.value = scopedPayload;

    if (!mapReady.value) return;

    clearViewportTimer();
    viewportTimer = setTimeout(() => {
      if (!pendingViewportPayload.value) return;
      const latest = pendingViewportPayload.value;
      pendingViewportPayload.value = null;
      if (!isSessionActive(latest.sessionId) || latest.actionKey !== activeActionKey.value) {
        return;
      }
      loadViewportMarkers(latest);
    }, 180);
  }

  async function refreshMapDataForCurrentDomain(options = {}) {
    if (!mapController.value || !mapReady.value) return;

    const sessionId = options.sessionId ?? activePageSessionId;
    const actionKey = options.actionKey || activeActionKey.value;
    if (!isSessionActive(sessionId) || actionKey !== activeActionKey.value) {
      return;
    }

    const center = items.value[0]?.coordinate || mapInitialView.value?.center || DEFAULT_MAP_VIEW.center;
    const zoom = items.value[0]?.mapZoom || mapInitialView.value?.zoom || DEFAULT_MAP_VIEW.zoom;
    const layers = currentAction.value.mapLayers;

    await Promise.allSettled([
      loadViewportMarkers({ center, zoom, layers, sessionId, actionKey }),
      syncDomainGeoJson({ sessionId, actionKey }),
    ]);

    if (!isSessionActive(sessionId) || actionKey !== activeActionKey.value) {
      return;
    }

    syncMapMarkers(options.focusSelected !== false);
    pendingMapDataSync.value = false;
  }

  function handleSearch() {
    committedKeyword.value = keyword.value.trim();
    const sessionId = activePageSessionId;
    refreshPage({ focusSelected: false, sessionId, actionKey: activeActionKey.value });
  }

  function handleActionSelect(key) {
    if (key === activeActionKey.value) return;

    activeActionKey.value = key;
    if (sheetState.value === 'collapsed') {
      sheetState.value = 'half';
    }

    const sessionId = activePageSessionId;
    loadMapBootstrap({ sessionId, actionKey: key });
    refreshPage({ focusSelected: false, sessionId, actionKey: key });
  }

  async function handleCardSelect(item) {
    selectedItemId.value = item.id;
    if (!mapController.value || !item.coordinate) return;

    const sessionId = activePageSessionId;
    const actionKey = activeActionKey.value;
    const requestId = ++objectReqSeq;

    const objectGeometry = mapAdapterType.value === ADAPTER_NATIVE
      ? await getNativeMapObjectGeometry({
        domain: actionKey,
        item,
      })
      : {
        center: Array.isArray(item.coordinate) ? item.coordinate.slice() : null,
        zoom: item.mapZoom || 15,
        featureCollection: null,
      };

    if (!isSessionActive(sessionId) || requestId !== objectReqSeq || actionKey !== activeActionKey.value) {
      return;
    }

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

  function handleMapControllerReady(payload) {
    const scopedSessionKey = Number(payload?.sessionKey);
    if (Number.isFinite(scopedSessionKey) && !isSessionActive(scopedSessionKey)) {
      return;
    }

    const controller = payload?.controller || payload;
    if (!controller) return;

    mapController.value = controller;
    mapReady.value = false;
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
      console.error('[intelligence][native-runtime] native map failed (no webview fallback):', message || 'unknown');
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

  function handleMapEvent(payload) {
    const scopedSessionKey = Number(payload?.sessionKey);
    if (Number.isFinite(scopedSessionKey) && !isSessionActive(scopedSessionKey)) {
      return;
    }

    const event = payload?.event || payload;
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

      const sessionId = activePageSessionId;
      const actionKey = activeActionKey.value;
      if (pendingMapDataSync.value) {
        refreshMapDataForCurrentDomain({
          focusSelected: false,
          sessionId,
          actionKey,
        });
      } else {
        syncDomainGeoJson({ sessionId, actionKey });
      }

      if (pendingViewportPayload.value) {
        scheduleViewportReload(pendingViewportPayload.value);
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

  function startNativeStartupTimer(expectedSessionId) {
    stopNativeStartupTimer();
    if (mapAdapterType.value !== ADAPTER_NATIVE) return;

    nativeStartupState.value = 'checking';
    nativeStartupTimer = setTimeout(() => {
      if (mapAdapterType.value !== ADAPTER_NATIVE || mapReady.value) return;
      if (!isSessionActive(expectedSessionId)) return;
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

  function ensurePageWebviewBackground(isTransparent) {
    // #ifdef APP-PLUS
    try {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const webview = current?.$getAppWebview?.();
      if (webview && typeof webview.setStyle === 'function') {
        webview.setStyle({
          background: isTransparent ? '#00000000' : '#ffffffff',
        });
      }
    } catch (error) {
      console.warn('[intelligence] set webview background failed', error);
    }
    // #endif
  }

  onShow(() => {
    const sys = uni.getSystemInfoSync();
    const sessionId = beginPageSession();

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
    mapInitialView.value = null;
    viewportMarkers.value = [];
    lastViewport.value = null;

    mapSrc.value = buildWebViewMapSrc({
      ...DEFAULT_MAP_VIEW,
      layers: currentAction.value.mapLayers,
      keyword: committedKeyword.value,
    });

    teardownMapController();
    clearViewportTimer();
    clearAllAsyncGuards();
    ensurePageWebviewBackground(true);
    startNativeStartupTimer(sessionId);

    Promise.allSettled([
      loadMapBootstrap({ sessionId, actionKey: activeActionKey.value }),
      refreshPage({ focusSelected: false, sessionId, actionKey: activeActionKey.value }),
    ]);
  });

  onHide(() => {
    stopNativeStartupTimer();
    clearViewportTimer();
    clearAllAsyncGuards();
    teardownMapController();
    mapReady.value = false;
    nativeStartupState.value = 'idle';
    loading.value = false;
    invalidatePageSession();
    ensurePageWebviewBackground(false);
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
    mapSessionKey,
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
