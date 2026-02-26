<template>
  <AppPage>
    <view class="visit-stat pageBg">
      <!-- 统计页筛选：保持轻量，避免切筛选影响阅读节奏 -->
      <view class="filter-row card">
        <picker class="filter-item" :range="areaLabels" @change="onAreaChange">
          <view class="filter-text">{{ currentAreaLabel }} ▾</view>
        </picker>
        <picker class="filter-item" :range="riskLabels" @change="onRiskChange">
          <view class="filter-text">{{ currentRiskLabel }} ▾</view>
        </picker>
      </view>

      <view class="summary-grid">
        <view class="summary-item card">
          <text class="title">今日完成</text>
          <text class="value">{{ stats.todayDone }}</text>
        </view>
        <view class="summary-item card">
          <text class="title">发现问题</text>
          <text class="value">{{ stats.issueCount }}</text>
        </view>
        <view class="summary-item card">
          <text class="title">待回访</text>
          <text class="value">{{ stats.revisitCount }}</text>
        </view>
        <view class="summary-item card">
          <text class="title">累计走访</text>
          <text class="value">{{ stats.total }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-title">本周走访趋势</view>
        <qiun-data-charts type="line" :chartData="trendChartData" :height="320" background="none" />
      </view>

      <view class="card">
        <view class="section-title">类型占比</view>
        <qiun-data-charts type="ring" :chartData="typeChartData" :opts="ringOpts" :height="320" background="none" />
      </view>

      <view class="card">
        <view class="section-title">辖区对比</view>
        <qiun-data-charts type="column" :chartData="areaChartData" :height="320" background="none" />
      </view>

      <view class="card">
        <view class="section-title">辖区统计表</view>
        <view v-if="stats.byArea.length === 0" class="empty-text">暂无统计数据</view>
        <view v-else>
          <view class="table-head">
            <text class="cell name">辖区</text>
            <text class="cell">数量</text>
            <text class="cell">占比</text>
          </view>
          <view v-for="row in areaTableRows" :key="row.name" class="table-row">
            <text class="cell name">{{ row.name }}</text>
            <text class="cell">{{ row.value }}</text>
            <text class="cell">{{ row.percent }}%</text>
          </view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import qiunDataCharts from '@/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';
import { getVisitStats } from '@/common/database.js';
import { VISIT_AREA_OPTIONS, VISIT_RISK_OPTIONS } from './helper.js';

const filters = reactive({
  area: 'ALL',
  risk: 'ALL',
});

const areaLabels = VISIT_AREA_OPTIONS.map((item) => item.label);
const riskLabels = VISIT_RISK_OPTIONS.map((item) => item.label);
const currentAreaLabel = computed(() => VISIT_AREA_OPTIONS.find((item) => item.value === filters.area)?.label || '全部辖区');
const currentRiskLabel = computed(() => VISIT_RISK_OPTIONS.find((item) => item.value === filters.risk)?.label || '全部风险');

const stats = reactive({
  total: 0,
  todayDone: 0,
  issueCount: 0,
  revisitCount: 0,
  trend: [],
  byArea: [],
  byType: [],
});

const trendChartData = ref({ categories: [], series: [] });
const typeChartData = ref({ series: [{ data: [] }] });
const areaChartData = ref({ categories: [], series: [] });
const ringOpts = ref({
  // 关闭环图中心标题，避免出现“收益率”文案
  title: { name: '', fontSize: 1, color: 'transparent' },
  subtitle: { name: '', fontSize: 1, color: 'transparent' },
  extra: { ring: { ringWidth: 30 } },
});

const areaTableRows = computed(() => {
  const total = stats.byArea.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  return stats.byArea.map((item) => ({
    ...item,
    percent: Number(((Number(item.value || 0) / total) * 100).toFixed(1)),
  }));
});

function reload() {
  // 统计页只走一个方法，保证图表与表格口径一致
  const data = getVisitStats(filters);
  stats.total = data.total || 0;
  stats.todayDone = data.todayDone || 0;
  stats.issueCount = data.issueCount || 0;
  stats.revisitCount = data.revisitCount || 0;
  stats.trend = data.trend || [];
  stats.byArea = data.byArea || [];
  stats.byType = data.byType || [];

  trendChartData.value = {
    categories: stats.trend.map((item) => item.date),
    series: [{ name: '走访量', data: stats.trend.map((item) => item.value) }],
  };
  typeChartData.value = {
    series: [{ data: stats.byType.map((item) => ({ name: item.name, value: item.value })) }],
  };
  areaChartData.value = {
    categories: stats.byArea.map((item) => item.name),
    series: [{ name: '数量', data: stats.byArea.map((item) => item.value) }],
  };
}

function onAreaChange(e) {
  filters.area = VISIT_AREA_OPTIONS[Number(e.detail.value)]?.value || 'ALL';
  reload();
}

function onRiskChange(e) {
  filters.risk = VISIT_RISK_OPTIONS[Number(e.detail.value)]?.value || 'ALL';
  reload();
}

onShow(() => {
  reload();
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-stat {
  padding: 16rpx 24rpx 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.filter-row {
  display: flex;
  gap: 10rpx;
}

.filter-item {
  flex: 1;
  min-width: 0;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 10rpx;
  padding: 10rpx 12rpx;
}

.filter-text {
  color: #1677ff;
  font-size: 24rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-grid {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.title {
  font-size: 24rpx;
  color: #6b7785;
}

.value {
  font-size: 44rpx;
  font-weight: 700;
  color: #1677ff;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2b3a;
  margin-bottom: 8rpx;
}

.card {
  margin-top: 12rpx;
}

.table-head,
.table-row {
  display: flex;
  padding: 10rpx 0;
  border-bottom: 1px solid #eef2f7;
}

.cell {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #4b5563;
  text-align: center;
}

.cell.name {
  text-align: left;
}

.empty-text {
  text-align: center;
  color: #98a2b3;
  font-size: 24rpx;
  padding: 24rpx 0;
}
</style>

