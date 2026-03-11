<template>
  <AppPage :bg="PAGE_BG">
    <view class="analysis pageBg" @tap="handlePageTap">
      <view id="filterBarRef" class="filterBar card">
        <view
          :class="['filterItem', isDropdownActive('time') ? 'filterItemActive' : '']"
          @tap.stop="openDropdown('time')"
        >
          <text class="filterLabel">时间范围</text>
          <view class="filterValueWrap">
            <text class="filterValue">{{ timeFilterSummary }}</text>
            <text class="filterArrow">{{ isDropdownActive('time') ? '▴' : '▾' }}</text>
          </view>
        </view>
        <view
          :class="['filterItem', isDropdownActive('area') ? 'filterItemActive' : '']"
          @tap.stop="openDropdown('area')"
        >
          <text class="filterLabel">辖区范围</text>
          <view class="filterValueWrap">
            <text class="filterValue">{{ areaLabel }}</text>
            <text class="filterArrow">{{ isDropdownActive('area') ? '▴' : '▾' }}</text>
          </view>
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
        <view class="scopeMetaRow">
          <text class="scopeMetaMain">{{ scopeHeadline }}</text>
          <text class="scopeMetaSide">辖区：{{ areaLabel }}</text>
        </view>
        <view class="scopeTotalRow">
          <view class="scopeMetricGroup">
            <text class="scopeTotalLabel">警情总量</text>
            <view class="scopeTotalValueWrap">
              <text class="scopeTotalValue">{{ totalSummary.count }}</text>
              <text class="scopeTotalUnit">起</text>
            </view>
          </view>
          <view class="scopeCompareBlock">
            <text class="compareMeta">环比</text>
            <text :class="['compareValue', deltaClass(totalSummary.mom)]">{{ formatDelta(totalSummary.mom) }}</text>
            <text class="compareMeta compareMetaGap">同比</text>
            <text :class="['compareValue', deltaClass(totalSummary.yoy)]">{{ formatDelta(totalSummary.yoy) }}</text>
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

      <view class="detailBar card" hover-class="pressing" @tap.stop="openAlarmList">
        <view class="detailBarHead">
          <text class="detailBarTitle">{{ reportTitle }}</text>
          <view class="detailBarEntry">
            <text class="detailBarLink">查看明细</text>
            <text class="detailBarArrow">›</text>
          </view>
        </view>
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
            <text class="sectionSub">本期 / 环比 / 同比</text>
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
            <text class="cell metricCell">本期</text>
            <text class="cell metricCell">上期</text>
            <text class="cell deltaCell">环比</text>
            <text class="cell metricCell">同期</text>
            <text class="cell deltaCell">同比</text>
          </view>
          <view v-for="row in currentTableRows" :key="row.name" class="trow">
            <text class="cell name">{{ row.name }}</text>
            <text class="cell metricCell">{{ row.cur }}</text>
            <text class="cell metricCell">{{ row.prev }}</text>
            <text :class="['cell', 'deltaCell', deltaClass(row.mom)]">{{ formatDelta(row.mom) }}</text>
            <text class="cell metricCell">{{ row.yoyBase }}</text>
            <text :class="['cell', 'deltaCell', deltaClass(row.yoy)]">{{ formatDelta(row.yoy) }}</text>
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

// 页面中所有日期运算都以“天”为最小单位，这里统一定义毫秒数，
// 后续计算周、月、同比、环比区间时都复用这一常量，避免魔法数字分散在代码里。
const DAY_MS = 24 * 60 * 60 * 1000;

// 时间筛选面板中的快捷项。
// 这里的 value 会直接写入 filter.preset，用于驱动当前统计口径。
const QUICK_TIME_OPTIONS = [
  { value: 'TODAY', label: '当天' },
  { value: 'WEEK', label: '本周' },
  { value: 'MONTH', label: '本月' },
  { value: 'QUARTER', label: '本季度' },
  { value: 'YEAR', label: '本年' },
];

// 辖区选项同时承担两件事：
// 1. 顶部筛选面板的数据源
// 2. 各类图表、表格里辖区排序的基准顺序
const AREA_OPTIONS = [
  { value: 'ALL', label: '全部辖区' },
  { value: '五桂山街道', label: '五桂山街道' },
  { value: '长命水', label: '长命水' },
  { value: '龙石', label: '龙石' },
  { value: '桂南', label: '桂南' },
];

// 页面顶部 6 张分类卡的固定定义。
// key 是统计口径里的内部分类编码，label 是页面展示文案。
const CATEGORY_OPTIONS = [
  { key: 'DISPUTE', label: '纠纷类' },
  { key: 'LAW', label: '刑事行政类' },
  { key: 'HELP', label: '求助类' },
  { key: 'CONSULT', label: '咨询类' },
  { key: 'TRAFFIC', label: '交通类' },
  { key: 'OTHER', label: '其他类' },
];

// 原始警情类型仍然保留更细颗粒度。
// “类型汇总表”和“类型占比图”使用的是原始类型，而不是顶部 6 类映射。
const TYPE_OPTIONS = ['刑事', '行政', '紧急求助', '举报类', '咨询类', '纠纷类', '交通类', '其他类'];

// 模拟数据里的“辖区 -> 热点地址池”映射。
// 后续随机生成 mock 数据时，先选辖区，再从该辖区下按权重抽样地址，
// 这样热点 Top10、辖区占比图才会更像真实业务数据，而不是完全平均分布。
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

// 热点 Top10 柱状图的颜色池。
// 该图采用“每个热点单独一条 series”的方式渲染，为了避免整图一片蓝色，
// 这里预先给不同热点准备一组轮换颜色。
const TOP_BAR_COLORS = ['#2B7FFF', '#4EA1FF', '#73BEFF', '#7D8CFF', '#FF9F43', '#F66F6A', '#7CCB8A', '#5AD1C5', '#C387FF', '#F7C24A'];
const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const ANALYSIS_ALARM_LIST_KEY = 'analysis_alarm_list_payload';

// 基础日期格式化工具，整个页面统一输出 YYYY-MM-DD。
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

// 下面这组 start/endOfXxx 方法的作用，是把任意日期规整到统计边界。
// 页面里所有“本周 / 本月 / 本季度 / 本年 / 自定义范围”最后都会落到这套函数上，
// 这样 comparisonSets、图表、表格才能共用同一套统计区间。
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

// 热点表里的占比格式化。
// 这里只保留 1 位小数，如果是整数则去掉 .0，让展示更紧凑。
function formatPercent(value, total) {
  if (!total) return '0';
  return ((value / total) * 100).toFixed(1).replace(/\.0$/, '');
}

// 统一计算环比/同比百分比。
// base 为 0 时，为了避免 Infinity，这里给一个有限放大值作为“明显增长”的近似表现。
// 这是展示层策略，不是严格财务口径。
function percentDelta(current, base) {
  if (!base && !current) return '0';
  if (!base) return String(Math.min(current * 18, 180));
  return (((current - base) / base) * 100).toFixed(0);
}

// 所有涨跌值统一走这个方法，保证：
// 1. 0 显示为 0%
// 2. 正数带 +
// 3. 表格、卡片、总量区格式一致
function formatDelta(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return '0%';
  return `${num > 0 ? '+' : ''}${num}%`;
}

// 根据涨跌值返回颜色 class。
// 页面里“升红降绿平灰”全部复用这个函数，避免卡片和表格颜色规则不一致。
function deltaClass(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return 'deltaFlat';
  return num > 0 ? 'deltaUp' : 'deltaDown';
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function hashText(text) {
  return String(text || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

// 明细列表页需要一个轻量状态文案，这里根据时间和 seed 生成“已回告/未回告/超期”。
// 这不是后端真实状态，只是为了让明细页更接近真实业务页面。
function buildIncidentStatusMeta(item) {
  const seed = hashText(`${item.id}${item.address}${item.type}`);
  const ageHours = Math.max(1, Math.round((Date.now() - new Date(item.time).getTime()) / 3600000));
  if (ageHours > 24 && seed % 11 < 3) return { key: 'overdue', text: '超期' };
  if (ageHours > 6 && seed % 10 < 5) return { key: 'pending', text: '未回告' };
  return { key: 'done', text: '已回告' };
}

// 跳转到明细列表时，给每条警情一个默认标题。
// 之后 alarmList.vue 会再基于 rawType/address 组装更像事件的展示标题。
function buildIncidentTitle(item) {
  if (item.type === '刑事') return '刑事警情';
  if (item.type === '行政') return '行政警情';
  return `${item.type}警情`;
}

// 计算“第几周”以及本周起止时间。
// 统计卡头部展示“2026年第11周”时使用的就是这里的结果。
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

// 根据快捷项直接生成对应的起止时间。
// 顶部时间筛选“当天/本周/本月/本季度/本年”都先走这里，再写入 filter。
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

// 页面默认筛选口径：本周 + 全部辖区。
// timeDraft 也直接复用这个结构，这样时间筛选面板可以先编辑草稿，再确认覆盖 filter。
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

// 原始警情类型 -> 顶部 6 类卡片 的统一映射规则。
// 统计页与明细页必须共用这套规则，否则“卡片数量”和“明细列表条数”会对不上。
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

// 负责把当前筛选值转换成统计卡、分析报告卡里能直接展示的文案。
// 这里统一处理“本周 / 本月 / 本季度 / 本年 / 自定义”不同口径的标题和副标题格式。
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

// 下面这组 seededRandom / pickWeighted / buildAreaWeights / buildTypeWeights
// 是本页 mock 数据“看起来像真实数据”的关键。
// 核心思路：
// 1. 用可重复的伪随机算法，而不是完全随机，这样页面刷新后数据稳定
// 2. 给辖区、类型、地址加权重，让热点/结构/趋势更有差异
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

// 生成整页分析所需的 mock 警情。
// 这里一次性生成约 420 天的数据，后续所有统计都只是在内存里按筛选条件过滤，
// 这样切换时间范围、辖区、分类时不需要重新组装数据。
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

// filter：当前正式生效的筛选条件
// timeDraft / areaDraft：面板里的临时编辑值，点“确定”之前不直接影响图表
// dropdown：控制顶部下拉面板显隐和当前是哪一个面板
// activeCategory：顶部 6 类卡片当前选中的分类，ALL 表示不过滤类别
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

// 顶部筛选条、统计卡和分析报告卡所需的展示文案。
// 这部分是“页面文案层”，避免模板里塞太多字符串拼接逻辑。
const areaLabel = computed(() => getAreaLabel(filter.area));
const timeFilterSummary = computed(() => (filter.preset === 'CUSTOM' ? '自定义' : presetLabel(filter.preset)));
const scopeDisplay = computed(() => getScopeDisplay(filter));
const scopeHeadline = computed(() => {
  const { title, sub } = scopeDisplay.value;
  if (!sub || sub === '当天' || sub === '自定义时间范围') return title;
  return `${title}（${sub}）`;
});

// scopedIncidents：只按“时间 + 辖区”过滤后的数据。
// 这是顶部总量卡和 6 张分类卡的统一数据源。
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

// detailIncidents：在 scopedIncidents 基础上，再叠加当前选中的类别卡。
// 图表区、表格区、明细列表入口，全都用它作为最终分析数据。
const detailIncidents = computed(() => {
  if (activeCategory.value === 'ALL') return scopedIncidents.value;
  return scopedIncidents.value.filter((item) => getCategoryKey(item.type) === activeCategory.value);
});

const activeCategoryLabel = computed(() => (activeCategory.value === 'ALL' ? '全部警情' : getCategoryLabel(activeCategory.value)));
const detailScopeText = computed(() => `${scopeDisplay.value.title}${scopeDisplay.value.sub ? ` · ${scopeDisplay.value.sub}` : ''} · ${areaLabel.value}`);
const reportTitle = computed(() => (activeCategory.value === 'ALL' ? '分析报告：全部警情' : `分析报告：${activeCategoryLabel.value}警情`));

// 当前生效统计区间。
// comparisonSets / scopedComparisonSets 都基于这个区间去推导“本期、环比、同比”的对照范围。
function getCurrentRange() {
  return {
    start: startOfDay(parseDateText(filter.start)),
    end: endOfDay(parseDateText(filter.end)),
  };
}

// 上期区间：与当前范围长度一致，紧挨着当前区间之前。
// 例如当前是本周，则上期就是前一周；当前是自定义 7 天，则上期就是再往前 7 天。
function getPreviousRange(range) {
  const span = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - span);
  return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
}

// 同比区间：直接把当前区间整体向前平移 1 年。
function getLastYearRange(range) {
  return {
    start: startOfDay(addYears(range.start, -1)),
    end: endOfDay(addYears(range.end, -1)),
  };
}

// 给定“时间范围 + 辖区 + 类别”规则，返回最终命中的警情集合。
// comparisonSets 里的本期/环比/同比三组数据都走这一个入口，保证口径一致。
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

// comparisonSets：面向图表/表格的核心对比数据。
// 这里已经把“本期 / 环比 / 同比”三组集合都算好，后面的图表构造函数只负责出图。
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

// scopedComparisonSets 与 comparisonSets 的区别：
// - scopedComparisonSets 不受 activeCategory 影响，用于顶部总量与 6 类卡片
// - comparisonSets 受 activeCategory 影响，用于下半部分图表和表格
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

// 统计某一批数据里 6 张分类卡各自的数量。
function buildCategoryCountMap(list) {
  return list.reduce((result, item) => {
    const categoryKey = getCategoryKey(item.type);
    result[categoryKey] = (result[categoryKey] || 0) + 1;
    return result;
  }, {});
}

// 顶部总量卡：只看“时间 + 辖区”，不受当前分类卡选中态影响。
const totalSummary = computed(() => {
  const { cur, prev, ly } = scopedComparisonSets.value;
  return {
    count: cur.length,
    mom: percentDelta(cur.length, prev.length),
    yoy: percentDelta(cur.length, ly.length),
  };
});

// 顶部 6 张分类卡：数量、环比、同比全部统一由 scopedComparisonSets 推导。
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

// 下面开始是图表和表格的“数据整形层”。
// 输入是 comparisonSets 或 detailIncidents，输出是 qiun-data-charts / 表格直接可用的数据结构。
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

// 趋势图：根据当前统计跨度决定按“天”还是按“月”切桶。
// 31 天以内按日显示，超过 31 天按月显示，避免横轴挤爆。
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
      { name: '环比', data: countByBuckets(sets.prev, previousBuckets) },
      { name: '同比', data: countByBuckets(sets.ly, lastYearBuckets) },
    ],
  };
}

// 结构对比图：固定按辖区横向对比本期、环比、同比。
function buildAreaCompareChart(sets) {
  const categories = AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => item.label);
  return {
    categories,
    series: [
      { name: '本期', data: categories.map((area) => sets.cur.filter((item) => item.area === area).length) },
      { name: '环比', data: categories.map((area) => sets.prev.filter((item) => item.area === area).length) },
      { name: '同比', data: categories.map((area) => sets.ly.filter((item) => item.area === area).length) },
    ],
  };
}

// 类型占比图：展示 detailIncidents 在原始警情类型层面的结构。
function buildTypePieChart(list) {
  return {
    series: [
      {
        data: TYPE_OPTIONS.map((type) => ({ name: type, value: list.filter((item) => item.type === type).length })).filter((item) => item.value > 0),
      },
    ],
  };
}

// 辖区占比图：展示 detailIncidents 在辖区层面的占比。
function buildAreaPieChart(list) {
  return {
    series: [
      {
        data: AREA_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => ({ name: item.label, value: list.filter((row) => row.area === item.value).length })).filter((item) => item.value > 0),
      },
    ],
  };
}

// 时段分布图：把 detailIncidents 归到 4 个时间段里。
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

// 热点 Top10：按 address 聚合后排序。
// 为了让每一根柱有独立颜色，这里按“每个热点一个 series”的形式输出。
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

// 表格汇总行：本期、上期、同期、环比、同比五个指标统一从这里产出。
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

// 热点明细表：按 address 聚合，并补充所属辖区和占比。
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

// 所有图表数据统一做成 computed，模板只消费结果，不直接做数据运算。
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

// 如果用户已经锁定到某个单一辖区，“辖区汇总”表就没有比较意义，
// 这里自动把表格 tab 切回“类型汇总”。
watch(
  () => filter.area,
  () => {
    if (tableMode.value === 'area' && filter.area !== 'ALL') {
      tableMode.value = 'type';
    }
  },
);

// 打开顶部筛选面板：
// 1. 先把当前 filter 拷贝到草稿区
// 2. 再显示面板
// 3. nextTick 后测量筛选条位置，让下拉层贴着筛选条底部展开
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

// 读取顶部筛选条底部坐标，让筛选面板“贴着筛选条下方展开”，
// 而不是从屏幕底部抽屉式弹出。
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

// 选择快捷时间时，立即把草稿区切换到对应范围。
function pickQuickTime(preset) {
  const range = buildRangeFromPreset(preset);
  timeDraft.preset = preset;
  timeDraft.start = toDateText(range.start);
  timeDraft.end = toDateText(range.end);
}

// 自定义起止日期一旦修改，就视为 CUSTOM 模式。
function onDateChange(field, event) {
  timeDraft[field] = event.detail.value;
  timeDraft.preset = 'CUSTOM';
}

function isDropdownActive(key) {
  return dropdown.visible && dropdown.key === key;
}

// “重置”只重置当前正在编辑的那个面板，不影响另一个筛选项。
function resetCurrentFilter() {
  const defaults = createDefaultFilter();
  if (dropdown.key === 'time') {
    Object.assign(timeDraft, defaults);
  }
  if (dropdown.key === 'area') {
    areaDraft.value = defaults.area;
  }
}

// 点击“确定”后，才把草稿区写回正式筛选值 filter。
// 时间筛选这里顺带做了一个基础校验：开始时间不能晚于结束时间。
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

// 顶部 6 类卡片支持再次点击取消。
// 也就是：点中某类 -> 切到该类视角；再点一次 -> 回到全部警情。
function toggleCategory(categoryKey) {
  activeCategory.value = activeCategory.value === categoryKey ? 'ALL' : categoryKey;
}

// 跳转“警情查看列表”时，把当前分析视角打包到缓存里。
// 这样列表页不用重复实现整套筛选统计逻辑，只负责展示当前筛选结果。
function buildAlarmListPayload() {
  return {
    reportTitle: reportTitle.value,
    scopeTitle: scopeDisplay.value.title,
    scopeSub: scopeDisplay.value.sub,
    areaLabel: areaLabel.value,
    categoryKey: activeCategory.value,
    categoryLabel: activeCategoryLabel.value,
    items: detailIncidents.value
      .slice()
      .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
      .map((item) => {
        const statusMeta = buildIncidentStatusMeta(item);
        return {
          id: item.id,
          title: buildIncidentTitle(item),
          address: item.address,
          time: item.time,
          timeText: formatDateTime(item.time),
          statusKey: statusMeta.key,
          statusText: statusMeta.text,
          area: item.area,
          rawType: item.type,
          categoryLabel: getCategoryLabel(getCategoryKey(item.type)),
        };
      }),
  };
}

function openAlarmList() {
  uni.setStorageSync(ANALYSIS_ALARM_LIST_KEY, buildAlarmListPayload());
  uni.navigateTo({ url: '/pages/analysis/alarmList' });
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
  gap: 12rpx;
  padding: 8rpx;
  margin-top: 12rpx;
  margin-bottom: 14rpx;
}

.filterItem {
  flex: 1;
  min-height: 72rpx;
  padding: 0 18rpx;
  border-radius: 14rpx;
  background: linear-gradient(180deg, #fafdff 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border: 2rpx solid transparent;
}

.filterItemActive {
  background: var(--blue-soft);
  border-color: var(--blue-border);
}

.filterLabel {
  font-size: 24rpx;
  color: var(--text-sub);
  flex-shrink: 0;
}

.filterValueWrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  min-width: 0;
  flex: 1;
}

.filterValue {
  font-size: 24rpx;
  color: var(--text-main);
  font-weight: 600;
  min-width: 0;
  text-align: right;
}

.filterArrow {
  font-size: 18rpx;
  color: var(--blue-main);
  flex-shrink: 0;
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
  padding: 18rpx 20rpx;
  margin-bottom: 18rpx;
}

.scopeMetaRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 14rpx;
}

.scopeMetaMain {
  flex: 1;
  min-width: 0;
  font-size: 27rpx;
  line-height: 1.35;
  color: var(--text-main);
  font-weight: 600;
}

.scopeMetaSide {
  flex-shrink: 0;
  font-size: 24rpx;
  line-height: 1.35;
  color: var(--text-sub);
}

.scopeTotalRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 62rpx;
}

.scopeMetricGroup {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
}

.scopeCompareBlock {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6rpx;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.compareMeta {
  font-size: 24rpx;
  line-height: 1.35;
  font-weight: 500;
  color: var(--text-sub);
}

.compareMetaGap {
  margin-left: 10rpx;
}

.compareValue {
  font-size: 26rpx;
  line-height: 1.2;
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
  gap: 6rpx;
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
  font-size: 28rpx;
  line-height: 1.35;
  color: #324155;
  font-weight: 600;
}

.categoryCount {
  display: block;
  margin-top: 12rpx;
  text-align: center;
  font-size: 44rpx;
  line-height: 1;
  color: var(--blue-main);
  font-weight: 700;
}

.categoryDeltaLine {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  margin-top: 8rpx;
}

.categoryDeltaLabel {
  font-size: 22rpx;
  line-height: 1.35;
  font-weight: 500;
  color: var(--text-sub);
}

.categoryDeltaValue {
  font-size: 22rpx;
  line-height: 1.35;
  font-weight: 600;
}

.detailBar {
  padding: 20rpx 18rpx;
  margin-bottom: 18rpx;
}

.detailBarHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.detailBarTitle {
  display: block;
  font-size: 30rpx;
  color: var(--text-main);
  font-weight: 700;
}

.detailBarEntry {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}

.detailBarLink {
  font-size: 24rpx;
  color: var(--blue-main);
  font-weight: 600;
}

.detailBarArrow {
  font-size: 28rpx;
  color: var(--blue-main);
  line-height: 1;
}

.detailBarDesc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-sub);
}

.pressing {
  opacity: 0.9;
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
  min-width: 650rpx;
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
  flex: 0.6;
  text-align: center;
  font-size: 24rpx;
  color: #273850;
  padding: 0 1rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell.name {
  flex: 1.1;
  text-align: left;
  padding-left: 8rpx;
}

.cell.metricCell {
  font-size: 24rpx;
}

.cell.deltaCell {
  font-size: 24rpx;
  font-weight: 600;
}

.cell.deltaCell.deltaUp {
  color: #eb5757;
}

.cell.deltaCell.deltaDown {
  color: #32a852;
}

.cell.deltaCell.deltaFlat {
  color: #8b97a8;
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
