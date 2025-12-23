<template>
  <view class="page">
    <view class="statuBar" :style="{height: barheight+'px'}"></view>
    <view class="head">
      <view class="title">
        <view class="txt1">警情一</view>
        <view class="innum">
          <view class="txt_gray">警情编号：</view>
          <view class="txtclick">JJ202508210836</view>
        </view>
      </view>
      <view class="introduction txt2">
        群众张某报警称，其朋友李某因情绪不稳提出分手后，想冲动做危险行为，需民警赶赴现场劝解并处置。
      </view>
      <view class="pepoleinfo">
        <view class="flexrow">
          <view class="txt_gray">报警人：</view>
          <view class="txtclick">张某</view>
        </view>
        <view class="flexrow">
          <view class="txt_gray">电话：</view>
          <view class="txtclick">123456789</view>
        </view>
      </view>
      <view class="address flexrow">
        <view class="txt_gray">地址：</view>
        <view class="txtclick">XX市XX区XX街道XX小区3栋1单元</view>
      </view>
      <view class="time flexrow">
        <view class="txt_gray">接警时间：</view>
        <view class="txt_gray_after">2025年8月21日 10:06</view>
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
          <text class="section-sub">群聊讨论该警情，仿微信样式</text>
        </view>
        <view class="chat-panel">
          <view class="messages">
            <view v-for="msg in messages" :key="msg.id" :class="['msg-row', msg.self ? 'self' : '', msg.type === 'date' ? 'date-row' : '']">
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
          <text class="section-sub">照片、报警人信息、视频、现场情况</text>
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
import { getStatusBarHeight } from '@/utils/system.js';

const barheight = ref(getStatusBarHeight());
const tabs = [
  { key: 'chat', label: '聊天交流' },
  { key: 'scene', label: '现场信息' },
  { key: 'dispose', label: '处置情况' },
];
const activeTab = ref(0);

const messages = ref([
  { id: 'd1', type: 'date', content: '2025年08月21日 10:00' },
  { id: 'm1', user: '李警官', content: '我已到达现场，情绪基本稳定。', time: '10:20', self: false, avatar: '/static/avatar/a1.png' },
  { id: 'm2', user: '王警官', content: '路上有点堵，预计10分钟后到。', time: '10:21', self: false, avatar: '/static/avatar/a2.png' },
  { id: 'm3', user: '张警官', content: '建议联系家属协助疏导。', time: '10:22', self: true, avatar: '/static/avatar/me.png' },
  { id: 'm4', user: '指挥席', content: '注意安全，先稳定情绪，等待增援。', time: '10:23', self: false, avatar: '/static/avatar/a3.png' },
]);
const chatText = ref('');

const sceneItems = ref([
  { id: 's1', title: '现场照片', desc: '上传2张现场照', time: '10:18' },
  { id: 's2', title: '报警人补充信息', desc: '情绪波动，需医生评估', time: '10:25' },
]);

const disposes = ref([
  { id: 'd1', title: '处置进展', desc: '劝解成功，已联系家属陪同', time: '10:40' },
]);

// 发送文字消息
function sendText() {
  if (!chatText.value) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }
  messages.value.push({
    id: `m-${Date.now()}`,
    user: '我',
    content: chatText.value,
    time: new Date().toLocaleTimeString().slice(0, 5),
    self: true,
    avatar: '/static/avatar/me.png',
  });
  chatText.value = '';
}

// 新增现场信息（模拟）
function addScene() {
  sceneItems.value.unshift({
    id: `s-${Date.now()}`,
    title: '新增现场信息',
    desc: '请在真实环境中替换为表单提交结果',
    time: new Date().toLocaleTimeString().slice(0, 5),
  });
  uni.showToast({ title: '已新增', icon: 'success' });
}

// 新增处置结果（模拟）
function addDispose() {
  disposes.value.unshift({
    id: `d-${Date.now()}`,
    title: '新增处置结果',
    desc: '请在真实环境中替换为表单提交结果',
    time: new Date().toLocaleTimeString().slice(0, 5),
  });
  uni.showToast({ title: '已新增', icon: 'success' });
}
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
