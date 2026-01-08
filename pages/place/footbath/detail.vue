<template>
  <view class="place-detail pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">足浴详情</view>
        <view class="sub">{{ place?.name || '' }}</view>
      </view>
    </view>

    <view class="card" v-if="place">
      <view class="section-head">
        <text class="section-title">场所概览</text>
      </view>
      <view class="row"><text class="label">地址</text><text class="value">{{ place.address }}</text></view>
      <view class="row"><text class="label">类型</text><text class="value">足浴</text></view>
      <view class="row"><text class="label">风险</text><text class="value">{{ place.riskLevel }}</text></view>
      <view class="row"><text class="label">下次走访</text><text class="value">{{ place.nextVisitDue }}</text></view>
      <view class="chips">
        <text class="chip" v-for="m in place.modules" :key="m">{{ moduleLabel(m) }}</text>
      </view>
    </view>

    <view class="card" v-if="profile">
      <view class="section-head">
        <text class="section-title">足浴信息</text>
      </view>
      <view class="row"><text class="label">包间数</text><text class="value">{{ profile.primary.roomCount }}</text></view>
      <view class="row"><text class="label">从业人数</text><text class="value">{{ profile.primary.staffCount }}</text></view>
      <view class="row"><text class="label">营业时间</text><text class="value">{{ profile.primary.businessHours }}</text></view>
      <view class="row"><text class="label">涉黄风险</text><text class="value">{{ profile.primary.riskPornFlag ? '是' : '否' }}</text></view>
      <view class="row">
        <text class="label">证照到期</text>
        <text :class="['value', dueClass(profile.primary.licenseDue)]">{{ profile.primary.licenseDue }}</text>
      </view>
    </view>

    <view class="card" v-if="place?.modules?.length">
      <view class="section-head">
        <text class="section-title">模块信息</text>
      </view>
      <view class="module-card" v-for="m in place.modules" :key="m" @click="goModule(m)">
        <view class="module-title">{{ moduleLabel(m) }}</view>
        <view class="module-sub">{{ moduleSummary(m) }}</view>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">走访记录</text>
        <text class="section-sub">{{ visits.length }} 条</text>
      </view>
      <view v-if="visits.length === 0" class="empty">暂无走访记录</view>
      <view v-for="item in visits" :key="item.visitId" class="visit-item">
        <view class="visit-time">{{ item.visitAt }}</view>
        <view class="visit-content">{{ item.content }}</view>
      </view>
    </view>

    <view class="card actions">
      <button size="mini" class="ghost-btn" @click="goVisit">新增走访</button>
      <button size="mini" class="ghost-btn" @click="goDispatch">一键派单</button>
      <button size="mini" class="ghost-btn" @click="callOwner">拨号</button>
      <button size="mini" class="ghost-btn" @click="copyAddress">复制地址</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, getPlaceVisits, updateProfile } from '@/common/database.js';

const placeId = ref('');
const place = ref(null);
const profile = ref(null);
const visits = ref([]);

function loadData() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  visits.value = getPlaceVisits()
    .filter((v) => v.placeId === placeId.value)
    .sort((a, b) => (a.visitAt < b.visitAt ? 1 : -1));
}

function moduleLabel(type) {
  const map = { BILLIARD: '台球', CHESS_CARD: '棋牌', NETBAR: '网吧', FOOTBATH: '足浴' };
  return map[type] || type;
}

function moduleSummary(type) {
  const data = profile.value?.modules?.[type];
  if (!data) return '点击完善模块信息';
  if (type === 'CHESS_CARD') return `麻将台 ${data.mahjongTableCount || 0}`;
  return '查看模块详情';
}

function diffDays(dateStr) {
  const now = new Date();
  const target = new Date(`${dateStr} 00:00:00`);
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function dueClass(dateStr) {
  if (!dateStr) return '';
  const days = diffDays(dateStr);
  if (days <= 7) return 'danger';
  if (days <= 30) return 'warn';
  return '';
}

function ensureModule(type) {
  const modules = profile.value?.modules || {};
  if (modules[type]) return;
  const defaults = {
    CHESS_CARD: { mahjongTableCount: 0, chessRoomCount: 0, riskGambleFlag: false, businessHours: '', notes: '' },
    NETBAR: { seatCount: 0, realNameSystem: '未知', minorControl: '未知', peakHours: '', hasCCTV: false },
    BILLIARD: { tableCount: 0, businessHours: '', hasCCTV: false, notes: '' },
    FOOTBATH: { roomCount: 0, staffCount: 0, riskPornFlag: false, businessHours: '', licenseDue: '' },
  };
  updateProfile(placeId.value, { modules: { [type]: defaults[type] || {} } });
}

function goModule(type) {
  ensureModule(type);
  const map = {
    BILLIARD: '/pages/place/modules/billiard',
    CHESS_CARD: '/pages/place/modules/chessCard',
    NETBAR: '/pages/place/modules/netbar',
    FOOTBATH: '/pages/place/modules/footbath',
  };
  const base = map[type];
  if (!base) return;
  uni.navigateTo({ url: `${base}?placeId=${placeId.value}` });
}

function goVisit() {
  uni.navigateTo({ url: `/pages/place/visit/add?placeId=${placeId.value}` });
}

function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}` });
}

function callOwner() {
  if (!place.value?.ownerPhone) {
    uni.showToast({ title: '暂无电话', icon: 'none' });
    return;
  }
  uni.makePhoneCall({ phoneNumber: place.value.ownerPhone });
}

function copyAddress() {
  if (!place.value?.address) return;
  uni.setClipboardData({ data: place.value.address });
}

onLoad((query) => {
  placeId.value = query.placeId || '';
});
onShow(loadData);
</script>

<style lang="scss" scoped>
.place-detail {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
  .section-title {
    font-size: 32rpx;
    font-weight: 700;
  }
  .section-sub {
    font-size: 24rpx;
    color: #6e7a89;
  }
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
  .label {
    color: #6b7785;
    font-size: 26rpx;
  }
  .value {
    color: #1f2b3a;
    font-size: 26rpx;
  }
  .value.warn {
    color: #c88719;
  }
  .value.danger {
    color: #d64545;
  }
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 8rpx;
}
.chip {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  background: #f4f6f8;
  color: #344150;
}
.module-card {
  padding: 14rpx;
  border-radius: 12rpx;
  background: #f6f8fb;
  margin-bottom: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}
.module-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2b3a;
}
.module-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6e7a89;
}
.visit-item {
  padding: 10rpx 0;
  border-bottom: 1px solid #f1f3f5;
}
.visit-item:last-child {
  border-bottom: none;
}
.visit-time {
  font-size: 24rpx;
  color: #6e7a89;
}
.visit-content {
  margin-top: 4rpx;
  font-size: 26rpx;
  color: #1f2b3a;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 10rpx 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
}
</style>
