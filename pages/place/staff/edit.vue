<template>
  <view class="staff-edit pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view class="title">{{ mode === 'edit' ? '编辑人员' : '新增人员' }}</view>
      <view class="sub">{{ place?.name || '重点场所' }}</view>
    </view>

    <view class="card">
      <view class="formRow">
        <text class="formLabel">姓名</text>
        <input class="formInput" v-model="form.name" placeholder="必填" />
      </view>
      <view class="formRow">
        <text class="formLabel">人员类型</text>
        <picker :range="staffTypeOptions" @change="(e)=> form.staffType = staffTypeOptions[e.detail.value]">
          <view class="formInput">{{ form.staffType || '请选择' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">状态</text>
        <picker :range="statusOptions" @change="(e)=> form.status = statusOptions[e.detail.value]">
          <view class="formInput">{{ form.status || '请选择' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">联系电话</text>
        <input class="formInput" v-model="form.phone" placeholder="可选" />
      </view>
      <view class="formRow">
        <text class="formLabel">身份证号</text>
        <input class="formInput" v-model="form.idNoFull" placeholder="可选，仅存后四位" />
      </view>
      <view class="formRow">
        <text class="formLabel">身份证照片</text>
        <view class="photoRow">
          <image v-for="(img, idx) in form.idCardPhotos" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
          <button size="mini" class="ghost" @click="addIdPhoto('front')">正面示例</button>
          <button size="mini" class="ghost" @click="addIdPhoto('back')">反面示例</button>
        </view>
      </view>
      <view class="formRow">
        <text class="formLabel">人像照片</text>
        <view class="photoRow">
          <image v-for="(img, idx) in form.portraitPhotos" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
          <button size="mini" class="ghost" @click="addPortrait">添加示例</button>
        </view>
      </view>
      <view class="formRow">
        <text class="formLabel">备注</text>
        <textarea class="formInput textarea" v-model="form.remark" placeholder="可选"></textarea>
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
const staffId = ref('');
const mode = ref('add');
const place = ref(null);
const profile = ref(null);

const staffTypeOptions = ['保安', '前台', '服务员', '经理', '收银', '保洁', '其他'];
const statusOptions = ['在岗', '离职', '请假', '临时'];

const form = reactive({
  name: '',
  staffType: '保安',
  status: '在岗',
  phone: '',
  idNoFull: '',
  idNoMasked: '',
  idCardPhotos: [],
  portraitPhotos: [],
  remark: '',
});

function maskIdNo(idNo) {
  if (!idNo) return '';
  const clean = idNo.trim();
  if (clean.length <= 4) return `****${clean}`;
  return `${clean.slice(0, 4)}********${clean.slice(-4)}`;
}

function load() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  if (mode.value !== 'edit' || !staffId.value) return;
  const member = profile.value?.primary?.staffMembers?.find((m) => m.id === staffId.value);
  if (!member) {
    mode.value = 'add';
    return;
  }
  form.name = member.name || '';
  form.staffType = member.staffType || '保安';
  form.status = member.status || '在岗';
  form.phone = member.phone || '';
  form.idNoMasked = member.idNoMasked || '';
  form.idCardPhotos = member.idCardPhotos ? [...member.idCardPhotos] : [];
  form.portraitPhotos = member.portraitPhotos ? [...member.portraitPhotos] : [];
  form.remark = member.remark || '';
}

function addIdPhoto(type) {
  if (type === 'front') {
    const next = ['/static/mock/id_front.png', form.idCardPhotos[1]].filter(Boolean);
    form.idCardPhotos = next;
  } else {
    const next = [form.idCardPhotos[0], '/static/mock/id_back.png'].filter(Boolean);
    form.idCardPhotos = next;
  }
}

function addPortrait() {
  form.portraitPhotos = [...form.portraitPhotos, '/static/mock/portrait.png'];
}

function save() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请填写姓名', icon: 'none' });
    return;
  }
  if (form.phone && !/^\d+$/.test(form.phone)) {
    uni.showToast({ title: '电话需为数字', icon: 'none' });
    return;
  }
  const list = getPlaceProfiles();
  const current = profile.value || {
    placeId: placeId.value,
    primaryType: place.value?.primaryType || 'KTV',
    primary: {},
    modules: {},
  };
  current.primary = current.primary || {};
  current.primary.staffMembers = current.primary.staffMembers || [];
  const now = Date.now();
  const payload = {
    id: mode.value === 'edit' ? staffId.value : `staff_${now}`,
    name: form.name,
    staffType: form.staffType,
    status: form.status,
    phone: form.phone,
    idNoMasked: form.idNoFull ? maskIdNo(form.idNoFull) : form.idNoMasked,
    idCardPhotos: [...form.idCardPhotos],
    portraitPhotos: [...form.portraitPhotos],
    remark: form.remark,
    createdAt: now,
    updatedAt: now,
  };
  if (mode.value === 'edit') delete payload.createdAt;
  if (mode.value === 'edit') {
    const idx = current.primary.staffMembers.findIndex((m) => m.id === staffId.value);
    if (idx >= 0) {
      current.primary.staffMembers[idx] = { ...current.primary.staffMembers[idx], ...payload };
    } else {
      current.primary.staffMembers.unshift(payload);
    }
  } else {
    current.primary.staffMembers.unshift(payload);
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
  staffId.value = query.staffId || '';
  mode.value = query.mode || 'add';
  load();
});
</script>

<style lang="scss" scoped>
.staff-edit {
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
.textarea {
  min-height: 120rpx;
}
.photoRow {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
  align-items: center;
}
.photoThumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  background: #e9edf2;
}
.ghost {
  background: #fff;
  border: 1px solid #d0d6de;
  color: #1f2b3a;
  border-radius: 12rpx;
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
