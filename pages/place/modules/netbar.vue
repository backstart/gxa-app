<template>
  <AppPage>
    <view class="module-page pageBg">
      <view class="header">
        <view>
          <view class="title">网吧模块</view>
          <view class="sub">{{ place?.name || '' }}</view>
        </view>
      </view>

    <view class="card" v-if="place">
      <view class="row"><text class="label">地址</text><text class="value">{{ place.address }}</text></view>
      <view class="row"><text class="label">主类型</text><text class="value">{{ place.primaryType }}</text></view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">网吧信息</text>
      </view>
      <view class="form-row">
        <text class="label">机位数</text>
        <input class="input" v-model="form.seatCount" type="number" />
      </view>
      <view class="form-row">
        <text class="label">实名系统</text>
        <picker :range="realNameOptions" @change="(e)=> form.realNameSystem = realNameOptions[e.detail.value]">
          <view class="picker">{{ form.realNameSystem }}</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="label">未成年管控</text>
        <picker :range="minorOptions" @change="(e)=> form.minorControl = minorOptions[e.detail.value]">
          <view class="picker">{{ form.minorControl }}</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="label">高峰时段</text>
        <input class="input" v-model="form.peakHours" placeholder="如 20:00-23:00" />
      </view>
      <view class="form-row switch-row">
        <text class="label">监控</text>
        <switch :checked="form.hasCCTV" @change="(e)=> form.hasCCTV = e.detail.value" />
      </view>
    </view>

      <view class="action-bar">
        <button type="primary" class="submit-btn" @click="save">保存</button>
        <button class="ghost-btn" @click="goDispatch">生成网吧专项派单</button>
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
const form = reactive({ seatCount: 0, realNameSystem: '正常', minorControl: '严格', peakHours: '', hasCCTV: false });
const realNameOptions = ['正常', '异常', '未知'];
const minorOptions = ['严格', '一般', '未知'];

function loadData() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  const profile = getPlaceProfiles().find((p) => p.placeId === placeId.value);
  if (!profile?.modules?.NETBAR) {
    updateProfile(placeId.value, { modules: { NETBAR: { ...form } } });
  } else {
    Object.assign(form, profile.modules.NETBAR);
  }
}

function save() {
  updateProfile(placeId.value, { modules: { NETBAR: { ...form } } });
  uni.showToast({ title: '已保存', icon: 'success' });
}

function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}&module=NETBAR` });
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
