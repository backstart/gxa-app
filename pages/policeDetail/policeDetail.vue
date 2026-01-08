<template>
  <view class="page">
    <view class="statuBar" :style="{ height: barheight + 'px' }"></view>
    <view class="head">
      <view class="title">
        <view class="txt1">{{ detail.title || '警情' }}</view>
        <view class="innum">
          <view class="txt_gray">警情编号：</view>
          <view class="txtclick">{{ detail.caseNo || '-' }}</view>
        </view>
      </view>
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
      <com-tag></com-tag>
    </view>

    <view class="tabs">
      <view
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        :class="['tab', activeTab === idx ? 'active' : '']"
        @click="activeTab = idx"
      >
        {{ tab.label }}
      </view>
    </view>

    <view class="tab-panel">
      <view v-if="activeTab === 0" class="chat">
        <view class="section-head">
          <text class="section-title">聊天交流</text>
          <text class="section-sub">群聊讨论该警情</text>
        </view>
        <view class="chat-panel">
          <view class="messages">
            <view
              v-for="msg in messages"
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
          </view>
          <view class="chat-input-bar">
            <view class="input-wrap">
              <image src="/static/icons/voice.png" class="input-icon" mode="aspectFit"></image>
              <input v-model="chatText" placeholder="按住说话，或输入文字" />
              <image src="/static/icons/emoji.png" class="input-icon" mode="aspectFit"></image>
              <image src="/static/icons/add.png" class="input-icon" mode="aspectFit"></image>
            </view>
            <button class="send-btn" type="primary" size="mini" @click="sendText">发送</button>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 1" class="scene">
        <view class="section-head">
          <text class="section-title">现场信息</text>
          <text class="section-sub">照片、报警人信息、现场情况</text>
        </view>
        <view class="scene-list">
          <view v-for="item in sceneItems" :key="item.id" class="scene-card">
            <view class="scene-title">{{ item.title }}</view>
            <view class="scene-desc">{{ item.desc }}</view>
            <view class="scene-time">{{ item.time }}</view>
          </view>
        </view>
        <button class="primary-btn" type="primary" @click="addScene">新增现场信息</button>
      </view>

      <view v-else class="dispose">
        <view class="section-head">
          <text class="section-title">处置情况</text>
          <text class="section-sub">记录处置结果，可新增补充</text>
        </view>
        <view class="scene-list">
          <view v-for="item in disposes" :key="item.id" class="scene-card">
            <view class="scene-title">{{ item.title }}</view>
            <view class="scene-desc">{{ item.desc }}</view>
            <view class="scene-time">{{ item.time }}</view>
          </view>
        </view>
        <button class="primary-btn" type="primary" @click="addDispose">新增处置结果</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import {
  getChatMessages,
  addChatMessage,
  getSceneItems,
  addSceneItem,
  getDisposeItems,
  addDisposeItem,
  getPoliceDetails,
  getPoliceDetailById,
} from '@/common/database.js';

const barheight = ref(getStatusBarHeight());
const tabs = [
  { key: 'chat', label: '聊天交流' },
  { key: 'scene', label: '现场信息' },
  { key: 'dispose', label: '处置情况' },
];
const activeTab = ref(0);
const detailId = ref('');
const detail = ref({});

const messages = ref([]);
const chatText = ref('');

const sceneItems = ref([]);
const disposes = ref([]);

function loadData() {
  messages.value = getChatMessages();
  sceneItems.value = getSceneItems();
  disposes.value = getDisposeItems();
  const list = getPoliceDetails();
  detail.value = detailId.value ? getPoliceDetailById(detailId.value) || list[0] || {} : list[0] || {};
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

function addScene() {
  sceneItems.value = addSceneItem({
    id: `s-${Date.now()}`,
    title: '新增现场信息',
    desc: '请在真实环境中替换为表单提交结果',
    time: new Date().toLocaleTimeString().slice(0, 5),
  });
  uni.showToast({ title: '已新增', icon: 'success' });
}

function addDispose() {
  disposes.value = addDisposeItem({
    id: `d-${Date.now()}`,
    title: '新增处置结果',
    desc: '请在真实环境中替换为表单提交结果',
    time: new Date().toLocaleTimeString().slice(0, 5),
  });
  uni.showToast({ title: '已新增', icon: 'success' });
}

onLoad((query) => {
  detailId.value = query.id || '';
});

onShow(loadData);
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 20rpx 40rpx;
}

.head {
  border: 1px solid #eee;
  border-radius: 10rpx;
  box-shadow: 0 0 30rpx rgba(0, 0, 0, 0.15);
  background-color: white;
  margin: 10rpx 0;
  padding: 16rpx;
}

.title {
  margin: 10rpx 10rpx;
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

.tabs {
  display: flex;
  margin: 14rpx 0;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f6f8fb;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 28rpx;
  color: #5c6b7a;
}

.tab.active {
  background: #0f75ff;
  color: white;
  font-weight: 600;
}

.tab-panel {
  background: #f2f2f2;
  border-radius: 16rpx;
  padding: 0;
  box-shadow: 0 6rpx 24rpx rgba(0,0,0,0.08);
}

.section-head {
  display: flex;
  flex-direction: column;
  margin-bottom: 12rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.section-sub {
  font-size: 24rpx;
  color: #6e7a89;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 320rpx);
  background: #f2f2f2;
  border-radius: 16rpx;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12rpx 18rpx 140rpx;
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
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);
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

.chat-input-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f7f7f7;
  padding: 10rpx 16rpx 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  border-top: 1px solid #e6e6e6;
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

.input-icon {
  width: 40rpx;
  height: 40rpx;
}

.send-btn {
  background: #0f75ff;
  color: white;
  border-radius: 12rpx;
  padding: 0 18rpx;
}

.scene-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin: 10rpx 0 14rpx;
}

.scene-card {
  padding: 12rpx;
  border-radius: 12rpx;
  background: #f6f8fb;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04);
}

.scene-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2b3a;
}

.scene-desc {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #4f5a68;
}

.scene-time {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #97a1ad;
}

.primary-btn {
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: white;
  font-size: 30rpx;
  border-radius: 12rpx;
}
</style>
