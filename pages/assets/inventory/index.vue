<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg">
      <view v-if="activeTask" class="card section"><view class="sectionHead"><text class="sectionTitle">当前进行中的盘点任务</text><text class="statusBadge">进行中</text></view><view class="taskMetaGrid"><view class="metaItem"><text class="metaLabel">任务编号</text><text class="metaValue">{{ activeTask.batchNo }}</text></view><view class="metaItem"><text class="metaLabel">盘点时间</text><text class="metaValue">{{ activeTask.startTime }}</text></view><view class="metaItem"><text class="metaLabel">盘点范围</text><text class="metaValue">{{ activeTask.scopeLabel }}</text></view><view class="metaItem"><text class="metaLabel">责任人</text><text class="metaValue">{{ activeTask.operator }}</text></view></view><view class="progressRow"><text class="progressLabel">当前进度</text><text class="progressValue">{{ taskProgress.done }}/{{ taskProgress.total }}</text></view><view class="primaryBtn compactTop" @tap="continueTask">继续盘点</view></view>
      <view class="card section createCard" @tap="go('/pages/assets/inventory/create')"><view><text class="sectionTitle">新建盘点任务</text><text class="entryMeta">按范围配置任务后进入专门执行页</text></view><text class="entryArrow">›</text></view>
      <view class="card section"><view class="sectionHead"><text class="sectionTitle">最近盘点报告</text></view><view v-if="reports.length" class="recordList"><view v-for="item in reports" :key="item.id" class="recordItem"><view class="recordHead"><text class="recordName">{{ item.batchNo }}</text><text class="recordAction" @tap.stop="go(`/pages/assets/reportDetail?id=${item.id}`)">查看报告</text></view><text class="recordMeta">{{ item.finishTime }} · {{ item.scopeLabel }}</text><text class="recordMeta">已盘点 {{ item.summary.countedCount }} 件 · 异常 {{ item.summary.abnormalCount }} 件</text></view></view><view v-else class="emptyState">暂无盘点报告</view></view>
    </view>
  </AppPage>
</template>
<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { ensureActiveInventoryTask, getActiveInventoryTask, getInventoryReports } from '@/common/asset.js';
const PAGE_BG='linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const activeTask=ref(null); const reports=ref([]);
const taskProgress=computed(()=>{ if(!activeTask.value) return {done:0,total:0}; const expected=new Set(activeTask.value.expectedCodes||[]); const done=new Set((activeTask.value.scannedItems||[]).filter((item)=>expected.has(item.code)).map((item)=>item.code)).size; return {done,total:expected.size}; });
function go(url){ uni.navigateTo({ url }); }
function continueTask(){ const task=activeTask.value || ensureActiveInventoryTask(); uni.navigateTo({ url:`/pages/assets/inventory/run?taskId=${task.id}` }); }
function load(){ activeTask.value=getActiveInventoryTask(); reports.value=getInventoryReports().slice(0,5); }
onShow(load);
</script>
<style lang="scss" scoped>
.assetSubPage{min-height:100vh;padding:0 24rpx 32rpx;box-sizing:border-box}.card{background:rgba(255,255,255,.94);border-radius:18rpx;box-shadow:0 8rpx 24rpx rgba(18,38,63,.08)}.section{padding:18rpx;margin-top:14rpx}.sectionTitle,.recordName{display:block;font-size:32rpx;color:#1b2b43;font-weight:700}.sectionHead,.recordHead,.createCard{display:flex;align-items:center;justify-content:space-between;gap:16rpx}.statusBadge{padding:10rpx 16rpx;border-radius:999rpx;background:#eef4ff;color:#0f75ff;font-size:22rpx;font-weight:600}.taskMetaGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx;margin-top:16rpx}.metaItem,.recordItem{padding:14rpx;border-radius:14rpx;background:#f7faff}.metaLabel,.recordMeta,.entryMeta,.emptyState,.progressLabel{display:block;margin-top:8rpx;font-size:24rpx;color:#7b8799;line-height:1.45}.metaValue,.progressValue{display:block;margin-top:8rpx;font-size:26rpx;color:#24354d;font-weight:600}.progressRow{display:flex;align-items:center;justify-content:space-between;margin-top:16rpx;padding-top:14rpx}.primaryBtn{height:76rpx;border-radius:14rpx;background:#0f75ff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26rpx;font-weight:600}.compactTop{margin-top:16rpx}.entryArrow{font-size:40rpx;color:#0f75ff}.recordList{display:flex;flex-direction:column;gap:14rpx;margin-top:16rpx}.recordAction{font-size:24rpx;color:#0f75ff}.emptyState{text-align:center;padding:16rpx 0 4rpx}
</style>
