<template>
  <AppPage>
    <view class="person-visit pageBg">
      <view class="header">
        <view class="title">新增回访</view>
        <view class="sub">{{ person?.name || '-' }}（{{ person?.personType || '-' }}）</view>
      </view>

    <view class="card summary">
      <view class="row"><text>责任民警</text><text>{{ person?.officerName || '-' }}</text></view>
      <view class="row"><text>地址</text><text>{{ person?.address || '-' }}</text></view>
      <view class="row"><text>当前风险</text><text>{{ person?.riskLevel || '-' }}</text></view>
      <view class="row"><text>当前状态</text><text>{{ person?.status || '-' }}</text></view>
    </view>

    <view class="card form">
      <view class="form-item">
        <view class="label">回访时间</view>
        <input v-model="form.visitAt" placeholder="YYYY-MM-DD HH:mm" />
      </view>
      <view class="form-item">
        <view class="label">回访类型</view>
        <radio-group class="radio-group" @change="onTypeChange">
          <label v-for="item in visitTypes" :key="item" class="radio-item">
            <radio :value="item" :checked="form.visitType === item" />
            <text>{{ item }}</text>
          </label>
        </radio-group>
      </view>
      <view class="form-item">
        <view class="label">回访内容</view>
        <textarea v-model="form.content" placeholder="请输入回访内容" />
      </view>
      <view class="form-item switch-row">
        <text>风险有变化</text>
        <switch :checked="form.riskChanged" @change="toggleRiskChanged" />
      </view>
      <view v-if="form.riskChanged" class="form-item">
        <view class="label">新风险等级</view>
        <radio-group class="radio-group" @change="onRiskChange">
          <label v-for="item in riskLevels" :key="item" class="radio-item">
            <radio :value="item" :checked="form.newRiskLevel === item" />
            <text>{{ item }}</text>
          </label>
        </radio-group>
      </view>
      <view class="form-item switch-row">
        <text>需要跟进</text>
        <switch :checked="form.needFollowup" @change="toggleFollowup" />
      </view>
      <view class="form-item">
        <view class="label">下次回访</view>
        <input v-model="form.nextVisitDue" placeholder="YYYY-MM-DD（可空）" />
        <view class="hint">为空时将按 {{ defaultVisitDays }} 天自动计算</view>
      </view>
      <view class="form-item">
        <view class="label">附件（mock）</view>
        <view class="attachments">
          <view v-for="(item, idx) in form.attachments" :key="idx" class="attachment">{{ item }}</view>
          <button class="ghost" size="mini" @click="addAttachment">添加附件</button>
        </view>
      </view>
    </view>

      <AppBottomBar label="提交回访" @click="submit" />
    </view>
  </AppPage>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  getKeyPersons,
  saveKeyPersons,
  getKeyPersonVisits,
  saveKeyPersonVisits,
  getKeyPersonById,
  syncKeyPersonTodos,
} from '@/common/database.js';
import AppPage from '@/components/app/AppPage.vue';
import AppBottomBar from '@/components/app/AppBottomBar.vue';

const personId = ref('');
const person = ref(null);
const defaultVisitDays = 7;

const form = ref({
  visitAt: formatDatetime(new Date()),
  visitType: '例行',
  content: '',
  riskChanged: false,
  newRiskLevel: '',
  needFollowup: true,
  nextVisitDue: '',
  attachments: [],
});

const visitTypes = ['例行', '突击', '谈话', '专项'];
const riskLevels = ['高', '中', '低'];

function formatDatetime(d) {
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toggleRiskChanged(e) {
  form.value.riskChanged = !!e.detail.value;
  if (!form.value.riskChanged) {
    form.value.newRiskLevel = '';
  }
}

function toggleFollowup(e) {
  form.value.needFollowup = !!e.detail.value;
}

function onTypeChange(e) {
  form.value.visitType = e.detail.value;
}

function onRiskChange(e) {
  form.value.newRiskLevel = e.detail.value;
}

function addAttachment() {
  form.value.attachments = [...form.value.attachments, '/static/logo.png'];
}

function calcNextDue(base) {
  const date = new Date(String(base).replace(/-/g, '/'));
  const next = new Date(date.getTime() + defaultVisitDays * 86400000);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

function validate() {
  if (!form.value.content) {
    uni.showToast({ title: '请输入回访内容', icon: 'none' });
    return false;
  }
  if (form.value.riskChanged && !form.value.newRiskLevel) {
    uni.showToast({ title: '请选择新风险等级', icon: 'none' });
    return false;
  }
  return true;
}

function submit() {
  if (!validate()) return;
  const visits = getKeyPersonVisits();
  const nextDue = form.value.nextVisitDue || calcNextDue(form.value.visitAt);
  const record = {
    id: `kpv-${Date.now()}`,
    personId: personId.value,
    visitAt: form.value.visitAt,
    visitType: form.value.visitType,
    content: form.value.content,
    officerName: person.value?.officerName || '',
    riskChanged: form.value.riskChanged,
    newRiskLevel: form.value.newRiskLevel,
    needFollowup: form.value.needFollowup,
    nextVisitDue: nextDue,
    attachments: form.value.attachments,
  };
  saveKeyPersonVisits([record, ...visits]);

  const list = getKeyPersons().map((p) => {
    if (p.personId !== personId.value) return p;
    return {
      ...p,
      lastVisitAt: form.value.visitAt,
      nextVisitDue: nextDue,
      riskLevel: form.value.riskChanged ? form.value.newRiskLevel : p.riskLevel,
    };
  });
  saveKeyPersons(list);
  syncKeyPersonTodos(list);

  uni.showToast({ title: '提交成功', icon: 'success' });
  setTimeout(() => {
    uni.navigateBack();
  }, 400);
}

onLoad((query) => {
  personId.value = query.personId || '';
  person.value = getKeyPersonById(personId.value);
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.person-visit {
  padding: 0 24rpx 120rpx;
  .header {
    padding: 10rpx 0 14rpx;
    .title { font-size: 44rpx; font-weight: 700; color: #1f2b3a; }
    .sub { margin-top: 6rpx; color: #6e7a89; font-size: 26rpx; }
  }
  .card {
    background: #fff;
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    margin-bottom: 16rpx;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8rpx;
    font-size: 26rpx;
    color: #1f2b3a;
  }
  .form-item {
    margin-bottom: 16rpx;
    .label {
      font-size: 28rpx;
      color: #1f2b3a;
      margin-bottom: 8rpx;
    }
    input, textarea {
      width: 100%;
      padding: 12rpx;
      border: 1px solid #e1e8f0;
      border-radius: 10rpx;
      font-size: 26rpx;
      background: #f8fafc;
    }
    textarea { min-height: 120rpx; }
    .radio-group {
      display: flex;
      gap: 20rpx;
      flex-wrap: wrap;
      .radio-item { display: flex; align-items: center; gap: 6rpx; font-size: 26rpx; }
    }
    .hint { margin-top: 6rpx; color: #6e7a89; font-size: 22rpx; }
  }
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 26rpx;
  }
  .attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    .attachment {
      padding: 6rpx 12rpx;
      background: #f6f8fb;
      border-radius: 12rpx;
      font-size: 24rpx;
    }
    .ghost {
      background: #f6f8fb;
      color: #0f75ff;
      border: 1px solid #e1e8f0;
    }
  }
}
</style>
