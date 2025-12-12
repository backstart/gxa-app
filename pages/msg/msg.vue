<template>
  <view class="chat-list-page">
    <!-- Chat list -->
    <scroll-view scroll-y class="chat-list">
      <view v-for="item in chatList" :key="item.id" class="chat-item" @click="openChat(item)">
        <image :src="item.avatar" class="avatar" />
        <view class="info">
          <view class="top-row">
            <text class="name">{{ item.name }}</text>
            <text class="time">{{ item.time }}</text>
          </view>
          <view class="last-msg">{{ item.lastMsg }}</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const chatList = ref([
  {
    id: 1,
    name: '张三',
    avatar: '/static/msg/avatar1.png',
    time: '16:20',
    lastMsg: '好的，我知道了'
  },
  {
    id: 2,
    name: '李四',
    avatar: '/static/msg/avatar2.png',
    time: '15:02',
    lastMsg: '[图片]'
  }
])

const openChat = (item) => {
  uni.navigateTo({
    url: `/pages/msgDetail/msgDetail?id=${item.id}`
  })
}
</script>

<style scoped>
.chat-list-page {
  height: 100vh;
  background-color: #fff;
}
.chat-list {
  height: 100%;
}
.chat-item {
  display: flex;
  padding: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 10rpx;
}
.info {
  margin-left: 20rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.top-row {
  display: flex;
  justify-content: space-between;
}
.name {
  font-size: 32rpx;
  font-weight: 600;
}
.time {
  font-size: 26rpx;
  color: #999;
}
.last-msg {
  margin-top: 10rpx;
  font-size: 28rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
