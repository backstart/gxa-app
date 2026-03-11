<template>
  <AppPage :bg="PAGE_BG">
    <view class="alarmList pageBg">
      <view class="scopeCard card">
        <view class="scopeTop">
          <text class="scopeTitle">{{ payload.reportTitle || '分析报告：全部警情' }}</text>
          <text class="summaryText">共 {{ items.length }} 条警情</text>
        </view>
        <text class="scopeLine">{{ payload.scopeTitle || '-' }}<text v-if="payload.scopeSub">（{{ payload.scopeSub }}）</text></text>
        <text class="scopeLine">辖区：{{ payload.areaLabel || '全部辖区' }}</text>
      </view>

      <view v-if="!items.length" class="emptyCard card">
        <text class="emptyText">当前筛选条件下暂无警情数据</text>
      </view>

      <view v-else class="listWrap">
        <view v-for="item in items" :key="item.id" class="alarmCard card">
          <view class="alarmHead">
            <view class="alarmHeadMain">
              <text class="alarmTitle">{{ item.displayTitle }}</text>
            </view>
            <text class="alarmTime">{{ item.timeText }}</text>
          </view>
          <text class="alarmContent">{{ item.contentPreview }}</text>
          <view class="alarmFoot">
            <text class="alarmMeta">地点：{{ item.address || '暂无地点' }}</text>
          </view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';

const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const ANALYSIS_ALARM_LIST_KEY = 'analysis_alarm_list_payload';

const payload = ref({
  reportTitle: '',
  scopeTitle: '',
  scopeSub: '',
  areaLabel: '',
  items: [],
});

const items = computed(() => {
  const source = Array.isArray(payload.value.items) ? payload.value.items : [];
  return source.map((item) => ({
    ...item,
    displayTitle: buildDisplayTitle(item),
    contentPreview: buildContentPreview(item),
  }));
});

function hashText(value) {
  const text = String(value || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickBySeed(list, seedText) {
  if (!Array.isArray(list) || !list.length) return '';
  return list[hashText(seedText) % list.length];
}

function normalizeAddress(address) {
  return address || '相关区域';
}

function buildDisplayTitle(item) {
  if (item.displayTitle) return item.displayTitle;
  const address = normalizeAddress(item.address);
  const seed = `${item.id || ''}-${item.rawType || ''}-${address}`;

  const titleMap = {
    纠纷类: [
      `${address}商铺纠纷`,
      `${address}邻里争吵警情`,
      `${address}摊位占道纠纷`,
      `${address}群众聚集报警`,
    ],
    交通类: [
      `${address}两车追尾`,
      `${address}车辆剐蹭警情`,
      `${address}路口交通事故`,
      `${address}机动车碰撞纠纷`,
    ],
    咨询类: [
      '群众咨询落户政策',
      '群众咨询居住证办理',
      '群众咨询户籍迁移手续',
      '群众咨询子女入学政策',
    ],
    紧急求助: [
      '老人迷路求助警情',
      '群众突发身体不适求助',
      `${address}儿童走失求助`,
      `${address}群众紧急求助`,
    ],
    刑事: [
      '中港英学生打架',
      `${address}群众打架报警`,
      `${address}商户冲突警情`,
      `${address}治安冲突警情`,
    ],
    行政: [
      '商铺无证经营被群众投诉',
      `${address}商户占道经营`,
      `${address}夜间噪音扰民`,
      `${address}摊贩经营投诉`,
    ],
    举报类: [
      '群众举报夜间施工噪音',
      `${address}商户违规经营举报`,
      `${address}群众举报占道摆卖`,
      `${address}夜间施工扰民举报`,
    ],
    其他类: [
      `${address}商户占道经营`,
      `${address}群众异常聚集报警`,
      `${address}公共秩序异常警情`,
      `${address}现场秩序维护警情`,
    ],
  };

  if (item.rawType === '刑事' || item.rawType === '行政') {
    return pickBySeed(titleMap[item.rawType], seed);
  }

  return pickBySeed(titleMap[item.rawType], seed) || `${address}${item.categoryLabel || item.rawType || '警情'}`;
}

function buildContentPreview(item) {
  if (item.contentPreview) return item.contentPreview;
  const address = normalizeAddress(item.address);
  if (item.rawType === '纠纷类') return `群众反映${address}因经营、通行或生活噪音问题引发争执，现场一度出现围观，已纳入处置跟进。`;
  if (item.rawType === '交通类') return `两辆机动车在${address}附近发生碰撞或剐蹭，现场通行短时受影响，目前已记录并进入后续处置。`;
  if (item.rawType === '咨询类') return `群众就户籍、居住证或相关政策问题进行报警咨询，事发位置在${address}，需进一步解释答复。`;
  if (item.rawType === '紧急求助') return `群众在${address}发起紧急求助，现场涉及老人、儿童或突发身体不适情况，需尽快响应处理。`;
  if (item.rawType === '刑事') return `${address}发生人员冲突或治安类警情，现场情况已被记录，相关处置流程正在推进。`;
  if (item.rawType === '行政') return `群众反映${address}存在经营秩序、噪音扰民或占道问题，当前已纳入行政警情处置范围。`;
  if (item.rawType === '举报类') return `群众举报${address}存在施工扰民、违规经营或秩序异常情况，相关信息已汇总进入分析范围。`;
  return `警情发生在${address}，现场情况已录入系统，作为当前统计范围内的重点警情持续关注。`;
}

function loadPayload() {
  const stored = uni.getStorageSync(ANALYSIS_ALARM_LIST_KEY);
  if (stored && typeof stored === 'object') {
    payload.value = stored;
    return;
  }
  payload.value = {
    reportTitle: '分析报告：全部警情',
    scopeTitle: '',
    scopeSub: '',
    areaLabel: '全部辖区',
    items: [],
  };
}

onLoad(loadPayload);
onShow(loadPayload);
</script>

<style lang="scss" scoped>
.alarmList {
  min-height: 100vh;
  padding: 6rpx 24rpx 28rpx;
  box-sizing: border-box;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(18, 38, 63, 0.08);
}

.scopeCard {
  padding: 16rpx 18rpx 14rpx;
  margin-bottom: 20rpx;
}

.scopeTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.scopeTitle {
  display: block;
  font-size: 30rpx;
  line-height: 1.35;
  color: #1b2b43;
  font-weight: 700;
}

.scopeLine {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #7b8799;
}

.summaryText {
  font-size: 24rpx;
  color: #4c5c74;
  font-weight: 600;
  flex-shrink: 0;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #f3f7ff;
}

.listWrap {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.alarmCard {
  padding: 26rpx 26rpx 24rpx;
  margin: 5rpx 2rpx;
}

.alarmHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.alarmHeadMain {
  flex: 1;
  min-width: 0;
}

.alarmTitle {
  font-size: 31rpx;
  line-height: 1.45;
  color: #1d6ef2;
  font-weight: 700;
  display: block;
}

.alarmTime {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #99a4b5;
  line-height: 1.4;
  padding-top: 4rpx;
}

.alarmContent {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  color: #5f6d83;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alarmFoot {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.alarmMeta {
  font-size: 24rpx;
  color: #7b8799;
  line-height: 1.4;
}

.emptyCard {
  padding: 42rpx 24rpx;
  text-align: center;
}

.emptyText {
  font-size: 26rpx;
  color: #7b8799;
}
</style>
