<template>
  <view class="pageBg form-page">
    <view class="statuBar"></view>

    <view class="card">
      <view class="section-title">管控措施</view>
      <view class="formRow">
        <text class="formLabel">措施类型</text>
        <view class="chips">
          <view
            v-for="item in measureTypeOptions"
            :key="item"
            :class="['chip', form.types.includes(item) ? 'active' : '']"
            @click="toggleMeasureType(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>
      <view class="formRow">
        <text class="formLabel">状态</text>
        <picker :range="measureStatusOptions" @change="(e)=> form.status = measureStatusOptions[e.detail.value]">
          <view class="formInput">{{ form.status }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">开始时间</text>
        <picker mode="date" @change="(e)=> form.startDate = e.detail.value">
          <view class="formInput">{{ form.startDate || '--' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">结束时间</text>
        <picker mode="date" @change="(e)=> form.endDate = e.detail.value">
          <view class="formInput">{{ form.endDate || '--' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">备注</text>
        <textarea class="formInput" v-model="form.remark" placeholder="可选"></textarea>
      </view>
    </view>

    <view class="action-bar">
      <button type="primary" class="action-btn" @click="save">保存</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getKeyPersonMeasures, saveKeyPersonMeasures } from '@/common/database.js';

const personId = ref('');
const measureId = ref('');
const mode = ref('add');

const measureTypeOptions = ['定期走访', '社区帮扶', '谈话教育', '尿检', '家属协助', '稳控', '送治', '就业帮扶'];
const measureStatusOptions = ['执行中', '已完成', '暂停'];

const form = reactive({
  types: [],
  status: '执行中',
  startDate: '',
  endDate: '',
  remark: '',
});

function load() {
  if (mode.value !== 'edit') return;
  const item = getKeyPersonMeasures().find((m) => m.measureId === measureId.value);
  if (!item) return;
  form.types = item.types ? [...item.types] : [];
  form.status = item.status || '执行中';
  form.startDate = item.startDate || '';
  form.endDate = item.endDate || '';
  form.remark = item.remark || '';
}

function toggleMeasureType(item) {
  if (form.types.includes(item)) {
    form.types = form.types.filter((t) => t !== item);
  } else {
    form.types.push(item);
  }
}

function save() {
  if (!form.types.length) {
    uni.showToast({ title: '请选择措施类型', icon: 'none' });
    return;
  }
  const list = getKeyPersonMeasures();
  const now = Date.now();
  if (mode.value === 'add') {
    list.unshift({
      measureId: `measure_${Date.now()}`,
      personId: personId.value,
      types: [...form.types],
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
      remark: form.remark,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const idx = list.findIndex((m) => m.measureId === measureId.value);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        types: [...form.types],
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
        remark: form.remark,
        updatedAt: now,
      };
    }
  }
  saveKeyPersonMeasures(list);
  uni.showToast({ title: '已保存', icon: 'success' });
  uni.navigateBack();
}

onLoad((query) => {
  personId.value = query.personId || '';
  measureId.value = query.measureId || '';
  mode.value = query.mode || 'add';
  load();
});
</script>

<style lang="scss" scoped>
.form-page {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.formRow {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  font-size: 24rpx;
  color: #4f5a68;
}
.formLabel {
  color: #6e7a89;
  font-size: 24rpx;
}
.formInput {
  min-height: 64rpx;
  padding: 8rpx 12rpx;
  border-radius: 10rpx;
  background: #f6f8fb;
  font-size: 24rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}
.chip {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  background: #f6f8fb;
}
.chip.active {
  background: #eaf3ff;
  color: #0f75ff;
}
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx 24rpx;
  background: #fff;
  border-top: 1px solid #eef1f4;
}
.action-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
}
</style>
