<template>
    <view class="car-detail pageBg">
        <view class="statuBar" :style="{height: barheight+'px'}"></view>
        <view class="header">
            <view class="title">{{ vehicle.plate || '警车详情' }}</view>
            <view class="subtitle">{{ vehicle.type }}</view>
        </view>

        <view class="card info-card">
            <view class="row">
                <text class="label">车牌</text>
                <text>{{ vehicle.plate }}</text>
                <text :class="['status-badge', vehicle.status]">{{ statusText[vehicle.status] }}</text>
            </view>
            <view class="row">
                <text class="label">类型</text>
                <text>{{ vehicle.type }}</text>
            </view>
            <view class="row">
                <text class="label">当前里程</text>
                <text>{{ vehicle.mileage }} km</text>
            </view>
            <view class="row">
                <text class="label">保养日期</text>
                <text>{{ vehicle.maintenanceDate }}</text>
            </view>
            <view class="row">
                <text class="label">保险到期</text>
                <text>{{ vehicle.insurance }}</text>
            </view>
            <button class="primary-btn" type="primary" :disabled="vehicle.status !== 'idle'" @click="goRegister">
                {{ vehicle.status === 'idle' ? '用这辆车登记' : '车辆占用中' }}
            </button>
        </view>

        <view class="card history-card">
            <view class="section-title">使用历史</view>
            <view v-if="history.length === 0" class="empty">暂无记录</view>
            <view v-for="item in history" :key="item.id" class="history-item">
                <view class="row">
                    <text class="label">使用人</text>
                    <text>{{ item.applicant }}</text>
                    <text :class="['status', item.status]">{{ statusText[item.status] }}</text>
                </view>
                <view class="row">
                    <text class="label">里程</text>
                    <text>{{ item.startMileage }} → {{ item.endMileage || '进行中' }} km</text>
                </view>
                <view class="row">
                    <text class="label">用途/目的地</text>
                    <text>{{ item.purpose }} / {{ item.destination }}</text>
                </view>
                <view class="row">
                    <text class="label">备注</text>
                    <text>{{ item.comment || '无' }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getHistory, getVehicleById, statusText } from '@/common/database.js';
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());
const vehicleId = ref('');
const vehicle = ref({});
const history = ref([]);

function loadData() {
    if (!vehicleId.value) return;
    const detail = getVehicleById(vehicleId.value);
    if (detail) vehicle.value = detail;
    history.value = getHistory().filter(item => item.vehicleId === vehicleId.value);
}

function goRegister() {
    uni.navigateTo({ url: `/pages/car/usecar?vehicleId=${vehicleId.value}` });
}

onLoad((query) => {
    vehicleId.value = query.id || '';
    loadData();
});

onShow(() => {
    loadData();
});
</script>

<style lang="scss" scoped>
.car-detail {
    min-height: 100vh;
    padding: 0 24rpx 40rpx;

    .header {
        padding: 20rpx 8rpx 10rpx;
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
    }

    .card {
        background: rgba(255,255,255,0.9);
        border-radius: 16rpx;
        padding: 20rpx;
        box-shadow: 0 6rpx 24rpx rgba(0,0,0,0.06);
        margin-bottom: 18rpx;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-bottom: 8rpx;
        .label {
            width: 170rpx;
            color: #6b7785;
            font-size: 26rpx;
        }
    }

    .status {
        padding: 4rpx 10rpx;
        border-radius: 10rpx;
        font-size: 24rpx;
        &.pending { background: #fff6e6; color: #c88719; }
        &.approved { background: #e6f7ed; color: #1b9d5d; }
        &.rejected { background: #ffecec; color: #d64545; }
        &.completed { background: #e6f7ed; color: #1b9d5d; }
        &.in_use { background: #eaf3ff; color: #0f75ff; }
    }

    .status-badge {
        margin-left: auto;
        padding: 6rpx 14rpx;
        border-radius: 14rpx;
        font-size: 24rpx;
        &.idle { background: #e6f7ed; color: #1b9d5d; }
        &.in_use { background: #eaf3ff; color: #0f75ff; }
        &.maintenance { background: #fff6e6; color: #c88719; }
    }

    .primary-btn {
        margin-top: 12rpx;
        background: linear-gradient(90deg, #0f75ff, #56a0ff);
        color: white;
        font-size: 30rpx;
        border-radius: 12rpx;
    }

    .history-card {
        .section-title {
            font-size: 32rpx;
            font-weight: 600;
            margin-bottom: 16rpx;
            color: #1f2b3a;
        }
        .history-item {
            padding: 12rpx 0;
            border-bottom: 1px solid #f1f3f5;
            &:last-child { border-bottom: none; }
        }
        .empty {
            text-align: center;
            color: #97a1ad;
            padding: 30rpx 0;
        }
    }
}
</style>
