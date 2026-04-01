import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import {
  INTELLIGENCE_ACTIONS,
  getIntelligenceList,
  getIntelligenceSummary,
  getMapMarkersFromItems,
} from '../services/intelligence.js';
import { buildMapBridgeSrc, DEFAULT_MAP_VIEW } from '../services/mapEmbed.js';

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
  const mapSrc = ref(buildMapBridgeSrc(DEFAULT_MAP_VIEW));
  const mapController = ref(null);
  const lastViewport = ref(null);

  const currentAction = computed(
    () => INTELLIGENCE_ACTIONS.find((item) => item.key === activeActionKey.value) || INTELLIGENCE_ACTIONS[0]
  );

  const searchPlaceholder = computed(() => currentAction.value.searchPlaceholder);
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
    if (state === 'collapsed') return { bottom: 220 };
    if (state === 'full') return { bottom: 620 };
    return { bottom: 420 };
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
    const markers = getMapMarkersFromItems(items.value);
    mapController.value.clearMarkers();
    mapController.value.addMarkers(markers);
    syncMapLayers();
    if (focusSelected) {
      focusSelection();
    }
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
    } finally {
      loading.value = false;
    }
  }

  async function refreshPage(options = {}) {
    await loadSummary();
    await loadDomain(options);
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
    refreshPage({ focusSelected: false });
  }

  function handleCardSelect(item) {
    selectedItemId.value = item.id;
    if (!mapController.value || !item.coordinate) return;
    mapController.value.flyTo({
      center: item.coordinate,
      zoom: item.mapZoom || 15,
      duration: 900,
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
  }

  function handleMapEvent(event) {
    if (!event) return;
    if (event.type === 'ready') {
      syncMapLayers();
      syncMapMarkers(false);
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
    mapSrc.value = buildMapBridgeSrc({
      ...DEFAULT_MAP_VIEW,
      layers: currentAction.value.mapLayers,
      keyword: committedKeyword.value,
    });
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
    mapSrc,
    sheetState,
    handleSearch,
    handleActionSelect,
    handleCardSelect,
    handleCardNavigate,
    handleMapControllerReady,
    handleMapEvent,
    handleSheetStateChange,
  };
}
