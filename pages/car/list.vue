<template>
    <view class="car-list pageBg">
        <view class="top-hero">
            <view class="statuBar" :style="{height: barheight+'px'}"></view>
            <view class="hero-content">
                <view>
                    <view class="hero-title">警车调度</view>
                    <view class="hero-sub">空闲车快速登记，占用车支持结束使用</view>
                </view>
                <view class="hero-pill">共 {{ vehicles.length }} 辆</view>
            </view>
        </view>

        <view class="car-grid card">
            <view class="car-card" v-for="car in vehicles" :key="car.id">
                <view class="car-header" @click="goDetail(car.id)">
                    <text class="plate">{{ car.plate }}</text>
                    <text :class="['status-badge', car.status]">{{ statusText[car.status] }}</text>
                </view>
                <view class="meta-row">
                    <text class="pill">{{ car.type }}</text>
                </view>
                <view class="meta">当前里程：{{ car.mileage }} km</view>
                <view class="meta">当前使用人：{{ car.occupant || '空闲' }}</view>
                <view class="actions">
                    <button size="mini" type="default" class="ghost-btn" @click="goDetail(car.id)">详情</button>
                    <button
                        size="mini"
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
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { endUse, getHistory, getVehicles, statusText } from './data.js';
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());
const vehicles = ref([]);
const currentUser = '张三';

function normalizeOccupant(list) {
    const history = getHistory();
    return list.map(v => {
        if (v.status === 'in_use' && !v.occupant) {
            const latest = history.find(h => h.vehicleId === v.id);
            return { ...v, occupant: latest?.applicant || '' };
        }
        return v;
    });
}

function loadData() {
    vehicles.value = normalizeOccupant(getVehicles());
}

function goDetail(id) {
    uni.navigateTo({ url: `/pages/car/detail?id=${id}` });
}

function actionText(car) {
    if (car.status === 'idle') return '立即用车';
    if (car.status === 'in_use' && car.occupant === currentUser) return '结束使用';
    return '占用中';
}

function actionDisabled(car) {
    return car.status === 'in_use' && car.occupant !== currentUser;
}

function btnClass(car) {
    if (car.status === 'idle') return 'primary-btn';
    if (car.status === 'in_use' && car.occupant === currentUser) return 'warn-btn';
    return 'disabled-btn';
}

function handleAction(car) {
    if (car.status === 'idle') {
        uni.navigateTo({ url: `/pages/car/usecar?vehicleId=${car.id}` });
        return;
    }
    if (car.status === 'in_use' && car.occupant === currentUser) {
        uni.navigateTo({ url: `/pages/car/usecar?vehicleId=${car.id}&mode=end` });
        return;
    }
    uni.showToast({ title: '车辆占用中', icon: 'none' });
}

onShow(loadData);
</script>

<style lang="scss" scoped>
.car-list {
    min-height: 100vh;
    padding: 0 24rpx 40rpx;

    .top-hero {
        background: linear-gradient(135deg, #0f75ff, #56a0ff);
        border-radius: 0 0 24rpx 24rpx;
        padding: 20rpx;
        color: #fff;
        box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
        .hero-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10rpx 4rpx 6rpx;
        }
        .hero-title {
            font-size: 44rpx;
            font-weight: 700;
        }
        .hero-sub {
            margin-top: 6rpx;
            font-size: 26rpx;
            opacity: 0.9;
        }
        .hero-pill {
            padding: 10rpx 18rpx;
            border-radius: 999rpx;
            background: rgba(255,255,255,0.15);
            font-size: 26rpx;
            font-weight: 600;
        }
    }

    .card {
        background: rgba(255,255,255,0.92);
        border-radius: 16rpx;
        padding: 16rpx;
        box-shadow: 0 10rpx 28rpx rgba(0,0,0,0.08);
        margin-top: 16rpx;
    }

    .car-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16rpx;
    }

    .car-card {
        padding: 14rpx;
        border-radius: 14rpx;
        background: linear-gradient(180deg, #fafdff, #ffffff);
        box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06);
    }

    .car-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10rpx;
        .plate {
            font-size: 32rpx;
            font-weight: 700;
            color: #1b2c3e;
        }
    }

    .meta-row {
        display: flex;
        gap: 8rpx;
        margin-bottom: 6rpx;
    }

    .pill {
        background: #eaf3ff;
        color: #0f75ff;
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
    }

    .meta {
        color: #6b7785;
        font-size: 24rpx;
        margin-bottom: 4rpx;
    }

    .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 10rpx;
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

    .disabled-btn {
        background: #eef1f5;
        color: #a0a8b3;
    }

    .status-badge {
        padding: 6rpx 14rpx;
        border-radius: 14rpx;
        font-size: 24rpx;
        &.idle { background: #e6f7ed; color: #1b9d5d; }
        &.in_use { background: #eaf3ff; color: #0f75ff; }
        &.maintenance { background: #fff6e6; color: #c88719; }
        &.pending { background: #fff6e6; color: #c88719; }
    }
}
</style>
