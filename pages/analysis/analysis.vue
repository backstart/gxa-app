<template>
  <view class="analysis pageBg">
    <view class="statuBar"></view>
    <view class="header">
      <view>
        <view class="title">警情分析</view>
        <view class="sub">多维筛选 / 对比分析</view>
      </view>
      <button size="mini" class="ghost-btn" @click="resetFilters">重置</button>
    </view>

    <view class="filter-bar sticky">
      <view class="filter-item" @click="openDropdown('granularity')">
        <text>{{ granularityLabel }}</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="openDropdown('period')">
        <text>{{ periodLabel }}</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="openDropdown('compare')">
        <text>{{ compareLabel }}</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="openDropdown('type')">
        <text>类型({{ filters.types.length }})</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="openDropdown('area')">
        <text>{{ filters.area }}</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="openDropdown('dimension')">
        <text>{{ dimLabel }}</text>
        <text class="arrow">▼</text>
      </view>
    </view>

    <!-- 下拉面板 -->
    <view class="dropdown-mask" v-if="dropdown.visible" @click="closeDropdown"></view>
    <view class="dropdown-panel" v-if="dropdown.visible">
      <view class="dropdown-content" v-if="dropdown.key==='granularity'">
        <view class="option" v-for="g in granularityOptions" :key="g" :class="filters.granularity===g?'active':''" @click.stop="setGranularity(g)">{{ g }}</view>
      </view>
      <view class="dropdown-content" v-else-if="dropdown.key==='period'">
        <view class="option" v-for="p in periodOptions" :key="p.value" :class="filters.period===p.value?'active':''" @click.stop="setPeriod(p.value)">{{ p.label }}</view>
      </view>
      <view class="dropdown-content" v-else-if="dropdown.key==='compare'">
        <view class="option" v-for="c in compareOptions" :key="c.value" :class="filters.compare===c.value?'active':''" @click.stop="setCompare(c.value)">{{ c.label }}</view>
      </view>
      <view class="dropdown-content" v-else-if="dropdown.key==='type'">
        <view class="option multi" v-for="t in typeOptions" :key="t" :class="filters.types.includes(t)?'active':''" @click.stop="toggleType(t)">{{ t }}</view>
        <view class="dropdown-actions">
          <button size="mini" @click.stop="selectAllTypes">全选</button>
          <button size="mini" @click.stop="closeDropdown">完成</button>
        </view>
      </view>
      <view class="dropdown-content" v-else-if="dropdown.key==='area'">
        <view class="option" v-for="a in areaOptions" :key="a" :class="filters.area===a?'active':''" @click.stop="setArea(a)">{{ a }}</view>
      </view>
      <view class="dropdown-content" v-else-if="dropdown.key==='dimension'">
        <view class="option" v-for="d in dimOptions" :key="d.value" :class="filters.dimension===d.value?'active':''" @click.stop="setDimension(d.value)">{{ d.label }}</view>
      </view>
    </view>

    <view class="card metrics">
      <view class="metric" v-for="m in metricCards" :key="m.key">
        <view class="metric-top">
          <text class="metric-title">{{ m.title }}</text>
          <view class="trend">
            环比 {{ m.mom }}% | 同比 {{ m.yoy }}%
          </view>
        </view>
        <view class="metric-value">{{ m.value }}</view>
        <view class="metric-desc">{{ m.desc }}</view>
      </view>
    </view>

    <view class="card tabs">
      <view class="tab" :class="viewMode==='chart'?'active':''" @click="viewMode='chart'">图表</view>
      <view class="tab" :class="viewMode==='table'?'active':''" @click="viewMode='table'">表格</view>
    </view>

    <view v-if="viewMode==='chart'">
      <view class="card">
        <view class="section-head">
          <text class="section-title">趋势</text>
          <text class="section-sub">本期/上期/去年同期</text>
        </view>
        <qiun-data-charts type="line" :chartData="trendChartData" background="none" :height="380" />
      </view>

      <view class="card">
        <view class="section-head">
          <text class="section-title">结构对比</text>
          <text class="section-sub">本期 vs 对比期</text>
        </view>
        <qiun-data-charts type="column" :chartData="barChartData" background="none" :height="380" />
      </view>

      <view class="card">
        <view class="section-head">
          <text class="section-title">类型占比</text>
        </view>
        <qiun-data-charts type="ring" :chartData="pieChartData" background="none" :height="320" />
      </view>

      <view class="card">
        <view class="section-head">
          <text class="section-title">热点 Top10</text>
        </view>
        <qiun-data-charts type="bar" :chartData="topChartData" background="none" :height="420" />
      </view>
    </view>

    <view v-else class="card table-card">
      <view class="section-head">
        <text class="section-title">表格</text>
        <view class="chips">
          <view class="chip" @click="sortBy('cur')">本期</view>
          <view class="chip" @click="sortBy('mom')">环比</view>
          <view class="chip" @click="sortBy('yoy')">同比</view>
        </view>
      </view>
      <scroll-view scroll-x class="table">
        <view class="thead">
          <text class="cell name">维度</text>
          <text class="cell">本期</text>
          <text class="cell">上期</text>
          <text class="cell">环比%</text>
          <text class="cell">去年同期</text>
          <text class="cell">同比%</text>
        </view>
        <view class="tbody">
          <view class="row" v-for="row in tableRows" :key="row.name">
            <text class="cell name">{{ row.name }}</text>
            <text class="cell">{{ row.cur }}</text>
            <text class="cell">{{ row.prev }}</text>
            <text class="cell">{{ row.mom }}</text>
            <text class="cell">{{ row.yoyBase }}</text>
            <text class="cell">{{ row.yoy }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="action-bar">
      <button class="ghost-btn" @click="goMap">返回地图</button>
      <button type="primary" class="submit-btn" @click="goDispatch">去派单</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import qiunDataCharts from '@/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';

const granularityOptions = ['天', '周', '月'];
const periodOptions = [
  { value: 7, label: '7天' },
  { value: 30, label: '30天' },
];
const compareOptions = [
  { value: 'prev', label: '对比上期' },
  { value: 'lastYear', label: '对比去年' },
];
const typeOptions = ['纠纷', '治安', '求助', '其他'];
const areaOptions = ['全部', '一警务区', '二警务区'];
const dimOptions = [
  { value: 'type', label: '按类型' },
  { value: 'area', label: '按辖区' },
  { value: 'time', label: '按时段' },
];

const filters = reactive({
  granularity: 'day',
  period: 7,
  compare: 'prev',
  types: [...typeOptions],
  area: '全部',
  dimension: 'type',
});

const dropdown = reactive({
  visible: false,
  key: '',
});

const granularityLabel = computed(() => filters.granularity);
const periodLabel = computed(() => `${filters.period}天`);
const compareLabel = computed(() => (filters.compare === 'prev' ? '对比上期' : '对比去年'));
const dimLabel = computed(() => dimOptions.find((d) => d.value === filters.dimension)?.label || '按类型');

// mock incidents
const rawIncidents = ref(generateMockIncidents());

const metricCards = ref([
  { key: 'total', title: '警情总量', value: 0, mom: 0, yoy: 0, desc: '本期' },
  { key: 'dispute', title: '纠纷类', value: 0, mom: 0, yoy: 0, desc: '纠纷警情' },
  { key: 'prevent', title: '可防性', value: 0, mom: 0, yoy: 0, desc: '可防性警情' },
  { key: 'closure', title: '闭环率', value: '0%', mom: 0, yoy: 0, desc: '已回告/总量' },
]);

const trendChartData = ref({ categories: [], series: [] });
const barChartData = ref({ categories: [], series: [] });
const pieChartData = ref({ series: [{ data: [] }] });
const topChartData = ref({ categories: [], series: [] });

const tableRows = ref([]);
const sortState = ref({ key: 'cur', asc: false });
const viewMode = ref('chart');

onShow(() => {
  recalc();
});

watch(filters, () => recalc(), { deep: true });

function resetFilters() {
  filters.granularity = 'day';
  filters.period = 7;
  filters.compare = 'prev';
  filters.types = [...typeOptions];
  filters.area = '全部';
  filters.dimension = 'type';
}

function toggleType(t) {
  if (filters.types.includes(t)) filters.types = filters.types.filter((x) => x !== t);
  else filters.types.push(t);
}

function selectAllTypes() {
  filters.types = [...typeOptions];
}

function openDropdown(key) {
  dropdown.visible = true;
  dropdown.key = key;
}

function closeDropdown() {
  dropdown.visible = false;
  dropdown.key = '';
}

function setGranularity(val) {
  filters.granularity = val;
  closeDropdown();
}
function setPeriod(val) {
  filters.period = val;
  closeDropdown();
}
function setCompare(val) {
  filters.compare = val;
  closeDropdown();
}
function setArea(val) {
  filters.area = val;
  closeDropdown();
}
function setDimension(val) {
  filters.dimension = val;
  closeDropdown();
}

function recalc() {
  const { curRange, prevRange, lastYearRange } = buildRanges(filters.period);
  const curData = filterIncidents(curRange);
  const prevData = filters.compare === 'prev' ? filterIncidents(prevRange) : filterIncidents(lastYearRange);
  const lastYearData = filterIncidents(lastYearRange);

  calcMetrics(curData, prevData, lastYearData);
  buildTrend(curData, prevData, lastYearData);
  buildBar(curData, filters.compare === 'prev' ? prevData : lastYearData);
  buildPie(curData);
  buildTop(curData);
  buildTable(curData, filters.compare === 'prev' ? prevData : lastYearData, lastYearData);
}

function buildRanges(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  const prevEnd = new Date(end);
  prevEnd.setDate(prevEnd.getDate() - days);
  const lyStart = new Date(start);
  lyStart.setFullYear(lyStart.getFullYear() - 1);
  const lyEnd = new Date(end);
  lyEnd.setFullYear(lyEnd.getFullYear() - 1);
  return {
    curRange: [start, end],
    prevRange: [prevStart, prevEnd],
    lastYearRange: [lyStart, lyEnd],
  };
}

function filterIncidents([start, end]) {
  return rawIncidents.value.filter((i) => {
    const t = new Date(i.time);
    const inRange = t >= start && t <= end;
    const typeMatch = filters.types.includes(i.type);
    const areaMatch = filters.area === '全部' || i.area === filters.area;
    return inRange && typeMatch && areaMatch;
  });
}

function calcMetrics(cur, prev, ly) {
  const totalCur = cur.length;
  const totalPrev = prev.length || 0;
  const totalLy = ly.length || 0;
  const disputeCur = cur.filter((i) => i.type === '纠纷').length;
  const disputePrev = prev.filter((i) => i.type === '纠纷').length || 0;
  const disputeLy = ly.filter((i) => i.type === '纠纷').length || 0;
  const preventCur = cur.filter((i) => i.isPreventable).length;
  const preventPrev = prev.filter((i) => i.isPreventable).length || 0;
  const preventLy = ly.filter((i) => i.isPreventable).length || 0;
  const closureCur = cur.filter((i) => i.status === 'FEEDBACKED').length;
  const closurePrev = prev.filter((i) => i.status === 'FEEDBACKED').length || 0;
  const closureLy = ly.filter((i) => i.status === 'FEEDBACKED').length || 0;
  const closureRateCur = totalCur ? ((closureCur / totalCur) * 100).toFixed(0) + '%' : '0%';

  metricCards.value = [
    { key: 'total', title: '警情总量', value: totalCur, mom: pct(totalCur, totalPrev), yoy: pct(totalCur, totalLy), desc: '本期' },
    { key: 'dispute', title: '纠纷类', value: disputeCur, mom: pct(disputeCur, disputePrev), yoy: pct(disputeCur, disputeLy), desc: '纠纷警情' },
    { key: 'prevent', title: '可防性', value: preventCur, mom: pct(preventCur, preventPrev), yoy: pct(preventCur, preventLy), desc: '可防性警情' },
    { key: 'closure', title: '闭环率', value: closureRateCur, mom: pct(closureCur, closurePrev), yoy: pct(closureCur, closureLy), desc: '已回告/总量' },
  ];
}

function buildTrend(cur, prev, ly) {
  const buckets = buildBuckets(filters.granularity, filters.period);
  const curAgg = aggByBucket(cur, buckets);
  const prevAgg = aggByBucket(prev, buckets, filters.compare === 'prev' ? -1 : 0);
  const lyAgg = aggByBucket(ly, buckets, 0, -1);

  trendChartData.value = {
    categories: buckets.map((b) => b.label),
    series: [
      { name: '本期', data: curAgg },
      { name: '上期', data: prevAgg },
      { name: '去年同期', data: lyAgg },
    ],
  };
}

function buildBar(cur, compareData) {
  let categories = [];
  let curSeries = [];
  let cmpSeries = [];
  if (filters.dimension === 'type') {
    categories = filters.types;
    curSeries = categories.map((c) => cur.filter((i) => i.type === c).length);
    cmpSeries = categories.map((c) => compareData.filter((i) => i.type === c).length);
  } else if (filters.dimension === 'area') {
    categories = areaOptions;
    curSeries = categories.map((a) => (a === '全部' ? cur.length : cur.filter((i) => i.area === a).length));
    cmpSeries = categories.map((a) => (a === '全部' ? compareData.length : compareData.filter((i) => i.area === a).length));
  } else {
    // 按时段（小时段简单模拟）
    categories = ['0-6', '6-12', '12-18', '18-24'];
    curSeries = categories.map((c) => cur.filter((i) => bucketHour(i.time) === c).length);
    cmpSeries = categories.map((c) => compareData.filter((i) => bucketHour(i.time) === c).length);
  }
  barChartData.value = {
    categories,
    series: [
      { name: '本期', data: curSeries },
      { name: '对比期', data: cmpSeries },
    ],
  };
}

function buildPie(cur) {
  pieChartData.value = {
    series: [
      {
        data: filters.types.map((t) => ({
          name: t,
          value: cur.filter((i) => i.type === t).length,
        })),
      },
    ],
  };
}

function buildTop(cur) {
  const map = {};
  cur.forEach((i) => {
    const key = i.address || '未知地址';
    map[key] = (map[key] || 0) + 1;
  });
  const arr = Object.entries(map)
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 10);
  topChartData.value = {
    categories: arr.map((a) => a.name),
    series: [{ name: '警情数', data: arr.map((a) => a.val) }],
  };
}

function buildTable(cur, cmp, ly) {
  const rows = [];
  if (filters.dimension === 'type') {
    filters.types.forEach((t) => {
      const curVal = cur.filter((i) => i.type === t).length;
      const cmpVal = cmp.filter((i) => i.type === t).length;
      const lyVal = ly.filter((i) => i.type === t).length;
      rows.push(makeRow(t, curVal, cmpVal, lyVal));
    });
  } else if (filters.dimension === 'area') {
    areaOptions.forEach((a) => {
      const curVal = a === '全部' ? cur.length : cur.filter((i) => i.area === a).length;
      const cmpVal = a === '全部' ? cmp.length : cmp.filter((i) => i.area === a).length;
      const lyVal = a === '全部' ? ly.length : ly.filter((i) => i.area === a).length;
      rows.push(makeRow(a, curVal, cmpVal, lyVal));
    });
  } else {
    ['0-6', '6-12', '12-18', '18-24'].forEach((slot) => {
      const curVal = cur.filter((i) => bucketHour(i.time) === slot).length;
      const cmpVal = cmp.filter((i) => bucketHour(i.time) === slot).length;
      const lyVal = ly.filter((i) => bucketHour(i.time) === slot).length;
      rows.push(makeRow(slot, curVal, cmpVal, lyVal));
    });
  }
  sortTable(rows);
}

function makeRow(name, cur, prev, ly) {
  return {
    name,
    cur,
    prev,
    mom: pct(cur, prev),
    yoyBase: ly,
    yoy: pct(cur, ly),
  };
}

function sortBy(key) {
  const asc = sortState.value.key === key ? !sortState.value.asc : false;
  sortState.value = { key, asc };
  sortTable(tableRows.value);
}

function sortTable(rows) {
  const { key, asc } = sortState.value;
  rows.sort((a, b) => (asc ? a[key] - b[key] : b[key] - a[key]));
  tableRows.value = [...rows];
}

function pct(cur, base) {
  const b = base || 0;
  if (b === 0) return cur === 0 ? 0 : 100;
  return (((cur - b) / Math.max(b, 1)) * 100).toFixed(0);
}

function buildBuckets(granularity, days) {
  const buckets = [];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  if (granularity === 'day') {
    const d = new Date(start);
    while (d <= end) {
      buckets.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, start: new Date(d), end: new Date(d) });
      d.setDate(d.getDate() + 1);
    }
  } else if (granularity === 'week') {
    let cursor = new Date(start);
    while (cursor <= end) {
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      buckets.push({ label: `周${buckets.length + 1}`, start: new Date(cursor), end: weekEnd });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    // month
    const set = new Set();
    rawIncidents.value.forEach((i) => {
      const d = new Date(i.time);
      const label = `${d.getFullYear()}-${d.getMonth() + 1}`;
      set.add(label);
    });
    Array.from(set)
      .sort()
      .forEach((label) => buckets.push({ label, start, end }));
  }
  return buckets;
}

function aggByBucket(data, buckets, shift = 0, yearShift = 0) {
  return buckets.map((b) => {
    const s = new Date(b.start);
    const e = new Date(b.end);
    if (shift !== 0) {
      s.setDate(s.getDate() + shift * filters.period);
      e.setDate(e.getDate() + shift * filters.period);
    }
    if (yearShift !== 0) {
      s.setFullYear(s.getFullYear() + yearShift);
      e.setFullYear(e.getFullYear() + yearShift);
    }
    return data.filter((i) => {
      const t = new Date(i.time);
      return t >= s && t <= e;
    }).length;
  });
}

function bucketHour(time) {
  const h = new Date(time).getHours();
  if (h < 6) return '0-6';
  if (h < 12) return '6-12';
  if (h < 18) return '12-18';
  return '18-24';
}

function goMap() {
  uni.navigateTo({ url: '/subPackages/map/index' });
}

function goDispatch() {
  const summary = `粒度:${filters.granularity},周期:${filters.period}天,辖区:${filters.area},类型:${filters.types.join('/')}`;
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=AREA&sourceId=area_mock&summary=${encodeURIComponent(summary)}` });
}

function generateMockIncidents() {
  const arr = [];
  const types = ['纠纷', '治安', '求助', '其他'];
  const areas = ['一警务区', '二警务区'];
  const statuses = ['FEEDBACKED', 'ARRIVED', 'PENDING'];
  const addresses = [
    '桂南路口',
    '江北街道',
    '龙石广场',
    '桂南市场',
    '江北小区',
    '长命水社区',
    '文化路商圈',
    '公交枢纽',
    '城西工业区',
    '城东学校周边',
  ];
  for (let i = 0; i < 200; i++) {
    const dayOffset = Math.floor(Math.random() * 90);
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
    arr.push({
      id: `inc-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      area: areas[Math.floor(Math.random() * areas.length)],
      time: d.toISOString(),
      isPreventable: Math.random() > 0.35,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      address: addresses[Math.floor(Math.random() * addresses.length)],
    });
  }
  return arr;
}
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
  .title { font-size: 44rpx; font-weight: 700; }
  .sub { margin-top: 6rpx; color: #6e7a89; font-size: 26rpx; }
  .ghost-btn { border: 1px solid #d0d6de; background: #fff; color: #1f2b3a; padding: 10rpx 18rpx; border-radius: 12rpx; }
}
.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin-bottom: 16rpx;
}
.sticky { position: sticky; top: 0; z-index: 5; }
.filter-bar {
  display: flex;
  justify-content: space-between;
  background: rgba(255,255,255,0.95);
  border-radius: 16rpx;
  padding: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
.filter-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6rpx;
  font-size: 26rpx;
  color: #1f2b3a;
}
.arrow { color: #6e7a89; font-size: 22rpx; }
.dropdown-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 9;
}
.dropdown-panel {
  position: fixed;
  left: 0; right: 0; top: 120rpx;
  background: #fff;
  z-index: 10;
  border-radius: 0 0 16rpx 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
}
.dropdown-content {
  padding: 12rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.option {
  padding: 12rpx 14rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
}
.option.active { background: #0f75ff; color: #fff; }
.option.multi { min-width: 160rpx; text-align: center; }
.dropdown-actions { width: 100%; display: flex; justify-content: flex-end; gap: 10rpx; margin-top: 6rpx; }
.filters .filter-row { margin-bottom: 10rpx; }
.label { display: inline-block; width: 120rpx; color: #344150; }
.chips { display: flex; flex-wrap: wrap; gap: 10rpx; }
.chip { padding: 10rpx 14rpx; border-radius: 12rpx; background: #f4f6f8; font-size: 24rpx; }
.chip.active { background: #0f75ff; color: #fff; }
.segment { display: flex; border: 1px solid #e2e6eb; border-radius: 12rpx; overflow: hidden; }
.seg-item { flex: 1; text-align: center; padding: 10rpx 0; background: #f4f6f8; }
.seg-item.active { background: #0f75ff; color: #fff; }
.metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12rpx; }
.metric { padding: 12rpx; border-radius: 12rpx; background: #f6f8fb; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); }
.metric-top { display: flex; justify-content: space-between; align-items: center; }
.metric-title { font-size: 28rpx; }
.trend { font-size: 22rpx; color: #6e7a89; }
.metric-value { font-size: 44rpx; font-weight: 700; color: #0f75ff; margin: 6rpx 0; }
.metric-desc { color: #6b7785; font-size: 24rpx; }
.tabs { display: flex; padding: 0; }
.tab { flex: 1; text-align: center; padding: 16rpx 0; }
.tab.active { color: #0f75ff; font-weight: 700; }
.section-head { margin-bottom: 8rpx; }
.section-title { font-size: 32rpx; font-weight: 700; }
.section-sub { font-size: 24rpx; color: #6e7a89; }
.table-card .table { white-space: nowrap; }
.thead, .row { display: flex; }
.cell { min-width: 140rpx; padding: 10rpx; }
.cell.name { min-width: 160rpx; }
.tbody .row:nth-child(odd) { background: #f6f8fb; }
.action-bar { position: fixed; left:0; right:0; bottom:0; padding:10rpx 20rpx 20rpx; background: rgba(255,255,255,0.95); box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08); display: flex; gap: 10rpx; }
.submit-btn { flex:1; background: linear-gradient(90deg, #0f75ff, #56a0ff); color: #fff; border-radius: 12rpx; }
</style>
