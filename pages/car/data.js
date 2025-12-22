const VEHICLE_KEY = 'car_vehicles';
const HISTORY_KEY = 'car_history';
const APPROVAL_KEY = 'car_approvals';

export const statusText = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  idle: '空闲',
  in_use: '使用中',
  maintenance: '维护中',
  completed: '已完成',
};

const defaultVehicles = [
  { id: 'car-1', plate: '粤A-0001', type: 'SUV', status: 'idle', mileage: 23540, occupant: '', maintenanceDate: '2025-11-01', insurance: '2025-12-31' },
  { id: 'car-2', plate: '粤A-0002', type: '轿车', status: 'in_use', mileage: 17890, occupant: '李警官', maintenanceDate: '2025-10-12', insurance: '2025-09-30' },
  { id: 'car-3', plate: '粤A-0003', type: '面包车', status: 'maintenance', mileage: 41200, occupant: '', maintenanceDate: '2025-08-18', insurance: '2025-08-25' },
  { id: 'car-4', plate: '粤A-0004', type: 'SUV', status: 'idle', mileage: 9650, occupant: '', maintenanceDate: '2026-01-05', insurance: '2025-12-20' },
];

const defaultHistory = [
  { id: 'his-1', applicant: '李警官', vehicleId: 'car-2', purpose: '临检', destination: '江北路口', startMileage: 17800, endMileage: 17890, status: 'completed', comment: '准时归队' },
  { id: 'his-2', applicant: '赵警官', vehicleId: 'car-3', purpose: '物资运输', destination: '警务站', startMileage: 41000, endMileage: 41200, status: 'rejected', comment: '车辆维护中' },
];

const defaultApprovals = [
  { id: 'ap-1', applicant: '李警官', vehicleId: 'car-2', purpose: '临检', destination: '江北路口', startMileage: 17800, endMileage: 17890, status: 'completed', comment: '' },
];

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function ensure(key, fallback) {
  const cached = uni.getStorageSync(key);
  if (cached && Array.isArray(cached)) return cached;
  uni.setStorageSync(key, clone(fallback));
  return clone(fallback);
}

export function getVehicles() {
  return ensure(VEHICLE_KEY, defaultVehicles);
}

export function saveVehicles(list) {
  uni.setStorageSync(VEHICLE_KEY, list);
}

export function getHistory() {
  return ensure(HISTORY_KEY, defaultHistory);
}

export function saveHistory(list) {
  uni.setStorageSync(HISTORY_KEY, list);
}

export function getApprovals() {
  return ensure(APPROVAL_KEY, defaultApprovals);
}

export function saveApprovals(list) {
  uni.setStorageSync(APPROVAL_KEY, list);
}

export function getVehicleById(id) {
  return getVehicles().find(v => v.id === id);
}

export function getLastEndMileage(vehicleId) {
  const history = getHistory().find(h => h.vehicleId === vehicleId);
  const vehicle = getVehicleById(vehicleId);
  return history?.endMileage || vehicle?.mileage || 0;
}

export function getActiveRecord(vehicleId) {
  return getHistory().find(h => h.vehicleId === vehicleId && h.status === 'in_use');
}

// 开始用车登记，不再要求结束里程
export function addRegistration(record) {
  const approvals = [ { ...record, status: 'in_use', endMileage: null }, ...getApprovals() ];
  const history = [ { ...record, status: 'in_use', endMileage: null }, ...getHistory() ];
  const vehicles = getVehicles().map(v => v.id === record.vehicleId
    ? { ...v, mileage: record.startMileage || v.mileage, status: 'in_use', occupant: record.applicant }
    : v
  );
  saveApprovals(approvals);
  saveHistory(history);
  saveVehicles(vehicles);
  return { approvals, history, vehicles };
}

export function endUse(vehicleId, endMileage, operator = '') {
  const approvals = getApprovals();
  const history = getHistory();
  const vehicles = getVehicles();

  const historyIdx = history.findIndex(h => h.vehicleId === vehicleId && h.status === 'in_use');
  if (historyIdx >= 0) {
    history[historyIdx] = {
      ...history[historyIdx],
      endMileage,
      status: 'completed',
      comment: history[historyIdx].comment || '使用结束',
    };
    const approvalIdx = approvals.findIndex(a => a.id === history[historyIdx].id);
    if (approvalIdx >= 0) {
      approvals[approvalIdx] = { ...approvals[approvalIdx], status: 'completed', endMileage, comment: approvals[approvalIdx].comment || '使用结束' };
    }
  }

  const vehicleIdx = vehicles.findIndex(v => v.id === vehicleId);
  if (vehicleIdx >= 0) {
    vehicles[vehicleIdx] = { ...vehicles[vehicleIdx], status: 'idle', occupant: '', mileage: endMileage };
  }

  saveVehicles(vehicles);
  saveHistory(history);
  saveApprovals(approvals);
  return { approvals, history, vehicles };
}
