<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg">
      <view class="card section"><text class="sectionTitle">盘点范围</text><view class="chipWrap compactTop"><view v-for="item in scopeTypes" :key="item.value" :class="['optionChip', form.scopeType === item.value ? 'optionChipActive' : '']" @tap="form.scopeType = item.value">{{ item.label }}</view></view><template v-if="form.scopeType === 'DEPARTMENT'"><view class="chipWrap compactTop"><view v-for="item in departmentOptions" :key="item" :class="['optionChip', form.department === item ? 'optionChipActive' : '']" @tap="form.department = item">{{ item }}</view></view></template><template v-else-if="form.scopeType === 'CATEGORY'"><view class="chipWrap compactTop"><view v-for="item in categoryOptions" :key="item" :class="['optionChip', form.category === item ? 'optionChipActive' : '']" @tap="form.category = item">{{ item }}</view></view></template><template v-else-if="form.scopeType === 'LOCATION'"><view class="chipWrap compactTop"><view v-for="item in locationOptions" :key="item" :class="['optionChip', form.location === item ? 'optionChipActive' : '']" @tap="form.location = item">{{ item }}</view></view></template></view>
      <view class="card section"><text class="sectionTitle">盘点责任人</text><view class="chipWrap compactTop"><view v-for="item in ownerOptions" :key="item.id" :class="['optionChip', form.operator === item.name ? 'optionChipActive' : '']" @tap="selectOwner(item)">{{ item.name }}</view></view></view>
      <view class="card section"><text class="sectionTitle">任务备注</text><textarea v-model.trim="form.note" class="textarea compactTop" placeholder="填写本次盘点说明，可选" /></view>
      <view class="primaryBtn" @tap="submit">确认创建</view>
    </view>
  </AppPage>
</template>
<script setup>
import { reactive } from 'vue';
import AppPage from '@/components/app/AppPage.vue';
import { ASSET_CATEGORY_OPTIONS, ASSET_OWNER_OPTIONS, createInventoryTask, getAssetItems, getCurrentAssetUser } from '@/common/asset.js';
const PAGE_BG='linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const currentUser=getCurrentAssetUser(); const assets=getAssetItems();
const scopeTypes=[{value:'ALL',label:'全部资产'},{value:'DEPARTMENT',label:'按部门'},{value:'CATEGORY',label:'按类别'},{value:'LOCATION',label:'按存放区域'}];
const categoryOptions=ASSET_CATEGORY_OPTIONS; const ownerOptions=ASSET_OWNER_OPTIONS; const departmentOptions=[...new Set(assets.map((item)=>item.department))]; const locationOptions=[...new Set(assets.map((item)=>item.location))];
const form=reactive({ scopeType:'ALL', department:currentUser.dept, category:ASSET_CATEGORY_OPTIONS[0], location:locationOptions[0] || '', operator:currentUser.name, ownerId:currentUser.id, note:'' });
function selectOwner(item){ form.operator=item.name; form.ownerId=item.id; form.department=item.dept || form.department; }
function submit(){ const payload={ scopeType:form.scopeType, department:form.scopeType==='DEPARTMENT' ? form.department : currentUser.dept, category:form.scopeType==='CATEGORY' ? form.category : '', location:form.scopeType==='LOCATION' ? form.location : '', operator:form.operator, note:form.note, scopeLabel: form.scopeType==='ALL' ? '全部资产' : form.scopeType==='DEPARTMENT' ? `${form.department}全部资产` : form.scopeType==='CATEGORY' ? `${form.category}资产` : form.location }; const task=createInventoryTask(payload); uni.showToast({title:'盘点任务已创建',icon:'success'}); uni.redirectTo({ url:`/pages/assets/inventory/run?taskId=${task.id}` }); }
</script>
<style lang="scss" scoped>
.assetSubPage{min-height:100vh;padding:0 24rpx 32rpx;box-sizing:border-box}.card{background:rgba(255,255,255,.94);border-radius:18rpx;box-shadow:0 8rpx 24rpx rgba(18,38,63,.08)}.section{padding:18rpx;margin-top:14rpx}.sectionTitle{display:block;font-size:32rpx;color:#1b2b43;font-weight:700}.chipWrap{display:flex;flex-wrap:wrap;gap:12rpx}.compactTop{margin-top:16rpx}.optionChip{padding:12rpx 18rpx;border-radius:999rpx;background:#f3f6fb;color:#66788f;font-size:22rpx}.optionChipActive{background:#edf4ff;color:#0f75ff}.textarea{width:100%;min-height:140rpx;padding:18rpx;border-radius:14rpx;background:#f7f9fc;font-size:24rpx;box-sizing:border-box}.primaryBtn{margin-top:18rpx;height:76rpx;border-radius:14rpx;background:#0f75ff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26rpx;font-weight:600}
</style>
