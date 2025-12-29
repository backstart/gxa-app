<template>
  <view class="analysis pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">警情分析</view>
        <view class="sub">周期：{{ periodLabel }}</view>
      </view>
      <view class="chips">
        <view v-for="p in periods" :key="p.value" :class="['chip', period === p.value ? 'active' : '']" @click="switchPeriod(p.value)">{{ p.label }}</view>
      </view>
    </view>

    <view class="card metrics">
      <view class="metric" v-for="m in metrics" :key="m.key">
        <view class="metric-top">
          <text class="metric-title">{{ m.title }}</text>
          <view :class="['trend', m.trend]">{{ m.trendText }}</view>
        </view>
        <view class="metric-value">{{ m.value }}</view>
        <view class="metric-desc">{{ m.desc }}</view>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">总结</text>
      </view>
      <view class="summary">{{ summary }}</view>
    </view>

    <view class="action-bar">
      <button class="ghost-btn" @click="goBackMap">返回地图</button>
      <button type="primary" class="submit-btn" @click="goDispatch">去派单</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const periods = [
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
];

const period = ref('week');
const periodLabel = ref('周');

const metrics = ref([]);
const summary = ref('');

const dataByPeriod = {
  week: {
    metrics: [
      { key: 'total', title: '总量', value: 128, trend: 'up', trendText: '同比 +8%', desc: '警情总数' },
      { key: 'prevent', title: '可防性', value: 52, trend: 'flat', trendText: '环比 +1%', desc: '可防性警情' },
      { key: 'dispute', title: '纠纷类', value: 34, trend: 'down', trendText: '同比 -3%', desc: '邻里/家庭纠纷' },
      { key: 'repeatAddr', title: '重复地址', value: 6, trend: 'up', trendText: '新增 +2', desc: '重点关注地址' },
      { key: 'repeatPerson', title: '重复人员', value: 5, trend: 'flat', trendText: '持平', desc: '高频报警人' },
      { key: 'closure', title: '闭环率', value: '86%', trend: 'up', trendText: '环比 +4%', desc: '闭环完成率' },
    ],
    summary: '本周警情总量小幅上升，可防性警情保持平稳，纠纷类下降。重复地址和高频报警人需重点巡查，闭环率较上周提升。',
  },
  month: {
    metrics: [
      { key: 'total', title: '总量', value: 532, trend: 'up', trendText: '同比 +5%', desc: '警情总数' },
      { key: 'prevent', title: '可防性', value: 210, trend: 'up', trendText: '环比 +6%', desc: '可防性警情' },
      { key: 'dispute', title: '纠纷类', value: 140, trend: 'down', trendText: '同比 -2%', desc: '邻里/家庭纠纷' },
      { key: 'repeatAddr', title: '重复地址', value: 14, trend: 'up', trendText: '新增 +3', desc: '重点关注地址' },
      { key: 'repeatPerson', title: '重复人员', value: 12, trend: 'flat', trendText: '持平', desc: '高频报警人' },
      { key: 'closure', title: '闭环率', value: '83%', trend: 'up', trendText: '环比 +2%', desc: '闭环完成率' },
    ],
    summary: '本月警情总体平稳，可防性与闭环率均有提升，纠纷类略有下降。重复地址/人员仍是重点关注对象，建议结合巡逻与走访加强干预。',
  },
};

function switchPeriod(val) {
  period.value = val;
  periodLabel.value = val === 'week' ? '周' : '月';
  loadData();
}

function loadData() {
  const data = dataByPeriod[period.value];
  metrics.value = data.metrics;
  summary.value = data.summary;
}

function goBackMap() {
  uni.navigateBack();
}

function goDispatch() {
  uni.navigateTo({ url: '/pages/dispatch/assign?sourceType=AREA' });
}

onLoad(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.analysis {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
}
.header {
  padding: 10rpx 0 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    font-size: 44rpx;
    font-weight: 700;
  }
  .sub {
    margin-top: 6rpx;
    color: #6e7a89;
    font-size: 26rpx;
  }
}
.chips {
  display: flex;
  gap: 10rpx;
}
.chip {
  padding: 10rpx 14rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  font-size: 24rpx;
}
.chip.active {
  background: #0f75ff;
  color: #fff;
}
.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  .metric {
    padding: 12rpx;
    border-radius: 12rpx;
    background: #f6f8fb;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  }
  .metric-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .metric-title {
    font-size: 28rpx;
  }
  .trend {
    font-size: 22rpx;
    color: #6e7a89;
  }
  .trend.up { color: #1b9d5d; }
  .trend.down { color: #d64545; }
  .trend.flat { color: #6e7a89; }
  .metric-value {
    font-size: 44rpx;
    font-weight: 700;
    color: #0f75ff;
    margin: 6rpx 0;
  }
  .metric-desc {
    color: #6b7785;
    font-size: 24rpx;
  }
}
.section-head {
  margin-bottom: 10rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 700;
}
.summary {
  font-size: 28rpx;
  color: #1f2b3a;
  line-height: 1.5;
}
.action-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 10rpx 20rpx 20rpx;
  background: rgba(255,255,255,0.95);
  display: flex;
  gap: 10rpx;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
}
.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 10rpx;
  padding: 0 14rpx;
}
.submit-btn {
  flex: 1;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}
</style>
