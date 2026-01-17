<template>
  <AppPage>
    <view class="pageBg detail-page">
      <AppHeaderCard
        :title="maskName(person?.name)"
        :subTitle="person?.personType || '重点人员'"
        :infoRows="headerInfoRows"
        :tags="[]"
      />

    <view class="card sectionCard">
      <view class="section-title">回访详情</view>
      <view class="info-row"><text class="label">回访类型</text><text class="value">{{ visit?.visitType || '-' }}</text></view>
      <view class="info-row"><text class="label">回访时间</text><text class="value">{{ visit?.visitAt || '-' }}</text></view>
      <view class="info-row"><text class="label">民警</text><text class="value">{{ visit?.officerName || '-' }}</text></view>
      <view class="info-row"><text class="label">下次回访</text><text class="value">{{ visit?.nextVisitDue || '-' }}</text></view>
      <view class="info-block">
        <text class="label">内容</text>
        <view class="value block">{{ visit?.content || '-' }}</view>
      </view>
      <view class="info-row">
        <text class="label">风险变化</text>
        <text class="value">{{ visit?.riskChanged ? (visit?.riskLevel || '是') : '否' }}</text>
      </view>
      <view class="info-block">
        <text class="label">附件</text>
        <view class="attachments">
          <image v-for="(img, idx) in visit?.attachments || []" :key="idx" class="thumb" :src="img" mode="aspectFill"></image>
          <text v-if="!(visit?.attachments || []).length">--</text>
        </view>
      </view>
    </view>

      <AppBottomBar label="编辑回访" @click="goEdit" />
    </view>
  </AppPage>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getKeyPersonById, getKeyPersonVisits } from '@/common/database.js';
import AppPage from '@/components/app/AppPage.vue';
import AppHeaderCard from '@/components/app/AppHeaderCard.vue';
import AppBottomBar from '@/components/app/AppBottomBar.vue';

const personId = ref('');
const visitId = ref('');
const person = ref(null);
const visit = ref(null);

function load() {
  person.value = getKeyPersonById(personId.value) || null;
  visit.value = getKeyPersonVisits().find((v) => v.id === visitId.value) || null;
}

function goEdit() {
  uni.navigateTo({ url: `/pages/person/visit/edit?personId=${personId.value}&visitId=${visitId.value}&mode=edit` });
}

function maskName(name) {
  if (!name) return '-';
  return `${name.charAt(0)}*`;
}

function maskPhone(phone) {
  if (!phone) return '-';
  return `${String(phone).slice(0, 3)}****${String(phone).slice(-4)}`;
}

const headerInfoRows = computed(() => ([
  { label: '风险', value: person.value?.riskLevel || '-' },
  { label: '责任民警', value: person.value?.officerName || '-' },
  { label: '电话', value: maskPhone(person.value?.phone) },
]));

onLoad((query) => {
  personId.value = query.personId || '';
  visitId.value = query.visitId || '';
  load();
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.detail-page {
  padding: 0 24rpx 140rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
}
.sectionCard {
  background: #f6f8fb;
}
.section-title {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  margin-top: 8rpx;
}
.info-block {
  margin-top: 10rpx;
  font-size: 24rpx;
}
.label {
  color: #6e7a89;
}
.value {
  color: #1f2b3a;
}
.value.block {
  margin-top: 6rpx;
  color: #4f5a68;
}
.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 6rpx;
  color: #6e7a89;
}
.thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  background: #e9edf2;
}
</style>
