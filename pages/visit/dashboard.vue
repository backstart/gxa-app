<template>
  <AppPage>
    <view class="visit-dashboard pageBg">
      <view class="summary-grid">
        <view class="summary-card card">
          <text class="label">今日完成</text>
          <text class="value">{{ stats.todayDone }}</text>
        </view>
        <view class="summary-card card">
          <text class="label">今日待走访</text>
          <text class="value">{{ stats.todoCount }}</text>
        </view>
        <view class="summary-card card">
          <text class="label">逾期数</text>
          <text class="value danger">{{ stats.overdueCount }}</text>
        </view>
        <view class="summary-card card">
          <text class="label">临期数</text>
          <text class="value">{{ stats.upcomingCount }}</text>
        </view>
      </view>

      <view class="card section-card">
        <text class="section-title">人员 / 场所占比</text>
        <qiun-data-charts type="ring" :chartData="kindChartData" :opts="ringOpts" :height="300" background="none" />
      </view>

      <view class="card section-card">
        <text class="section-title">本周走访趋势</text>
        <qiun-data-charts type="line" :chartData="trendChartData" :height="320" background="none" />
      </view>

      <view class="card section-card">
        <text class="section-title">辖区分布</text>
        <qiun-data-charts type="column" :chartData="areaChartData" :height="320" background="none" />
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import qiunDataCharts from '@/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';
import { getVisitStats, queryVisitObjects } from '@/common/database.js';

const stats = reactive({
  todayDone: 0,
  todoCount: 0,
  overdueCount: 0,
  upcomingCount: 0,
});

const kindChartData = ref({ series: [{ data: [] }] });
const trendChartData = ref({ categories: [], series: [] });
const areaChartData = ref({ categories: [], series: [] });

const ringOpts = ref({
  // 环形图中心文案关闭，避免出现不相关“收益率”字样
  title: { name: '', fontSize: 1, color: 'transparent' },
  subtitle: { name: '', fontSize: 1, color: 'transparent' },
  extra: { ring: { ringWidth: 30 } },
});

function reloadDashboard() {
  // 统计页数据统一从本地聚合方法读取，后续接接口时只替换这里
  const visitStats = getVisitStats({});
  const allObjects = queryVisitObjects({ tab: 'ALL', area: 'ALL', risk: 'ALL', status: 'ALL', due: 'ALL' });
  const todoCount = allObjects.filter((item) => ['todo', 'doing'].includes(item.visitStatus)).length;
  const overdueCount = allObjects.filter((item) => item.dueStatus === 'overdue').length;
  const upcomingCount = allObjects.filter((item) => item.dueStatus === 'upcoming' || item.dueStatus === 'today').length;
  const personCount = allObjects.filter((item) => item.objectSource === 'PERSON').length;
  const placeCount = allObjects.filter((item) => item.objectSource === 'PLACE').length;

  stats.todayDone = visitStats.todayDone || 0;
  stats.todoCount = todoCount;
  stats.overdueCount = overdueCount;
  stats.upcomingCount = upcomingCount;

  kindChartData.value = {
    series: [{ data: [{ name: '人员', value: personCount }, { name: '场所', value: placeCount }] }],
  };

  trendChartData.value = {
    categories: (visitStats.trend || []).map((item) => item.date),
    series: [{ name: '走访量', data: (visitStats.trend || []).map((item) => item.value) }],
  };

  areaChartData.value = {
    categories: (visitStats.byArea || []).map((item) => item.name),
    series: [{ name: '数量', data: (visitStats.byArea || []).map((item) => item.value) }],
  };
}

onShow(() => {
  reloadDashboard();
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-dashboard {
  padding: 16rpx 24rpx 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.label {
  font-size: 24rpx;
  color: #6b7785;
}

.value {
  font-size: 44rpx;
  font-weight: 700;
  color: #1677ff;
}

.value.danger {
  color: #d64545;
}

.section-card {
  margin-top: 12rpx;
}

.section-title {
  font-size: 28rpx;
  color: #1f2b3a;
  font-weight: 700;
  margin-bottom: 8rpx;
}
</style>
