<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg">
      <view class="card actionCard">
        <view class="actionBtns"><view class="actionBtn primary" @tap="scanAsset">开始扫码</view><view class="actionBtn ghost" @tap="pickDemoAsset">模拟扫码</view></view>
        <view class="manualRow"><input v-model.trim="manualCode" class="manualInput" placeholder="请输入资产编号，例如 ASSET-000105" /><view class="manualBtn" @tap="searchByCode">查询</view></view>
      </view>
      <view v-if="asset" class="card resultCard">
        <view class="resultHead"><view><text class="sectionTitle">资产身份信息</text><text class="sectionSub">{{ asset.code }} · {{ asset.name }}</text></view><text :class="['statusBadge', `status-${asset.status}`]">{{ asset.status }}</text></view>
        <view class="infoGrid">
          <view class="infoItem"><text class="label">资产类别</text><text class="value">{{ asset.category }}</text></view>
          <view class="infoItem"><text class="label">规格型号</text><text class="value">{{ asset.model }}</text></view>
          <view class="infoItem"><text class="label">所属部门</text><text class="value">{{ asset.department }}</text></view>
          <view class="infoItem"><text class="label">当前归属人</text><text class="value">{{ asset.ownerName || '暂无' }}</text></view>
          <view class="infoItem"><text class="label">存放位置</text><text class="value">{{ asset.location }}</text></view>
          <view class="infoItem"><text class="label">领用时间</text><text class="value">{{ asset.receiveTime || '未领用' }}</text></view>
          <view class="infoItem"><text class="label">标签状态</text><text class="value">{{ asset.labelStatus }}</text></view>
          <view class="infoItem"><text class="label">实物状态</text><text class="value">{{ asset.physicalStatus }}</text></view>
          <view class="infoItem"><text class="label">最近盘点</text><text class="value">{{ asset.lastInventoryTime || '暂无' }}</text></view>
          <view class="infoItem"><text class="label">盘点结果</text><text class="value">{{ asset.lastInventoryResult || '暂无' }}</text></view>
        </view>
        <view class="latestCard"><text class="latestTitle">最近一次操作记录</text><text class="latestText">{{ latestLogText }}</text><text class="latestHint">{{ claimableHint }}</text></view>
        <view class="actionFoot"><view v-if="asset.status === '未领用'" class="actionBtn primary" @tap="claimCurrentAsset">立即申领</view><view v-else-if="['已领用', '借用中', '盘点异常'].includes(asset.status)" class="actionBtn ghost" @tap="goDetail">查看归属详情</view><text v-else class="statusHint">{{ statusHint }}</text></view>
      </view>
      <view class="card tipCard"><text class="sectionTitle">近期可识别资产</text><view class="codeList"><view v-for="item in demoAssets" :key="item.code" class="codeChip" @tap="selectAsset(item.code)">{{ item.code }}</view></view></view>
    </view>
  </AppPage>
</template>
<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { claimAsset, getAssetItems, getAssetLatestLog, recordAssetScan } from '@/common/asset.js';
const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const manualCode = ref(''); const asset = ref(null); const allAssets = ref([]);
const demoAssets = computed(() => allAssets.value.slice(0, 6));
const latestLogText = computed(() => { const log = asset.value ? getAssetLatestLog(asset.value) : null; return log ? `${log.time} · ${log.type} · ${log.note}` : '暂无操作记录'; });
const claimableHint = computed(() => { if (!asset.value) return ''; if (asset.value.status === '未领用') return '当前可申领：是'; if (['已领用','借用中'].includes(asset.value.status)) return `当前可申领：否，归属 ${asset.value.ownerName || '未登记'}`; return '当前可申领：否'; });
const statusHint = computed(() => { if (!asset.value) return ''; if (asset.value.status === '维修中') return '资产维修中，当前不可申领'; if (asset.value.status === '报废') return '资产已报废，仅保留归档信息'; return '当前状态不支持直接申领'; });
function load(){ allAssets.value=getAssetItems(); if(asset.value?.code){ asset.value=allAssets.value.find((item)=>item.code===asset.value.code)||null; }}
function selectAsset(code){ const result=recordAssetScan(code,'扫码识别归属'); asset.value=result; manualCode.value=code; }
function pickDemoAsset(){ if(!demoAssets.value.length) return; selectAsset(demoAssets.value[0].code); }
function searchByCode(){ if(!manualCode.value){ uni.showToast({title:'请输入资产编号',icon:'none'}); return; } const result=recordAssetScan(manualCode.value,'手动输入资产编号识别'); if(!result){ uni.showToast({title:'未找到该资产',icon:'none'}); return; } asset.value=result; }
function scanAsset(){ uni.scanCode({ success:(res)=>{ manualCode.value=res.result||''; searchByCode(); }, fail:()=>{ uni.showToast({title:'当前环境不可扫码，已切换模拟扫码',icon:'none'}); pickDemoAsset(); } }); }
function claimCurrentAsset(){ if(!asset.value?.code) return; const result=claimAsset(asset.value.code,{note:'扫码识别后立即申领'}); if(!result.ok){ uni.showToast({title:result.message,icon:'none'}); return; } asset.value=result.asset; load(); uni.showToast({title:'申领成功',icon:'success'}); }
function goDetail(){ if(!asset.value?.code) return; uni.navigateTo({url:`/pages/assets/detail?code=${asset.value.code}`}); }
onShow(load);
</script>
<style lang="scss" scoped>
.assetSubPage{min-height:100vh;padding:0 24rpx 32rpx;box-sizing:border-box}.card{background:rgba(255,255,255,.94);border-radius:18rpx;box-shadow:0 8rpx 24rpx rgba(18,38,63,.08)}.actionCard,.resultCard,.tipCard{padding:18rpx;margin-top:14rpx}.sectionTitle{display:block;font-size:32rpx;color:#1b2b43;font-weight:700}.sectionSub{display:block;margin-top:8rpx;font-size:24rpx;color:#7b8799}.actionBtns{display:flex;gap:14rpx}.actionBtn{flex:1;height:76rpx;border-radius:14rpx;display:flex;align-items:center;justify-content:center;font-size:26rpx;font-weight:600}.primary{background:#0f75ff;color:#fff}.ghost{background:#edf4ff;color:#0f75ff}.manualRow{display:flex;gap:12rpx;margin-top:14rpx}.manualInput{flex:1;height:76rpx;border-radius:14rpx;background:#f7f9fc;padding:0 20rpx;font-size:24rpx}.manualBtn{width:140rpx;height:76rpx;border-radius:14rpx;background:#edf4ff;color:#0f75ff;display:flex;align-items:center;justify-content:center;font-size:24rpx;font-weight:600}.resultHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16rpx}.statusBadge{padding:10rpx 16rpx;border-radius:999rpx;font-size:22rpx;font-weight:600}.status-未领用{background:#ecfdf3;color:#16a34a}.status-已领用,.status-借用中{background:#eef4ff;color:#2563eb}.status-维修中,.status-盘点异常{background:#fff4e5;color:#d97706}.status-报废{background:#f3f4f6;color:#7b8799}.infoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx;margin-top:16rpx}.infoItem,.latestCard{padding:14rpx;border-radius:14rpx;background:#f7faff}.label,.latestText,.latestHint,.statusHint{display:block;margin-top:8rpx;font-size:24rpx;color:#7b8799;line-height:1.45}.value,.latestTitle{display:block;margin-top:8rpx;font-size:26rpx;color:#24354d;font-weight:600;line-height:1.45}.actionFoot,.codeList{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:16rpx}.codeChip{padding:12rpx 18rpx;border-radius:999rpx;background:#edf4ff;color:#0f75ff;font-size:22rpx}
</style>
