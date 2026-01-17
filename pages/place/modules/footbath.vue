<template>
  <AppPage>
    <view class="module-page pageBg">
      <view class="header">
        <view>
          <view class="title">足浴模块</view>
          <view class="sub">{{ place?.name || '' }}</view>
        </view>
      </view>

    <view class="card" v-if="place">
      <view class="row"><text class="label">地址</text><text class="value">{{ place.address }}</text></view>
      <view class="row"><text class="label">主类型</text><text class="value">{{ place.primaryType }}</text></view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">足浴信息</text>
      </view>
      <view class="form-row">
        <text class="label">包间数</text>
        <input class="input" v-model="form.roomCount" type="number" />
      </view>
      <view class="form-row">
        <text class="label">从业人数</text>
        <input class="input" v-model="form.staffCount" type="number" />
      </view>
      <view class="form-row switch-row">
        <text class="label">涉黄风险</text>
        <switch :checked="form.riskPornFlag" @change="(e)=> form.riskPornFlag = e.detail.value" />
      </view>
      <view class="form-row">
        <text class="label">营业时间</text>
        <input class="input" v-model="form.businessHours" placeholder="如 10:00-02:00" />
      </view>
      <view class="form-row">
        <text class="label">证照到期</text>
        <picker mode="date" @change="(e)=> form.licenseDue = e.detail.value">
          <view class="picker">{{ form.licenseDue || '请选择' }}</view>
        </picker>
      </view>
    </view>

      <view class="action-bar">
        <button type="primary" class="submit-btn" @click="save">保存</button>
        <button class="ghost-btn" @click="goDispatch">生成足浴专项派单</button>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, updateProfile } from '@/common/database.js';
import AppPage from '@/components/app/AppPage.vue';

const placeId = ref('');
const place = ref(null);
const form = reactive({ roomCount: 0, staffCount: 0, riskPornFlag: false, businessHours: '', licenseDue: '' });

function loadData() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  const profile = getPlaceProfiles().find((p) => p.placeId === placeId.value);
  if (!profile?.modules?.FOOTBATH) {
    updateProfile(placeId.value, { modules: { FOOTBATH: { ...form } } });
  } else {
    Object.assign(form, profile.modules.FOOTBATH);
  }
}

function save() {
  updateProfile(placeId.value, { modules: { FOOTBATH: { ...form } } });
  uni.showToast({ title: '已保存', icon: 'success' });
}

function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}&module=FOOTBATH` });
}

onLoad((query) => {
  placeId.value = query.placeId || '';
});
onShow(loadData);
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.module-page {
  padding: 0 24rpx 140rpx;
}
.header {
  padding: 10rpx 0 20rpx;
  .title {
    font-size: 44rpx;
    font-weight: 700;
    color: #1f2b3a;
  }
  .sub {
    margin-top: 6rpx;
    color: #6e7a89;
    font-size: 26rpx;
  }
}
.card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 16rpx;
}
.section-head {
  margin-bottom: 10rpx;
  .section-title {
    font-size: 32rpx;
    font-weight: 700;
  }
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
  .label { color: #6b7785; font-size: 26rpx; }
  .value { color: #1f2b3a; font-size: 26rpx; }
}
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.label { font-size: 26rpx; color: #344150; }
.input, .picker {
  flex: 1;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 12rpx 14rpx;
  font-size: 26rpx;
}
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10rpx 20rpx 20rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 10rpx;
}
.submit-btn {
  flex: 1;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}
.ghost-btn {
  flex: 1;
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
}
</style>
