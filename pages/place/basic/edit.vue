<template>
  <view class="basic-edit pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view class="title">编辑基础信息</view>
      <view class="sub">{{ place?.name || '重点场所' }}</view>
    </view>

    <view class="card" v-if="type === 'KTV'">
      <view class="formRow">
        <text class="formLabel">营业时间</text>
        <input class="formInput" v-model="form.businessHours" placeholder="如 18:00-02:00" />
      </view>
      <view class="formRow">
        <text class="formLabel">包厢数</text>
        <input class="formInput" v-model="form.boxCount" type="number" />
      </view>
      <view class="formRow">
        <text class="formLabel">安保人数</text>
        <input class="formInput" v-model="form.securityCount" type="number" />
      </view>
      <view class="formRow">
        <text class="formLabel">风险标签</text>
        <view class="chips">
          <view
            v-for="item in riskOptions"
            :key="item"
            :class="['chip', form.riskFlags.includes(item) ? 'active' : '']"
            @click="toggleRisk(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>
    </view>

    <view class="card" v-else-if="type === 'RENTAL'">
      <view class="formRow">
        <text class="formLabel">房东姓名</text>
        <input class="formInput" v-model="form.landlordName" placeholder="可选" />
      </view>
      <view class="formRow">
        <text class="formLabel">房东电话</text>
        <input class="formInput" v-model="form.landlordPhone" placeholder="可选" />
      </view>
      <view class="formRow">
        <text class="formLabel">备案状态</text>
        <picker :range="recordStatusOptions" @change="(e)=> form.recordStatus = recordStatusOptions[e.detail.value]">
          <view class="formInput">{{ form.recordStatus || '请选择' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">楼栋</text>
        <input class="formInput" v-model="form.building" placeholder="如 3栋" />
      </view>
      <view class="formRow">
        <text class="formLabel">单元</text>
        <input class="formInput" v-model="form.unit" placeholder="如 2单元" />
      </view>
      <view class="formRow">
        <text class="formLabel">楼层</text>
        <input class="formInput" v-model="form.floor" placeholder="如 5层" />
      </view>
      <view class="formRow">
        <text class="formLabel">房间数</text>
        <input class="formInput" v-model="form.roomsCount" type="number" />
      </view>
    </view>

    <view class="card" v-else-if="type === 'NETBAR'">
      <view class="formRow">
        <text class="formLabel">机位数</text>
        <input class="formInput" v-model="form.seatCount" type="number" />
      </view>
      <view class="formRow">
        <text class="formLabel">实名系统</text>
        <picker :range="realNameOptions" @change="(e)=> form.realNameSystem = realNameOptions[e.detail.value]">
          <view class="formInput">{{ form.realNameSystem || '请选择' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">未成年人管控</text>
        <picker :range="minorOptions" @change="(e)=> form.minorControl = minorOptions[e.detail.value]">
          <view class="formInput">{{ form.minorControl || '请选择' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">营业时间</text>
        <input class="formInput" v-model="form.businessHours" placeholder="如 全天" />
      </view>
      <view class="formRow switchRow">
        <text class="formLabel">视频监控</text>
        <switch :checked="form.hasCCTV" @change="(e)=> form.hasCCTV = e.detail.value" />
      </view>
    </view>

    <view class="card" v-else-if="type === 'FOOTBATH'">
      <view class="formRow">
        <text class="formLabel">包间数</text>
        <input class="formInput" v-model="form.roomCount" type="number" />
      </view>
      <view class="formRow">
        <text class="formLabel">从业人数</text>
        <input class="formInput" v-model="form.staffCount" type="number" />
      </view>
      <view class="formRow switchRow">
        <text class="formLabel">涉黄风险</text>
        <switch :checked="form.riskPornFlag" @change="(e)=> form.riskPornFlag = e.detail.value" />
      </view>
      <view class="formRow">
        <text class="formLabel">营业时间</text>
        <input class="formInput" v-model="form.businessHours" placeholder="如 10:00-02:00" />
      </view>
      <view class="formRow switchRow">
        <text class="formLabel">视频监控</text>
        <switch :checked="form.hasCCTV" @change="(e)=> form.hasCCTV = e.detail.value" />
      </view>
    </view>

    <view class="card" v-else-if="type === 'CHESS_CARD'">
      <view class="formRow">
        <text class="formLabel">麻将台数</text>
        <input class="formInput" v-model="form.mahjongTableCount" type="number" />
      </view>
      <view class="formRow">
        <text class="formLabel">棋牌包间</text>
        <input class="formInput" v-model="form.chessRoomCount" type="number" />
      </view>
      <view class="formRow switchRow">
        <text class="formLabel">涉赌风险</text>
        <switch :checked="form.riskGambleFlag" @change="(e)=> form.riskGambleFlag = e.detail.value" />
      </view>
      <view class="formRow">
        <text class="formLabel">营业时间</text>
        <input class="formInput" v-model="form.businessHours" placeholder="如 12:00-02:00" />
      </view>
    </view>

    <view class="footer">
      <button type="primary" class="primary" @click="save">保存</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, savePlaceProfiles } from '@/common/database.js';

const placeId = ref('');
const place = ref(null);
const profile = ref(null);
const type = ref('KTV');

const riskOptions = ['涉黄', '涉赌', '未成年人'];
const recordStatusOptions = ['已备案', '未备案'];
const realNameOptions = ['正常', '异常', '未知'];
const minorOptions = ['有', '无', '未知'];

const form = reactive({
  businessHours: '',
  boxCount: '',
  securityCount: '',
  riskFlags: [],
  landlordName: '',
  landlordPhone: '',
  recordStatus: '',
  building: '',
  unit: '',
  floor: '',
  roomsCount: '',
  seatCount: '',
  realNameSystem: '',
  minorControl: '',
  hasCCTV: false,
  roomCount: '',
  staffCount: '',
  riskPornFlag: false,
  mahjongTableCount: '',
  chessRoomCount: '',
  riskGambleFlag: false,
});

function toggleRisk(item) {
  const idx = form.riskFlags.indexOf(item);
  if (idx >= 0) form.riskFlags.splice(idx, 1);
  else form.riskFlags.push(item);
}

function load() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  type.value = place.value?.primaryType || 'KTV';
  const p = profile.value?.primary || {};
  form.businessHours = p.businessHours || '';
  form.boxCount = p.boxCount ?? p.roomCount ?? '';
  form.securityCount = p.securityCount ?? '';
  form.riskFlags = p.riskFlags ? [...p.riskFlags] : [];
  form.landlordName = p.landlordName || p.landlord || '';
  form.landlordPhone = p.landlordPhone || '';
  form.recordStatus = p.recordStatus || '';
  form.building = p.building || '';
  form.unit = p.unit || '';
  form.floor = p.floor || '';
  form.roomsCount = p.roomsCount ?? (p.rooms ? p.rooms.length : '') ?? '';
  form.seatCount = p.seatCount ?? '';
  form.realNameSystem = p.realNameSystem || '';
  form.minorControl = p.minorControl || '';
  form.hasCCTV = !!p.hasCCTV;
  form.roomCount = p.roomCount ?? '';
  form.staffCount = p.staffCount ?? '';
  form.riskPornFlag = !!p.riskPornFlag;
  form.mahjongTableCount = p.mahjongTableCount ?? '';
  form.chessRoomCount = p.chessRoomCount ?? '';
  form.riskGambleFlag = !!p.riskGambleFlag;
}

function save() {
  const list = getPlaceProfiles();
  const current = profile.value || {
    placeId: placeId.value,
    primaryType: type.value,
    primary: {},
    modules: {},
  };
  current.primary = current.primary || {};
  if (type.value === 'KTV') {
    current.primary.businessHours = form.businessHours;
    current.primary.boxCount = Number(form.boxCount || 0);
    current.primary.securityCount = Number(form.securityCount || 0);
    current.primary.riskFlags = [...form.riskFlags];
  }
  if (type.value === 'RENTAL') {
    current.primary.landlordName = form.landlordName;
    current.primary.landlordPhone = form.landlordPhone;
    current.primary.recordStatus = form.recordStatus;
    current.primary.building = form.building;
    current.primary.unit = form.unit;
    current.primary.floor = form.floor;
    current.primary.roomsCount = Number(form.roomsCount || 0);
  }
  if (type.value === 'NETBAR') {
    current.primary.seatCount = Number(form.seatCount || 0);
    current.primary.realNameSystem = form.realNameSystem;
    current.primary.minorControl = form.minorControl;
    current.primary.businessHours = form.businessHours;
    current.primary.hasCCTV = form.hasCCTV;
  }
  if (type.value === 'FOOTBATH') {
    current.primary.roomCount = Number(form.roomCount || 0);
    current.primary.staffCount = Number(form.staffCount || 0);
    current.primary.riskPornFlag = form.riskPornFlag;
    current.primary.businessHours = form.businessHours;
    current.primary.hasCCTV = form.hasCCTV;
  }
  if (type.value === 'CHESS_CARD') {
    current.primary.mahjongTableCount = Number(form.mahjongTableCount || 0);
    current.primary.chessRoomCount = Number(form.chessRoomCount || 0);
    current.primary.riskGambleFlag = form.riskGambleFlag;
    current.primary.businessHours = form.businessHours;
  }
  const idx = list.findIndex((p) => p.placeId === placeId.value);
  if (idx >= 0) list[idx] = current;
  else list.unshift(current);
  savePlaceProfiles(list);
  uni.showToast({ title: '已保存', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 400);
}

onLoad((query) => {
  placeId.value = query.placeId || '';
  load();
});
</script>

<style lang="scss" scoped>
.basic-edit {
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
  margin-bottom: 14rpx;
}
.formRow {
  margin-bottom: 14rpx;
}
.formLabel {
  display: block;
  font-size: 24rpx;
  color: #6b7785;
  margin-bottom: 6rpx;
}
.formInput {
  width: 100%;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 12rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}
.switchRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.chip {
  padding: 8rpx 14rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  font-size: 24rpx;
}
.chip.active {
  background: #0f75ff;
  color: #fff;
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
