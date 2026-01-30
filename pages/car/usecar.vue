<template>
  <view class="car-use pageBg">
    <view class="statuBar" :style="{ height: barheight + 'px' }"></view>
    <view class="page-body">
      <view class="header">
        <view class="title">用车登记</view>
        <view class="subtitle">{{ car?.plateNo || '请选择车辆' }}</view>
      </view>

      <view class="card" v-if="car">
        <view class="summary-row">
          <text class="label">车辆</text>
          <text class="value">{{ car.plateNo }} · {{ car.type || '—' }}</text>
        </view>
        <view class="summary-row">
          <text class="label">当前里程</text>
          <text class="value">{{ currentMileage }} km</text>
        </view>
      </view>

      <view class="card form-card">
        <view class="form-item">
          <text class="label">使用人*</text>
          <input class="input" v-model="form.user" placeholder="请输入使用人" />
        </view>
        <view class="form-item">
          <text class="label">用途*</text>
          <picker mode="selector" :range="purposeOptions" @change="onPurposeChange">
            <view class="picker-value">{{ form.purpose || '请选择用途' }}</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="label">目的地</text>
          <input class="input" v-model="form.destination" placeholder="可选" />
          <view v-if="recentDestinations.length" class="chips">
            <view
              v-for="d in recentDestinations"
              :key="d"
              class="chip"
              @click="form.destination = d"
            >
              {{ d }}
            </view>
          </view>
        </view>
        <view class="form-item">
          <text class="label">开始里程</text>
          <input class="input" v-model="form.startMileage" type="number" />
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <button class="primary-btn" type="primary" @click="submit">提交登记</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getCarById, getCarUseLogs, saveCarUseLogs, updateCar } from '@/common/database.js';
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());
const carId = ref('');
const incidentId = ref('');
const car = ref(null);
const logs = ref([]);
const purposeOptions = ['巡逻', '出警', '走访', '送检', '押送', '其他'];

const form = ref({
  user: '',
  purpose: '',
  destination: '',
  startMileage: '',
});

const currentMileage = computed(() => car.value?.currentMileage ?? car.value?.currentOdo ?? car.value?.mileage ?? 0);

const recentDestinations = computed(() => {
  const list = logs.value
    .filter((l) => l.carId === carId.value && l.destination)
    .map((l) => l.destination);
  return Array.from(new Set(list)).slice(0, 3);
});

function loadData() {
  car.value = getCarById(carId.value) || null;
  logs.value = getCarUseLogs();
  form.value.user = uni.getStorageSync('userName') || form.value.user || '张三';
  form.value.startMileage = String(currentMileage.value || 0);
  if (incidentId.value && !form.value.purpose) {
    form.value.purpose = '出警';
  }
}

function onPurposeChange(e) {
  const idx = e.detail.value;
  form.value.purpose = purposeOptions[idx] || '';
}

function validate() {
  if (!car.value) return '未找到车辆信息';
  const status = String(car.value.status || '').toLowerCase();
  if (status && status !== 'idle') return '车辆非空闲状态';
  if (!form.value.user) return '请填写使用人';
  if (!form.value.purpose) return '请选择用途';
  if (form.value.startMileage && Number.isNaN(Number(form.value.startMileage))) return '开始里程需为数字';
  return '';
}

function submit() {
  const error = validate();
  if (error) {
    uni.showToast({ title: error, icon: 'none' });
    return;
  }
  const now = formatNow();
  const startMileage = Number(form.value.startMileage || currentMileage.value || 0);
  const record = {
    id: `carlog-${Date.now()}`,
    carId: carId.value,
    user: form.value.user,
    purpose: form.value.purpose,
    destination: form.value.destination,
    startTime: now,
    startMileage,
    status: 'OPEN',
    relatedIncidentId: incidentId.value || '',
  };
  const list = [record, ...getCarUseLogs()];
  saveCarUseLogs(list);
  updateCar(carId.value, {
    status: 'using',
    currentMileage: startMileage,
    usingInfo: {
      user: form.value.user,
      startTime: now,
      startMileage,
      purpose: form.value.purpose,
      destination: form.value.destination,
      relatedIncidentId: incidentId.value || '',
    },
  });
  uni.showToast({ title: '登记成功', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 400);
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onLoad((query) => {
  carId.value = query.carId || '';
  incidentId.value = query.incidentId || '';
});

onShow(loadData);
</script>

<style lang="scss" scoped>
.car-use {
  min-height: 100vh;
  padding: 0 24rpx;
}

.page-body {
  padding-bottom: 160rpx;
}

.header {
  padding: 20rpx 8rpx;
}
.title {
  font-size: 42rpx;
  font-weight: 600;
  color: #1f2b3a;
}
.subtitle {
  margin-top: 8rpx;
  color: #6e7a89;
  font-size: 26rpx;
}

.card {
  background: rgba(255,255,255,0.9);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 6rpx 24rpx rgba(0,0,0,0.06);
  margin-bottom: 16rpx;
}

.form-card {
  min-height: 360rpx;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.label {
  font-size: 26rpx;
  color: #6b7785;
}
.value {
  font-size: 26rpx;
  color: #1f2b3a;
}

.form-item {
  margin-bottom: 16rpx;
}
.input,
.picker-value {
  width: 100%;
  padding: 18rpx 16rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  font-size: 28rpx;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 10rpx;
}
.chip {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  background: #eaf3ff;
  color: #0f75ff;
  font-size: 24rpx;
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
</style>
