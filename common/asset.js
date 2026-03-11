const STORAGE_KEYS = {
  assets: 'asset_items',
  logs: 'asset_logs',
  inventoryReports: 'asset_inventory_reports',
  inventoryTasks: 'asset_inventory_tasks',
};

export const ASSET_STATUS_OPTIONS = ['未领用', '已领用', '借用中', '维修中', '报废', '盘点异常'];
export const ASSET_CATEGORY_OPTIONS = ['执法设备', '通信设备', '办公设备', '保障设备', '技侦设备', '防护装备'];
export const LABEL_STATUS_OPTIONS = ['标签正常', '标签损坏', '标签缺失'];
export const PHYSICAL_STATUS_OPTIONS = ['正常', '闲置', '损坏', '缺失'];
export const INVENTORY_EXCEPTION_OPTIONS = ['正常', '位置异常', '使用人异常', '标签异常', '状态异常', '闲置未用', '破损待维修', '盘盈', '其他异常'];
const STATION_NAME = '石鼓派出所';
const LEGACY_STATION_NAME = '龙石派出所';
export const ASSET_OWNER_OPTIONS = [
  { id: 'u-001', name: '张三', dept: STATION_NAME },
  { id: 'u-002', name: '李警官', dept: STATION_NAME },
  { id: 'u-003', name: '王警官', dept: STATION_NAME },
  { id: 'u-004', name: '陈警官', dept: STATION_NAME },
  { id: 'u-005', name: '周警官', dept: '桂南警务区' },
  { id: 'u-006', name: '刘警官', dept: STATION_NAME },
  { id: 'u-007', name: '何警官', dept: STATION_NAME },
];

const CURRENT_USER = {
  id: 'u-001',
  name: '张三',
  dept: STATION_NAME,
  position: '一级警员',
};

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensure(key, fallback) {
  const cached = uni.getStorageSync(key);
  if (Array.isArray(fallback)) {
    if (Array.isArray(cached) && cached.length) return cached;
    const next = clone(fallback);
    uni.setStorageSync(key, next);
    return next;
  }
  if (cached && typeof cached === 'object') return cached;
  const next = clone(fallback);
  uni.setStorageSync(key, next);
  return next;
}

function makeLog(type, asset, note = '', extra = {}) {
  return {
    id: `asset-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    code: asset?.code || extra.code || '',
    name: asset?.name || extra.name || '未知资产',
    operator: extra.operator || CURRENT_USER.name,
    operatorId: extra.operatorId || CURRENT_USER.id,
    dept: extra.dept || CURRENT_USER.dept,
    time: extra.time || nowText(),
    note,
    ...extra,
  };
}

function normalizeAsset(item, index = 0) {
  const department = item.department || item.dept || CURRENT_USER.dept;
  const ownerName = item.ownerName || item.holder || '';
  const receiveTime = item.receiveTime || item.claimTime || '';
  return {
    id: item.id || `asset-${index + 1}`,
    code: item.code || `ASSET-${String(index + 1).padStart(6, '0')}`,
    name: item.name || '未命名资产',
    category: item.category || '办公设备',
    model: item.model || '标准型',
    department,
    dept: department,
    location: item.location || `${STATION_NAME}装备室`,
    ownerId: item.ownerId || '',
    ownerName,
    holder: ownerName,
    receiveTime,
    claimTime: receiveTime,
    status: ASSET_STATUS_OPTIONS.includes(item.status) ? item.status : '未领用',
    labelStatus: LABEL_STATUS_OPTIONS.includes(item.labelStatus) ? item.labelStatus : '标签正常',
    physicalStatus: PHYSICAL_STATUS_OPTIONS.includes(item.physicalStatus) ? item.physicalStatus : '正常',
    lastInventoryTime: item.lastInventoryTime || '',
    lastInventoryResult: item.lastInventoryResult || '',
    latestAction: item.latestAction || '',
    logs: Array.isArray(item.logs) ? item.logs : [],
  };
}

function normalizeTask(task, index = 0) {
  return {
    id: task.id || `inventory-task-${index + 1}`,
    batchNo: task.batchNo || `PD-${String(index + 1).padStart(4, '0')}`,
    startTime: task.startTime || nowText(),
    finishTime: task.finishTime || '',
    scopeType: task.scopeType || 'DEPARTMENT',
    scopeLabel: task.scopeLabel || CURRENT_USER.dept,
    operator: task.operator || CURRENT_USER.name,
    dept: task.dept || CURRENT_USER.dept,
    status: task.status || 'processing',
    expectedCodes: Array.isArray(task.expectedCodes) ? task.expectedCodes : [],
    scannedItems: Array.isArray(task.scannedItems) ? task.scannedItems : [],
    summary: task.summary || null,
    note: task.note || '',
  };
}

function normalizeReport(report, index = 0) {
  return {
    id: report.id || `inventory-report-${index + 1}`,
    batchNo: report.batchNo || `PD-${String(index + 1).padStart(4, '0')}`,
    dept: report.dept || CURRENT_USER.dept,
    operator: report.operator || CURRENT_USER.name,
    startTime: report.startTime || nowText(),
    finishTime: report.finishTime || nowText(),
    scopeLabel: report.scopeLabel || CURRENT_USER.dept,
    summary: report.summary || {},
    scannedItems: Array.isArray(report.scannedItems) ? report.scannedItems : [],
    anomalyItems: Array.isArray(report.anomalyItems) ? report.anomalyItems : [],
    missingItems: Array.isArray(report.missingItems) ? report.missingItems : [],
  };
}

function appendGlobalLog(log) {
  const logs = [log, ...getAssetLogs()];
  uni.setStorageSync(STORAGE_KEYS.logs, logs);
}

function saveNormalizedAssets(list) {
  uni.setStorageSync(STORAGE_KEYS.assets, list.map((item, index) => normalizeAsset(item, index)));
}

function patchAsset(code, updater) {
  const list = getAssetItems();
  const index = list.findIndex((item) => item.code === code);
  if (index < 0) return { ok: false, message: '未找到该资产', asset: null };
  const current = clone(list[index]);
  const next = normalizeAsset(updater(current), index);
  list[index] = next;
  saveNormalizedAssets(list);
  return { ok: true, asset: next };
}

function assetTemplate(config) {
  return normalizeAsset(config);
}

function replaceLegacyStationText(value) {
  return typeof value === 'string' ? value.replace(new RegExp(LEGACY_STATION_NAME, 'g'), STATION_NAME) : value;
}

function migrateStoredAssets(list) {
  return list.map((item, index) =>
    normalizeAsset({
      ...item,
      department: replaceLegacyStationText(item.department || item.dept),
      dept: replaceLegacyStationText(item.dept || item.department),
      location: replaceLegacyStationText(item.location),
      logs: Array.isArray(item.logs)
        ? item.logs.map((log) => ({
            ...log,
            dept: replaceLegacyStationText(log.dept),
            note: replaceLegacyStationText(log.note),
          }))
        : [],
    }, index),
  );
}

function migrateStoredLogs(list) {
  return list.map((item) => ({
    ...item,
    dept: replaceLegacyStationText(item.dept),
    note: replaceLegacyStationText(item.note),
  }));
}

function migrateStoredReports(list) {
  return list.map((item, index) =>
    normalizeReport({
      ...item,
      dept: replaceLegacyStationText(item.dept),
      scopeLabel: replaceLegacyStationText(item.scopeLabel),
      anomalyItems: (item.anomalyItems || []).map((row) => ({
        ...row,
        location: replaceLegacyStationText(row.location),
        actualLocation: replaceLegacyStationText(row.actualLocation),
      })),
      missingItems: (item.missingItems || []).map((row) => ({
        ...row,
        location: replaceLegacyStationText(row.location),
      })),
    }, index),
  );
}

function migrateStoredTasks(list) {
  return list.map((item, index) =>
    normalizeTask({
      ...item,
      dept: replaceLegacyStationText(item.dept),
      scopeLabel: replaceLegacyStationText(item.scopeLabel),
      scannedItems: (item.scannedItems || []).map((row) => ({
        ...row,
        expectedLocation: replaceLegacyStationText(row.expectedLocation),
        actualLocation: replaceLegacyStationText(row.actualLocation),
      })),
    }, index),
  );
}

function mergeDefaultAssets(list) {
  const currentCodes = new Set(list.map((item) => item.code));
  const extras = DEFAULT_ASSETS.filter((item) => !currentCodes.has(item.code));
  return [...list, ...extras];
}

function mergeDefaultReports(list) {
  const currentIds = new Set(list.map((item) => item.id));
  const extras = DEFAULT_INVENTORY_REPORTS.filter((item) => !currentIds.has(item.id));
  return [...list, ...extras];
}

const DEFAULT_ASSETS = [
  assetTemplate({
    id: 'asset-001',
    code: 'ASSET-000101',
    name: '执法记录仪',
    category: '执法设备',
    model: 'DSJ-A9',
    department: STATION_NAME,
    location: `${STATION_NAME}值班室`,
    ownerId: 'u-001',
    ownerName: '张三',
    receiveTime: '2025-06-10 09:20',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    lastInventoryTime: '2025-07-01 09:15',
    lastInventoryResult: '正常',
    latestAction: '申领成功',
    logs: [
      makeLog('申领', { code: 'ASSET-000101', name: '执法记录仪' }, '通过扫码申领成功', { time: '2025-06-10 09:20' }),
      makeLog('创建入库', { code: 'ASSET-000101', name: '执法记录仪' }, '资产建档入库', { time: '2025-05-30 10:00', operator: '装备管理员' }),
    ],
  }),
  assetTemplate({
    id: 'asset-002',
    code: 'ASSET-000102',
    name: '对讲机',
    category: '通信设备',
    model: 'DJJ-X5',
    department: STATION_NAME,
    location: `${STATION_NAME}备勤区`,
    ownerId: 'u-001',
    ownerName: '张三',
    receiveTime: '2025-07-02 14:10',
    status: '借用中',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    lastInventoryTime: '2025-07-01 09:20',
    lastInventoryResult: '正常',
    latestAction: '借用中',
  }),
  assetTemplate({
    id: 'asset-003',
    code: 'ASSET-000103',
    name: '笔记本电脑',
    category: '办公设备',
    model: 'ThinkPad E14',
    department: STATION_NAME,
    location: `${STATION_NAME}综合室`,
    ownerId: 'u-001',
    ownerName: '张三',
    receiveTime: '2025-05-21 11:35',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '线下交接后补录申领',
  }),
  assetTemplate({
    id: 'asset-004',
    code: 'ASSET-000104',
    name: '执法终端',
    category: '执法设备',
    model: 'ZFD-D3',
    department: STATION_NAME,
    location: `${STATION_NAME}接警台`,
    ownerId: 'u-002',
    ownerName: '李警官',
    receiveTime: '2025-06-12 08:40',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '当前归属李警官',
  }),
  assetTemplate({
    id: 'asset-005',
    code: 'ASSET-000105',
    name: '酒精测试仪',
    category: '执法设备',
    model: 'JJC-08',
    department: STATION_NAME,
    location: `${STATION_NAME}装备柜A-03`,
    status: '未领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '待申领',
  }),
  assetTemplate({
    id: 'asset-006',
    code: 'ASSET-000106',
    name: '移动电源',
    category: '保障设备',
    model: 'PD-20000',
    department: STATION_NAME,
    location: `${STATION_NAME}装备柜B-01`,
    status: '未领用',
    labelStatus: '标签正常',
    physicalStatus: '闲置',
    latestAction: '待申领',
  }),
  assetTemplate({
    id: 'asset-007',
    code: 'ASSET-000107',
    name: '无人机',
    category: '技侦设备',
    model: 'Mavic 3E',
    department: STATION_NAME,
    location: `${STATION_NAME}装备室`,
    ownerId: 'u-003',
    ownerName: '王警官',
    receiveTime: '2025-04-28 16:05',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '技侦巡查使用中',
  }),
  assetTemplate({
    id: 'asset-008',
    code: 'ASSET-000108',
    name: '盾牌',
    category: '防护装备',
    model: 'DP-FB',
    department: STATION_NAME,
    location: `${STATION_NAME}装备维修区`,
    status: '维修中',
    labelStatus: '标签损坏',
    physicalStatus: '损坏',
    latestAction: '报修处理中',
  }),
  assetTemplate({
    id: 'asset-009',
    code: 'ASSET-000109',
    name: '防暴头盔',
    category: '防护装备',
    model: 'FBTK-2',
    department: STATION_NAME,
    location: `${STATION_NAME}报废暂存点`,
    status: '报废',
    labelStatus: '标签缺失',
    physicalStatus: '缺失',
    latestAction: '已报废',
  }),
  assetTemplate({
    id: 'asset-010',
    code: 'ASSET-000110',
    name: '执法记录仪',
    category: '执法设备',
    model: 'DSJ-A8',
    department: STATION_NAME,
    location: '长命水警务室',
    ownerId: 'u-004',
    ownerName: '陈警官',
    receiveTime: '2025-06-18 10:00',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '长命水警务室在用',
  }),
  assetTemplate({
    id: 'asset-011',
    code: 'ASSET-000111',
    name: '对讲机',
    category: '通信设备',
    model: 'DJJ-X6',
    department: STATION_NAME,
    location: '桂南警务区',
    ownerId: 'u-001',
    ownerName: '张三',
    receiveTime: '2025-07-12 09:45',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '列表申领成功',
  }),
  assetTemplate({
    id: 'asset-012',
    code: 'ASSET-000112',
    name: '打印机',
    category: '办公设备',
    model: 'HP-Laser 126',
    department: STATION_NAME,
    location: `${STATION_NAME}办公室`,
    status: '未领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '待分配',
  }),
  assetTemplate({
    id: 'asset-013',
    code: 'ASSET-000113',
    name: '执法记录仪',
    category: '执法设备',
    model: 'DSJ-A10',
    department: STATION_NAME,
    location: `${STATION_NAME}综合勤务室`,
    ownerId: 'u-006',
    ownerName: '刘警官',
    receiveTime: '2025-08-16 08:25',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '日常巡逻佩戴使用',
  }),
  assetTemplate({
    id: 'asset-014',
    code: 'ASSET-000114',
    name: '单警装备包',
    category: '防护装备',
    model: 'DJZB-01',
    department: STATION_NAME,
    location: `${STATION_NAME}装备库A区`,
    ownerId: 'u-007',
    ownerName: '何警官',
    receiveTime: '2025-11-03 10:40',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '装备已发放至何警官',
  }),
  assetTemplate({
    id: 'asset-015',
    code: 'ASSET-000115',
    name: '现场执法平板',
    category: '办公设备',
    model: 'PAD-POLICE-11',
    department: STATION_NAME,
    location: `${STATION_NAME}社区警务队`,
    ownerId: 'u-002',
    ownerName: '李警官',
    receiveTime: '2026-01-12 15:20',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '社区入户走访使用中',
  }),
  assetTemplate({
    id: 'asset-016',
    code: 'ASSET-000116',
    name: '4G布控球',
    category: '技侦设备',
    model: 'BKQ-4G',
    department: STATION_NAME,
    location: `${STATION_NAME}视频巡控室`,
    ownerId: 'u-003',
    ownerName: '王警官',
    receiveTime: '2025-12-20 09:10',
    status: '已领用',
    labelStatus: '标签正常',
    physicalStatus: '正常',
    latestAction: '应急布控任务中',
  }),
];

const DEFAULT_LOGS = [
  makeLog('申领', { code: 'ASSET-000111', name: '对讲机' }, '通过列表申领成功', { time: '2025-07-12 09:45' }),
  makeLog('扫码识别', { code: 'ASSET-000104', name: '执法终端' }, '扫码查看归属：李警官', { time: '2025-07-13 08:10' }),
  makeLog('盘点核验', { code: 'ASSET-000107', name: '无人机' }, '盘点确认在库，核验结果正常', { time: '2025-07-13 15:32' }),
  makeLog('创建入库', { code: 'ASSET-000103', name: '笔记本电脑' }, '资产入库建档', { time: '2025-05-18 10:20', operator: '装备管理员' }),
  makeLog('变更归属', { code: 'ASSET-000115', name: '现场执法平板' }, '从装备库移交至李警官名下', { time: '2026-01-12 15:20', operator: '装备管理员' }),
  makeLog('申领', { code: 'ASSET-000113', name: '执法记录仪' }, '刘警官通过编号方式申领', { time: '2025-08-16 08:25', operator: '刘警官' }),
  makeLog('盘点核验', { code: 'ASSET-000108', name: '盾牌' }, '盘点发现实物破损，已保持维修中状态', { time: '2026-02-18 16:40', operator: '李警官' }),
];

const DEFAULT_INVENTORY_REPORTS = [
  normalizeReport({
    id: 'inventory-report-001',
    batchNo: 'PD-20250701-01',
    dept: STATION_NAME,
    operator: '张三',
    startTime: '2025-07-01 09:00',
    finishTime: '2025-07-01 10:10',
    scopeLabel: `${STATION_NAME}全部资产`,
    summary: {
      expectedCount: 12,
      countedCount: 10,
      uncountedCount: 2,
      abnormalCount: 3,
      surplusCount: 1,
      shortageCount: 2,
      locationMismatchCount: 1,
      ownerMismatchCount: 1,
      statusMismatchCount: 1,
    },
    scannedItems: [
      {
        code: 'ASSET-000101',
        name: '执法记录仪',
        model: 'DSJ-A9',
        category: '执法设备',
        department: STATION_NAME,
        expectedLocation: `${STATION_NAME}值班室`,
        actualLocation: `${STATION_NAME}值班室`,
        expectedOwnerName: '张三',
        actualOwnerName: '张三',
        status: '已领用',
        labelStatus: '标签正常',
        physicalStatus: '正常',
        scanTime: '2025-07-01 09:08',
        result: '正常',
        exceptionType: '正常',
        note: '',
      },
      {
        code: 'ASSET-000108',
        name: '盾牌',
        model: 'DP-FB',
        category: '防护装备',
        department: STATION_NAME,
        expectedLocation: `${STATION_NAME}装备维修区`,
        actualLocation: `${STATION_NAME}装备维修区`,
        expectedOwnerName: '无',
        actualOwnerName: '无',
        status: '维修中',
        labelStatus: '标签损坏',
        physicalStatus: '损坏',
        scanTime: '2025-07-01 09:26',
        result: '异常',
        exceptionType: '状态异常、标签异常、破损待维修',
        note: '盾面开裂，已送修',
      },
      {
        code: 'ASSET-000115',
        name: '现场执法平板',
        model: 'PAD-POLICE-11',
        category: '办公设备',
        department: STATION_NAME,
        expectedLocation: `${STATION_NAME}社区警务队`,
        actualLocation: `${STATION_NAME}案管室`,
        expectedOwnerName: '李警官',
        actualOwnerName: '陈警官',
        status: '已领用',
        labelStatus: '标签正常',
        physicalStatus: '正常',
        scanTime: '2025-07-01 09:42',
        result: '异常',
        exceptionType: '位置异常、使用人异常',
        note: '临时调拨未更新台账',
      },
      {
        code: 'ASSET-X00001',
        name: '便携打印机',
        model: 'PRINT-MINI',
        category: '办公设备',
        department: STATION_NAME,
        expectedLocation: '账上无',
        actualLocation: `${STATION_NAME}户政窗口`,
        expectedOwnerName: '账上无',
        actualOwnerName: '周警官',
        status: '盘点异常',
        labelStatus: '标签缺失',
        physicalStatus: '正常',
        scanTime: '2025-07-01 09:55',
        result: '异常',
        exceptionType: '盘盈',
        note: '现场发现账外设备，待补录',
      },
    ],
    anomalyItems: [
      {
        code: 'ASSET-000108',
        name: '盾牌',
        model: 'DP-FB',
        location: `${STATION_NAME}装备维修区`,
        ownerName: '',
        status: '维修中',
        result: '异常',
        exceptionType: '状态异常、标签异常、破损待维修',
      },
      {
        code: 'ASSET-000115',
        name: '现场执法平板',
        model: 'PAD-POLICE-11',
        location: `${STATION_NAME}社区警务队`,
        actualLocation: `${STATION_NAME}案管室`,
        ownerName: '李警官',
        actualOwnerName: '陈警官',
        status: '已领用',
        result: '异常',
        exceptionType: '位置异常、使用人异常',
      },
      {
        code: 'ASSET-X00001',
        name: '便携打印机',
        model: 'PRINT-MINI',
        location: '账上无',
        actualLocation: `${STATION_NAME}户政窗口`,
        ownerName: '账上无',
        actualOwnerName: '周警官',
        status: '盘点异常',
        result: '异常',
        exceptionType: '盘盈',
      },
    ],
    missingItems: [
      { code: 'ASSET-000109', name: '防暴头盔', model: 'FBTK-2', location: `${STATION_NAME}报废暂存点`, ownerName: '', status: '报废', result: '盘亏', exceptionType: '盘亏' },
      { code: 'ASSET-000112', name: '打印机', model: 'HP-Laser 126', location: `${STATION_NAME}办公室`, ownerName: '', status: '未领用', result: '盘亏', exceptionType: '盘亏' },
    ],
  }),
  normalizeReport({
    id: 'inventory-report-002',
    batchNo: 'PD-20260218-02',
    dept: STATION_NAME,
    operator: '李警官',
    startTime: '2026-02-18 14:00',
    finishTime: '2026-02-18 16:48',
    scopeLabel: '执法设备',
    summary: {
      expectedCount: 6,
      countedCount: 6,
      uncountedCount: 0,
      abnormalCount: 1,
      surplusCount: 0,
      shortageCount: 0,
      locationMismatchCount: 0,
      ownerMismatchCount: 0,
      statusMismatchCount: 1,
    },
    scannedItems: [
      {
        code: 'ASSET-000101',
        name: '执法记录仪',
        model: 'DSJ-A9',
        category: '执法设备',
        department: STATION_NAME,
        expectedLocation: `${STATION_NAME}值班室`,
        actualLocation: `${STATION_NAME}值班室`,
        expectedOwnerName: '张三',
        actualOwnerName: '张三',
        status: '已领用',
        labelStatus: '标签正常',
        physicalStatus: '正常',
        scanTime: '2026-02-18 14:12',
        result: '正常',
        exceptionType: '正常',
        note: '',
      },
      {
        code: 'ASSET-000105',
        name: '酒精测试仪',
        model: 'JJC-08',
        category: '执法设备',
        department: STATION_NAME,
        expectedLocation: `${STATION_NAME}装备柜A-03`,
        actualLocation: `${STATION_NAME}装备柜A-03`,
        expectedOwnerName: '无',
        actualOwnerName: '无',
        status: '维修中',
        labelStatus: '标签正常',
        physicalStatus: '损坏',
        scanTime: '2026-02-18 15:03',
        result: '异常',
        exceptionType: '状态异常、破损待维修',
        note: '酒精测试模块失灵，送修中',
      },
    ],
    anomalyItems: [
      {
        code: 'ASSET-000105',
        name: '酒精测试仪',
        model: 'JJC-08',
        location: `${STATION_NAME}装备柜A-03`,
        ownerName: '无',
        status: '维修中',
        result: '异常',
        exceptionType: '状态异常、破损待维修',
      },
    ],
    missingItems: [],
  }),
];

const DEFAULT_INVENTORY_TASKS = [
  normalizeTask({
    id: 'inventory-task-001',
    batchNo: 'PD-20260312-01',
    startTime: nowText(),
    scopeType: 'DEPARTMENT',
    scopeLabel: `${CURRENT_USER.dept}全部资产`,
    operator: CURRENT_USER.name,
    dept: CURRENT_USER.dept,
    status: 'processing',
    expectedCodes: DEFAULT_ASSETS.filter((item) => item.department === CURRENT_USER.dept).map((item) => item.code),
    scannedItems: [],
  }),
];

export function getCurrentAssetUser() {
  return { ...CURRENT_USER };
}

export function getAssetItems() {
  const list = mergeDefaultAssets(migrateStoredAssets(ensure(STORAGE_KEYS.assets, DEFAULT_ASSETS)));
  saveNormalizedAssets(list);
  return list;
}

export function saveAssetItems(list) {
  saveNormalizedAssets(list);
}

export function getAssetLogs() {
  const list = migrateStoredLogs(ensure(STORAGE_KEYS.logs, DEFAULT_LOGS));
  uni.setStorageSync(STORAGE_KEYS.logs, list);
  return list;
}

export function saveAssetLogs(list) {
  uni.setStorageSync(STORAGE_KEYS.logs, list);
}

export function getInventoryReports() {
  const list = mergeDefaultReports(migrateStoredReports(ensure(STORAGE_KEYS.inventoryReports, DEFAULT_INVENTORY_REPORTS)));
  saveInventoryReports(list);
  return list;
}

export function saveInventoryReports(list) {
  uni.setStorageSync(STORAGE_KEYS.inventoryReports, list.map((item, index) => normalizeReport(item, index)));
}

export function getInventoryTasks() {
  const list = migrateStoredTasks(ensure(STORAGE_KEYS.inventoryTasks, DEFAULT_INVENTORY_TASKS));
  saveInventoryTasks(list);
  return list;
}

export function saveInventoryTasks(list) {
  uni.setStorageSync(STORAGE_KEYS.inventoryTasks, list.map((item, index) => normalizeTask(item, index)));
}

export function findAssetByCode(code) {
  return getAssetItems().find((item) => item.code === code);
}

export function findAssetById(id) {
  return getAssetItems().find((item) => item.id === id);
}

export function getAssetLatestLog(asset) {
  return Array.isArray(asset?.logs) && asset.logs.length ? asset.logs[0] : null;
}

export function getMyAssets(userName = CURRENT_USER.name) {
  return getAssetItems().filter((item) => item.ownerName === userName);
}

export function getBorrowedAssets(userName = CURRENT_USER.name) {
  return getMyAssets(userName).filter((item) => ['已领用', '借用中'].includes(item.status));
}

export function getDepartmentAssetCount(dept = CURRENT_USER.dept) {
  return getAssetItems().filter((item) => item.department === dept).length;
}

export function getClaimableAssets() {
  return getAssetItems().filter((item) => item.status === '未领用');
}

export function searchAssets(keyword = '') {
  const text = String(keyword || '').trim();
  if (!text) return getAssetItems();
  return getAssetItems().filter((item) =>
    [item.code, item.name, item.ownerName, item.location, item.model].some((field) => String(field || '').includes(text)),
  );
}

export function getAssetLedger(filters = {}) {
  const { category = '', status = '', department = '', keyword = '' } = filters;
  return searchAssets(keyword).filter((item) => {
    if (category && category !== '全部类别' && item.category !== category) return false;
    if (status && status !== '全部状态' && item.status !== status) return false;
    if (department && department !== '全部部门' && item.department !== department) return false;
    return true;
  });
}

function addAssetLogToItem(asset, log) {
  return {
    ...asset,
    latestAction: log.type,
    logs: [log, ...(asset.logs || [])],
  };
}

export function claimAsset(code, payload = {}) {
  const user = getCurrentAssetUser();
  const asset = findAssetByCode(code);
  if (!asset) return { ok: false, message: '未找到该资产', asset: null };
  if (asset.status === '已领用' || asset.status === '借用中') return { ok: false, message: '该资产已被领用', asset };
  if (asset.status === '维修中') return { ok: false, message: '该资产维修中，暂不可申领', asset };
  if (asset.status === '报废') return { ok: false, message: '该资产不可申领', asset };

  const result = patchAsset(code, (current) => {
    const claimTime = payload.receiveTime || payload.claimTime || nowText();
    const log = makeLog('申领', current, payload.note || '资产申领成功', { noteType: 'CLAIM', time: claimTime });
    appendGlobalLog(log);
    return addAssetLogToItem(
      {
        ...current,
        ownerId: payload.ownerId || user.id,
        ownerName: payload.ownerName || payload.holder || user.name,
        department: payload.department || payload.dept || user.dept,
        dept: payload.department || payload.dept || user.dept,
        receiveTime: claimTime,
        claimTime,
        status: '已领用',
        lastInventoryResult: current.lastInventoryResult || '待盘点',
      },
      log,
    );
  });
  return { ok: true, message: '申领成功', asset: result.asset };
}

export function recordAssetScan(code, note = '') {
  const asset = findAssetByCode(code);
  if (!asset) return null;
  const log = makeLog('扫码识别', asset, note || `扫码查看归属：${asset.ownerName || '未领用'}`);
  appendGlobalLog(log);
  patchAsset(code, (current) => addAssetLogToItem(current, log));
  return findAssetByCode(code);
}

export function returnAsset(code, note = '') {
  const asset = findAssetByCode(code);
  if (!asset) return { ok: false, message: '未找到该资产', asset: null };
  const result = patchAsset(code, (current) => {
    const log = makeLog('归还', current, note || '资产归还完成');
    appendGlobalLog(log);
    return addAssetLogToItem(
      {
        ...current,
        ownerId: '',
        ownerName: '',
        holder: '',
        receiveTime: '',
        claimTime: '',
        status: '未领用',
      },
      log,
    );
  });
  return { ok: true, message: '归还成功', asset: result.asset };
}

export function transferAsset(code, payload = {}) {
  const asset = findAssetByCode(code);
  if (!asset) return { ok: false, message: '未找到该资产', asset: null };
  if (!payload.ownerName) return { ok: false, message: '请选择新归属人', asset };
  const result = patchAsset(code, (current) => {
    const log = makeLog('变更归属', current, payload.reason || `归属变更为${payload.ownerName}`, {
      noteType: 'TRANSFER',
      fromOwner: current.ownerName || '无',
      toOwner: payload.ownerName,
    });
    appendGlobalLog(log);
    return addAssetLogToItem(
      {
        ...current,
        ownerId: payload.ownerId || current.ownerId,
        ownerName: payload.ownerName,
        holder: payload.ownerName,
        department: payload.department || current.department,
        dept: payload.department || current.department,
        status: '已领用',
      },
      log,
    );
  });
  return { ok: true, message: '归属变更成功', asset: result.asset };
}

export function repairAsset(code, payload = {}) {
  const asset = findAssetByCode(code);
  if (!asset) return { ok: false, message: '未找到该资产', asset: null };
  const result = patchAsset(code, (current) => {
    const log = makeLog('报修', current, payload.description || payload.faultType || '提交报修申请', {
      noteType: 'REPAIR',
      faultType: payload.faultType || '设备故障',
    });
    appendGlobalLog(log);
    return addAssetLogToItem(
      {
        ...current,
        status: '维修中',
        physicalStatus: '损坏',
      },
      log,
    );
  });
  return { ok: true, message: '报修申请已提交', asset: result.asset };
}

export function scrapAsset(code, payload = {}) {
  const asset = findAssetByCode(code);
  if (!asset) return { ok: false, message: '未找到该资产', asset: null };
  const result = patchAsset(code, (current) => {
    const log = makeLog('报废申请', current, payload.reason || payload.reasonType || '提交报废申请', {
      noteType: 'SCRAP',
      reasonType: payload.reasonType || '损坏无法修复',
    });
    appendGlobalLog(log);
    return addAssetLogToItem(
      {
        ...current,
        status: '报废',
        ownerId: '',
        ownerName: '',
        holder: '',
        physicalStatus: payload.reasonType === '丢失' ? '缺失' : current.physicalStatus,
      },
      log,
    );
  });
  return { ok: true, message: '报废申请已提交', asset: result.asset };
}

export function getInventoryTaskById(taskId) {
  return getInventoryTasks().find((item) => item.id === taskId);
}

export function getInventoryReportById(reportId) {
  return getInventoryReports().find((item) => item.id === reportId);
}

export function getActiveInventoryTask() {
  return getInventoryTasks().find((item) => item.status === 'processing') || null;
}

export function createInventoryTask(payload = {}) {
  const user = getCurrentAssetUser();
  const assets = getAssetItems();
  let scopedAssets = assets;
  if (payload.scopeType === 'DEPARTMENT') scopedAssets = assets.filter((item) => item.department === (payload.department || user.dept));
  if (payload.scopeType === 'CATEGORY') scopedAssets = assets.filter((item) => item.category === payload.category);
  if (payload.scopeType === 'LOCATION') scopedAssets = assets.filter((item) => item.location === payload.location);
  const task = normalizeTask({
    id: `inventory-task-${Date.now()}`,
    batchNo: `PD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(getInventoryTasks().length + 1).padStart(2, '0')}`,
    startTime: nowText(),
    scopeType: payload.scopeType || 'DEPARTMENT',
    scopeLabel:
      payload.scopeLabel ||
      (payload.scopeType === 'CATEGORY'
        ? payload.category
        : payload.scopeType === 'LOCATION'
          ? payload.location
          : payload.scopeType === 'ALL'
            ? '全部资产'
            : `${payload.department || user.dept}全部资产`),
    operator: payload.operator || user.name,
    dept: payload.department || user.dept,
    status: 'processing',
    expectedCodes: scopedAssets.map((item) => item.code),
    scannedItems: [],
    note: payload.note || '',
  });
  saveInventoryTasks([task, ...getInventoryTasks().filter((item) => item.status !== 'processing')]);
  return task;
}

export function ensureActiveInventoryTask() {
  const task = getActiveInventoryTask();
  return task || createInventoryTask({ scopeType: 'DEPARTMENT', department: CURRENT_USER.dept });
}

function buildInventoryResult(asset, payload) {
  const actualLocation = payload.actualLocation || asset.location;
  const actualOwnerName = payload.actualOwnerName || asset.ownerName || '';
  const labelStatus = payload.labelStatus || asset.labelStatus || '标签正常';
  const physicalStatus = payload.physicalStatus || asset.physicalStatus || '正常';
  const status = payload.status || asset.status;
  const exceptionTypes = [];

  if ((payload.exceptionType || '正常') !== '正常') exceptionTypes.push(payload.exceptionType);
  if (actualLocation !== asset.location) exceptionTypes.push('位置异常');
  if (actualOwnerName !== (asset.ownerName || '')) exceptionTypes.push('使用人异常');
  if (labelStatus !== '标签正常') exceptionTypes.push('标签异常');
  if (status !== asset.status) exceptionTypes.push('状态异常');
  if (physicalStatus === '闲置') exceptionTypes.push('闲置未用');
  if (physicalStatus === '损坏') exceptionTypes.push('破损待维修');

  const uniqueTypes = [...new Set(exceptionTypes)];
  return {
    code: asset.code,
    assetId: asset.id,
    name: asset.name,
    model: asset.model,
    category: asset.category,
    department: asset.department,
    expectedLocation: asset.location,
    actualLocation,
    expectedOwnerName: asset.ownerName || '无',
    actualOwnerName: actualOwnerName || '无',
    status,
    labelStatus,
    physicalStatus,
    scanTime: nowText(),
    result: uniqueTypes.length ? '异常' : '正常',
    exceptionType: uniqueTypes.length ? uniqueTypes.join('、') : '正常',
    note: payload.note || '',
  };
}

export function recordInventoryCheck(taskId, code, payload = {}) {
  const task = getInventoryTaskById(taskId);
  if (!task) return { ok: false, message: '盘点任务不存在' };
  const asset = findAssetByCode(code);
  if (!asset) return { ok: false, message: '未找到该资产，可通过异常登记处理盘盈' };

  const record = buildInventoryResult(asset, payload);
  const nextTask = {
    ...task,
    scannedItems: [...task.scannedItems.filter((item) => item.code !== code), record],
  };
  saveInventoryTasks(getInventoryTasks().map((item) => (item.id === taskId ? nextTask : item)));

  const patch = {
    lastInventoryTime: record.scanTime,
    lastInventoryResult: record.result,
    labelStatus: record.labelStatus,
    physicalStatus: record.physicalStatus,
  };
  if (record.result === '异常' && !['维修中', '报废'].includes(asset.status)) patch.status = '盘点异常';
  const log = makeLog('盘点核验', asset, `盘点结果：${record.exceptionType}`);
  appendGlobalLog(log);
  patchAsset(code, (current) => addAssetLogToItem({ ...current, ...patch }, log));

  return { ok: true, asset: findAssetByCode(code), record, task: nextTask };
}

export function recordInventorySurplus(taskId, payload = {}) {
  const task = getInventoryTaskById(taskId);
  if (!task) return { ok: false, message: '盘点任务不存在' };
  if (!payload.code || !payload.name) return { ok: false, message: '请补充盘盈资产编号和名称' };
  const record = {
    code: payload.code,
    assetId: '',
    name: payload.name,
    model: payload.model || '待补录',
    category: payload.category || '待确认',
    department: payload.department || CURRENT_USER.dept,
    expectedLocation: '账上无',
    actualLocation: payload.actualLocation || '现场登记',
    expectedOwnerName: '账上无',
    actualOwnerName: payload.actualOwnerName || CURRENT_USER.name,
    status: '盘点异常',
    labelStatus: payload.labelStatus || '标签缺失',
    physicalStatus: payload.physicalStatus || '正常',
    scanTime: nowText(),
    result: '异常',
    exceptionType: '盘盈',
    note: payload.note || '现场发现账外资产',
  };
  const nextTask = {
    ...task,
    scannedItems: [...task.scannedItems.filter((item) => item.code !== payload.code), record],
  };
  saveInventoryTasks(getInventoryTasks().map((item) => (item.id === taskId ? nextTask : item)));
  appendGlobalLog(makeLog('盘点核验', null, `盘盈登记：${payload.name}`, { code: payload.code, name: payload.name }));
  return { ok: true, record, task: nextTask };
}

function buildTaskSummary(task) {
  const assets = getAssetItems();
  const expectedSet = new Set(task.expectedCodes);
  const countedExpectedCodes = [...new Set(task.scannedItems.filter((item) => expectedSet.has(item.code)).map((item) => item.code))];
  const missingCodes = task.expectedCodes.filter((code) => !countedExpectedCodes.includes(code));
  const missingItems = missingCodes.map((code) => {
    const asset = findAssetByCode(code);
    return {
      code,
      name: asset?.name || '未知资产',
      model: asset?.model || '未知规格',
      location: asset?.location || '未知位置',
      ownerName: asset?.ownerName || '无',
      status: asset?.status || '未知',
      result: '盘亏',
      exceptionType: '盘亏',
    };
  });
  const anomalyItems = task.scannedItems.filter((item) => item.result === '异常');
  return {
    expectedCount: task.expectedCodes.length,
    countedCount: countedExpectedCodes.length,
    uncountedCount: missingItems.length,
    abnormalCount: anomalyItems.length + missingItems.length,
    surplusCount: anomalyItems.filter((item) => String(item.exceptionType || '').includes('盘盈')).length,
    shortageCount: missingItems.length,
    locationMismatchCount: anomalyItems.filter((item) => String(item.exceptionType || '').includes('位置异常')).length,
    ownerMismatchCount: anomalyItems.filter((item) => String(item.exceptionType || '').includes('使用人异常')).length,
    statusMismatchCount: anomalyItems.filter((item) => String(item.exceptionType || '').includes('状态异常')).length,
    missingItems,
    anomalyItems,
  };
}

export function finishInventoryTask(taskId) {
  const task = getInventoryTaskById(taskId);
  if (!task) return { ok: false, message: '盘点任务不存在' };
  const finishTime = nowText();
  const summary = buildTaskSummary(task);
  const report = normalizeReport({
    id: `inventory-report-${Date.now()}`,
    batchNo: task.batchNo,
    dept: task.dept,
    operator: task.operator,
    startTime: task.startTime,
    finishTime,
    scopeLabel: task.scopeLabel,
    summary,
    scannedItems: task.scannedItems,
    anomalyItems: [...summary.anomalyItems, ...summary.missingItems],
    missingItems: summary.missingItems,
  });

  saveInventoryReports([report, ...getInventoryReports()]);
  saveInventoryTasks(getInventoryTasks().map((item) => (item.id === taskId ? { ...item, status: 'completed', finishTime, summary } : item)));
  return { ok: true, report };
}
