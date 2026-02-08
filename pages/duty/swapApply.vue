<template>
  <view class="duty pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <!-- 表单可滚动，避免底部按钮遮挡 -->
    <scroll-view class="content" scroll-y>
      <view class="page-title">发起换班</view>
      <view class="card">
        <!-- 选择换班人员：标签固定宽度，右侧文本可点击 -->
        <view class="form-row">
          <text class="label">换班人员</text>
          <view class="value">
            <picker :range="userNames" @change="onUserChange">
              <text class="link">{{ toUserName || '请选择' }}</text>
            </picker>
          </view>
        </view>
        <!-- 选择我的日期 -->
        <view class="form-row">
          <text class="label">我的日期</text>
          <view class="value">
            <picker mode="date" @change="(e)=>fromDate = e.detail.value">
              <text class="link">{{ fromDate || '请选择' }}</text>
            </picker>
          </view>
        </view>
        <!-- 选择对方日期 -->
        <view class="form-row">
          <text class="label">对方日期</text>
          <view class="value">
            <picker mode="date" @change="(e)=>toDate = e.detail.value">
              <text class="link">{{ toDate || '请选择' }}</text>
            </picker>
          </view>
        </view>
        <!-- 换班原因输入框占满卡片宽度，避免右侧留白 -->
        <textarea class="textarea" v-model="reason" placeholder="换班原因（可选）" />
      </view>
    </scroll-view>

    <!-- 底部按钮固定在安全区之上 -->
    <view class="bottom-bar">
      <button type="primary" class="btn" @click="submit">提交申请</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getDutySwaps, saveDutySwaps, getDutyOverrides, getDutyAnchor } from '@/common/database.js';

const safeTop = ref(0);
// 当前用户（mock），后续替换为真实登录信息
const currentUser = { id: 'u1', name: '李警官' };

const users = [
  { id: 'u2', name: '王警官' },
  { id: 'u3', name: '张警官' },
  { id: 'u4', name: '陈警官' },
  { id: 'u5', name: '赵警官' },
];
const userNames = users.map((u) => u.name);

const fromDate = ref('');
const toDate = ref('');
const toUserId = ref('');
const toUserName = ref('');
const reason = ref('');

function onUserChange(e) {
  // 选择换班人员
  const idx = e.detail.value;
  toUserId.value = users[idx].id;
  toUserName.value = users[idx].name;
}

function hasOverride(dateStr, userId) {
  // 判断日期是否已有换班覆盖
  return getDutyOverrides().some((o) => o.userId === userId && o.date === dateStr && o.reason === 'swap');
}

function formatDate(y, m, d) {
  // 格式化日期为 YYYY-MM-DD
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dutyDay(dateStr, userId) {
  // 按周期判断是否值班日
  const anchor = getDutyAnchor().find((i) => i.userId === userId) || getDutyAnchor()[0];
  const anchorDate = new Date(anchor.anchorDate.replace(/-/g, '/'));
  const cur = new Date(dateStr.replace(/-/g, '/'));
  const diff = Math.floor((cur - anchorDate) / 86400000);
  return diff % anchor.cycleDays === 0;
}

function isRestByWeekend(dateStr, userId) {
  // 周末值班联动休息规则
  const d = new Date(dateStr.replace(/-/g, '/'));
  const day = d.getDay();
  if (day === 0 || day === 1) {
    const sat = new Date(d); sat.setDate(d.getDate() - (day === 0 ? 1 : 2));
    const satStr = formatDate(sat.getFullYear(), sat.getMonth() + 1, sat.getDate());
    if (dutyDay(satStr, userId)) return true;
  }
  if (day === 5 || day === 6) {
    const sun = new Date(d); sun.setDate(d.getDate() + (day === 5 ? 2 : 1));
    const sunStr = formatDate(sun.getFullYear(), sun.getMonth() + 1, sun.getDate());
    if (dutyDay(sunStr, userId)) return true;
  }
  return false;
}

function getStatus(dateStr, userId) {
  // 计算日期状态（覆盖优先）
  const override = getDutyOverrides().find((o) => o.userId === userId && o.date === dateStr);
  if (override) return override.type;
  if (dutyDay(dateStr, userId)) return 'DUTY';
  if (isRestByWeekend(dateStr, userId)) return 'REST';
  return 'WORK';
}

function submit() {
  // 提交换班申请并校验
  if (!toUserId.value) {
    uni.showToast({ title: '请选择换班人员', icon: 'none' });
    return;
  }
  if (!fromDate.value || !toDate.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' });
    return;
  }
  if (fromDate.value === toDate.value) {
    uni.showToast({ title: '不可选择同一天互换', icon: 'none' });
    return;
  }
  if (getStatus(fromDate.value, currentUser.id) !== 'DUTY') {
    uni.showToast({ title: '我的日期必须为值班日', icon: 'none' });
    return;
  }
  if (getStatus(toDate.value, toUserId.value) !== 'DUTY') {
    uni.showToast({ title: '对方日期必须为值班日', icon: 'none' });
    return;
  }
  if (hasOverride(fromDate.value, currentUser.id) || hasOverride(toDate.value, toUserId.value)) {
    uni.showToast({ title: '日期已存在换班覆盖', icon: 'none' });
    return;
  }

  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const record = {
    id: `swap-${Date.now()}`,
    fromUserId: currentUser.id,
    fromUserName: currentUser.name,
    toUserId: toUserId.value,
    toUserName: toUserName.value,
    fromDate: fromDate.value,
    toDate: toDate.value,
    fromType: 'duty',
    toType: 'duty',
    reason: reason.value,
    status: 'pending',
    approvals: {
      myLeader: { role: 'leader_station_dept', leaderId: 'leader-1', leaderName: '王所长', status: 'pending', time: '', remark: '' },
      otherLeader: { role: 'leader_bureau', leaderId: 'leader-2', leaderName: '赵局长', status: 'pending', time: '', remark: '' },
    },
    createdAt: now,
    updatedAt: now,
  };

  const list = [record, ...getDutySwaps()];
  saveDutySwaps(list);
  uni.showToast({ title: '申请已提交', icon: 'success' });
  uni.navigateBack();
}

onLoad((query) => {
  // 初始化安全区和默认日期
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
  if (query?.date) fromDate.value = query.date;
});
</script>

<style lang="scss" scoped>
.duty {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  padding: calc(12rpx + env(safe-area-inset-top)) 24rpx calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.content { flex: 1; width: 100%; }
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 16rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08); }
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.label {
  color: #6b7785;
  font-size: 24rpx;
  flex: 0 0 120rpx;
}
.value { flex: 1; min-width: 0; }
.link { color: #1677ff; font-size: 24rpx; }
.link:active { opacity: 0.6; }
.textarea {
  width: 100%;
  box-sizing: border-box;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 12rpx;
  min-height: 160rpx;
}
.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08); }
.btn { width: 100%; height: 72rpx; line-height: 72rpx; border-radius: 12rpx; background: #1677ff; color: #fff; }
</style>
