<template>
  <view class="staff-detail pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view class="title">人员详情</view>
      <view class="sub">{{ place?.name || '重点场所' }}</view>
    </view>

    <view v-if="!staff" class="card empty">未找到人员信息</view>
    <view v-else class="card">
      <view class="row"><text>姓名</text><text>{{ staff.name }}</text></view>
      <view class="row"><text>人员类型</text><text>{{ staff.staffType || '其他' }}</text></view>
      <view class="row"><text>状态</text><text>{{ staff.status || '在岗' }}</text></view>
      <view class="row">
        <text>电话</text>
        <text class="link" @click="callPhone(staff.phone)">{{ staff.phone || '--' }}</text>
      </view>
      <view class="row"><text>证件后四位</text><text>{{ staff.idNoMasked || '--' }}</text></view>
      <view class="row photos">
        <text>身份证照片</text>
        <view class="photoRow">
          <image v-for="(img, idx) in (staff.idCardPhotos || [])" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
          <text v-if="!(staff.idCardPhotos || []).length">—</text>
        </view>
      </view>
      <view class="row photos">
        <text>人像照片</text>
        <view class="photoRow">
          <image v-for="(img, idx) in (staff.portraitPhotos || [])" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
          <text v-if="!(staff.portraitPhotos || []).length">—</text>
        </view>
      </view>
      <view class="row"><text>备注</text><text>{{ staff.remark || '--' }}</text></view>
    </view>

    <view class="footer">
      <button class="ghost" @click="confirmDelete">删除人员</button>
      <button type="primary" class="primary" @click="edit">编辑</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, savePlaceProfiles } from '@/common/database.js';

const placeId = ref('');
const staffId = ref('');
const place = ref(null);
const staff = ref(null);

function load() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  const profile = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  staff.value = profile?.primary?.staffMembers?.find((m) => m.id === staffId.value) || null;
}

function callPhone(phone) {
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone });
}

function edit() {
  if (!staff.value) return;
  uni.navigateTo({ url: `/pages/place/staff/edit?placeId=${placeId.value}&mode=edit&staffId=${staff.value.id}` });
}

function confirmDelete() {
  if (!staff.value) return;
  uni.showModal({
    title: '删除人员',
    content: '确认删除该人员信息？',
    success: (res) => {
      if (!res.confirm) return;
      const list = getPlaceProfiles();
      const profile = list.find((p) => p.placeId === placeId.value);
      if (!profile?.primary?.staffMembers) return;
      profile.primary.staffMembers = profile.primary.staffMembers.filter((m) => m.id !== staff.value.id);
      savePlaceProfiles(list);
      uni.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 400);
    },
  });
}

onLoad((query) => {
  placeId.value = query.placeId || '';
  staffId.value = query.staffId || '';
  load();
});
onShow(load);
</script>

<style lang="scss" scoped>
.staff-detail {
  min-height: 100vh;
  padding: 0 24rpx 120rpx;
}
.header {
  padding: 10rpx 0 14rpx;
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
  background: #fff;
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
  font-size: 26rpx;
  color: #1f2b3a;
}
.row.photos {
  align-items: flex-start;
}
.link {
  color: #0f75ff;
}
.photoRow {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}
.photoThumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  background: #e9edf2;
}
.empty {
  text-align: center;
  color: #97a1ad;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 20rpx;
  padding: 0 24rpx;
  display: flex;
  gap: 12rpx;
}
.ghost {
  flex: 1;
  background: #fff;
  border: 1px solid #d0d6de;
  color: #1f2b3a;
  border-radius: 12rpx;
}
.primary {
  flex: 1;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
}
</style>
