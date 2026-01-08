<template>
  <view class="place-visit pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">新增走访</view>
        <view class="sub">{{ place?.name || '场所走访记录' }}</view>
      </view>
    </view>

    <view class="card summary" v-if="place">
      <view class="row">
        <text class="label">地址</text>
        <text class="value">{{ place.address }}</text>
      </view>
      <view class="row">
        <text class="label">类型</text>
        <text class="value">{{ typeLabel(place.primaryType) }}</text>
      </view>
      <view class="row">
        <text class="label">风险</text>
        <text class="value">{{ place.riskLevel }}</text>
      </view>
      <view class="row">
        <text class="label">下次走访</text>
        <text class="value">{{ place.nextVisitDue }}</text>
      </view>
    </view>

    <view class="card">
      <view class="form-row">
        <text class="label">走访时间</text>
        <picker mode="datetime" @change="(e)=> visitAt = e.detail.value">
          <view class="picker">{{ visitAt }}</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="label">走访类型</text>
        <view class="chips">
          <view v-for="t in visitTypes" :key="t" :class="['chip', visitType === t ? 'active' : '']" @click="visitType = t">
            {{ t }}
          </view>
        </view>
      </view>
      <view class="form-row column">
        <text class="label">走访内容</text>
        <textarea class="textarea" v-model="content" placeholder="必填" />
      </view>
      <view class="form-row switch-row">
        <text class="label">发现问题</text>
        <switch :checked="issuesFound" @change="(e)=> issuesFound = e.detail.value" />
      </view>
      <view class="form-row column">
        <text class="label">问题类型</text>
        <view class="chips">
          <view v-for="i in issueOptions" :key="i" :class="['chip', issueTypes.includes(i) ? 'active' : '']" @click="toggleIssue(i)">
            {{ i }}
          </view>
        </view>
      </view>
      <view class="form-row column">
        <text class="label">整改情况</text>
        <textarea class="textarea" v-model="rectification" placeholder="可选" />
      </view>
      <view class="form-row switch-row">
        <text class="label">需要复访</text>
        <switch :checked="needRevisit" @change="(e)=> needRevisit = e.detail.value" />
      </view>
      <view class="form-row column">
        <text class="label">附件</text>
        <view class="attachments">
          <view v-for="(a, idx) in attachments" :key="idx" class="attach">{{ a }}</view>
        </view>
        <button size="mini" class="ghost-btn" @click="addAttachment">添加附件(模拟)</button>
      </view>
    </view>

    <view class="action-bar">
      <button type="primary" class="submit-btn" @click="submit">提交走访</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, savePlaces, getPlaceVisits, savePlaceVisits } from '@/common/database.js';

const placeId = ref('');
const place = ref(null);

const visitAt = ref(new Date().toISOString().slice(0, 16).replace('T', ' '));
const visitTypes = ['例行', '突击', '专项'];
const visitType = ref('例行');
const content = ref('');
const issuesFound = ref(false);
const issueOptions = ['治安隐患', '消防隐患', '证照问题', '涉黄涉赌', '未成年人', '其他'];
const issueTypes = ref([]);
const rectification = ref('');
const needRevisit = ref(false);
const attachments = ref([]);

function loadPlace() {
  const list = getPlaces();
  place.value = list.find((p) => p.placeId === placeId.value) || null;
}

function typeLabel(type) {
  const map = { KTV: 'KTV/夜场', RENTAL: '出租屋', NETBAR: '网吧', FOOTBATH: '足浴', CHESS_CARD: '棋牌/麻将' };
  return map[type] || type;
}

function toggleIssue(val) {
  if (issueTypes.value.includes(val)) issueTypes.value = issueTypes.value.filter((x) => x !== val);
  else issueTypes.value.push(val);
}

function addAttachment() {
  attachments.value.push(`附件${attachments.value.length + 1}.jpg`);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function submit() {
  if (!content.value.trim()) {
    uni.showToast({ title: '请填写走访内容', icon: 'none' });
    return;
  }
  const visits = getPlaceVisits();
  visits.unshift({
    visitId: `visit-${Date.now()}`,
    placeId: placeId.value,
    visitAt: visitAt.value,
    visitorName: '李警官',
    visitType: visitType.value,
    content: content.value,
    issuesFound: issuesFound.value,
    issueTypes: issueTypes.value,
    rectification: rectification.value,
    needRevisit: needRevisit.value,
    attachments: attachments.value,
  });
  savePlaceVisits(visits);

  const places = getPlaces().map((p) => {
    if (p.placeId !== placeId.value) return p;
    const next = addDays(visitAt.value, p.visitFreqDays || 7);
    return { ...p, lastVisitAt: visitAt.value.slice(0, 10), nextVisitDue: next };
  });
  savePlaces(places);

  uni.showToast({ title: '走访已保存', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 300);
}

onLoad((query) => {
  placeId.value = query.placeId || '';
});
onShow(loadPlace);
</script>

<style lang="scss" scoped>
.place-visit {
  min-height: 100vh;
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
}
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.form-row.column {
  flex-direction: column;
  align-items: flex-start;
}
.label {
  font-size: 26rpx;
  color: #344150;
  margin-right: 10rpx;
}
.picker {
  background: #f4f6f8;
  padding: 12rpx 14rpx;
  border-radius: 12rpx;
  min-width: 220rpx;
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
.textarea {
  width: 100%;
  min-height: 140rpx;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 14rpx;
  font-size: 26rpx;
}
.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 8rpx;
}
.attach {
  padding: 6rpx 10rpx;
  background: #eaf3ff;
  color: #0f75ff;
  border-radius: 10rpx;
  font-size: 22rpx;
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
  padding: 10rpx 20rpx 20rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
}
.submit-btn {
  width: 100%;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}
</style>
