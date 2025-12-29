<template>
  <view class="map-page pageBg">
    <view class="statuBar"></view>
    <view class="overlay card">
      <view class="section-head">
        <text class="section-title">图层</text>
        <text class="section-sub">警情/重点人/重点场所/巡逻点</text>
      </view>
      <view class="chips">
        <view v-for="layer in layers" :key="layer.key" :class="['chip', layer.enabled ? 'active' : '']" @click="toggleLayer(layer.key)">
          {{ layer.label }}
        </view>
      </view>
      <view class="section-head">
        <text class="section-title">风险筛选</text>
      </view>
      <view class="chips">
        <view v-for="r in risks" :key="r" :class="['chip', riskFilter === r ? 'active' : '']" @click="riskFilter = r">{{ r }}</view>
      </view>
      <view class="section-head">
        <text class="section-title">时间范围</text>
        <text class="section-sub">占位（未实现）</text>
      </view>
      <button size="mini" type="primary" @click="pushPoints">筛选并推送</button>
    </view>

    <web-view id="mapWebview" class="map-view" src="/static/map/amap.html" @message="onMessage"></web-view>

    <view class="drawer" v-if="drawerVisible">
      <view class="drawer-head">
        <text class="drawer-title">{{ selectedItem.name || selectedItem.title }}</text>
        <button size="mini" @click="drawerVisible=false">关闭</button>
      </view>
      <view class="drawer-meta">{{ selectedItem.address || selectedItem.area || selectedItem.community || '' }}</view>
      <view class="drawer-meta">风险：{{ selectedItem.riskLevel || selectedItem.risk }}</view>
      <view class="drawer-actions">
        <button size="mini" @click="openDetail">查看详情</button>
        <button size="mini" type="primary" @click="goDispatch">派单</button>
        <button size="mini" @click="goAnalysis">分析</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getIncidents, getKeyPersons, getKeyPlaces, getPatrolPoints } from '@/common/database.js';

const layers = ref([
  { key: 'INCIDENT', label: '警情', enabled: true },
  { key: 'KEY_PERSON', label: '重点人', enabled: true },
  { key: 'KEY_PLACE', label: '重点场所', enabled: true },
  { key: 'PATROL_POINT', label: '巡逻点', enabled: true },
]);
const risks = ['全部', '高', '中', '低'];
const riskFilter = ref('全部');

const drawerVisible = ref(false);
const selectedItem = ref({});
const selectedLayer = ref('');

const webviewId = 'mapWebview';

const points = computed(() => {
  const arr = [];
  const riskPass = (r) => riskFilter.value === '全部' || r === riskFilter.value;
  if (layers.value.find((l) => l.key === 'INCIDENT' && l.enabled)) {
    getIncidents().forEach((i, idx) => {
      if (!riskPass(i.riskLevel)) return;
      arr.push({
        id: i.id,
        name: i.title,
        layerType: 'INCIDENT',
        risk: i.riskLevel,
        position: mockPos(idx),
      });
    });
  }
  if (layers.value.find((l) => l.key === 'KEY_PLACE' && l.enabled)) {
    getKeyPlaces().forEach((p, idx) => {
      if (!riskPass(p.riskLevel)) return;
      arr.push({
        id: p.id,
        name: p.name,
        layerType: 'KEY_PLACE',
        risk: p.riskLevel,
        position: mockPos(idx + 10),
      });
    });
  }
  if (layers.value.find((l) => l.key === 'KEY_PERSON' && l.enabled)) {
    getKeyPersons().forEach((p, idx) => {
      if (!riskPass(p.riskLevel)) return;
      arr.push({
        id: p.id,
        name: p.name,
        layerType: 'KEY_PERSON',
        risk: p.riskLevel,
        position: mockPos(idx + 20),
      });
    });
  }
  if (layers.value.find((l) => l.key === 'PATROL_POINT' && l.enabled)) {
    getPatrolPoints().forEach((p, idx) => {
      if (!riskPass(p.riskLevel)) return;
      arr.push({
        id: p.id,
        name: p.name,
        layerType: 'PATROL_POINT',
        risk: p.riskLevel,
        position: mockPos(idx + 30),
      });
    });
  }
  return arr;
});

function mockPos(seed) {
  const baseLng = 113.3245;
  const baseLat = 23.0999;
  return [baseLng + seed * 0.001, baseLat + seed * 0.001];
}

function toggleLayer(key) {
  layers.value = layers.value.map((l) => (l.key === key ? { ...l, enabled: !l.enabled } : l));
}

function pushPoints() {
  const ctx = uni.createWebViewContext(webviewId);
  ctx.postMessage({ type: 'POINTS', payload: points.value });
  uni.showToast({ title: '已推送筛选', icon: 'none' });
}

function onMessage(e) {
  const msg = e.detail.data && e.detail.data[0];
  if (!msg || msg.type !== 'POINT_CLICK') return;
  const { layerType, id } = msg.payload || {};
  selectedLayer.value = layerType;
  loadSelected(layerType, id);
}

function loadSelected(layer, id) {
  let list = [];
  if (layer === 'INCIDENT') list = getIncidents().map((i) => ({ ...i, name: i.title }));
  if (layer === 'KEY_PLACE') list = getKeyPlaces();
  if (layer === 'KEY_PERSON') list = getKeyPersons();
  if (layer === 'PATROL_POINT') list = getPatrolPoints();
  const found = list.find((i) => i.id === id);
  if (found) {
    selectedItem.value = found;
    drawerVisible.value = true;
  }
}

function openDetail() {
  const item = selectedItem.value;
  if (item.url) {
    uni.navigateTo({ url: item.url });
  } else {
    uni.showToast({ title: '暂无详情页', icon: 'none' });
  }
}

function goDispatch() {
  uni.navigateTo({
    url: `/pages/dispatch/assign?sourceType=${selectedLayer.value}&sourceId=${selectedItem.value.id}`,
  });
}

function goAnalysis() {
  uni.navigateTo({ url: '/subPackages/map/analysis' });
}

onShow(() => {
  pushPoints();
});
</script>

<style lang="scss" scoped>
.map-page {
  min-height: 100vh;
  position: relative;
}
.overlay {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  z-index: 10;
}
.map-view {
  width: 100%;
  height: 100vh;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 8rpx;
}
.chip {
  padding: 10rpx 14rpx;
  border-radius: 12rpx;
  background: #f4f6f8;
  font-size: 24rpx;
}
.chip.active {
  background: #0f75ff;
  color: #fff;
}
.drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.96);
  border-radius: 16rpx 16rpx 0 0;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.1);
  padding: 16rpx;
  z-index: 20;
}
.drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.drawer-title {
  font-size: 32rpx;
  font-weight: 700;
}
.drawer-meta {
  margin-top: 6rpx;
  color: #6b7785;
  font-size: 24rpx;
}
.drawer-actions {
  margin-top: 10rpx;
  display: flex;
  gap: 10rpx;
}
.section-head {
  margin-bottom: 6rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
}
.section-sub {
  font-size: 24rpx;
  color: #6e7a89;
}
.card {
  background: rgba(255,255,255,0.92);
  border-radius: 16rpx;
  padding: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}
</style>
