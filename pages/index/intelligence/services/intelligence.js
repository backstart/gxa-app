import {
  getIncidents,
  getKeyPersons,
  getKeyPlaces,
  getPatrolPoints,
} from '@/common/database.js';
import { requestWithFallback } from './http.js';

export const INTELLIGENCE_ACTIONS = [
  {
    key: 'alerts',
    label: '警情',
    icon: '警',
    iconBg: 'linear-gradient(135deg, #ffe4de, #ffd2cb)',
    searchPlaceholder: '搜索警情标题、地址、当事人',
    mapLayers: ['shops', 'pois'],
  },
  {
    key: 'places',
    label: '场所',
    icon: '场',
    iconBg: 'linear-gradient(135deg, #e5f1ff, #d6e8ff)',
    searchPlaceholder: '搜索重点场所、地址、责任民警',
    mapLayers: ['places', 'shops'],
  },
  {
    key: 'people',
    label: '人员',
    icon: '人',
    iconBg: 'linear-gradient(135deg, #e7f7f0, #d8f2e4)',
    searchPlaceholder: '搜索重点人员、住址、责任民警',
    mapLayers: ['pois', 'places'],
  },
  {
    key: 'handling',
    label: '处警',
    icon: '勤',
    iconBg: 'linear-gradient(135deg, #fff0d8, #ffe4b3)',
    searchPlaceholder: '搜索处警中警情、执行民警、位置',
    mapLayers: ['shops', 'pois'],
  },
  {
    key: 'patrol',
    label: '巡防',
    icon: '巡',
    iconBg: 'linear-gradient(135deg, #efe9ff, #e0d6ff)',
    searchPlaceholder: '搜索巡防点、巡区、任务',
    mapLayers: ['places', 'shops'],
  },
];

const DOMAIN_GEO_TYPES = {
  alerts: 'shops',
  places: 'places',
  people: 'pois',
  handling: 'shops',
  patrol: 'places',
};

function hashSeed(text) {
  return String(text || '')
    .split('')
    .reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7);
}

function buildCoordinate(seedText) {
  const seed = Math.abs(hashSeed(seedText));
  const lng = 113.4445 + ((seed % 60) - 30) * 0.0021;
  const lat = 22.4915 + ((Math.floor(seed / 60) % 60) - 30) * 0.0016;
  return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
}

function buildTags(...values) {
  return values.filter(Boolean).slice(0, 3);
}

function formatUpdatedAt(value) {
  return String(value || '').replace('T', ' ').slice(0, 16) || '刚刚';
}

function normalizeAlert(item) {
  const coordinate = buildCoordinate(item.id || item.title);
  return {
    id: String(item.id),
    type: 'alert',
    title: item.title || '未命名警情',
    subtitle: item.category || item.community || '警情对象',
    metaLabel: item.officerName || '值班民警',
    address: item.address || '',
    riskLevel: item.riskLevel || '中',
    statusText: item.statusText || '待研判',
    updatedAtText: formatUpdatedAt(item.alarmTime || item.updatedAt || item.createdAt),
    tags: buildTags(item.category, item.statusText, item.community),
    url: item.url || '/pages/policeDetail/policeDetail',
    coordinate,
    mapZoom: 14,
    mapObjectType: item.mapObjectType || '',
    mapObjectId: item.mapObjectId || '',
  };
}

function normalizePlace(item) {
  const coordinate = buildCoordinate(item.id || item.name);
  return {
    id: String(item.id),
    type: 'place',
    title: item.name || '未命名场所',
    subtitle: item.primaryType || '重点场所',
    metaLabel: item.officerName || '责任民警',
    address: item.address || '',
    riskLevel: item.riskLevel || '中',
    statusText: item.statusText || '待核查',
    updatedAtText: formatUpdatedAt(item.updatedAt || item.lastVisitAt),
    tags: buildTags(item.primaryType, item.area, item.riskLevel),
    url: item.url || '/pages/place/list',
    coordinate,
    mapZoom: 15,
    mapObjectType: item.mapObjectType || 'place',
    mapObjectId: item.mapObjectId || String(item.id),
  };
}

function normalizePerson(item) {
  const coordinate = buildCoordinate(item.personId || item.name);
  return {
    id: String(item.personId),
    type: 'person',
    title: item.name || '未命名人员',
    subtitle: item.personType || '重点人员',
    metaLabel: item.officerName || '责任民警',
    address: item.address || '',
    riskLevel: item.riskLevel || '中',
    statusText: item.status || '在控',
    updatedAtText: formatUpdatedAt(item.lastVisitAt),
    tags: buildTags(item.personType, item.status, item.area),
    url: `/pages/person/detail?personId=${item.personId}`,
    coordinate,
    mapZoom: 15,
    mapObjectType: item.mapObjectType || '',
    mapObjectId: item.mapObjectId || '',
  };
}

function normalizePatrol(item, index) {
  const id = item.id || `patrol-${index + 1}`;
  const coordinate = buildCoordinate(id);
  return {
    id: String(id),
    type: 'patrol',
    title: item.name || `巡防点 ${index + 1}`,
    subtitle: item.area || '巡防单元',
    metaLabel: item.officerName || '巡防任务',
    address: item.address || item.area || '',
    riskLevel: item.riskLevel || '低',
    statusText: item.statusText || '巡查中',
    updatedAtText: formatUpdatedAt(item.updatedAt),
    tags: buildTags(item.area, item.category, item.statusText),
    url: item.url || '/pages/work/work',
    coordinate,
    mapZoom: 13,
    mapObjectType: item.mapObjectType || 'boundary',
    mapObjectId: item.mapObjectId || String(id),
  };
}

function filterByKeyword(list, keyword) {
  const words = String(keyword || '').trim().toLowerCase();
  if (!words) return list;
  return list.filter((item) => {
    const text = `${item.title}|${item.subtitle}|${item.address}|${item.metaLabel}|${(item.tags || []).join('|')}`.toLowerCase();
    return text.includes(words);
  });
}

function buildMockDomain(domain) {
  if (domain === 'places') {
    return getKeyPlaces().map(normalizePlace);
  }
  if (domain === 'people') {
    return getKeyPersons().map(normalizePerson);
  }
  if (domain === 'handling') {
    return getIncidents()
      .filter((item, index) => index < 8)
      .map((item, index) =>
        normalizeAlert({
          ...item,
          statusText: index % 2 === 0 ? '处警中' : '待签收',
        })
      );
  }
  if (domain === 'patrol') {
    return getPatrolPoints().map(normalizePatrol);
  }
  return getIncidents().map(normalizeAlert);
}

export async function getAlerts(params = {}) {
  return filterByKeyword(buildMockDomain('alerts'), params.keyword);
}

export async function getPlaces(params = {}) {
  return filterByKeyword(buildMockDomain('places'), params.keyword);
}

export async function getPeople(params = {}) {
  return requestWithFallback({
    path: '/api/persons',
    query: {
      keyword: params.keyword || '',
      pageNo: 1,
      pageSize: 20,
    },
    fallback: () => filterByKeyword(buildMockDomain('people'), params.keyword),
  }).then((result) => {
    if (!result || !Array.isArray(result.list)) {
      return filterByKeyword(buildMockDomain('people'), params.keyword);
    }
    return filterByKeyword(
      result.list.map((item) =>
        normalizePerson({
          personId: item.id || item.personId,
          name: item.name,
          personType: item.personTypeLabel || item.personTypeName,
          officerName: item.officerName,
          address: item.address,
          riskLevel: item.riskLevel || '中',
          status: item.statusLabel || item.status,
          lastVisitAt: item.updateTime || item.updatedAt,
          area: item.departmentName,
        })
      ),
      params.keyword
    );
  });
}

export async function getCases(params = {}) {
  return filterByKeyword(buildMockDomain('handling'), params.keyword);
}

export async function getIntelligenceList(params = {}) {
  const domain = params.domain || 'alerts';
  if (domain === 'places') return getPlaces(params);
  if (domain === 'people') return getPeople(params);
  if (domain === 'handling') return getCases(params);
  if (domain === 'patrol') return filterByKeyword(buildMockDomain('patrol'), params.keyword);
  return getAlerts(params);
}

export async function getIntelligenceSummary(params = {}) {
  const keyword = params.keyword || '';
  const allLists = await Promise.all(
    INTELLIGENCE_ACTIONS.map((action) => getIntelligenceList({ domain: action.key, keyword }))
  );
  const domainCounts = {};
  let total = 0;
  let highRisk = 0;
  let mapped = 0;
  allLists.forEach((list, index) => {
    const key = INTELLIGENCE_ACTIONS[index].key;
    domainCounts[key] = list.length;
    total += list.length;
    highRisk += list.filter((item) => item.riskLevel === '高').length;
    mapped += list.filter((item) => Array.isArray(item.coordinate)).length;
  });
  return { total, highRisk, mapped, domainCounts };
}

export function getMapMarkersFromItems(items = []) {
  return items
    .filter((item) => Array.isArray(item.coordinate))
    .map((item) => ({
      id: item.id,
      lng: item.coordinate[0],
      lat: item.coordinate[1],
      label: item.title,
      color: item.riskLevel === '高' ? '#de5a39' : item.riskLevel === '低' ? '#28a060' : '#1f7cff',
    }));
}

export function mergeMapMarkers(...groups) {
  const markerMap = new Map();
  groups
    .flat()
    .filter(Boolean)
    .forEach((item, index) => {
      const lng = Number(item.lng);
      const lat = Number(item.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
      const id = String(item.id || `merged-${index + 1}`);
      if (!markerMap.has(id)) {
        markerMap.set(id, {
          id,
          lng,
          lat,
          label: item.label || '',
          color: item.color || '#1f7cff',
          objectType: item.objectType || '',
        });
      }
    });
  return Array.from(markerMap.values());
}

export function getMapGeoTypeByDomain(domain = 'alerts') {
  return DOMAIN_GEO_TYPES[domain] || 'areas';
}

export function buildMockGeoJSONForDomain(domain = 'alerts', items = []) {
  const palette = {
    alerts: '#de5a39',
    places: '#1f7cff',
    people: '#28a060',
    handling: '#f4a524',
    patrol: '#7b5cff',
  };

  const seeds = items.filter((item) => Array.isArray(item.coordinate)).slice(0, 3);
  if (!seeds.length) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const features = seeds.map((item, index) => {
    const polygon = buildSquarePolygon(item.coordinate, 0.0032 + index * 0.0012);
    return {
      type: 'Feature',
      id: item.id,
      properties: {
        id: item.id,
        name: item.title,
        domain,
        color: palette[domain] || '#1f7cff',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [polygon],
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function buildMockGeoJSONForItem(item, domain = 'alerts') {
  if (!item || !Array.isArray(item.coordinate)) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const radius = item.type === 'patrol' ? 0.0052 : item.type === 'place' ? 0.0024 : 0.003;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: item.id,
        properties: {
          id: item.id,
          name: item.title,
          domain,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [buildSquarePolygon(item.coordinate, radius)],
        },
      },
    ],
  };
}

function buildSquarePolygon(center, delta = 0.003) {
  const lng = Number(center[0]);
  const lat = Number(center[1]);
  return [
    [Number((lng - delta).toFixed(6)), Number((lat - delta * 0.72).toFixed(6))],
    [Number((lng + delta).toFixed(6)), Number((lat - delta * 0.72).toFixed(6))],
    [Number((lng + delta).toFixed(6)), Number((lat + delta * 0.72).toFixed(6))],
    [Number((lng - delta).toFixed(6)), Number((lat + delta * 0.72).toFixed(6))],
    [Number((lng - delta).toFixed(6)), Number((lat - delta * 0.72).toFixed(6))],
  ];
}
