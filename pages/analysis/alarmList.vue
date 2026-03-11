<template>
  <AppPage :bg="PAGE_BG">
    <view class="alarmList pageBg">
      <view class="scopeCard card">
        <text class="scopeTitle">{{ payload.reportTitle || '分析报告：全部警情' }}</text>
        <text class="scopeLine">{{ payload.scopeTitle || '-' }}<text v-if="payload.scopeSub">（{{ payload.scopeSub }}）</text></text>
        <text class="scopeLine">辖区：{{ payload.areaLabel || '全部辖区' }}</text>
      </view>

      <view class="summaryBar card">
        <text class="summaryText">共 {{ items.length }} 条警情</text>
      </view>

      <view v-if="!items.length" class="emptyCard card">
        <text class="emptyText">当前筛选条件下暂无警情数据</text>
      </view>

      <view v-else class="listWrap">
        <view v-for="item in items" :key="item.id" class="alarmCard card">
          <view class="alarmHead">
            <view class="alarmHeadMain">
              <text class="alarmTitle">{{ item.title }}</text>
              <text :class="['statusTag', item.statusKey]">{{ item.statusText }}</text>
            </view>
            <text class="alarmTime">{{ item.timeText }}</text>
          </view>
          <text class="alarmContent">{{ item.contentPreview }}</text>
          <view class="alarmFoot">
            <text class="alarmMeta">地点：{{ item.address || '暂无地点' }}</text>
            <text class="alarmMeta">类别：{{ item.categoryLabel }}</text>
          </view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';

const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const ANALYSIS_ALARM_LIST_KEY = 'analysis_alarm_list_payload';

const payload = ref({
  reportTitle: '',
  scopeTitle: '',
  scopeSub: '',
  areaLabel: '',
  items: [],
});

const items = computed(() => {
  const source = Array.isArray(payload.value.items) ? payload.value.items : [];
  return source.map((item) => ({
    ...item,
    contentPreview: buildContentPreview(item),
  }));
});

function buildContentPreview(item) {
  if (item.contentPreview) return item.contentPreview;
  if (item.rawType === '纠纷类') return `现场因纠纷问题引发警情，报警地点位于${item.address || '相关区域'}，已通知人员处置。`;
  if (item.rawType === '交通类') return `道路通行相关警情发生在${item.address || '相关路段'}，请关注现场交通秩序与处置进展。`;
  if (item.rawType === '咨询类') return `群众就相关事项报警咨询，发生地点为${item.address || '相关区域'}，需进一步核实情况。`;
  if (item.rawType === '紧急求助') return `群众发起紧急求助，报警位置在${item.address || '相关区域'}，现场需及时响应。`;
  if (item.rawType === '刑事' || item.rawType === '行政') return `${item.rawType}类警情发生于${item.address || '相关区域'}，目前已纳入处置流程。`;
  return `警情发生在${item.address || '相关区域'}，目前系统已记录并纳入分析范围。`;
}

function loadPayload() {
  const stored = uni.getStorageSync(ANALYSIS_ALARM_LIST_KEY);
  if (stored && typeof stored === 'object') {
    payload.value = stored;
    return;
  }
  payload.value = {
    reportTitle: '分析报告：全部警情',
    scopeTitle: '',
    scopeSub: '',
    areaLabel: '全部辖区',
    items: [],
  };
}

onLoad(loadPayload);
onShow(loadPayload);
</script>

<style lang="scss" scoped>
.alarmList {
  min-height: 100vh;
  padding: 8rpx 24rpx 32rpx;
  box-sizing: border-box;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(18, 38, 63, 0.08);
}

.scopeCard {
  padding: 20rpx 20rpx 18rpx;
  margin-bottom: 16rpx;
}

.scopeTitle {
  display: block;
  font-size: 32rpx;
  line-height: 1.35;
  color: #1b2b43;
  font-weight: 700;
}

.scopeLine {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7b8799;
}

.summaryBar {
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
}

.summaryText {
  font-size: 26rpx;
  color: #4c5c74;
  font-weight: 600;
}

.listWrap {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.alarmCard {
  padding: 18rpx 20rpx 16rpx;
}

.alarmHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.alarmHeadMain {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.alarmTitle {
  font-size: 30rpx;
  line-height: 1.35;
  color: #1b2b43;
  font-weight: 700;
  min-width: 0;
}

.alarmTime {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #99a4b5;
  line-height: 1.3;
}

.statusTag {
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.statusTag.done {
  background: #e8f8ef;
  color: #1d9d5c;
}

.statusTag.pending {
  background: #fff6e6;
  color: #c88719;
}

.statusTag.overdue {
  background: #ffecec;
  color: #d64545;
}

.alarmContent {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: #5f6d83;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alarmFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 10rpx;
}

.alarmMeta {
  font-size: 24rpx;
  color: #7b8799;
  line-height: 1.4;
}

.emptyCard {
  padding: 42rpx 24rpx;
  text-align: center;
}

.emptyText {
  font-size: 26rpx;
  color: #7b8799;
}
</style>
