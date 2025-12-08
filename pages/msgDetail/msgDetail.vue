<template>
  <view class="chat-detail-page">
    <!-- Navigation bar (simulate WeChat style) -->
    <view class="nav-bar">{{ title }}</view>

    <!-- Messages -->
    <scroll-view scroll-y class="msg-container" :scroll-top="scrollTop">
      <view v-for="msg in msgList" :key="msg.id" class="msg-item" :class="msg.from">
        <image class="avatar" :src="msg.avatar" />
        <view class="bubble" :class="msg.from">
          <!-- Images -->
          <image v-if="msg.type==='image'" :src="msg.content" class="msg-img" />

          <!-- Videos -->
          <video v-else-if="msg.type==='video'" :src="msg.content" class="msg-video" />

          <!-- Text -->
          <text v-else class="msg-text">{{ msg.content }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- Input bar -->
    <view>
      <view class="input-bar">
        <image src="/static/icons/voice.png" class="tool-icon" />
        <input class="input" v-model="text" placeholder="消息..." />

        <image src="/static/icons/emoji.png" class="tool-icon" />
        <image src="/static/icons/add.png" class="tool-icon" @click="togglePlus" />
      </view>

      <!-- + panel (WeChat style) -->
      <view v-if="showPlus" class="plus-panel">
        <view class="plus-item" @click="chooseImage">
          <image src="/static/icons/photo.png" class="plus-icon" />
          <text>图片</text>
        </view>
        <view class="plus-item" @click="chooseVideo">
          <image src="/static/icons/video.png" class="plus-icon" />
          <text>视频</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('聊天详情')
const scrollTop = ref(0)
const text = ref('')

const showPlus = ref(false)
const msgList = ref([
  {
    id: 1,
    from: 'other',
    avatar: '/static/avatar2.png',
    type: 'text',
    content: '你好'
  },
  {
    id: 2,
    from: 'me',
    avatar: '/static/avatar1.png',
    type: 'text',
    content: '你好，有什么可以帮你？'
  }
])

const togglePlus = () => {
  showPlus.value = !showPlus.value
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: res => {
      msgList.value.push({ id: Date.now(), from: 'me', avatar: '/static/avatar1.png', type: 'image', content: res.tempFilePaths[0] })
    }
  })
}

const chooseVideo = () => {
  uni.chooseVideo({
    success: res => {
      msgList.value.push({ id: Date.now(), from: 'me', avatar: '/static/avatar1.png', type: 'video', content: res.tempFilePath })
    }
  })
}

</script>

<style scoped>
.chat-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #ececec;
}

.nav-bar {
  height: 88rpx;
  background-color: #ededed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
}

.msg-container {
  flex: 1;
  padding: 20rpx;
}

.msg-item {
  display: flex;
  margin-bottom: 20rpx;
}

.msg-item.me {
  flex-direction: row-reverse;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  margin: 0 16rpx;
}

.bubble {
  max-width: 70%;
  padding: 20rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  word-break: break-word;
}

.bubble.other {
  background-color: #ffffff;
  border: 1px solid #e3e3e3;
}

.bubble.me {
  background-color: #95ec69;
}

.msg-text {}

.msg-img {
  width: 300rpx;
  border-radius: 12rpx;
}

.msg-video {
  width: 400rpx;
  border-radius: 12rpx;
}

.input-bar {
  height: 100rpx;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
}

.tool-icon {
  width: 60rpx;
  height: 60rpx;
  margin: 0 12rpx;
}

.input {
  flex: 1;
  background-color: #fff;
  height: 70rpx;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 28rpx;
}
.plus-panel {
  background-color: #f7f7f7;
  padding: 30rpx 0;
  display: flex;
  flex-wrap: wrap;
  border-top: 1px solid #ddd;
}
.plus-item {
  width: 25%;
  padding: 20rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.plus-icon {
  width: 90rpx;
  height: 90rpx;
  margin-bottom: 10rpx;
}
</style>
