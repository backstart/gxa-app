<template>
  <AppPage bg="transparent">
    <view class="analysis pageBg" @tap="handlePageTap">
      <view id="filterBarRef" class="filterBar card">
        <view
          :class="['filterItem', isDropdownActive('time') ? 'filterItemActive' : '']"
          @tap.stop="openDropdown('time')"
        >
          <text class="filterLabel">时间范围</text>
          <text class="filterValue">{{ timeFilterSummary }}</text>
          <text class="filterArrow">{{ isDropdownActive('time') ? '▴' : '▾' }}</text>
        </view>
        <view
          :class="['filterItem', isDropdownActive('area') ? 'filterItemActive' : '']"
          @tap.stop="openDropdown('area')"
        >
          <text class="filterLabel">辖区范围</text>
          <text class="filterValue">{{ areaLabel }}</text>
          <text class="filterArrow">{{ isDropdownActive('area') ? '▴' : '▾' }}</text>
        </view>
      </view>

      <view v-if="dropdown.visible" class="sheetLayer" :style="{ top: `${dropdownTop}px` }" @touchmove.stop.prevent>
        <view class="sheetPanel card" @tap.stop>
          <scroll-view class="panelBody" scroll-y>
            <template v-if="dropdown.key === 'time'">
              <view class="panelSection">
                <text class="panelSectionTitle">常用时间范围</text>
                <view class="quickGrid">
                  <view
                    v-for="item in QUICK_TIME_OPTIONS"
                    :key="item.value"
                    :class="['quickItem', timeDraft.preset === item.value ? 'quickItemActive' : '']"
                    @tap.stop="pickQuickTime(item.value)"
                  >
                    {{ item.label }}
                  </view>
                </view>
              </view>

              <view class="panelSection">
                <text class="panelSectionTitle">自定义时间范围</text>
                <view class="dateRangeRow">
                  <picker mode="date" :value="timeDraft.start" @change="onDateChange('start', $event)">
                    <view :class="['dateBox', timeDraft.preset === 'CUSTOM' ? 'dateBoxActive' : '']">{{ timeDraft.start }}</view>
                  </picker>
                  <text class="dateDash">-</text>
                  <picker mode="date" :value="timeDraft.end" @change="onDateChange('end', $event)">
                    <view :class="['dateBox', timeDraft.preset === 'CUSTOM' ? 'dateBoxActive' : '']">{{ timeDraft.end }}</view>
                  </picker>
                </view>
              </view>
            </template>

            <template v-else>
              <view class="areaList">
                <view
                  v-for="item in AREA_OPTIONS"
                  :key="item.value"
                  :class="['areaItem', areaDraft === item.value ? 'areaItemActive' : '']"
                  @tap.stop="areaDraft = item.value"
                >
                  {{ item.label }}
                </view>
              </view>
            </template>
          </scroll-view>

          <view class="panelActions">
            <view class="panelBtn panelBtnGhost" @tap.stop="resetCurrentFilter">重置</view>
            <view class="panelBtn panelBtnPrimary" @tap.stop="confirmCurrentFilter">确定</view>
          </view>
        </view>
        <view class="sheetMask" @tap="closeDropdown"></view>
      </view>

      <view class="scopeCard card">
        <view class="scopeTitleRow">
          <view class="scopeTitleWrap">
            <text class="scopeTitle">{{ scopeDisplay.title }}</text>
            <text class="scopeSub">{{ scopeDisplay.sub }}</text>
          </view>
        </view>
        <text class="scopeArea">辖区：{{ areaLabel }}</text>
        <view class="scopeDivider"></view>
        <view class="scopeTotalRow">
          <text class="scopeTotalLabel">警情总量</text>
          <view class="scopeTotalMain">
            <view class="scopeTotalValueWrap">
              <text class="scopeTotalValue">{{ totalSummary.count }}</text>
              <text class="scopeTotalUnit">起</text>
            </view>
            <view class="scopeCompareBlock">
              <text class="compareMeta">环比</text>
              <text :class="['compareValue', deltaClass(totalSummary.mom)]">{{ formatDelta(totalSummary.mom) }}</text>
              <text class="compareDivider">|</text>
              <text class="compareMeta">同比</text>
              <text :class="['compareValue', deltaClass(totalSummary.yoy)]">{{ formatDelta(totalSummary.yoy) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="categoryGrid">
        <view
          v-for="card in categoryCards"
          :key="card.key"
          :class="['categoryCard', activeCategory === card.key ? 'categoryCardActive' : '']"
          @tap.stop="toggleCategory(card.key)"
        >
          <text class="categoryTitle">{{ card.label }}</text>
          <text class="categoryCount">{{ card.count }}</text>
          <view class="categoryDeltaLine">
            <text class="categoryDeltaLabel">同比</text>
            <text :class="['categoryDeltaValue', deltaClass(card.yoy)]">{{ formatDelta(card.yoy) }}</text>
          </view>
          <view class="categoryDeltaLine">
            <text class="categoryDeltaLabel">环比</text>
            <text :class="['categoryDeltaValue', deltaClass(card.mom)]">{{ formatDelta(card.mom) }}</text>
          </view>
        </view>
      </view>

      <view class="detailBar card">
        <text class="detailBarTitle">分析报告：{{ activeCategoryLabel }}</text>
        <text class="detailBarDesc">{{ detailScopeText }}</text>
      </view>

      <view class="modeCard card">
        <view :class="['modeTab', viewMode === 'chart' ? 'modeTabActive' : '']" @tap.stop="viewMode = 'chart'">图表</view>
        <view :class="['modeTab', viewMode === 'table' ? 'modeTabActive' : '']" @tap.stop="viewMode = 'table'">表格</view>
      </view>

      <template v-if="viewMode === 'chart'">
        <view class="card sectionCard">
          <view class="sectionHead">
            <text class="sectionTitle">趋势图</text>
            <text class="sectionSub">本期 / 上期 / 去年同期</text>
          </view>
          <qiun-data-charts type="line" :chartData="trendChartData" background="none" :height="360" />
        </view>

        <view class="card sectionCard">
          <view class="sectionHead">
            <text class="sectionTitle">结构对比图</text>
            <text class="sectionSub">按辖区汇总</text>
          </view>
          <qiun-data-charts type="column" :chartData="barChartData" background="none" :height="360" />
        </view>

        <view class="card sectionCard">
          <view class="sectionHead">
            <text class="sectionTitle">类型占比图</text>
          </view>
          <qiun-data-charts type="ring" :chartData="pieChartData" :opts="pieChartOpts" background="none" :height="320" />
        </view>

        <view class="card sectionCard">
          <view class="sectionHead">
            <text class="sectionTitle">辖区占比图</text>
          </view>
          <qiun-data-charts type="pie" :chartData="areaPieChartData" background="none" :height="320" />
        </view>

        <view class="card sectionCard">
          <view class="sectionHead">
            <text class="sectionTitle">时段分布图</text>
            <text class="sectionSub">0-6 / 6-12 / 12-18 / 18-24</text>
          </view>
          <qiun-data-charts type="column" :chartData="periodChartData" background="none" :height="320" />
        </view>

        <view class="card sectionCard">
          <view class="sectionHead">
            <text class="sectionTitle">热点 Top10</text>
          </view>
          <qiun-data-charts type="bar" :chartData="topChartData" :opts="topChartOpts" background="none" :height="380" />
        </view>
      </template>

      <view v-else class="card sectionCard">
        <view class="tableTabs">
          <view :class="['tableTab', tableMode === 'area' ? 'tableTabActive' : '']" @tap.stop="tableMode = 'area'">辖区汇总</view>
          <view :class="['tableTab', tableMode === 'type' ? 'tableTabActive' : '']" @tap.stop="tableMode = 'type'">类型汇总</view>
          <view :class="['tableTab', tableMode === 'hot' ? 'tableTabActive' : '']" @tap.stop="tableMode = 'hot'">热点明细</view>
        </view>

        <scroll-view v-if="tableMode !== 'hot'" scroll-x class="tableWrap">
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
import AppPage from '@/components/app/AppPage.vue';
import qiunDataCharts from '@/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';

const DAY_MS = 24 * 60 * 60 * 1000;

const QUICK_TIME_OPTIONS = [
  { value: 'TODAY', label: '当天' },
  { value: 'WEEK', label: '本周' },
  { value: 'MONTH', label: '本月' },
  { value: 'QUARTER', label: '本季度' },
  { value: 'YEAR', label: '本年' },
];

const AREA_OPTIONS = [
  { value: 'ALL', label: '全部辖区' },
  { value: '五桂山街道', label: '五桂山街道' },
  { value: '长命水', label: '长命水' },
  { value: '龙石', label: '龙石' },
  { value: '桂南', label: '桂南' },
];

const CATEGORY_OPTIONS = [
  { key: 'DISPUTE', label: '纠纷类' },
  { key: 'LAW', label: '刑事行政类' },
  { key: 'HELP', label: '求助类' },
  { key: 'CONSULT', label: '咨询类' },
  { key: 'TRAFFIC', label: '交通类' },
  { key: 'OTHER', label: '其他类' },
];

const TYPE_OPTIONS = ['刑事', '行政', '紧急求助', '举报类', '咨询类', '纠纷类', '交通类', '其他类'];
const AREA_ADDRESS_MAP = {
  五桂山街道: [
    { name: '文化路商圈', weight: 12 },
    { name: '城西工业区', weight: 9 },
    { name: '城南车站', weight: 7 },
    { name: '旧市场周边', weight: 6 },
  ],
  长命水: [
    { name: '长命水社区', weight: 13 },
    { name: '学校周边', weight: 9 },
    { name: '中山路口', weight: 6 },
    { name: '长命水市场', weight: 8 },
  ],
  龙石: [
    { name: '龙石广场', weight: 14 },
    { name: '龙石工业路', weight: 8 },
    { name: '龙石桥头', weight: 6 },
    { name: '文化路商圈', weight: 4 },
  ],
  桂南: [
    { name: '桂南路口', weight: 12 },
    { name: '桂南老街', weight: 10 },
    { name: '城西工业区', weight: 5 },
    { name: '学校周边', weight: 4 },
  ],
};

const TOP_BAR_COLORS = ['#2B7FFF', '#4EA1FF', '#73BEFF', '#7D8CFF', '#FF9F43', '#F66F6A', '#7CCB8A', '#5AD1C5', '#C387FF', '#F7C24A'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateText(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateText(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addDays(date, amount) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

function addMonths(date, amount) {
  const value = new Date(date);
  value.setMonth(value.getMonth() + amount);
  return value;
}

function addYears(date, amount) {
  const value = new Date(date);
  value.setFullYear(value.getFullYear() + amount);
  return value;
}
function startOfWeek(date) {
  const value = startOfDay(date);
  const weekDay = value.getDay() || 7;
  value.setDate(value.getDate() - weekDay + 1);
  return value;
}

function endOfWeek(date) {
  return endOfDay(addDays(startOfWeek(date), 6));
}

function startOfMonth(date) {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonth(date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function startOfQuarter(date) {
  const month = Math.floor(date.getMonth() / 3) * 3;
  return startOfDay(new Date(date.getFullYear(), month, 1));
}

function endOfQuarter(date) {
  const start = startOfQuarter(date);
  return endOfDay(new Date(start.getFullYear(), start.getMonth() + 3, 0));
}

function startOfYear(date) {
  return startOfDay(new Date(date.getFullYear(), 0, 1));
}

function endOfYear(date) {
  return endOfDay(new Date(date.getFullYear(), 11, 31));
}

function diffDaysInclusive(start, end) {
  return Math.round((endOfDay(end) - startOfDay(start)) / DAY_MS) + 1;
}

function formatMonthDay(date) {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function formatPercent(value, total) {
  if (!total) return '0';
  return ((value / total) * 100).toFixed(1).replace(/\.0$/, '');
}

function percentDelta(current, base) {
  if (!base && !current) return '0';
  if (!base) return String(Math.min(current * 18, 180));
  return (((current - base) / base) * 100).toFixed(0);
}

function formatDelta(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return '0%';
  return `${num > 0 ? '+' : ''}${num}%`;
}

function deltaClass(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return 'deltaFlat';
  return num > 0 ? 'deltaUp' : 'deltaDown';
}

function getWeekInfo(date) {
  const current = startOfDay(date);
  const weekDay = current.getDay() || 7;
  const thursday = addDays(current, 4 - weekDay);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil((((thursday - yearStart) / DAY_MS) + 1) / 7);
  return {
    year: thursday.getFullYear(),
    week,
    start: startOfWeek(current),
    end: endOfWeek(current),
  };
}

function buildRangeFromPreset(preset, anchor = new Date()) {
  if (preset === 'TODAY') return { start: startOfDay(anchor), end: endOfDay(anchor) };
  if (preset === 'WEEK') return { start: startOfWeek(anchor), end: endOfWeek(anchor) };
  if (preset === 'MONTH') return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
  if (preset === 'QUARTER') return { start: startOfQuarter(anchor), end: endOfQuarter(anchor) };
  return { start: startOfYear(anchor), end: endOfYear(anchor) };
}

function presetLabel(preset) {
  return QUICK_TIME_OPTIONS.find((item) => item.value === preset)?.label || '自定义';
}

function cloneFilter(source) {
  return JSON.parse(JSON.stringify(source));
}

function createDefaultFilter() {
  const range = buildRangeFromPreset('WEEK');
  return {
    preset: 'WEEK',
    start: toDateText(range.start),
    end: toDateText(range.end),
    area: 'ALL',
  };
}

function getAreaLabel(area) {
  return AREA_OPTIONS.find((item) => item.value === area)?.label || '全部辖区';
}

function getCategoryKey(type) {
  if (type === '纠纷类') return 'DISPUTE';
  if (type === '刑事' || type === '行政') return 'LAW';
  if (type === '紧急求助') return 'HELP';
  if (type === '咨询类') return 'CONSULT';
  if (type === '交通类') return 'TRAFFIC';
  return 'OTHER';
}

function getCategoryLabel(categoryKey) {
  return CATEGORY_OPTIONS.find((item) => item.key === categoryKey)?.label || '全部警情';
}

function getScopeDisplay(filterValue) {
  const start = parseDateText(filterValue.start);
  const end = parseDateText(filterValue.end);
  if (filterValue.preset === 'TODAY') {
    return { title: filterValue.start, sub: '当天' };
  }
  if (filterValue.preset === 'WEEK') {
    const weekInfo = getWeekInfo(start);
    return {
      title: `${weekInfo.year}年第${weekInfo.week}周`,
      sub: `${formatMonthDay(start)} - ${formatMonthDay(end)}`,
    };
  }
  if (filterValue.preset === 'MONTH') {
    return {
      title: `${start.getFullYear()}年${pad(start.getMonth() + 1)}月`,
      sub: `${formatMonthDay(start)} - ${formatMonthDay(end)}`,
    };
  }
  if (filterValue.preset === 'QUARTER') {
    return {
      title: `${start.getFullYear()}年第${Math.floor(start.getMonth() / 3) + 1}季度`,
      sub: `${formatMonthDay(start)} - ${formatMonthDay(end)}`,
    };
  }
  if (filterValue.preset === 'YEAR') {
    return {
      title: `${start.getFullYear()}年`,
      sub: `${formatMonthDay(start)} - ${formatMonthDay(end)}`,
    };
  }
  return {
    title: filterValue.start === filterValue.end ? filterValue.start : `${filterValue.start} 至 ${filterValue.end}`,
    sub: '自定义时间范围',
  };
}

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function pickWeighted(items, seed) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let point = seededRandom(seed) * total;
  for (const item of items) {
    point -= item.weight;
    if (point <= 0) return item.name || item.value;
  }
  return items[items.length - 1].name || items[items.length - 1].value;
}

function buildAreaWeights(dayIndex, date) {
  const weekday = date.getDay() || 7;
  return [
    { value: '五桂山街道', weight: 1.18 + seededRandom(dayIndex + 11) * 0.4 + (weekday >= 5 ? 0.2 : 0) },
    { value: '长命水', weight: 1.05 + seededRandom(dayIndex + 22) * 0.45 + (weekday <= 3 ? 0.18 : 0) },
    { value: '龙石', weight: 1.12 + seededRandom(dayIndex + 33) * 0.5 + Math.max(0, Math.sin(dayIndex / 8)) * 0.22 },
    { value: '桂南', weight: 0.92 + seededRandom(dayIndex + 44) * 0.38 + Math.max(0, Math.cos(dayIndex / 11)) * 0.18 },
  ];
}

function buildTypeWeights(area, hour, dayIndex, weekday) {
  return [
    { value: '纠纷类', weight: 1.15 + (hour >= 18 ? 0.75 : 0.15) + (weekday >= 5 ? 0.45 : 0.12) + (area === '龙石' ? 0.18 : 0) },
    { value: '刑事', weight: 0.4 + (hour < 6 ? 0.45 : 0.08) + seededRandom(dayIndex + hour + 51) * 0.22 },
    { value: '行政', weight: 0.68 + (hour >= 8 && hour < 18 ? 0.38 : 0.1) + (area === '五桂山街道' ? 0.12 : 0) },
    { value: '紧急求助', weight: 0.54 + (hour < 8 ? 0.32 : 0.08) + seededRandom(dayIndex + hour + 63) * 0.25 },
    { value: '咨询类', weight: 0.72 + (hour >= 8 && hour < 18 ? 0.65 : 0.05) + (weekday <= 5 ? 0.18 : 0) },
    { value: '交通类', weight: 0.76 + ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19) ? 0.82 : 0.08) + (area === '桂南' ? 0.22 : 0) },
    { value: '举报类', weight: 0.48 + (hour >= 12 && hour < 22 ? 0.2 : 0.06) + seededRandom(dayIndex + hour + 75) * 0.18 },
    { value: '其他类', weight: 0.56 + seededRandom(dayIndex + hour + 87) * 0.24 },
  ];
}

function generateMockIncidents() {
  const incidents = [];
  const today = startOfDay(new Date());

  for (let offset = 0; offset < 420; offset += 1) {
    const currentDate = addDays(today, -offset);
    const weekday = currentDate.getDay() || 7;
    const month = currentDate.getMonth();
    const seasonal = 1 + Math.sin((offset + 5) / 9) * 0.28 + Math.cos((offset + 17) / 21) * 0.22;
    const weekdayBoost = weekday >= 5 ? 1.18 : weekday === 1 ? 0.9 : 1.02;
    const monthlyBoost = [1.12, 1.06, 1.0, 0.96, 0.92, 0.98, 1.08, 1.14, 1.02, 1.1, 1.06, 1.18][month];
    const trendBoost = currentDate.getFullYear() === today.getFullYear() ? 1.08 : 0.94;
    const noise = seededRandom(offset + 101) * 2.6;
    const dailyCount = Math.max(4, Math.round((6.5 + noise) * seasonal * weekdayBoost * monthlyBoost * trendBoost));

    for (let index = 0; index < dailyCount; index += 1) {
      const area = pickWeighted(buildAreaWeights(offset * 7 + index, currentDate), offset * 17 + index + 3);
      const hourSeed = seededRandom(offset * 29 + index + 7);
      let hour = Math.floor(hourSeed * 24);
      if (hourSeed > 0.62 && hourSeed < 0.86) hour = 17 + Math.floor(seededRandom(offset * 31 + index + 19) * 5);
      const minute = Math.floor(seededRandom(offset * 37 + index + 23) * 60);
      const eventDate = new Date(currentDate);
      eventDate.setHours(hour, minute, 0, 0);

      const type = pickWeighted(buildTypeWeights(area, hour, offset * 13 + index, weekday), offset * 41 + index + 13);
      const address = pickWeighted(AREA_ADDRESS_MAP[area], offset * 53 + index + 17);

      incidents.push({
        id: `INC-${offset + 1}-${index + 1}`,
        type,
        area,
        time: eventDate.toISOString(),
        address,
      });
    }
  }

  return incidents;
}

const filter = reactive(createDefaultFilter());
const timeDraft = reactive(createDefaultFilter());
const areaDraft = ref('ALL');
const dropdown = reactive({ visible: false, key: '' });
const viewMode = ref('chart');
const tableMode = ref('area');
const activeCategory = ref('ALL');
const rawIncidents = ref(generateMockIncidents());

const pieChartOpts = ref({
  title: { name: '', fontSize: 1, color: 'transparent' },
  subtitle: { name: '', fontSize: 1, color: 'transparent' },
  extra: { ring: { ringWidth: 30 } },
});

const topChartOpts = ref({
  legend: { show: false },
});

const areaLabel = computed(() => getAreaLabel(filter.area));
const timeFilterSummary = computed(() => (filter.preset === 'CUSTOM' ? '自定义' : presetLabel(filter.preset)));
const scopeDisplay = computed(() => getScopeDisplay(filter));

const scopedIncidents = computed(() => {
  const start = startOfDay(parseDateText(filter.start)).getTime();
  const end = endOfDay(parseDateText(filter.end)).getTime();
  return rawIncidents.value.filter((item) => {
    const time = new Date(item.time).getTime();
    const inTime = time >= start && time <= end;
    const inArea = filter.area === 'ALL' ? true : item.area === filter.area;
    return inTime && inArea;
  });
});

const detailIncidents = computed(() => {
  if (activeCategory.value === 'ALL') return scopedIncidents.value;
  return scopedIncidents.value.filter((item) => getCategoryKey(item.type) === activeCategory.value);
});

const activeCategoryLabel = computed(() => (activeCategory.value === 'ALL' ? '全部警情' : getCategoryLabel(activeCategory.value)));
const detailScopeText = computed(() => `${scopeDisplay.value.title}${scopeDisplay.value.sub ? ` · ${scopeDisplay.value.sub}` : ''} · ${areaLabel.value}`);

function getCurrentRange() {
  return {
    start: startOfDay(parseDateText(filter.start)),
    end: endOfDay(parseDateText(filter.end)),
  };
}

function getPreviousRange(range) {
  const span = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - span);
  return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
}

function getLastYearRange(range) {
  return {
    start: startOfDay(addYears(range.start, -1)),
    end: endOfDay(addYears(range.end, -1)),
  };
}

function filterIncidentsByRule(range, area, categoryKey) {
  const start = range.start.getTime();
  const end = range.end.getTime();
  return rawIncidents.value.filter((item) => {
    const time = new Date(item.time).getTime();
    const inTime = time >= start && time <= end;
    const inArea = area === 'ALL' ? true : item.area === area;
    const inCategory = categoryKey === 'ALL' ? true : getCategoryKey(item.type) === categoryKey;
    return inTime && inArea && inCategory;
  });
}

const comparisonSets = computed(() => {
  const currentRange = getCurrentRange();
  const previousRange = getPreviousRange(currentRange);
  const lastYearRange = getLastYearRange(currentRange);
  return {
    currentRange,
    previousRange,
    lastYearRange,
    cur: filterIncidentsByRule(currentRange, filter.area, activeCategory.value),
    prev: filterIncidentsByRule(previousRange, filter.area, activeCategory.value),
    ly: filterIncidentsByRule(lastYearRange, filter.area, activeCategory.value),
  };
});

const scopedComparisonSets = computed(() => {
  const currentRange = getCurrentRange();
  const previousRange = getPreviousRange(currentRange);
  const lastYearRange = getLastYearRange(currentRange);
  return {
    cur: filterIncidentsByRule(currentRange, filter.area, 'ALL'),
    prev: filterIncidentsByRule(previousRange, filter.area, 'ALL'),
    ly: filterIncidentsByRule(lastYearRange, filter.area, 'ALL'),
  };
});

function buildCategoryCountMap(list) {
  return list.reduce((result, item) => {
    const categoryKey = getCategoryKey(item.type);
    result[categoryKey] = (result[categoryKey] || 0) + 1;
    return result;
  }, {});
}

const totalSummary = computed(() => {
  const { cur, prev, ly } = scopedComparisonSets.value;
  return {
    count: cur.length,
    mom: percentDelta(cur.length, prev.length),
    yoy: percentDelta(cur.length, ly.length),
  };
});

const categoryCards = computed(() => {
  const { cur, prev, ly } = scopedComparisonSets.value;
  const curMap = buildCategoryCountMap(cur);
  const prevMap = buildCategoryCountMap(prev);
  const lyMap = buildCategoryCountMap(ly);
  return CATEGORY_OPTIONS.map((item) => ({
    ...item,
    count: curMap[item.key] || 0,
    mom: percentDelta(curMap[item.key] || 0, prevMap[item.key] || 0),
    yoy: percentDelta(curMap[item.key] || 0, lyMap[item.key] || 0),
  }));
});
function buildDayBuckets(start, count) {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = startOfDay(addDays(start, index));
    return {
      start: bucketStart,
      end: endOfDay(bucketStart),
      label: `${bucketStart.getMonth() + 1}/${bucketStart.getDate()}`,
    };
  });
}

function buildMonthBuckets(start, count) {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = startOfMonth(addMonths(start, index));
    return {
      start: bucketStart,
      end: endOfMonth(bucketStart),
      label: `${bucketStart.getMonth() + 1}月`,
    };
  });
}

function countByBuckets(list, buckets) {
  return buckets.map((bucket) =>
    list.filter((item) => {
      const time = new Date(item.time).getTime();
      return time >= bucket.start.getTime() && time <= bucket.end.getTime();
    }).length,
  );
}

function buildTrendChart(sets) {
  const spanDays = diffDaysInclusive(sets.currentRange.start, sets.currentRange.end);
  const useMonth = spanDays > 31;
  const currentBuckets = useMonth
    ? buildMonthBuckets(sets.currentRange.start, Math.max(1, Math.round((sets.currentRange.end.getMonth() - sets.currentRange.start.getMonth()) + 1 + (sets.currentRange.end.getFullYear() - sets.currentRange.start.getFullYear()) * 12)))
    : buildDayBuckets(sets.currentRange.start, spanDays);
  const previousBuckets = useMonth
    ? buildMonthBuckets(sets.previousRange.start, currentBuckets.length)
    : buildDayBuckets(sets.previousRange.start, currentBuckets.length);
  const lastYearBuckets = useMonth
    ? buildMonthBuckets(sets.lastYearRange.start, currentBuckets.length)
    : buildDayBuckets(sets.lastYearRange.start, currentBuckets.length);

  return {
    categories: currentBuckets.map((item) => item.label),
    series: [
      { name: '本期', data: countByBuckets(sets.cur, currentBuckets) },
      { name: '上期', data: countByBuckets(sets.prev, previousBuckets) },
      { name: '去年同期', data: countByBuckets(sets.ly, lastYearBuckets) },
    ],
  };
}

function buildAreaCompareChart(sets) {
  const categories = AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => item.label);
  return {
    categories,
    series: [
      { name: '本期', data: categories.map((area) => sets.cur.filter((item) => item.area === area).length) },
      { name: '上期', data: categories.map((area) => sets.prev.filter((item) => item.area === area).length) },
      { name: '去年同期', data: categories.map((area) => sets.ly.filter((item) => item.area === area).length) },
    ],
  };
}

function buildTypePieChart(list) {
  return {
    series: [
      {
        data: TYPE_OPTIONS.map((type) => ({ name: type, value: list.filter((item) => item.type === type).length })).filter((item) => item.value > 0),
      },
    ],
  };
}

function buildAreaPieChart(list) {
  return {
    series: [
      {
        data: AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => ({ name: item.label, value: list.filter((row) => row.area === item.value).length })).filter((item) => item.value > 0),
      },
    ],
  };
}

function buildPeriodChart(list) {
  const groups = [
    { label: '0-6', start: 0, end: 6 },
    { label: '6-12', start: 6, end: 12 },
    { label: '12-18', start: 12, end: 18 },
    { label: '18-24', start: 18, end: 24 },
  ];
  return {
    categories: groups.map((item) => item.label),
    series: [
      {
        name: '警情数',
        data: groups.map((group) => list.filter((item) => {
          const hour = new Date(item.time).getHours();
          return hour >= group.start && hour < group.end;
        }).length),
      },
    ],
  };
}

function buildTopChart(list) {
  const countMap = {};
  list.forEach((item) => {
    countMap[item.address] = (countMap[item.address] || 0) + 1;
  });
  const sorted = Object.keys(countMap)
    .map((key) => ({ name: key, value: countMap[key] }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);
  return {
    categories: sorted.map((item) => item.name),
    series: sorted.map((item, index) => ({
      name: item.name,
      color: TOP_BAR_COLORS[index % TOP_BAR_COLORS.length],
      data: sorted.map((current, currentIndex) => (currentIndex === index ? current.value : null)),
    })),
  };
}

function rowSummary(name, field, cur, prev, ly) {
  const curValue = cur.filter((item) => item[field] === name).length;
  const prevValue = prev.filter((item) => item[field] === name).length;
  const lyValue = ly.filter((item) => item[field] === name).length;
  return {
    name,
    cur: curValue,
    prev: prevValue,
    mom: percentDelta(curValue, prevValue),
    yoyBase: lyValue,
    yoy: percentDelta(curValue, lyValue),
  };
}

function buildHotRows(list) {
  const countMap = {};
  const areaMap = {};
  list.forEach((item) => {
    countMap[item.address] = (countMap[item.address] || 0) + 1;
    areaMap[item.address] = item.area;
  });
  const total = list.length;
  return Object.keys(countMap)
    .map((key) => ({
      name: key,
      area: areaMap[key],
      count: countMap[key],
      percent: formatPercent(countMap[key], total),
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);
}

const trendChartData = computed(() => buildTrendChart(comparisonSets.value));
const barChartData = computed(() => buildAreaCompareChart(comparisonSets.value));
const pieChartData = computed(() => buildTypePieChart(detailIncidents.value));
const areaPieChartData = computed(() => buildAreaPieChart(detailIncidents.value));
const periodChartData = computed(() => buildPeriodChart(detailIncidents.value));
const topChartData = computed(() => buildTopChart(detailIncidents.value));

const tableRowsArea = computed(() => {
  const { cur, prev, ly } = comparisonSets.value;
  return AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => rowSummary(item.value, 'area', cur, prev, ly));
});

const tableRowsType = computed(() => {
  const { cur, prev, ly } = comparisonSets.value;
  return TYPE_OPTIONS.map((item) => rowSummary(item, 'type', cur, prev, ly));
});

const tableRowsHot = computed(() => buildHotRows(detailIncidents.value));
const currentTableRows = computed(() => (tableMode.value === 'area' ? tableRowsArea.value : tableRowsType.value));
const instance = getCurrentInstance();
const dropdownTop = ref(0);

watch(
  () => filter.area,
  () => {
    if (tableMode.value === 'area' && filter.area !== 'ALL') {
      tableMode.value = 'type';
    }
  },
);

function openDropdown(key) {
  if (dropdown.visible && dropdown.key === key) {
    closeDropdown();
    return;
  }
  if (key === 'time') Object.assign(timeDraft, cloneFilter(filter));
  if (key === 'area') areaDraft.value = filter.area;
  dropdown.visible = true;
  dropdown.key = key;
  nextTick(updateDropdownTop);
}

function closeDropdown() {
  dropdown.visible = false;
  dropdown.key = '';
}

function updateDropdownTop() {
  if (!instance) return;
  const query = uni.createSelectorQuery().in(instance);
  query.select('#filterBarRef').boundingClientRect();
  query.exec((res) => {
    const rect = res?.[0];
    dropdownTop.value = Number(rect?.bottom || 0);
  });
}

function handlePageTap() {
  if (dropdown.visible) closeDropdown();
}

function pickQuickTime(preset) {
  const range = buildRangeFromPreset(preset);
  timeDraft.preset = preset;
  timeDraft.start = toDateText(range.start);
  timeDraft.end = toDateText(range.end);
}

function onDateChange(field, event) {
  timeDraft[field] = event.detail.value;
  timeDraft.preset = 'CUSTOM';
}

function isDropdownActive(key) {
  return dropdown.visible && dropdown.key === key;
}

function resetCurrentFilter() {
  const defaults = createDefaultFilter();
  if (dropdown.key === 'time') {
    Object.assign(timeDraft, defaults);
  }
  if (dropdown.key === 'area') {
    areaDraft.value = defaults.area;
  }
}

function confirmCurrentFilter() {
  if (dropdown.key === 'time') {
    if (timeDraft.start > timeDraft.end) {
      uni.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' });
      return;
    }
    Object.assign(filter, cloneFilter(timeDraft));
  }
  if (dropdown.key === 'area') {
    filter.area = areaDraft.value;
  }
  closeDropdown();
}

function toggleCategory(categoryKey) {
  activeCategory.value = activeCategory.value === categoryKey ? 'ALL' : categoryKey;
}
</script>

<style lang="scss" scoped>
.analysis {
  min-height: 100vh;
  padding: 0 24rpx 32rpx;
  box-sizing: border-box;
  --blue-main: #0f75ff;
  --blue-deep: #2d7df6;
  --blue-soft: #f3f7ff;
  --blue-border: #dbe7ff;
  --text-main: #1b2b43;
  --text-sub: #7b8799;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(18, 38, 63, 0.08);
}

.filterBar {
  display: flex;
  gap: 16rpx;
  padding: 10rpx;
  margin-top: 14rpx;
  margin-bottom: 18rpx;
}

.filterItem {
  flex: 1;
  min-height: 70rpx;
  border-radius: 16rpx;
  background: linear-gradient(180deg, #fafdff 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  border: 2rpx solid transparent;
}

.filterItemActive {
  background: var(--blue-soft);
  border-color: var(--blue-border);
}

.filterLabel {
  font-size: 20rpx;
  color: var(--text-sub);
}

.filterValue {
  font-size: 26rpx;
  color: var(--text-main);
  font-weight: 600;
}

.filterArrow {
  font-size: 18rpx;
  color: var(--blue-main);
}

.sheetLayer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.sheetPanel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 68vh;
  border-radius: 0 0 18rpx 18rpx;
  margin: 0 24rpx;
}

.sheetMask {
  flex: 1;
  background: rgba(20, 34, 60, 0.26);
  margin-top: 0;
}
.panelHead {
  padding: 24rpx 24rpx 14rpx;
}

.panelTitle {
  display: block;
  font-size: 34rpx;
  color: var(--text-main);
  font-weight: 700;
}

.panelDesc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--text-sub);
}

.panelBody {
  flex: 1;
  padding: 18rpx 24rpx 12rpx;
  box-sizing: border-box;
}

.panelSection {
  margin-bottom: 28rpx;
}

.panelSectionTitle {
  display: block;
  margin-bottom: 16rpx;
  font-size: 30rpx;
  color: var(--text-main);
  font-weight: 700;
}

.quickGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.quickItem {
  height: 80rpx;
  border-radius: 14rpx;
  background: #f4f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #3b4c68;
  border: 2rpx solid transparent;
}

.quickItemActive {
  background: var(--blue-soft);
  color: #4a6ea8;
  border-color: var(--blue-border);
  font-weight: 600;
}

.dateRangeRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.dateRangeRow picker {
  flex: 1;
}

.dateBox {
  height: 84rpx;
  border-radius: 14rpx;
  background: #f4f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #4b5b74;
  border: 2rpx solid transparent;
}

.dateBoxActive {
  background: var(--blue-soft);
  border-color: var(--blue-border);
  color: #4a6ea8;
}

.dateDash {
  font-size: 30rpx;
  color: var(--text-sub);
}

.areaList {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.areaItem {
  min-height: 82rpx;
  padding: 0 24rpx;
  border-radius: 14rpx;
  background: #f4f7fb;
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #33435d;
  border: 2rpx solid transparent;
}

.areaItemActive {
  background: var(--blue-soft);
  border-color: var(--blue-border);
  color: #4a6ea8;
  font-weight: 600;
}

.panelActions {
  display: flex;
  gap: 18rpx;
  padding: 18rpx 24rpx 24rpx;
}

.panelBtn {
  flex: 1;
  height: 78rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
}

.panelBtnGhost {
  background: #f1f4f9;
  color: #7c889a;
}

.panelBtnPrimary {
  background: linear-gradient(90deg, #0f75ff, #4a99ff);
  color: #ffffff;
}

.scopeCard {
  padding: 22rpx 20rpx;
  margin-bottom: 18rpx;
}

.scopeTitleRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.scopeTitleWrap {
  flex: 1;
}

.scopeTitle {
  display: block;
  font-size: 34rpx;
  line-height: 1.2;
  color: var(--text-main);
  font-weight: 700;
}

.scopeSub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-sub);
}

.scopeArea {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--text-sub);
}

.scopeDivider {
  height: 2rpx;
  margin: 24rpx 0;
  background: #ebf0f7;
}

.scopeTotalRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.scopeTotalMain {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.scopeCompareText {
  font-size: 24rpx;
  text-align: right;
  flex-shrink: 0;
}

.scopeCompareBlock {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  flex-wrap: wrap;
}

.compareMeta {
  font-size: 22rpx;
  color: var(--text-sub);
}

.compareDivider {
  font-size: 22rpx;
  color: #a9b3c2;
}

.compareValue {
  font-size: 24rpx;
  font-weight: 700;
}

.deltaUp {
  color: #eb5757;
}

.deltaDown {
  color: #32a852;
}

.deltaFlat {
  color: #8b97a8;
}

.scopeTotalLabel {
  font-size: 26rpx;
  color: #5f708a;
  flex-shrink: 0;
}

.scopeTotalValueWrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8rpx;
  flex: 1;
}

.scopeTotalValue {
  font-size: 56rpx;
  line-height: 1;
  color: var(--blue-main);
  font-weight: 700;
}

.scopeTotalUnit {
  font-size: 24rpx;
  color: var(--text-sub);
}

.categoryGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.categoryCard {
  min-height: 198rpx;
  padding: 18rpx 12rpx;
  border-radius: 16rpx;
  background: linear-gradient(180deg, #fafdff 0%, #ffffff 100%);
  border: 2rpx solid transparent;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.categoryCardActive {
  background: var(--blue-soft);
  border-color: var(--blue-border);
}

.categoryTitle {
  display: block;
  text-align: center;
  font-size: 26rpx;
  line-height: 1.35;
  color: #324155;
  font-weight: 600;
}

.categoryCount {
  display: block;
  margin-top: 12rpx;
  text-align: center;
  font-size: 40rpx;
  line-height: 1;
  color: var(--blue-main);
  font-weight: 700;
}

.categoryDeltaLine {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.categoryDeltaLabel {
  font-size: 20rpx;
  line-height: 1.3;
  color: var(--text-sub);
}

.categoryDeltaValue {
  font-size: 20rpx;
  line-height: 1.3;
  font-weight: 700;
}

.detailBar {
  padding: 20rpx 18rpx;
  margin-bottom: 18rpx;
}

.detailBarTitle {
  display: block;
  font-size: 30rpx;
  color: var(--text-main);
  font-weight: 700;
}

.detailBarDesc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-sub);
}

.modeCard {
  display: flex;
  padding: 8rpx;
  margin-bottom: 18rpx;
}

.modeTab {
  flex: 1;
  height: 72rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #738198;
  font-weight: 600;
}

.modeTabActive {
  background: var(--blue-soft);
  color: var(--blue-main);
}

.sectionCard {
  padding: 18rpx;
  margin-bottom: 18rpx;
}

.sectionHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.sectionTitle {
  display: block;
  font-size: 32rpx;
  color: var(--text-main);
  font-weight: 700;
}

.sectionSub {
  display: block;
  font-size: 24rpx;
  color: var(--text-sub);
  flex-shrink: 0;
}

.tableTabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 22rpx;
}

.tableTab {
  flex: 1;
  height: 68rpx;
  border-radius: 14rpx;
  background: #f3f6fb;
  color: #76839a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
}

.tableTabActive {
  background: var(--blue-soft);
  color: var(--blue-main);
}

.tableWrap {
  width: 100%;
}

.thead,
.trow {
  display: flex;
  align-items: center;
  min-width: 920rpx;
}

.thead {
  min-height: 70rpx;
  background: #f6f9ff;
  border-radius: 14rpx 14rpx 0 0;
}

.trow {
  min-height: 76rpx;
  border-bottom: 2rpx solid #edf2fa;
}

.cell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #273850;
  padding: 0 8rpx;
}

.cell.name {
  flex: 1.4;
  text-align: left;
  padding-left: 18rpx;
}

.hotTable {
  border: 2rpx solid #edf2fa;
  border-radius: 14rpx;
  overflow: hidden;
}

.hotHead,
.hotRow {
  display: flex;
  align-items: center;
}

.hotHead {
  min-height: 70rpx;
  background: #f6f9ff;
}

.hotRow {
  min-height: 76rpx;
  border-top: 2rpx solid #edf2fa;
}

.hotCell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #273850;
  padding: 0 8rpx;
}

.hotName {
  flex: 1.8;
  text-align: left;
  padding-left: 18rpx;
}

.tableEmpty {
  padding: 44rpx 24rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--text-sub);
}
</style>
