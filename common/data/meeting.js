import { getMeetings, saveMeetings } from '@/common/database.js';

// 会议模块固定的本地人员池：第一阶段用于“创建会议选择参会人员”和“确认统计”
// 后续可直接替换为组织架构接口，不影响页面调用方式。
export const MEETING_USERS = [
  { id: 'u-001', name: '张三', dept: '桂南派出所' },
  { id: 'u-002', name: '李警官', dept: '桂南警务区' },
  { id: 'u-003', name: '王警官', dept: '龙石警务区' },
  { id: 'u-004', name: '周警官', dept: '江北警务区' },
  { id: 'u-005', name: '赵警官', dept: '巡逻组' },
];

// 获取当前登录用户：本地阶段从 storage 读取，读不到时给默认值方便演示。
export function getCurrentMeetingUser() {
  const name = uni.getStorageSync('userName') || '张三';
  const hit = MEETING_USERS.find((item) => item.name === name);
  if (hit) return hit;
  return { id: 'u-001', name, dept: '桂南派出所' };
}

// 统一读取会议列表，并按开始时间倒序，保证新会议信息优先展示。
export function getMeetingList() {
  return [...getMeetings()].sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
}

// 会议状态计算：页面列表与详情复用同一逻辑，避免显示不一致。
export function getMeetingStatus(meeting, now = Date.now()) {
  const start = Number(meeting.startTime || 0);
  const end = Number(meeting.endTime || 0);
  if (now < start) return '未开始';
  if (end && now > end) return '已结束';
  return '进行中';
}

// 统计已确认人数：用于列表卡片展示“已确认/总人数”。
export function getConfirmCount(meeting) {
  const confirmMap = meeting.participantConfirm || {};
  const users = meeting.participants || [];
  const confirmed = users.filter((id) => confirmMap[id]?.status === 'confirmed').length;
  return { confirmed, total: users.length };
}

// 统一更新会议列表：通过 updater 回调按 id 更新目标会议并写回本地。
export function updateMeetingById(meetingId, updater) {
  const list = getMeetingList();
  const next = list.map((item) => {
    if (item.id !== meetingId) return item;
    return updater(item);
  });
  saveMeetings(next);
  return next.find((item) => item.id === meetingId) || null;
}

// 参会确认：将当前用户标记为 confirmed，并记录确认时间。
export function confirmAttendance(meetingId, userId) {
  return updateMeetingById(meetingId, (item) => {
    const participantConfirm = { ...(item.participantConfirm || {}) };
    participantConfirm[userId] = {
      status: 'confirmed',
      confirmTime: Date.now(),
    };
    return { ...item, participantConfirm };
  });
}

// 新建会议：统一初始化参会确认状态，避免页面里重复写初始化逻辑。
export function createMeeting(record) {
  const list = getMeetingList();
  const next = [record, ...list];
  saveMeetings(next);
  return record;
}

// 生成本地通知去重标记 key，避免每次 onShow 都重复弹同一条提醒。
function reminderMarkKey() {
  return 'db_meeting_reminder_marks';
}

function getReminderMarks() {
  return uni.getStorageSync(reminderMarkKey()) || {};
}

function saveReminderMarks(marks) {
  uni.setStorageSync(reminderMarkKey(), marks);
}

// 本地提醒：会前30分钟与已开始提醒（第一阶段本地模拟）。
export function checkMeetingReminders() {
  const meetings = getMeetingList();
  const now = Date.now();
  const marks = getReminderMarks();
  meetings.forEach((meeting) => {
    const start = Number(meeting.startTime || 0);
    const end = Number(meeting.endTime || 0);
    const before30 = start - now;
    const beforeKey = `${meeting.id}_before30`;
    const startedKey = `${meeting.id}_started`;
    // 会前30分钟提醒：仅在 0~30 分钟窗口触发一次
    if (before30 > 0 && before30 <= 30 * 60 * 1000 && !marks[beforeKey]) {
      notifyLocal(`会议提醒：${meeting.title}`, '会议将在30分钟后开始');
      marks[beforeKey] = true;
    }
    // 会议开始提醒：在开始到结束（或开始后2小时兜底）窗口触发一次
    const endTs = end || start + 2 * 60 * 60 * 1000;
    if (now >= start && now <= endTs && !marks[startedKey]) {
      notifyLocal(`会议开始：${meeting.title}`, '会议已开始，请尽快参会');
      marks[startedKey] = true;
    }
  });
  saveReminderMarks(marks);
}

// 通知封装：优先 APP-PLUS 本地通知能力，不支持时降级 toast 提示。
export function notifyLocal(title, content) {
  // #ifdef APP-PLUS
  try {
    if (typeof uni.showLocalNotification === 'function') {
      uni.showLocalNotification({ title, body: content, content });
      return;
    }
    if (typeof plus !== 'undefined' && plus.push?.createMessage) {
      plus.push.createMessage(content, '', { title });
      return;
    }
  } catch (e) {
    // 本地通知失败时降级为 toast，避免无反馈。
  }
  // #endif
  uni.showToast({ title, icon: 'none' });
}

