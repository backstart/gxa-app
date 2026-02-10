<template>
  <AppPage
    :scrollIntoView="scrollIntoViewId"
    :scrollWithAnimation="true"
    @scroll="onPageScroll"
  >
    <!-- 点击页面空白时关闭筛选面板，避免筛选层残留 -->
    <view class="personList pageBg" @tap="handlePageTap">
      <view class="searchBar">
        <view class="searchInputWrap">
          <text class="searchIcon">🔍</text>
          <input
            v-model.trim="searchKey"
            class="searchInput"
            confirm-type="search"
            placeholder="姓名/证件后四位/地址/责任民警"
            placeholder-class="searchPlaceholder"
            @confirm="onSearch"
          />
        </view>
        <text class="searchBtn" @tap.stop="onSearch">搜索</text>
      </view>

      <!-- tabs 强制单行横向滚动，避免换行导致布局抖动 -->
      <scroll-view class="tabScroll" scroll-x show-scrollbar="false" :scroll-into-view="tabIntoViewId">
        <view class="tabRow">
          <view
            v-for="tab in tabs"
            :id="`tab-${tab.key}`"
            :key="tab.key"
            :class="['tabItem', activeTabKey === tab.key ? 'tabItemActive' : '']"
            @tap.stop="onTabTap(tab.key)"
          >
            <text>{{ tab.label }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 锚点用于未吸顶时自动置顶 -->
      <view id="filterAnchor" class="filterAnchor"></view>

      <!-- 非吸顶筛选条 -->
      <view id="filterBarStatic" :class="['filterBar', isFilterSticky ? 'filterBarHidden' : '']">
        <view
          v-for="entry in filterEntries"
          :key="entry.key"
          :class="['filterItem', isFilterActive(entry.key) ? 'filterItemActive' : '']"
          @tap.stop="onFilterTap(entry.key)"
        >
          <text class="filterLabel">{{ filterLabel(entry.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(entry.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <!-- 吸顶筛选条 -->
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
          @tap.stop="onFilterTap(entry.key)"
        >
          <text class="filterLabel">{{ filterLabel(entry.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(entry.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <view class="listWrap">
        <view v-if="displayList.length === 0" class="emptyCard">暂无符合条件的重点人员</view>

        <view
          v-for="item in displayList"
          :key="item.personId"
          class="personCard"
          hover-class="personCardActive"
          hover-start-time="20"
          hover-stay-time="70"
          @tap.stop="goDetail(item.personId)"
        >
          <image class="personCover" src="/static/logo.png" mode="aspectFill"></image>
          <view class="personMain">
            <view class="titleRow">
              <text class="personName">{{ maskName(item.name) }}</text>
              <view class="titleTags">
                <text :class="['riskTag', riskClass(item.riskLevel)]">{{ item.riskLevel || '中' }}</text>
                <text :class="['statusTag', statusClass(item.status)]">{{ item.status || '关注' }}</text>
              </view>
            </view>
            <view class="addrRow">{{ item.address || '居住地未录入' }}</view>
            <view class="metaRow">
              <text class="metaText ellipsis">责任民警：{{ item.officerName || '未录入' }}</text>
              <text class="metaText">{{ item.area || '未分区' }}</text>
            </view>
            <view class="bottomRow">
              <view class="tagRow">
                <text class="typeTag">{{ normalizeDisplayLabel(item.personType) || '未分类' }}</text>
              </view>
              <text :class="['dueText', dueTextClass(item.nextVisitDue)]">{{ dueText(item.nextVisitDue) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 下拉筛选面板，top 动态锚定到筛选条底部 -->
      <view
        v-if="showDropdown"
        class="dropdownLayer"
        :style="{ top: `${dropdownTop}px` }"
        @touchmove.stop.prevent
      >
        <view class="dropdownPanel" @tap.stop>
          <view v-if="activeFilterKey === 'AREA'" class="singlePanel">
            <view
              v-for="opt in areaOptions"
              :key="opt.value"
              :class="['optionItem', areaFilter === opt.value ? 'optionItemActive' : '']"
              @tap="selectArea(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>

          <view v-if="activeFilterKey === 'SORT'" class="singlePanel">
            <view
              v-for="opt in sortOptions"
              :key="opt.value"
              :class="['optionItem', sortFilter === opt.value ? 'optionItemActive' : '']"
              @tap="selectSort(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>

          <view v-if="activeFilterKey === 'RISK'" class="singlePanel">
            <view
              v-for="opt in riskOptions"
              :key="opt.value"
              :class="['optionItem', riskFilter === opt.value ? 'optionItemActive' : '']"
              @tap="selectRisk(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>

          <view v-if="activeFilterKey === 'STATUS'" class="singlePanel">
            <view
              v-for="opt in statusOptions"
              :key="opt.value"
              :class="['optionItem', statusFilter === opt.value ? 'optionItemActive' : '']"
              @tap="selectStatus(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>

          <view v-if="activeFilterKey === 'MORE'" class="morePanel">
            <view class="moreTitle">回访到期</view>
            <view class="moreChips">
              <view
                v-for="opt in dueOptions"
                :key="opt.value"
                :class="['moreChip', draftDueFilter === opt.value ? 'moreChipActive' : '']"
                @tap="draftDueFilter = opt.value"
              >
                {{ opt.label }}
              </view>
            </view>
            <view class="moreActions">
              <text class="moreBtn ghost" @tap="resetMore">重置</text>
              <text class="moreBtn primary" @tap="confirmMore">确定</text>
            </view>
          </view>
        </view>
        <view class="dropdownMask" @tap="closeDropdown"></view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, ref } from 'vue';
import { onLoad, onReady, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { getKeyPersons, syncKeyPersonTodos } from '@/common/database.js';

const instance = getCurrentInstance();

const persons = ref([]);

const searchKey = ref('');
const activeTabKey = ref('ALL');

const areaFilter = ref('ALL');
const riskFilter = ref('ALL');
const statusFilter = ref('ALL');
const sortFilter = ref('NEXT');
const dueFilter = ref('ALL');
const draftDueFilter = ref('ALL');

const scrollTopVal = ref(0);
const stickyThreshold = ref(0);
const safeTop = ref(0);
const filterBarHeight = ref(92);
const dropdownTop = ref(0);
const scrollIntoViewId = ref('');
const tabIntoViewId = ref('');

const showDropdown = ref(false);
const activeFilterKey = ref('');

const TYPE_ORDER = ['ALL', '涉毒', '涉稳', '精神障碍', '刑释解教', '未保对象'];

const filterEntries = [
  { key: 'AREA' },
  { key: 'SORT' },
  { key: 'RISK' },
  { key: 'STATUS' },
  { key: 'MORE' },
];

const riskOptions = [
  { label: '全部风险', value: 'ALL' },
  { label: '高风险', value: '高' },
  { label: '中风险', value: '中' },
  { label: '低风险', value: '低' },
];

const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '在控', value: '在控' },
  { label: '关注', value: '关注' },
  { label: '失控', value: '失控' },
  { label: '迁出', value: '迁出' },
  { label: '解除', value: '解除' },
];

const sortOptions = [
  { label: '按回访时间最近', value: 'NEXT' },
  { label: '按风险等级优先', value: 'RISK_DESC' },
];

const dueOptions = [
  { label: '全部', value: 'ALL' },
  { label: '临期', value: 'DUE' },
  { label: '超期', value: 'OVERDUE' },
];

const isFilterSticky = computed(() => scrollTopVal.value >= stickyThreshold.value);

const tabs = computed(() => {
  // 人员 tabs 采用“固定顺序 + 动态兜底”，并对展示文案做归一化，避免出现“棋牌/麻将”双重文案
  const set = new Set(persons.value.map((item) => normalizeDisplayLabel(item.personType)).filter(Boolean));
  const list = [{ key: 'ALL', label: '全部' }];
  TYPE_ORDER.slice(1).forEach((key) => {
    if (set.has(key)) list.push({ key, label: key });
  });
  Array.from(set).forEach((key) => {
    if (!list.some((item) => item.key === key)) list.push({ key, label: key });
  });
  return list;
});

const areaOptions = computed(() => {
  // 区域筛选项按数据动态生成
  const set = new Set(persons.value.map((item) => item.area).filter(Boolean));
  return [{ label: '全部区域', value: 'ALL' }, ...Array.from(set).map((value) => ({ label: value, value }))];
});

const displayList = computed(() => {
  // 搜索 + tabs + 筛选 + 排序统一汇总，保证条件叠加生效
  let list = persons.value.filter((item) => {
    // tab 筛选使用归一化后的类型，保证“带斜杠类型”也能命中正确 tab
    if (activeTabKey.value !== 'ALL' && normalizeDisplayLabel(item.personType) !== activeTabKey.value) return false;
    if (areaFilter.value !== 'ALL' && item.area !== areaFilter.value) return false;
    if (riskFilter.value !== 'ALL' && item.riskLevel !== riskFilter.value) return false;
    if (statusFilter.value !== 'ALL' && item.status !== statusFilter.value) return false;

    const days = dueDays(item.nextVisitDue);
    if (dueFilter.value === 'DUE' && !(days >= 0 && days <= 7)) return false;
    if (dueFilter.value === 'OVERDUE' && !(days < 0)) return false;

    if (searchKey.value) {
      const key = searchKey.value;
      const matched = [item.name, item.idNoLast4, item.address, item.officerName].some((field) =>
        String(field || '').includes(key),
      );
      if (!matched) return false;
    }
    return true;
  });

  if (sortFilter.value === 'RISK_DESC') {
    list = [...list].sort((a, b) => riskScore(b.riskLevel) - riskScore(a.riskLevel));
  } else {
    list = [...list].sort((a, b) => dueDays(a.nextVisitDue) - dueDays(b.nextVisitDue));
  }
  return list;
});

function normalizeType(raw) {
  // 支持从入口传入 type/personType/filter，多种参数统一收敛
  const value = decodeURIComponent(String(raw || '')).trim();
  if (!value || value === 'all' || value === 'ALL') return 'ALL';
  return normalizeDisplayLabel(value);
}

function loadData() {
  // 刷新重点人员数据并同步待办
  persons.value = getKeyPersons();
  syncKeyPersonTodos(persons.value);
  // 入口默认 tab 若不存在则回退“全部”
  nextTick(() => {
    if (!tabs.value.some((tab) => tab.key === activeTabKey.value)) {
      activeTabKey.value = 'ALL';
    }
  });
}

function onSearch() {
  // 搜索触发时收起筛选面板，避免层叠遮挡
  closeDropdown();
}

function onTabTap(tabKey) {
  // 点击 tab 后滚动到可视区域，保持单行横滑体验
  activeTabKey.value = tabKey;
  tabIntoViewId.value = `tab-${tabKey}`;
  setTimeout(() => {
    tabIntoViewId.value = '';
  }, 80);
  closeDropdown();
}

function onPageScroll(event) {
  // 记录 scrollTop 供吸顶判断，并在展开面板时实时修正定位
  scrollTopVal.value = Number(event?.detail?.scrollTop || 0);
  if (showDropdown.value) {
    updateDropdownTop();
  }
}

function onFilterTap(filterKey) {
  // 同一筛选项二次点击即收起
  if (showDropdown.value && activeFilterKey.value === filterKey) {
    closeDropdown();
    return;
  }

  // 未吸顶时先自动置顶，再展开面板，交互保持与重点场所页一致
  if (!isFilterSticky.value) {
    scrollIntoViewId.value = 'filterAnchor';
    setTimeout(() => {
      scrollIntoViewId.value = '';
      activeFilterKey.value = filterKey;
      showDropdown.value = true;
      if (filterKey === 'MORE') {
        draftDueFilter.value = dueFilter.value;
      }
      nextTick(() => updateDropdownTop());
    }, 220);
    return;
  }

  activeFilterKey.value = filterKey;
  showDropdown.value = true;
  if (filterKey === 'MORE') {
    draftDueFilter.value = dueFilter.value;
  }
  nextTick(() => updateDropdownTop());
}

function handlePageTap() {
  // 点击页面空白处关闭筛选面板
  if (showDropdown.value) closeDropdown();
}

function closeDropdown() {
  // 统一关闭面板并清理激活项
  showDropdown.value = false;
  activeFilterKey.value = '';
}

function isFilterActive(filterKey) {
  // 激活状态用于筛选项高亮
  return showDropdown.value && activeFilterKey.value === filterKey;
}

function filterLabel(filterKey) {
  // 筛选条文案与当前选中状态保持同步
  if (filterKey === 'AREA') return areaFilter.value === 'ALL' ? '全部区域' : areaFilter.value;
  if (filterKey === 'SORT') return sortOptions.find((opt) => opt.value === sortFilter.value)?.label || '默认排序';
  if (filterKey === 'RISK') return riskOptions.find((opt) => opt.value === riskFilter.value)?.label || '全部风险';
  if (filterKey === 'STATUS') return statusOptions.find((opt) => opt.value === statusFilter.value)?.label || '全部状态';
  if (filterKey === 'MORE') return dueFilter.value === 'ALL' ? '筛选' : `筛选(${dueOptions.find((i) => i.value === dueFilter.value)?.label})`;
  return '';
}

function selectArea(value) {
  areaFilter.value = value;
  closeDropdown();
}

function selectSort(value) {
  sortFilter.value = value;
  closeDropdown();
}

function selectRisk(value) {
  riskFilter.value = value;
  closeDropdown();
}

function selectStatus(value) {
  statusFilter.value = value;
  closeDropdown();
}

function resetMore() {
  // 更多筛选重置为“全部回访状态”
  draftDueFilter.value = 'ALL';
}

function confirmMore() {
  // 应用更多筛选草稿值
  dueFilter.value = draftDueFilter.value;
  closeDropdown();
}

function measureStickyBase() {
  // 计算筛选条吸顶阈值与高度，供面板定位和吸顶切换使用
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
  // 动态读取筛选条底部位置，保证面板始终从筛选条下沿弹出
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
    if (target?.bottom) {
      dropdownTop.value = Number(target.bottom);
    } else {
      dropdownTop.value = safeTop.value + filterBarHeight.value;
    }
  });
}

function maskName(name) {
  if (!name) return '-';
  return `${name.charAt(0)}*`;
}

function normalizeDisplayLabel(label) {
  // tab 与卡片展示文案统一去掉“/”后的附加语义，避免双重类别文案影响可读性
  const text = String(label || '').trim();
  if (!text) return '';
  return text.includes('/') ? text.split('/')[0] : text;
}

function dueDays(dateStr) {
  if (!dateStr) return 9999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(String(dateStr).replace(/-/g, '/'));
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - now.getTime()) / 86400000);
}

function dueText(dateStr) {
  if (!dateStr) return '未设置';
  const days = dueDays(dateStr);
  if (days < 0) return `超期${Math.abs(days)}天`;
  return `剩余${days}天`;
}

function dueTextClass(dateStr) {
  if (!dateStr) return '';
  const days = dueDays(dateStr);
  if (days < 0) return 'danger';
  if (days <= 7) return 'warn';
  return 'normal';
}

function riskScore(level) {
  if (level === '高') return 3;
  if (level === '中') return 2;
  return 1;
}

function riskClass(level) {
  if (level === '高') return 'danger';
  if (level === '中') return 'warn';
  return 'low';
}

function statusClass(status) {
  if (status === '失控') return 'danger';
  if (status === '关注') return 'warn';
  if (status === '在控') return 'ok';
  return 'muted';
}

function goDetail(personId) {
  uni.navigateTo({ url: `/pages/person/detail?personId=${personId}` });
}

onLoad((query) => {
  // 兼容旧入口参数：filter=due / filter=type:xxx
  const sys = uni.getSystemInfoSync();
  safeTop.value = sys.safeAreaInsets?.top ?? sys.statusBarHeight ?? 0;

  const typeFromQuery = normalizeType(query?.type || query?.personType);
  if (typeFromQuery !== 'ALL') {
    activeTabKey.value = typeFromQuery;
  }

  const filter = decodeURIComponent(query?.filter || '');
  if (filter === 'due') {
    dueFilter.value = 'DUE';
    draftDueFilter.value = 'DUE';
    sortFilter.value = 'NEXT';
  } else if (filter.startsWith('type:')) {
    activeTabKey.value = normalizeType(filter.replace('type:', ''));
  }

});

onShow(() => {
  loadData();
  nextTick(() => measureStickyBase());
});

onReady(() => {
  nextTick(() => measureStickyBase());
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.personList {
  position: relative;
  min-height: 100%;
  padding: 16rpx 24rpx 80rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.searchBar {
  display: flex;
  align-items: center;
  gap: 14rpx;
  box-sizing: border-box;
}

.searchInputWrap {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  border-radius: 36rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  background: #fff;
  border: 2rpx solid #e5e7eb;
  box-sizing: border-box;
}

.searchIcon {
  margin-right: 10rpx;
  font-size: 26rpx;
  color: #9aa6b2;
}

.searchInput {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: #1f2b3a;
}

.searchPlaceholder {
  color: #b0b8c2;
}

.searchBtn {
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 24rpx;
  border-radius: 36rpx;
  background: #1677ff;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}

.tabScroll {
  margin-top: 12rpx;
  width: 100%;
  white-space: nowrap;
  box-sizing: border-box;
}

.tabRow {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 14rpx;
  padding: 2rpx 4rpx 12rpx;
  box-sizing: border-box;
}

.tabItem {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
  min-height: 64rpx;
  padding: 10rpx 12rpx;
  color: #1f2b3a;
  font-size: 26rpx;
  font-weight: 700;
  box-sizing: border-box;
}

.tabItemActive {
  color: #1677ff;
}

.tabItemActive::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2rpx;
  margin: 0 auto;
  width: 56rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: #1677ff;
}

.filterAnchor {
  width: 100%;
  height: 2rpx;
}

.filterBar {
  margin-top: 10rpx;
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
  padding: 10rpx 6rpx;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.filterItemActive {
  background: #eaf3ff;
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

.filterItemActive .filterLabel {
  color: #1677ff;
}

.filterArrow {
  color: #1677ff;
  font-size: 20rpx;
}

.listWrap {
  margin-top: 16rpx;
  box-sizing: border-box;
}

.emptyCard {
  padding: 40rpx 0;
  text-align: center;
  color: #97a1ad;
  font-size: 24rpx;
}

.personCard {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx;
  margin-bottom: 16rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.personCardActive {
  opacity: 0.85;
}

.personCover {
  width: 116rpx;
  height: 116rpx;
  border-radius: 12rpx;
  background: #e9edf2;
  flex-shrink: 0;
}

.personMain {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.titleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}

.personName {
  flex: 1;
  min-width: 0;
  color: #1f2b3a;
  font-size: 34rpx;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.titleTags {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.addrRow {
  margin-top: 4rpx;
  color: #6e7a89;
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.typeTag {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  flex-shrink: 0;
  background: #eaf3ff;
  color: #1677ff;
}

.riskTag,
.statusTag {
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
}

.riskTag.danger,
.statusTag.danger {
  background: #ffecec;
  color: #d64545;
}

.riskTag.warn,
.statusTag.warn {
  background: #fff6e6;
  color: #c88719;
}

.riskTag.low,
.statusTag.ok {
  background: #e6f7ed;
  color: #1b9d5d;
}

.statusTag.muted {
  background: #f1f3f5;
  color: #6e7a89;
}

.metaRow {
  margin-top: 4rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  min-width: 0;
}

.metaText {
  font-size: 22rpx;
  color: #7a8594;
  white-space: nowrap;
}

.metaText.ellipsis {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottomRow {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  min-width: 0;
}

.tagRow {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8rpx;
  overflow: hidden;
}

.dueText {
  flex-shrink: 0;
  font-size: 28rpx;
  white-space: nowrap;
  text-align: right;
}

.dueText.danger {
  color: #d64545;
}

.dueText.warn {
  color: #c88719;
}

.dueText.normal {
  color: #6e7a89;
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
  max-height: 48vh;
  overflow: hidden;
}

.singlePanel {
  max-height: 46vh;
  overflow-y: auto;
}

.optionItem {
  padding: 24rpx;
  font-size: 32rpx;
  color: #1f2b3a;
  box-sizing: border-box;
}

.optionItemActive {
  color: #1677ff;
  font-weight: 600;
}

.morePanel {
  padding: 20rpx 24rpx;
  box-sizing: border-box;
}

.moreTitle {
  color: #1f2b3a;
  font-size: 26rpx;
  font-weight: 600;
}

.moreChips {
  margin-top: 14rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.moreChip {
  padding: 10rpx 16rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  color: #344150;
  font-size: 24rpx;
}

.moreChipActive {
  background: #eaf3ff;
  color: #1677ff;
}

.moreActions {
  margin-top: 18rpx;
  display: flex;
  gap: 12rpx;
}

.moreBtn {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  padding: 14rpx 0;
  border-radius: 12rpx;
}

.moreBtn.ghost {
  background: #f4f6f8;
  color: #6e7a89;
}

.moreBtn.primary {
  background: #1677ff;
  color: #fff;
}

.dropdownMask {
  flex: 1;
  background: rgba(0, 0, 0, 0.42);
}
</style>
