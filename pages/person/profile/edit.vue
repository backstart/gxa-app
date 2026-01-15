<template>
  <view class="pageBg form-page">
    <view class="statuBar"></view>

    <view class="card">
      <view class="section-title">档案信息</view>
      <view class="formRow">
        <text class="formLabel">性别</text>
        <picker :range="genderOptions" @change="(e)=> form.gender = genderOptions[e.detail.value]">
          <view class="formInput">{{ form.gender }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">出生日期</text>
        <picker mode="date" @change="(e)=> form.birthday = e.detail.value">
          <view class="formInput">{{ form.birthday }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">身份证号</text>
        <input class="formInput" v-model="form.idNoFull" placeholder="可选" />
      </view>
      <view class="formRow">
        <text class="formLabel">户籍地</text>
        <input class="formInput" v-model="form.domicile" placeholder="可选" />
      </view>
      <view class="formRow">
        <text class="formLabel">职业</text>
        <input class="formInput" v-model="form.job" placeholder="可选" />
      </view>
      <view class="formRow">
        <text class="formLabel">联系电话</text>
        <input class="formInput" v-model="form.phoneFull" placeholder="可选" />
      </view>
      <view class="formRow">
        <text class="formLabel">风险因素</text>
        <view class="chips">
          <view
            v-for="item in riskFactorOptions"
            :key="item"
            :class="['chip', form.riskFactors.includes(item) ? 'active' : '']"
            @click="toggleRiskFactor(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>
      <view class="formRow">
        <text class="formLabel">身份证照片</text>
        <view class="photoRow">
          <button size="mini" class="ghost-btn" @click="addIdPhoto('front')">正面示例</button>
          <button size="mini" class="ghost-btn" @click="addIdPhoto('back')">反面示例</button>
        </view>
        <view class="photoRow">
          <image v-for="(img, idx) in form.idCardPhotos" :key="idx" class="photo-thumb" :src="img" mode="aspectFill"></image>
        </view>
      </view>
      <view class="formRow">
        <text class="formLabel">人像照片</text>
        <view class="photoRow">
          <button size="mini" class="ghost-btn" @click="addPortraitPhoto">添加示例</button>
        </view>
        <view class="photoRow">
          <image v-for="(img, idx) in form.portraitPhotos" :key="idx" class="photo-thumb" :src="img" mode="aspectFill"></image>
        </view>
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
import { getKeyPersonProfiles, saveKeyPersonProfiles, getKeyPersons, saveKeyPersons } from '@/common/database.js';

const personId = ref('');
const genderOptions = ['男', '女', '未知'];
const riskFactorOptions = ['涉毒复吸史', '情绪不稳', '涉稳', '酗酒', '涉赌', '精神障碍'];

const form = reactive({
  gender: '未知',
  birthday: '',
  idNoFull: '',
  domicile: '',
  job: '',
  phoneFull: '',
  riskFactors: [],
  idCardPhotos: [],
  portraitPhotos: [],
});

function load() {
  const profile = (getKeyPersonProfiles() || []).find((p) => p.personId === personId.value);
  if (profile) {
    form.gender = profile.basic?.gender || '未知';
    form.birthday = profile.basic?.birthday || '';
    form.idNoFull = profile.basic?.idNoFull || '';
    form.domicile = profile.basic?.domicile || '';
    form.job = profile.basic?.job || '';
    form.phoneFull = profile.basic?.phoneFull || '';
    form.riskFactors = profile.riskFactors ? [...profile.riskFactors] : [];
    form.idCardPhotos = profile.idCardPhotos ? [...profile.idCardPhotos] : [];
    form.portraitPhotos = profile.portraitPhotos ? [...profile.portraitPhotos] : [];
  }
}

function toggleRiskFactor(item) {
  if (form.riskFactors.includes(item)) {
    form.riskFactors = form.riskFactors.filter((t) => t !== item);
  } else {
    form.riskFactors.push(item);
  }
}

function addIdPhoto(type) {
  if (type === 'front') {
    form.idCardPhotos = ['/static/mock/id_front.png', form.idCardPhotos[1]].filter(Boolean);
  } else {
    form.idCardPhotos = [form.idCardPhotos[0], '/static/mock/id_back.png'].filter(Boolean);
  }
}

function addPortraitPhoto() {
  form.portraitPhotos = [...form.portraitPhotos, '/static/mock/portrait.png'];
}

function save() {
  const profileList = getKeyPersonProfiles();
  const payload = {
    personId: personId.value,
    basic: {
      gender: form.gender,
      birthday: form.birthday,
      domicile: form.domicile,
      job: form.job,
      idNoMasked: maskId(form.idNoFull),
      idNoFull: form.idNoFull,
      phoneMasked: maskPhone(form.phoneFull),
      phoneFull: form.phoneFull,
    },
    riskFactors: [...form.riskFactors],
    idCardPhotos: [...form.idCardPhotos],
    portraitPhotos: [...form.portraitPhotos],
    updatedAt: Date.now(),
  };
  const idx = profileList.findIndex((p) => p.personId === personId.value);
  if (idx >= 0) profileList[idx] = payload;
  else profileList.unshift(payload);
  saveKeyPersonProfiles(profileList);
  syncPersonTags();
  uni.showToast({ title: '已保存', icon: 'success' });
  uni.navigateBack();
}

function syncPersonTags() {
  const persons = getKeyPersons();
  const idx = persons.findIndex((p) => p.personId === personId.value);
  if (idx < 0) return;
  const updated = {
    ...persons[idx],
    idNoMasked: maskId(form.idNoFull),
    phoneMasked: maskPhone(form.phoneFull),
    tags: form.riskFactors.slice(0, 4),
  };
  persons[idx] = updated;
  saveKeyPersons(persons);
}

function maskId(idNo) {
  if (!idNo) return '';
  const clean = String(idNo);
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)}********${clean.slice(-4)}`;
}

function maskPhone(phone) {
  if (!phone) return '';
  const clean = String(phone);
  if (clean.length < 7) return clean;
  return `${clean.slice(0, 3)}****${clean.slice(-4)}`;
}

onLoad((query) => {
  personId.value = query.personId || '';
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
.photoRow {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6e7a89;
}
.photo-thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  background: #e9edf2;
}
.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
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
