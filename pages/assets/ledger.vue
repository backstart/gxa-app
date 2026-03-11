<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg" @tap="handlePageTap">
      <view id="filterBarRef" class="filterBar card">
        <view :class="['filterItem', isDropdownActive('category') ? 'filterItemActive' : '']" @tap.stop="openDropdown('category')"><text class="filterLabel">类别</text><view class="filterValueWrap"><text class="filterValue">{{ category }}</text><text class="filterArrow">{{ isDropdownActive('category') ? '▲' : '▼' }}</text></view></view>
        <view :class="['filterItem', isDropdownActive('status') ? 'filterItemActive' : '']" @tap.stop="openDropdown('status')"><text class="filterLabel">状态</text><view class="filterValueWrap"><text class="filterValue">{{ status }}</text><text class="filterArrow">{{ isDropdownActive('status') ? '▲' : '▼' }}</text></view></view>
        <view :class="['filterItem', isDropdownActive('department') ? 'filterItemActive' : '']" @tap.stop="openDropdown('department')"><text class="filterLabel">部门</text><view class="filterValueWrap"><text class="filterValue">{{ department }}</text><text class="filterArrow">{{ isDropdownActive('department') ? '▲' : '▼' }}</text></view></view>
      </view>
      <view v-if="dropdown.visible" class="sheetLayer" :style="{ top: `${dropdownTop}px` }" @touchmove.stop.prevent>
        <view class="sheetPanel card" @tap.stop>
          <scroll-view class="panelBody" scroll-y><view class="panelOptionList"><view v-for="item in currentOptions" :key="item" :class="['panelOption', draftValue === item ? 'panelOptionActive' : '']" @tap.stop="draftValue = item">{{ item }}</view></view></scroll-view>
          <view class="panelActions"><view class="panelBtn panelBtnGhost" @tap.stop="resetCurrentFilter">重置</view><view class="panelBtn panelBtnPrimary" @tap.stop="confirmCurrentFilter">确定</view></view>
        </view>
        <view class="sheetMask" @tap="closeDropdown"></view>
      </view>
      <view class="card searchCard"><input v-model.trim="keyword" class="searchInput" placeholder="搜索资产编号 / 资产名称 / 责任人" /></view>
      <view class="card section"><view class="sectionHead"><text class="sectionTitle">资产列表</text><text class="sectionSub">共 {{ filteredAssets.length }} 件</text></view><view v-if="filteredAssets.length" class="assetList"><view v-for="item in filteredAssets" :key="item.code" class="assetItem" @tap="goDetail(item.code)"><view class="assetHead"><text class="assetName">{{ item.name }}</text><text :class="['assetStatus', `status-${item.status}`]">{{ item.status }}</text></view><text class="assetMeta">资产编号：{{ item.code }} · 类别：{{ item.category }}</text><text class="assetMeta">当前责任人：{{ item.ownerName || '暂无' }}</text><text class="assetMeta">存放地点：{{ item.location }}</text></view></view><view v-else class="emptyState">当前筛选条件下暂无资产</view></view>
    </view>
  </AppPage>
</template>
<script setup>
import { computed, getCurrentInstance, nextTick, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { ASSET_CATEGORY_OPTIONS, ASSET_STATUS_OPTIONS, getAssetItems, getAssetLedger, getCurrentAssetUser } from '@/common/asset.js';
const PAGE_BG='linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const currentUser=getCurrentAssetUser(); const assets=ref([]); const keyword=ref(''); const category=ref('全部类别'); const status=ref('全部状态'); const department=ref('全部部门'); const mineOnly=ref(false); const dropdownTop=ref(0); const draftValue=ref(''); const dropdown=ref({ visible:false, key:'' });
const categoryOptions=['全部类别', ...ASSET_CATEGORY_OPTIONS]; const statusOptions=['全部状态', ...ASSET_STATUS_OPTIONS];
const departmentOptions=computed(()=>['全部部门', ...new Set(assets.value.map((item)=>item.department))]);
const currentOptions=computed(()=> dropdown.value.key==='category' ? categoryOptions : dropdown.value.key==='status' ? statusOptions : dropdown.value.key==='department' ? departmentOptions.value : []);
const filteredAssets=computed(()=>{ const list=getAssetLedger({ category:category.value, status:status.value, department:department.value, keyword:keyword.value }); return mineOnly.value ? list.filter((item)=>item.ownerName===currentUser.name) : list; });
function isDropdownActive(key){ return dropdown.value.visible && dropdown.value.key===key; }
function handlePageTap(){ if(dropdown.value.visible) closeDropdown(); }
function closeDropdown(){ dropdown.value={ visible:false, key:'' }; }
function measureDropdownTop(){ const instance=getCurrentInstance(); const query=uni.createSelectorQuery().in(instance?.proxy); query.select('#filterBarRef').boundingClientRect((rect)=>{ dropdownTop.value = rect ? rect.bottom + 8 : 0; }).exec(); }
function openDropdown(key){ draftValue.value = key==='category' ? category.value : key==='status' ? status.value : department.value; dropdown.value={ visible:true, key }; nextTick(measureDropdownTop); }
function resetCurrentFilter(){ if(dropdown.value.key==='category') draftValue.value='全部类别'; if(dropdown.value.key==='status') draftValue.value='全部状态'; if(dropdown.value.key==='department') draftValue.value='全部部门'; }
function confirmCurrentFilter(){ if(dropdown.value.key==='category') category.value=draftValue.value; if(dropdown.value.key==='status') status.value=draftValue.value; if(dropdown.value.key==='department') department.value=draftValue.value; closeDropdown(); }
function goDetail(code){ uni.navigateTo({ url:`/pages/assets/detail?code=${code}` }); }
function load(){ assets.value=getAssetItems(); }
onLoad((query)=>{ mineOnly.value=query.mine==='1'; }); onShow(load);
</script>
<style lang="scss" scoped>
.assetSubPage{min-height:100vh;padding:0 24rpx 32rpx;box-sizing:border-box}.card{background:rgba(255,255,255,.94);border-radius:18rpx;box-shadow:0 8rpx 24rpx rgba(18,38,63,.08)}.filterBar,.sheetPanel,.searchCard,.section{padding:18rpx;margin-top:14rpx}.filterBar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12rpx}.filterItem{min-width:0;height:80rpx;border-radius:16rpx;background:#f7f9fc;padding:0 16rpx;display:flex;align-items:center;justify-content:space-between;gap:14rpx;border:2rpx solid transparent}.filterItemActive{background:#edf4ff;border-color:#d5e4ff}.filterLabel{flex-shrink:0;font-size:24rpx;color:#8a97a8}.filterValueWrap{min-width:0;display:flex;align-items:center;gap:8rpx}.filterValue{max-width:100%;font-size:26rpx;color:#24354d;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.filterArrow{color:#0f75ff;font-size:20rpx}.sheetLayer{position:fixed;left:0;right:0;bottom:0;z-index:80}.sheetMask{position:fixed;left:0;right:0;top:0;bottom:0;background:rgba(15,23,42,.18);z-index:0}.sheetPanel{position:relative;margin:0 24rpx;z-index:1}.panelBody{max-height:460rpx}.panelOptionList{display:flex;flex-wrap:wrap;gap:12rpx}.panelOption{padding:14rpx 20rpx;border-radius:999rpx;background:#f3f6fb;color:#66788f;font-size:22rpx}.panelOptionActive{background:#edf4ff;color:#0f75ff}.panelActions{display:flex;gap:12rpx;margin-top:18rpx}.panelBtn{flex:1;height:76rpx;border-radius:14rpx;display:flex;align-items:center;justify-content:center;font-size:26rpx;font-weight:600}.panelBtnGhost{background:#eef2f7;color:#5d6f88}.panelBtnPrimary{background:#0f75ff;color:#fff}.searchInput{height:76rpx;border-radius:14rpx;background:#f7f9fc;padding:0 20rpx;font-size:24rpx}.sectionHead,.assetHead{display:flex;align-items:center;justify-content:space-between;gap:16rpx}.sectionTitle,.assetName{font-size:30rpx;color:#1b2b43;font-weight:700}.sectionSub,.assetMeta,.emptyState{display:block;margin-top:8rpx;font-size:24rpx;color:#7b8799;line-height:1.45}.assetList{display:flex;flex-direction:column;gap:14rpx;margin-top:16rpx}.assetItem{padding:16rpx;border-radius:14rpx;background:#f8fbff}.assetStatus{font-size:24rpx;font-weight:600}.status-未领用{color:#16a34a}.status-已领用,.status-借用中{color:#2563eb}.status-维修中,.status-盘点异常{color:#d97706}.status-报废{color:#7b8799}.emptyState{text-align:center;padding:18rpx 0 6rpx}
</style>
