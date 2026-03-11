<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetPage pageBg">
      <view class="statsGrid">
        <view class="statCard card">
          <text class="statLabel">我的资产</text>
          <text class="statValue">{{ myAssets.length }}</text>
          <text class="statDesc">已登记到个人名下</text>
        </view>
        <view class="statCard card">
          <text class="statLabel">借用资产</text>
          <text class="statValue">{{ borrowedAssets.length }}</text>
          <text class="statDesc">当前使用中的设备</text>
        </view>
        <view class="statCard card">
          <text class="statLabel">部门资产</text>
          <text class="statValue">{{ departmentCount }}</text>
          <text class="statDesc">{{ currentUser.dept }}总量</text>
        </view>
      </view>

      <view class="section card">
        <view class="sectionHead">
          <text class="sectionTitle">快捷功能</text>
        </view>
        <view class="quickGrid">
          <view v-for="item in quickActions" :key="item.key" class="quickCard" @tap="go(item.url)">
            <view class="quickIcon">{{ item.icon }}</view>
            <text class="quickTitle">{{ item.title }}</text>
            <text class="quickDesc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="section card">
        <view class="sectionHead">
          <text class="sectionTitle">我的资产</text>
          <text class="sectionLink" @tap="go('/pages/assets/ledger?mine=1')">查看全部</text>
        </view>
        <view v-if="myAssets.length" class="assetList">
          <view v-for="item in myAssets" :key="item.code" class="assetItem" @tap="go(`/pages/assets/detail?code=${item.code}`)">
            <view class="assetMain">
              <text class="assetName">{{ item.name }}</text>
              <text class="assetStatus">{{ item.status }}</text>
            </view>
            <text class="assetMeta">编号：{{ item.code }}</text>
            <text class="assetMeta">类别：{{ item.category }} · 领用时间：{{ item.receiveTime || '未登记' }}</text>
          </view>
        </view>
        <view v-else class="emptyState">当前暂无个人名下资产</view>
      </view>

      <view class="section card">
        <view class="sectionHead">
          <text class="sectionTitle">最近资产操作</text>
        </view>
        <view v-if="recentLogs.length" class="logList">
          <view v-for="item in recentLogs" :key="item.id" class="logItem">
            <view class="logMain">
              <text class="logType">{{ item.type }}</text>
              <text class="logTime">{{ item.time }}</text>
            </view>
            <text class="logText">{{ item.name }}（{{ item.code }}）</text>
            <text class="logNote">{{ item.note }}</text>
          </view>
        </view>
        <view v-else class="emptyState">暂无资产操作记录</view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { getAssetLogs, getBorrowedAssets, getCurrentAssetUser, getDepartmentAssetCount, getMyAssets } from '@/common/asset.js';

const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const currentUser = getCurrentAssetUser();
const logs = ref([]);
const quickActions = [
  { key: 'scan', title: '扫码识别资产', desc: '扫标签即查归属', icon: 'QR', url: '/pages/assets/scan' },
  { key: 'claim', title: '申领资产', desc: '扫码、列表、编号申领', icon: '领', url: '/pages/assets/claim' },
  { key: 'inventory', title: '资产盘点', desc: '盘点任务与异常核验', icon: '盘', url: '/pages/assets/inventory/index' },
  { key: 'ledger', title: '资产台账', desc: '按状态与类别查询', icon: '账', url: '/pages/assets/ledger' },
];

const myAssets = computed(() => getMyAssets(currentUser.name));
const borrowedAssets = computed(() => getBorrowedAssets(currentUser.name));
const departmentCount = computed(() => getDepartmentAssetCount(currentUser.dept));
const recentLogs = computed(() => logs.value.slice(0, 5));

function go(url) {
  uni.navigateTo({ url });
}

function load() {
  logs.value = getAssetLogs();
}

onShow(load);
</script>

<style lang="scss" scoped>
.assetPage { min-height: 100vh; padding: 0 24rpx 32rpx; box-sizing: border-box; }
.card { background: rgba(255,255,255,.94); border-radius: 18rpx; box-shadow: 0 8rpx 24rpx rgba(18,38,63,.08); }
.statsGrid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14rpx; margin-top:14rpx; }
.statCard { padding:18rpx 14rpx; }
.statLabel { display:block; font-size:24rpx; color:#6f7d91; }
.statValue { display:block; margin-top:10rpx; font-size:44rpx; line-height:1; color:#0f75ff; font-weight:700; }
.statDesc { display:block; margin-top:10rpx; font-size:22rpx; color:#97a4b7; line-height:1.35; }
.section { padding:18rpx; margin-top:14rpx; }
.sectionHead,.assetMain,.logMain { display:flex; align-items:center; justify-content:space-between; gap:16rpx; }
.sectionTitle { font-size:30rpx; color:#1b2b43; font-weight:700; }
.sectionLink { font-size:24rpx; color:#0f75ff; }
.quickGrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14rpx; }
.quickCard { background:linear-gradient(180deg,#fafdff 0%,#fff 100%); border:2rpx solid #dbe7ff; border-radius:16rpx; padding:18rpx 16rpx; }
.quickIcon { width:60rpx; height:60rpx; border-radius:16rpx; background:#edf4ff; color:#0f75ff; display:flex; align-items:center; justify-content:center; font-size:26rpx; font-weight:700; }
.quickTitle { display:block; margin-top:12rpx; font-size:28rpx; color:#24354d; font-weight:600; }
.quickDesc,.assetMeta,.logTime,.logText,.logNote,.emptyState { display:block; margin-top:8rpx; font-size:24rpx; color:#7b8799; line-height:1.45; }
.assetList,.logList { display:flex; flex-direction:column; gap:14rpx; margin-top:16rpx; }
.assetItem,.logItem { padding:16rpx; border-radius:14rpx; background:#f8fbff; }
.assetName,.logType { font-size:28rpx; color:#24354d; font-weight:600; }
.assetStatus { font-size:24rpx; color:#0f75ff; font-weight:600; }
.emptyState { text-align:center; padding:18rpx 0 6rpx; }
</style>
