<template>
  <AppPage>
    <view class="visit-session pageBg">
      <!-- 模式提示：明确当前是“临时走访”还是“对象走访” -->
      <view class="card mode-card">
        <view class="mode-row">
          <text class="mode-title">{{ modeTitle }}</text>
          <text class="mode-sub">{{ modeSubTitle }}</text>
        </view>
      </view>

      <!-- 现场基础信息：开始时间、时长、定位 -->
      <view class="card info-card">
        <view class="section-title">现场信息</view>
        <view class="kv-row">
          <text class="k">开始时间</text>
          <text class="v">{{ form.startTime }}</text>
        </view>
        <view class="kv-row">
          <text class="k">已用时长</text>
          <text class="v">{{ durationText }}</text>
        </view>
        <view class="kv-row">
          <text class="k">当前位置</text>
          <text class="v ellipsis">{{ form.location.address || '未定位' }}</text>
        </view>
        <view class="ops-row">
          <text class="link-blue" @tap="refreshLocation">刷新定位</text>
        </view>
      </view>

      <!-- 快速记录：尽量少字段，适合现场快速完成 -->
      <view class="card form-card">
        <view class="section-title">快速记录</view>

        <view class="field-block">
          <text class="label">走访类型</text>
          <view class="chip-row">
            <view
              v-for="item in visitTypeOptions"
              :key="item"
              :class="['chip', form.visitType === item ? 'active' : '']"
              @tap="form.visitType = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="field-block">
          <text class="label">走访结果</text>
          <view class="chip-row">
            <view
              v-for="item in resultOptions"
              :key="item"
              :class="['chip', form.result === item ? 'active' : '']"
              @tap="form.result = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="field-block">
          <text class="label">备注</text>
          <textarea v-model="form.note" class="textarea" placeholder="简要记录现场情况" />
        </view>

        <view class="field-block">
          <text class="label">附件</text>
          <view class="attach-row">
            <view class="mini-btn" @tap="addPhoto">拍照</view>
            <view class="mini-btn" @tap="mockVoice">语音</view>
          </view>
          <view v-if="form.medias.length" class="attach-list">
            <view v-for="(item, idx) in form.medias" :key="`${item}-${idx}`" class="attach-item">
              <text class="attach-name ellipsis">{{ mediaName(item) }}</text>
              <text class="attach-del" @tap="removeMedia(idx)">删除</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 绑定对象：临时走访也可在过程中补绑人员/场所 -->
      <view class="card bind-card">
        <view class="section-title">绑定对象</view>
        <view class="bind-actions">
          <text class="link-blue" @tap="openBindSheet('place')">绑定场所</text>
          <text class="link-blue" @tap="openBindSheet('person')">绑定人员</text>
        </view>

        <view class="bound-group">
          <text class="bound-label">已绑场所</text>
          <view v-if="boundPlaces.length" class="bound-list">
            <view v-for="item in boundPlaces" :key="item.objectId" class="bound-item">
              <text class="ellipsis">{{ item.name }}</text>
              <text class="remove-link" @tap="removeBinding('place', item.objectId)">移除</text>
            </view>
          </view>
          <text v-else class="bound-empty">暂无</text>
        </view>

        <view class="bound-group">
          <text class="bound-label">已绑人员</text>
          <view v-if="boundPersons.length" class="bound-list">
            <view v-for="item in boundPersons" :key="item.objectId" class="bound-item">
              <text class="ellipsis">{{ item.name }}</text>
              <text class="remove-link" @tap="removeBinding('person', item.objectId)">移除</text>
            </view>
          </view>
          <text v-else class="bound-empty">暂无</text>
        </view>
      </view>

      <!-- 页面底部占位，避免被固定按钮遮挡 -->
      <view class="bottom-placeholder"></view>

      <!-- 底部固定按钮：左草稿右完成，适配安全区 -->
      <view class="bottom-bar">
        <button class="btn ghost" @tap="saveDraft">保存草稿</button>
        <button class="btn primary" @tap="confirmComplete">完成走访</button>
      </view>

      <!-- 绑定选择弹层：支持搜索与单选，避免跳出页面打断记录流程 -->
      <view v-if="bindSheet.visible" class="sheet-layer" @touchmove.stop.prevent>
        <view class="sheet-mask" @tap="closeBindSheet"></view>
        <view class="sheet-panel" @tap.stop>
          <view class="sheet-head">
            <text class="sheet-title">{{ bindSheet.type === 'place' ? '选择场所' : '选择人员' }}</text>
            <text class="sheet-close" @tap="closeBindSheet">关闭</text>
          </view>
          <input
            v-model="bindSheet.keyword"
            class="sheet-input"
            :placeholder="bindSheet.type === 'place' ? '搜索场所/地址' : '搜索姓名/地址'"
            placeholder-class="sheet-ph"
          />
          <scroll-view class="sheet-list" scroll-y>
            <view
              v-for="item in bindCandidates"
              :key="item.objectId"
              :class="['sheet-item', bindSheet.selectedId === item.objectId ? 'active' : '']"
              @tap="bindSheet.selectedId = item.objectId"
            >
              <view class="sheet-main">
                <text class="sheet-name ellipsis">{{ item.name }}</text>
                <text class="sheet-sub ellipsis">{{ item.address || item.subName || '暂无补充信息' }}</text>
              </view>
              <text class="sheet-mark">{{ bindSheet.selectedId === item.objectId ? '已选' : '' }}</text>
            </view>
            <view v-if="!bindCandidates.length" class="sheet-empty">暂无可选对象</view>
          </scroll-view>
          <view class="sheet-actions">
            <text class="sheet-btn ghost" @tap="closeBindSheet">取消</text>
            <text class="sheet-btn primary" @tap="confirmBind">确定</text>
          </view>
        </view>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import {
  queryVisitObjects,
  submitVisitRecord,
  getTempVisitRecords,
  saveTempVisitRecords,
} from '@/common/database.js';
import { formatDateTime } from './helper.js';

// 走访类型与结果采用轻量单选，减少现场输入成本
const visitTypeOptions = ['巡查', '入户', '宣传', '检查', '回访'];
const resultOptions = ['正常', '发现问题', '已整改', '需跟进'];

const mode = ref('temp');
const targetId = ref('');
const targetType = ref('');
const tempId = ref('');

const allObjects = ref([]);
const timer = ref(null);
const nowTick = ref(Date.now());

const form = reactive({
  startTime: formatDateTime(Date.now()),
  visitType: '巡查',
  result: '正常',
  note: '',
  medias: [],
  location: {
    lat: '',
    lng: '',
    address: '',
  },
  bound: {
    placeIds: [],
    personIds: [],
  },
});

const bindSheet = reactive({
  visible: false,
  type: 'place',
  keyword: '',
  selectedId: '',
});

const modeTitle = computed(() => (mode.value === 'temp' ? '临时走访（未绑定对象）' : `走访：${targetName.value || '对象'}`));
const modeSubTitle = computed(() => (mode.value === 'temp' ? '可在过程中补绑场所/人员' : '已预绑定对象，可继续补绑'));

const targetName = computed(() => {
  const item = allObjects.value.find((row) => row.objectId === targetId.value);
  return item?.name || '';
});

const durationText = computed(() => {
  // 时长实时计算，便于现场确认走访持续时间
  const start = new Date(String(form.startTime).replace(/-/g, '/')).getTime();
  const diff = Math.max(0, nowTick.value - start);
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}小时${m}分钟`;
});

const boundPlaces = computed(() => allObjects.value.filter((item) => form.bound.placeIds.includes(item.objectId)));
const boundPersons = computed(() => allObjects.value.filter((item) => form.bound.personIds.includes(item.objectId)));

const bindCandidates = computed(() => {
  // 绑定候选按对象类型筛选，场所按距离排序，支持关键字检索
  const source = allObjects.value
    .filter((item) => (bindSheet.type === 'place' ? item.objectSource === 'PLACE' : item.objectSource === 'PERSON'))
    .filter((item) => {
      const kw = bindSheet.keyword.trim().toLowerCase();
      if (!kw) return true;
      const text = `${item.name}|${item.address}|${item.subName}`.toLowerCase();
      return text.includes(kw);
    });
  if (bindSheet.type === 'place') {
    return source.slice().sort((a, b) => Number(a.distanceKm || 0) - Number(b.distanceKm || 0));
  }
  return source;
});

function loadObjects() {
  allObjects.value = queryVisitObjects({
    keyword: '',
    tab: 'ALL',
    area: 'ALL',
    risk: 'ALL',
    status: 'ALL',
    due: 'ALL',
  });
}

function fillFromTempRecord() {
  if (!tempId.value) return;
  // 续写草稿：通过 tempId 取已有临时记录，避免现场重复填写
  const record = getTempVisitRecords().find((item) => item.id === tempId.value);
  if (!record) return;
  form.startTime = record.startTime || form.startTime;
  form.visitType = record.visitType || form.visitType;
  form.result = record.result || form.result;
  form.note = record.note || '';
  form.medias = Array.isArray(record.medias) ? [...record.medias] : [];
  form.location = record.location || form.location;
  form.bound.placeIds = Array.isArray(record?.bound?.placeIds) ? [...record.bound.placeIds] : [];
  form.bound.personIds = Array.isArray(record?.bound?.personIds) ? [...record.bound.personIds] : [];
}

function bootstrapBinding() {
  // 对象模式进来时自动预绑定目标对象，保证“一键开始”可立即提交
  if (mode.value !== 'target' || !targetId.value) return;
  const target = allObjects.value.find((item) => item.objectId === targetId.value);
  if (!target) return;
  if (target.objectSource === 'PLACE' && !form.bound.placeIds.includes(target.objectId)) form.bound.placeIds.push(target.objectId);
  if (target.objectSource === 'PERSON' && !form.bound.personIds.includes(target.objectId)) form.bound.personIds.push(target.objectId);
}

function startTick() {
  // 每分钟刷新一次时长文案，降低频率避免无意义重绘
  if (timer.value) clearInterval(timer.value);
  timer.value = setInterval(() => {
    nowTick.value = Date.now();
  }, 60 * 1000);
}

function refreshLocation() {
  // 定位失败不阻断流程，现场可继续手工记录
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      form.location.lat = String(res.latitude || '');
      form.location.lng = String(res.longitude || '');
      form.location.address = `${Number(res.latitude).toFixed(6)},${Number(res.longitude).toFixed(6)}`;
      uni.showToast({ title: '定位成功', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '定位失败，已保留手工记录', icon: 'none' });
    },
  });
}

function addPhoto() {
  // 附件先保存本地临时路径，后续接接口时可在提交环节统一上传
  uni.chooseImage({
    count: 3,
    success: (res) => {
      form.medias.push(...(res.tempFilePaths || []));
    },
    fail: () => {
      uni.showToast({ title: '选择图片失败', icon: 'none' });
    },
  });
}

function mockVoice() {
  // 语音录入先用占位提示，后续可替换为真实录音能力
  uni.showToast({ title: '语音录入能力待接入', icon: 'none' });
}

function mediaName(path) {
  const seg = String(path || '').split('/');
  return seg[seg.length - 1] || '附件';
}

function removeMedia(index) {
  form.medias.splice(index, 1);
}

function openBindSheet(type) {
  bindSheet.type = type;
  bindSheet.visible = true;
  bindSheet.keyword = '';
  bindSheet.selectedId = '';
}

function closeBindSheet() {
  bindSheet.visible = false;
}

function confirmBind() {
  if (!bindSheet.selectedId) {
    uni.showToast({ title: '请先选择一项', icon: 'none' });
    return;
  }
  // 绑定支持“一个场所 + 一个人员以上”，并做去重
  if (bindSheet.type === 'place') {
    if (!form.bound.placeIds.includes(bindSheet.selectedId)) form.bound.placeIds.push(bindSheet.selectedId);
  } else {
    if (!form.bound.personIds.includes(bindSheet.selectedId)) form.bound.personIds.push(bindSheet.selectedId);
  }
  closeBindSheet();
}

function removeBinding(type, objectId) {
  if (type === 'place') {
    form.bound.placeIds = form.bound.placeIds.filter((id) => id !== objectId);
    return;
  }
  form.bound.personIds = form.bound.personIds.filter((id) => id !== objectId);
}

function buildTempRecord(status) {
  // 临时记录统一结构：既支持草稿也支持已完成/未绑定对象记录
  const nowText = formatDateTime(Date.now());
  const startMs = new Date(String(form.startTime).replace(/-/g, '/')).getTime();
  const endMs = Date.now();
  const duration = Math.max(0, Math.floor((endMs - startMs) / 60000));
  return {
    id: tempId.value || `temp-visit-${Date.now()}`,
    mode: mode.value,
    startTime: form.startTime,
    endTime: status === 'draft' ? '' : nowText,
    duration,
    visitType: form.visitType,
    result: form.result,
    note: form.note,
    medias: [...form.medias],
    bound: {
      placeIds: [...form.bound.placeIds],
      personIds: [...form.bound.personIds],
    },
    location: { ...form.location },
    status,
    createdAt: tempId.value ? '' : nowText,
    updatedAt: nowText,
  };
}

function saveTempRecord(record) {
  const nowText = formatDateTime(Date.now());
  const list = getTempVisitRecords();
  const idx = list.findIndex((item) => item.id === record.id);
  if (idx >= 0) {
    const createdAt = list[idx].createdAt || record.createdAt || nowText;
    list[idx] = { ...list[idx], ...record, createdAt };
  } else {
    // 兜底 createdAt，避免“外部带了 tempId 但本地记录不存在”时出现空创建时间
    list.unshift({ ...record, createdAt: record.createdAt || nowText });
  }
  saveTempVisitRecords(list);
  tempId.value = record.id;
}

function saveDraft() {
  // 保存草稿：无论是否绑定对象都先落本地，避免现场网络问题导致数据丢失
  const draft = buildTempRecord('draft');
  saveTempRecord(draft);
  uni.showToast({ title: '草稿已保存', icon: 'success' });
}

function mapResultToSubmit(result) {
  // 提交对象历史时把中文结果映射到既有 visitRecord 枚举
  if (result === '发现问题') return 'issue';
  if (result === '需跟进') return 'need_revisit';
  if (result === '已整改') return 'normal';
  return 'normal';
}

function getNetworkOnline() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => resolve(!['none', 'unknown'].includes(res.networkType)),
      fail: () => resolve(false),
    });
  });
}

async function finishVisit() {
  const boundIds = [...form.bound.placeIds, ...form.bound.personIds];
  const online = await getNetworkOnline();

  if (!boundIds.length) {
    // 未绑定对象：先保存临时记录，后续可在会话页继续补绑对象
    const unlinked = buildTempRecord('unlinked');
    saveTempRecord(unlinked);
    uni.showToast({ title: '已保存临时记录', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 300);
    return;
  }

  // 已绑定对象：按对象逐条写入正式走访记录，进入对象历史闭环
  const visitAt = formatDateTime(Date.now());
  const nextVisitAt = form.result === '需跟进' ? formatDateTime(Date.now() + 3 * 24 * 60 * 60 * 1000) : '';
  boundIds.forEach((objectId) => {
    const target = allObjects.value.find((item) => item.objectId === objectId);
    if (!target) return;
    submitVisitRecord(
      {
        objectId: target.objectId,
        objectSource: target.objectSource,
        objectType: target.objectType,
        objectName: target.name,
        area: target.area,
        riskLevel: target.riskLevel,
        visitType: form.visitType,
        visitAt,
        checkinAt: visitAt,
        locationText: form.location.address || '',
        locationMode: 'gps',
        locationReason: '',
        result: mapResultToSubmit(form.result),
        content: form.note || '现场走访记录',
        rectifications: [],
        nextVisitAt,
        attachments: [...form.medias],
        voiceTexts: [],
        links: { taskId: '', incidentId: '', dispatchId: '' },
        remark: mode.value === 'temp' ? '临时走访补绑提交' : '对象走访提交',
      },
      { online }
    );
  });

  // 若来源是临时草稿，提交后标记 done 保留追溯；否则不强制写临时箱
  if (tempId.value) {
    const done = buildTempRecord('done');
    saveTempRecord(done);
  }

  // 无网时统一提示“草稿箱可手动上传”，让一线同事知道后续处理入口
  uni.showToast({ title: online ? '走访已提交' : '离线已存草稿箱，可手动上传', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 300);
}

function confirmComplete() {
  // 完成提交前做二次确认，避免现场误触
  uni.showModal({
    title: '确认完成走访？',
    content: '确认后将保存本次走访记录。',
    success: (res) => {
      if (!res.confirm) return;
      finishVisit();
    },
  });
}

onLoad((query) => {
  mode.value = String(query?.mode || 'temp');
  targetId.value = String(query?.targetId || '');
  targetType.value = String(query?.targetType || '');
  tempId.value = String(query?.tempId || '');

  loadObjects();
  fillFromTempRecord();
  bootstrapBinding();
  refreshLocation();
  startTick();
});

onUnload(() => {
  if (timer.value) clearInterval(timer.value);
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-session {
  padding: 16rpx 24rpx calc(170rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
}

.card {
  margin-bottom: 14rpx;
}

.mode-row {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.mode-title {
  font-size: 32rpx;
  color: #1f2b3a;
  font-weight: 700;
}

.mode-sub {
  font-size: 24rpx;
  color: #6b7785;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2b3a;
  margin-bottom: 10rpx;
}

.kv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.k {
  flex: 0 0 auto;
  color: #6b7785;
  font-size: 24rpx;
}

.v {
  flex: 1;
  min-width: 0;
  text-align: right;
  color: #1f2b3a;
  font-size: 24rpx;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops-row {
  display: flex;
  justify-content: flex-end;
}

.link-blue {
  color: #1677ff;
  font-size: 24rpx;
}

.field-block {
  margin-bottom: 14rpx;
}

.label {
  font-size: 24rpx;
  color: #4b5563;
}

.chip-row {
  margin-top: 8rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #4b5563;
  background: #f4f6f8;
}

.chip.active {
  color: #1677ff;
  background: #eaf3ff;
}

.textarea {
  margin-top: 8rpx;
  width: 100%;
  min-height: 150rpx;
  border-radius: 12rpx;
  border: 1px solid #eef2f7;
  background: #f8fafc;
  padding: 12rpx;
  box-sizing: border-box;
  font-size: 24rpx;
  color: #1f2b3a;
}

.attach-row {
  margin-top: 8rpx;
  display: flex;
  gap: 12rpx;
}

.mini-btn {
  padding: 10rpx 18rpx;
  border-radius: 10rpx;
  background: #eef2f7;
  color: #1677ff;
  font-size: 24rpx;
}

.attach-list {
  margin-top: 8rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.attach-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  background: #f8fafc;
  border-radius: 10rpx;
  padding: 10rpx 12rpx;
}

.attach-name {
  flex: 1;
  min-width: 0;
  color: #4b5563;
  font-size: 22rpx;
}

.attach-del {
  flex: 0 0 auto;
  font-size: 22rpx;
  color: #d64545;
}

.bind-actions {
  display: inline-flex;
  gap: 22rpx;
  margin-bottom: 10rpx;
}

.bound-group {
  margin-top: 8rpx;
}

.bound-label {
  font-size: 24rpx;
  color: #6b7785;
}

.bound-list {
  margin-top: 6rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.bound-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  padding: 8rpx 12rpx;
  border-radius: 10rpx;
  background: #f8fafc;
  color: #1f2b3a;
  font-size: 24rpx;
}

.bound-empty {
  margin-top: 6rpx;
  display: block;
  color: #98a2b3;
  font-size: 22rpx;
}

.remove-link {
  flex: 0 0 auto;
  color: #1677ff;
  font-size: 22rpx;
}

.bottom-placeholder {
  height: 8rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12rpx;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
}

.btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.btn.ghost {
  background: #f4f6f8;
  color: #344150;
}

.btn.primary {
  background: #1677ff;
  color: #fff;
}

.sheet-layer {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 90;
}

.sheet-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 72vh;
  border-radius: 20rpx 20rpx 0 0;
  background: #fff;
  padding: 14rpx 18rpx calc(14rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title {
  font-size: 30rpx;
  color: #1f2b3a;
  font-weight: 700;
}

.sheet-close {
  font-size: 24rpx;
  color: #1677ff;
}

.sheet-input {
  margin-top: 10rpx;
  width: 100%;
  height: 68rpx;
  border-radius: 12rpx;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 0 14rpx;
  box-sizing: border-box;
  color: #1f2b3a;
  font-size: 24rpx;
}

.sheet-ph {
  color: #98a2b3;
}

.sheet-list {
  margin-top: 10rpx;
  max-height: 44vh;
}

.sheet-item {
  padding: 12rpx;
  border-radius: 12rpx;
  border: 1px solid #eef2f7;
  margin-bottom: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.sheet-item.active {
  border-color: #1677ff;
  background: #f4f9ff;
}

.sheet-main {
  flex: 1;
  min-width: 0;
}

.sheet-name {
  display: block;
  font-size: 26rpx;
  color: #1f2b3a;
  font-weight: 600;
}

.sheet-sub {
  margin-top: 4rpx;
  display: block;
  font-size: 22rpx;
  color: #6b7785;
}

.sheet-mark {
  flex: 0 0 auto;
  color: #1677ff;
  font-size: 22rpx;
}

.sheet-empty {
  text-align: center;
  color: #98a2b3;
  font-size: 24rpx;
  padding: 20rpx 0;
}

.sheet-actions {
  margin-top: 12rpx;
  display: flex;
  gap: 10rpx;
}

.sheet-btn {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.sheet-btn.ghost {
  color: #6b7785;
  background: #f4f6f8;
}

.sheet-btn.primary {
  color: #fff;
  background: #1677ff;
}
</style>
