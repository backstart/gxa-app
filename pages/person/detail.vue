
<template>
  <view class="person-detail pageBg">
    <view class="statuBar"></view>

    <view class="card overview">
      <view class="name">{{ maskName(person?.name) }}</view>
      <view class="info">
        <view class="row"><text>责任民警</text><text>{{ person?.officerName || '-' }}</text></view>
        <view class="row"><text>电话</text><text>{{ maskPhone(person?.phone) }}</text></view>
        <view class="row"><text>地址</text><text>{{ person?.address || '-' }}</text></view>
        <view class="row"><text>最近回访</text><text>{{ person?.lastVisitAt || '-' }}</text></view>
        <view class="row">
          <text>下次回访</text>
          <text :class="dueClass(person?.nextVisitDue)">{{ dueText(person?.nextVisitDue) }}</text>
        </view>
      </view>
      <com-tag :taglist="tagList"></com-tag>
    </view>

    <view class="tabs">
      <view
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        :class="['tab', activeTab === idx ? 'active' : '']"
        @click="activeTab = idx"
      >
        <text class="icon">{{ tab.icon }}</text>
        <text>{{ tab.label }}</text>
        <text v-if="tab.key === 'visits'" class="badge">{{ visits.length }}</text>
      </view>
    </view>

    <view class="tab-panel card">
      <view v-if="activeTab === 0">
        <view class="panel-title">回访记录</view>
        <view v-if="visits.length === 0" class="empty">暂无回访记录</view>
        <view v-for="item in visits" :key="item.id" class="record" @click="openVisit(item)">
          <view class="record-top">
            <text>{{ item.visitType }}</text>
            <text>{{ item.visitAt }}</text>
          </view>
          <view class="record-content">{{ item.content }}</view>
          <view class="record-meta">
            <text>民警：{{ item.officerName || '-' }}</text>
            <text>下次回访：{{ item.nextVisitDue || '-' }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 1">
        <view class="panel-head">
          <view class="panel-title">档案信息</view>
          <text class="edit-btn" @click="openProfileForm">编辑</text>
        </view>
        <view class="sectionCard">
          <view class="info-grid">
            <view class="item"><text>性别</text><text>{{ profile?.basic?.gender || '-' }}</text></view>
            <view class="item"><text>出生日期</text><text>{{ profile?.basic?.birthday || '-' }}</text></view>
            <view class="item"><text>身份证</text><text>{{ maskId(profile?.basic?.fullIdNo) }}</text></view>
            <view class="item"><text>户籍地</text><text>{{ profile?.basic?.domicile || '-' }}</text></view>
            <view class="item"><text>职业</text><text>{{ profile?.basic?.job || '-' }}</text></view>
          </view>
          <view class="section">
            <view class="section-title">风险因素</view>
            <view class="chips">
              <view v-for="item in profile?.riskFactors || []" :key="item" class="chip">{{ item }}</view>
              <view v-if="!(profile?.riskFactors || []).length" class="empty">暂无</view>
            </view>
          </view>
          <view class="section">
            <view class="section-title">证件照片</view>
            <view class="photo-row">
              <image v-for="(img, idx) in profile?.idCardPhotos || []" :key="`id-${idx}`" class="photo-thumb" :src="img" mode="aspectFill"></image>
              <text v-if="!(profile?.idCardPhotos || []).length">--</text>
            </view>
            <view class="section-title">人像照片</view>
            <view class="photo-row">
              <image v-for="(img, idx) in profile?.portraitPhotos || []" :key="`pt-${idx}`" class="photo-thumb" :src="img" mode="aspectFill"></image>
              <text v-if="!(profile?.portraitPhotos || []).length">--</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 2">
        <view class="panel-title">关联信息</view>
        <view class="stats">
          <view class="stat">
            <view class="num">{{ related.alerts }}</view>
            <view class="label">警情</view>
          </view>
          <view class="stat">
            <view class="num">{{ related.disputes }}</view>
            <view class="label">纠纷</view>
          </view>
          <view class="stat">
            <view class="num">{{ related.dispatches }}</view>
            <view class="label">派单</view>
          </view>
        </view>
      </view>

      <view v-else>
        <view class="panel-title">管控措施</view>
        <view v-if="measures.length === 0" class="empty">暂无管控措施</view>
        <view v-for="item in measures" :key="item.measureId" class="measure-card" @click="openMeasure(item)">
          <view class="measure-top">
            <view class="measure-types">
              <text v-for="type in item.types" :key="type" class="chip">{{ type }}</text>
            </view>
            <text :class="['status-badge', measureStatusClass(item.status)]">{{ item.status }}</text>
          </view>
          <view class="measure-remark">{{ item.remark || '暂无备注' }}</view>
          <view class="measure-meta">更新：{{ formatDate(item.updatedAt || item.createdAt) }}</view>
        </view>
      </view>
    </view>

    <view class="action-bar" v-if="actionVisible">
      <button type="primary" class="action-btn" @click="handleAction">{{ actionLabel }}</button>
    </view>

    <view v-if="visitFormVisible" class="modalMask" @click.self="closeVisitForm">
      <view class="modalCard">
        <view class="modalTitle">{{ visitFormMode === 'add' ? '新增回访' : '编辑回访' }}</view>
        <view class="formRow">
          <text class="formLabel">回访类型</text>
          <picker :range="visitTypeOptions" @change="(e)=> visitForm.visitType = visitTypeOptions[e.detail.value]">
            <view class="formInput">{{ visitForm.visitType }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">回访时间</text>
          <picker mode="datetime" @change="(e)=> visitForm.visitAt = e.detail.value">
            <view class="formInput">{{ visitForm.visitAt }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">内容</text>
          <textarea class="formInput" v-model="visitForm.content" placeholder="必填"></textarea>
        </view>
        <view class="formRow">
          <text class="formLabel">民警</text>
          <input class="formInput" v-model="visitForm.officerName" />
        </view>
        <view class="formRow">
          <text class="formLabel">下次回访</text>
          <picker mode="date" @change="(e)=> visitForm.nextVisitDue = e.detail.value">
            <view class="formInput">{{ visitForm.nextVisitDue || '自动计算' }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">风险变化</text>
          <switch :checked="visitForm.riskChanged" @change="(e)=> visitForm.riskChanged = e.detail.value"></switch>
        </view>
        <view class="formRow" v-if="visitForm.riskChanged">
          <text class="formLabel">风险等级</text>
          <picker :range="riskOptions" @change="(e)=> visitForm.riskLevel = riskOptions[e.detail.value]">
            <view class="formInput">{{ visitForm.riskLevel }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">附件</text>
          <view class="photoRow">
            <button size="mini" class="ghost-btn" @click="addVisitAttachment('image')">示例图片</button>
            <button size="mini" class="ghost-btn" @click="addVisitAttachment('audio')">示例音频</button>
          </view>
          <view class="photoRow">
            <text v-for="(item, idx) in visitForm.attachments" :key="idx">{{ item }}</text>
          </view>
        </view>
        <view class="modalActions">
          <button class="btnCancel" @click="closeVisitForm">取消</button>
          <button class="btnSave" @click="saveVisit">保存</button>
        </view>
      </view>
    </view>

    <view v-if="visitViewVisible" class="modalMask" @click.self="visitViewVisible = false">
      <view class="modalCard">
        <view class="modalTitle">回访详情</view>
        <view class="formRow"><text class="formLabel">类型</text><text>{{ visitView?.visitType }}</text></view>
        <view class="formRow"><text class="formLabel">时间</text><text>{{ visitView?.visitAt }}</text></view>
        <view class="formRow"><text class="formLabel">内容</text><text>{{ visitView?.content }}</text></view>
        <view class="formRow"><text class="formLabel">民警</text><text>{{ visitView?.officerName }}</text></view>
        <view class="formRow"><text class="formLabel">下次回访</text><text>{{ visitView?.nextVisitDue || '--' }}</text></view>
        <view class="formRow"><text class="formLabel">附件</text><text>{{ (visitView?.attachments || []).join(' / ') || '--' }}</text></view>
        <view class="modalActions">
          <button class="btnSave" @click="visitViewVisible = false">关闭</button>
        </view>
      </view>
    </view>

    <view v-if="profileFormVisible" class="modalMask" @click.self="closeProfileForm">
      <view class="modalCard">
        <view class="modalTitle">档案编辑</view>
        <view class="formRow">
          <text class="formLabel">性别</text>
          <picker :range="genderOptions" @change="(e)=> profileForm.gender = genderOptions[e.detail.value]">
            <view class="formInput">{{ profileForm.gender }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">出生日期</text>
          <picker mode="date" @change="(e)=> profileForm.birthday = e.detail.value">
            <view class="formInput">{{ profileForm.birthday }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">身份证号</text>
          <input class="formInput" v-model="profileForm.fullIdNo" placeholder="可选" />
        </view>
        <view class="formRow">
          <text class="formLabel">户籍地</text>
          <input class="formInput" v-model="profileForm.domicile" placeholder="可选" />
        </view>
        <view class="formRow">
          <text class="formLabel">职业</text>
          <input class="formInput" v-model="profileForm.job" placeholder="可选" />
        </view>
        <view class="formRow">
          <text class="formLabel">风险因素</text>
          <view class="chips">
            <view
              v-for="item in riskFactorOptions"
              :key="item"
              :class="['chip', profileForm.riskFactors.includes(item) ? 'active' : '']"
              @click="toggleRiskFactor(item)"
            >
              {{ item }}
            </view>
          </view>
        </view>
        <view class="formRow">
          <text class="formLabel">身份证照片</text>
          <view class="photoRow">
            <button size="mini" class="ghost-btn" @click="addIdPhoto('front')">正面示例</button>
            <button size="mini" class="ghost-btn" @click="addIdPhoto('back')">反面示例</button>
          </view>
          <view class="photoRow">
            <image v-for="(img, idx) in profileForm.idCardPhotos" :key="idx" class="photo-thumb" :src="img" mode="aspectFill"></image>
          </view>
        </view>
        <view class="formRow">
          <text class="formLabel">人像照片</text>
          <view class="photoRow">
            <button size="mini" class="ghost-btn" @click="addPortraitPhoto">添加示例</button>
          </view>
          <view class="photoRow">
            <image v-for="(img, idx) in profileForm.portraitPhotos" :key="idx" class="photo-thumb" :src="img" mode="aspectFill"></image>
          </view>
        </view>
        <view class="modalActions">
          <button class="btnCancel" @click="closeProfileForm">取消</button>
          <button class="btnSave" @click="saveProfile">保存</button>
        </view>
      </view>
    </view>

    <view v-if="measureFormVisible" class="modalMask" @click.self="closeMeasureForm">
      <view class="modalCard">
        <view class="modalTitle">{{ measureFormMode === 'add' ? '新增措施' : '编辑措施' }}</view>
        <view class="formRow">
          <text class="formLabel">措施类型</text>
          <view class="chips">
            <view
              v-for="item in measureTypeOptions"
              :key="item"
              :class="['chip', measureForm.types.includes(item) ? 'active' : '']"
              @click="toggleMeasureType(item)"
            >
              {{ item }}
            </view>
          </view>
        </view>
        <view class="formRow">
          <text class="formLabel">状态</text>
          <picker :range="measureStatusOptions" @change="(e)=> measureForm.status = measureStatusOptions[e.detail.value]">
            <view class="formInput">{{ measureForm.status }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">开始时间</text>
          <picker mode="date" @change="(e)=> measureForm.startDate = e.detail.value">
            <view class="formInput">{{ measureForm.startDate || '--' }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">结束时间</text>
          <picker mode="date" @change="(e)=> measureForm.endDate = e.detail.value">
            <view class="formInput">{{ measureForm.endDate || '--' }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">备注</text>
          <textarea class="formInput" v-model="measureForm.remark" placeholder="可选"></textarea>
        </view>
        <view class="modalActions">
          <button class="btnCancel" @click="closeMeasureForm">取消</button>
          <button class="btnSave" @click="saveMeasure">保存</button>
        </view>
      </view>
    </view>

    <view v-if="measureViewVisible" class="modalMask" @click.self="measureViewVisible = false">
      <view class="modalCard">
        <view class="modalTitle">措施详情</view>
        <view class="formRow"><text class="formLabel">类型</text><text>{{ (measureView?.types || []).join(' / ') }}</text></view>
        <view class="formRow"><text class="formLabel">状态</text><text>{{ measureView?.status }}</text></view>
        <view class="formRow"><text class="formLabel">时间</text><text>{{ measureView?.startDate || '--' }} - {{ measureView?.endDate || '--' }}</text></view>
        <view class="formRow"><text class="formLabel">备注</text><text>{{ measureView?.remark || '--' }}</text></view>
        <view class="modalActions">
          <button class="btnSave" @click="measureViewVisible = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  getKeyPersons,
  saveKeyPersons,
  getKeyPersonProfiles,
  saveKeyPersonProfiles,
  getKeyPersonVisits,
  saveKeyPersonVisits,
  getKeyPersonMeasures,
  saveKeyPersonMeasures,
  getKeyPersonById,
  getPersonVisits,
  syncKeyPersonTodos,
} from '@/common/database.js';

const personId = ref('');
const person = ref(null);
const profile = ref(null);
const visits = ref([]);
const measures = ref([]);
const activeTab = ref(0);

const tabs = [
  { key: 'visits', label: '回访记录', icon: '📝' },
  { key: 'profile', label: '档案信息', icon: '📄' },
  { key: 'related', label: '关联信息', icon: '🔗' },
  { key: 'control', label: '管控措施', icon: '🛡️' },
];

const related = ref({ alerts: 2, disputes: 1, dispatches: 3 });
const tagList = computed(() => {
  const list = [];
  if (person.value?.personType) list.push(person.value.personType);
  if (person.value?.riskLevel) list.push(person.value.riskLevel);
  if (person.value?.status) list.push(person.value.status);
  (person.value?.tags || []).forEach((tag) => list.push(tag));
  return list.map((tag) => ({ tag }));
});

const actionLabel = computed(() => {
  if (activeTab.value === 0) return '新增回访';
  if (activeTab.value === 1) return '新增档案';
  if (activeTab.value === 3) return '新增措施';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

const visitFormVisible = ref(false);
const visitFormMode = ref('add');
const visitViewVisible = ref(false);
const visitView = ref(null);
const profileFormVisible = ref(false);
const measureFormVisible = ref(false);
const measureFormMode = ref('add');
const measureViewVisible = ref(false);
const measureView = ref(null);
const editingVisitId = ref('');
const editingMeasureId = ref('');

const visitTypeOptions = ['例行', '谈话', '突击', '专项'];
const riskOptions = ['高', '中', '低'];
const genderOptions = ['男', '女', '未知'];
const riskFactorOptions = ['涉毒复吸史', '情绪不稳', '涉稳', '酗酒', '涉赌', '精神障碍'];
const measureTypeOptions = ['定期走访', '社区帮扶', '谈话教育', '尿检', '稳控', '送治', '家属协助'];
const measureStatusOptions = ['执行中', '已完成', '暂停'];

const visitForm = reactive({
  visitType: '例行',
  visitAt: '',
  content: '',
  officerName: '李警官',
  nextVisitDue: '',
  attachments: [],
  riskChanged: false,
  riskLevel: '中',
});

const profileForm = reactive({
  gender: '未知',
  birthday: '',
  fullIdNo: '',
  domicile: '',
  job: '',
  riskFactors: [],
  idCardPhotos: [],
  portraitPhotos: [],
});

const measureForm = reactive({
  types: [],
  status: '执行中',
  startDate: '',
  endDate: '',
  remark: '',
});

// 加载重点人资料与关联数据
function loadAll() {
  person.value = getKeyPersonById(personId.value) || null;
  const rawProfile = (getKeyPersonProfiles() || []).find((p) => p.personId === personId.value) || null;
  if (rawProfile && !rawProfile.basic) {
    profile.value = {
      personId: rawProfile.personId,
      basic: {
        gender: rawProfile.gender || '未知',
        birthday: rawProfile.birthday || '',
        domicile: rawProfile.household || '',
        job: rawProfile.occupation || '',
        fullIdNo: rawProfile.idNo || '',
      },
      riskFactors: rawProfile.riskFactors || [],
      idCardPhotos: rawProfile.idCardPhotos || [],
      portraitPhotos: rawProfile.portraitPhotos || [],
      updatedAt: rawProfile.updatedAt || Date.now(),
    };
  } else {
    profile.value = rawProfile;
  }
  visits.value = getPersonVisits(personId.value);
  measures.value = getKeyPersonMeasures().filter((item) => item.personId === personId.value);
  syncKeyPersonTodos(getKeyPersons());
}

// 保存重点人基础信息
function persistPersons(updatedPerson) {
  const list = getKeyPersons().map((p) => (p.personId === updatedPerson.personId ? updatedPerson : p));
  saveKeyPersons(list);
}

// 保存重点人档案信息
function persistProfile(updatedProfile) {
  const list = getKeyPersonProfiles();
  const idx = list.findIndex((p) => p.personId === updatedProfile.personId);
  if (idx >= 0) list[idx] = updatedProfile;
  else list.unshift(updatedProfile);
  saveKeyPersonProfiles(list);
}

// 保存回访记录列表
function persistVisits(list) {
  saveKeyPersonVisits(list);
}

// 保存管控措施列表
function persistMeasures(list) {
  saveKeyPersonMeasures(list);
}

// 姓名脱敏
function maskName(name) {
  if (!name) return '-';
  return `${name.charAt(0)}*`;
}

// 手机号脱敏
function maskPhone(phone) {
  if (!phone) return '-';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

// 身份证号脱敏
function maskId(idNo) {
  if (!idNo) return '-';
  return `${idNo.slice(0, 4)}********${idNo.slice(-4)}`;
}

// 下次回访提示文案
function dueText(dateStr) {
  if (!dateStr) return '未设置';
  const days = dueDays(dateStr);
  if (days < 0) return `超期${Math.abs(days)}天`;
  return `剩余${days}天`;
}

// 下次回访到期样式
function dueClass(dateStr) {
  const days = dueDays(dateStr);
  if (days < 0) return 'danger';
  if (days <= 7) return 'warn';
  return '';
}

// 计算到期天数
function dueDays(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(String(dateStr).replace(/-/g, '/'));
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - now.getTime()) / 86400000);
}

// 风险等级样式
function riskClass(level) {
  if (level === '高') return 'danger';
  if (level === '中') return 'warn';
  return 'low';
}

// 状态样式
function statusClass(status) {
  if (status === '失控') return 'danger';
  if (status === '关注') return 'warn';
  if (status === '在控') return 'ok';
  return 'muted';
}

// 底部主按钮动作分发
function handleAction() {
  if (activeTab.value === 0) {
    openAddVisit();
    return;
  }
  if (activeTab.value === 1) {
    openProfileForm();
    return;
  }
  if (activeTab.value === 3) {
    openAddMeasure();
  }
}

// 打开新增回访表单
function openAddVisit() {
  visitFormMode.value = 'add';
  editingVisitId.value = '';
  visitForm.visitType = '例行';
  visitForm.visitAt = formatDateTime(Date.now());
  visitForm.content = '';
  visitForm.officerName = '李警官';
  visitForm.nextVisitDue = '';
  visitForm.attachments = [];
  visitForm.riskChanged = false;
  visitForm.riskLevel = person.value?.riskLevel || '中';
  visitFormVisible.value = true;
}

// 打开编辑回访表单
function openEditVisit(item) {
  visitFormMode.value = 'edit';
  editingVisitId.value = item.id;
  visitForm.visitType = item.visitType || '例行';
  visitForm.visitAt = item.visitAt || '';
  visitForm.content = item.content || '';
  visitForm.officerName = item.officerName || '李警官';
  visitForm.nextVisitDue = item.nextVisitDue || '';
  visitForm.attachments = item.attachments ? [...item.attachments] : [];
  visitForm.riskChanged = !!item.riskChanged;
  visitForm.riskLevel = person.value?.riskLevel || '中';
  visitFormVisible.value = true;
}

// 关闭回访表单
function closeVisitForm() {
  visitFormVisible.value = false;
}

// 保存回访记录
function saveVisit() {
  if (!visitForm.content.trim()) {
    uni.showToast({ title: '请填写回访内容', icon: 'none' });
    return;
  }
  const list = getKeyPersonVisits();
  const now = Date.now();
  const nextDue = visitForm.nextVisitDue || calcNextVisitDue(visitForm.visitAt);
  if (visitFormMode.value === 'add') {
    list.unshift({
      id: `visit_${Date.now()}`,
      personId: personId.value,
      visitType: visitForm.visitType,
      visitAt: visitForm.visitAt,
      content: visitForm.content,
      officerName: visitForm.officerName,
      nextVisitDue: nextDue,
      attachments: [...visitForm.attachments],
      riskChanged: visitForm.riskChanged,
      updatedAt: now,
    });
  } else {
    const idx = list.findIndex((v) => v.id === editingVisitId.value);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        visitType: visitForm.visitType,
        visitAt: visitForm.visitAt,
        content: visitForm.content,
        officerName: visitForm.officerName,
        nextVisitDue: nextDue,
        attachments: [...visitForm.attachments],
        riskChanged: visitForm.riskChanged,
        updatedAt: now,
      };
    }
  }
  persistVisits(list);
  updatePersonByVisit(visitForm.visitAt, nextDue, visitForm.riskChanged ? visitForm.riskLevel : '');
  visitFormVisible.value = false;
  uni.showToast({ title: '已保存', icon: 'success' });
  loadAll();
}

// 打开回访操作菜单
function openVisit(item) {
  uni.showActionSheet({
    itemList: ['查看', '编辑', '删除', '取消'],
    success: (res) => {
      if (res.tapIndex === 0) {
        visitView.value = item;
        visitViewVisible.value = true;
      }
      if (res.tapIndex === 1) openEditVisit(item);
      if (res.tapIndex === 2) confirmDeleteVisit(item);
    },
  });
}

// 确认删除回访
function confirmDeleteVisit(item) {
  uni.showModal({
    title: '删除回访',
    content: '确认删除该回访记录？',
    success: (res) => {
      if (!res.confirm) return;
      const list = getKeyPersonVisits().filter((v) => v.id !== item.id);
      persistVisits(list);
      recalcPersonVisitInfo(list);
      loadAll();
    },
  });
}

// 添加回访示例附件
function addVisitAttachment(type) {
  if (type === 'image') {
    visitForm.attachments.push('/static/mock/visit_photo.png');
  } else {
    visitForm.attachments.push('/static/mock/visit_audio.mp3');
  }
}

// 打开档案编辑表单
function openProfileForm() {
  profileForm.gender = profile.value?.basic?.gender || '未知';
  profileForm.birthday = profile.value?.basic?.birthday || '';
  profileForm.fullIdNo = profile.value?.basic?.fullIdNo || '';
  profileForm.domicile = profile.value?.basic?.domicile || '';
  profileForm.job = profile.value?.basic?.job || '';
  profileForm.riskFactors = profile.value?.riskFactors ? [...profile.value.riskFactors] : [];
  profileForm.idCardPhotos = profile.value?.idCardPhotos ? [...profile.value.idCardPhotos] : [];
  profileForm.portraitPhotos = profile.value?.portraitPhotos ? [...profile.value.portraitPhotos] : [];
  profileFormVisible.value = true;
}

// 关闭档案编辑表单
function closeProfileForm() {
  profileFormVisible.value = false;
}

// 切换风险因素选择
function toggleRiskFactor(item) {
  if (profileForm.riskFactors.includes(item)) {
    profileForm.riskFactors = profileForm.riskFactors.filter((t) => t !== item);
  } else {
    profileForm.riskFactors.push(item);
  }
}

// 添加身份证示例照片
function addIdPhoto(type) {
  if (type === 'front') {
    profileForm.idCardPhotos = ['/static/mock/id_front.png', profileForm.idCardPhotos[1]].filter(Boolean);
  } else {
    profileForm.idCardPhotos = [profileForm.idCardPhotos[0], '/static/mock/id_back.png'].filter(Boolean);
  }
}

// 添加人像示例照片
function addPortraitPhoto() {
  profileForm.portraitPhotos = [...profileForm.portraitPhotos, '/static/mock/portrait.png'];
}

// 保存档案信息
function saveProfile() {
  const payload = {
    personId: personId.value,
    basic: {
      gender: profileForm.gender,
      birthday: profileForm.birthday,
      domicile: profileForm.domicile,
      job: profileForm.job,
      fullIdNo: profileForm.fullIdNo,
    },
    riskFactors: [...profileForm.riskFactors],
    idCardPhotos: [...profileForm.idCardPhotos],
    portraitPhotos: [...profileForm.portraitPhotos],
    updatedAt: Date.now(),
  };
  persistProfile(payload);
  profileFormVisible.value = false;
  uni.showToast({ title: '已保存', icon: 'success' });
  loadAll();
}

// 打开新增管控措施表单
function openAddMeasure() {
  measureFormMode.value = 'add';
  editingMeasureId.value = '';
  measureForm.types = [];
  measureForm.status = '执行中';
  measureForm.startDate = '';
  measureForm.endDate = '';
  measureForm.remark = '';
  measureFormVisible.value = true;
}

// 打开编辑管控措施表单
function openEditMeasure(item) {
  measureFormMode.value = 'edit';
  editingMeasureId.value = item.measureId;
  measureForm.types = item.types ? [...item.types] : [];
  measureForm.status = item.status || '执行中';
  measureForm.startDate = item.startDate || '';
  measureForm.endDate = item.endDate || '';
  measureForm.remark = item.remark || '';
  measureFormVisible.value = true;
}

// 关闭管控措施表单
function closeMeasureForm() {
  measureFormVisible.value = false;
}

// 切换措施类型选择
function toggleMeasureType(item) {
  if (measureForm.types.includes(item)) {
    measureForm.types = measureForm.types.filter((t) => t !== item);
  } else {
    measureForm.types.push(item);
  }
}

// 保存管控措施
function saveMeasure() {
  if (!measureForm.types.length) {
    uni.showToast({ title: '请选择措施类型', icon: 'none' });
    return;
  }
  const list = getKeyPersonMeasures();
  const now = Date.now();
  if (measureFormMode.value === 'add') {
    list.unshift({
      measureId: `measure_${Date.now()}`,
      personId: personId.value,
      types: [...measureForm.types],
      status: measureForm.status,
      startDate: measureForm.startDate,
      endDate: measureForm.endDate,
      remark: measureForm.remark,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const idx = list.findIndex((m) => m.measureId === editingMeasureId.value);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        types: [...measureForm.types],
        status: measureForm.status,
        startDate: measureForm.startDate,
        endDate: measureForm.endDate,
        remark: measureForm.remark,
        updatedAt: now,
      };
    }
  }
  persistMeasures(list);
  measureFormVisible.value = false;
  uni.showToast({ title: '已保存', icon: 'success' });
  loadAll();
}

// 打开管控措施操作菜单
function openMeasure(item) {
  uni.showActionSheet({
    itemList: ['查看', '编辑', '删除', '取消'],
    success: (res) => {
      if (res.tapIndex === 0) {
        measureView.value = item;
        measureViewVisible.value = true;
      }
      if (res.tapIndex === 1) openEditMeasure(item);
      if (res.tapIndex === 2) confirmDeleteMeasure(item);
    },
  });
}

// 确认删除管控措施
function confirmDeleteMeasure(item) {
  uni.showModal({
    title: '删除措施',
    content: '确认删除该管控措施？',
    success: (res) => {
      if (!res.confirm) return;
      const list = getKeyPersonMeasures().filter((m) => m.measureId !== item.measureId);
      persistMeasures(list);
      loadAll();
    },
  });
}

// 更新顶部概览回访信息
function updatePersonByVisit(visitAt, nextVisitDue, riskLevel) {
  if (!person.value) return;
  const updated = {
    ...person.value,
    lastVisitAt: visitAt,
    nextVisitDue,
  };
  if (riskLevel) updated.riskLevel = riskLevel;
  persistPersons(updated);
  person.value = updated;
}

// 删除回访后重算顶部回访信息
function recalcPersonVisitInfo(list) {
  const personVisits = list.filter((v) => v.personId === personId.value);
  if (!person.value) return;
  if (!personVisits.length) {
    const updated = { ...person.value, lastVisitAt: '', nextVisitDue: '' };
    persistPersons(updated);
    person.value = updated;
    return;
  }
  const sorted = personVisits.slice().sort((a, b) => (a.visitAt < b.visitAt ? 1 : -1));
  const latest = sorted[0];
  const updated = {
    ...person.value,
    lastVisitAt: latest.visitAt,
    nextVisitDue: latest.nextVisitDue || calcNextVisitDue(latest.visitAt),
  };
  persistPersons(updated);
  person.value = updated;
}

// 按频率计算下次回访日期
function calcNextVisitDue(visitAt) {
  const base = visitAt ? new Date(String(visitAt).replace(/-/g, '/')) : new Date();
  const freq = person.value?.visitFreqDays || 7;
  const next = new Date(base.getTime() + freq * 86400000);
  return formatDate(next.getTime());
}

// 格式化日期
function formatDate(time) {
  if (!time) return '';
  const date = new Date(time);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 格式化日期时间
function formatDateTime(time) {
  const date = new Date(time);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

// 管控措施状态样式
function measureStatusClass(status) {
  if (status === '已完成') return 'done';
  if (status === '暂停') return 'warn';
  return 'doing';
}

onLoad((query) => {
  personId.value = query.personId || '';
});

onShow(loadAll);
</script>
<style lang="scss" scoped>
.person-detail {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
  .statuBar { height: 40rpx; }
  .card {
    background: rgba(255, 255, 255, 0.92);
    border-radius: 16rpx;
    padding: 18rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
    margin-bottom: 16rpx;
  }
  .overview {
    .name {
      font-size: 40rpx;
      font-weight: 700;
      color: #1f2b3a;
    }
    .info {
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 26rpx;
        color: #1f2b3a;
        margin: 6rpx 0;
        .danger { color: #d64545; }
        .warn { color: #c88719; }
      }
    }
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8rpx;
    margin-bottom: 12rpx;
    .tab {
      background: #f6f8fb;
      border-radius: 12rpx;
      padding: 10rpx 6rpx;
      text-align: center;
      font-size: 24rpx;
      color: #4f5a68;
      position: relative;
      .icon { display: block; font-size: 28rpx; margin-bottom: 4rpx; }
      .badge {
        position: absolute;
        top: 6rpx;
        right: 8rpx;
        background: #ff5d5d;
        color: #fff;
        border-radius: 12rpx;
        font-size: 20rpx;
        padding: 2rpx 6rpx;
      }
      &.active {
        background: #eaf3ff;
        color: #0f75ff;
      }
    }
  }
  .tab-panel {
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10rpx;
      .panel-title { font-size: 30rpx; font-weight: 700; }
    }
    .panel-title { font-size: 30rpx; font-weight: 700; margin-bottom: 10rpx; }
    .record {
      padding: 12rpx 0;
      border-bottom: 1px solid #f1f3f5;
      .record-top {
        display: flex;
        justify-content: space-between;
        font-size: 26rpx;
        color: #1f2b3a;
      }
      .record-content {
        margin-top: 6rpx;
        font-size: 26rpx;
        color: #4f5a68;
      }
      .record-meta {
        margin-top: 6rpx;
        display: flex;
        justify-content: space-between;
        font-size: 24rpx;
        color: #6e7a89;
      }
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10rpx;
      .item {
        background: #f6f8fb;
        padding: 10rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        display: flex;
        justify-content: space-between;
      }
    }
    .sectionCard {
      background: #f6f8fb;
      border-radius: 14rpx;
      padding: 14rpx;
    }
    .section {
      margin-top: 12rpx;
      .section-title { font-size: 26rpx; font-weight: 600; margin-bottom: 6rpx; }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8rpx;
        .chip {
          padding: 6rpx 12rpx;
          border-radius: 12rpx;
          font-size: 24rpx;
          background: #f6f8fb;
        }
        .chip.active {
          background: #eaf3ff;
          color: #0f75ff;
        }
      }
      .remark { font-size: 26rpx; color: #4f5a68; }
    }
    .photo-row,
    .photoRow {
      display: flex;
      gap: 8rpx;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 6rpx;
      font-size: 24rpx;
      color: #6e7a89;
    }
    .photo-thumb {
      width: 80rpx;
      height: 80rpx;
      border-radius: 10rpx;
      background: #e9edf2;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10rpx;
      .stat {
        background: #f6f8fb;
        border-radius: 12rpx;
        padding: 12rpx;
        text-align: center;
        .num { font-size: 32rpx; font-weight: 700; color: #0f75ff; }
        .label { font-size: 24rpx; color: #4f5a68; margin-top: 4rpx; }
      }
    }
    .empty {
      text-align: center;
      color: #97a1ad;
    }
    .edit-btn {
      color: #0f75ff;
      font-size: 24rpx;
    }
    .measure-card {
      background: #f6f8fb;
      border-radius: 12rpx;
      padding: 12rpx;
      margin-bottom: 10rpx;
    }
    .measure-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .measure-types {
      display: flex;
      flex-wrap: wrap;
      gap: 6rpx;
    }
    .measure-remark {
      margin-top: 6rpx;
      font-size: 24rpx;
      color: #4f5a68;
    }
    .measure-meta {
      margin-top: 6rpx;
      font-size: 22rpx;
      color: #8a96a3;
    }
    .status-badge {
      padding: 4rpx 10rpx;
      border-radius: 10rpx;
      font-size: 22rpx;
      background: #eaf3ff;
      color: #0f75ff;
    }
    .status-badge.warn {
      background: #fff6e6;
      color: #c88719;
    }
    .status-badge.done {
      background: #e6f7ed;
      color: #1b9d5d;
    }
  }
  .action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12rpx 24rpx 24rpx;
    background: #fff;
    border-top: 1px solid #eef1f4;
  }
  .action-btn {
    width: 100%;
    height: 84rpx;
    line-height: 84rpx;
    border-radius: 16rpx;
    font-size: 30rpx;
  }
  .modalMask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 30;
  }
  .modalCard {
    width: 640rpx;
    background: #fff;
    border-radius: 18rpx;
    padding: 20rpx;
  }
  .modalTitle {
    font-size: 30rpx;
    font-weight: 700;
    margin-bottom: 10rpx;
  }
  .formRow {
    margin-top: 10rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    font-size: 24rpx;
    color: #4f5a68;
  }
  .formLabel {
    color: #6e7a89;
    font-size: 24rpx;
  }
  .formInput {
    min-height: 64rpx;
    padding: 8rpx 12rpx;
    border-radius: 10rpx;
    background: #f6f8fb;
    font-size: 24rpx;
  }
  .modalActions {
    display: flex;
    gap: 12rpx;
    margin-top: 16rpx;
  }
  .btnCancel,
  .btnSave {
    flex: 1;
    border-radius: 12rpx;
    height: 72rpx;
    line-height: 72rpx;
    text-align: center;
    font-size: 26rpx;
  }
  .btnCancel {
    background: #f6f8fb;
    color: #4f5a68;
  }
  .btnSave {
    background: #0f75ff;
    color: #fff;
  }
  .ghost-btn {
    border: 1px solid #d0d6de;
    background: #fff;
    color: #1f2b3a;
    border-radius: 12rpx;
  }
}
</style>
