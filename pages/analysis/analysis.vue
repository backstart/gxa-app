<template>
  <AppPage
    :scrollIntoView="scrollIntoViewId"
    :scrollWithAnimation="true"
    @scroll="onPageScroll"
  >
    <!-- 点击页面空白时关闭筛选面板，避免多个面板叠加 -->
    <view class="analysis pageBg" @tap="handlePageTap">
      <view class="topNav">
        <!-- 顶部仅保留返回按钮，去掉标题区与右上角重置按钮 -->
        <text class="backBtn" @tap.stop="goBack">‹</text>
      </view>

      <!-- 筛选锚点：未吸顶时点击筛选先滚动到这里，再展开面板 -->
      <view id="filterAnchor" class="filterAnchor"></view>

      <!-- 常规筛选条：与重点场所列表交互保持一致 -->
      <view id="filterBarStatic" :class="['filterBar', isFilterSticky ? 'filterBarHidden' : '']">
        <view
          v-for="item in filterEntries"
          :key="item.key"
          :class="['filterItem', isFilterActive(item.key) ? 'filterItemActive' : '']"
          @tap.stop="openDropdown(item.key)"
        >
          <text class="filterLabel">{{ filterLabel(item.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(item.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <!-- 吸顶筛选条：滚动超过阈值后固定到顶部 -->
      <view
        v-if="isFilterSticky"
        id="filterBarFixed"
        class="filterBar filterBarFixed"
        :style="{ top: `${safeTop}px` }"
      >
        <view
          v-for="item in filterEntries"
          :key="item.key"
          :class="['filterItem', isFilterActive(item.key) ? 'filterItemActive' : '']"
          @tap.stop="openDropdown(item.key)"
        >
          <text class="filterLabel">{{ filterLabel(item.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(item.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <!-- 下拉筛选层：从筛选条底部展开，下方为半透明遮罩 -->
      <view
        v-if="dropdown.visible"
        class="dropdownLayer"
        :style="{ top: `${dropdownTop}px` }"
        @touchmove.stop.prevent
      >
        <view class="dropdownPanel" @tap.stop>
          <view class="dropdownContent">
            <template v-if="dropdown.key === 'time'">
              <view
                v-for="option in TIME_OPTIONS"
                :key="option.value"
                :class="['optionItem', tempFilter.timeGranularity === option.value ? 'optionItemActive' : '']"
                @tap.stop="setTempTime(option.value)"
              >
                {{ option.label }}
              </view>
            </template>

            <template v-else-if="dropdown.key === 'type'">
              <view
                v-for="option in TYPE_OPTIONS"
                :key="option.value"
                :class="['optionItem', 'gridOption', tempFilter.caseType === option.value ? 'optionItemActive' : '']"
                @tap.stop="setTempType(option.value)"
              >
                {{ option.label }}
              </view>
            </template>

            <template v-else-if="dropdown.key === 'area'">
              <view
                v-for="option in AREA_OPTIONS"
                :key="option.value"
                :class="['optionItem', 'gridOption', tempFilter.area === option.value ? 'optionItemActive' : '']"
                @tap.stop="setTempArea(option.value)"
              >
                {{ option.label }}
              </view>
            </template>
          </view>

          <!-- 重置/确定放在面板内，不再在顶部提供全局重置入口 -->
          <view class="panelActions">
            <text class="panelBtn ghost" @tap.stop="resetCurrentFilter">重置</text>
            <text class="panelBtn primary" @tap.stop="confirmCurrentFilter">确定</text>
          </view>
        </view>
        <view class="dropdownMask" @tap="closeDropdown"></view>
      </view>

      <!-- 指标区保留四个核心指标，布局优化为紧凑 2x2 -->
      <view class="card metrics">
        <view class="metric" v-for="metric in metricCards" :key="metric.key">
          <view class="metricTop">
            <text class="metricTitle">{{ metric.title }}</text>
          </view>
          <view class="metricValue">{{ metric.value }}</view>
          <view class="metricTrend">环比 {{ metric.mom }}% | 同比 {{ metric.yoy }}%</view>
          <view class="metricDesc">{{ metric.desc }}</view>
        </view>
      </view>

      <!-- 图表/表格切换保持原能力，改为更轻量的 segmented 样式 -->
      <view class="card tabs">
        <view class="tab" :class="viewMode === 'chart' ? 'active' : ''" @tap="viewMode = 'chart'">图表</view>
        <view class="tab" :class="viewMode === 'table' ? 'active' : ''" @tap="viewMode = 'table'">表格</view>
      </view>

      <view v-if="viewMode === 'chart'">
        <view class="card">
          <view class="sectionHead">
            <text class="sectionTitle">趋势</text>
            <text class="sectionSub">本期/上期/去年同期</text>
          </view>
          <qiun-data-charts type="line" :chartData="trendChartData" background="none" :height="380" />
        </view>

        <view class="card">
          <view class="sectionHead">
            <text class="sectionTitle">结构对比</text>
            <text class="sectionSub">按辖区汇总</text>
          </view>
          <qiun-data-charts type="column" :chartData="barChartData" background="none" :height="380" />
        </view>

        <view class="card">
          <view class="sectionHead">
            <text class="sectionTitle">类型占比</text>
          </view>
          <qiun-data-charts type="ring" :chartData="pieChartData" background="none" :height="320" />
        </view>

        <view class="card">
          <view class="sectionHead">
            <text class="sectionTitle">热点 Top10</text>
          </view>
          <qiun-data-charts type="bar" :chartData="topChartData" background="none" :height="420" />
        </view>
      </view>

      <view v-else class="card tableCard">
        <view class="sectionHead tableHead">
          <text class="sectionTitle">表格</text>
          <view class="chips">
            <view class="chip" @tap="sortBy('cur')">本期</view>
            <view class="chip" @tap="sortBy('mom')">环比</view>
            <view class="chip" @tap="sortBy('yoy')">同比</view>
          </view>
        </view>
        <scroll-view scroll-x class="table">
          <view class="thead">
            <text class="cell name">辖区</text>
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
    </view>
  </AppPage>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue';
import { onLoad, onReady, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import qiunDataCharts from '@/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';

const instance = getCurrentInstance();

// 时间筛选项：按需求保留“天/周/月/季度/年”
const TIME_OPTIONS = [
  { value: 'DAY', label: '天' },
  { value: 'WEEK', label: '周' },
  { value: 'MONTH', label: '月' },
  { value: 'QUARTER', label: '季度' },
  { value: 'YEAR', label: '年' },
];

// 类型筛选项：按需求收敛到固定分类字典
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

// 辖区筛选项：默认包含“全部辖区”，其余为固定辖区列表
const AREA_OPTIONS = [
  { value: 'ALL', label: '全部辖区' },
  { value: '五桂山街道', label: '五桂山街道' },
  { value: '长命水', label: '长命水' },
  { value: '龙石', label: '龙石' },
  { value: '桂南', label: '桂南' },
];

function createDefaultFilter() {
  // 主筛选状态统一维护，确保四指标/图表/表格始终使用同一套入参
  return {
    timeGranularity: 'WEEK',
    caseType: 'ALL',
    area: 'ALL',
  };
}

const filter = reactive(createDefaultFilter());
const tempFilter = reactive(createDefaultFilter());

const filterEntries = [
  { key: 'time' },
  { key: 'type' },
  { key: 'area' },
];

const dropdown = reactive({
  visible: false,
  key: '',
});

const safeTop = ref(0);
const scrollTopVal = ref(0);
const stickyThreshold = ref(0);
const filterBarHeight = ref(92);
const dropdownTop = ref(0);
const scrollIntoViewId = ref('');
const pendingDropdownKey = ref('');

const isFilterSticky = computed(() => scrollTopVal.value >= stickyThreshold.value);

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

watch(
  filter,
  () => {
    // 主筛选变化后统一重算，保证指标区与图表区数据一致
    loadDataByFilter();
  },
  { deep: true },
);

function goBack() {
  // 顶部只保留返回按钮，符合移动端页面习惯
  uni.navigateBack({ delta: 1 });
}

function syncTempFilter() {
  // 打开下拉面板时，把当前主筛选同步到临时筛选，点击“确定”前不直接影响页面数据
  tempFilter.timeGranularity = filter.timeGranularity;
  tempFilter.caseType = filter.caseType;
  tempFilter.area = filter.area;
}

function resetTempByKey(key) {
  // 重置只影响当前打开的筛选维度，避免误清空其他已选条件
  const defaults = createDefaultFilter();
  if (key === 'time') tempFilter.timeGranularity = defaults.timeGranularity;
  if (key === 'type') tempFilter.caseType = defaults.caseType;
  if (key === 'area') tempFilter.area = defaults.area;
}

function applyTempByKey(key) {
  // 确定时只提交当前面板对应筛选值
  if (key === 'time') filter.timeGranularity = tempFilter.timeGranularity;
  if (key === 'type') filter.caseType = tempFilter.caseType;
  if (key === 'area') filter.area = tempFilter.area;
}

function onPageScroll(event) {
  // 记录滚动位置用于筛选条吸顶判断
  scrollTopVal.value = Number(event?.detail?.scrollTop || 0);
  // 面板打开时动态更新顶部坐标，保证始终贴着筛选条底部
  if (dropdown.visible) updateDropdownTop();
}

function handlePageTap() {
  // 点击页面空白区域关闭面板
  if (dropdown.visible) closeDropdown();
}

function openDropdown(key) {
  // 点击同一筛选项时切换关闭
  if (dropdown.visible && dropdown.key === key) {
    closeDropdown();
    return;
  }

  pendingDropdownKey.value = key;

  // 未吸顶时先自动滚到筛选条锚点，再展开面板
  if (!isFilterSticky.value) {
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
  // 真正展开面板并同步临时筛选值
  const key = pendingDropdownKey.value;
  if (!key) return;
  syncTempFilter();
  dropdown.key = key;
  dropdown.visible = true;
  nextTick(() => updateDropdownTop());
}

function closeDropdown() {
  // 关闭面板并清理状态，确保同一时间仅一个面板可见
  dropdown.visible = false;
  dropdown.key = '';
  pendingDropdownKey.value = '';
}

function isFilterActive(key) {
  // 当前面板对应的筛选项显示激活样式
  return dropdown.visible && dropdown.key === key;
}

function filterLabel(key) {
  // 顶部筛选文案根据当前主筛选值实时显示
  if (key === 'time') {
    return TIME_OPTIONS.find((item) => item.value === filter.timeGranularity)?.label || '周';
  }
  if (key === 'type') {
    return TYPE_OPTIONS.find((item) => item.value === filter.caseType)?.label || '全部类型';
  }
  if (key === 'area') {
    return AREA_OPTIONS.find((item) => item.value === filter.area)?.label || '全部辖区';
  }
  return '';
}

function setTempTime(value) {
  // 选择时间维度（临时）
  tempFilter.timeGranularity = value;
}

function setTempType(value) {
  // 选择警情类型（临时）
  tempFilter.caseType = value;
}

function setTempArea(value) {
  // 选择辖区（临时）
  tempFilter.area = value;
}

function resetCurrentFilter() {
  // 面板内重置当前维度，不关闭面板，便于继续选择
  resetTempByKey(dropdown.key);
}

function confirmCurrentFilter() {
  // 面板内确定后应用筛选并关闭
  applyTempByKey(dropdown.key);
  closeDropdown();
}

function measureStickyBase() {
  // 测量筛选条吸顶阈值与高度，供吸顶与面板定位共用
  if (!instance) return;
  const query = uni.createSelectorQuery().in(instance);
  query.select('#filterAnchor').boundingClientRect();
  query.select('#filterBarStatic').boundingClientRect();
  query.exec((res) => {
    const anchorRect = res?.[0];
    const barRect = res?.[1];
    if (anchorRect) {
      stickyThreshold.value = Math.max(0, Number(anchorRect.top || 0) - safeTop.value);
    }
    if (barRect?.height) {
      filterBarHeight.value = Math.ceil(Number(barRect.height));
    }
    dropdownTop.value = safeTop.value + filterBarHeight.value;
  });
}

function updateDropdownTop() {
  // 每次展开或滚动时读取筛选条底部坐标，确保面板从筛选行底部弹出
  if (!instance) {
    dropdownTop.value = safeTop.value + filterBarHeight.value;
    return;
  }
  const query = uni.createSelectorQuery().in(instance);
  query.select('#filterBarFixed').boundingClientRect();
  query.select('#filterBarStatic').boundingClientRect();
  query.exec((res) => {
    const fixedRect = res?.[0];
    const staticRect = res?.[1];
    const target = isFilterSticky.value ? (fixedRect || staticRect) : (staticRect || fixedRect);
    if (target && target.bottom) {
      dropdownTop.value = Number(target.bottom);
    } else {
      dropdownTop.value = safeTop.value + filterBarHeight.value;
    }
  });
}

function daysForGranularity(granularity) {
  // 不同时间粒度映射到分析窗口天数，保证统计与趋势联动
  if (granularity === 'DAY') return 7;
  if (granularity === 'WEEK') return 56;
  if (granularity === 'MONTH') return 180;
  if (granularity === 'QUARTER') return 360;
  return 1095;
}

function loadDataByFilter() {
  // 统一数据入口：指标卡片、趋势图、结构图、表格都从这里更新
  const windowDays = daysForGranularity(filter.timeGranularity);
  const { curRange, prevRange, lastYearRange } = buildRanges(windowDays);
  const curData = filterIncidents(curRange);
  const prevData = filterIncidents(prevRange);
  const lastYearData = filterIncidents(lastYearRange);

  calcMetrics(curData, prevData, lastYearData);
  buildTrend(curData, prevData, lastYearData, windowDays);
  buildBar(curData, prevData);
  buildPie(curData);
  buildTop(curData);
  buildTable(curData, prevData, lastYearData);
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
  return rawIncidents.value.filter((item) => {
    const time = new Date(item.time);
    const inRange = time >= start && time <= end;
    const typeMatch = filter.caseType === 'ALL' || item.type === filter.caseType;
    const areaMatch = filter.area === 'ALL' || item.area === filter.area;
    return inRange && typeMatch && areaMatch;
  });
}

function calcMetrics(cur, prev, ly) {
  const totalCur = cur.length;
  const totalPrev = prev.length;
  const totalLy = ly.length;

  const disputeCur = cur.filter((item) => item.type === '纠纷类').length;
  const disputePrev = prev.filter((item) => item.type === '纠纷类').length;
  const disputeLy = ly.filter((item) => item.type === '纠纷类').length;

  const preventCur = cur.filter((item) => item.isPreventable).length;
  const preventPrev = prev.filter((item) => item.isPreventable).length;
  const preventLy = ly.filter((item) => item.isPreventable).length;

  const closureCur = cur.filter((item) => item.status === 'FEEDBACKED').length;
  const closurePrev = prev.filter((item) => item.status === 'FEEDBACKED').length;
  const closureLy = ly.filter((item) => item.status === 'FEEDBACKED').length;

  const closureRateCur = totalCur ? `${((closureCur / totalCur) * 100).toFixed(0)}%` : '0%';

  metricCards.value = [
    {
      key: 'total',
      title: '警情总量',
      value: totalCur,
      mom: pct(totalCur, totalPrev),
      yoy: pct(totalCur, totalLy),
      desc: '本期',
    },
    {
      key: 'dispute',
      title: '纠纷类',
      value: disputeCur,
      mom: pct(disputeCur, disputePrev),
      yoy: pct(disputeCur, disputeLy),
      desc: '纠纷警情',
    },
    {
      key: 'prevent',
      title: '可防性',
      value: preventCur,
      mom: pct(preventCur, preventPrev),
      yoy: pct(preventCur, preventLy),
      desc: '可防性警情',
    },
    {
      key: 'closure',
      title: '闭环率',
      value: closureRateCur,
      mom: pct(closureCur, closurePrev),
      yoy: pct(closureCur, closureLy),
      desc: '已回告/总量',
    },
  ];
}

function buildTrend(cur, prev, ly, windowDays) {
  const buckets = buildBuckets(filter.timeGranularity, windowDays);
  const curSeries = aggByBuckets(cur, buckets);
  const prevSeries = aggByBuckets(prev, buckets, -windowDays, 0);
  const lySeries = aggByBuckets(ly, buckets, 0, -1);

  trendChartData.value = {
    categories: buckets.map((bucket) => bucket.label),
    series: [
      { name: '本期', data: curSeries },
      { name: '上期', data: prevSeries },
      { name: '去年同期', data: lySeries },
    ],
  };
}

function buildBuckets(granularity, windowDays) {
  const list = [];
  const now = new Date();

  if (granularity === 'DAY') {
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      list.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        start: dayStart(d),
        end: dayEnd(d),
      });
    }
    return list;
  }

  if (granularity === 'WEEK') {
    for (let i = 7; i >= 0; i -= 1) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      list.push({
        label: `W${8 - i}`,
        start: dayStart(start),
        end: dayEnd(end),
      });
    }
    return list;
  }

  if (granularity === 'MONTH') {
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        label: `${d.getMonth() + 1}月`,
        start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }
    return list;
  }

  if (granularity === 'QUARTER') {
    for (let i = 3; i >= 0; i -= 1) {
      const month = now.getMonth() - i * 3;
      const base = new Date(now.getFullYear(), month, 1);
      const quarter = Math.floor(base.getMonth() / 3) + 1;
      const qStartMonth = (quarter - 1) * 3;
      list.push({
        label: `${base.getFullYear()}Q${quarter}`,
        start: new Date(base.getFullYear(), qStartMonth, 1, 0, 0, 0, 0),
        end: new Date(base.getFullYear(), qStartMonth + 3, 0, 23, 59, 59, 999),
      });
    }
    return list;
  }

  // YEAR：最近 5 年
  for (let i = 4; i >= 0; i -= 1) {
    const year = now.getFullYear() - i;
    list.push({
      label: `${year}`,
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    });
  }
  return list;
}

function dayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function dayEnd(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function aggByBuckets(data, buckets, shiftDays = 0, shiftYears = 0) {
  // 按桶统计：支持按天数偏移（上期）和按年偏移（去年同期）
  return buckets.map((bucket) => {
    const start = new Date(bucket.start);
    const end = new Date(bucket.end);

    if (shiftDays !== 0) {
      start.setDate(start.getDate() + shiftDays);
      end.setDate(end.getDate() + shiftDays);
    }

    if (shiftYears !== 0) {
      start.setFullYear(start.getFullYear() + shiftYears);
      end.setFullYear(end.getFullYear() + shiftYears);
    }

    return data.filter((item) => {
      const time = new Date(item.time);
      return time >= start && time <= end;
    }).length;
  });
}

function buildBar(cur, prev) {
  // 结构对比统一按辖区展示，更直观反映辖区警情变化
  const categories = AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => item.label);
  const curSeries = categories.map((area) => cur.filter((item) => item.area === area).length);
  const prevSeries = categories.map((area) => prev.filter((item) => item.area === area).length);

  barChartData.value = {
    categories,
    series: [
      { name: '本期', data: curSeries },
      { name: '上期', data: prevSeries },
    ],
  };
}

function buildPie(cur) {
  const types = TYPE_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => item.value);
  pieChartData.value = {
    series: [
      {
        data: types.map((type) => ({
          name: type,
          value: cur.filter((item) => item.type === type).length,
        })),
      },
    ],
  };
}

function buildTop(cur) {
  const counter = {};
  cur.forEach((item) => {
    const key = item.address || '未知地址';
    counter[key] = (counter[key] || 0) + 1;
  });

  const sorted = Object.entries(counter)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  topChartData.value = {
    categories: sorted.map((row) => row.name),
    series: [{ name: '警情数', data: sorted.map((row) => row.value) }],
  };
}

function buildTable(cur, prev, ly) {
  // 表格固定按辖区输出，便于横向对比本期/上期/去年同期
  const rows = AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => {
    const area = item.label;
    const curVal = cur.filter((row) => row.area === area).length;
    const prevVal = prev.filter((row) => row.area === area).length;
    const lyVal = ly.filter((row) => row.area === area).length;
    return {
      name: area,
      cur: curVal,
      prev: prevVal,
      mom: pct(curVal, prevVal),
      yoyBase: lyVal,
      yoy: pct(curVal, lyVal),
    };
  });

  sortTable(rows);
}

function sortBy(key) {
  const asc = sortState.value.key === key ? !sortState.value.asc : false;
  sortState.value = { key, asc };
  sortTable(tableRows.value);
}

function sortTable(rows) {
  const { key, asc } = sortState.value;
  rows.sort((a, b) => (asc ? Number(a[key]) - Number(b[key]) : Number(b[key]) - Number(a[key])));
  tableRows.value = [...rows];
}

function pct(cur, base) {
  const b = Number(base || 0);
  if (b === 0) return cur === 0 ? 0 : 100;
  return Number((((cur - b) / Math.max(b, 1)) * 100).toFixed(0));
}

function generateMockIncidents() {
  // 生成稳定的本地 mock 数据，覆盖时间/类型/辖区三个筛选维度
  const list = [];
  const typePool = TYPE_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => item.value);
  const areaPool = AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => item.value);
  const statusPool = ['FEEDBACKED', 'ARRIVED', 'PENDING'];
  const addressPool = ['桂南路口', '长命水社区', '龙石广场', '五桂山街道口', '城西工业区', '文化路商圈'];

  for (let i = 0; i < 280; i += 1) {
    const dayOffset = Math.floor(Math.random() * 420);
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

    list.push({
      id: `incident-${i}`,
      type: typePool[Math.floor(Math.random() * typePool.length)],
      area: areaPool[Math.floor(Math.random() * areaPool.length)],
      time: d.toISOString(),
      isPreventable: Math.random() > 0.38,
      status: statusPool[Math.floor(Math.random() * statusPool.length)],
      address: addressPool[Math.floor(Math.random() * addressPool.length)],
    });
  }

  return list;
}

onLoad(() => {
  // 读取安全区高度，用于吸顶筛选条定位
  const sys = uni.getSystemInfoSync();
  safeTop.value = sys.safeAreaInsets?.top ?? sys.statusBarHeight ?? 0;
});

onShow(() => {
  loadDataByFilter();
  nextTick(() => measureStickyBase());
});

onReady(() => {
  nextTick(() => measureStickyBase());
});
</script>

<style lang="scss" scoped>
.analysis {
  min-height: 100%;
  padding: 0 24rpx 36rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.topNav {
  height: 64rpx;
  display: flex;
  align-items: center;
}

.backBtn {
  font-size: 56rpx;
  line-height: 1;
  color: #1f2b3a;
  padding: 0 8rpx;
}

.filterAnchor {
  width: 100%;
  height: 2rpx;
}

.filterBar {
  margin-top: 8rpx;
  width: 100%;
  padding: 10rpx 8rpx;
  border-radius: 16rpx;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10rpx;
  box-sizing: border-box;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.filterBarHidden {
  opacity: 0;
  pointer-events: none;
}

.filterBarFixed {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  margin-top: 0;
  z-index: 40;
  border-radius: 0 0 16rpx 16rpx;
  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.08);
}

.filterItem {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 6rpx;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.filterLabel {
  min-width: 0;
  max-width: 100%;
  color: #1f2b3a;
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filterArrow {
  color: #7a8594;
  font-size: 20rpx;
}

/* 选中态仅使用蓝字+下划线，不使用整块蓝底 */
.filterItemActive .filterLabel,
.filterItemActive .filterArrow {
  color: #1677ff;
}

.filterItemActive {
  position: relative;
}

.filterItemActive::after {
  content: '';
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: #1677ff;
}

.dropdownLayer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.dropdownPanel {
  background: #fff;
  border-radius: 0 0 24rpx 24rpx;
  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.08);
  max-height: 54vh;
  overflow: hidden;
}

.dropdownContent {
  max-height: 42vh;
  overflow-y: auto;
  padding: 12rpx 18rpx;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.optionItem {
  width: 100%;
  padding: 18rpx 16rpx;
  border-radius: 12rpx;
  background: #f8f9fb;
  border: 2rpx solid transparent;
  font-size: 28rpx;
  color: #1f2b3a;
  box-sizing: border-box;
}

.optionItem.gridOption {
  width: calc(33.333% - 8rpx);
  text-align: center;
  font-size: 24rpx;
}

/* 面板选中态使用蓝字+描边，避免大块蓝色背景 */
.optionItemActive {
  color: #1677ff;
  border-color: #1677ff;
  background: #f7fbff;
}

.panelActions {
  width: 100%;
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  border-top: 1px solid #eef2f7;
}

.panelBtn {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  padding: 14rpx 0;
  border-radius: 12rpx;
}

.panelBtn.ghost {
  background: #f4f6f8;
  color: #6e7a89;
}

.panelBtn.primary {
  background: #1677ff;
  color: #fff;
}

.dropdownMask {
  flex: 1;
  background: rgba(0, 0, 0, 0.42);
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  margin-top: 16rpx;
  box-sizing: border-box;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.metric {
  padding: 12rpx;
  border-radius: 12rpx;
  background: #f6f8fb;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.metricTop {
  display: flex;
  align-items: center;
  min-width: 0;
}

.metricTitle {
  font-size: 28rpx;
  color: #1f2b3a;
  white-space: nowrap;
  flex-shrink: 0;
}

.metricValue {
  margin-top: 6rpx;
  font-size: 44rpx;
  font-weight: 700;
  color: #0f75ff;
}

.metricTrend {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: #6e7a89;
}

.metricDesc {
  margin-top: 2rpx;
  color: #6b7785;
  font-size: 24rpx;
}

.tabs {
  display: flex;
  padding: 6rpx;
  gap: 8rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 12rpx;
  color: #5e6b7a;
  background: #f6f8fb;
  font-size: 30rpx;
}

.tab.active {
  color: #1677ff;
  background: #eaf3ff;
  font-weight: 700;
}

.sectionHead {
  margin-bottom: 8rpx;
}

.tableHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.sectionTitle {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2b3a;
}

.sectionSub {
  margin-left: 8rpx;
  font-size: 24rpx;
  color: #6e7a89;
}

.chips {
  display: flex;
  gap: 8rpx;
}

.chip {
  padding: 8rpx 14rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  color: #1677ff;
  font-size: 24rpx;
}

.tableCard .table {
  white-space: nowrap;
}

.thead,
.row {
  display: flex;
}

.cell {
  min-width: 140rpx;
  padding: 10rpx;
  box-sizing: border-box;
}

.cell.name {
  min-width: 170rpx;
}

.tbody .row:nth-child(odd) {
  background: #f6f8fb;
}
</style>
