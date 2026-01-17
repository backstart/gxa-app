
<template>
  <view class="place-detail pageBg">
    <view class="statuBar"></view>

    <view class="card header-card" v-if="place">
      <view class="header-top">
        <view>
          <view class="place-name">{{ place.name }}</view>
          <view class="place-sub">KTV/夜场</view>
        </view>
      </view>

      <view class="info-grid">
        <view class="info-item">
          <text class="label">负责人</text>
          <text class="value">{{ place.ownerName || '--' }}</text>
        </view>
        <view class="info-item">
          <text class="label">电话</text>
          <text class="value link" @click="callPhone(place.ownerPhone)">{{ place.ownerPhone || '--' }}</text>
        </view>
        <view class="info-item" v-if="managerName">
          <text class="label">管理员</text>
          <text class="value">{{ managerName }}</text>
        </view>
        <view class="info-item" v-if="managerPhone">
          <text class="label">电话</text>
          <text class="value link" @click="callPhone(managerPhone)">{{ managerPhone }}</text>
        </view>
      </view>

      <view class="info-line">
        <text class="label">地址</text>
        <text class="value link" @click="copyAddress">{{ place.address }}</text>
      </view>
      <view class="info-line">
        <text class="label">最近走访</text>
        <text class="value">{{ place.lastVisitAt || '暂无记录' }}</text>
      </view>

      <com-tag :taglist="tagList"></com-tag>
    </view>

    <view v-if="!isTabScrollable" class="iconTabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['iconTabItem', activeTab === tab.key ? 'iconTabActive' : '']"
        @click="activeTab = tab.key"
      >
        <text class="iconTabIcon">{{ tab.icon }}</text>
        <text class="iconTabLabel">{{ tab.label }}</text>
        <text v-if="tab.badge" class="iconTabBadge">{{ tab.badge }}</text>
      </view>
    </view>
    <scroll-view v-else class="iconTabsScroll" scroll-x>
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['iconTabItemFixed', activeTab === tab.key ? 'iconTabActive' : '']"
        @click="activeTab = tab.key"
      >
        <text class="iconTabIcon">{{ tab.icon }}</text>
        <text class="iconTabLabel">{{ tab.label }}</text>
        <text v-if="tab.badge" class="iconTabBadge">{{ tab.badge }}</text>
      </view>
    </scroll-view>

    <view class="card tab-card">
      <view v-if="activeTab === 'records'">
        <view v-if="recordList.length === 0" class="empty">暂无检查记录</view>
        <view v-for="item in recordList" :key="item.id" class="listItem" @click="openRecord(item)">
          <image class="listItemImage" :src="item.img" mode="aspectFill"></image>
          <view class="listItemContent">
            <view class="listItemTitle">{{ item.title }}</view>
            <view class="listItemMeta">{{ item.maintxt }}</view>
            <view class="listItemMeta">检查时间：{{ item.time }} · 人员：{{ item.inspector }}</view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'staff'">
        <view class="filterBar">
          <view class="filterItem" @click="toggleFilter('type')">
            <text>{{ staffTypeFilter }}</text>
            <text class="filterArrow">▼</text>
          </view>
          <view class="filterItem" @click="toggleFilter('status')">
            <text>{{ staffStatusFilter }}</text>
            <text class="filterArrow">▼</text>
          </view>
        </view>
        <view v-if="filterOpen" class="filterMask" @click="filterOpen = ''"></view>
        <view v-if="filterOpen" class="filterPanel">
          <view
            v-for="item in filterOptions"
            :key="item"
            class="filterOption"
            @click="selectFilter(item)"
          >
            {{ item }}
          </view>
        </view>
        <view class="tabActionBar stats">
          <text>总人数 {{ staffStats.total }}</text>
          <text>在岗 {{ staffStats.onJob }}</text>
          <text>离职 {{ staffStats.offJob }}</text>
        </view>
        <view v-if="filteredStaffList.length === 0" class="empty">暂无从业人员信息</view>
        <view v-for="item in filteredStaffList" :key="item.id" class="listItem" @click="openStaff(item)">
          <image class="listItemImage" :src="item.thumb" mode="aspectFill"></image>
          <view class="listItemContent">
            <view class="listItemTitle">
              <text>{{ item.name }}</text>
              <text class="placeTag placeTagPrimary">{{ item.staffType }}</text>
              <text :class="['placeTag', statusTagClass(item.status)]">{{ item.status }}</text>
            </view>
            <view class="listItemMeta">
              <text class="link" @click.stop="callPhone(item.phone)">{{ item.phone || '--' }}</text>
              <text>证件 {{ item.idNoMasked || '--' }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'archive'">
        <view v-if="archiveItems.length === 0" class="empty">暂无档案</view>
        <view v-for="item in archiveItems" :key="item.id" class="listItem archiveItem" @click="openArchive(item)">
          <view class="listItemContent">
            <view class="listItemTitle archiveTitle">
              <view class="archiveTitleLeft">
                <text>{{ item.title }}</text>
                <text v-if="item.itemType === 'MODULE'" class="placeTag placeTagPrimary">模块</text>
              </view>
              <text v-if="item.rightText" :class="['archiveRight', archiveStatusClass(item.status)]">
                {{ item.rightText }}
              </text>
            </view>
            <view class="listItemMeta">{{ item.subTitle }}</view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'incidents'">
        <view v-if="incidents.length === 0" class="empty">暂无关联警情</view>
        <view v-for="item in incidents" :key="item.id" class="listItem" @click="openIncident(item)">
          <image class="listItemImage" src="/static/venue/关联警情.png" mode="aspectFill"></image>
          <view class="listItemContent">
            <view class="listItemTitle">{{ item.title }}</view>
            <view class="listItemMeta">{{ item.address }}</view>
            <view class="listItemMeta">{{ item.time || '--' }} · {{ item.riskLevel || '--' }}</view>
          </view>
        </view>
      </view>

      <view v-else>
        <view class="empty">暂无内容</view>
      </view>
    </view>

    <view class="action-bar" v-if="actionVisible">
      <button type="primary" class="action-btn" @click="handleAction">{{ actionLabel }}</button>
    </view>

    <view v-if="staffFormVisible" class="modalMask" @click.self="closeStaffForm">
      <view class="modalCard">
        <view class="modalTitle">{{ staffFormMode === 'add' ? '新增从业人员' : '编辑从业人员' }}</view>
        <view class="formRow">
          <text class="formLabel">姓名</text>
          <input class="formInput" v-model="staffForm.name" placeholder="必填" />
        </view>
        <view class="formRow">
          <text class="formLabel">性别</text>
          <picker :range="genderOptions" @change="(e)=> staffForm.gender = genderOptions[e.detail.value]">
            <view class="formInput">{{ staffForm.gender }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">人员类型</text>
          <picker :range="staffTypeOptions.slice(1)" @change="(e)=> staffForm.staffType = staffTypeOptions.slice(1)[e.detail.value]">
            <view class="formInput">{{ staffForm.staffType }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">状态</text>
          <picker :range="staffStatusOptions.slice(1)" @change="(e)=> staffForm.status = staffStatusOptions.slice(1)[e.detail.value]">
            <view class="formInput">{{ staffForm.status }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">电话</text>
          <input class="formInput" v-model="staffForm.phone" placeholder="可选" />
        </view>
        <view class="formRow">
          <text class="formLabel">身份证号</text>
          <input class="formInput" v-model="staffForm.idNo" placeholder="可选，自动脱敏" />
        </view>
        <view class="formRow">
          <text class="formLabel">身份证照片</text>
          <view class="photoRow">
            <button size="mini" class="tabActionBtn ghost" @click="addIdPhoto('front')">正面示例</button>
            <button size="mini" class="tabActionBtn ghost" @click="addIdPhoto('back')">反面示例</button>
          </view>
        </view>
        <view class="formRow">
          <text class="formLabel">个人照片</text>
          <button size="mini" class="tabActionBtn ghost" @click="addPortrait">添加示例</button>
        </view>
        <view class="formRow">
          <text class="formLabel">备注</text>
          <textarea class="formInput textarea" v-model="staffForm.remark" placeholder="可选"></textarea>
        </view>
        <view class="modalActions">
          <button class="btnCancel" @click="closeStaffForm">取消</button>
          <button class="btnSave" @click="saveStaff">保存</button>
        </view>
      </view>
    </view>

    <view v-if="archiveFormVisible" class="modalMask" @click.self="closeArchiveForm">
      <view class="modalCard">
        <view class="modalTitle">{{ archiveFormMode === 'add' ? '新增档案' : '编辑档案' }}</view>
        <view class="formRow">
          <text class="formLabel">类型</text>
          <picker :range="docTypeOptions" @change="(e)=> archiveForm.docType = docTypeOptions[e.detail.value]">
            <view class="formInput">{{ archiveForm.docType || '请选择' }}</view>
          </picker>
        </view>
        <view class="formRow">
          <text class="formLabel">编号</text>
          <input class="formInput" v-model="archiveForm.docNo" placeholder="可选" />
        </view>
        <view class="formRow">
          <text class="formLabel">到期日期</text>
          <picker mode="date" @change="(e)=> archiveForm.dueDate = e.detail.value">
            <view class="formInput">{{ archiveForm.dueDate || '请选择' }}</view>
          </picker>
        </view>
        <view class="formRow switchRow">
          <text class="formLabel">示例图片</text>
          <switch :checked="archiveForm.photos.length > 0" @change="(e)=> toggleArchivePhoto(e.detail.value)" />
        </view>
        <view class="formRow">
          <text class="formLabel">备注</text>
          <textarea class="formInput textarea" v-model="archiveForm.note" placeholder="可选"></textarea>
        </view>
        <view class="modalActions">
          <button class="btnCancel" @click="closeArchiveForm">取消</button>
          <button class="btnSave" @click="saveArchive">保存</button>
        </view>
      </view>
    </view>
    <view v-if="staffDetailVisible" class="modalMask" @click.self="staffDetailVisible = false">
      <view class="modalCard">
        <view class="modalTitle">从业人员详情</view>
        <view class="formRow">
          <text class="formLabel">姓名</text>
          <text>{{ staffDetail?.name || '--' }}</text>
        </view>
        <view class="formRow">
          <text class="formLabel">性别</text>
          <text>{{ staffDetail?.gender || '未知' }}</text>
        </view>
        <view class="formRow">
          <text class="formLabel">类型</text>
          <text>{{ staffDetail?.staffType || '其他' }}</text>
        </view>
        <view class="formRow">
          <text class="formLabel">状态</text>
          <text>{{ staffDetail?.status || '在岗' }}</text>
        </view>
        <view class="formRow">
          <text class="formLabel">电话</text>
          <text>{{ staffDetail?.phone || '--' }}</text>
        </view>
        <view class="formRow">
          <text class="formLabel">证件</text>
          <text>{{ staffDetail?.idNoMasked || '--' }}</text>
        </view>
        <view class="formRow">
          <text class="formLabel">身份证照片</text>
          <view class="photoRow">
            <image v-for="(img, idx) in (staffDetail?.idCardPhotos || [])" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
            <text v-if="!(staffDetail?.idCardPhotos || []).length">--</text>
          </view>
        </view>
        <view class="formRow">
          <text class="formLabel">个人照片</text>
          <view class="photoRow">
            <image v-for="(img, idx) in (staffDetail?.portraitPhotos || [])" :key="idx" class="photoThumb" :src="img" mode="aspectFill"></image>
            <text v-if="!(staffDetail?.portraitPhotos || []).length">--</text>
          </view>
        </view>
        <view class="formRow">
          <text class="formLabel">备注</text>
          <text>{{ staffDetail?.remark || '--' }}</text>
        </view>
        <view class="modalActions">
          <button class="btnSave" @click="staffDetailVisible = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getPlaces, getPlaceProfiles, getPlaceVisits, getIncidents, savePlaceProfiles } from '@/common/database.js';

const placeId = ref('');
const place = ref(null);
const profile = ref(null);
const visits = ref([]);
const incidents = ref([]);
const activeTab = ref('');

const staffFormVisible = ref(false);
const archiveFormVisible = ref(false);
const staffFormMode = ref('add');
const archiveFormMode = ref('add');
const editingStaffId = ref('');
const editingArchiveId = ref('');
const staffDetailVisible = ref(false);
const staffDetail = ref(null);

const staffForm = reactive({
  name: '',
  gender: '未知',
  staffType: '保安',
  status: '在岗',
  phone: '',
  idNo: '',
  idNoMasked: '',
  idCardPhotos: [],
  portraitPhotos: [],
  remark: '',
});

const archiveForm = reactive({
  docType: '',
  docNo: '',
  dueDate: '',
  note: '',
  photos: [],
});

const docTypeOptions = ['营业执照', '特行许可', '消防检查', '健康证', '其他'];
const genderOptions = ['男', '女', '未知'];
const staffTypeOptions = ['全部', '保安', '前台', '服务员', '经理', '收银', '保洁', '其他'];
const staffStatusOptions = ['全部', '在岗', '离职', '请假', '临时'];
const staffTypeFilter = ref('全部');
const staffStatusFilter = ref('全部');
const filterOpen = ref('');

const filterOptions = computed(() => {
  if (filterOpen.value === 'type') return staffTypeOptions;
  if (filterOpen.value === 'status') return staffStatusOptions;
  return [];
});

const managerName = computed(() => place.value?.managerName || place.value?.manager?.name || '');
const managerPhone = computed(() => place.value?.managerPhone || place.value?.manager?.phone || '');

const riskFlagsText = computed(() => {
  const list = profile.value?.primary?.riskFlags || [];
  return list.length ? list.join(' / ') : '--';
});

const staffList = computed(() => {
  const members = profile.value?.primary?.staffMembers || [];
  if (members.length) {
    return members.map((item) => ({
      id: item.id,
      name: item.name,
      gender: item.gender || '未知',
      staffType: item.staffType || '其他',
      status: item.status || '在岗',
      phone: item.phone || '',
      idNoMasked: item.idNoMasked || '',
      idCardPhotos: item.idCardPhotos || [],
      portraitPhotos: item.portraitPhotos || [],
      remark: item.remark || '',
      time: item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 10) : new Date(item.createdAt || Date.now()).toISOString().slice(0, 10),
      thumb: '/static/venue/人员信息.png',
    }));
  }
  const count = profile.value?.primary?.securityCount || 0;
  const list = [];
  const total = Math.min(count || 0, 6);
  for (let i = 0; i < total; i += 1) {
    list.push({
      id: `mock-staff-${i}`,
      name: `安保${i + 1}号`,
      gender: '未知',
      staffType: '保安',
      status: '在岗',
      phone: '',
      idNoMasked: '',
      idCardPhotos: [],
      portraitPhotos: [],
      remark: '',
      time: '2025-09-01',
      thumb: '/static/venue/人员信息.png',
    });
  }
  return list;
});

const filteredStaffList = computed(() => {
  return staffList.value.filter((item) => {
    const typeOk = staffTypeFilter.value === '全部' || item.staffType === staffTypeFilter.value;
    const statusOk = staffStatusFilter.value === '全部' || item.status === staffStatusFilter.value;
    return typeOk && statusOk;
  });
});

const staffStats = computed(() => {
  const list = staffList.value;
  return {
    total: list.length,
    onJob: list.filter((s) => s.status === '在岗').length,
    offJob: list.filter((s) => s.status === '离职').length,
  };
});

const tags = computed(() => {
  const list = [];
  if (place.value?.focusLevel === '重点') list.push('重点场所');
  if (place.value?.focusLevel === '最小应急单位') list.push('最小应急单位');
  (profile.value?.primary?.riskFlags || []).forEach((t) => list.push(t));
  (place.value?.modules || []).forEach((m) => list.push(moduleLabel(m)));
  return Array.from(new Set(list));
});

const tagList = computed(() => tags.value.map((t) => ({ tag: t })));

const recordList = computed(() =>
  (visits.value.length ? visits.value : mockRecords).map((item, idx) => ({
    id: item.visitId || `record-${idx}`,
    title: item.title || '检查记录',
    maintxt: item.content || '暂无描述',
    img: '/static/venue/检查记录.png',
    time: item.visitAt || '--',
    inspector: item.visitorName || '--',
  }))
);

const mockRecords = [
  {
    visitId: 'mock-1',
    title: '安全检查',
    content: '抽查包厢与消防通道，未发现安全隐患。',
    visitAt: '2025-09-17 10:20',
    visitorName: '张三、李四',
  },
  {
    visitId: 'mock-2',
    title: '证照核验',
    content: '证照信息齐全，特行许可未到期。',
    visitAt: '2025-09-05 15:10',
    visitorName: '王五',
  },
  {
    visitId: 'mock-3',
    title: '未成年人排查',
    content: '未发现未成年人入内，登记台账完整。',
    visitAt: '2025-08-28 20:30',
    visitorName: '赵六',
  },
];

const archiveItems = computed(() => buildArchiveItems());

const tabs = computed(() => {
  const base = [
    { key: 'records', label: '检查记录', icon: '📋', badge: visits.value.length || '' },
    { key: 'staff', label: '从业人员', icon: '👥', badge: staffList.value.length || '' },
    { key: 'archive', label: '档案', icon: '📁', badge: expiringCount.value || '' },
    { key: 'incidents', label: '关联警情', icon: '📌', badge: incidents.value.length || '' },
  ];
  return base;
});

const expiringCount = computed(() => {
  return archiveItems.value.filter((item) => item.itemType === 'LICENSE' && daysTo(item.rightText) <= 30).length;
});

const isTabScrollable = computed(() => tabs.value.length > 4);

const actionLabel = computed(() => {
  if (activeTab.value === 'records') return '新增走访';
  if (activeTab.value === 'staff') return '新增从业人员';
  if (activeTab.value === 'archive') return '新增档案';
  if (activeTab.value === 'incidents') return '新增关联警情';
  return '';
});

const actionVisible = computed(() => !!actionLabel.value);

// 加载场所、档案、走访与关联警情数据
function loadData() {
  place.value = getPlaces().find((p) => p.placeId === placeId.value) || null;
  profile.value = getPlaceProfiles().find((p) => p.placeId === placeId.value) || null;
  visits.value = getPlaceVisits().filter((v) => v.placeId === placeId.value).sort((a, b) => (a.visitAt < b.visitAt ? 1 : -1));
  incidents.value = getIncidents().slice(0, 4);
}

// 持久化当前场所档案并刷新视图
function persistProfile() {
  const list = getPlaceProfiles();
  const current = profile.value || {
    placeId: placeId.value,
    primaryType: place.value?.primaryType || 'KTV',
    primary: {},
    modules: {},
  };
  current.primary = current.primary || {};
  current.modules = current.modules || {};
  const idx = list.findIndex((p) => p.placeId === placeId.value);
  if (idx >= 0) list[idx] = current;
  else list.unshift(current);
  savePlaceProfiles(list);
  loadData();
}

watch(tabs, (list) => {
  if (!list.length) return;
  if (!list.find((t) => t.key === activeTab.value)) {
    activeTab.value = list[0].key;
  }
}, { immediate: true });

// 映射模块类型到中文名称
function moduleLabel(type) {
  const map = { BILLIARD: '台球', CHESS_CARD: '棋牌', NETBAR: '网吧', FOOTBATH: '足浴', KTV: 'KTV' };
  return map[type] || type;
}

// 生成模块摘要字段用于展示
function moduleSummary(tabKey) {
  if (!tabKey.startsWith('module_')) return [];
  const type = tabKey.replace('module_', '');
  const data = profile.value?.modules?.[type];
  if (!data) return [];
  if (type === 'BILLIARD') return [{ label: '台球桌数', value: data.tableCount || 0 }, { label: '营业时间', value: data.businessHours || '--' }];
  if (type === 'CHESS_CARD') return [{ label: '麻将台数', value: data.mahjongTableCount || 0 }, { label: '棋牌包间', value: data.chessRoomCount || 0 }];
  if (type === 'NETBAR') return [{ label: '机位数', value: data.seatCount || 0 }, { label: '实名系统', value: data.realNameSystem || '--' }];
  if (type === 'FOOTBATH') return [{ label: '包间数', value: data.roomCount || 0 }, { label: '从业人数', value: data.staffCount || 0 }];
  return [];
}

// 跳转到对应模块详情页
function goModule(tabKey) {
  if (!tabKey.startsWith('module_')) return;
  const type = tabKey.replace('module_', '');
  const map = {
    BILLIARD: '/pages/place/modules/billiard',
    CHESS_CARD: '/pages/place/modules/chessCard',
    NETBAR: '/pages/place/modules/netbar',
    FOOTBATH: '/pages/place/modules/footbath',
  };
  const base = map[type];
  if (!base) {
    uni.showToast({ title: '暂无模块页', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `${base}?placeId=${placeId.value}` });
}

// 跳转新增走访页面
function goVisit() {
  uni.navigateTo({ url: `/pages/place/visit/add?placeId=${placeId.value}` });
}

// 跳转派单创建页并带入场所来源
function goDispatch() {
  uni.navigateTo({ url: `/pages/dispatch/assign?sourceType=KEY_PLACE&sourceId=${placeId.value}` });
}

// 底部主按钮动作分发
function handleAction() {
  if (activeTab.value === 'records') {
    goVisit();
    return;
  }
  if (activeTab.value === 'staff') {
    openAddStaff();
    return;
  }
  if (activeTab.value === 'archive') {
    openAddArchive();
    return;
  }
  if (activeTab.value === 'incidents') {
    uni.showToast({ title: '新增关联警情', icon: 'none' });
    return;
  }
}

// 拨打电话
function callPhone(phone) {
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone });
}

// 复制场所地址
function copyAddress() {
  if (!place.value?.address) return;
  uni.setClipboardData({ data: place.value.address });
}

// 查看走访/检查记录详情
function openRecord(item) {
  uni.showModal({ title: item.title || '检查记录', content: item.maintxt || '--', showCancel: false });
}

// 打开人员操作菜单
function openStaff(item) {
  uni.showActionSheet({
    itemList: ['查看详情', '编辑', '快速改状态', '删除', '取消'],
    success: (res) => {
      if (res.tapIndex === 0) openStaffDetail(item);
      if (res.tapIndex === 1) openEditStaff(item);
      if (res.tapIndex === 2) quickUpdateStaffStatus(item);
      if (res.tapIndex === 3) confirmDeleteStaff(item);
    },
  });
}

// 打开档案操作菜单
function openArchive(item) {
  uni.navigateTo({ url: `/pages/place/archive/detail?placeId=${placeId.value}&itemId=${item.id}` });
}

// 切换人员筛选下拉
function toggleFilter(key) {
  filterOpen.value = filterOpen.value === key ? '' : key;
}

// 选择人员筛选项并关闭下拉
function selectFilter(item) {
  if (filterOpen.value === 'type') {
    staffTypeFilter.value = item;
  } else if (filterOpen.value === 'status') {
    staffStatusFilter.value = item;
  }
  filterOpen.value = '';
}

// 查看关联警情摘要
function openIncident(item) {
  uni.showModal({ title: '关联警情', content: item.title || '--', showCancel: false });
}

// 打开新增人员弹窗并初始化表单
function openAddStaff() {
  staffFormMode.value = 'add';
  editingStaffId.value = '';
  staffForm.name = '';
  staffForm.gender = '未知';
  staffForm.staffType = '保安';
  staffForm.status = '在岗';
  staffForm.phone = '';
  staffForm.idNo = '';
  staffForm.idNoMasked = '';
  staffForm.idCardPhotos = [];
  staffForm.portraitPhotos = [];
  staffForm.remark = '';
  staffFormVisible.value = true;
}

// 打开编辑人员弹窗并回填表单
function openEditStaff(item) {
  ensureStaffMembersFromMock();
  staffFormMode.value = 'edit';
  editingStaffId.value = item.id;
  staffForm.name = item.name || '';
  staffForm.gender = item.gender || '未知';
  staffForm.staffType = item.staffType || '保安';
  staffForm.status = item.status || '在岗';
  staffForm.phone = item.phone || '';
  staffForm.idNo = '';
  staffForm.idNoMasked = item.idNoMasked || '';
  staffForm.idCardPhotos = item.idCardPhotos ? [...item.idCardPhotos] : [];
  staffForm.portraitPhotos = item.portraitPhotos ? [...item.portraitPhotos] : [];
  staffForm.remark = item.remark || '';
  staffFormVisible.value = true;
}

// 关闭人员表单弹窗
function closeStaffForm() {
  staffFormVisible.value = false;
}

// 保存人员信息到档案
function saveStaff() {
  if (!staffForm.name.trim()) {
    uni.showToast({ title: '请填写姓名', icon: 'none' });
    return;
  }
  if (staffForm.phone && !/^\d+$/.test(staffForm.phone)) {
    uni.showToast({ title: '电话需为数字', icon: 'none' });
    return;
  }
  const masked = maskIdNo(staffForm.idNo);
  const current = profile.value || { placeId: placeId.value, primaryType: place.value?.primaryType || 'KTV', primary: {}, modules: {} };
  current.primary = current.primary || {};
  current.primary.staffMembers = current.primary.staffMembers || [];
  const now = Date.now();
  if (staffFormMode.value === 'add') {
    current.primary.staffMembers.push({
      id: `staff_${Date.now()}`,
      name: staffForm.name,
      gender: staffForm.gender,
      staffType: staffForm.staffType,
      status: staffForm.status,
      phone: staffForm.phone,
      idNoMasked: masked,
      idCardPhotos: [...staffForm.idCardPhotos],
      portraitPhotos: [...staffForm.portraitPhotos],
      remark: staffForm.remark,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const idx = current.primary.staffMembers.findIndex((m) => m.id === editingStaffId.value);
    if (idx >= 0) {
      current.primary.staffMembers[idx] = {
        ...current.primary.staffMembers[idx],
        name: staffForm.name,
        gender: staffForm.gender,
        staffType: staffForm.staffType,
        status: staffForm.status,
        phone: staffForm.phone,
        idNoMasked: masked || current.primary.staffMembers[idx].idNoMasked,
        idCardPhotos: [...staffForm.idCardPhotos],
        portraitPhotos: [...staffForm.portraitPhotos],
        remark: staffForm.remark,
        updatedAt: now,
      };
    }
  }
  profile.value = current;
  persistProfile();
  staffFormVisible.value = false;
  uni.showToast({ title: '已保存', icon: 'success' });
}

// 确认并删除人员
function confirmDeleteStaff(item) {
  ensureStaffMembersFromMock();
  uni.showModal({
    title: '删除人员',
    content: '确认删除该从业人员？',
    success: (res) => {
      if (!res.confirm) return;
      const current = profile.value || { placeId: placeId.value, primaryType: place.value?.primaryType || 'KTV', primary: {}, modules: {} };
      current.primary = current.primary || {};
      current.primary.staffMembers = current.primary.staffMembers || [];
      current.primary.staffMembers = current.primary.staffMembers.filter((m) => m.id !== item.id);
      profile.value = current;
      persistProfile();
    },
  });
}

// 将 mock 人员转存到档案结构
function ensureStaffMembersFromMock() {
  if (profile.value?.primary?.staffMembers?.length) return;
  const mock = staffList.value.map((staff) => ({
    id: staff.id,
    name: staff.name,
    gender: staff.gender || '未知',
    staffType: staff.staffType || '保安',
    status: staff.status || '在岗',
    phone: staff.phone || '',
    idNoMasked: staff.idNoMasked || '',
    idCardPhotos: staff.idCardPhotos || [],
    portraitPhotos: staff.portraitPhotos || [],
    remark: staff.remark || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
  const current = profile.value || { placeId: placeId.value, primaryType: place.value?.primaryType || 'KTV', primary: {}, modules: {} };
  current.primary = current.primary || {};
  current.primary.staffMembers = mock;
  profile.value = current;
}

// 打开新增档案弹窗并初始化表单
function openAddArchive() {
  archiveFormMode.value = 'add';
  editingArchiveId.value = '';
  archiveForm.docType = '';
  archiveForm.docNo = '';
  archiveForm.dueDate = '';
  archiveForm.note = '';
  archiveForm.photos = [];
  archiveFormVisible.value = true;
}

// 打开编辑档案弹窗并回填表单
function openEditArchive(item) {
  ensureArchivesFromFallback();
  archiveFormMode.value = 'edit';
  editingArchiveId.value = item.id;
  const raw = item.raw || findArchiveById(item.id);
  archiveForm.docType = raw?.docType || item.title || '';
  archiveForm.docNo = raw?.docNo || '';
  archiveForm.dueDate = raw?.dueDate || '';
  archiveForm.note = raw?.note || '';
  archiveForm.photos = raw?.photos ? [...raw.photos] : [];
  archiveFormVisible.value = true;
}

// 关闭档案弹窗
function closeArchiveForm() {
  archiveFormVisible.value = false;
}

// 保存档案并同步主档案字段
function saveArchive() {
  if (!archiveForm.docType) {
    uni.showToast({ title: '请选择档案类型', icon: 'none' });
    return;
  }
  const current = profile.value || { placeId: placeId.value, primaryType: place.value?.primaryType || 'KTV', primary: {}, modules: {} };
  current.primary = current.primary || {};
  current.primary.archives = current.primary.archives || [];
  const payload = {
    id: archiveFormMode.value === 'add' ? `archive_${Date.now()}` : editingArchiveId.value,
    docType: archiveForm.docType,
    docNo: archiveForm.docNo,
    dueDate: archiveForm.dueDate,
    note: archiveForm.note,
    photos: archiveForm.photos,
    updatedAt: Date.now(),
  };
  if (archiveFormMode.value === 'add') {
    current.primary.archives.unshift(payload);
  } else {
    const idx = current.primary.archives.findIndex((m) => m.id === editingArchiveId.value);
    if (idx >= 0) current.primary.archives[idx] = { ...current.primary.archives[idx], ...payload };
  }
  applyArchiveToPrimary(current.primary, payload);
  profile.value = current;
  persistProfile();
  archiveFormVisible.value = false;
  uni.showToast({ title: '已保存', icon: 'success' });
}

// 确认并删除档案
function confirmDeleteArchive(item) {
  ensureArchivesFromFallback();
  uni.showModal({
    title: '删除档案',
    content: '确认删除该档案？',
    success: (res) => {
      if (!res.confirm) return;
      const current = profile.value || { placeId: placeId.value, primaryType: place.value?.primaryType || 'KTV', primary: {}, modules: {} };
      current.primary = current.primary || {};
      current.primary.archives = current.primary.archives || [];
      current.primary.archives = current.primary.archives.filter((m) => m.id !== item.id);
      if (item.title === '营业执照' && current.primary.businessLicenseNo === item.raw?.docNo) {
        current.primary.businessLicenseNo = '';
        current.primary.businessLicenseDue = '';
      }
      if (item.title === '特行许可' && current.primary.specialLicenseNo === item.raw?.docNo) {
        current.primary.specialLicenseNo = '';
        current.primary.specialLicenseDue = '';
      }
      profile.value = current;
      persistProfile();
    },
  });
}

// 将 fallback 档案转存到档案结构
function ensureArchivesFromFallback() {
  if (profile.value?.primary?.archives?.length) return;
  const current = profile.value || { placeId: placeId.value, primaryType: place.value?.primaryType || 'KTV', primary: {}, modules: {} };
  current.primary = current.primary || {};
  current.primary.archives = buildFallbackArchives().map((item) => ({
    id: item.id,
    docType: item.title,
    docNo: item.docNo || '',
    dueDate: item.dueDate || '',
    note: item.note || '',
    photos: item.photos || [],
    updatedAt: new Date().toISOString(),
  }));
  profile.value = current;
}

// 按 id 查找档案
function findArchiveById(id) {
  return profile.value?.primary?.archives?.find((m) => m.id === id);
}

// 快速切换档案示例图片
function toggleArchivePhoto(enable) {
  if (enable && archiveForm.photos.length === 0) {
    archiveForm.photos.push('/static/venue/档案.png');
  }
  if (!enable) {
    archiveForm.photos = [];
  }
}

// 添加身份证示例图片
function addIdPhoto(type) {
  if (type === 'front') {
    staffForm.idCardPhotos = ['/static/mock/id_front.png', staffForm.idCardPhotos[1]].filter(Boolean);
  } else {
    staffForm.idCardPhotos = [staffForm.idCardPhotos[0], '/static/mock/id_back.png'].filter(Boolean);
  }
}

// 添加个人示例照片
function addPortrait() {
  staffForm.portraitPhotos = [...staffForm.portraitPhotos, '/static/mock/portrait.png'];
}

// 打开人员详情弹窗
function openStaffDetail(item) {
  staffDetail.value = item;
  staffDetailVisible.value = true;
}

// 快速更新人员状态
function quickUpdateStaffStatus(item) {
  const options = staffStatusOptions.slice(1);
  uni.showActionSheet({
    itemList: options,
    success: (res) => {
      const status = options[res.tapIndex];
      const current = profile.value || { placeId: placeId.value, primaryType: place.value?.primaryType || 'KTV', primary: {}, modules: {} };
      current.primary = current.primary || {};
      current.primary.staffMembers = current.primary.staffMembers || [];
      const idx = current.primary.staffMembers.findIndex((m) => m.id === item.id);
      if (idx >= 0) {
        current.primary.staffMembers[idx] = { ...current.primary.staffMembers[idx], status, updatedAt: Date.now() };
        profile.value = current;
        persistProfile();
        uni.showToast({ title: '状态已更新', icon: 'success' });
      }
    },
  });
}

// 构建档案列表项
function buildArchiveItems() {
  const items = [];
  const primary = profile.value?.primary || {};
  const archives = primary.archives || [];
  const licenseItems = archives.length ? archives.map((item) => ({
    id: item.id,
    itemType: 'LICENSE',
    title: item.docType || '证照',
    subTitle: `编号：${item.docNo || '—'}`,
    rightText: item.dueDate || '',
    status: dueStatus(item.dueDate),
    payload: item,
  })) : buildFallbackArchives().map((item) => ({
    id: item.id,
    itemType: 'LICENSE',
    title: item.title,
    subTitle: item.docNo ? `编号：${item.docNo}` : '编号：—',
    rightText: item.dueDate || '',
    status: dueStatus(item.dueDate),
    payload: item,
  }));
  items.push(...licenseItems);

  items.push({
    id: 'basic_info',
    itemType: 'BASIC',
    title: '基础信息',
    subTitle: `包厢 ${primary.roomCount || '--'}｜安保 ${primary.securityCount || '--'}｜营业 ${primary.businessHours || '--'}`,
    rightText: '',
    status: '',
    payload: {
      roomCount: primary.roomCount,
      securityCount: primary.securityCount,
      businessHours: primary.businessHours,
      fireCheckDate: primary.fireCheckDate,
    },
  });

  const moduleKeys = new Set([
    ...((place.value?.modules || []) || []),
    ...Object.keys(profile.value?.modules || {}),
  ]);
  const moduleList = Array.from(moduleKeys);
  moduleList.forEach((type) => {
    const data = profile.value?.modules?.[type] || {};
    items.push({
      id: `module_${type}`,
      itemType: 'MODULE',
      title: `${moduleLabel(type)}模块`,
      subTitle: moduleSubTitle(type, data),
      rightText: '',
      status: '',
      payload: data,
    });
  });
  return items;
}

function moduleSubTitle(type, data) {
  if (!data || Object.keys(data).length === 0) return '待完善';
  if (type === 'CHESS_CARD') {
    const mahjong = data.mahjongTableCount ?? '--';
    const chess = data.chessRoomCount ?? '--';
    return `麻将台 ${mahjong}｜棋牌包间 ${chess}`;
  }
  if (type === 'BILLIARD') {
    const count = data.tableCount ?? '--';
    return `台球桌 ${count}`;
  }
  if (type === 'NETBAR') {
    const count = data.seatCount ?? '--';
    return `机位 ${count}`;
  }
  if (type === 'FOOTBATH') {
    const rooms = data.roomCount ?? '--';
    const staff = data.staffCount ?? '--';
    return `包间 ${rooms}｜从业 ${staff}`;
  }
  return '待完善';
}

function dueStatus(dateStr) {
  if (!dateStr) return '';
  const days = daysTo(dateStr);
  if (days <= 7) return 'danger';
  if (days <= 30) return 'warn';
  return '';
}

function archiveStatusClass(status) {
  if (status === 'danger') return 'archiveDanger';
  if (status === 'warn') return 'archiveWarn';
  return '';
}

// 生成 fallback 档案列表
function buildFallbackArchives() {
  const arr = [];
  arr.push({
    id: 'archive-1',
    title: '营业执照',
    docNo: profile.value?.primary?.businessLicenseNo || '',
    dueDate: profile.value?.primary?.businessLicenseDue || '',
    note: '',
    photos: [],
    img: '/static/venue/档案.png',
    maintxt: `编号：${profile.value?.primary.businessLicenseNo || '--'}，到期：${profile.value?.primary.businessLicenseDue || '--'}`,
    docNoText: profile.value?.primary.businessLicenseNo ? `编号：${profile.value?.primary.businessLicenseNo}` : '编号：--',
  });
  arr.push({
    id: 'archive-2',
    title: '特行许可',
    docNo: profile.value?.primary?.specialLicenseNo || '',
    dueDate: profile.value?.primary?.specialLicenseDue || '',
    note: '',
    photos: [],
    img: '/static/venue/档案.png',
    maintxt: `编号：${profile.value?.primary.specialLicenseNo || '--'}，到期：${profile.value?.primary.specialLicenseDue || '--'}`,
    docNoText: profile.value?.primary.specialLicenseNo ? `编号：${profile.value?.primary.specialLicenseNo}` : '编号：--',
  });
  arr.push({
    id: 'archive-3',
    title: '消防检查',
    docNo: '',
    dueDate: profile.value?.primary?.fireCheckDate || '',
    note: '',
    photos: [],
    img: '/static/venue/档案.png',
    maintxt: `检查日期：${profile.value?.primary.fireCheckDate || '--'}`,
    docNoText: '编号：--',
  });
  return arr;
}

// 将档案字段同步到主档案信息
function applyArchiveToPrimary(primary, payload) {
  if (payload.docType === '营业执照') {
    primary.businessLicenseNo = payload.docNo;
    primary.businessLicenseDue = payload.dueDate;
  }
  if (payload.docType === '特行许可') {
    primary.specialLicenseNo = payload.docNo;
    primary.specialLicenseDue = payload.dueDate;
  }
  if (payload.docType === '消防检查') {
    primary.fireCheckDate = payload.dueDate || primary.fireCheckDate || '';
  }
}

// 身份证号脱敏
function maskIdNo(idNo) {
  if (!idNo) return '';
  const clean = idNo.trim();
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)}********${clean.slice(-4)}`;
}

// 返回状态标签样式
function statusTagClass(status) {
  if (status === '在岗') return 'placeTagNormal';
  if (status === '离职') return 'placeTagWarning';
  if (status === '请假') return 'placeTagPrimary';
  return 'placeTagWarning';
}

// 复制档案摘要
function copyArchiveSummary(item) {
  const docNo = item.raw?.docNo || '';
  const due = item.raw?.dueDate || '';
  const text = `【${item.title}】编号${docNo || '--'} 到期${due || '--'}`;
  uni.setClipboardData({ data: text });
}

// 计算距离日期的天数
function daysTo(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  const target = new Date(`${dateStr} 00:00:00`);
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

// 返回到期时间的颜色样式
function dueClass(dateStr) {
  const days = daysTo(dateStr);
  if (days <= 7) return 'infoValueDanger';
  if (days <= 30) return 'infoValueWarning';
  return '';
}

onLoad((query) => {
  placeId.value = query.placeId || '';
});

onShow(loadData);
</script>
<style lang="scss" scoped>
.place-detail {
  min-height: 100vh;
  padding: 0 24rpx 140rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 16rpx;
}
.header-card {
  padding: 20rpx;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}
.place-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2b3a;
}
.place-sub {
  margin-top: 6rpx;
  color: #6e7a89;
  font-size: 24rpx;
}
.header-actions {
  display: flex;
  gap: 8rpx;
}
.ghost-btn {
  border: 1px solid #d0d6de;
  background: #fff;
  color: #1f2b3a;
  border-radius: 12rpx;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx 20rpx;
}
.info-item {
  display: flex;
  flex-direction: column;
}
.info-line {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
}
.label {
  color: #6b7785;
  font-size: 24rpx;
}
.value {
  color: #1f2b3a;
  font-size: 26rpx;
}
.value.link {
  color: #0f75ff;
}
.link {
  color: #0f75ff;
}
.sectionCard {
  background: #f6f8fb;
  border-radius: 14rpx;
  padding: 14rpx;
  margin-bottom: 12rpx;
}
.infoGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
}
.infoItem {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.infoLabel {
  color: #6b7785;
  font-size: 22rpx;
}
.infoValue {
  color: #1f2b3a;
  font-size: 24rpx;
}
.infoValueWarning {
  color: #c88719;
}
.infoValueDanger {
  color: #d64545;
}
.iconTabs {
  display: flex;
  gap: 12rpx;
  padding: 6rpx 6rpx 12rpx;
}
.iconTabsScroll {
  padding: 6rpx 6rpx 12rpx;
  white-space: nowrap;
}
.iconTabItem,
.iconTabItemFixed {
  background: #f6f8fb;
  border-radius: 16rpx;
  padding: 12rpx;
  text-align: center;
  position: relative;
}
.iconTabItem {
  flex: 1;
  min-width: 0;
}
.iconTabItemFixed {
  display: inline-block;
  width: 180rpx;
  margin-right: 12rpx;
}
.iconTabActive {
  background: #eaf3ff;
  color: #0f75ff;
}
.iconTabIcon {
  font-size: 32rpx;
  display: block;
}
.iconTabLabel {
  font-size: 24rpx;
  margin-top: 4rpx;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.iconTabBadge {
  position: absolute;
  top: -6rpx;
  right: 18rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  border-radius: 12rpx;
  padding: 2rpx 8rpx;
}
.tab-card {
  padding: 10rpx 18rpx 18rpx;
}
.tabActionBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  margin-bottom: 10rpx;
}
.tabActionBar.stats {
  justify-content: flex-start;
  color: #6e7a89;
  font-size: 24rpx;
  gap: 20rpx;
}
.filterBar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 10rpx;
}
.filterItem {
  flex: 1;
  background: #f6f8fb;
  border-radius: 12rpx;
  padding: 12rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1f2b3a;
  font-size: 24rpx;
}
.filterArrow {
  color: #8a96a3;
  font-size: 20rpx;
}
.filterMask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 20;
}
.filterPanel {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 340rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 12rpx 0;
  z-index: 21;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.12);
}
.filterOption {
  padding: 14rpx 24rpx;
  font-size: 26rpx;
  color: #1f2b3a;
}
.tabFilters {
  display: flex;
  gap: 10rpx;
}
.tabActionBtn {
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 8rpx 14rpx;
  font-size: 24rpx;
  color: #1f2b3a;
}
.tabActionBtn.primary {
  background: #0f75ff;
  color: #fff;
}
.tabActionBtn.ghost {
  background: #fff;
  border: 1px solid #d0d6de;
}
.photoRow {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}
.photoThumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  background: #e9edf2;
}
.listItem {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1px solid #f1f3f5;
}
.listItem:last-child {
  border-bottom: none;
}
.listItemImage {
  width: 90rpx;
  height: 90rpx;
  border-radius: 12rpx;
  background: #e9edf2;
}
.listItemContent {
  flex: 1;
}
.listItemTitle {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2b3a;
  display: flex;
  gap: 8rpx;
  align-items: center;
}
.archiveItem {
  align-items: flex-start;
}
.archiveTitle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.archiveTitleLeft {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.archiveRight {
  font-size: 24rpx;
}
.archiveWarn {
  color: #c88719;
}
.archiveDanger {
  color: #d64545;
}
.listItemMeta {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6e7a89;
  display: flex;
  justify-content: space-between;
}
.placeTag {
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
}
.placeTagPrimary {
  background: #eaf3ff;
  color: #0f75ff;
}
.placeTagNormal {
  background: #e6f7ed;
  color: #1b9d5d;
}
.placeTagWarning {
  background: #fff6e6;
  color: #c88719;
}
.info-card {
  background: #f6f8fb;
  border-radius: 14rpx;
  padding: 14rpx;
}
.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.info-row .value.warn {
  color: #c88719;
}
.info-row .value.danger {
  color: #d64545;
}
.empty {
  text-align: center;
  color: #97a1ad;
  padding: 20rpx 0;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10rpx 20rpx 26rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -6rpx 16rpx rgba(0, 0, 0, 0.08);
}

.action-btn {
  width: 100%;
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
}

.modalMask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modalCard {
  width: 640rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.modalTitle {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.formRow {
  margin-bottom: 12rpx;
}

.formLabel {
  font-size: 24rpx;
  color: #6b7785;
  margin-bottom: 6rpx;
  display: block;
}

.formInput {
  width: 100%;
  background: #f4f6f8;
  border-radius: 12rpx;
  padding: 12rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.textarea {
  min-height: 120rpx;
}

.switchRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modalActions {
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 16rpx;
}

.btnCancel {
  background: #f4f6f8;
  color: #1f2b3a;
  border-radius: 12rpx;
  padding: 8rpx 24rpx;
}

.btnSave {
  background: linear-gradient(90deg, #0f75ff, #56a0ff);
  color: #fff;
  border-radius: 12rpx;
  padding: 8rpx 24rpx;
}
</style>
