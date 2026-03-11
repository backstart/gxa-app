<template>
  <AppPage :bg="PAGE_BG">
    <view class="assetSubPage pageBg">
      <view v-if="task" class="card summaryCard">
        <view class="summaryHead">
          <view>
            <text class="sectionTitle">盘点执行</text>
            <text class="sectionMeta">{{ task.batchNo }} · {{ task.scopeLabel }}</text>
          </view>
          <text class="statusBadge">进行中</text>
        </view>
        <view class="summaryMetaRow">
          <text class="summaryMeta">盘点时间：{{ task.startTime }}</text>
          <text class="summaryMeta">责任人：{{ task.operator }}</text>
        </view>
        <view class="summaryActions">
          <view class="summaryBtn summaryBtnGhost" @tap="finishTask">结束盘点</view>
          <view class="summaryBtn" @tap="finishTask">生成报告</view>
        </view>
      </view>

      <view class="card section">
        <view class="sectionHead">
          <text class="sectionTitle">盘点操作区</text>
        </view>
        <view class="actionBtns">
          <view class="actionBtn primary" @tap="scanInventory">扫码盘点</view>
          <view class="actionBtn ghost" @tap="fillNextUnchecked">取未盘点资产</view>
        </view>
        <view class="manualRow manualCard">
          <input v-model.trim="manualCode" class="manualInput" placeholder="输入资产编号盘点，如 ASSET-000105" />
          <view class="manualBtn" @tap="resolveManualCode">查询</view>
        </view>
      </view>

      <view v-if="currentScanAsset" class="card verifyCard">
        <view class="sectionHead">
          <text class="sectionTitle">资产核验</text>
          <text class="sectionMeta">{{ currentScanAsset.code }}</text>
        </view>
        <view class="taskMetaGrid">
          <view class="metaItem"><text class="metaLabel">资产名称</text><text class="metaValue">{{ currentScanAsset.name }}</text></view>
          <view class="metaItem"><text class="metaLabel">规格型号</text><text class="metaValue">{{ currentScanAsset.model }}</text></view>
          <view class="metaItem"><text class="metaLabel">资产类别</text><text class="metaValue">{{ currentScanAsset.category }}</text></view>
          <view class="metaItem"><text class="metaLabel">所属部门</text><text class="metaValue">{{ currentScanAsset.department }}</text></view>
          <view class="metaItem"><text class="metaLabel">账面位置</text><text class="metaValue">{{ currentScanAsset.location }}</text></view>
          <view class="metaItem"><text class="metaLabel">责任人</text><text class="metaValue">{{ currentScanAsset.ownerName || '暂无' }}</text></view>
        </view>

        <view class="formBlock">
          <input v-model.trim="verifyForm.actualLocation" class="fieldInput" placeholder="现场实际位置" />
          <input v-model.trim="verifyForm.actualOwnerName" class="fieldInput" placeholder="现场责任人" />
          <text class="fieldGroupTitle compactTop">标签状态</text>
          <view class="chipWrap compactTop">
            <view v-for="item in labelOptions" :key="item" :class="['optionChip', verifyForm.labelStatus === item ? 'optionChipActive' : '']" @tap="verifyForm.labelStatus = item">
              {{ item }}
            </view>
          </view>
          <text class="fieldGroupTitle compactTop">实物状态</text>
          <view class="chipWrap compactTop">
            <view v-for="item in physicalOptions" :key="item" :class="['optionChip', verifyForm.physicalStatus === item ? 'optionChipActive' : '']" @tap="verifyForm.physicalStatus = item">
              {{ item }}
            </view>
          </view>
          <text class="fieldGroupTitle compactTop">异常类型</text>
          <view class="chipGrid compactTop">
            <view v-for="item in exceptionOptions" :key="item" :class="['optionChip', verifyForm.exceptionType === item ? 'optionChipActive' : '']" @tap="verifyForm.exceptionType = item">
              {{ item }}
            </view>
          </view>
          <textarea v-model.trim="verifyForm.note" class="textarea compactTop" placeholder="填写核验说明" />
          <view class="primaryBtn compactTop" @tap="submitVerify">确认盘点</view>
        </view>
      </view>

      <view v-if="surplusMode" class="card verifyCard">
        <view class="sectionHead">
          <text class="sectionTitle">异常补录</text>
          <text class="sectionMeta">盘盈登记</text>
        </view>
        <view class="formBlock noTop">
          <input v-model.trim="surplusForm.code" class="fieldInput" placeholder="资产编号" />
          <input v-model.trim="surplusForm.name" class="fieldInput" placeholder="资产名称" />
          <input v-model.trim="surplusForm.model" class="fieldInput" placeholder="规格型号" />
          <input v-model.trim="surplusForm.actualLocation" class="fieldInput" placeholder="实际位置" />
          <input v-model.trim="surplusForm.actualOwnerName" class="fieldInput" placeholder="现场责任人" />
          <view class="chipWrap compactTop">
            <view v-for="item in categoryOptions" :key="item" :class="['optionChip', surplusForm.category === item ? 'optionChipActive' : '']" @tap="surplusForm.category = item">
              {{ item }}
            </view>
          </view>
          <textarea v-model.trim="surplusForm.note" class="textarea compactTop" placeholder="填写异常说明" />
          <view class="primaryBtn compactTop" @tap="submitSurplus">登记异常</view>
        </view>
      </view>

      <view class="statsGrid">
        <view class="statCard card"><text class="statLabel">应盘点</text><text class="statValue">{{ liveSummary.expectedCount }}</text></view>
        <view class="statCard card"><text class="statLabel">已盘点</text><text class="statValue">{{ liveSummary.countedCount }}</text></view>
        <view class="statCard card"><text class="statLabel">未盘点</text><text class="statValue">{{ liveSummary.uncountedCount }}</text></view>
        <view class="statCard card warn"><text class="statLabel">异常</text><text class="statValue">{{ liveSummary.abnormalCount }}</text></view>
      </view>

      <view class="card section">
        <view class="tableTabs">
          <view :class="['tableTab', listMode === 'counted' ? 'tableTabActive' : '']" @tap="listMode = 'counted'">已盘点</view>
          <view :class="['tableTab', listMode === 'uncounted' ? 'tableTabActive' : '']" @tap="listMode = 'uncounted'">未盘点</view>
          <view :class="['tableTab', listMode === 'abnormal' ? 'tableTabActive' : '']" @tap="listMode = 'abnormal'">异常</view>
        </view>

        <view v-if="listMode === 'counted'" class="recordList">
          <view v-if="countedRecords.length" v-for="item in countedRecords" :key="`${item.code}-${item.scanTime}`" class="recordItem">
            <view class="recordHead">
              <text class="recordName">{{ item.name }}</text>
              <text :class="['recordTag', item.result === '异常' ? 'recordTagWarn' : '']">{{ item.result }}</text>
            </view>
            <text class="recordMeta">{{ item.code }} · {{ item.model }}</text>
            <text class="recordMeta">存放地点：{{ item.actualLocation || item.expectedLocation }}</text>
            <text class="recordMeta">当前责任人：{{ item.actualOwnerName || item.expectedOwnerName }}</text>
            <text class="recordMeta">盘点结果：{{ item.exceptionType }}</text>
          </view>
          <view v-else class="emptyState">暂无已盘点资产</view>
        </view>

        <view v-else-if="listMode === 'uncounted'" class="recordList">
          <view v-if="uncountedAssets.length" v-for="item in uncountedAssets" :key="item.code" class="recordItem light">
            <text class="recordName">{{ item.name }}</text>
            <text class="recordMeta">{{ item.code }} · {{ item.model }}</text>
            <text class="recordMeta">应在位置：{{ item.location }}</text>
            <text class="recordMeta">应归属人：{{ item.ownerName || '暂无' }} · 使用状态：{{ item.status }}</text>
          </view>
          <view v-else class="emptyState">当前任务已无未盘点资产</view>
        </view>

        <view v-else class="recordList">
          <view v-if="abnormalRecords.length" v-for="item in abnormalRecords" :key="`${item.code}-${item.exceptionType}`" class="recordItem">
            <view class="recordHead">
              <text class="recordName">{{ item.name }}</text>
              <text class="recordTag recordTagWarn">{{ item.exceptionType }}</text>
            </view>
            <text class="recordMeta">{{ item.code }} · 当前核验结果：{{ item.result }}</text>
            <text class="recordMeta">异常备注：{{ item.note || '未填写' }}</text>
          </view>
          <view v-else class="emptyState">当前暂无异常资产</view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import {
  ASSET_CATEGORY_OPTIONS,
  INVENTORY_EXCEPTION_OPTIONS,
  LABEL_STATUS_OPTIONS,
  PHYSICAL_STATUS_OPTIONS,
  ensureActiveInventoryTask,
  findAssetByCode,
  finishInventoryTask,
  getActiveInventoryTask,
  getAssetItems,
  getInventoryTaskById,
  recordInventoryCheck,
  recordInventorySurplus,
} from '@/common/asset.js';

const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';
const categoryOptions = ASSET_CATEGORY_OPTIONS;
const labelOptions = LABEL_STATUS_OPTIONS;
const physicalOptions = PHYSICAL_STATUS_OPTIONS;
const exceptionOptions = INVENTORY_EXCEPTION_OPTIONS;
const taskId = ref('');
const task = ref(null);
const assets = ref([]);
const listMode = ref('counted');
const manualCode = ref('');
const currentScanAsset = ref(null);
const surplusMode = ref(false);
const verifyForm = reactive({
  actualLocation: '',
  actualOwnerName: '',
  labelStatus: '标签正常',
  physicalStatus: '正常',
  exceptionType: '正常',
  note: '',
});
const surplusForm = reactive({
  code: '',
  name: '',
  model: '',
  category: ASSET_CATEGORY_OPTIONS[0],
  actualLocation: '',
  actualOwnerName: '',
  note: '',
});

const expectedAssets = computed(() => {
  const map = new Map(assets.value.map((item) => [item.code, item]));
  return (task.value?.expectedCodes || []).map((code) => map.get(code)).filter(Boolean);
});
const countedRecords = computed(() => task.value?.scannedItems || []);
const countedExpectedCodes = computed(() => new Set(countedRecords.value.filter((item) => (task.value?.expectedCodes || []).includes(item.code)).map((item) => item.code)));
const uncountedAssets = computed(() => expectedAssets.value.filter((item) => !countedExpectedCodes.value.has(item.code)));
const abnormalRecords = computed(() => countedRecords.value.filter((item) => item.result === '异常'));
const liveSummary = computed(() => ({
  expectedCount: expectedAssets.value.length,
  countedCount: countedExpectedCodes.value.size,
  uncountedCount: uncountedAssets.value.length,
  abnormalCount: abnormalRecords.value.length + uncountedAssets.value.length,
}));

function load() {
  assets.value = getAssetItems();
  task.value = taskId.value ? getInventoryTaskById(taskId.value) : getActiveInventoryTask() || ensureActiveInventoryTask();
  if (task.value && !taskId.value) taskId.value = task.value.id;
}

function resetVerifyForm(asset, extra = {}) {
  verifyForm.actualLocation = extra.actualLocation || asset.location;
  verifyForm.actualOwnerName = extra.actualOwnerName || asset.ownerName || '';
  verifyForm.labelStatus = asset.labelStatus || '标签正常';
  verifyForm.physicalStatus = asset.physicalStatus || '正常';
  verifyForm.exceptionType = extra.exceptionType || '正常';
  verifyForm.note = extra.note || '';
}

function resetSurplusForm(code = '') {
  surplusForm.code = code;
  surplusForm.name = '';
  surplusForm.model = '';
  surplusForm.category = ASSET_CATEGORY_OPTIONS[0];
  surplusForm.actualLocation = '';
  surplusForm.actualOwnerName = '';
  surplusForm.note = '';
}

function selectAssetForVerify(asset, extra = {}) {
  currentScanAsset.value = asset;
  surplusMode.value = false;
  resetVerifyForm(asset, extra);
}

function openSurplusMode(code) {
  currentScanAsset.value = null;
  surplusMode.value = true;
  resetSurplusForm(code);
}

function resolveCode(code) {
  const asset = findAssetByCode(code);
  if (!asset) {
    openSurplusMode(code);
    uni.showToast({ title: '未找到该资产，可登记异常', icon: 'none' });
    return;
  }
  const exists = countedRecords.value.some((item) => item.code === code);
  if (exists) {
    uni.showToast({ title: '该资产已盘点', icon: 'none' });
    return;
  }
  const inScope = (task.value?.expectedCodes || []).includes(code);
  if (!inScope) {
    uni.showModal({
      title: '不在盘点范围',
      content: '该资产不在本次盘点范围，是否按异常登记？',
      success: (res) => {
        if (res.confirm) {
          selectAssetForVerify(asset, { exceptionType: '其他异常', note: '该资产不在本次盘点范围' });
        }
      },
    });
    return;
  }
  selectAssetForVerify(asset);
}

function resolveManualCode() {
  if (!manualCode.value) {
    uni.showToast({ title: '请输入资产编号', icon: 'none' });
    return;
  }
  resolveCode(manualCode.value);
}

function fillNextUnchecked() {
  if (!uncountedAssets.value.length) {
    uni.showToast({ title: '当前无未盘点资产', icon: 'none' });
    return;
  }
  manualCode.value = uncountedAssets.value[0].code;
  resolveCode(manualCode.value);
}

function scanInventory() {
  uni.scanCode({
    success: (res) => {
      manualCode.value = res.result || '';
      resolveManualCode();
    },
    fail: () => {
      fillNextUnchecked();
      uni.showToast({ title: '当前环境不可扫码，已切换模拟盘点', icon: 'none' });
    },
  });
}

function submitVerify() {
  if (!task.value || !currentScanAsset.value) return;
  const result = recordInventoryCheck(task.value.id, currentScanAsset.value.code, { ...verifyForm });
  uni.showToast({ title: result.ok ? '确认盘点成功' : result.message, icon: result.ok ? 'success' : 'none' });
  if (result.ok) {
    manualCode.value = '';
    currentScanAsset.value = null;
    load();
  }
}

function submitSurplus() {
  if (!task.value) return;
  const result = recordInventorySurplus(task.value.id, { ...surplusForm, exceptionType: '盘盈' });
  uni.showToast({ title: result.ok ? '异常登记成功' : result.message, icon: result.ok ? 'success' : 'none' });
  if (result.ok) {
    manualCode.value = '';
    surplusMode.value = false;
    resetSurplusForm();
    load();
    listMode.value = 'abnormal';
  }
}

function finishTask() {
  if (!task.value) return;
  const result = finishInventoryTask(task.value.id);
  uni.showToast({ title: result.ok ? '盘点报告已生成' : result.message, icon: result.ok ? 'success' : 'none' });
  if (result.ok) {
    uni.redirectTo({ url: `/pages/assets/reportDetail?id=${result.report.id}` });
  }
}

onLoad((query) => {
  taskId.value = query.taskId || '';
});

onShow(load);
</script>

<style lang="scss" scoped>
.assetSubPage {
  min-height: 100vh;
  padding: 0 24rpx 32rpx;
  box-sizing: border-box;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(18, 38, 63, 0.08);
}

.summaryCard,
.section,
.verifyCard {
  padding: 18rpx;
  margin-top: 14rpx;
}

.sectionTitle,
.recordName {
  display: block;
  font-size: 32rpx;
  color: #1b2b43;
  font-weight: 700;
}

.sectionHead,
.summaryHead,
.recordHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.sectionMeta,
.summaryMeta,
.metaLabel,
.recordMeta,
.emptyState,
.statLabel {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7b8799;
  line-height: 1.45;
}

.statusBadge,
.recordTag {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #0f75ff;
  font-size: 22rpx;
  font-weight: 600;
}

.summaryMetaRow {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 16rpx;
}

.summaryActions,
.actionBtns,
.manualRow,
.tableTabs,
.chipWrap {
  display: flex;
  gap: 12rpx;
}

.actionBtns {
  margin-top: 18rpx;
  gap: 16rpx;
}

.manualRow {
  align-items: center;
  margin-top: 18rpx;
  gap: 16rpx;
}

.manualCard {
  padding: 14rpx 16rpx;
  border-radius: 18rpx;
  background: #f5f9ff;
}

.summaryActions,
.compactTop {
  margin-top: 16rpx;
}

.summaryBtn,
.actionBtn,
.manualBtn,
.primaryBtn {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 600;
}

.summaryBtn,
.primaryBtn,
.primary {
  background: #0f75ff;
  color: #fff;
}

.summaryBtnGhost,
.ghost {
  background: #edf4ff;
  color: #0f75ff;
}

.manualInput,
.fieldInput,
.textarea {
  width: 100%;
  border-radius: 16rpx;
  background: #f7f9fc;
  font-size: 24rpx;
  box-sizing: border-box;
}

.manualInput,
.fieldInput {
  height: 80rpx;
  padding: 0 20rpx;
}

.manualInput {
  flex: 1;
  background: #ffffff;
}

.manualBtn {
  width: 152rpx;
  flex: 0 0 152rpx;
  background: #edf4ff;
  color: #0f75ff;
}

.taskMetaGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 16rpx;
}

.metaItem,
.recordItem,
.statCard {
  padding: 14rpx;
  border-radius: 14rpx;
  background: #f7faff;
}

.metaValue,
.statValue {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #24354d;
  font-weight: 600;
}

.textarea {
  min-height: 140rpx;
  padding: 18rpx;
}

.formBlock {
  margin-top: 18rpx;
}

.noTop {
  margin-top: 0;
}

.fieldGroupTitle {
  display: block;
  font-size: 24rpx;
  color: #6f7d91;
  font-weight: 600;
}

.fieldInput + .fieldInput {
  margin-top: 12rpx;
}

.optionChip {
  min-height: 72rpx;
  padding: 12rpx 18rpx;
  border-radius: 18rpx;
  background: #f3f6fb;
  color: #66788f;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.3;
  white-space: nowrap;
  box-sizing: border-box;
}

.optionChipActive {
  background: #edf4ff;
  color: #0f75ff;
}

.chipGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.chipGrid .optionChip {
  white-space: normal;
  min-height: 84rpx;
  padding: 14rpx 12rpx;
  word-break: keep-all;
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 14rpx;
}

.statValue {
  font-size: 40rpx;
  color: #0f75ff;
}

.warn .statValue,
.recordTagWarn {
  color: #ef4444;
}

.tableTab {
  flex: 1;
  height: 72rpx;
  border-radius: 14rpx;
  background: #f3f6fb;
  color: #7b8799;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.tableTabActive {
  background: #edf4ff;
  color: #0f75ff;
  font-weight: 600;
}

.recordList {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 16rpx;
}

.light {
  background: #fbfcfe;
}

.emptyState {
  text-align: center;
  padding: 18rpx 0 6rpx;
}
</style>
