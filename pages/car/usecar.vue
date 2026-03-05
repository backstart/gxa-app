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
import { buildOpenBoxNfcPayload, buildOpenBoxPayload } from '@/utils/nfcPayload.js';
import { isHcePluginReady, setHcePayload, startHceSession } from '@/utils/nfcHce.js';

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
  // 第一步：前端表单校验，避免空字段或非法里程进入后续流程。
  const error = validate();
  if (error) {
    uni.showToast({ title: error, icon: 'none' });
    return;
  }
  // 第二步：构造本次用车登记记录，并写入本地日志。
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
  // 第三步：同步更新车辆状态为“使用中”，写入 usingInfo 供列表/详情联动展示。
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
      // keyPicked 默认 false：取钥匙成功后才允许结束用车。
      keyPicked: false,
      keyPickedAt: '',
      boxTxnId: '',
    },
  });
  // 第四步：预启动 5 分钟 HCE 授权。
  // 说明：授权生命周期提升到“会话级”，即便用户退出取钥匙页，5 分钟内仍可刷盒子。
  preStartHceAuth(record.id);
  uni.showToast({ title: '登记成功', icon: 'success' });
  // 用车登记完成后进入“取钥匙/开箱”页面，发起 NFC-HCE 授权流程。
  // 注意：这里不再立即返回上一页，改为引导用户靠近钥匙盒感应区。
  setTimeout(() => {
    uni.navigateTo({
      url: `/pages/car/keyPickup?carId=${carId.value}&logId=${record.id}`,
    });
  }, 300);
}

function preStartHceAuth(logId) {
  // 非 APP-PLUS 或插件未集成时直接跳过，由 keyPickup 页面继续兜底提示。
  // #ifndef APP-PLUS
  return;
  // #endif

  // #ifdef APP-PLUS
  if (plus.os.name !== 'Android') return;
  if (!isHcePluginReady()) return;
  // 统一授权报文生成逻辑，避免页面间签名不一致。
  const payload = buildOpenBoxPayload({
    carId: carId.value,
    logId,
    plateNo: car.value?.plateNo || '',
    user: form.value.user || '',
  });
  const ok = setHcePayload(buildOpenBoxNfcPayload(payload));
  if (!ok) return;
  // 默认授权时长 300 秒（5 分钟）。
  startHceSession(300);
  // #endif
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
