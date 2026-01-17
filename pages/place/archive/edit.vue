<template>
  <AppPage>
    <view class="archive-edit pageBg">
      <view class="header">
        <view class="title">{{ mode === 'edit' ? '编辑档案' : '新增档案' }}</view>
        <view class="sub">{{ place?.name || '重点场所' }}</view>
      </view>

      <view class="card">
        <view class="formRow">
          <text class="formLabel">档案类型</text>
          <picker :range="docTypeOptions" @change="(e)=> form.docType = docTypeOptions[e.detail.value]">
            <view class="formInput">{{ form.docType || '请选择' }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">编号</text>
          <input class="formInput" v-model="form.docNo" placeholder="可选" />
        </view>
        <view class="formRow">
          <text class="formLabel">到期/检查日期</text>
          <picker mode="date" @change="(e)=> form.dueDate = e.detail.value">
            <view class="formInput">{{ form.dueDate || '请选择' }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">备注</text>
          <textarea class="formInput textarea" v-model="form.note" placeholder="可选"></textarea>
        </view>
        <view class="formRow">
          <text class="formLabel">照片</text>
          <view class="photoRow">
            <image v-for="(img, idx) in form.photos" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
            <button size="mini" class="ghost" @click="addPhoto">添加示例</button>
          </view>
        </view>
      </view>

      <AppBottomBar label="保存" @click="save" />
    </view>
  </AppPage>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, savePlaceProfiles } from '@/common/database.js';
import AppPage from '@/components/app/AppPage.vue';
import AppBottomBar from '@/components/app/AppBottomBar.vue';

const placeId = ref('');
const archiveId = ref('');
const mode = ref('add');
const place = ref(null);
const profile = ref(null);

const docTypeOptions = ['营业执照', '特行许可', '其他'];

const form = reactive({
  docType: '',
  docNo: '',
  dueDate: '',
  note: '',
  photos: [],
});

function load() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  if (mode.value !== 'edit' || !archiveId.value) return;
  const archive = profile.value?.primary?.archives?.find((a) => a.id === archiveId.value);
  if (!archive) {
    mode.value = 'add';
    return;
  }
  form.docType = archive.docType || '';
  form.docNo = archive.docNo || '';
  form.dueDate = archive.dueDate || '';
  form.note = archive.note || '';
  form.photos = archive.photos ? [...archive.photos] : [];
}

function addPhoto() {
  form.photos = [...form.photos, '/static/logo.png'];
}

function applyArchiveToPrimary(primary, payload) {
  if (payload.docType === '营业执照') {
    primary.businessLicenseNo = payload.docNo;
    primary.businessLicenseDue = payload.dueDate;
  }
  if (payload.docType === '特行许可') {
    primary.specialLicenseNo = payload.docNo;
    primary.specialLicenseDue = payload.dueDate;
  }
}

function save() {
  if (!form.docType) {
    uni.showToast({ title: '请选择档案类型', icon: 'none' });
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
  current.primary.archives = current.primary.archives || [];
  const now = Date.now();
  const payload = {
    id: mode.value === 'edit' ? archiveId.value : `arch_${now}`,
    docType: form.docType,
    docNo: form.docNo,
    dueDate: form.dueDate,
    note: form.note,
    photos: [...form.photos],
    updatedAt: now,
    createdAt: now,
  };
  if (mode.value === 'edit') delete payload.createdAt;
  if (mode.value === 'edit') {
    const idx = current.primary.archives.findIndex((a) => a.id === archiveId.value);
    if (idx >= 0) {
      current.primary.archives[idx] = { ...current.primary.archives[idx], ...payload };
    } else {
      current.primary.archives.unshift(payload);
    }
  } else {
    current.primary.archives.unshift(payload);
  }
  applyArchiveToPrimary(current.primary, payload);
  const idx = list.findIndex((p) => p.placeId === placeId.value);
  if (idx >= 0) list[idx] = current;
  else list.unshift(current);
  savePlaceProfiles(list);
  uni.showToast({ title: '已保存', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 400);
}

onLoad((query) => {
  placeId.value = query.placeId || '';
  archiveId.value = query.archiveId || '';
  mode.value = query.mode || 'add';
  load();
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.archive-edit {
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
</style>

