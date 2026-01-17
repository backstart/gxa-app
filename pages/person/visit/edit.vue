<template>
  <view class="pageBg form-page">
    <view class="statuBar"></view>

    <view class="card">
      <view class="section-title">回访信息</view>
      <view class="formRow">
        <text class="formLabel">回访类型</text>
        <picker :range="visitTypeOptions" @change="(e)=> form.visitType = visitTypeOptions[e.detail.value]">
          <view class="formInput">{{ form.visitType }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">回访时间</text>
        <picker mode="datetime" @change="(e)=> form.visitAt = e.detail.value">
          <view class="formInput">{{ form.visitAt }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">内容</text>
        <textarea class="formInput" v-model="form.content" placeholder="必填"></textarea>
      </view>
      <view class="formRow">
        <text class="formLabel">民警</text>
        <input class="formInput" v-model="form.officerName" />
      </view>
      <view class="formRow">
        <text class="formLabel">下次回访</text>
        <picker mode="date" @change="(e)=> form.nextVisitDue = e.detail.value">
          <view class="formInput">{{ form.nextVisitDue || '自动计算' }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">风险变化</text>
        <switch :checked="form.riskChanged" @change="(e)=> form.riskChanged = e.detail.value"></switch>
      </view>
      <view class="formRow" v-if="form.riskChanged">
        <text class="formLabel">风险等级</text>
        <picker :range="riskOptions" @change="(e)=> form.riskLevel = riskOptions[e.detail.value]">
          <view class="formInput">{{ form.riskLevel }}</view>
        </picker>
      </view>
      <view class="formRow">
        <text class="formLabel">附件</text>
        <view class="photoRow">
          <button size="mini" class="ghost-btn" @click="addAttachment('image')">示例图片</button>
          <button size="mini" class="ghost-btn" @click="addAttachment('audio')">示例音频</button>
        </view>
        <view class="photoRow">
          <text v-for="(item, idx) in form.attachments" :key="idx">{{ item }}</text>
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
import { getKeyPersonVisits, saveKeyPersonVisits, getKeyPersons, saveKeyPersons, getKeyPersonById } from '@/common/database.js';

const personId = ref('');
const visitId = ref('');
const mode = ref('add');
const person = ref(null);

const visitTypeOptions = ['例行', '谈话', '突击', '专项'];
const riskOptions = ['高', '中', '低'];

const form = reactive({
  visitType: '例行',
  visitAt: '',
  content: '',
  officerName: '李警官',
  nextVisitDue: '',
  attachments: [],
  riskChanged: false,
  riskLevel: '中',
});

function load() {
  person.value = getKeyPersonById(personId.value) || null;
  if (mode.value === 'edit' && visitId.value) {
    const item = getKeyPersonVisits().find((v) => v.id === visitId.value);
    if (item) {
      form.visitType = item.visitType || '例行';
      form.visitAt = item.visitAt || '';
      form.content = item.content || '';
      form.officerName = item.officerName || '李警官';
      form.nextVisitDue = item.nextVisitDue || '';
      form.attachments = item.attachments ? [...item.attachments] : [];
      form.riskChanged = !!item.riskChanged;
      form.riskLevel = item.riskLevel || person.value?.riskLevel || '中';
    }
  } else {
    form.visitAt = formatDateTime(Date.now());
    form.riskLevel = person.value?.riskLevel || '中';
  }
}

function addAttachment(type) {
  if (type === 'image') form.attachments.push('/static/logo.png');
  else form.attachments.push('/static/logo.png');
}

function save() {
  if (!form.content.trim()) {
    uni.showToast({ title: '请填写回访内容', icon: 'none' });
    return;
  }
  const list = getKeyPersonVisits();
  const now = Date.now();
  const nextDue = form.nextVisitDue || calcNextVisitDue(form.visitAt);
  if (mode.value === 'add') {
    list.unshift({
      id: `visit_${Date.now()}`,
      personId: personId.value,
      visitType: form.visitType,
      visitAt: form.visitAt,
      content: form.content,
      officerName: form.officerName,
      nextVisitDue: nextDue,
      attachments: [...form.attachments],
      riskChanged: form.riskChanged,
      riskLevel: form.riskChanged ? form.riskLevel : '',
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const idx = list.findIndex((v) => v.id === visitId.value);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        visitType: form.visitType,
        visitAt: form.visitAt,
        content: form.content,
        officerName: form.officerName,
        nextVisitDue: nextDue,
        attachments: [...form.attachments],
        riskChanged: form.riskChanged,
        riskLevel: form.riskChanged ? form.riskLevel : list[idx].riskLevel,
        updatedAt: now,
      };
    }
  }
  saveKeyPersonVisits(list);
  syncPersonByVisits(list, form.riskChanged ? form.riskLevel : '');
  uni.showToast({ title: '已保存', icon: 'success' });
  uni.navigateBack();
}

function syncPersonByVisits(visitsList, riskLevel) {
  const personVisits = visitsList.filter((v) => v.personId === personId.value);
  const updated = { ...(person.value || { personId: personId.value }) };
  if (personVisits.length) {
    const sorted = personVisits.slice().sort((a, b) => (a.visitAt < b.visitAt ? 1 : -1));
    const latest = sorted[0];
    updated.lastVisitAt = latest.visitAt;
    updated.nextVisitDue = latest.nextVisitDue || calcNextVisitDue(latest.visitAt);
  } else {
    updated.lastVisitAt = '';
    updated.nextVisitDue = '';
  }
  if (riskLevel) updated.riskLevel = riskLevel;
  const persons = getKeyPersons().map((p) => (p.personId === updated.personId ? updated : p));
  saveKeyPersons(persons);
}

function calcNextVisitDue(visitAt) {
  const base = visitAt ? new Date(String(visitAt).replace(/-/g, '/')) : new Date();
  const freq = person.value?.visitFreqDays || 7;
  const next = new Date(base.getTime() + freq * 86400000);
  return formatDate(next.getTime());
}

function formatDate(time) {
  const date = new Date(time);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTime(time) {
  const date = new Date(time);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

onLoad((query) => {
  personId.value = query.personId || '';
  visitId.value = query.visitId || '';
  mode.value = query.mode || 'add';
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
.photoRow {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6e7a89;
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

