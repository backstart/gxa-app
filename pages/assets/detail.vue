<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg">
      <view v-if="asset" class="card summaryCard">
        <view class="summaryHead"><view><text class="assetName">{{ asset.name }}</text><text class="assetCode">{{ asset.code }}</text></view><text :class="['statusBadge', `status-${asset.status}`]">{{ asset.status }}</text></view>
        <view class="infoGrid">
          <view class="infoItem"><text class="label">资产类别</text><text class="value">{{ asset.category }}</text></view>
          <view class="infoItem"><text class="label">规格型号</text><text class="value">{{ asset.model }}</text></view>
          <view class="infoItem"><text class="label">所属部门</text><text class="value">{{ asset.department }}</text></view>
          <view class="infoItem"><text class="label">当前责任人</text><text class="value">{{ asset.ownerName || '暂无' }}</text></view>
          <view class="infoItem"><text class="label">存放位置</text><text class="value">{{ asset.location }}</text></view>
          <view class="infoItem"><text class="label">领用时间</text><text class="value">{{ asset.receiveTime || '未登记' }}</text></view>
          <view class="infoItem"><text class="label">标签状态</text><text class="value">{{ asset.labelStatus }}</text></view>
          <view class="infoItem"><text class="label">实物状态</text><text class="value">{{ asset.physicalStatus }}</text></view>
        </view>
      </view>
      <view v-if="asset" class="card section">
        <view class="sectionHead"><text class="sectionTitle">资产操作</text></view>
        <view class="actionGrid"><view v-for="item in actionOptions" :key="item.key" :class="['actionChip', activeAction === item.key ? 'actionChipActive' : '']" @tap="activeAction = item.key">{{ item.title }}</view></view>
        <view v-if="activeAction === 'return'" class="formBlock"><textarea v-model.trim="returnNote" class="textarea" placeholder="填写归还说明，可选" /><view class="primaryBtn" @tap="submitReturn">提交归还</view></view>
        <view v-else-if="activeAction === 'transfer'" class="formBlock"><text class="fieldLabel">新归属人</text><view class="chipWrap"><view v-for="item in ownerOptions" :key="item.id" :class="['optionChip', transferOwnerId === item.id ? 'optionChipActive' : '']" @tap="selectTransferOwner(item)">{{ item.name }}</view></view><textarea v-model.trim="transferReason" class="textarea" placeholder="填写变更归属原因" /><view class="primaryBtn" @tap="submitTransfer">确认变更归属</view></view>
        <view v-else-if="activeAction === 'repair'" class="formBlock"><text class="fieldLabel">故障类型</text><view class="chipWrap"><view v-for="item in repairTypes" :key="item" :class="['optionChip', repairType === item ? 'optionChipActive' : '']" @tap="repairType = item">{{ item }}</view></view><textarea v-model.trim="repairDesc" class="textarea" placeholder="填写故障描述" /><view class="primaryBtn" @tap="submitRepair">提交报修</view></view>
        <view v-else-if="activeAction === 'scrap'" class="formBlock"><text class="fieldLabel">报废原因类型</text><view class="chipWrap"><view v-for="item in scrapTypes" :key="item" :class="['optionChip', scrapType === item ? 'optionChipActive' : '']" @tap="scrapType = item">{{ item }}</view></view><textarea v-model.trim="scrapReason" class="textarea" placeholder="填写报废原因" /><view class="primaryBtn dangerBtn" @tap="submitScrap">提交报废申请</view></view>
      </view>
      <view v-if="asset" class="card section"><view class="sectionHead"><text class="sectionTitle">操作记录</text></view><view v-if="asset.logs?.length" class="logList"><view v-for="item in asset.logs" :key="item.id" class="logItem"><view class="logHead"><text class="logType">{{ item.type }}</text><text class="logTime">{{ item.time }}</text></view><text class="logNote">{{ item.note }}</text><text class="logMeta">操作人：{{ item.operator }}</text></view></view><view v-else class="emptyState">暂无操作记录</view></view>
    </view>
  </AppPage>
</template>
<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { ASSET_OWNER_OPTIONS, findAssetByCode, repairAsset, returnAsset, scrapAsset, transferAsset } from '@/common/asset.js';
const PAGE_BG='linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const actionOptions=[{key:'return',title:'归还申请'},{key:'transfer',title:'变更归属'},{key:'repair',title:'报修申请'},{key:'scrap',title:'报废申请'}];
const repairTypes=['电池故障','屏幕损坏','通信异常','配件损坏','其他故障'];
const scrapTypes=['损坏无法修复','超期服役','丢失','技术淘汰'];
const assetCode=ref(''); const asset=ref(null); const activeAction=ref('return'); const returnNote=ref(''); const transferOwnerId=ref(''); const transferOwnerName=ref(''); const transferReason=ref(''); const repairType=ref(repairTypes[0]); const repairDesc=ref(''); const scrapType=ref(scrapTypes[0]); const scrapReason=ref('');
const ownerOptions = computed(() => ASSET_OWNER_OPTIONS.filter((item) => item.name !== asset.value?.ownerName));
function load(){ asset.value = assetCode.value ? findAssetByCode(assetCode.value) : null; }
function selectTransferOwner(item){ transferOwnerId.value=item.id; transferOwnerName.value=item.name; }
function submitReturn(){ const result=returnAsset(assetCode.value,returnNote.value); uni.showToast({title:result.message,icon:result.ok?'success':'none'}); if(result.ok){ returnNote.value=''; load(); } }
function submitTransfer(){ if(!transferOwnerName.value){ uni.showToast({title:'请选择新归属人',icon:'none'}); return; } const result=transferAsset(assetCode.value,{ ownerId:transferOwnerId.value, ownerName:transferOwnerName.value, reason:transferReason.value || `变更归属为 ${transferOwnerName.value}` }); uni.showToast({title:result.message,icon:result.ok?'success':'none'}); if(result.ok){ transferReason.value=''; load(); } }
function submitRepair(){ const result=repairAsset(assetCode.value,{ faultType:repairType.value, description:repairDesc.value || repairType.value }); uni.showToast({title:result.message,icon:result.ok?'success':'none'}); if(result.ok){ repairDesc.value=''; load(); } }
function submitScrap(){ const result=scrapAsset(assetCode.value,{ reasonType:scrapType.value, reason:scrapReason.value || scrapType.value }); uni.showToast({title:result.message,icon:result.ok?'success':'none'}); if(result.ok){ scrapReason.value=''; load(); } }
onLoad((query)=>{ assetCode.value=query.code || ''; load(); }); onShow(load);
</script>
<style lang="scss" scoped>
.assetSubPage{min-height:100vh;padding:0 24rpx 32rpx;box-sizing:border-box}.card{background:rgba(255,255,255,.94);border-radius:18rpx;box-shadow:0 8rpx 24rpx rgba(18,38,63,.08)}.summaryCard,.section{padding:18rpx;margin-top:14rpx}.summaryHead,.sectionHead,.logHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16rpx}.assetName,.sectionTitle,.logType{display:block;font-size:32rpx;color:#1b2b43;font-weight:700}.assetCode,.label,.logMeta,.logTime,.emptyState{display:block;margin-top:8rpx;font-size:24rpx;color:#7b8799;line-height:1.4}.statusBadge{padding:10rpx 16rpx;border-radius:999rpx;font-size:22rpx;font-weight:600}.status-未领用{background:#ecfdf3;color:#16a34a}.status-已领用,.status-借用中{background:#eef4ff;color:#2563eb}.status-维修中,.status-盘点异常{background:#fff4e5;color:#d97706}.status-报废{background:#f3f4f6;color:#6b7280}.infoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx;margin-top:16rpx}.infoItem,.logItem{padding:14rpx;border-radius:14rpx;background:#f7faff}.value,.logNote{display:block;margin-top:8rpx;font-size:26rpx;color:#24354d;font-weight:600;line-height:1.45}.actionGrid,.chipWrap,.logList{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:16rpx}.actionChip,.optionChip{padding:12rpx 18rpx;border-radius:999rpx;background:#f3f6fb;color:#66788f;font-size:22rpx}.actionChipActive,.optionChipActive{background:#edf4ff;color:#0f75ff}.formBlock{margin-top:16rpx}.fieldLabel{display:block;font-size:24rpx;color:#6f7d91;margin-bottom:12rpx}.textarea{width:100%;min-height:140rpx;margin-top:14rpx;padding:18rpx;border-radius:14rpx;background:#f7f9fc;font-size:24rpx;box-sizing:border-box}.primaryBtn{margin-top:16rpx;height:76rpx;border-radius:14rpx;background:#0f75ff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26rpx;font-weight:600}.dangerBtn{background:#ef4444}.emptyState{text-align:center;padding:18rpx 0 6rpx}
</style>
