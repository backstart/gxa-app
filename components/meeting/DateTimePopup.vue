<template>
  <view class="mask" @tap="handleMaskClose">
    <view class="panel" @tap.stop>
      <view class="title">{{ titleText }}</view>
      <!-- 使用 picker-view 实现自定义时间选择，替代原生 datetime 样式 -->
      <picker-view class="picker" :indicator-style="indicatorStyle" :value="pickerValue" @change="onPickerChange">
        <picker-view-column>
          <view v-for="item in dateOptions" :key="item.value" class="item">{{ item.label }}</view>
        </picker-view-column>
        <picker-view-column>
          <view v-for="item in hourOptions" :key="item" class="item">{{ item }}</view>
        </picker-view-column>
        <picker-view-column>
          <view v-for="item in minuteOptions" :key="item" class="item">{{ item }}</view>
        </picker-view-column>
      </picker-view>
      <view class="footer">
        <text class="btn cancel" @tap="emit('close')">取消</text>
        <text class="btn confirm" @tap="confirmPick">确定</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Number, default: 0 },
});

const emit = defineEmits(['confirm', 'close']);

const ONE_DAY = 24 * 60 * 60 * 1000;
const indicatorStyle = 'height: 84rpx;';
const dateOptions = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const list = [];
  // 时间范围前后各30天，满足会议通知场景使用并保持选择器轻量。
  for (let i = -30; i <= 30; i += 1) {
    const ts = today.getTime() + i * ONE_DAY;
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    const week = '日一二三四五六'[d.getDay()];
    list.push({
      value: `${y}-${m}-${day}`,
      label: `${m}月${day}日 周${week}`,
      fullLabel: `${y}年${m}月${day}日 星期${week}`,
    });
  }
  return list;
});

const hourOptions = Array.from({ length: 24 }, (_, i) => `${i}`.padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => `${i}`.padStart(2, '0'));

const pickerValue = ref([30, 0, 0]);

watch(
  () => props.modelValue,
  (val) => {
    // 打开弹窗时根据已选值回填，避免每次都跳回当前时间。
    const d = val ? new Date(val) : new Date();
    const dateKey = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
    const dateIndex = dateOptions.value.findIndex((item) => item.value === dateKey);
    const h = d.getHours();
    const m = d.getMinutes();
    pickerValue.value = [Math.max(dateIndex, 0), h, m];
  },
  { immediate: true }
);

const titleText = computed(() => {
  const [dateIndex, hourIndex, minuteIndex] = pickerValue.value;
  const dateObj = dateOptions.value[dateIndex] || dateOptions.value[30];
  if (!dateObj) return '';
  return `${dateObj.fullLabel} ${hourOptions[hourIndex]}:${minuteOptions[minuteIndex]}`;
});

function onPickerChange(e) {
  pickerValue.value = e.detail.value;
}

function confirmPick() {
  const [dateIndex, hourIndex, minuteIndex] = pickerValue.value;
  const dateObj = dateOptions.value[dateIndex];
  if (!dateObj) return emit('close');
  const ts = new Date(`${dateObj.value} ${hourOptions[hourIndex]}:${minuteOptions[minuteIndex]}`.replace(/-/g, '/')).getTime();
  emit('confirm', ts);
}

function handleMaskClose() {
  // 点击蒙层直接关闭，符合底部弹层常规交互。
  emit('close');
}
</script>

<style scoped lang="scss">
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1200;
  display: flex;
  align-items: flex-end;
}

.panel {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 20rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.title {
  text-align: center;
  font-size: 34rpx;
  color: #1f2d40;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.picker {
  width: 100%;
  height: 420rpx;
}

.item {
  line-height: 84rpx;
  text-align: center;
  font-size: 30rpx;
  color: #253144;
}

.footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-top: 14rpx;
}

.btn {
  height: 72rpx;
  border-radius: 14rpx;
  line-height: 72rpx;
  text-align: center;
  font-size: 30rpx;
}

.cancel {
  color: #8a96a8;
  background: #f3f5f9;
}

.confirm {
  color: #1677ff;
  background: #eaf1ff;
}
</style>
