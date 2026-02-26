// 走访模块通用常量与工具方法
// 说明：集中维护文案与样式映射，避免多个页面重复写同样的 if/else

export const VISIT_RESULT_OPTIONS = [
  { value: 'normal', label: '正常' },
  { value: 'issue', label: '发现问题' },
  { value: 'absent', label: '不在场' },
  { value: 'refuse', label: '拒绝配合' },
  { value: 'need_revisit', label: '需回访' },
];

export const VISIT_TYPE_OPTIONS = ['例行', '核查', '回访', '宣传', '检查', '处置后回访'];

export const VISIT_STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'todo', label: '待走访' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
  { value: 'overdue', label: '逾期' },
];

export const VISIT_RISK_OPTIONS = [
  { value: 'ALL', label: '全部风险' },
  { value: '高', label: '高' },
  { value: '中', label: '中' },
  { value: '低', label: '低' },
];

export const VISIT_AREA_OPTIONS = [
  { value: 'ALL', label: '全部辖区' },
  { value: '桂南', label: '桂南' },
  { value: '长命水', label: '长命水' },
  { value: '龙石', label: '龙石' },
  { value: '江北', label: '江北' },
  { value: '其他', label: '其他' },
];

export const VISIT_DUE_OPTIONS = [
  { value: 'ALL', label: '全部到期' },
  { value: 'overdue', label: '已逾期' },
  { value: 'today', label: '今日到期' },
  { value: 'upcoming', label: '临期' },
];

// 走访对象状态文案映射
export function visitStatusText(status) {
  const map = {
    todo: '待走访',
    doing: '进行中',
    done: '已完成',
    overdue: '已逾期',
    draft: '草稿',
    pending: '待提交',
    submitted: '已提交',
    failed: '提交失败',
  };
  return map[status] || status || '未知';
}

// 记录结果文案映射
export function visitResultText(result) {
  const map = {
    normal: '正常',
    issue: '发现问题',
    absent: '不在场',
    refuse: '拒绝配合',
    need_revisit: '需回访',
  };
  return map[result] || result || '未填写';
}

// 统一格式化时间文本
export function formatDateTime(value) {
  if (!value) return '-';
  // 兼容时间戳与字符串两类输入，避免出现“1715xxxxxx”这种原始数字展示
  if (typeof value === 'number') {
    const date = new Date(value);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }
  const text = String(value).replace('T', ' ');
  return text.length >= 16 ? text.slice(0, 16) : text;
}

// 统一截取日期部分，供“今日完成”等逻辑复用
export function dateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

// 风险颜色 class 映射
export function riskClass(level) {
  if (level === '高') return 'risk-high';
  if (level === '中') return 'risk-mid';
  return 'risk-low';
}

// 状态颜色 class 映射
export function statusClass(status) {
  if (status === 'overdue' || status === 'failed') return 'status-danger';
  if (status === 'doing' || status === 'pending') return 'status-warn';
  if (status === 'done' || status === 'submitted') return 'status-ok';
  return 'status-normal';
}
