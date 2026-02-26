// 走访路由工具
// 说明：统一维护“从任意入口开始走访”应跳转的页面，
// 避免各页面散落写死 URL，后续改路由时只改这一处。

/**
 * 获取走访开始页面 URL（与详情页底部“新增走访/新增回访”保持一致）
 * @param {Object} params
 * @param {'person'|'place'|'PERSON'|'PLACE'} params.targetType 目标类型
 * @param {string} params.targetId 目标ID（personId/placeId）
 * @returns {string} 可用于 uni.navigateTo 的 url
 */
export function getVisitStartUrl({ targetType, targetId }) {
  const id = String(targetId || '').trim();
  if (!id) return '';

  // 兼容页面层传入的人类可读类型与数据库对象源枚举
  const type = normalizeTargetType(targetType);
  if (type === 'place') {
    // 场所走访：复用重点场所详情页底部“新增走访”的同一路由
    return `/pages/place/visit/add?placeId=${encodeURIComponent(id)}`;
  }
  if (type === 'person') {
    // 人员回访：复用重点人详情页底部“新增回访”的同一路由
    return `/pages/person/visit/edit?personId=${encodeURIComponent(id)}&mode=add`;
  }
  return '';
}

/**
 * 统一类型归一化，避免调用方使用不同大小写/枚举导致分支失效
 * @param {string} targetType
 * @returns {'person'|'place'|''}
 */
function normalizeTargetType(targetType) {
  const raw = String(targetType || '').toUpperCase();
  if (raw === 'PERSON') return 'person';
  if (raw === 'PLACE') return 'place';
  return '';
}
