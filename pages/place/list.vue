<template>
  <AppPage
    :scrollIntoView="scrollIntoViewId"
    :scrollWithAnimation="true"
    @scroll="onPageScroll"
  >
    <!-- 点击页面空白时关闭下拉筛选面板，保持交互与美团式一致 -->
    <view class="placeList pageBg" @tap="handlePageTap">
      <view class="searchBar">
        <view class="searchInputWrap">
          <text class="searchIcon">🔍</text>
          <input
            v-model.trim="searchKey"
            class="searchInput"
            confirm-type="search"
            placeholder="名称/地址/负责人"
            placeholder-class="searchPlaceholder"
            @confirm="onSearch"
          />
        </view>
        <text class="searchBtn" @tap.stop="onSearch">搜索</text>
      </view>

      <scroll-view class="tabScroll" scroll-x show-scrollbar="false" :scroll-into-view="tabIntoViewId">
        <view class="tabRow">
          <view
            v-for="tab in tabs"
            :key="tab.key"
            :id="`tab-${tab.key}`"
            :class="['tabItem', activeTabKey === tab.key ? 'tabItemActive' : '']"
            @tap.stop="onTabTap(tab.key)"
          >
            <text>{{ tab.label }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 该锚点用于“点击筛选项时自动置顶” -->
      <view id="filterAnchor" class="filterAnchor"></view>

      <!-- 常规筛选条：未吸顶时显示 -->
      <view
        id="filterBarStatic"
        :class="['filterBar', isFilterSticky ? 'filterBarHidden' : '']"
      >
        <view
          v-for="item in filterEntries"
          :key="item.key"
          :class="['filterItem', isFilterActive(item.key) ? 'filterItemActive' : '']"
          @tap.stop="onFilterTap(item.key)"
        >
          <text class="filterLabel">{{ filterLabel(item.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(item.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <!-- 吸顶筛选条：到达阈值后固定到顶部 -->
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
          @tap.stop="onFilterTap(item.key)"
        >
          <text class="filterLabel">{{ filterLabel(item.key) }}</text>
          <text class="filterArrow">{{ isFilterActive(item.key) ? '▴' : '▾' }}</text>
        </view>
      </view>

      <view class="listWrap">
        <view v-if="displayList.length === 0" class="emptyCard">
          暂无符合条件的重点场所
        </view>

        <view
          v-for="place in displayList"
          :key="place.placeId"
          class="placeCard"
          hover-class="placeCardActive"
          hover-start-time="20"
          hover-stay-time="70"
          @tap.stop="goDetail(place)"
        >
          <image class="placeCover" :src="place.frontPhoto || '/static/logo.png'" mode="aspectFill"></image>
          <view class="placeMain">
            <view class="titleRow">
              <text class="placeName">{{ place.name }}</text>
              <text :class="['riskTag', riskClass(place.riskLevel)]">{{ place.riskLevel || '中' }}</text>
            </view>
            <view class="addrRow">{{ place.address || '地址未录入' }}</view>
            <view class="metaRow">
              <text class="metaText ellipsis">负责人：{{ place.ownerName || '未录入' }}</text>
              <text class="metaText">{{ place.area || '未分区' }}</text>
            </view>
            <view class="bottomRow">
              <view class="tagRow">
                <text
                  v-for="tag in placeDisplayTags(place)"
                  :key="`${place.placeId}-${tag}`"
                  :class="tag === typeLabel(place.primaryType) ? 'typeTag' : 'moduleTag'"
                >
                  {{ tag }}
                </text>
              </view>
              <text :class="['dueText', dueClass(place.nextVisitDue)]">{{ dueText(place.nextVisitDue) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 下拉筛选面板：在筛选条下方展开，并在下方附带遮罩 -->
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

          <view v-if="activeFilterKey === 'DUE'" class="singlePanel">
            <view
              v-for="opt in dueOptions"
              :key="opt.value"
              :class="['optionItem', dueFilter === opt.value ? 'optionItemActive' : '']"
              @tap="selectDue(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>

          <view v-if="activeFilterKey === 'MORE'" class="morePanel">
            <view class="moreTitle">模块筛选</view>
            <view class="moreChips">
              <view
                v-for="opt in moduleOptions"
                :key="opt.value"
                :class="['moreChip', draftMoreModules.includes(opt.value) ? 'moreChipActive' : '']"
                @tap="toggleDraftModule(opt.value)"
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
import { getPlaces } from '@/common/database.js';

const instance = getCurrentInstance();

const rawList = ref([]);
const searchKey = ref('');
const activeTabKey = ref('ALL');

const scrollTopVal = ref(0);
const stickyThreshold = ref(0);
const safeTop = ref(0);
const filterBarHeight = ref(92);
const scrollIntoViewId = ref('');
const tabIntoViewId = ref('');
const dropdownTop = ref(0);

const showDropdown = ref(false);
const activeFilterKey = ref('');

const areaFilter = ref('ALL');
const sortFilter = ref('DEFAULT');
const riskFilter = ref('ALL');
const dueFilter = ref('ALL');
const moreModules = ref([]);
const draftMoreModules = ref([]);

const riskOptions = [
  { label: '全部风险', value: 'ALL' },
  { label: '高风险', value: '高' },
  { label: '中风险', value: '中' },
  { label: '低风险', value: '低' },
];

const dueOptions = [
  { label: '全部到期', value: 'ALL' },
  { label: '临期', value: 'DUE' },
  { label: '超期', value: 'OVERDUE' },
];

const sortOptions = [
  { label: '默认排序', value: 'DEFAULT' },
  { label: '风险高优先', value: 'RISK_DESC' },
  { label: '到期临近优先', value: 'DUE_SOON' },
  { label: '超期天数优先', value: 'OVERDUE_DESC' },
];

const filterEntries = [
  { key: 'AREA' },
  { key: 'SORT' },
  { key: 'RISK' },
  { key: 'DUE' },
  { key: 'MORE' },
];

const TYPE_LABEL_MAP = {
  ALL: '全部',
  KTV: 'KTV',
  RENTAL: '出租屋',
  NETBAR: '网吧',
  FOOTBATH: '足浴',
  CHESS_CARD: '棋牌',
  NIGHTCLUB: '夜店',
  BILLIARD: '台球',
  HOTEL: '酒店',
  SAUNA: '洗浴',
  MASSAGE: '养生',
  EGAME: '电竞',
};

const TAB_ORDER = [
  'ALL',
  'KTV',
  'FOOTBATH',
  'NETBAR',
  'RENTAL',
  'CHESS_CARD',
  'NIGHTCLUB',
  'BILLIARD',
  'SAUNA',
  'HOTEL',
  'MASSAGE',
  'EGAME',
];

const isFilterSticky = computed(() => scrollTopVal.value >= stickyThreshold.value);

const areaOptions = computed(() => {
  // 按当前场所数据动态生成区域选项，保持“全部区域”作为兜底
  const set = new Set();
  rawList.value.forEach((item) => {
    if (item.area) set.add(item.area);
  });
  const dynamic = Array.from(set).map((value) => ({ label: value, value }));
  return [{ label: '全部区域', value: 'ALL' }, ...dynamic];
});

const moduleOptions = computed(() => {
  // 更多筛选里展示模块多选项，来源于数据里的 modules 动态集合
  const set = new Set();
  rawList.value.forEach((item) => {
    (item.modules || []).forEach((m) => set.add(String(m).toUpperCase()));
  });
  return Array.from(set)
    .sort()
    .map((value) => ({ value, label: moduleLabel(value) }));
});

const tabs = computed(() => {
  // tabs 采用“固定顺序优先 + 动态补充兜底”，避免顺序乱跳
  const sourceSet = new Set();
  rawList.value.forEach((item) => {
    if (item.primaryType) sourceSet.add(String(item.primaryType).toUpperCase());
    (item.modules || []).forEach((m) => sourceSet.add(String(m).toUpperCase()));
  });

  const mustKeys = ['ALL', 'KTV', 'FOOTBATH', 'NETBAR', 'RENTAL', 'CHESS_CARD'];
  const list = [];

  TAB_ORDER.forEach((key) => {
    if (key === 'ALL') {
      list.push({ key: 'ALL', label: normalizeDisplayLabel(TYPE_LABEL_MAP.ALL) });
      return;
    }
    if (mustKeys.includes(key) || sourceSet.has(key)) {
      list.push({ key, label: normalizeDisplayLabel(TYPE_LABEL_MAP[key] || key) });
    }
  });

  Array.from(sourceSet).forEach((key) => {
    if (!list.some((item) => item.key === key)) {
      list.push({ key, label: normalizeDisplayLabel(TYPE_LABEL_MAP[key] || key) });
    }
  });

  return list;
});

const displayList = computed(() => {
  // 将 tab、搜索、筛选、排序统一汇总到同一个计算流程，确保条件叠加生效
  const keyword = searchKey.value;

  const filtered = rawList.value.filter((place) => {
    if (!matchTab(place, activeTabKey.value)) return false;

    if (areaFilter.value !== 'ALL' && place.area !== areaFilter.value) return false;
    if (riskFilter.value !== 'ALL' && place.riskLevel !== riskFilter.value) return false;

    const dueDays = diffDays(place.nextVisitDue);
    if (dueFilter.value === 'DUE' && !(dueDays >= 0 && dueDays <= 7)) return false;
    if (dueFilter.value === 'OVERDUE' && !(dueDays < 0)) return false;

    if (moreModules.value.length) {
      const moduleSet = new Set((place.modules || []).map((m) => String(m).toUpperCase()));
      const allMatched = moreModules.value.every((moduleKey) => moduleSet.has(moduleKey));
      if (!allMatched) return false;
    }

    if (!keyword) return true;
    return [place.name, place.address, place.ownerName, place.ownerPhone].some((field) =>
      String(field || '').includes(keyword),
    );
  });

  return filtered.sort(sortByCurrentMode);
});

function normalizeTypeKey(raw) {
  // 将路由参数统一成内部 tab key，兼容传入小写/旧参数名
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return 'ALL';
  if (value === 'ALL') return 'ALL';
  if (value === 'KTV' || value === 'NIGHTCLUB') return 'KTV';
  return value;
}

function loadData() {
  // 每次进入页面重新读取本地场所数据，保证列表与详情页改动后同步
  rawList.value = getPlaces();
  // 如果入口传入的默认 tab 不存在于当前数据分类中，则回退到“全部”
  nextTick(() => {
    if (!tabs.value.some((tab) => tab.key === activeTabKey.value)) {
      activeTabKey.value = 'ALL';
    }
  });
}

function onSearch() {
  // 搜索触发入口，当前使用实时过滤，这里保留函数便于扩展埋点
  closeDropdown();
}

function onTabTap(tabKey) {
  // 切换 tab 时保留当前搜索与筛选条件，仅切换分类过滤维度
  activeTabKey.value = tabKey;
  // 横向 tabs 可滑动时，点击后将当前项滚动到可视区域中，避免选中项跑出视口
  tabIntoViewId.value = `tab-${tabKey}`;
  setTimeout(() => {
    tabIntoViewId.value = '';
  }, 80);
  closeDropdown();
}

function onPageScroll(event) {
  // 记录页面滚动位置，用于判断筛选条是否到达吸顶阈值
  scrollTopVal.value = Number(event?.detail?.scrollTop || 0);
  // 下拉面板打开时，实时修正 top，保证面板始终贴着筛选条底部
  if (showDropdown.value) {
    updateDropdownTop();
  }
}

function onFilterTap(filterKey) {
  // 二次点击同一筛选项时直接收起面板
  if (showDropdown.value && activeFilterKey.value === filterKey) {
    closeDropdown();
    return;
  }

  // 未吸顶时，先自动滚到筛选条位置，再展开对应面板（美团式交互）
  if (!isFilterSticky.value) {
    scrollIntoViewId.value = 'filterAnchor';
    setTimeout(() => {
      scrollIntoViewId.value = '';
      activeFilterKey.value = filterKey;
      showDropdown.value = true;
      if (filterKey === 'MORE') {
        draftMoreModules.value = [...moreModules.value];
      }
      // 自动置顶后再测量一次筛选条底部，让面板从筛选条下沿弹出
      nextTick(() => updateDropdownTop());
    }, 220);
    return;
  }

  activeFilterKey.value = filterKey;
  showDropdown.value = true;
  if (filterKey === 'MORE') {
    draftMoreModules.value = [...moreModules.value];
  }
  // 已吸顶时直接测量筛选条底部，确保面板贴边展示
  nextTick(() => updateDropdownTop());
}

function handlePageTap() {
  // 点击页面空白区域时关闭筛选面板
  if (showDropdown.value) closeDropdown();
}

function closeDropdown() {
  // 关闭下拉面板并清理激活态
  showDropdown.value = false;
  activeFilterKey.value = '';
}

function isFilterActive(filterKey) {
  // 当前筛选项在面板展开时高亮显示
  return showDropdown.value && activeFilterKey.value === filterKey;
}

function filterLabel(filterKey) {
  // 筛选条文案根据已选条件动态变化，便于快速查看当前筛选状态
  if (filterKey === 'AREA') return areaFilter.value === 'ALL' ? '全部区域' : areaFilter.value;
  if (filterKey === 'SORT') return sortOptions.find((item) => item.value === sortFilter.value)?.label || '默认排序';
  if (filterKey === 'RISK') return riskOptions.find((item) => item.value === riskFilter.value)?.label || '全部风险';
  if (filterKey === 'DUE') return dueOptions.find((item) => item.value === dueFilter.value)?.label || '全部到期';
  if (filterKey === 'MORE') return moreModules.value.length ? `筛选(${moreModules.value.length})` : '筛选';
  return '';
}

function selectArea(value) {
  // 选择区域后立即生效并关闭面板
  areaFilter.value = value;
  closeDropdown();
}

function selectSort(value) {
  // 选择排序规则后立即生效并关闭面板
  sortFilter.value = value;
  closeDropdown();
}

function selectRisk(value) {
  // 选择风险筛选后立即生效并关闭面板
  riskFilter.value = value;
  closeDropdown();
}

function selectDue(value) {
  // 选择到期筛选后立即生效并关闭面板
  dueFilter.value = value;
  closeDropdown();
}

function toggleDraftModule(moduleKey) {
  // 更多筛选使用“草稿态”多选，点击确定后再统一应用
  const set = new Set(draftMoreModules.value);
  if (set.has(moduleKey)) set.delete(moduleKey);
  else set.add(moduleKey);
  draftMoreModules.value = Array.from(set);
}

function resetMore() {
  // 更多筛选一键重置，保持面板继续打开便于再次选择
  draftMoreModules.value = [];
}

function confirmMore() {
  // 将草稿筛选项写入正式筛选条件并关闭面板
  moreModules.value = [...draftMoreModules.value];
  closeDropdown();
}

function matchTab(place, tabKey) {
  // tab 匹配策略：主类型优先，模块类型作为补充维度
  if (tabKey === 'ALL') return true;

  const primary = String(place.primaryType || '').toUpperCase();
  const modules = (place.modules || []).map((m) => String(m).toUpperCase());

  if (tabKey === 'KTV') return primary === 'KTV' || modules.includes('NIGHTCLUB');
  if (tabKey === 'CHESS_CARD') return primary === 'CHESS_CARD' || modules.includes('CHESS_CARD');

  if (primary === tabKey) return true;
  if (modules.includes(tabKey)) return true;
  return false;
}

function diffDays(dateStr) {
  // 计算距到期日天数：负数=已超期，零=今天到期，正数=剩余天数
  if (!dateStr) return 9999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(`${dateStr} 00:00:00`);
  const ms = due.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function dueText(dateStr) {
  // 到期提示文案统一在列表底部展示
  if (!dateStr) return '未设置到期时间';
  const days = diffDays(dateStr);
  if (days < 0) return `已超期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  if (days <= 7) return `临期 ${days} 天`;
  return `还剩 ${days} 天`;
}

function dueClass(dateStr) {
  // 到期文案颜色：超期红色、临期橙色、正常灰色
  const days = diffDays(dateStr);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'soon';
  return 'normal';
}

function riskClass(level) {
  // 风险等级颜色映射
  if (level === '高') return 'high';
  if (level === '中') return 'medium';
  return 'low';
}

function typeLabel(typeKey) {
  // 类型文案映射：未知值直接回显，避免空标签
  const key = String(typeKey || '').toUpperCase();
  return normalizeDisplayLabel(TYPE_LABEL_MAP[key] || key || '未分类');
}

function moduleLabel(moduleKey) {
  // 模块文案映射与 tab 共用同一字典，保证语义一致
  const key = String(moduleKey || '').toUpperCase();
  return normalizeDisplayLabel(TYPE_LABEL_MAP[key] || key);
}

function placeDisplayTags(place) {
  // 卡片标签统一为“主类型 + 模块补充”最多 3 个，避免只在左侧堆叠造成右侧大片留白
  const primaryLabel = typeLabel(place.primaryType);
  const tags = [primaryLabel, ...(place.modules || []).map((m) => moduleLabel(m))]
    .filter(Boolean);
  return Array.from(new Set(tags)).slice(0, 3);
}

function normalizeDisplayLabel(label) {
  // 展示文案统一去掉“/”后的附加语义，避免出现“KTV/夜场”这种双重含义
  const text = String(label || '').trim();
  if (!text) return text;
  return text.includes('/') ? text.split('/')[0] : text;
}

function riskScore(level) {
  if (level === '高') return 3;
  if (level === '中') return 2;
  return 1;
}

function sortByCurrentMode(a, b) {
  // 排序模式统一入口：保证排序切换时行为稳定
  if (sortFilter.value === 'RISK_DESC') {
    return riskScore(b.riskLevel) - riskScore(a.riskLevel);
  }
  if (sortFilter.value === 'DUE_SOON') {
    return diffDays(a.nextVisitDue) - diffDays(b.nextVisitDue);
  }
  if (sortFilter.value === 'OVERDUE_DESC') {
    const overdueA = Math.max(0, -diffDays(a.nextVisitDue));
    const overdueB = Math.max(0, -diffDays(b.nextVisitDue));
    return overdueB - overdueA;
  }
  return 0;
}

function goDetail(place) {
  // 按主类型路由到对应详情页，保持现有详情页结构不变
  const map = {
    KTV: '/pages/place/ktv/detail',
    RENTAL: '/pages/place/rental/detail',
    NETBAR: '/pages/place/netbar/detail',
    FOOTBATH: '/pages/place/footbath/detail',
    CHESS_CARD: '/pages/place/chess/detail',
  };
  const base = map[String(place.primaryType || '').toUpperCase()] || '/pages/place/ktv/detail';
  uni.navigateTo({ url: `${base}?placeId=${place.placeId}` });
}

function measureStickyBase() {
  // 计算筛选条吸顶阈值与高度，供“吸顶 + 下拉面板定位”使用
  if (!instance) return;
  const query = uni.createSelectorQuery().in(instance);
  query.select('#filterAnchor').boundingClientRect();
  query.select('#filterBarStatic').boundingClientRect();
  query.exec((res) => {
    const anchorRect = res?.[0];
    const barRect = res?.[1];
    if (anchorRect) {
      // 当前页面默认 scrollTop=0，因此可以用 viewport top - safeTop 得到滚动阈值
      stickyThreshold.value = Math.max(0, Number(anchorRect.top || 0) - safeTop.value);
    }
    if (barRect?.height) {
      filterBarHeight.value = Math.ceil(Number(barRect.height));
    }
    // 页面初次测量后同步初始化面板位置兜底值
    dropdownTop.value = safeTop.value + filterBarHeight.value;
  });
}

function updateDropdownTop() {
  // 动态读取筛选条底部坐标：无论筛选条是否吸顶，面板都从该底部位置弹出
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

onLoad((query) => {
  // 接收入口参数：type/filterType 控制默认 tab，title 控制页面副标题语义
  const sys = uni.getSystemInfoSync();
  safeTop.value = sys.safeAreaInsets?.top ?? sys.statusBarHeight ?? 0;
  activeTabKey.value = normalizeTypeKey(query?.type || query?.filterType || 'ALL');
});

onShow(() => {
  loadData();
  // 数据刷新后重新测量一次吸顶阈值，避免内容高度变化导致阈值漂移
  nextTick(() => measureStickyBase());
});

onReady(() => {
  // 首次渲染完成后测量吸顶阈值和筛选条高度
  nextTick(() => measureStickyBase());
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.placeList {
  position: relative;
  min-height: 100%;
  padding: 16rpx 24rpx 40rpx;
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
  font-size: 26rpx;
  margin-right: 10rpx;
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

.placeCard {
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

.placeCardActive {
  opacity: 0.85;
}

.placeCover {
  width: 116rpx;
  height: 116rpx;
  border-radius: 14rpx;
  background: #e9edf2;
  flex-shrink: 0;
}

.placeMain {
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

.placeName {
  flex: 1;
  min-width: 0;
  color: #1f2b3a;
  font-size: 34rpx;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.riskTag {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.riskTag.high {
  background: #ffecec;
  color: #d64545;
}

.riskTag.medium {
  background: #fff6e6;
  color: #c88719;
}

.riskTag.low {
  background: #e6f7ed;
  color: #1b9d5d;
}

.addrRow {
  margin-top: 4rpx;
  color: #6e7a89;
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.typeTag,
.moduleTag {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  flex-shrink: 0;
}

.typeTag {
  background: #eaf3ff;
  color: #1677ff;
}

.moduleTag {
  background: #f4f6f8;
  color: #344150;
}

.dueText {
  flex-shrink: 0;
  font-size: 28rpx;
  white-space: nowrap;
  text-align: right;
}

.dueText.overdue {
  color: #d64545;
}

.dueText.soon {
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
