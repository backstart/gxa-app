<template>
  <view class="duty pageBg" :style="{ paddingTop: safeTop + 'px' }">
    <view class="page-title">换班申请</view>
    <view class="card">
      <view class="row">
        <text class="label">我的换出日期</text>
        <picker mode="date" @change="(e)=>fromDate = e.detail.value">
          <text class="link">{{ fromDate || '请选择' }}</text>
        </picker>
      </view>
      <view class="row">
        <text class="label">对方人员</text>
        <picker :range="userNames" @change="onUserChange">
          <text class="link">{{ toUserName || '请选择' }}</text>
        </picker>
      </view>
      <view class="row">
        <text class="label">对方日期</text>
        <picker mode="date" @change="(e)=>toDate = e.detail.value">
          <text class="link">{{ toDate || '请选择' }}</text>
        </picker>
      </view>
      <textarea class="textarea" v-model="remark" placeholder="备注（可选）" />
    </view>
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
const remark = ref('');

function onUserChange(e) {
  const idx = e.detail.value;
  toUserId.value = users[idx].id;
  toUserName.value = users[idx].name;
}

function hasOverride(dateStr, userId) {
  return getDutyOverrides().some((o) => o.userId === userId && o.date === dateStr && o.reason === 'swap');
}

function dutyDay(dateStr, userId) {
  const anchor = getDutyAnchor().find((i) => i.userId === userId) || getDutyAnchor()[0];
  const anchorDate = new Date(anchor.anchorDate.replace(/-/g, '/'));
  const cur = new Date(dateStr.replace(/-/g, '/'));
  const diff = Math.floor((cur - anchorDate) / 86400000);
  return diff % anchor.cycleDays === 0;
}

function isRestByWeekend(dateStr, userId) {
  const d = new Date(dateStr.replace(/-/g, '/'));
  const day = d.getDay();
  if (day === 0 || day === 1) {
    const sat = new Date(d); sat.setDate(d.getDate() - (day === 0 ? 1 : 2));
    const satStr = `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(sat.getDate()).padStart(2, '0')}`;
    if (dutyDay(satStr, userId)) return true;
  }
  if (day === 5 || day === 6) {
    const sun = new Date(d); sun.setDate(d.getDate() + (day === 5 ? 2 : 1));
    const sunStr = `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
    if (dutyDay(sunStr, userId)) return true;
  }
  return false;
}

function getStatus(dateStr, userId) {
  const override = getDutyOverrides().find((o) => o.userId === userId && o.date === dateStr);
  if (override) return override.type;
  if (isRestByWeekend(dateStr, userId)) return 'REST';
  return dutyDay(dateStr, userId) ? 'DUTY' : 'WORK';
}

function submit() {
  if (!fromDate.value || !toDate.value || !toUserId.value) {
    uni.showToast({ title: '请完整填写信息', icon: 'none' });
    return;
  }
  if (fromDate.value === toDate.value) {
    uni.showToast({ title: '不可选择同一天互换', icon: 'none' });
    return;
  }
  if (getStatus(fromDate.value, currentUser.id) !== 'DUTY') {
    uni.showToast({ title: '我的换出日期必须为值班日', icon: 'none' });
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
  const id = `swap-${Date.now()}`;
  const record = {
    id,
    fromUserId: currentUser.id,
    fromUserName: currentUser.name,
    toUserId: toUserId.value,
    toUserName: toUserName.value,
    fromDate: fromDate.value,
    toDate: toDate.value,
    status: 'pending',
    remark: remark.value,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  const list = [record, ...getDutySwaps()];
  saveDutySwaps(list);
  uni.showToast({ title: '已提交', icon: 'success' });
  uni.navigateBack();
}

onLoad((query) => {
  const info = uni.getSystemInfoSync();
  const topInset = info.safeAreaInsets?.top || 0;
  safeTop.value = Math.max(info.statusBarHeight || 0, topInset) + 8;
  if (query?.date) fromDate.value = query.date;
});
</script>

<style lang="scss" scoped>
.duty { min-height: 100vh; padding: 12rpx 24rpx 120rpx; box-sizing: border-box; }
.page-title { font-size: 34rpx; font-weight: 700; margin-bottom: 12rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 16rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08); }
.row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.label { color: #6b7785; font-size: 24rpx; }
.link { color: #1677ff; font-size: 24rpx; }
.textarea { background: #f4f6f8; border-radius: 12rpx; padding: 12rpx; min-height: 160rpx; }
.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08); }
.btn { width: 100%; height: 72rpx; line-height: 72rpx; border-radius: 12rpx; background: #1677ff; color: #fff; }
</style>
