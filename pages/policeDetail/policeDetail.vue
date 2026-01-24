<template>
  <view class="page">
    <view class="statuBar" :style="{ height: barheight + 'px' }"></view>
    <view class="header-sticky">
      <view class="head">
        <view class="head-top">
          <view class="title">
            <view class="txt1">{{ detail.title || '警情' }}</view>
            <view class="innum">
              <view class="txt_gray">警情编号：</view>
              <view class="txtclick">{{ detail.caseNo || '-' }}</view>
            </view>
          </view>
          <view class="collapse-toggle" @click="toggleCollapse">
            {{ collapsed ? '展开' : '收起' }}
          </view>
        </view>
        <view class="head-compact">
          <view class="compact-row">
            <text class="txt_gray">报警人：</text>
            <text class="txtclick">{{ detail.reporter || '-' }}</text>
            <text class="txt_gray">电话：</text>
            <text class="txtclick">{{ detail.phone || '-' }}</text>
          </view>
          <view class="compact-row">
            <text class="txt_gray">地址：</text>
            <text class="txtclick">{{ detail.address || '-' }}</text>
          </view>
          <view class="compact-row">
            <text class="txt_gray">接警时间：</text>
            <text class="txt_gray_after">{{ detail.receiveTime || '-' }}</text>
          </view>
        </view>
        <view class="head-tags" v-if="mappedTags.length">
          <com-tag :taglist="mappedTags"></com-tag>
        </view>
      </view>
    </view>

    <view v-if="collapsed" class="chat-layout">
      <scroll-view class="messages" scroll-y>
        <view
          v-for="msg in chatMessages"
          :key="msg.id"
          :class="['msg-row', msg.self ? 'self' : '', msg.type === 'date' ? 'date-row' : '']"
        >
          <view v-if="msg.type === 'date'" class="date-badge">{{ msg.content }}</view>
          <template v-else>
            <image class="avatar" :src="msg.avatar" mode="aspectFill"></image>
            <view class="bubble-wrap">
              <view class="msg-user">{{ msg.user }}</view>
              <view class="msg-bubble">{{ msg.content }}</view>
              <view class="msg-time">{{ msg.time }}</view>
            </view>
          </template>
        </view>
      </scroll-view>
      <view class="chat-input-sticky">
        <view class="input-wrap">
          <input v-model="chatText" placeholder="输入文字" />
        </view>
        <button class="send-btn" type="primary" size="mini" @click="sendText">发送</button>
      </view>
    </view>

    <view v-else class="detail-overlay">
      <view class="detail-panel">
        <view class="detail-header">
          <view class="detail-title">警情详情</view>
          <view class="collapse-toggle" @click="toggleCollapse">收起</view>
        </view>
        <scroll-view class="detail-scroll" scroll-y>
          <view class="detail-section">
            <view class="introduction txt2">{{ detail.description || '' }}</view>
            <view class="pepoleinfo">
              <view class="flexrow">
                <view class="txt_gray">报警人：</view>
                <view class="txtclick">{{ detail.reporter || '-' }}</view>
              </view>
              <view class="flexrow">
                <view class="txt_gray">电话：</view>
                <view class="txtclick">{{ detail.phone || '-' }}</view>
              </view>
            </view>
            <view class="address flexrow">
              <view class="txt_gray">地址：</view>
              <view class="txtclick">{{ detail.address || '-' }}</view>
            </view>
            <view class="time flexrow">
              <view class="txt_gray">接警时间：</view>
              <view class="txt_gray_after">{{ detail.receiveTime || '-' }}</view>
            </view>
            <view class="status-bar">
              <view class="status-label">处警状态</view>
              <view class="status-value">未处警</view>
              <view class="status-action">节点更新记录于时间轴</view>
            </view>
            <com-tag></com-tag>
          </view>

          <view class="detail-section">
            <view class="round-title">处警节点时间轴</view>
            <view class="responder-bar">
              <view class="responder-row">
                <view class="responder-label">主处警：</view>
                <view class="responder-value">{{ mainResponderText }}</view>
              </view>
              <view class="responder-row">
                <view class="responder-label">协同：</view>
                <view class="responder-value">{{ assistResponderText }}</view>
              </view>
            </view>
            <DispatchTimeline :items="timelineEntries" mode="full" />
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import DispatchTimeline from '@/components/app/DispatchTimeline.vue';
import {
  getChatMessages,
  addChatMessage,
  getPoliceDetails,
  getPoliceDetailById,
  savePoliceDetails,
} from '@/common/database.js';

const barheight = ref(getStatusBarHeight());
const detailId = ref('');
const detail = ref({});
const collapsed = ref(true);

const messages = ref([]);
const chatText = ref('');

const mappedTags = computed(() => {
  const list = detail.value?.tags || [];
  return list
    .map((item) => {
      if (typeof item === 'string') return { tag: item };
      if (item && typeof item === 'object') return { tag: item.tag || '' };
      return null;
    })
    .filter((item) => item && item.tag);
});

const timelineEntries = computed(() => detail.value.timeline || []);
const mainResponderText = computed(() => {
  const main = detail.value.responders?.main;
  if (!main) return '—';
  return `${main.name || '—'} ${main.phone || ''}`.trim();
});
const assistResponderText = computed(() => {
  const assists = detail.value.responders?.assists || [];
  if (!assists.length) return '—';
  return assists.map((item) => item.name || '—').join('、');
});
const chatMessages = computed(() =>
  messages.value.filter((msg) => msg.type === 'date' || msg.user !== '系统')
);

function loadData() {
  messages.value = getChatMessages();
  const list = getPoliceDetails();
  const current = detailId.value ? getPoliceDetailById(detailId.value) || list[0] || {} : list[0] || {};
  detail.value = normalizeDetail(current);
  if (!detail.value.id && list[0]?.id) {
    detail.value.id = list[0].id;
  }
}

function normalizeDetail(data) {
  const base = {
    status: '未处警',
    responders: {
      main: { name: '', phone: '' },
      assists: [],
    },
    timeline: [],
  };
  return { ...base, ...data };
}

function persistDetail() {
  const list = getPoliceDetails();
  const idx = list.findIndex((item) => item.id === detail.value.id);
  if (idx >= 0) {
    list[idx] = { ...detail.value };
  } else {
    list.unshift({ ...detail.value });
  }
  savePoliceDetails(list);
}

function addTimelineEntry(payload) {
  const entry = {
    id: `tl-${Date.now()}`,
    time: new Date().toLocaleString().slice(5, 16),
    actor: '我',
    type: '出警',
    note: '',
    ...payload,
  };
  detail.value.timeline = [entry, ...(detail.value.timeline || [])];
  persistDetail();
}

function sendText() {
  if (!chatText.value) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }
  messages.value = addChatMessage({
    id: `m-${Date.now()}`,
    user: '我',
    content: chatText.value,
    time: new Date().toLocaleTimeString().slice(0, 5),
    self: true,
    avatar: '/static/avatar/me.png',
  });
  chatText.value = '';
}

function toggleCollapse() {
  collapsed.value = !collapsed.value;
}

onLoad((query) => {
  detailId.value = query.id || '';
});

onShow(loadData);
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  padding: 0 20rpx 20rpx;
  display: flex;
  flex-direction: column;
}

.header-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
}

.head {
  border: 1px solid #eee;
  border-radius: 10rpx;
  box-shadow: 0 0 30rpx rgba(0, 0, 0, 0.15);
  background-color: white;
  margin: 10rpx 0;
  padding: 16rpx;
}

.head-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.title {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.innum {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.pepoleinfo {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.flexrow {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.introduction {
  margin-bottom: 10px;
}

.address {
  margin-bottom: 8px;
}

.collapse-toggle {
  font-size: 24rpx;
  color: #0f75ff;
  padding: 6rpx 12rpx;
  border-radius: 14rpx;
  background: #f0f5ff;
}

.head-compact {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-top: 10rpx;
}

.head-tags {
  margin-top: 8rpx;
}

.compact-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  font-size: 24rpx;
  color: #5c6b7a;
}

.head-full {
  margin-top: 10rpx;
}

.chat-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #f2f2f2;
  border-radius: 16rpx;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12rpx 18rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}

.msg-row.self {
  flex-direction: row-reverse;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  background: #ddd;
}

.bubble-wrap {
  max-width: 520rpx;
}

.msg-user {
  font-size: 24rpx;
  color: #6b7785;
  margin-bottom: 4rpx;
}

.msg-row.self .msg-user {
  text-align: right;
}

.msg-bubble {
  background: white;
  border-radius: 10rpx;
  padding: 14rpx 16rpx;
  font-size: 28rpx;
  color: #1f2b3a;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}

.msg-row.self .msg-bubble {
  background: #9fe75a;
}

.msg-time {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #97a1ad;
}

.date-row {
  justify-content: center;
}

.date-badge {
  padding: 6rpx 12rpx;
  background: #d8d8d8;
  color: #fff;
  border-radius: 10rpx;
  font-size: 22rpx;
}

.chat-input-sticky {
  position: sticky;
  bottom: 0;
  background: #f7f7f7;
  padding: 10rpx 16rpx 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  border-top: 1px solid #e6e6e6;
  padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
}

.input-wrap {
  flex: 1;
  background: white;
  border-radius: 26rpx;
  padding: 10rpx 14rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: inset 0 0 0 1px #eee;
}

.input-wrap input {
  flex: 1;
  font-size: 28rpx;
}

.send-btn {
  background: #0f75ff;
  color: white;
  border-radius: 12rpx;
  padding: 0 18rpx;
}

.status-bar {
  margin: 12rpx 0;
  padding: 12rpx 16rpx;
  border-radius: 10rpx;
  background: #f6f8fb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.status-label {
  font-size: 26rpx;
  color: #6e7a89;
}

.status-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #0f75ff;
}

.status-action {
  font-size: 24rpx;
  color: #97a1ad;
}

.round-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2b3a;
}

.responder-bar {
  background: #f6f8fb;
  border-radius: 10rpx;
  padding: 12rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-bottom: 10rpx;
}

.responder-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.responder-label {
  font-size: 24rpx;
  color: #6e7a89;
}

.responder-value {
  font-size: 26rpx;
  color: #1f2b3a;
}


.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20rpx;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0;
}

.detail-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.detail-scroll {
  flex: 1;
}

.detail-section {
  background: #f6f8fb;
  border-radius: 12rpx;
  padding: 12rpx;
  margin-bottom: 12rpx;
}
</style>
