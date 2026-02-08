<template>
  <view class="out pageBg">
    <scroll-view class="content" scroll-y>
      <view class="page-title">发起外出</view>

      <view class="card">
        <view class="section-title">基础信息</view>
        <!-- 休假联动场景固定类型，不允许手动切换 -->
        <view class="form-row">
          <text class="label">外出类型</text>
          <view class="value">
            <text v-if="isLeaveLink">{{ typeText(form.type) }}</text>
            <picker v-else :range="typeOptions.map((i) => i.label)" @change="onTypeChange">
              <text class="link-text">{{ typeText(form.type) }}</text>
            </picker>
          </view>
        </view>
        <view class="form-row">
          <text class="label">开始时间</text>
          <view class="value">
            <picker mode="date" @change="(e) => form.startAt = e.detail.value">
              <text class="link-text">{{ form.startAt || '请选择' }}</text>
            </picker>
          </view>
        </view>
        <view class="form-row">
          <text class="label">结束时间</text>
          <view class="value">
            <picker mode="date" @change="(e) => form.endAt = e.detail.value">
              <text class="link-text">{{ form.endAt || '请选择' }}</text>
            </picker>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">外出内容</view>
        <view class="form-row">
          <text class="label">去向</text>
          <view class="value">
            <input v-model="form.destination" class="input-field" placeholder="请输入去向" />
          </view>
        </view>
        <view class="form-row">
          <text class="label">联系电话</text>
          <view class="value">
            <input v-model="form.contactPhone" class="input-field" placeholder="可选，方便联络" />
          </view>
        </view>
        <view class="form-area">
          <text class="label">外出事由</text>
          <textarea v-model="form.reason" class="textarea-field" placeholder="请输入外出事由" />
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="submit-btn" @click="submit">提交申请</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { addOutRequest, getLeaveRequests } from '@/common/database.js';
const linkedLeaveId = ref('');

const currentUser = {
  id: 'u1',
  name: '李警官',
  deptId: 'dept-1',
  deptName: '桂南派出所',
};

const typeOptions = [
  { label: '普通外出', value: 'NORMAL' },
  { label: '出差外出', value: 'BUSINESS_TRIP' },
];

const form = reactive({
  type: 'NORMAL',
  startAt: '',
  endAt: '',
  destination: '',
  reason: '',
  contactPhone: '',
});

const isLeaveLink = ref(false);

function typeText(type) {
  // 外出类型文案
  const map = { NORMAL: '普通外出', BUSINESS_TRIP: '出差外出', LEAVE_LINK: '休假关联外出' };
  return map[type] || type;
}

function onTypeChange(e) {
  // 手动选择外出类型（仅普通/出差）
  const idx = Number(e.detail.value || 0);
  form.type = typeOptions[idx]?.value || 'NORMAL';
}

function nowText() {
  // 统一生成 YYYY-MM-DD HH:mm 时间文本
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function createFlowNodes() {
  // 外出审批链路固定 3 级，保持与休假一致
  return [
    { role: 'leader_station_dept', approverId: 'r1', approverName: '王所长', status: 'pending', comment: '', time: '' },
    { role: 'leader_bureau_political', approverId: 'r2', approverName: '政工处', status: 'pending', comment: '', time: '' },
    { role: 'leader_bureau', approverId: 'r3', approverName: '分局领导', status: 'pending', comment: '', time: '' },
  ];
}

function submit() {
  // 提交外出申请前校验关键字段
  if (!form.startAt || !form.endAt) {
    uni.showToast({ title: '请选择起止时间', icon: 'none' });
    return;
  }
  if (form.endAt < form.startAt) {
    uni.showToast({ title: '结束时间不能早于开始时间', icon: 'none' });
    return;
  }
  if (!form.destination) {
    uni.showToast({ title: '请输入去向', icon: 'none' });
    return;
  }
  if (!form.reason) {
    uni.showToast({ title: '请输入外出事由', icon: 'none' });
    return;
  }

  const now = nowText();
  const outId = `out-${Date.now()}`;
  const record = {
    id: outId,
    type: form.type,
    applicantId: currentUser.id,
    applicantName: currentUser.name,
    deptId: currentUser.deptId,
    deptName: currentUser.deptName,
    startAt: form.startAt,
    endAt: form.endAt,
    destination: form.destination,
    reason: form.reason,
    contactPhone: form.contactPhone,
    status: 'pending',
    currentNodeKey: 'leader_station_dept',
    flowNodes: createFlowNodes(),
    logs: [{ action: 'CREATE', note: '发起外出申请', operator: currentUser.name, time: now }],
    linkedLeaveId: linkedLeaveId.value,
    linkedLeaveAutoPass: isLeaveLink.value,
    autoApprovedAt: '',
    createdAt: now,
    updatedAt: now,
  };

  addOutRequest(record);
  uni.showToast({ title: '提交成功', icon: 'success' });
  uni.navigateTo({ url: `/pages/out/detail?id=${outId}` });
}

onLoad((query) => {
  // 休假联动进入：固定为 LEAVE_LINK，并带入休假日期和原因
  if (query?.type === 'LEAVE_LINK' && query?.leaveId) {
    isLeaveLink.value = true;
    linkedLeaveId.value = query.leaveId;
    form.type = 'LEAVE_LINK';
    const leave = getLeaveRequests().find((i) => i.id === query.leaveId);
    if (leave) {
      form.startAt = leave.startDate;
      form.endAt = leave.endDate;
      form.reason = leave.reason || '';
      form.destination = '待补充';
    }
  }
});
</script>

<style lang="scss" scoped>
.out {
  min-height: 100vh;
  padding: 12rpx 24rpx 120rpx;
  box-sizing: border-box;
}
.content {
  height: calc(100vh - 120rpx);
}
.page-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
  margin-bottom: 12rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  color: #1f2b3a;
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.form-area {
  margin-top: 8rpx;
}
.label {
  flex: 0 0 132rpx;
  font-size: 24rpx;
  color: #6b7785;
}
.value {
  flex: 1;
  min-width: 0;
}
.input-field {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10rpx;
  background: #f4f6f8;
  padding: 12rpx;
  font-size: 24rpx;
}
.textarea-field {
  margin-top: 8rpx;
  width: 100%;
  box-sizing: border-box;
  min-height: 160rpx;
  border-radius: 10rpx;
  background: #f4f6f8;
  padding: 12rpx;
  font-size: 24rpx;
}
.link-text {
  color: #1677ff;
  font-size: 24rpx;
}
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.submit-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 12rpx;
  background: #1677ff;
  color: #fff;
  font-weight: 600;
}
</style>
