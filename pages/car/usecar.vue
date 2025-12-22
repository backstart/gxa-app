<template>
    <view class="car-register pageBg">
        <view class="statuBar" :style="{height: barheight+'px'}"></view>
        <view class="header">
            <view class="title">{{ isEndMode ? '结束使用' : '用车登记' }}</view>
            <view class="subtitle">{{ isEndMode ? '填写归还里程结束用车' : '选择车辆后自动带出上一笔结束里程' }}</view>
        </view>

        <view class="card">
            <view class="vehicle-summary" v-if="currentVehicle">
                <view class="row">
                    <text class="label">车牌</text>
                    <text>{{ currentVehicle.plate }}</text>
                    <text :class="['status-badge', currentVehicle.status]">{{ statusText[currentVehicle.status] }}</text>
                </view>
                <view class="row">
                    <text class="label">当前里程</text>
                    <text>{{ currentVehicle.mileage }} km</text>
                </view>
            </view>

            <view v-if="!isEndMode">
                <view class="form-item">
                    <text class="label">使用人</text>
                    <input class="input" v-model="form.applicant" placeholder="请输入使用人" />
                </view>
                <view class="form-item">
                    <text class="label">车辆</text>
                    <picker mode="selector" :range="vehicleNames" @change="onVehicleChange">
                        <view class="picker-value">{{ form.vehicleId ? vehicleLabel(form.vehicleId) : '请选择车辆' }}</view>
                    </picker>
                </view>
                <view class="form-item">
                    <text class="label">开始里程</text>
                    <view class="readonly">{{ form.startMileage ? form.startMileage + ' km' : '选择车辆后自动填充' }}</view>
                </view>
                <view class="form-item">
                    <text class="label">用途</text>
                    <picker mode="selector" :range="purposeOptions" @change="onPurposeChange">
                        <view class="picker-value">{{ form.purpose || '请选择用途' }}</view>
                    </picker>
                </view>
                <view class="form-item">
                    <text class="label">目的地</text>
                    <picker mode="selector" :range="destinationOptions" @change="onDestinationChange">
                        <view class="picker-value">{{ form.destination || '请选择目的地' }}</view>
                    </picker>
                </view>
                <button class="primary-btn" type="primary" @click="submitStart">提交登记</button>
            </view>

            <view v-else>
                <view class="form-item">
                    <text class="label">使用人</text>
                    <view class="readonly">{{ activeRecord?.applicant || '未知' }}</view>
                </view>
                <view class="form-item">
                    <text class="label">开始里程</text>
                    <view class="readonly">{{ activeRecord?.startMileage || '--' }} km</view>
                </view>
                <view class="form-item">
                    <text class="label">用途</text>
                    <view class="readonly">{{ activeRecord?.purpose || '--' }}</view>
                </view>
                <view class="form-item">
                    <text class="label">目的地</text>
                    <view class="readonly">{{ activeRecord?.destination || '--' }}</view>
                </view>
                <view class="form-item">
                    <text class="label">结束里程</text>
                    <input class="input" v-model="endMileage" type="number" placeholder="请输入结束里程" />
                </view>
                <button class="primary-btn" type="primary" @click="submitEnd">结束使用</button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { addRegistration, endUse, getActiveRecord, getLastEndMileage, getVehicles, statusText } from './data.js';
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());
const vehicles = ref([]);
const currentVehicle = ref(null);
const activeRecord = ref(null);
const isEndMode = ref(false);
const endMileage = ref('');
const purposeOptions = ['接处警', '巡逻', '办案', '其他'];
const destinationOptions = ['长命水', '龙石', '桂南', '其他'];

const form = reactive({
    applicant: '',
    vehicleId: '',
    startMileage: '',
    purpose: '',
    destination: '',
});

const vehicleNames = computed(() => vehicles.value.map(item => `${item.plate} (${statusText[item.status]})`));

// 根据车辆ID生成显示标签
function vehicleLabel(id) {
    const found = vehicles.value.find(v => v.id === id);
    return found ? `${found.plate} (${found.type})` : '未知车辆';
}

// 从存储加载车辆列表并保持当前选中车辆
function loadVehicles() {
    vehicles.value = getVehicles();
    if (form.vehicleId) {
        currentVehicle.value = vehicles.value.find(v => v.id === form.vehicleId) || null;
    }
}

// 设置当前选择的车辆，并带出开始里程与在用记录
function setVehicle(carId) {
    form.vehicleId = carId;
    form.startMileage = getLastEndMileage(carId);
    currentVehicle.value = vehicles.value.find(v => v.id === carId) || null;
    activeRecord.value = getActiveRecord(carId) || null;
}

// 车辆选择事件
function onVehicleChange(e) {
    const idx = e.detail.value;
    const car = vehicles.value[idx];
    if (car) {
        setVehicle(car.id);
    }
}

// 用途选择事件
function onPurposeChange(e) {
    const idx = e.detail.value;
    form.purpose = purposeOptions[idx] || '';
}

// 目的地选择事件
function onDestinationChange(e) {
    const idx = e.detail.value;
    form.destination = destinationOptions[idx] || '';
}

// 校验开始用车表单
function validateStart() {
    if (!form.applicant) return '请填写使用人';
    if (!form.vehicleId) return '请选择车辆';
    if (!form.purpose) return '请填写用途';
    if (!form.destination) return '请填写目的地';
    return '';
}

// 校验结束用车表单
function validateEnd() {
    if (!activeRecord.value) return '未找到用车记录';
    if (!endMileage.value) return '请填写结束里程';
    if (Number(endMileage.value) < Number(activeRecord.value.startMileage)) return '结束里程需大于开始里程';
    return '';
}

// 重置表单与状态
function resetForm() {
    form.applicant = '';
    form.vehicleId = '';
    form.startMileage = '';
    form.purpose = '';
    form.destination = '';
    currentVehicle.value = null;
    activeRecord.value = null;
    endMileage.value = '';
}

// 提交开始用车
function submitStart() {
    const error = validateStart();
    if (error) {
        uni.showToast({ title: error, icon: 'none' });
        return;
    }
    const nowId = `use-${Date.now()}`;
    const startM = form.startMileage || getLastEndMileage(form.vehicleId) || 0;
    const record = {
        id: nowId,
        applicant: form.applicant,
        vehicleId: form.vehicleId,
        purpose: form.purpose,
        destination: form.destination,
        startMileage: Number(startM),
    };
    addRegistration(record);
    uni.showToast({ title: '登记成功，车辆使用中', icon: 'success' });
    resetForm();
    setTimeout(() => uni.navigateBack(), 400);
}

// 提交结束用车
function submitEnd() {
    const error = validateEnd();
    if (error) {
        uni.showToast({ title: error, icon: 'none' });
        return;
    }
    endUse(currentVehicle.value.id, Number(endMileage.value), activeRecord.value.applicant);
    uni.showToast({ title: '已结束使用', icon: 'success' });
    resetForm();
    setTimeout(() => uni.navigateBack(), 400);
}

onLoad((query) => {
    isEndMode.value = query.mode === 'end';
    loadVehicles();
    if (query.vehicleId) {
        setVehicle(query.vehicleId);
    }
});
</script>

<style lang="scss">
.car-register {
    min-height: 100vh;
    padding: 0 24rpx 40rpx;

    .header {
        padding: 20rpx 8rpx;
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
        padding: 24rpx;
        box-shadow: 0 6rpx 24rpx rgba(0,0,0,0.06);
    }

    .vehicle-summary {
        margin-bottom: 12rpx;
    }

    .form-item {
        margin-bottom: 18rpx;
        .label {
            display: block;
            font-size: 26rpx;
            color: #4a5564;
            margin-bottom: 8rpx;
        }
        .input, .picker-value, .readonly {
            width: 100%;
            padding: 22rpx 18rpx;
            border-radius: 12rpx;
            background: #f4f6f8;
            font-size: 28rpx;
        }
        .readonly {
            color: #6b7785;
        }
    }

    .primary-btn {
        margin-top: 8rpx;
        background: linear-gradient(90deg, #0f75ff, #56a0ff);
        color: white;
        font-size: 30rpx;
        border-radius: 12rpx;
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

    .status-badge {
        margin-left: auto;
        padding: 6rpx 14rpx;
        border-radius: 14rpx;
        font-size: 24rpx;
        &.idle { background: #e6f7ed; color: #1b9d5d; }
        &.in_use { background: #eaf3ff; color: #0f75ff; }
        &.maintenance { background: #fff6e6; color: #c88719; }
    }
}
</style>
