<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg">
      <view class="card entryCard">
        <view class="scanEntry" @tap="scanAndClaim">
          <text class="scanTitle">扫码申领</text>
          <text class="scanDesc">扫描资产二维码后直接完成申领</text>
        </view>
      </view>
      <view class="card queryCard">
        <view class="sectionHead"><text class="sectionTitle">输入资产编码申领</text></view>
        <view class="manualRow">
          <input v-model.trim="manualCode" class="manualInput" placeholder="请输入资产编号，例如 ASSET-000105" />
          <view class="manualBtn" @tap="searchByCode">查询</view>
        </view>
        <text v-if="queryMessage" class="queryMessage">{{ queryMessage }}</text>
        <view v-if="searchedAsset" class="resultCard">
          <view class="assetHead">
            <text class="assetName">{{ searchedAsset.name }}</text>
            <text :class="['statusBadge', `status-${searchedAsset.status}`]">{{ searchedAsset.status }}</text>
          </view>
          <text class="assetMeta">资产编号：{{ searchedAsset.code }}</text>
          <text class="assetMeta">类别：{{ searchedAsset.category }} · 存放位置：{{ searchedAsset.location }}</text>
          <text class="assetMeta">所属部门：{{ searchedAsset.department }}</text>
          <view class="assetActions">
            <view v-if="searchedAsset.status === '未领用'" class="claimBtn" @tap="claimByCode(searchedAsset.code)">确认申领</view>
            <text v-else class="statusText">{{ statusMessage }}</text>
          </view>
        </view>
      </view>
      <view class="card listCard">
        <view class="sectionHead">
          <text class="sectionTitle">列表申领</text>
          <text class="sectionSub">共 {{ claimableAssets.length }} 件可申领资产</text>
        </view>
        <view v-if="claimableAssets.length" class="assetList">
          <view v-for="item in claimableAssets" :key="item.code" class="assetItem">
            <view class="assetItemHead">
              <text class="assetName">{{ item.name }}</text>
              <text class="assetCode">{{ item.code }}</text>
            </view>
            <text class="assetMeta">类别：{{ item.category }} · 存放：{{ item.location }}</text>
            <view class="assetActions"><view class="claimBtn" @tap="claimByCode(item.code)">确认申领</view></view>
          </view>
        </view>
        <view v-else class="emptyState">当前暂无可申领资产</view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { claimAsset, findAssetByCode, getClaimableAssets } from '@/common/asset.js';
const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const assets = ref([]); const manualCode = ref(''); const searchedAsset = ref(null); const queryMessage = ref('');
const claimableAssets = computed(() => assets.value);
const statusMessage = computed(() => {
  if (!searchedAsset.value) return '';
  if (['已领用', '借用中'].includes(searchedAsset.value.status)) return '该资产已被领用';
  if (searchedAsset.value.status === '维修中') return '该资产维修中，暂不可申领';
  if (searchedAsset.value.status === '报废') return '该资产不可申领';
  if (searchedAsset.value.status === '盘点异常') return '该资产盘点异常，请先核实';
  return '当前状态不支持申领';
});
function load() { assets.value = getClaimableAssets(); if (searchedAsset.value?.code) searchedAsset.value = findAssetByCode(searchedAsset.value.code); }
function searchByCode() {
  queryMessage.value = ''; searchedAsset.value = null;
  if (!manualCode.value) { queryMessage.value = '请输入资产编号'; return; }
  const asset = findAssetByCode(manualCode.value);
  if (!asset) { queryMessage.value = '未找到该资产'; return; }
  searchedAsset.value = asset; if (asset.status !== '未领用') queryMessage.value = statusMessage.value;
}
function claimByCode(code) {
  const result = claimAsset(code, { note: '资产申领成功' });
  if (!result.ok) { uni.showToast({ title: result.message, icon: 'none' }); queryMessage.value = result.message; searchedAsset.value = result.asset; return; }
  uni.showToast({ title: '申领成功', icon: 'success' }); searchedAsset.value = result.asset; queryMessage.value = '申领成功，已登记领用人和时间'; load();
}
function scanAndClaim() {
  uni.scanCode({
    success: (res) => { if (!res.result) return; manualCode.value = res.result; searchByCode(); if (searchedAsset.value?.status === '未领用') claimByCode(searchedAsset.value.code); },
    fail: () => { if (!claimableAssets.value.length) return; const demo = claimableAssets.value[0].code; manualCode.value = demo; searchByCode(); claimByCode(demo); uni.showToast({ title: '当前环境不可扫码，已执行模拟申领', icon: 'none' }); },
  });
}
onShow(load);
</script>

<style lang="scss" scoped>
.assetSubPage{min-height:100vh;padding:0 24rpx 32rpx;box-sizing:border-box}.card{background:rgba(255,255,255,.94);border-radius:18rpx;box-shadow:0 8rpx 24rpx rgba(18,38,63,.08)}.entryCard,.queryCard,.listCard{padding:18rpx;margin-top:14rpx}.scanEntry{padding:18rpx;border-radius:16rpx;background:linear-gradient(135deg,#eef5ff 0%,#f8fbff 100%);border:2rpx solid #dbe7ff}.sectionHead,.assetItemHead,.assetHead{display:flex;align-items:center;justify-content:space-between;gap:16rpx}.sectionTitle,.scanTitle{display:block;font-size:32rpx;color:#1b2b43;font-weight:700}.scanDesc,.assetMeta,.sectionSub,.emptyState,.queryMessage,.statusText{display:block;margin-top:8rpx;font-size:24rpx;color:#7b8799;line-height:1.45}.manualRow{display:flex;gap:12rpx;margin-top:14rpx}.manualInput{flex:1;height:76rpx;border-radius:14rpx;background:#f7f9fc;padding:0 20rpx;font-size:24rpx}.manualBtn,.claimBtn{min-width:150rpx;height:76rpx;padding:0 22rpx;border-radius:14rpx;background:#0f75ff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24rpx;font-weight:600}.resultCard,.assetItem{margin-top:16rpx;padding:16rpx;border-radius:14rpx;background:#f8fbff}.assetName{font-size:28rpx;color:#24354d;font-weight:600}.assetCode{font-size:22rpx;color:#0f75ff}.assetActions{display:flex;justify-content:flex-end;margin-top:14rpx}.statusBadge{padding:10rpx 16rpx;border-radius:999rpx;background:#edf4ff;color:#0f75ff;font-size:22rpx;font-weight:600}.status-报废{background:#f3f4f6;color:#7b8799}.status-维修中,.status-盘点异常{background:#fff4e5;color:#d97706}.status-已领用,.status-借用中{background:#eef4ff;color:#2563eb}.emptyState{text-align:center;padding:20rpx 0 6rpx}
</style>
