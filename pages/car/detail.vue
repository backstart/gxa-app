<template>
  <view class="car-detail pageBg">
    <view class="statuBar" :style="{ height: barheight + 'px' }"></view>

    <view v-if="notFound" class="card">
      <view class="empty">未找到车辆数据</view>
    </view>

    <view v-else class="card info-card">
      <view class="info-header">
        <view>
          <view class="plate">{{ car.plateNo || '警车' }}</view>
          <view class="sub">{{ car.type || '—' }}</view>
        </view>
        <text :class="['status-pill', status]">{{ statusLabel }}</text>
      </view>
      <view class="info-grid">
        <view class="info-item">
          <text class="label">当前里程</text>
          <text class="value">{{ currentMileage }} km</text>
        </view>
        <view class="info-item">
          <text class="label">保养日期</text>
          <text class="value">{{ car.maintainDate || '—' }}</text>
        </view>
        <view class="info-item">
          <text class="label">保险到期</text>
          <text class="value">{{ car.insuranceDue || '—' }}</text>
        </view>
      </view>
    </view>

    <view v-if="!notFound && status === 'using' && openLog" class="card occupy-card">
      <view class="section-title">当前占用信息</view>
      <view class="row"><text class="label">使用人</text><text>{{ openLog.user || '—' }}</text></view>
      <view class="row"><text class="label">开始时间</text><text>{{ openLog.startTime || '—' }}</text></view>
      <view class="row"><text class="label">开始里程</text><text>{{ openLog.startMileage || '—' }} km</text></view>
      <view class="row"><text class="label">用途</text><text>{{ openLog.purpose || '—' }}</text></view>
      <view class="row"><text class="label">目的地</text><text>{{ openLog.destination || '—' }}</text></view>
      <view class="row">
        <text class="label">关联警情</text>
        <text>{{ openLog.relatedIncidentId || '—' }}</text>
      </view>
    </view>

    <view v-if="!notFound && canEnd" class="card end-card">
      <view class="section-title">结束用车</view>
      <view class="form-row">
        <text class="label">结束里程</text>
        <input class="input" v-model="endMileage" type="number" placeholder="请输入结束里程" @input="errorText = ''" />
      </view>
      <view class="form-row">
        <text class="label">是否加油</text>
        <switch :checked="flags.refuel" @change="(e)=> flags.refuel = e.detail.value" />
      </view>
      <view class="form-row">
        <text class="label">是否异常</text>
        <switch :checked="flags.abnormal" @change="(e)=> flags.abnormal = e.detail.value" />
      </view>
      <view v-if="flags.abnormal" class="form-row">
        <text class="label">异常说明</text>
        <textarea class="textarea" v-model="abnormalNote" placeholder="可填写异常说明" />
      </view>
      <view v-if="errorText" class="error-text">{{ errorText }}</view>
    </view>

    <view v-if="!notFound" class="card history-card">
      <view class="section-title">使用历史记录</view>
      <view v-if="historyList.length === 0" class="empty">暂无记录</view>
      <view v-for="item in historyList" :key="item.id" class="history-item">
        <view class="history-top">
          <text class="name">{{ item.user || '—' }}</text>
          <text :class="['tag', item.status === 'OPEN' ? 'open' : 'closed']">
            {{ item.status === 'OPEN' ? '未结束' : '已结束' }}
          </text>
        </view>
        <view class="history-row">
          <text>时间：{{ item.startTime || '—' }} → {{ item.endTime || '未结束' }}</text>
        </view>
        <view class="history-row">
          <text>用途：{{ item.purpose || '—' }} / {{ item.destination || '—' }}</text>
        </view>
        <view class="history-row">
          <text>行驶里程：{{ item.distanceText }}</text>
        </view>
        <view v-if="item.relatedIncidentId" class="history-row">
          <text>关联警情：{{ item.relatedIncidentId }}</text>
        </view>
      </view>
    </view>

    <view v-if="!notFound" class="bottom-bar">
      <button
        class="primary-btn"
        type="primary"
        :disabled="bottomDisabled"
        @click="handleBottomAction"
      >
        {{ bottomLabel }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getCarById, getCarUseLogs, getCars, saveCarUseLogs, updateCar } from '@/common/database.js';
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());
const carId = ref('');
const plateNo = ref('');
const car = ref({});
const logs = ref([]);
const currentUser = ref('');
const notFound = ref(false);
const endMileage = ref('');
const errorText = ref('');
const flags = ref({ refuel: false, abnormal: false });
const abnormalNote = ref('');
const autoEnd = ref(false);

const status = computed(() => normalizeStatus(car.value.status));
const statusLabel = computed(() => {
  const map = { idle: '空闲', using: '使用中', maintain: '维护中' };
  return map[status.value] || '未知';
});

const currentMileage = computed(() => car.value.currentMileage ?? car.value.currentOdo ?? car.value.mileage ?? 0);

const openLog = computed(() => {
  const log = logs.value.find((l) => l.carId === carId.value && String(l.status || '').toUpperCase() === 'OPEN');
  if (log) return { ...log, user: log.user || log.applicant || '' };
  if (car.value?.usingInfo) {
    return {
      id: `using-${carId.value}`,
      carId: carId.value,
      status: 'OPEN',
      ...car.value.usingInfo,
      user: car.value.usingInfo.user || '',
    };
  }
  return null;
});

const historyList = computed(() => {
  const list = logs.value.filter((log) => log.carId === carId.value);
  return list.sort((a, b) => (a.startTime < b.startTime ? 1 : -1)).map((item) => {
    const distance = item.endMileage !== undefined && item.endMileage !== null
      ? Number(item.endMileage) - Number(item.startMileage || 0)
      : null;
    return {
      ...item,
      user: item.user || item.applicant || '',
      distanceText: distance === null || Number.isNaN(distance) ? '未结束' : `${distance} km`,
    };
  });
});

const canEnd = computed(() => status.value === 'using' && openLog.value?.user === currentUser.value);
const keyPicked = computed(() => car.value?.usingInfo?.keyPicked === true);

const bottomLabel = computed(() => {
  if (status.value === 'idle') return '用这辆车登记';
  if (canEnd.value) return keyPicked.value ? '提交结束用车' : '去取钥匙';
  return '仅查看';
});

const bottomDisabled = computed(() => {
  if (status.value === 'idle') return false;
  if (canEnd.value) return false;
  return true;
});

function normalizeStatus(value) {
  const raw = String(value || '').toLowerCase();
  if (raw === 'in_use') return 'using';
  if (raw === 'maintenance') return 'maintain';
  if (raw === 'using' || raw === 'maintain' || raw === 'idle') return raw;
  return raw || 'idle';
}

function loadData() {
  let found = getCarById(carId.value);
  if (!found && plateNo.value) {
    found = getCars().find((item) => item.plateNo === plateNo.value);
  }
  if (!found) {
    car.value = {};
    notFound.value = true;
    return;
  }
  if (!carId.value) carId.value = found.carId;
  car.value = found;
  notFound.value = false;
  logs.value = getCarUseLogs();
  currentUser.value = uni.getStorageSync('userName') || '张三';
  if (!canEnd.value) resetEndForm();
  if (autoEnd.value) autoEnd.value = false;
}

function handleBottomAction() {
  if (status.value === 'idle') {
    uni.navigateTo({ url: `/pages/car/usecar?carId=${carId.value}` });
    return;
  }
  if (canEnd.value) {
    // 详情页同样执行“先取钥匙再结束用车”的状态机约束。
    if (!keyPicked.value) {
      const query = openLog.value?.id ? `carId=${carId.value}&logId=${openLog.value.id}` : `carId=${carId.value}`;
      uni.navigateTo({ url: `/pages/car/keyPickup?${query}` });
      return;
    }
    submitEnd();
  }
}

function resetEndForm() {
  endMileage.value = '';
  errorText.value = '';
  flags.value = { refuel: false, abnormal: false };
  abnormalNote.value = '';
}

function validateEnd() {
  if (!openLog.value) return '未找到使用记录';
  if (!endMileage.value) return '请填写结束里程';
  const endVal = Number(endMileage.value);
  if (Number.isNaN(endVal)) return '结束里程需为数字';
  if (endVal < Number(openLog.value.startMileage || 0)) return '结束里程需大于开始里程';
  return '';
}

function submitEnd() {
  const error = validateEnd();
  if (error) {
    errorText.value = error;
    return;
  }
  const endVal = Number(endMileage.value);
  const distance = endVal - Number(openLog.value.startMileage || 0);
  if (distance > 200) {
    uni.showModal({
      title: '里程异常',
      content: '行驶里程超过 200km，确认提交？',
      success: (res) => {
        if (res.confirm) applyEnd(endVal, distance);
      },
    });
    return;
  }
  applyEnd(endVal, distance);
}

function applyEnd(endVal, distance) {
  const list = getCarUseLogs();
  const idx = list.findIndex((log) => log.id === openLog.value.id);
  const payload = {
    ...openLog.value,
    endTime: formatNow(),
    endMileage: endVal,
    distance,
    status: 'CLOSED',
    flags: { ...flags.value, abnormalNote: abnormalNote.value },
  };
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...payload };
  } else {
    list.unshift(payload);
  }
  saveCarUseLogs(list);
  updateCar(carId.value, {
    status: 'idle',
    currentMileage: endVal,
    usingInfo: null,
  });
  resetEndForm();
  uni.showToast({ title: '已结束用车', icon: 'success' });
  loadData();
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onLoad((query) => {
  carId.value = query.carId || '';
  plateNo.value = query.plateNo || '';
  autoEnd.value = String(query.end || '') === '1';
});

onShow(loadData);
</script>

<style lang="scss" scoped>
.car-detail {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
}

.card {
  background: rgba(255,255,255,0.9);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 6rpx 24rpx rgba(0,0,0,0.06);
  margin-bottom: 16rpx;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14rpx;
}

.plate {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.sub {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #6e7a89;
}

.status-pill {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
}
.status-pill.idle {
  background: #e6f7ed;
  color: #1b9d5d;
}
.status-pill.using {
  background: #eaf3ff;
  color: #0f75ff;
}
.status-pill.maintain {
  background: #fff6e6;
  color: #c88719;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  color: #6b7785;
  font-size: 24rpx;
}

.value {
  color: #1f2b3a;
  font-size: 26rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
  font-size: 26rpx;
  color: #1f2b3a;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #1f2b3a;
}

.form-row .label {
  width: 160rpx;
}

.form-row .input {
  flex: 1;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 10rpx 12rpx;
}

.textarea {
  flex: 1;
  min-height: 120rpx;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 10rpx 12rpx;
  font-size: 26rpx;
}

.history-item {
  padding: 10rpx 0;
  border-bottom: 1px solid #f1f3f5;
}
.history-item:last-child {
  border-bottom: none;
}
.history-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6rpx;
}
.history-row {
  font-size: 24rpx;
  color: #6e7a89;
  margin-bottom: 4rpx;
}
.tag {
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
}
.tag.open {
  background: #ffecec;
  color: #d64545;
}
.tag.closed {
  background: #e6f7ed;
  color: #1b9d5d;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 20rpx 0;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}

.primary-btn {
  width: 100%;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
}
.primary-btn[disabled] {
  background: #eef1f5;
  color: #a0a8b3;
}
.error-text {
  color: #d64545;
  font-size: 24rpx;
  margin-top: 6rpx;
}
</style>
