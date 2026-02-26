<template>
  <AppPage>
    <view class="visit-edit pageBg">
      <view v-if="!objectDetail" class="card empty-card">
        <text class="empty-text">未找到走访对象，无法编辑记录</text>
      </view>

      <template v-else>
        <!-- 只读对象信息：自动带入辖区/风险/责任民警，避免重复填写 -->
        <view class="card object-card">
          <view class="section-title">走访对象</view>
          <view class="object-name">{{ objectDetail.name }}</view>
          <view class="object-meta">{{ objectDetail.subName }} · {{ objectDetail.area }} · {{ objectDetail.riskLevel }}风险</view>
          <view class="object-meta">责任民警：{{ objectDetail.officerName || '未配置' }}</view>
          <view class="object-meta">地址：{{ objectDetail.address || '暂无地址' }}</view>
        </view>

        <view class="card form-card">
          <view class="section-title">走访记录</view>

          <view class="form-row">
            <text class="label">走访类型</text>
            <picker :range="visitTypeOptions" @change="changeVisitType">
              <view class="value clickable">{{ form.visitType }}</view>
            </picker>
          </view>

          <view class="form-row">
            <text class="label">走访时间</text>
            <picker mode="datetime" @change="changeVisitAt">
              <view class="value clickable">{{ form.visitAt }}</view>
            </picker>
          </view>

          <view class="form-row column">
            <view class="switch-line">
              <text class="label">定位打卡</text>
              <switch :checked="form.locationMode === 'manual'" @change="toggleManualLocation" />
            </view>
            <text class="hint">{{ form.locationMode === 'manual' ? '已切换为无需定位（手工说明）' : '建议现场定位打卡' }}</text>
            <view v-if="form.locationMode !== 'manual'" class="location-row">
              <text class="location-value">{{ form.locationText || '尚未定位' }}</text>
              <text class="link-blue" @tap="fetchLocation">一键定位</text>
            </view>
            <textarea
              v-else
              v-model="form.locationReason"
              class="textarea compact"
              placeholder="请填写无需定位原因（必填）"
            />
          </view>

          <view class="form-row column">
            <text class="label">走访结果</text>
            <view class="result-chips">
              <view
                v-for="item in resultOptions"
                :key="item.value"
                :class="['chip', form.result === item.value ? 'active' : '']"
                @tap="form.result = item.value"
              >
                {{ item.label }}
              </view>
            </view>
          </view>

          <view class="form-row column">
            <text class="label">主要内容</text>
            <textarea v-model="form.content" class="textarea" placeholder="请填写走访情况（必填）" />
            <view class="voice-row">
              <text class="link-blue" @tap="mockSpeechInput">语音录入（模拟）</text>
              <text class="voice-tip">已记录 {{ form.voiceTexts.length }} 条语音文本</text>
            </view>
          </view>

          <view class="form-row column">
            <text class="label">图片附件</text>
            <view class="attach-grid">
              <view v-for="(img, idx) in form.attachments" :key="idx" class="attach-item">
                <image :src="img" mode="aspectFill" />
                <text class="remove" @tap.stop="removeAttachment(idx)">×</text>
              </view>
              <view class="attach-add" @tap="chooseAttachment">+ 添加</view>
            </view>
          </view>

          <!-- 发现问题/需回访时这里会强制校验，满足闭环要求 -->
          <view id="rectifyArea" class="form-row column">
            <view class="rectify-head">
              <text class="label">整改项</text>
              <text class="link-blue" @tap="addRectification">新增整改项</text>
            </view>
            <view v-if="form.rectifications.length === 0" class="hint">暂无整改项</view>
            <view v-for="(item, idx) in form.rectifications" :key="item.id" class="rectify-item">
              <input v-model="item.issue" class="input" placeholder="问题描述（必填）" />
              <view class="inline-row">
                <input v-model="item.owner" class="input flex-input" placeholder="责任人" />
                <picker mode="date" @change="(e) => item.deadline = e.detail.value">
                  <view class="value clickable">{{ item.deadline || '整改期限' }}</view>
                </picker>
              </view>
              <view class="inline-row">
                <view class="switch-line mini">
                  <text class="hint">已整改</text>
                  <switch :checked="item.done" @change="(e) => item.done = e.detail.value" />
                </view>
                <text class="delete-link" @tap="removeRectification(idx)">删除</text>
              </view>
            </view>
          </view>

          <view class="form-row">
            <text class="label">下次回访</text>
            <picker mode="datetime" @change="changeNextVisit">
              <view class="value clickable">{{ form.nextVisitAt || '请选择（发现问题时必填）' }}</view>
            </picker>
          </view>

          <view class="form-row column">
            <text class="label">备注</text>
            <textarea v-model="form.remark" class="textarea compact" placeholder="可选" />
          </view>
        </view>
      </template>

      <!-- 底部固定操作：左草稿、右提交 -->
      <view v-if="objectDetail" class="bottom-bar">
        <button class="btn ghost" @tap="saveDraft">存草稿</button>
        <button class="btn primary" @tap="submitRecord">提交</button>
      </view>
    </view>
  </AppPage>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';
import { getVisitObjects, getVisitDrafts, getVisitRecords, upsertVisitDraft, submitVisitRecord } from '@/common/database.js';
import { VISIT_RESULT_OPTIONS, VISIT_TYPE_OPTIONS, formatDateTime } from './helper.js';

const objectId = ref('');
const draftId = ref('');
const recordId = ref('');
const focusRectify = ref(false);
const objectDetail = ref(null);

const resultOptions = VISIT_RESULT_OPTIONS;
const visitTypeOptions = VISIT_TYPE_OPTIONS;

const form = reactive({
  visitType: '例行',
  visitAt: formatDateTime(Date.now()),
  checkinAt: '',
  locationText: '',
  locationMode: 'gps',
  locationReason: '',
  result: 'normal',
  content: '',
  voiceTexts: [],
  attachments: [],
  rectifications: [],
  nextVisitAt: '',
  remark: '',
});

function makeRectification() {
  // 统一创建整改项结构，保证新增项字段完整
  return {
    id: `rect-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    issue: '',
    owner: '',
    deadline: '',
    done: false,
  };
}

function loadObject() {
  const all = getVisitObjects();
  objectDetail.value = all.find((item) => item.objectId === objectId.value) || null;
}

function loadByDraft() {
  if (!draftId.value) return;
  const draft = getVisitDrafts().find((item) => item.draftId === draftId.value);
  if (!draft) return;
  form.visitType = draft.visitType || '例行';
  form.visitAt = draft.visitAt || formatDateTime(Date.now());
  form.checkinAt = draft.checkinAt || '';
  form.locationText = draft.locationText || '';
  form.locationMode = draft.locationMode || 'gps';
  form.locationReason = draft.locationReason || '';
  form.result = draft.result || 'normal';
  form.content = draft.content || '';
  form.voiceTexts = draft.voiceTexts ? [...draft.voiceTexts] : [];
  form.attachments = draft.attachments ? [...draft.attachments] : [];
  form.rectifications = draft.rectifications ? draft.rectifications.map((item) => ({ ...item })) : [];
  form.nextVisitAt = draft.nextVisitAt || '';
  form.remark = draft.remark || '';
}

function loadByRecord() {
  if (!recordId.value) return;
  const record = getVisitRecords().find((item) => item.recordId === recordId.value);
  if (!record) return;
  form.visitType = record.visitType || '例行';
  form.visitAt = record.visitAt || formatDateTime(Date.now());
  form.checkinAt = record.checkinAt || '';
  form.locationText = record.locationText || '';
  form.locationMode = record.locationMode || 'gps';
  form.locationReason = record.locationReason || '';
  form.result = record.result || 'normal';
  form.content = record.content || '';
  form.voiceTexts = record.voiceTexts ? [...record.voiceTexts] : [];
  form.attachments = record.attachments ? [...record.attachments] : [];
  form.rectifications = record.rectifications ? record.rectifications.map((item) => ({ ...item })) : [];
  form.nextVisitAt = record.nextVisitAt || '';
  form.remark = record.remark || '';
}

function changeVisitType(e) {
  form.visitType = visitTypeOptions[Number(e.detail.value)] || '例行';
}

function changeVisitAt(e) {
  form.visitAt = e.detail.value || form.visitAt;
}

function changeNextVisit(e) {
  form.nextVisitAt = e.detail.value || '';
}

function toggleManualLocation(e) {
  // 开启“无需定位”后清空定位坐标，改填原因说明
  const manual = !!e.detail.value;
  form.locationMode = manual ? 'manual' : 'gps';
  if (!manual) form.locationReason = '';
}

function fetchLocation() {
  // 定位打卡：现场有网时用 GPS，失败时允许手工切换“无需定位”
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      form.checkinAt = formatDateTime(Date.now());
      form.locationText = `${Number(res.latitude).toFixed(6)},${Number(res.longitude).toFixed(6)}`;
      uni.showToast({ title: '定位成功', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '定位失败，可切换无需定位', icon: 'none' });
    },
  });
}

function mockSpeechInput() {
  // 语音转文字在本地先用“输入框模拟”，后续可替换成真实语音接口
  uni.showModal({
    title: '语音录入（模拟）',
    editable: true,
    placeholderText: '请输入语音转写内容',
    success: (res) => {
      if (!res.confirm || !res.content) return;
      form.voiceTexts.unshift(res.content);
    },
  });
}

function chooseAttachment() {
  // 现场拍照/相册统一走 chooseImage，失败时兜底写入示例图
  uni.chooseImage({
    count: 3,
    success: (res) => {
      const files = res.tempFilePaths || [];
      form.attachments.push(...files);
    },
    fail: () => {
      form.attachments.push('/static/logo.png');
    },
  });
}

function removeAttachment(index) {
  form.attachments.splice(index, 1);
}

function addRectification() {
  form.rectifications.push(makeRectification());
}

function removeRectification(index) {
  form.rectifications.splice(index, 1);
}

function buildPayload() {
  // 提交/草稿统一使用同一 payload 结构，降低状态切换复杂度
  return {
    recordId: recordId.value || '',
    objectId: objectDetail.value.objectId,
    objectSource: objectDetail.value.objectSource,
    objectType: objectDetail.value.objectType,
    objectName: objectDetail.value.name,
    area: objectDetail.value.area,
    riskLevel: objectDetail.value.riskLevel,
    visitType: form.visitType,
    visitAt: form.visitAt,
    checkinAt: form.checkinAt || formatDateTime(Date.now()),
    locationText: form.locationText,
    locationMode: form.locationMode,
    locationReason: form.locationReason,
    result: form.result,
    content: form.content,
    rectifications: form.rectifications.map((item) => ({ ...item })),
    nextVisitAt: form.nextVisitAt,
    attachments: [...form.attachments],
    voiceTexts: [...form.voiceTexts],
    links: { taskId: '', incidentId: '', dispatchId: '' },
    remark: form.remark,
  };
}

function validateBeforeSubmit() {
  if (!objectDetail.value) {
    uni.showToast({ title: '走访对象不存在', icon: 'none' });
    return false;
  }
  if (!form.content.trim()) {
    uni.showToast({ title: '请填写主要内容', icon: 'none' });
    return false;
  }
  if (form.locationMode === 'manual' && !form.locationReason.trim()) {
    uni.showToast({ title: '请填写无需定位原因', icon: 'none' });
    return false;
  }
  // 闭环约束：发现问题/需回访时必须有整改项和下次回访时间
  if (['issue', 'need_revisit'].includes(form.result)) {
    const validRect = form.rectifications.some((item) => item.issue && item.deadline);
    if (!validRect) {
      uni.showToast({ title: '请至少填写一条整改项（含期限）', icon: 'none' });
      return false;
    }
    if (!form.nextVisitAt) {
      uni.showToast({ title: '请填写下次回访时间', icon: 'none' });
      return false;
    }
  }
  return true;
}

function getNetworkOnline() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => resolve(!['none', 'unknown'].includes(res.networkType)),
      fail: () => resolve(false),
    });
  });
}

function saveDraft() {
  const payload = buildPayload();
  const draft = upsertVisitDraft({
    ...payload,
    draftId: draftId.value || '',
    objectId: objectId.value,
    objectName: objectDetail.value?.name || payload.objectName,
    status: 'draft',
  });
  draftId.value = draft.draftId;
  uni.showToast({ title: '草稿已保存', icon: 'success' });
}

async function submitRecord() {
  if (!validateBeforeSubmit()) return;
  const online = await getNetworkOnline();
  const payload = buildPayload();
  const submitted = submitVisitRecord(payload, {
    online,
    draftId: draftId.value || '',
  });
  if (submitted.status === 'submitted') {
    uni.showToast({ title: '提交成功', icon: 'success' });
  } else {
    // 离线场景提示草稿箱入口，方便用户后续手动上传
    uni.showToast({ title: '当前离线，已存草稿箱待上传', icon: 'none' });
  }
  // 提交后回到详情页，便于继续查看历史与状态
  uni.navigateBack();
}

onLoad((query) => {
  objectId.value = query?.objectId || '';
  draftId.value = query?.draftId || '';
  recordId.value = query?.recordId || '';
  focusRectify.value = String(query?.focusRectify || '') === '1';

  loadObject();
  if (recordId.value) loadByRecord();
  else if (draftId.value) loadByDraft();

  // 新建走访默认预置一条整改项（仅焦点模式），减少额外点击
  if (focusRectify.value && form.rectifications.length === 0) {
    addRectification();
  }
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';

.visit-edit {
  padding: 16rpx 24rpx calc(156rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
}

.object-card,
.form-card {
  margin-bottom: 14rpx;
}

.section-title {
  font-size: 30rpx;
  color: #1f2b3a;
  font-weight: 700;
  margin-bottom: 10rpx;
}

.object-name {
  font-size: 34rpx;
  color: #1f2b3a;
  font-weight: 700;
}

.object-meta {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6b7785;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.form-row.column {
  flex-direction: column;
  align-items: stretch;
}

.label {
  flex: 0 0 auto;
  font-size: 24rpx;
  color: #4b5563;
}

.value {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #1f2b3a;
  text-align: right;
  background: #f8fafc;
  border-radius: 10rpx;
  padding: 12rpx 14rpx;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clickable {
  color: #1677ff;
}

.switch-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-line.mini {
  gap: 8rpx;
}

.hint {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a95a6;
}

.location-row {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.location-value {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-blue {
  color: #1677ff;
  font-size: 24rpx;
}

.result-chips {
  margin-top: 8rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f4f6f8;
  color: #4b5563;
  font-size: 24rpx;
}

.chip.active {
  background: #eaf3ff;
  color: #1677ff;
}

.textarea {
  width: 100%;
  min-height: 150rpx;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 12rpx;
  padding: 12rpx;
  box-sizing: border-box;
  font-size: 24rpx;
  color: #1f2b3a;
}

.textarea.compact {
  min-height: 90rpx;
}

.voice-row {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-tip {
  font-size: 22rpx;
  color: #8a95a6;
}

.attach-grid {
  margin-top: 8rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.attach-item {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.attach-item image {
  width: 100%;
  height: 100%;
}

.remove {
  position: absolute;
  right: 6rpx;
  top: 2rpx;
  color: #fff;
  font-size: 24rpx;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  width: 28rpx;
  height: 28rpx;
  text-align: center;
  line-height: 28rpx;
}

.attach-add {
  width: 120rpx;
  height: 120rpx;
  border-radius: 10rpx;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7785;
  font-size: 24rpx;
}

.rectify-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rectify-item {
  margin-top: 10rpx;
  border: 1px solid #eef2f7;
  border-radius: 12rpx;
  padding: 10rpx;
  box-sizing: border-box;
}

.input {
  width: 100%;
  height: 68rpx;
  border-radius: 10rpx;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  padding: 0 12rpx;
  box-sizing: border-box;
  font-size: 24rpx;
}

.inline-row {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10rpx;
}

.flex-input {
  flex: 1;
  min-width: 0;
}

.delete-link {
  font-size: 24rpx;
  color: #d64545;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 12rpx;
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
  color: #344150;
  background: #f4f6f8;
}

.btn.primary {
  color: #fff;
  background: #1677ff;
}

.empty-card {
  text-align: center;
  padding: 24rpx 0;
}

.empty-text {
  color: #98a2b3;
  font-size: 24rpx;
}
</style>
