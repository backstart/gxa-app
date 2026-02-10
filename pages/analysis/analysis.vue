<template>
  <AppPage :scrollIntoView="scrollIntoViewId" :scrollWithAnimation="true" @scroll="onPageScroll">
    <!-- 页面主体：移除页面内自绘返回/标题，只保留筛选和内容 -->
    <view class="analysis pageBg" @tap="handlePageTap">
      <!-- 吸顶锚点：未吸顶时先滚动到该位置再展开筛选面板 -->
      <view id="filterAnchor" class="filterAnchor"></view>

      <view id="filterBarStatic" :class="['filterBar', isFilterSticky ? 'hiddenBar' : '']">
        <view
          v-for="entry in filterEntries"
          :key="entry.key"
          :class="['filterItem', isFilterActive(entry.key) ? 'filterItemActive' : '']"
          @tap.stop="openDropdown(entry.key)"
        >
          <text class="filterText">{{ filterLabel(entry.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(entry.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <view
        v-if="isFilterSticky"
        id="filterBarFixed"
        class="filterBar filterBarFixed"
        :style="{ top: `${safeTop}px` }"
      >
        <view
          v-for="entry in filterEntries"
          :key="entry.key"
          :class="['filterItem', isFilterActive(entry.key) ? 'filterItemActive' : '']"
          @tap.stop="openDropdown(entry.key)"
        >
          <text class="filterText">{{ filterLabel(entry.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(entry.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <!-- 筛选面板：从筛选条底部弹出，底部保留重置/确定 -->
      <view v-if="dropdown.visible" class="sheetLayer" :style="{ top: `${dropdownTop}px` }" @touchmove.stop.prevent>
        <view class="sheetPanel" @tap.stop>
          <view class="sheetBody">
            <template v-if="dropdown.key === 'time'">
              <view
                v-for="item in TIME_OPTIONS"
                :key="item.value"
                :class="['sheetItem', tempFilter.timeGranularity === item.value ? 'sheetItemActive' : '']"
                @tap.stop="tempFilter.timeGranularity = item.value"
              >
                {{ item.label }}
              </view>
            </template>
            <template v-else-if="dropdown.key === 'type'">
              <view
                v-for="item in TYPE_OPTIONS"
                :key="item.value"
                :class="['sheetItem', 'gridItem', tempFilter.caseType === item.value ? 'sheetItemActive' : '']"
                @tap.stop="tempFilter.caseType = item.value"
              >
                {{ item.label }}
              </view>
            </template>
            <template v-else-if="dropdown.key === 'area'">
              <view
                v-for="item in AREA_OPTIONS"
                :key="item.value"
                :class="['sheetItem', 'gridItem', tempFilter.area === item.value ? 'sheetItemActive' : '']"
                @tap.stop="tempFilter.area = item.value"
              >
                {{ item.label }}
              </view>
            </template>
          </view>
          <view class="sheetActions">
            <text class="sheetBtn ghost" @tap.stop="resetCurrentFilter">重置</text>
            <text class="sheetBtn primary" @tap.stop="confirmCurrentFilter">确定</text>
          </view>
        </view>
        <view class="sheetMask" @tap="closeDropdown"></view>
      </view>

      <view class="card metrics">
        <view class="metric" v-for="metric in metricCards" :key="metric.key">
          <text class="metricTitle">{{ metric.title }}</text>
          <text class="metricValue">{{ metric.value }}</text>
          <text class="metricTrend">环比 {{ metric.mom }}% | 同比 {{ metric.yoy }}%</text>
          <text class="metricDesc">{{ metric.desc }}</text>
        </view>
      </view>

      <view class="card modeCard">
        <view class="modeTab" :class="{ active: viewMode === 'chart' }" @tap="viewMode = 'chart'">图表</view>
        <view class="modeTab" :class="{ active: viewMode === 'table' }" @tap="viewMode = 'table'">表格</view>
      </view>

      <view v-if="viewMode === 'chart'">
        <view class="card">
          <view class="sectionHead"><text class="sectionTitle">趋势</text><text class="sectionSub">本期/上期/去年同期</text></view>
          <qiun-data-charts type="line" :chartData="trendChartData" background="none" :height="360" />
        </view>
        <view class="card">
          <view class="sectionHead"><text class="sectionTitle">结构对比</text><text class="sectionSub">按辖区汇总</text></view>
          <qiun-data-charts type="column" :chartData="barChartData" background="none" :height="360" />
        </view>
        <view class="card">
          <view class="sectionHead"><text class="sectionTitle">类型占比</text></view>
          <qiun-data-charts type="ring" :chartData="pieChartData" :opts="pieChartOpts" background="none" :height="320" />
        </view>
        <view class="card">
          <view class="sectionHead"><text class="sectionTitle">辖区占比</text></view>
          <qiun-data-charts type="pie" :chartData="areaPieChartData" background="none" :height="320" />
        </view>
        <view class="card">
          <view class="sectionHead"><text class="sectionTitle">时段分布</text><text class="sectionSub">0-6 / 6-12 / 12-18 / 18-24</text></view>
          <qiun-data-charts type="column" :chartData="periodChartData" background="none" :height="320" />
        </view>
        <view class="card">
          <view class="sectionHead"><text class="sectionTitle">热点 Top10</text></view>
          <qiun-data-charts type="bar" :chartData="topChartData" background="none" :height="380" />
        </view>
      </view>

      <view v-else class="card">
        <view class="tableTabs">
          <view :class="['tableTab', tableMode==='area'?'active':'']" @tap="tableMode='area'">辖区汇总</view>
          <view :class="['tableTab', tableMode==='type'?'active':'']" @tap="tableMode='type'">类型汇总</view>
          <view :class="['tableTab', tableMode==='hot'?'active':'']" @tap="tableMode='hot'">热点明细</view>
        </view>

        <scroll-view v-if="tableMode!=='hot'" scroll-x class="tableWrap">
          <view class="thead">
            <text class="cell name">{{ tableMode === 'area' ? '辖区' : '类型' }}</text>
            <text class="cell">本期</text>
            <text class="cell">上期</text>
            <text class="cell">环比%</text>
            <text class="cell">去年同期</text>
            <text class="cell">同比%</text>
          </view>
          <view v-for="row in currentTableRows" :key="row.name" class="trow">
            <text class="cell name">{{ row.name }}</text>
            <text class="cell">{{ row.cur }}</text>
            <text class="cell">{{ row.prev }}</text>
            <text class="cell">{{ row.mom }}</text>
            <text class="cell">{{ row.yoyBase }}</text>
            <text class="cell">{{ row.yoy }}</text>
          </view>
          <view v-if="!currentTableRows.length" class="tableEmpty">暂无数据</view>
        </scroll-view>

        <view v-else class="hotTable">
          <view class="hotHead">
            <text class="hotCell hotName">点位</text>
            <text class="hotCell">辖区</text>
            <text class="hotCell">警情数</text>
            <text class="hotCell">占比</text>
          </view>
          <view v-for="row in tableRowsHot" :key="row.name" class="hotRow">
            <text class="hotCell hotName">{{ row.name }}</text>
            <text class="hotCell">{{ row.area }}</text>
            <text class="hotCell">{{ row.count }}</text>
            <text class="hotCell">{{ row.percent }}%</text>
          </view>
          <view v-if="!tableRowsHot.length" class="tableEmpty">暂无热点明细</view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue';
import { onLoad, onReady, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import qiunDataCharts from '@/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';

const instance = getCurrentInstance();

const TIME_OPTIONS = [
  { value: 'DAY', label: '天' },
  { value: 'WEEK', label: '周' },
  { value: 'MONTH', label: '月' },
  { value: 'QUARTER', label: '季度' },
  { value: 'YEAR', label: '年' },
];
const TYPE_OPTIONS = [
  { value: 'ALL', label: '全部类型' },
  { value: '刑事', label: '刑事' },
  { value: '行政', label: '行政' },
  { value: '紧急求助', label: '紧急求助' },
  { value: '举报类', label: '举报类' },
  { value: '咨询类', label: '咨询类' },
  { value: '纠纷类', label: '纠纷类' },
  { value: '交通类', label: '交通类' },
  { value: '其他类', label: '其他类' },
];
const AREA_OPTIONS = [
  { value: 'ALL', label: '全部辖区' },
  { value: '五桂山街道', label: '五桂山街道' },
  { value: '长命水', label: '长命水' },
  { value: '龙石', label: '龙石' },
  { value: '桂南', label: '桂南' },
];

function createDefaultFilter() {
  // 统一筛选源，确保筛选条件在指标、图表、表格中一致生效
  return { timeGranularity: 'WEEK', caseType: 'ALL', area: 'ALL' };
}

const filter = reactive(createDefaultFilter());
const tempFilter = reactive(createDefaultFilter());
const filterEntries = [{ key: 'time' }, { key: 'type' }, { key: 'area' }];
const dropdown = reactive({ visible: false, key: '' });

const safeTop = ref(0);
const scrollTopVal = ref(0);
const stickyThreshold = ref(0);
const filterBarHeight = ref(92);
const dropdownTop = ref(0);
const scrollIntoViewId = ref('');
const pendingDropdownKey = ref('');
const isFilterSticky = computed(() => scrollTopVal.value >= stickyThreshold.value);

const rawIncidents = ref(generateMockIncidents());
const metricCards = ref([]);
const trendChartData = ref({ categories: [], series: [] });
const barChartData = ref({ categories: [], series: [] });
const pieChartData = ref({ series: [{ data: [] }] });
const areaPieChartData = ref({ series: [{ data: [] }] });
const periodChartData = ref({ categories: [], series: [] });
const topChartData = ref({ categories: [], series: [] });
const pieChartOpts = ref({
  // 关闭环形图中心文案，避免出现“收益率”默认文字
  title: { name: '', fontSize: 1, color: 'transparent' },
  subtitle: { name: '', fontSize: 1, color: 'transparent' },
  extra: { ring: { ringWidth: 30 } },
});

const viewMode = ref('chart');
const tableMode = ref('area');
const tableRowsArea = ref([]);
const tableRowsType = ref([]);
const tableRowsHot = ref([]);
const currentTableRows = computed(() => (tableMode.value === 'area' ? tableRowsArea.value : tableRowsType.value));

watch(
  filter,
  () => {
    loadDataByFilter();
  },
  { deep: true },
);

function onPageScroll(event) {
  // 吸顶计算：记录滚动值，同时面板打开时动态更新 top
  scrollTopVal.value = Number(event?.detail?.scrollTop || 0);
  if (dropdown.visible) updateDropdownTop();
}

function handlePageTap() {
  if (dropdown.visible) closeDropdown();
}

function openDropdown(key) {
  if (dropdown.visible && dropdown.key === key) {
    closeDropdown();
    return;
  }
  pendingDropdownKey.value = key;
  if (!isFilterSticky.value) {
    // 未吸顶时先滚到锚点，再展开筛选面板
    scrollIntoViewId.value = 'filterAnchor';
    setTimeout(() => {
      scrollIntoViewId.value = '';
      openDropdownAfterScroll();
    }, 220);
    return;
  }
  openDropdownAfterScroll();
}

function openDropdownAfterScroll() {
  if (!pendingDropdownKey.value) return;
  tempFilter.timeGranularity = filter.timeGranularity;
  tempFilter.caseType = filter.caseType;
  tempFilter.area = filter.area;
  dropdown.key = pendingDropdownKey.value;
  dropdown.visible = true;
  nextTick(updateDropdownTop);
}

function closeDropdown() {
  dropdown.visible = false;
  dropdown.key = '';
  pendingDropdownKey.value = '';
}

function resetCurrentFilter() {
  // 面板重置仅重置当前维度，避免误清空其他筛选
  const defaults = createDefaultFilter();
  if (dropdown.key === 'time') tempFilter.timeGranularity = defaults.timeGranularity;
  if (dropdown.key === 'type') tempFilter.caseType = defaults.caseType;
  if (dropdown.key === 'area') tempFilter.area = defaults.area;
}

function confirmCurrentFilter() {
  // 面板确定后提交当前维度并触发数据刷新
  if (dropdown.key === 'time') filter.timeGranularity = tempFilter.timeGranularity;
  if (dropdown.key === 'type') filter.caseType = tempFilter.caseType;
  if (dropdown.key === 'area') filter.area = tempFilter.area;
  closeDropdown();
}

function isFilterActive(key) {
  return dropdown.visible && dropdown.key === key;
}

function filterLabel(key) {
  if (key === 'time') return TIME_OPTIONS.find((x) => x.value === filter.timeGranularity)?.label || '周';
  if (key === 'type') return TYPE_OPTIONS.find((x) => x.value === filter.caseType)?.label || '全部类型';
  if (key === 'area') return AREA_OPTIONS.find((x) => x.value === filter.area)?.label || '全部辖区';
  return '';
}

function measureStickyBase() {
  // 测量吸顶阈值与筛选条高度，供吸顶和面板定位复用
  if (!instance) return;
  const query = uni.createSelectorQuery().in(instance);
  query.select('#filterAnchor').boundingClientRect();
  query.select('#filterBarStatic').boundingClientRect();
  query.exec((res) => {
    stickyThreshold.value = Math.max(0, Number(res?.[0]?.top || 0) - safeTop.value);
    filterBarHeight.value = Math.ceil(Number(res?.[1]?.height || 92));
    dropdownTop.value = safeTop.value + filterBarHeight.value;
  });
}

function updateDropdownTop() {
  // 始终贴筛选条底部弹出，吸顶和非吸顶共用
  if (!instance) return;
  const query = uni.createSelectorQuery().in(instance);
  query.select('#filterBarFixed').boundingClientRect();
  query.select('#filterBarStatic').boundingClientRect();
  query.exec((res) => {
    const target = isFilterSticky.value ? (res?.[0] || res?.[1]) : (res?.[1] || res?.[0]);
    dropdownTop.value = Number(target?.bottom || safeTop.value + filterBarHeight.value);
  });
}

function loadDataByFilter() {
  // 单一入口：四指标+六图表+三表格全部统一刷新
  const days = filter.timeGranularity === 'DAY' ? 7 : filter.timeGranularity === 'WEEK' ? 56 : filter.timeGranularity === 'MONTH' ? 180 : filter.timeGranularity === 'QUARTER' ? 360 : 1095;
  const now = new Date();
  const curStart = new Date(now);
  curStart.setDate(now.getDate() - days + 1);
  const prevStart = new Date(curStart);
  prevStart.setDate(prevStart.getDate() - days);
  const prevEnd = new Date(now);
  prevEnd.setDate(prevEnd.getDate() - days);
  const lyStart = new Date(curStart);
  lyStart.setFullYear(lyStart.getFullYear() - 1);
  const lyEnd = new Date(now);
  lyEnd.setFullYear(lyEnd.getFullYear() - 1);

  const cur = filterIncidents(curStart, now);
  const prev = filterIncidents(prevStart, prevEnd);
  const ly = filterIncidents(lyStart, lyEnd);

  buildMetrics(cur, prev, ly);
  buildTrend(cur, prev, ly);
  buildAreaCompare(cur, prev);
  buildTypePie(cur);
  buildAreaPie(cur);
  buildPeriod(cur);
  buildTop(cur);
  buildTables(cur, prev, ly);
}

function filterIncidents(start, end) {
  return rawIncidents.value.filter((x) => {
    const t = new Date(x.time);
    const inRange = t >= start && t <= end;
    const typeHit = filter.caseType === 'ALL' || x.type === filter.caseType;
    const areaHit = filter.area === 'ALL' || x.area === filter.area;
    return inRange && typeHit && areaHit;
  });
}

function buildMetrics(cur, prev, ly) {
  const total = cur.length;
  const totalPrev = prev.length;
  const totalLy = ly.length;
  const dispute = cur.filter((x) => x.type === '纠纷类').length;
  const disputePrev = prev.filter((x) => x.type === '纠纷类').length;
  const disputeLy = ly.filter((x) => x.type === '纠纷类').length;
  const prevent = cur.filter((x) => x.isPreventable).length;
  const preventPrev = prev.filter((x) => x.isPreventable).length;
  const preventLy = ly.filter((x) => x.isPreventable).length;
  const closed = cur.filter((x) => x.status === 'FEEDBACKED').length;
  const closedPrev = prev.filter((x) => x.status === 'FEEDBACKED').length;
  const closedLy = ly.filter((x) => x.status === 'FEEDBACKED').length;
  metricCards.value = [
    { key: 'total', title: '警情总量', value: total, mom: pct(total, totalPrev), yoy: pct(total, totalLy), desc: '本期' },
    { key: 'dispute', title: '纠纷类', value: dispute, mom: pct(dispute, disputePrev), yoy: pct(dispute, disputeLy), desc: '纠纷警情' },
    { key: 'prevent', title: '可防性', value: prevent, mom: pct(prevent, preventPrev), yoy: pct(prevent, preventLy), desc: '可防性警情' },
    { key: 'closure', title: '闭环率', value: `${total ? ((closed / total) * 100).toFixed(0) : 0}%`, mom: pct(closed, closedPrev), yoy: pct(closed, closedLy), desc: '已回告/总量' },
  ];
}

function buildTrend(cur, prev, ly) {
  // 简化趋势桶：按最近7天展示，避免页面过高
  const cats = [];
  const curS = [];
  const prevS = [];
  const lyS = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    cats.push(label);
    curS.push(countByDay(cur, d));
    const pd = new Date(d); pd.setDate(pd.getDate() - 7); prevS.push(countByDay(prev, pd));
    const yd = new Date(d); yd.setFullYear(yd.getFullYear() - 1); lyS.push(countByDay(ly, yd));
  }
  trendChartData.value = { categories: cats, series: [{ name: '本期', data: curS }, { name: '上期', data: prevS }, { name: '去年同期', data: lyS }] };
}

function countByDay(list, day) {
  const y = day.getFullYear(); const m = day.getMonth(); const d = day.getDate();
  return list.filter((x) => { const t = new Date(x.time); return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d; }).length;
}

function buildAreaCompare(cur, prev) {
  const cats = AREA_OPTIONS.filter((x) => x.value !== 'ALL').map((x) => x.label);
  barChartData.value = {
    categories: cats,
    series: [
      { name: '本期', data: cats.map((a) => cur.filter((x) => x.area === a).length) },
      { name: '上期', data: cats.map((a) => prev.filter((x) => x.area === a).length) },
    ],
  };
}

function buildTypePie(cur) {
  const data = TYPE_OPTIONS.filter((x) => x.value !== 'ALL').map((x) => ({ name: x.value, value: cur.filter((r) => r.type === x.value).length }));
  pieChartData.value = { series: [{ data }] };
}

function buildAreaPie(cur) {
  const data = AREA_OPTIONS.filter((x) => x.value !== 'ALL').map((x) => ({ name: x.label, value: cur.filter((r) => r.area === x.label).length }));
  areaPieChartData.value = { series: [{ data }] };
}

function buildPeriod(cur) {
  const groups = [
    { name: '0-6', s: 0, e: 6 },
    { name: '6-12', s: 6, e: 12 },
    { name: '12-18', s: 12, e: 18 },
    { name: '18-24', s: 18, e: 24 },
  ];
  periodChartData.value = {
    categories: groups.map((g) => g.name),
    series: [{ name: '警情数', data: groups.map((g) => cur.filter((x) => { const h = new Date(x.time).getHours(); return h >= g.s && h < g.e; }).length) }],
  };
}

function buildTop(cur) {
  const map = {};
  cur.forEach((x) => { const k = x.address || '未知地址'; map[k] = (map[k] || 0) + 1; });
  const sorted = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  topChartData.value = { categories: sorted.map((x) => x.name), series: [{ name: '警情数', data: sorted.map((x) => x.value) }] };
}

function buildTables(cur, prev, ly) {
  tableRowsArea.value = AREA_OPTIONS.filter((x) => x.value !== 'ALL').map((x) => rowSummary(x.label, 'area', cur, prev, ly));
  tableRowsType.value = TYPE_OPTIONS.filter((x) => x.value !== 'ALL').map((x) => rowSummary(x.value, 'type', cur, prev, ly));
  const total = cur.length || 1;
  const hotMap = {};
  cur.forEach((x) => { const k = x.address || '未知地址'; hotMap[k] = { count: (hotMap[k]?.count || 0) + 1, area: x.area || '未知辖区' }; });
  tableRowsHot.value = Object.entries(hotMap)
    .map(([name, v]) => ({ name, area: v.area, count: v.count, percent: Number(((v.count / total) * 100).toFixed(1)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function rowSummary(name, field, cur, prev, ly) {
  const curV = cur.filter((x) => x[field] === name).length;
  const prevV = prev.filter((x) => x[field] === name).length;
  const lyV = ly.filter((x) => x[field] === name).length;
  return { name, cur: curV, prev: prevV, mom: pct(curV, prevV), yoyBase: lyV, yoy: pct(curV, lyV) };
}

function pct(cur, base) {
  const b = Number(base || 0);
  if (!b) return cur ? 100 : 0;
  return Number((((cur - b) / b) * 100).toFixed(0));
}

function generateMockIncidents() {
  // mock 数据集中管理：后续接接口时只替换本函数即可
  const types = TYPE_OPTIONS.filter((x) => x.value !== 'ALL').map((x) => x.value);
  const areas = AREA_OPTIONS.filter((x) => x.value !== 'ALL').map((x) => x.value);
  const status = ['FEEDBACKED', 'ARRIVED', 'PENDING'];
  const addrs = ['桂南路口', '长命水社区', '龙石广场', '五桂山街道口', '城西工业区', '文化路商圈'];
  const list = [];
  for (let i = 0; i < 320; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 420));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
    list.push({
      id: `inc_${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      area: areas[Math.floor(Math.random() * areas.length)],
      time: d.toISOString(),
      isPreventable: Math.random() > 0.4,
      status: status[Math.floor(Math.random() * status.length)],
      address: addrs[Math.floor(Math.random() * addrs.length)],
    });
  }
  return list;
}

onLoad(() => {
  const sys = uni.getSystemInfoSync();
  safeTop.value = sys.safeAreaInsets?.top ?? sys.statusBarHeight ?? 0;
});

onShow(() => {
  loadDataByFilter();
  nextTick(measureStickyBase);
});

onReady(() => {
  nextTick(measureStickyBase);
});
</script>

<style lang="scss" scoped>
.analysis { min-height: 100%; padding: 8rpx 24rpx 36rpx; box-sizing: border-box; overflow-x: hidden; }
.filterAnchor { height: 2rpx; }
.filterBar { margin-top: 8rpx; padding: 10rpx 8rpx; border-radius: 16rpx; background: #fff; display: flex; gap: 10rpx; box-sizing: border-box; box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06); }
.hiddenBar { opacity: 0; pointer-events: none; }
.filterBarFixed { position: fixed; left: 24rpx; right: 24rpx; z-index: 40; border-radius: 0 0 16rpx 16rpx; margin-top: 0; }
.filterItem { flex: 1; min-width: 0; display: flex; justify-content: center; align-items: center; gap: 6rpx; padding: 8rpx 6rpx; position: relative; }
.filterText { font-size: 24rpx; color: #1f2b3a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filterArrow { font-size: 20rpx; color: #7a8594; }
.filterItemActive .filterText,.filterItemActive .filterArrow { color: #1677ff; }
.filterItemActive::after { content: ''; position: absolute; left: 20%; right: 20%; bottom: 0; height: 4rpx; border-radius: 999rpx; background: #1677ff; }
.sheetLayer { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: flex; flex-direction: column; }
.sheetPanel { background: #fff; border-radius: 0 0 24rpx 24rpx; box-shadow: 0 12rpx 24rpx rgba(0,0,0,.08); max-height: 54vh; overflow: hidden; }
.sheetBody { max-height: 42vh; overflow-y: auto; padding: 12rpx 18rpx; display: flex; flex-wrap: wrap; gap: 10rpx; box-sizing: border-box; }
.sheetItem { width: 100%; padding: 18rpx 16rpx; border-radius: 12rpx; background: #f8f9fb; border: 2rpx solid transparent; font-size: 28rpx; color: #1f2b3a; box-sizing: border-box; }
.gridItem { width: calc(33.333% - 8rpx); text-align: center; font-size: 24rpx; }
.sheetItemActive { color: #1677ff; border-color: #1677ff; background: #f7fbff; }
.sheetActions { display: flex; gap: 12rpx; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); box-sizing: border-box; border-top: 1px solid #eef2f7; }
.sheetBtn { flex: 1; text-align: center; font-size: 26rpx; padding: 14rpx 0; border-radius: 12rpx; }
.ghost { background: #f4f6f8; color: #6e7a89; }
.primary { background: #1677ff; color: #fff; }
.sheetMask { flex: 1; background: rgba(0,0,0,.42); }
.card { margin-top: 16rpx; padding: 18rpx; border-radius: 16rpx; background: rgba(255,255,255,.92); box-shadow: 0 8rpx 24rpx rgba(0,0,0,.08); box-sizing: border-box; }
.metrics { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12rpx; }
.metric { padding: 12rpx; border-radius: 12rpx; background: #f6f8fb; }
.metricTitle { font-size: 28rpx; color: #1f2b3a; white-space: nowrap; display: block; }
.metricValue { margin-top: 6rpx; font-size: 44rpx; font-weight: 700; color: #0f75ff; display: block; }
.metricTrend,.metricDesc { margin-top: 2rpx; font-size: 22rpx; color: #6e7a89; display: block; }
.modeCard { display: flex; gap: 8rpx; padding: 6rpx; }
.modeTab { flex: 1; text-align: center; padding: 14rpx 0; border-radius: 12rpx; background: #f6f8fb; color: #5e6b7a; font-size: 30rpx; }
.modeTab.active { color: #1677ff; background: #eaf3ff; font-weight: 700; }
.sectionHead { margin-bottom: 8rpx; }
.sectionTitle { font-size: 32rpx; font-weight: 700; color: #1f2b3a; }
.sectionSub { margin-left: 8rpx; font-size: 24rpx; color: #6e7a89; }
.tableTabs { display: flex; gap: 10rpx; margin-bottom: 12rpx; }
.tableTab { flex: 1; text-align: center; padding: 10rpx 0; border-radius: 10rpx; background: #f4f6f8; color: #5f6a78; font-size: 24rpx; }
.tableTab.active { color: #1677ff; background: #eaf3ff; font-weight: 700; }
.tableWrap { white-space: nowrap; }
.thead,.trow { display: flex; }
.cell { min-width: 140rpx; padding: 10rpx; box-sizing: border-box; }
.name { min-width: 170rpx; }
.trow:nth-child(odd) { background: #f6f8fb; }
.hotHead,.hotRow { display: flex; padding: 12rpx 0; border-bottom: 1px solid #eef2f7; }
.hotCell { flex: 1; min-width: 0; font-size: 24rpx; color: #304052; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hotName { flex: 1.8; }
.tableEmpty { padding: 24rpx 0; text-align: center; color: #8a95a6; font-size: 24rpx; }
</style>
