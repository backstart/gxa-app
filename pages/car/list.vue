<template>
  <view class="car-list pageBg">
	  <view class="statuBar" :style="{ height: barheight + 'px' }"></view>
    <view class="header-wrap">
      
      <view class="header-inner">
        <view class="header-title-row">
          <text class="title">{{ selectMode ? '选择警车' : '警车调度' }}</text>
          <text class="sub">共 {{ totalCount }} 辆</text>
        </view>

        <view class="search-bar">
          <text class="icon-search">🔍</text>
          <input
            class="search-input"
            v-model="searchKey"
            placeholder="输入车牌过滤"
            placeholder-class="search-placeholder"
          />
          <text v-if="searchKey" class="icon-clear" @click="searchKey = ''">✕</text>
        </view>

        <view class="status-card-grid">
          <view
            v-for="s in statusOptions"
            :key="s.value"
            :class="statusCardClass(s.value)"
            @click="statusFilter = s.value"
          >
            <text class="status-label">{{ s.label }}</text>
            <text class="status-count">{{ statusCountMap[s.value] || 0 }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="car-grid card">
      <view class="car-card" v-for="car in displayCars" :key="car.carId">
        <view class="card-top" @click="goDetail(car.carId)">
          <text class="plate">{{ car.plateNo }}</text>
          <text :class="['status-badge', car.status]">{{ statusLabel(car.status) }}</text>
        </view>
        <view class="card-body">
          <view class="body-line">
            <text class="body-label">车型</text>
            <view class="body-inline">
              <text v-if="car.typeText" class="pill">{{ car.typeText }}</text>
              <text v-else class="pill ghost">未录入车型</text>
              <text v-if="car.overtimeBadge" :class="['overtime', car.overtimeBadge]">{{ car.overtimeText }}</text>
            </view>
          </view>
          <view class="body-line">
            <text class="body-label">里程</text>
            <text class="body-value">{{ car.currentMileage }} km</text>
          </view>
          <view class="body-line">
            <text class="body-label">使用</text>
            <text class="body-value">{{ car.usingSummary }}</text>
          </view>
        </view>
        <view class="card-actions">
          <button size="mini" type="default" class="action-btn ghost-btn" @click="goDetail(car.carId)">详情</button>
          <button
            size="mini"
            class="action-btn"
            :class="btnClass(car)"
            :disabled="actionDisabled(car)"
            @click="handleAction(car)"
          >
            {{ actionText(car) }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getCarUseLogs, getCars } from '@/common/database.js';
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());
const cars = ref([]);
const logs = ref([]);
const currentUser = ref('');
const selectMode = ref(false);
const incidentId = ref('');
const statusFilter = ref('all');
const searchKey = ref('');

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'idle', label: '空闲' },
  { value: 'using', label: '使用中' },
  { value: 'maintain', label: '维护' },
];

function loadData() {
  cars.value = getCars();
  logs.value = getCarUseLogs();
  currentUser.value = uni.getStorageSync('userName') || '张三';
}

function normalizeStatus(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'in_use') return 'using';
  if (raw === 'maintenance') return 'maintain';
  if (raw === 'idle') return 'idle';
  if (raw === 'using' || raw === 'maintain') return raw;
  return raw || 'idle';
}

function statusLabel(status) {
  const map = { idle: '空闲', using: '使用中', maintain: '维护中' };
  return map[status] || '未知';
}

function parseTime(value) {
  if (!value) return null;
  const t = new Date(String(value).replace(/-/g, '/'));
  return Number.isNaN(t.getTime()) ? null : t;
}

function formatTimeShort(value) {
  if (!value) return '—';
  const parts = String(value).split(' ');
  if (parts.length > 1) return parts[1].slice(0, 5);
  if (String(value).includes(':')) return String(value).slice(0, 5);
  return String(value) || '—';
}

function durationHours(startTime) {
  const t = parseTime(startTime);
  if (!t) return 0;
  return (Date.now() - t.getTime()) / 3600000;
}

// 先做统一数据映射：状态标准化、占用摘要、按钮判断依赖字段都在此准备。
const mappedCars = computed(() => {
  return cars.value
    .map((car) => {
      const status = normalizeStatus(car.status);
      const currentMileage = car.currentMileage ?? car.currentOdo ?? car.mileage ?? 0;
      const typeText = car.type || car.carType || car.vehicleType || '';
      const openLog = logs.value.find((log) => log.carId === car.carId && String(log.status || '').toUpperCase() === 'OPEN');
      const usingUser = openLog?.user || openLog?.applicant || car.usingInfo?.user || '';
      const usingStart = openLog?.startTime || car.usingInfo?.startTime || '';
      // 兼容旧数据：未提供 keyPicked 时按 false 处理，确保默认显示“取钥匙”。
      const keyPicked = car.usingInfo?.keyPicked === true;
      const hours = status === 'using' ? durationHours(usingStart) : 0;
      let overtimeBadge = '';
      if (hours >= 24) overtimeBadge = 'critical';
      else if (hours >= 8) overtimeBadge = 'warn';
      const timeText = formatTimeShort(usingStart);
      const durationText = hours >= 1 ? `${Math.floor(hours)}h` : usingStart ? '<1h' : '—';
      const usingSummary = status === 'using'
        ? `${usingUser || '—'} · ${timeText} / ${durationText}`
        : status === 'maintain'
          ? '维护中'
          : '—';
      const maintainText = car.maintainReason || car.maintainRecoverAt
        ? `${car.maintainReason || '维护中'}${car.maintainRecoverAt ? ` · 预计${car.maintainRecoverAt}` : ''}`
        : '维护中';
      return {
        ...car,
        status,
        currentMileage,
        typeText,
        openLog,
        usingUser,
        usingStart,
        keyPicked,
        usingSummary,
        overtimeBadge,
        overtimeText: overtimeBadge === 'critical' ? '严重超时' : overtimeBadge === 'warn' ? '超时' : '',
        maintainText,
      };
    });
});

// 先按车牌关键字过滤，状态卡片数量会跟随关键字变化，避免出现“点了状态却没有数据”的认知落差。
const keywordCars = computed(() => {
  const key = searchKey.value.trim();
  return mappedCars.value.filter((car) => (key ? String(car.plateNo || '').includes(key) : true));
});

// 状态卡片数量映射：用于卡片式筛选展示“全部/空闲/使用中/维护”的当前计数。
const statusCountMap = computed(() => {
  const map = { all: keywordCars.value.length, idle: 0, using: 0, maintain: 0 };
  keywordCars.value.forEach((car) => {
    if (map[car.status] !== undefined) map[car.status] += 1;
  });
  return map;
});

// 页面总车辆数用于头部轻量展示，不随筛选切换变化。
const totalCount = computed(() => mappedCars.value.length);

const displayCars = computed(() => {
  return keywordCars.value.filter((car) => {
    if (selectMode.value && car.status !== 'idle') return false;
    if (statusFilter.value !== 'all' && car.status !== statusFilter.value) return false;
    return true;
  });
});

function statusCardClass(status) {
  // 状态卡片分色：全部/空闲/使用中/维护各自独立色系，提升识别度。
  const colorClass = {
    all: 'card-all',
    idle: 'card-idle',
    using: 'card-using',
    maintain: 'card-maintain',
  }[status] || 'card-all';
  return ['status-card', colorClass, statusFilter.value === status ? 'card-active' : ''];
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/car/detail?carId=${id}` });
}

function actionText(car) {
  if (selectMode.value) return car.status === 'idle' ? '选择' : '不可选';
  if (car.status === 'idle') return '立即用车';
  if (car.status === 'using' && car.usingUser === currentUser.value) {
    // 使用中状态改为“取钥匙 -> 结束用”两段式，避免未取钥匙就结束。
    return car.keyPicked ? '结束用车' : '取钥匙';
  }
  if (car.status === 'using') return '查看占用';
  return '维护中';
}

function actionDisabled(car) {
  if (selectMode.value) return car.status !== 'idle';
  if (car.status === 'maintain') return true;
  return false;
}

function btnClass(car) {
  if (selectMode.value) return car.status === 'idle' ? 'primary-btn' : 'disabled-btn';
  if (car.status === 'idle') return 'primary-btn';
  if (car.status === 'using' && car.usingUser === currentUser.value) {
    // “取钥匙”使用独立淡绿色样式，避免与“立即用车”的蓝色主按钮混淆。
    return car.keyPicked ? 'warn-btn' : 'btn-pickup';
  }
  if (car.status === 'using') return 'ghost-btn';
  return 'disabled-btn';
}

function handleAction(car) {
  if (selectMode.value && car.status === 'idle') {
    const channel = getEventChannel();
    const payload = { carId: car.carId, plateNo: car.plateNo, type: car.type };
    if (channel) channel.emit('carSelected', payload);
    uni.navigateBack();
    return;
  }
  if (car.status === 'idle') {
    const url = incidentId.value
      ? `/pages/car/usecar?carId=${car.carId}&incidentId=${incidentId.value}`
      : `/pages/car/usecar?carId=${car.carId}`;
    uni.navigateTo({ url });
    return;
  }
  if (car.status === 'using' && car.usingUser === currentUser.value) {
    // 未取钥匙时先进入取钥匙页，取钥匙成功后列表按钮会自动切换为“结束用车”。
    if (!car.keyPicked) {
      const targetLogId = car.openLog?.id || '';
      const query = targetLogId ? `carId=${car.carId}&logId=${targetLogId}` : `carId=${car.carId}`;
      uni.navigateTo({ url: `/pages/car/keyPickup?${query}` });
      return;
    }
    uni.navigateTo({ url: `/pages/car/detail?carId=${car.carId}&end=1` });
    return;
  }
  if (car.status === 'using') {
    goDetail(car.carId);
    return;
  }
  uni.showToast({ title: '车辆维护中', icon: 'none' });
}

function getEventChannel() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  return current?.getOpenerEventChannel ? current.getOpenerEventChannel() : null;
}

onLoad((query) => {
  selectMode.value = String(query.selectMode || '') === '1';
  incidentId.value = query.incidentId || '';
});

onShow(loadData);
</script>

<style lang="scss" scoped>
.car-list {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;

  .header-wrap {
    margin-top: 4rpx;
    border-radius: 20rpx;
    background: linear-gradient(135deg, #edf6ff 0%, #f3fbf6 100%);
    box-shadow: 0 12rpx 28rpx rgba(22, 55, 90, 0.08);
    overflow: hidden;
  }

  .header-inner {
    padding: 12rpx 20rpx 20rpx;
  }

  .header-title-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 14rpx;
  }

  .title {
    font-size: 40rpx;
    font-weight: 700;
    color: #1d2f45;
  }

  .sub {
    font-size: 24rpx;
    color: #6f7f93;
  }

  .card {
    background: rgba(255,255,255,0.92);
    border-radius: 18rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 22rpx rgba(20, 34, 52, 0.08);
    margin-top: 16rpx;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 12rpx 18rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: inset 0 0 0 1px rgba(15, 117, 255, 0.08), 0 6rpx 16rpx rgba(15, 39, 64, 0.06);
  }

  .icon-search {
    font-size: 28rpx;
    line-height: 1;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    padding: 6rpx 0;
    font-size: 26rpx;
    color: #1f2b3a;
  }

  .search-placeholder {
    color: #96a0ab;
  }

  .icon-clear {
    color: #0f75ff;
    font-size: 24rpx;
    flex-shrink: 0;
    padding: 4rpx 8rpx;
    border-radius: 999rpx;
    background: rgba(15, 117, 255, 0.08);
  }

  .status-card-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12rpx;
    margin-top: 14rpx;
  }

  .status-card {
    min-width: 0;
    padding: 14rpx 12rpx;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .card-all {
    background: #f1ecff;
    color: #5a3fd3;
  }

  .card-idle {
    background: #e9f8ee;
    color: #1d7a3a;
  }

  .card-using {
    background: #e8f2ff;
    color: #1d55c2;
  }

  .card-maintain {
    background: #fff3e6;
    color: #b45309;
  }

  .card-active {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 20rpx rgba(22, 55, 90, 0.1);
  }

  .card-all.card-active {
    border-color: #cdc0ff;
  }

  .card-idle.card-active {
    border-color: #bfe8cd;
  }

  .card-using.card-active {
    border-color: #bed7ff;
  }

  .card-maintain.card-active {
    border-color: #f3d7ba;
  }

  .status-label {
    font-size: 24rpx;
    line-height: 1.2;
  }

  .card-active .status-label {
    font-weight: 700;
  }

  .status-count {
    font-size: 30rpx;
    font-weight: 700;
    line-height: 1.1;
  }

  .car-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
    align-items: stretch;
  }

  .car-card {
    padding: 14rpx;
    border-radius: 18rpx;
    background: linear-gradient(180deg, #fafdff, #ffffff);
    box-shadow: 0 8rpx 18rpx rgba(0,0,0,0.07);
    display: flex;
    flex-direction: column;
    min-height: 320rpx;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    min-height: 56rpx;
    padding-right: 120rpx;
    margin-bottom: 10rpx;
    .plate {
      font-size: 32rpx;
      font-weight: 700;
      color: #1b2c3e;
    }
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    min-height: 150rpx;
  }

  .body-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10rpx;
  }

  .body-label {
    color: #6b7785;
    font-size: 24rpx;
    flex-shrink: 0;
    width: 64rpx;
  }

  .body-value {
    color: #1f2b3a;
    font-size: 24rpx;
    text-align: right;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .body-inline {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    justify-content: flex-end;
  }

  .pill {
    background: #eaf3ff;
    color: #0f75ff;
    padding: 6rpx 12rpx;
    border-radius: 12rpx;
    font-size: 22rpx;
  }

  .pill.ghost {
    background: #f4f6f8;
    color: #9aa3ad;
  }

  .overtime {
    padding: 4rpx 10rpx;
    border-radius: 12rpx;
    font-size: 22rpx;
    white-space: nowrap;
  }
  .overtime.warn {
    background: #fff6e6;
    color: #c88719;
  }
  .overtime.critical {
    background: #ffecec;
    color: #d64545;
  }

  .card-actions {
    display: flex;
    gap: 12rpx;
    margin-top: auto;
    min-height: 72rpx;
    align-items: center;
  }

  .action-btn {
    flex: 1;
    height: 64rpx;
    line-height: 64rpx;
    font-size: 24rpx;
    border-radius: 12rpx;
  }

  .ghost-btn {
    border: 1px solid #d0d6de;
    background: #fff;
    color: #1f2b3a;
  }

  .primary-btn {
    background: linear-gradient(90deg, #0f75ff, #56a0ff);
    color: #fff;
  }

  .warn-btn {
    background: linear-gradient(90deg, #ff9a5f, #ff6a3d);
    color: #fff;
  }

  .btn-pickup {
    // 取钥匙按钮：淡绿色语义，表示“下一步待完成动作”。
    background: #dff5e6;
    color: #1d7a3a;
    border: 1px solid #bfe8cd;
  }

  .disabled-btn {
    background: #eef1f5;
    color: #a0a8b3;
  }

  .status-badge {
    padding: 6rpx 14rpx;
    border-radius: 14rpx;
    font-size: 24rpx;
    position: absolute;
    right: 0;
    top: 0;
    &.idle { background: #e6f7ed; color: #1b9d5d; }
    &.using { background: #eaf3ff; color: #0f75ff; }
    &.maintain { background: #fff6e6; color: #c88719; }
  }
}
</style>
