<template>
  <view class="page">
    <view class="statuBar" :style="{ height: barheight + 'px' }"></view>
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

      <view v-if="collapsed" class="head-compact">
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
        <view class="compact-row">
          <text class="txt_gray">处警状态：</text>
          <text class="txtclick">未处警</text>
        </view>
      </view>

      <view v-else class="head-full">
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

        <view class="round-section">
          <view class="round-head">
            <text class="round-title">处警节点时间轴</text>
          </view>
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
      </view>
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
          </view>
          <scroll-view class="quick-phrases" scroll-x>
            <view
              v-for="item in quickPhrases"
              :key="item.text"
              class="phrase-chip"
              @click="sendQuickPhrase(item)"
            >
              {{ item.text }}
            </view>
          </scroll-view>
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
          <text class="section-sub">归档时间线（照片/语音/文字）</text>
        </view>
        <view class="scene-list">
          <view v-for="item in sceneEntries" :key="item.id" class="scene-card">
            <view class="scene-title">
              <text class="scene-type">{{ sceneTypeLabel(item.type) }}</text>
              <text>{{ item.content }}</text>
            </view>
            <view v-if="item.files && item.files.length" class="scene-media">
              <image class="scene-image" :src="item.files[0]" mode="aspectFill"></image>
            </view>
            <view class="scene-desc">{{ item.actor || '—' }}</view>
            <view class="scene-time">{{ item.time }}</view>
          </view>
        </view>
        <button class="light-btn" type="default" @click="addSceneNote">添加现场记录</button>
      </view>

      <view v-else class="dispose">
        <view class="section-head">
          <text class="section-title">处置情况</text>
          <text class="section-sub">处置经过时间线 + 结警补充</text>
        </view>
        <DispatchTimeline :items="timelineEntries" mode="compact" />
        <view class="close-form">
          <view class="form-row">
            <text class="form-label">处置结果</text>
            <input v-model="closeForm.result" placeholder="填写处置结果" />
          </view>
          <view class="form-row">
            <text class="form-label">主防跟进</text>
            <switch :checked="closeForm.needFollowup" @change="toggleFollowup" />
          </view>
          <button class="primary-btn" type="primary" @click="submitCloseForm">提交补充</button>
        </view>
      </view>
    </view>

    <view class="quick-bar">
      <view class="quick-btn" @click="handlePhoto">拍照取证</view>
      <view class="quick-btn" @click="handleVoice">语音记录</view>
      <view class="quick-btn primary" @click="handleNodeUpdate">节点更新</view>
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
const tabs = [
  { key: 'chat', label: '聊天交流' },
  { key: 'scene', label: '现场信息' },
  { key: 'dispose', label: '处置情况' },
];
const activeTab = ref(0);
const detailId = ref('');
const detail = ref({});
const collapsed = ref(true);

const messages = ref([]);
const chatText = ref('');

const closeForm = ref({ result: '', needFollowup: false });

const quickPhrases = [
  { text: '已出警', type: '出警' },
  { text: '已到场', type: '到场' },
  { text: '预计10分钟', type: '预计到场' },
  { text: '需增援', type: '需增援' },
  { text: '现场已稳定', type: '现场稳定' },
  { text: '建议联系家属/120', type: '联系家属/120' },
];

const sceneEntries = computed(() => detail.value.entries || []);
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
    entries: [],
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

function addSceneEntry(payload) {
  const entry = {
    id: `entry-${Date.now()}`,
    time: new Date().toLocaleString().slice(5, 16),
    actor: '我',
    type: 'text',
    content: '',
    files: [],
    ...payload,
  };
  detail.value.entries = [entry, ...(detail.value.entries || [])];
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

function sendQuickPhrase(item) {
  const now = new Date().toLocaleTimeString().slice(0, 5);
  messages.value = addChatMessage({
    id: `m-${Date.now()}`,
    user: '我',
    content: item.text,
    time: now,
    self: true,
    avatar: '/static/avatar/me.png',
  });
  addTimelineEntry({ type: item.type, note: item.text });
}

function handleNodeUpdate() {
  const nodeOptions = ['出警', '到场', '需增援', '现场稳定', '联系家属', '联系120', '结束'];
  uni.showActionSheet({
    itemList: nodeOptions,
    success: (res) => {
      const picked = nodeOptions[res.tapIndex];
      uni.showModal({
        title: '节点备注',
        editable: true,
        placeholderText: '填写备注（可选）',
        success: (modalRes) => {
          if (!modalRes.confirm) return;
          addTimelineEntry({ type: picked, note: modalRes.content || '' });
        },
      });
    },
  });
}

function handlePhoto() {
  uni.chooseImage({
    count: 3,
    sourceType: ['camera', 'album'],
    success: (res) => {
      res.tempFilePaths.forEach((path) => {
        addSceneEntry({
          type: 'photo',
          content: '拍照取证',
          files: [path],
        });
        addTimelineEntry({ type: '现场记录', note: '拍照取证' });
      });
    },
  });
}

function handleVoice() {
  uni.showModal({
    title: '语音记录',
    editable: true,
    placeholderText: '输入语音转写内容',
    success: (res) => {
      if (!res.confirm) return;
      const text = res.content || '语音记录';
      addSceneEntry({ type: 'audio', content: text });
      addTimelineEntry({ type: '语音记录', note: text });
    },
  });
}

function addSceneNote() {
  uni.showModal({
    title: '添加现场记录',
    editable: true,
    placeholderText: '输入现场记录',
    success: (res) => {
      if (!res.confirm) return;
      const text = res.content || '现场记录';
      addSceneEntry({ type: 'text', content: text });
      addTimelineEntry({ type: '现场记录', note: text });
    },
  });
}

function sceneTypeLabel(type) {
  if (type === 'photo') return '照片';
  if (type === 'audio') return '语音';
  return '文字';
}

function toggleFollowup(event) {
  closeForm.value.needFollowup = event.detail.value;
}

function submitCloseForm() {
  if (!closeForm.value.result) {
    uni.showToast({ title: '请填写处置结果', icon: 'none' });
    return;
  }
  addTimelineEntry({ type: '结警补充', note: closeForm.value.result });
  if (closeForm.value.needFollowup) {
    uni.showToast({ title: '已提示生成后续任务', icon: 'none' });
  } else {
    uni.showToast({ title: '已补充', icon: 'success' });
  }
  closeForm.value = { result: '', needFollowup: false };
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
  padding: 0 0 180rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
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
  padding: 12rpx 18rpx 220rpx;
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

.quick-phrases {
  display: flex;
  gap: 12rpx;
  padding: 6rpx 12rpx;
  background: #f2f2f2;
  border-top: 1px solid #e6e6e6;
  white-space: nowrap;
}

.phrase-chip {
  padding: 6rpx 14rpx;
  border-radius: 16rpx;
  background: #ffffff;
  color: #1f2b3a;
  font-size: 22rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}

.chat-input-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 96rpx;
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
  display: flex;
  gap: 12rpx;
}

.scene-type {
  font-size: 24rpx;
  color: #0f75ff;
}

.scene-media {
  margin-top: 8rpx;
}

.scene-image {
  width: 160rpx;
  height: 120rpx;
  border-radius: 8rpx;
  background: #ddd;
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

.light-btn {
  background: #ffffff;
  color: #0f75ff;
  border-radius: 12rpx;
  border: 1px solid #0f75ff;
  font-size: 28rpx;
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

.round-section {
  margin-top: 12rpx;
  padding: 12rpx;
  border-radius: 12rpx;
  background: #f6f8fb;
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

.close-form {
  margin-top: 14rpx;
  background: #ffffff;
  border-radius: 12rpx;
  padding: 12rpx;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0;
  border-bottom: 1px solid #eef1f4;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 26rpx;
  color: #6e7a89;
  min-width: 140rpx;
}

.quick-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 20rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
}

.quick-btn {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 14rpx;
  background: #f2f4f7;
  color: #1f2b3a;
  font-size: 26rpx;
}

.quick-btn.primary {
  background: #0f75ff;
  color: #ffffff;
}
</style>
