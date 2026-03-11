<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg">
      <view v-if="report" class="summaryTop card">
        <view class="headTop"><view><text class="sectionTitle">盘点报告</text></view><text class="statusBadge">已完成</text></view>
        <text class="scopeText">{{ report.batchNo }} · {{ report.finishTime }}</text>
        <text class="scopeText">盘点范围：{{ report.scopeLabel }}</text>
        <text class="scopeText">盘点责任人：{{ report.operator }}</text>
      </view>
      <view v-if="report" class="summaryGrid">
        <view class="summaryCard card"><text class="summaryLabel">应盘点</text><text class="summaryValue">{{ report.summary.expectedCount }}</text></view>
        <view class="summaryCard card"><text class="summaryLabel">已盘点</text><text class="summaryValue">{{ report.summary.countedCount }}</text></view>
        <view class="summaryCard card"><text class="summaryLabel">未盘点</text><text class="summaryValue">{{ report.summary.uncountedCount }}</text></view>
        <view class="summaryCard card warn"><text class="summaryLabel">异常</text><text class="summaryValue">{{ report.summary.abnormalCount }}</text></view>
      </view>
      <view v-if="report" class="card section"><text class="sectionTitle">差异摘要</text><view class="detailGrid"><view class="detailItem"><text class="label">盘盈数量</text><text class="value">{{ report.summary.surplusCount }}</text></view><view class="detailItem"><text class="label">盘亏数量</text><text class="value">{{ report.summary.shortageCount }}</text></view><view class="detailItem"><text class="label">位置异常</text><text class="value">{{ report.summary.locationMismatchCount }}</text></view><view class="detailItem"><text class="label">责任人异常</text><text class="value">{{ report.summary.ownerMismatchCount }}</text></view><view class="detailItem"><text class="label">状态异常</text><text class="value">{{ report.summary.statusMismatchCount }}</text></view></view></view>
      <view v-if="report" class="card section"><text class="sectionTitle">异常明细</text><view v-if="report.anomalyItems.length" class="list"><view v-for="item in report.anomalyItems" :key="`${item.code}-${item.exceptionType}`" class="recordItem"><view class="recordHead"><text class="recordName">{{ item.name }}</text><text class="recordTag">{{ item.exceptionType }}</text></view><text class="recordMeta">编号：{{ item.code }} · 规格：{{ item.model }}</text><text class="recordMeta">地点：{{ item.actualLocation || item.location }}</text><text class="recordMeta">责任人：{{ item.actualOwnerName || item.ownerName }}</text></view></view><view v-else class="emptyState">本次盘点未发现异常</view></view>
      <view v-if="report && report.missingItems.length" class="card section"><text class="sectionTitle">未盘点资产</text><view class="list"><view v-for="item in report.missingItems" :key="item.code" class="recordItem"><text class="recordName">{{ item.name }}</text><text class="recordMeta">编号：{{ item.code }} · 规格：{{ item.model }}</text><text class="recordMeta">应在位置：{{ item.location }}</text><text class="recordMeta">应归属人：{{ item.ownerName }}</text></view></view></view>
    </view>
  </AppPage>
</template>
<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { getInventoryReportById } from '@/common/asset.js';
const PAGE_BG='linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const reportId=ref(''); const report=ref(null); function load(){ report.value = reportId.value ? getInventoryReportById(reportId.value) : null; }
onLoad((query)=>{ reportId.value=query.id || ''; load(); }); onShow(load);
</script>
<style lang="scss" scoped>
.assetSubPage{min-height:100vh;padding:0 24rpx 32rpx;box-sizing:border-box}.card{background:rgba(255,255,255,.94);border-radius:18rpx;box-shadow:0 8rpx 24rpx rgba(18,38,63,.08)}.summaryTop,.section,.summaryCard{padding:18rpx;margin-top:14rpx}.headTop,.recordHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16rpx}.sectionTitle,.recordName{display:block;font-size:32rpx;color:#1b2b43;font-weight:700}.scopeText,.recordMeta,.emptyState,.label{display:block;margin-top:8rpx;font-size:24rpx;color:#7b8799}.statusBadge,.recordTag{padding:10rpx 16rpx;border-radius:999rpx;background:#edf4ff;color:#0f75ff;font-size:22rpx;font-weight:600}.summaryGrid,.detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx;margin-top:14rpx}.summaryLabel{display:block;font-size:24rpx;color:#6f7d91}.summaryValue,.value{display:block;margin-top:10rpx;font-size:42rpx;line-height:1;color:#0f75ff;font-weight:700}.warn .summaryValue{color:#ef4444}.detailItem,.recordItem{padding:16rpx;border-radius:14rpx;background:#f8fbff}.list{display:flex;flex-direction:column;gap:14rpx;margin-top:16rpx}.emptyState{text-align:center;padding:16rpx 0 4rpx}
</style>
