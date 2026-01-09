<template>
  <view class="person-detail pageBg">
    <view class="statuBar"></view>

    <view class="card overview">
      <view class="name">{{ maskName(person?.name) }}</view>
      <view class="tags">
        <view class="chip">{{ person?.personType }}</view>
        <view :class="['chip', riskClass(person?.riskLevel)]">{{ person?.riskLevel }}</view>
        <view :class="['chip', statusClass(person?.status)]">{{ person?.status }}</view>
      </view>
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
      <view class="chip-row">
        <view v-for="tag in person?.tags || []" :key="tag" class="tag">{{ tag }}</view>
      </view>
    </view>

    <view class="quick-actions">
      <button class="primary" size="mini" @click="dispatch">一键派单</button>
      <button class="ghost" size="mini" @click="changeStatus">快速改状态</button>
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
      </view>
    </view>

    <view class="tab-panel card">
      <view v-if="activeTab === 0">
        <view class="panel-head">
          <view class="panel-title">回访记录</view>
          <button class="primary" size="mini" @click="goAddVisit">新增回访</button>
        </view>
        <view v-if="visits.length === 0" class="empty">暂无回访记录</view>
        <view v-for="item in visits" :key="item.id" class="record">
          <view class="record-top">
            <text>{{ item.visitType }}</text>
            <text>{{ item.visitAt }}</text>
          </view>
          <view class="record-content">{{ item.content }}</view>
          <view class="record-meta">
            <text>民警：{{ item.officerName || '-' }}</text>
            <text>下次回访：{{ item.nextVisitDue || '-' }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 1">
        <view class="panel-title">档案信息</view>
        <view class="info-grid">
          <view class="item"><text>性别</text><text>{{ profile?.gender || '-' }}</text></view>
          <view class="item"><text>出生日期</text><text>{{ profile?.birthday || '-' }}</text></view>
          <view class="item"><text>身份证</text><text>{{ maskId(profile?.idNo) }}</text></view>
          <view class="item"><text>户籍地</text><text>{{ profile?.household || '-' }}</text></view>
          <view class="item"><text>职业</text><text>{{ profile?.occupation || '-' }}</text></view>
        </view>
        <view class="section">
          <view class="section-title">风险因素</view>
          <view class="chips">
            <view v-for="item in profile?.riskFactors || []" :key="item" class="chip">{{ item }}</view>
            <view v-if="!(profile?.riskFactors || []).length" class="empty">暂无</view>
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
        <view class="panel-title">管控措施/备注</view>
        <view class="section">
          <view class="section-title">管控措施</view>
          <view class="chips">
            <view v-for="item in profile?.controlMeasures || []" :key="item" class="chip">{{ item }}</view>
            <view v-if="!(profile?.controlMeasures || []).length" class="empty">暂无</view>
          </view>
        </view>
        <view class="section">
          <view class="section-title">备注</view>
          <view class="remark">{{ profile?.remarks || '暂无' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  getKeyPersons,
  saveKeyPersons,
  getKeyPersonProfiles,
  getKeyPersonVisits,
  getKeyPersonById,
  getPersonVisits,
  syncKeyPersonTodos,
} from '@/common/database.js';

const personId = ref('');
const person = ref(null);
const profile = ref(null);
const visits = ref([]);
const activeTab = ref(0);

const tabs = [
  { key: 'visits', label: '回访记录', icon: '📝' },
  { key: 'profile', label: '档案信息', icon: '📄' },
  { key: 'related', label: '关联信息', icon: '🔗' },
  { key: 'control', label: '管控措施', icon: '🛡️' },
];

const related = ref({ alerts: 2, disputes: 1, dispatches: 3 });

function load() {
  person.value = getKeyPersonById(personId.value) || null;
  profile.value = (getKeyPersonProfiles() || []).find((p) => p.personId === personId.value) || null;
  visits.value = getPersonVisits(personId.value);
  syncKeyPersonTodos(getKeyPersons());
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
  return `${idNo.slice(0, 4)}********${idNo.slice(-4)}`;
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

function riskClass(level) {
  if (level === '高') return 'danger';
  if (level === '中') return 'warn';
  return 'low';
}

function statusClass(status) {
  if (status === '失控') return 'danger';
  if (status === '关注') return 'warn';
  if (status === '在控') return 'ok';
  return 'muted';
}

function goAddVisit() {
  uni.navigateTo({ url: `/pages/person/visit/add?personId=${personId.value}` });
}

function dispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PERSON&sourceId=${personId.value}` });
}

function changeStatus() {
  const options = ['在控', '关注', '失控', '迁出', '解除'];
  uni.showActionSheet({
    itemList: options,
    success: (res) => {
      const status = options[res.tapIndex];
      const list = getKeyPersons().map((p) =>
        p.personId === personId.value ? { ...p, status } : p
      );
      saveKeyPersons(list);
      load();
    },
  });
}

onLoad((query) => {
  personId.value = query.personId || '';
});

onShow(load);
</script>

<style lang="scss" scoped>
.person-detail {
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
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
    .tags {
      display: flex;
      gap: 8rpx;
      margin: 10rpx 0;
      flex-wrap: wrap;
    }
    .chip {
      padding: 6rpx 12rpx;
      border-radius: 12rpx;
      font-size: 24rpx;
      background: #f6f8fb;
      &.danger { background: #ffecec; color: #d64545; }
      &.warn { background: #fff6e6; color: #c88719; }
      &.low { background: #e6f7ed; color: #1b9d5d; }
      &.ok { background: #eaf3ff; color: #0f75ff; }
      &.muted { background: #f1f3f5; color: #6e7a89; }
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
    .chip-row {
      margin-top: 8rpx;
      display: flex;
      gap: 8rpx;
      flex-wrap: wrap;
      .tag {
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        background: #eaf3ff;
        color: #0f75ff;
      }
    }
  }
  .quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10rpx;
    margin-bottom: 12rpx;
    .primary {
      background: #0f75ff;
      color: #fff;
      border: none;
    }
    .ghost {
      background: #f6f8fb;
      color: #0f75ff;
      border: 1px solid #e1e8f0;
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
  }
}
</style>
