<template>
  <view class="select-page pageBg">
    <view class="status-bar"></view>
    <view class="header">
      <text class="title">选择事项</text>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-for="item in cases" :key="item.id" class="case-card" :class="{ active: selectedId === item.id }" @click="toggleSelect(item)">
        <view class="case-head">
          <text class="case-title">{{ item.title }}</text>
          <view class="case-tags">
            <text :class="['tag', riskClass(item.level)]">{{ item.level }}</text>
            <text class="tag status">{{ item.status }}</text>
          </view>
        </view>
        <view class="case-meta">编号：{{ item.no }}</view>
        <view class="case-row">
          <text class="case-addr">{{ item.addr }}</text>
          <text class="case-time">{{ item.time }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="ghost-btn" @click="cancel">取消</button>
      <button class="primary-btn" :class="{ disabled: !selectedId }" @click="confirm">确认选择</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const cases = ref([
  { id: 'case-1', title: '桂南路口纠纷', no: 'JJ20260201001', addr: '桂南路口', time: '2026-02-01 09:10', level: '高', status: '未处置' },
  { id: 'case-2', title: '江北报警', no: 'JJ20260201002', addr: '江北街道', time: '2026-02-01 10:05', level: '中', status: '处理中' },
  { id: 'case-3', title: '龙石噪音警情', no: 'JJ20260201003', addr: '龙石社区', time: '2026-02-01 10:40', level: '低', status: '未处置' },
  { id: 'case-4', title: '市场治安巡查', no: 'JJ20260201004', addr: '江北市场', time: '2026-02-01 11:15', level: '中', status: '处理中' },
  { id: 'case-5', title: '夜间斗殴报警', no: 'JJ20260201005', addr: '桂南社区', time: '2026-02-01 12:30', level: '高', status: '未处置' },
  { id: 'case-6', title: '车辆剐蹭纠纷', no: 'JJ20260201006', addr: '龙石路段', time: '2026-02-01 13:20', level: '低', status: '已结案' },
  { id: 'case-7', title: '出租屋纠纷', no: 'JJ20260201007', addr: '桂南小区', time: '2026-02-01 14:05', level: '中', status: '未处置' },
  { id: 'case-8', title: '可疑人员盘查', no: 'JJ20260201008', addr: '江北商圈', time: '2026-02-01 15:40', level: '中', status: '处理中' },
  { id: 'case-9', title: '治安案件回访', no: 'JJ20260201009', addr: '龙石广场', time: '2026-02-01 16:10', level: '低', status: '已结案' },
  { id: 'case-10', title: '群体性报警', no: 'JJ20260201010', addr: '桂南广场', time: '2026-02-01 17:25', level: '高', status: '未处置' },
]);

const selectedId = ref('');

function toggleSelect(item) {
  selectedId.value = selectedId.value === item.id ? '' : item.id;
}

function cancel() {
  uni.navigateBack();
}

function confirm() {
  if (!selectedId.value) {
    uni.showToast({ title: '请选择一条警情', icon: 'none' });
    return;
  }
  const chosen = cases.value.find((c) => c.id === selectedId.value);
  const channel = getEventChannel();
  if (channel) channel.emit('select', chosen);
  uni.navigateBack();
}

function getEventChannel() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  return current?.getOpenerEventChannel ? current.getOpenerEventChannel() : null;
}

function riskClass(risk) {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  return 'low';
}
</script>

<style lang="scss" scoped>
.select-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.select-page,
.select-page * {
  box-sizing: border-box;
}

.status-bar {
  height: 40rpx;
}

.header {
  padding: 12rpx 24rpx 8rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.content {
  flex: 1;
  padding: 0 24rpx calc(140rpx + env(safe-area-inset-bottom));
}

.case-card {
  padding: 14rpx;
  border-radius: 12rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(0,0,0,0.06);
  margin-bottom: 12rpx;
  border: 1px solid transparent;
}
.case-card.active {
  border-color: #0f75ff;
  background: #f3f7ff;
}
.case-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.case-title {
  font-size: 28rpx;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.case-tags { display: flex; gap: 6rpx; }
.tag { padding: 4rpx 10rpx; border-radius: 10rpx; font-size: 22rpx; }
.tag.status { background: #eef1f5; color: #6b7785; }
.high { background: #ffecec; color: #d64545; }
.medium { background: #fff6e6; color: #c88719; }
.low { background: #e6f7ed; color: #1b9d5d; }
.case-meta { color: #6b7785; font-size: 24rpx; margin-top: 6rpx; }
.case-row { display: flex; justify-content: space-between; gap: 8rpx; margin-top: 4rpx; color: #6b7785; font-size: 24rpx; }
.case-addr { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.case-time { flex-shrink: 0; }

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12rpx;
  padding: 12rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.ghost-btn {
  flex: 1;
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
  height: 72rpx;
  line-height: 72rpx;
}
.primary-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}
.primary-btn.disabled { background: #eef1f5; color: #a0a8b3; }
</style>
