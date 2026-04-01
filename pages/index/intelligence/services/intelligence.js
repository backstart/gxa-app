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
    mapLayers: ['areas'],
  },
  {
    key: 'places',
    label: '场所',
    icon: '场',
    iconBg: 'linear-gradient(135deg, #e5f1ff, #d6e8ff)',
    searchPlaceholder: '搜索重点场所、地址、责任民警',
    mapLayers: ['places'],
  },
  {
    key: 'people',
    label: '人员',
    icon: '人',
    iconBg: 'linear-gradient(135deg, #e7f7f0, #d8f2e4)',
    searchPlaceholder: '搜索重点人员、住址、责任民警',
    mapLayers: ['pois'],
  },
  {
    key: 'handling',
    label: '处警',
    icon: '勤',
    iconBg: 'linear-gradient(135deg, #fff0d8, #ffe4b3)',
    searchPlaceholder: '搜索处警中警情、执行民警、位置',
    mapLayers: ['shops', 'areas'],
  },
  {
    key: 'patrol',
    label: '巡防',
    icon: '巡',
    iconBg: 'linear-gradient(135deg, #efe9ff, #e0d6ff)',
    searchPlaceholder: '搜索巡防点、巡区、任务',
    mapLayers: ['boundaries'],
  },
];

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
