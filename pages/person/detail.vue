<template>
  <view class="person-detail pageBg">
    <view class="statuBar"></view>

    <view class="card overview">
      <view class="name">{{ maskName(person?.name) }}</view>
      <view class="info">
        <view class="row"><text>责任民警</text><text>{{ person?.officerName || '-' }}</text></view>
        <view class="row"><text>电话</text><text>{{ maskPhone(person?.phone) }}</text></view>
        <view class="row"><text>地址</text><text>{{ person?.address || '-' }}</text></view>
        <view class="row"><text>最近回访</text><text>{{ person?.lastVisitAt || '-' }}</text></view>
        <view class="row">
          <text>下次回访</text>
          <text :class="dueClass(person?.nextVisitDue)">{{ dueText(person?.nextVisitDue) }}</text>
        </view>
      </view>
      <com-tag :taglist="tagList"></com-tag>
    </view>

    <view class="tabs">
      <view
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        :class="['tab', activeTab === idx ? 'active' : '']"
        @click="activeTab = idx"
      >
        <text class="icon">{{ tab.icon }}</text>
        <text>{{ tab.label }}</text>
        <text v-if="tab.key === 'visits'" class="badge">{{ visits.length }}</text>
        <text v-if="tab.key === 'control' && measures.length" class="badge">{{ measures.length }}</text>
      </view>
    </view>

    <view class="tab-panel card">
      <view v-if="activeTab === 0">
        <view class="panel-title">回访记录</view>
        <view v-if="visits.length === 0" class="empty">暂无回访记录</view>
        <view v-for="item in visits" :key="item.id" class="record" @click="goVisitDetail(item)">
          <view class="record-top">
            <text>{{ item.visitType }}</text>
            <text>{{ item.visitAt }}</text>
          </view>
          <view class="record-content">{{ item.content }}</view>
          <view class="record-meta">
            <text>民警：{{ item.officerName || '-' }}</text>
            <text>下次回访：{{ item.nextVisitDue || '-' }}</text>
          </view>
          <view class="record-actions">
            <text class="action-link" @click.stop="openVisitAction(item)">更多</text>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 1">
        <view class="panel-head">
          <view class="panel-title">档案信息</view>
          <text class="edit-btn" @click="goEditProfile">编辑</text>
        </view>
        <view class="sectionCard">
          <view class="info-grid">
            <view class="item"><text>性别</text><text>{{ profile?.basic?.gender || '-' }}</text></view>
            <view class="item"><text>出生日期</text><text>{{ profile?.basic?.birthday || '-' }}</text></view>
            <view class="item"><text>身份证</text><text>{{ profile?.basic?.idNoMasked || '-' }}</text></view>
            <view class="item"><text>户籍地</text><text>{{ profile?.basic?.domicile || '-' }}</text></view>
            <view class="item"><text>职业</text><text>{{ profile?.basic?.job || '-' }}</text></view>
          </view>
          <view class="section">
            <view class="section-title">风险因素</view>
            <view class="chips">
              <view v-for="item in profile?.riskFactors || []" :key="item" class="chip">{{ item }}</view>
              <view v-if="!(profile?.riskFactors || []).length" class="empty">暂无</view>
            </view>
          </view>
          <view class="section">
            <view class="section-title">证件照片</view>
            <view class="photo-row">
              <image v-for="(img, idx) in profile?.idCardPhotos || []" :key="`id-${idx}`" class="photo-thumb" :src="img" mode="aspectFill"></image>
              <text v-if="!(profile?.idCardPhotos || []).length">--</text>
            </view>
            <view class="section-title">人像照片</view>
            <view class="photo-row">
              <image v-for="(img, idx) in profile?.portraitPhotos || []" :key="`pt-${idx}`" class="photo-thumb" :src="img" mode="aspectFill"></image>
              <text v-if="!(profile?.portraitPhotos || []).length">--</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 2">
        <view class="panel-title">关联信息</view>
        <view class="stats">
          <view class="stat">
            <view class="num">{{ related.alerts }}</view>
            <view class="label">警情</view>
          </view>
          <view class="stat">
            <view class="num">{{ related.disputes }}</view>
            <view class="label">纠纷</view>
          </view>
          <view class="stat">
            <view class="num">{{ related.dispatches }}</view>
            <view class="label">派单</view>
          </view>
        </view>
      </view>

      <view v-else>
        <view class="panel-title">管控措施</view>
        <view v-if="measures.length === 0" class="empty">暂无管控措施</view>
        <view v-for="item in measures" :key="item.measureId" class="measure-card" @click="openMeasureAction(item)">
          <view class="measure-top">
            <view class="measure-types">
              <text v-for="type in item.types" :key="type" class="chip">{{ type }}</text>
            </view>
            <text :class="['status-badge', measureStatusClass(item.status)]">{{ item.status }}</text>
          </view>
          <view class="measure-remark">{{ item.remark || '暂无备注' }}</view>
          <view class="measure-meta">更新：{{ formatDate(item.updatedAt || item.createdAt) }}</view>
        </view>
      </view>
    </view>

    <view class="action-bar" v-if="actionVisible">
      <button type="primary" class="action-btn" @click="handleAction">{{ actionLabel }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  getKeyPersons,
  saveKeyPersons,
  getKeyPersonProfiles,
  getKeyPersonVisits,
  saveKeyPersonVisits,
  getKeyPersonMeasures,
  saveKeyPersonMeasures,
  getKeyPersonById,
  getPersonVisits,
  syncKeyPersonTodos,
} from '@/common/database.js';

const personId = ref('');
const person = ref(null);
const profile = ref(null);
const visits = ref([]);
const measures = ref([]);
const activeTab = ref(0);

const tabs = [
  { key: 'visits', label: '回访记录', icon: '📝' },
  { key: 'profile', label: '档案信息', icon: '📄' },
  { key: 'related', label: '关联信息', icon: '🔗' },
  { key: 'control', label: '管控措施', icon: '🛡️' },
];

const related = ref({ alerts: 2, disputes: 1, dispatches: 3 });
const tagList = computed(() => {
  const list = [];
  if (person.value?.personType) list.push(person.value.personType);
  if (person.value?.riskLevel) list.push(person.value.riskLevel);
  if (person.value?.status) list.push(person.value.status);
  (person.value?.tags || []).forEach((tag) => list.push(tag));
  return list.map((tag) => ({ tag }));
});

const actionLabel = computed(() => {
  if (activeTab.value === 0) return '新增回访';
  if (activeTab.value === 1) return '新增档案';
  if (activeTab.value === 3) return '新增措施';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

// 加载重点人资料与关联数据
function loadAll() {
  person.value = getKeyPersonById(personId.value) || null;
  const rawProfile = (getKeyPersonProfiles() || []).find((p) => p.personId === personId.value) || null;
  if (rawProfile && !rawProfile.basic) {
    profile.value = {
      personId: rawProfile.personId,
      basic: {
        gender: rawProfile.gender || '未知',
        birthday: rawProfile.birthday || '',
        domicile: rawProfile.household || '',
        job: rawProfile.occupation || '',
        idNoMasked: maskId(rawProfile.idNo || ''),
        idNoFull: rawProfile.idNo || '',
      },
      riskFactors: rawProfile.riskFactors || [],
      idCardPhotos: rawProfile.idCardPhotos || [],
      portraitPhotos: rawProfile.portraitPhotos || [],
      updatedAt: rawProfile.updatedAt || Date.now(),
    };
  } else {
    profile.value = rawProfile;
  }
  visits.value = getPersonVisits(personId.value).slice().sort((a, b) => (a.visitAt < b.visitAt ? 1 : -1));
  measures.value = getKeyPersonMeasures().filter((item) => item.personId === personId.value);
  syncKeyPersonTodos(getKeyPersons());
}

// 底部主按钮动作分发
function handleAction() {
  if (activeTab.value === 0) {
    uni.navigateTo({ url: `/pages/person/visit/edit?personId=${personId.value}&mode=add` });
    return;
  }
  if (activeTab.value === 1) {
    goEditProfile();
    return;
  }
  if (activeTab.value === 3) {
    uni.navigateTo({ url: `/pages/person/measure/edit?personId=${personId.value}&mode=add` });
  }
}

// 跳转档案编辑页
function goEditProfile() {
  uni.navigateTo({ url: `/pages/person/profile/edit?personId=${personId.value}` });
}

// 回访记录操作（编辑/删除）
function goVisitDetail(item) {
  uni.navigateTo({ url: `/pages/person/visit/detail?personId=${personId.value}&visitId=${item.id}` });
}

function openVisitAction(item) {
  uni.showActionSheet({
    itemList: ['删除', '取消'],
    success: (res) => {
      if (res.tapIndex === 0) confirmDeleteVisit(item);
    },
  });
}

// 删除回访并刷新顶部回访信息
function confirmDeleteVisit(item) {
  uni.showModal({
    title: '删除回访',
    content: '确认删除该回访记录？',
    success: (res) => {
      if (!res.confirm) return;
      const list = getKeyPersonVisits().filter((v) => v.id !== item.id);
      saveKeyPersonVisits(list);
      recalcPersonVisitInfo(list);
      loadAll();
    },
  });
}

// 管控措施操作（编辑/删除）
function openMeasureAction(item) {
  uni.showActionSheet({
    itemList: ['编辑', '删除', '取消'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.navigateTo({ url: `/pages/person/measure/edit?personId=${personId.value}&measureId=${item.measureId}&mode=edit` });
      }
      if (res.tapIndex === 1) confirmDeleteMeasure(item);
    },
  });
}

function confirmDeleteMeasure(item) {
  uni.showModal({
    title: '删除措施',
    content: '确认删除该管控措施？',
    success: (res) => {
      if (!res.confirm) return;
      const list = getKeyPersonMeasures().filter((m) => m.measureId !== item.measureId);
      saveKeyPersonMeasures(list);
      loadAll();
    },
  });
}

// 更新顶部概览回访信息
function recalcPersonVisitInfo(list) {
  const personVisits = list.filter((v) => v.personId === personId.value);
  if (!person.value) return;
  if (!personVisits.length) {
    const updated = { ...person.value, lastVisitAt: '', nextVisitDue: '' };
    updatePerson(updated);
    return;
  }
  const sorted = personVisits.slice().sort((a, b) => (a.visitAt < b.visitAt ? 1 : -1));
  const latest = sorted[0];
  const updated = {
    ...person.value,
    lastVisitAt: latest.visitAt,
    nextVisitDue: latest.nextVisitDue || calcNextVisitDue(latest.visitAt),
  };
  updatePerson(updated);
}

function updatePerson(updated) {
  const list = getKeyPersons().map((p) => (p.personId === updated.personId ? updated : p));
  saveKeyPersons(list);
  person.value = updated;
}

function calcNextVisitDue(visitAt) {
  const base = visitAt ? new Date(String(visitAt).replace(/-/g, '/')) : new Date();
  const freq = person.value?.visitFreqDays || 7;
  const next = new Date(base.getTime() + freq * 86400000);
  return formatDate(next.getTime());
}

function formatDate(time) {
  if (!time) return '';
  const date = new Date(time);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function maskName(name) {
  if (!name) return '-';
  return `${name.charAt(0)}*`;
}

function maskPhone(phone) {
  if (!phone) return '-';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function maskId(idNo) {
  if (!idNo) return '-';
  const clean = String(idNo);
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)}********${clean.slice(-4)}`;
}

function dueText(dateStr) {
  if (!dateStr) return '未设置';
  const days = dueDays(dateStr);
  if (days < 0) return `超期${Math.abs(days)}天`;
  return `剩余${days}天`;
}

function dueClass(dateStr) {
  const days = dueDays(dateStr);
  if (days < 0) return 'danger';
  if (days <= 7) return 'warn';
  return '';
}

function dueDays(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(String(dateStr).replace(/-/g, '/'));
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - now.getTime()) / 86400000);
}

function measureStatusClass(status) {
  if (status === '已完成') return 'done';
  if (status === '暂停') return 'warn';
  return 'doing';
}

onLoad((query) => {
  personId.value = query.personId || '';
});

onShow(loadAll);
</script>

<style lang="scss" scoped>
.person-detail {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
  .statuBar { height: 40rpx; }
  .card {
    background: rgba(255, 255, 255, 0.92);
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
    margin-bottom: 16rpx;
  }
  .overview {
    .name {
      font-size: 40rpx;
      font-weight: 700;
      color: #1f2b3a;
    }
    .info {
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 26rpx;
        color: #1f2b3a;
        margin: 6rpx 0;
        .danger { color: #d64545; }
        .warn { color: #c88719; }
      }
    }
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8rpx;
    margin-bottom: 12rpx;
    .tab {
      background: #f6f8fb;
      border-radius: 12rpx;
      padding: 10rpx 6rpx;
      text-align: center;
      font-size: 24rpx;
      color: #4f5a68;
      position: relative;
      .icon { display: block; font-size: 28rpx; margin-bottom: 4rpx; }
      .badge {
        position: absolute;
        top: 6rpx;
        right: 8rpx;
        background: #ff5d5d;
        color: #fff;
        border-radius: 12rpx;
        font-size: 20rpx;
        padding: 2rpx 6rpx;
      }
      &.active {
        background: #eaf3ff;
        color: #0f75ff;
      }
    }
  }
  .tab-panel {
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10rpx;
      .panel-title { font-size: 30rpx; font-weight: 700; }
    }
    .panel-title { font-size: 30rpx; font-weight: 700; margin-bottom: 10rpx; }
    .record {
      padding: 12rpx 0;
      border-bottom: 1px solid #f1f3f5;
      .record-top {
        display: flex;
        justify-content: space-between;
        font-size: 26rpx;
        color: #1f2b3a;
      }
      .record-content {
        margin-top: 6rpx;
        font-size: 26rpx;
        color: #4f5a68;
      }
    .record-meta {
      margin-top: 6rpx;
      display: flex;
      justify-content: space-between;
      font-size: 24rpx;
      color: #6e7a89;
    }
    .record-actions {
      margin-top: 6rpx;
      display: flex;
      justify-content: flex-end;
    }
    .action-link {
      color: #0f75ff;
      font-size: 24rpx;
    }
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10rpx;
      .item {
        background: #f6f8fb;
        padding: 10rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        display: flex;
        justify-content: space-between;
      }
    }
    .sectionCard {
      background: #f6f8fb;
      border-radius: 14rpx;
      padding: 14rpx;
    }
    .section {
      margin-top: 12rpx;
      .section-title { font-size: 26rpx; font-weight: 600; margin-bottom: 6rpx; }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8rpx;
        .chip {
          padding: 6rpx 12rpx;
          border-radius: 12rpx;
          font-size: 24rpx;
          background: #f6f8fb;
        }
      }
      .remark { font-size: 26rpx; color: #4f5a68; }
    }
    .photo-row {
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
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10rpx;
      .stat {
        background: #f6f8fb;
        border-radius: 12rpx;
        padding: 12rpx;
        text-align: center;
        .num { font-size: 32rpx; font-weight: 700; color: #0f75ff; }
        .label { font-size: 24rpx; color: #4f5a68; margin-top: 4rpx; }
      }
    }
    .empty {
      text-align: center;
      color: #97a1ad;
    }
    .edit-btn {
      color: #0f75ff;
      font-size: 24rpx;
    }
    .measure-card {
      background: #f6f8fb;
      border-radius: 12rpx;
      padding: 12rpx;
      margin-bottom: 10rpx;
    }
    .measure-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .measure-types {
      display: flex;
      flex-wrap: wrap;
      gap: 6rpx;
    }
    .measure-remark {
      margin-top: 6rpx;
      font-size: 24rpx;
      color: #4f5a68;
    }
    .measure-meta {
      margin-top: 6rpx;
      font-size: 22rpx;
      color: #8a96a3;
    }
    .status-badge {
      padding: 4rpx 10rpx;
      border-radius: 10rpx;
      font-size: 22rpx;
      background: #eaf3ff;
      color: #0f75ff;
    }
    .status-badge.warn {
      background: #fff6e6;
      color: #c88719;
    }
    .status-badge.done {
      background: #e6f7ed;
      color: #1b9d5d;
    }
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
}
</style>
