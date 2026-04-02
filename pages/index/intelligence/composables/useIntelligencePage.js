import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
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
  const lastViewport = ref(null);
  const viewportMarkers = ref([]);
  const nativeFailureFallbackApplied = ref(false);
  let viewportTimer = null;

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
    const top = Math.max(Number(safeTop.value || 0) + 56, 56);
    if (state === 'collapsed') return { top, right: 0, bottom: 220, left: 0 };
    if (state === 'full') return { top, right: 0, bottom: 620, left: 0 };
    return { top, right: 0, bottom: 420, left: 0 };
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
    if (!mapController.value) return;
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
      await loadViewportMarkers({
        center: list[0]?.coordinate || mapInitialView.value?.center || DEFAULT_MAP_VIEW.center,
        zoom: list[0]?.mapZoom || mapInitialView.value?.zoom || DEFAULT_MAP_VIEW.zoom,
        layers: currentAction.value.mapLayers,
      });
      await syncDomainGeoJson();
      syncMapMarkers(options.focusSelected !== false);
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
    if (viewportTimer) {
      clearTimeout(viewportTimer);
    }
    viewportTimer = setTimeout(() => {
      loadViewportMarkers(payload);
    }, 180);
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

    const objectGeometry = await getNativeMapObjectGeometry({
      domain: activeActionKey.value,
      item,
    });
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

    nativeFailureFallbackApplied.value = true;
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
    if (event.type === 'ready') {
      syncMapLayers();
      syncMapMarkers(false);
      syncDomainGeoJson();
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
      fallbackToWebViewByNativeFailure(event.payload?.message || '');
    }
  }

  function handleSheetStateChange(nextState) {
    sheetState.value = nextState;
    if (mapController.value) {
      mapController.value.setViewportInset(resolveViewportInset(nextState));
    }
  }

  onShow(() => {
    const sys = uni.getSystemInfoSync();
    safeBottom.value = sys.safeAreaInsets?.bottom || 0;
    mapAdapterType.value = resolvePreferredMapAdapter();
    mapEnabled.value = shouldAutoLoadMap();
    nativeFailureFallbackApplied.value = false;
    mapSrc.value = buildWebViewMapSrc({
      ...DEFAULT_MAP_VIEW,
      layers: currentAction.value.mapLayers,
      keyword: committedKeyword.value,
    });
    loadMapBootstrap();
    refreshPage({ focusSelected: false });
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
