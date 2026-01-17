<template>
  <view class="basic-detail pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view class="title">基础信息</view>
      <view class="sub">{{ place?.name || '重点场所' }}</view>
    </view>

    <view class="card" v-if="rows.length">
      <view v-for="row in rows" :key="row.label" class="row">
        <text>{{ row.label }}</text>
        <text>{{ row.value }}</text>
      </view>
    </view>
    <view v-else class="card empty">暂无基础信息</view>

    <view class="footer">
      <button type="primary" class="primary" @click="edit">编辑基础信息</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles } from '@/common/database.js';

const placeId = ref('');
const place = ref(null);
const profile = ref(null);

function load() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
}

const rows = computed(() => {
  const p = profile.value?.primary || {};
  const type = place.value?.primaryType || 'KTV';
  const result = [];
  const pushRow = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    result.push({ label, value });
  };
  if (type === 'KTV') {
    pushRow('营业时间', p.businessHours);
    pushRow('包厢数', p.boxCount ?? p.roomCount);
    pushRow('安保人数', p.securityCount);
    if (p.riskFlags && p.riskFlags.length) pushRow('风险标签', p.riskFlags.join(' / '));
  }
  if (type === 'RENTAL') {
    pushRow('房东姓名', p.landlordName || p.landlord);
    pushRow('房东电话', p.landlordPhone);
    pushRow('备案状态', p.recordStatus);
    pushRow('楼栋', p.building);
    pushRow('单元', p.unit);
    pushRow('楼层', p.floor);
    pushRow('房间数', p.roomsCount ?? (p.rooms ? p.rooms.length : ''));
  }
  if (type === 'NETBAR') {
    pushRow('机位数', p.seatCount);
    pushRow('实名系统', p.realNameSystem);
    pushRow('未成年人管控', p.minorControl);
    pushRow('营业时间', p.businessHours);
    if (p.hasCCTV !== undefined) pushRow('视频监控', p.hasCCTV ? '是' : '否');
  }
  if (type === 'FOOTBATH') {
    pushRow('包间数', p.roomCount);
    pushRow('从业人数', p.staffCount);
    if (p.riskPornFlag !== undefined) pushRow('涉黄风险', p.riskPornFlag ? '是' : '否');
    pushRow('营业时间', p.businessHours);
    if (p.hasCCTV !== undefined) pushRow('视频监控', p.hasCCTV ? '是' : '否');
  }
  if (type === 'CHESS_CARD') {
    pushRow('麻将台数', p.mahjongTableCount);
    pushRow('棋牌包间', p.chessRoomCount);
    if (p.riskGambleFlag !== undefined) pushRow('涉赌风险', p.riskGambleFlag ? '是' : '否');
    pushRow('营业时间', p.businessHours);
  }
  return result;
});

function edit() {
  uni.navigateTo({ url: `/pages/place/basic/edit?placeId=${placeId.value}` });
}

onLoad((query) => {
  placeId.value = query.placeId || '';
  load();
});
onShow(load);
</script>

<style lang="scss" scoped>
.basic-detail {
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
}
.primary {
  width: 100%;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
}
</style>
