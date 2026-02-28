import {
  getDisputes,
  getIncidents,
  getTasks,
  getTodos,
  queryVisitObjects,
} from '@/common/database.js';
import { getVisitStartUrl } from '@/common/routes/visit.js';

// 统一类型配置：新列表页与工作台都复用这一份，避免同一文案在多个页面分叉。
export const ZONE_TASK_TYPE_CONFIG = {
  alarm: {
    title: '警情',
    placeholder: '警情编号/地址/当事人/责任民警',
    defaultMode: 'pending',
    cards: [
      { key: 'today', label: '今日新增' },
      { key: 'pending', label: '待回告' },
      { key: 'overdue', label: '逾期未回告' },
      { key: 'all', label: '全部' },
    ],
  },
  visit: {
    title: '走访',
    placeholder: '姓名/场所/地址/责任民警',
    defaultMode: 'overdue',
    cards: [
      { key: 'today', label: '今日待走访' },
      { key: 'overdue', label: '逾期' },
      { key: 'highRisk', label: '高风险' },
      { key: 'all', label: '全部' },
    ],
  },
  revisit: {
    title: '回访纠纷',
    placeholder: '纠纷主题/当事人/地址/责任民警',
    defaultMode: 'today',
    cards: [
      { key: 'today', label: '今日待回访' },
      { key: 'dueSoon', label: '24小时内到期' },
      { key: 'overdue', label: '逾期' },
      { key: 'all', label: '全部' },
    ],
  },
  case: {
    title: '案件执法',
    placeholder: '案件名称/任务名称/承办人/地址',
    defaultMode: 'dueSoon',
    cards: [
      { key: 'dueSoon', label: '临期任务' },
      { key: 'overdue', label: '超期任务' },
      { key: 'closedToday', label: '今日闭环' },
      { key: 'all', label: '全部' },
    ],
  },
};

const riskRankMap = { 高: 0, 中: 1, 低: 2 };
const ZONE_ASSIGN_STORAGE_KEY = 'db_zone_task_assignments';

function getZoneAssignMap() {
  // 本地阶段将“指派民警”结果单独存储，避免直接改动原始 mock 数据结构。
  const map = uni.getStorageSync(ZONE_ASSIGN_STORAGE_KEY);
  return map && typeof map === 'object' ? map : {};
}

function saveZoneAssignMap(map) {
  // 统一存储入口，后续接接口时可替换为远端同步。
  uni.setStorageSync(ZONE_ASSIGN_STORAGE_KEY, map || {});
}

function applyAssigneeOverride(type, item) {
  // 通过 type + id 拼出稳定 key，对不同业务模块复用同一套指派覆盖逻辑。
  const map = getZoneAssignMap();
  const key = `${type}:${item.id}`;
  const override = map[key];
  if (!override) return item;
  return {
    ...item,
    officerId: override.officerId || item.officerId || '',
    officerName: override.officerName || item.officerName || '',
    assignedAt: override.assignedAt || item.assignedAt || '',
    status: item.status === 'done' ? 'done' : 'pending',
    statusText: item.status === 'done' ? item.statusText : '待处理',
  };
}

function normalizeTaskType(type) {
  if (ZONE_TASK_TYPE_CONFIG[type]) return type;
  return 'alarm';
}

function nowTs() {
  return Date.now();
}

// 统一时间解析：兼容 Date/时间戳/YYYY-MM-DD/HH:mm/“今日”等本地 mock 字段。
function toDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(':');
    const d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);
    return d;
  }
  if (raw === '今日') {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    return d;
  }
  const d = new Date(raw.replace(/-/g, '/'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return value ? String(value) : '未知';
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function isToday(value) {
  const d = toDate(value);
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function normalizeStatus(status) {
  if (['done', 'completed', 'closed'].includes(String(status))) return 'done';
  if (['processing', 'in_progress'].includes(String(status))) return 'processing';
  return 'pending';
}

function statusText(status) {
  if (status === 'done') return '已完成';
  if (status === 'processing') return '处理中';
  return '待处理';
}

function formatDuration(ms) {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ms >= day) return `${Math.floor(ms / day)}天`;
  if (ms >= hour) return `${Math.floor(ms / hour)}小时`;
  return `${Math.max(1, Math.floor(ms / minute))}分钟`;
}

function buildDeadlineText(deadlineTs) {
  if (!deadlineTs) return '未设置截止';
  const diff = deadlineTs - nowTs();
  if (diff < 0) return `已超期 ${formatDuration(Math.abs(diff))}`;
  return `剩余 ${formatDuration(diff)}`;
}

function patchCommonFlags(item) {
  const pending = item.status !== 'done';
  const overdue = pending && !!item.deadlineTs && item.deadlineTs < nowTs();
  const dueSoon = pending && !!item.deadlineTs && item.deadlineTs >= nowTs() && item.deadlineTs - nowTs() <= 24 * 3600 * 1000;
  const highRisk = item.risk === '高';
  return {
    ...item,
    isPending: pending,
    isOverdue: overdue,
    isDueSoon: dueSoon,
    isHighRisk: highRisk,
  };
}

function buildAlarmTasks() {
  const todoMap = new Map(
    getTodos()
      .filter((item) => item.type === 'alert')
      .map((item) => [item.refId, item])
  );

  return getIncidents().map((incident, index) => {
    const todo = todoMap.get(incident.id);
    const status = normalizeStatus(todo?.status);
    const alarmTime = toDate(incident.alarmTime || incident.createdAt || new Date(nowTs() - index * 3600000));
    const deadlineTs = toDate(todo?.deadline)?.getTime() || null;
    return patchCommonFlags({
      id: `alarm-${incident.id}`,
      refId: incident.id,
      type: 'alarm',
      title: incident.title || '未命名警情',
      subtitle: incident.address || '暂无地址',
      officerName: todo?.officerName || incident.officerName || '值班民警',
      risk: incident.riskLevel || todo?.risk || '中',
      status,
      statusText: status === 'done' ? '已回告' : status === 'processing' ? '处理中' : '待回告',
      ts: alarmTime?.getTime() || nowTs(),
      timeText: `报警时间：${formatDateTime(alarmTime)}`,
      deadlineTs,
      deadlineText: buildDeadlineText(deadlineTs),
      isToday: isToday(alarmTime),
      isClosedToday: status === 'done' && isToday(alarmTime),
      distanceKm: null,
      tags: ['警情'],
      // 默认走警情详情，若本地 mock 已配置 url 则优先使用配置值。
      url: incident.url || `/pages/policeDetail/policeDetail?id=${incident.id}`,
      actionText: status === 'done' ? '查看' : '处理',
    });
  });
}

function buildRevisitTasks() {
  const todoMap = new Map(
    getTodos()
      .filter((item) => item.type === 'dispute')
      .map((item) => [item.refId, item])
  );

  return getDisputes().map((dispute, index) => {
    const todo = todoMap.get(dispute.id);
    const status = normalizeStatus(todo?.status);
    const deadlineDate = toDate(todo?.deadline || dispute.deadline || new Date(nowTs() + (index + 1) * 3 * 3600000));
    const deadlineTs = deadlineDate?.getTime() || null;
    const todayFlag = status !== 'done' && isToday(deadlineDate);
    return patchCommonFlags({
      id: `revisit-${dispute.id}`,
      refId: dispute.id,
      type: 'revisit',
      title: `${dispute.title || '纠纷'}回访`,
      subtitle: dispute.address || '暂无地址',
      officerName: todo?.officerName || dispute.officerName || '责任民警待分配',
      risk: dispute.riskLevel || todo?.risk || '中',
      status,
      statusText: status === 'done' ? '已闭环' : status === 'processing' ? '处理中' : '待回访',
      ts: deadlineTs || nowTs(),
      timeText: `截止时间：${formatDateTime(deadlineDate)}`,
      deadlineTs,
      deadlineText: buildDeadlineText(deadlineTs),
      isToday: todayFlag,
      isClosedToday: status === 'done' && isToday(deadlineDate),
      distanceKm: null,
      tags: ['回访纠纷'],
      url: dispute.url || '/pages/venue/venue',
      actionText: status === 'done' ? '查看' : '处理',
    });
  });
}

function normalizeVisitStatus(visitStatus) {
  if (visitStatus === 'done') return 'done';
  if (visitStatus === 'doing') return 'processing';
  return 'pending';
}

function buildVisitTasks() {
  const visitObjects = queryVisitObjects({
    keyword: '',
    tab: 'ALL',
    area: 'ALL',
    risk: 'ALL',
    status: 'ALL',
    due: 'ALL',
  });

  return visitObjects.map((item) => {
    const status = normalizeVisitStatus(item.visitStatus);
    const deadlineDate = toDate(item.nextVisitAt);
    const targetType = item.objectSource === 'PERSON' ? 'person' : 'place';
    // 走访列表进入路径统一复用详情页底部“新增走访/新增回访”的同一路由。
    const startUrl = getVisitStartUrl({ targetType, targetId: item.objectId });
    return patchCommonFlags({
      id: `visit-${item.objectId}`,
      refId: item.objectId,
      type: 'visit',
      title: item.name || '未命名走访对象',
      subtitle: item.address || item.subName || '暂无地址',
      officerName: item.officerName || '责任民警待分配',
      risk: item.riskLevel || '中',
      status,
      statusText: status === 'done' ? '已完成' : status === 'processing' ? '进行中' : '待走访',
      ts: toDate(item.lastVisitAt)?.getTime() || nowTs(),
      timeText: `最近走访：${item.lastVisitAt || '暂无'}`,
      deadlineTs: deadlineDate?.getTime() || null,
      deadlineText: buildDeadlineText(deadlineDate?.getTime() || null),
      isToday: item.dueStatus === 'today',
      isClosedToday: status === 'done' && isToday(item.lastVisitAt),
      distanceKm: Number(item.distanceKm || 0),
      tags: [item.subName || item.objectType || '走访对象'],
      url: startUrl || item.sourceUrl || '',
      actionText: status === 'done' ? '查看' : '开始',
    });
  });
}

function mapTaskType(type) {
  if (type === 'PATROL') return '执法任务';
  if (type === 'CASE') return '案件';
  return '案件执法';
}

function buildCaseTasks() {
  const todos = getTodos();
  const taskTodoMap = new Map(
    todos
      .filter((item) => item.type === 'task')
      .map((item) => [item.refId, item])
  );
  const orderTodos = todos.filter((item) => item.type === 'order');

  const taskPart = getTasks().map((task, index) => {
    const todo = taskTodoMap.get(task.id);
    const status = normalizeStatus(todo?.status || task.status);
    const deadlineDate = toDate(todo?.deadline || task.deadline || new Date(nowTs() + (index + 2) * 3600000));
    const deadlineTs = deadlineDate?.getTime() || null;
    const doneAt = toDate(todo?.doneAt || task.doneAt);
    return patchCommonFlags({
      id: `case-task-${task.id}`,
      refId: task.id,
      type: 'case',
      title: task.title || '未命名任务',
      subtitle: task.address || '暂无地址',
      officerName: task.officerName || todo?.officerName || '承办民警待分配',
      risk: todo?.risk || task.riskLevel || '中',
      status,
      statusText: statusText(status),
      ts: toDate(task.createdAt)?.getTime() || nowTs(),
      timeText: `截止时间：${formatDateTime(deadlineDate)}`,
      deadlineTs,
      deadlineText: buildDeadlineText(deadlineTs),
      isToday: isToday(deadlineDate),
      isClosedToday: status === 'done' && isToday(doneAt || deadlineDate),
      distanceKm: null,
      tags: [mapTaskType(task.type)],
      url: task.url || '',
      actionText: status === 'done' ? '查看' : '处理',
    });
  });

  const orderPart = orderTodos.map((todo) => {
    const status = normalizeStatus(todo.status);
    const deadlineDate = toDate(todo.deadline);
    const deadlineTs = deadlineDate?.getTime() || null;
    return patchCommonFlags({
      id: `case-order-${todo.id}`,
      refId: todo.refId || todo.id,
      type: 'case',
      title: todo.title || '执法派单',
      subtitle: '执法派单',
      officerName: todo.officerName || '承办民警待分配',
      risk: todo.risk || '中',
      status,
      statusText: statusText(status),
      ts: toDate(todo.createdAt)?.getTime() || nowTs(),
      timeText: `截止时间：${formatDateTime(deadlineDate)}`,
      deadlineTs,
      deadlineText: buildDeadlineText(deadlineTs),
      isToday: isToday(deadlineDate),
      isClosedToday: status === 'done' && isToday(todo.doneAt || deadlineDate),
      distanceKm: null,
      tags: ['执法派单'],
      url: todo.url || '',
      actionText: status === 'done' ? '查看' : '处理',
    });
  });

  return [...taskPart, ...orderPart];
}

export function sortZoneTasks(list = []) {
  // 统一排序：超期优先 > 高风险优先 > 截止更近优先 > 时间更新优先。
  return list.slice().sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    if (a.isHighRisk !== b.isHighRisk) return a.isHighRisk ? -1 : 1;
    if (a.deadlineTs && b.deadlineTs && a.deadlineTs !== b.deadlineTs) return a.deadlineTs - b.deadlineTs;
    if (a.deadlineTs && !b.deadlineTs) return -1;
    if (!a.deadlineTs && b.deadlineTs) return 1;
    const riskA = riskRankMap[a.risk] ?? 9;
    const riskB = riskRankMap[b.risk] ?? 9;
    if (riskA !== riskB) return riskA - riskB;
    return (b.ts || 0) - (a.ts || 0);
  });
}

export function getZoneTasks(type = 'alarm') {
  const normalizedType = normalizeTaskType(type);
  const source =
    normalizedType === 'visit'
      ? buildVisitTasks()
      : normalizedType === 'revisit'
      ? buildRevisitTasks()
      : normalizedType === 'case'
      ? buildCaseTasks()
      : buildAlarmTasks();
  // 列表读取时统一应用指派覆盖，保证刷新页面后仍显示最新责任民警。
  return sortZoneTasks(source.map((item) => applyAssigneeOverride(normalizedType, item)));
}

export function filterZoneTasksByMode(type, list = [], mode = 'all') {
  const normalizedType = normalizeTaskType(type);
  if (mode === 'all') return list;

  if (normalizedType === 'alarm') {
    if (mode === 'today') return list.filter((item) => item.isToday);
    if (mode === 'pending') return list.filter((item) => item.isPending);
    if (mode === 'overdue') return list.filter((item) => item.isOverdue);
  }

  if (normalizedType === 'visit') {
    if (mode === 'today') return list.filter((item) => item.isToday);
    if (mode === 'overdue') return list.filter((item) => item.isOverdue);
    if (mode === 'highRisk') return list.filter((item) => item.isPending && item.isHighRisk);
  }

  if (normalizedType === 'revisit') {
    if (mode === 'today') return list.filter((item) => item.isToday && item.isPending);
    if (mode === 'dueSoon') return list.filter((item) => item.isDueSoon);
    if (mode === 'overdue') return list.filter((item) => item.isOverdue);
  }

  if (normalizedType === 'case') {
    if (mode === 'dueSoon') return list.filter((item) => item.isDueSoon);
    if (mode === 'overdue') return list.filter((item) => item.isOverdue);
    if (mode === 'closedToday') return list.filter((item) => item.isClosedToday);
  }

  return list;
}

export function getZoneTaskCounts(type, list = []) {
  const normalizedType = normalizeTaskType(type);
  if (normalizedType === 'alarm') {
    return {
      today: list.filter((item) => item.isToday).length,
      pending: list.filter((item) => item.isPending).length,
      overdue: list.filter((item) => item.isOverdue).length,
      all: list.length,
    };
  }
  if (normalizedType === 'visit') {
    return {
      today: list.filter((item) => item.isToday).length,
      overdue: list.filter((item) => item.isOverdue).length,
      highRisk: list.filter((item) => item.isPending && item.isHighRisk).length,
      all: list.length,
    };
  }
  if (normalizedType === 'revisit') {
    return {
      today: list.filter((item) => item.isToday && item.isPending).length,
      dueSoon: list.filter((item) => item.isDueSoon).length,
      overdue: list.filter((item) => item.isOverdue).length,
      all: list.length,
    };
  }
  return {
    dueSoon: list.filter((item) => item.isDueSoon).length,
    overdue: list.filter((item) => item.isOverdue).length,
    closedToday: list.filter((item) => item.isClosedToday).length,
    all: list.length,
  };
}

export function getZoneModuleStats() {
  const alarmList = getZoneTasks('alarm');
  const visitList = getZoneTasks('visit');
  const revisitList = getZoneTasks('revisit');
  const caseList = getZoneTasks('case');

  const zoneTodoTotal =
    alarmList.filter((item) => item.isPending).length +
    visitList.filter((item) => item.isPending).length +
    revisitList.filter((item) => item.isPending).length +
    caseList.filter((item) => item.isPending).length;

  const zoneOverdueTotal =
    alarmList.filter((item) => item.isOverdue).length +
    visitList.filter((item) => item.isOverdue).length +
    revisitList.filter((item) => item.isOverdue).length +
    caseList.filter((item) => item.isOverdue).length;

  const zoneHighRiskTotal =
    alarmList.filter((item) => item.isPending && item.isHighRisk).length +
    visitList.filter((item) => item.isPending && item.isHighRisk).length +
    revisitList.filter((item) => item.isPending && item.isHighRisk).length +
    caseList.filter((item) => item.isPending && item.isHighRisk).length;

  return {
    summary: {
      todoTotal: zoneTodoTotal,
      overdueTotal: zoneOverdueTotal,
      highRiskTotal: zoneHighRiskTotal,
    },
    modules: {
      alarm: {
        title: '警情',
        total: alarmList.filter((item) => item.isPending).length,
        subA: { label: '未回告', value: alarmList.filter((item) => item.isPending).length },
        subB: { label: '超期', value: alarmList.filter((item) => item.isOverdue).length },
        warningCount: alarmList.filter((item) => item.isOverdue || item.isHighRisk).length,
        url: '/pages/zoneTasks/list?type=alarm',
      },
      visit: {
        title: '走访',
        total: visitList.filter((item) => item.isPending).length,
        subA: { label: '今日', value: visitList.filter((item) => item.isToday).length },
        subB: { label: '逾期', value: visitList.filter((item) => item.isOverdue).length },
        warningCount: visitList.filter((item) => item.isOverdue || item.isHighRisk).length,
        url: '/pages/zoneTasks/list?type=visit',
      },
      revisit: {
        title: '回访纠纷',
        total: revisitList.filter((item) => item.isPending).length,
        subA: { label: '待回访', value: revisitList.filter((item) => item.isPending).length },
        subB: { label: '临期(24h)', value: revisitList.filter((item) => item.isDueSoon).length },
        warningCount: revisitList.filter((item) => item.isOverdue || item.isHighRisk).length,
        url: '/pages/zoneTasks/list?type=revisit',
      },
      case: {
        title: '案件执法',
        total: caseList.filter((item) => item.isPending).length,
        subA: { label: '临期任务', value: caseList.filter((item) => item.isDueSoon).length },
        subB: { label: '今日闭环', value: caseList.filter((item) => item.isClosedToday).length },
        warningCount: caseList.filter((item) => item.isOverdue || item.isHighRisk).length,
        url: '/pages/zoneTasks/list?type=case',
      },
    },
    listMap: {
      alarm: alarmList,
      visit: visitList,
      revisit: revisitList,
      case: caseList,
    },
  };
}

export function updateZoneTaskAssignee(type, id, officer) {
  // 对外暴露统一指派方法，页面只传 type/id/officer，不关心底层存储细节。
  const normalizedType = normalizeTaskType(type);
  const map = getZoneAssignMap();
  const key = `${normalizedType}:${id}`;
  map[key] = {
    officerId: officer?.id || '',
    officerName: officer?.name || '',
    assignedAt: formatDateTime(Date.now()),
  };
  saveZoneAssignMap(map);
  return map[key];
}
