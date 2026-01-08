<!-- KTV场所 -->
<template>
  <view class="page">
    <view class="statuBar" :style="{ height: barheight + 'px' }"></view>
    <view class="head">
      <view class="title">
        <view class="txt1">{{ detail.name || 'KTV场所' }}</view>
      </view>

      <view class="pepoleinfo">
        <view class="flexrow">
          <view class="txt_gray">负责人：</view>
          <view class="txtclick">{{ detail.owner?.name || '-' }}</view>
        </view>
        <view class="flexrow">
          <view class="txt_gray">电话：</view>
          <view class="txtclick">{{ detail.owner?.phone || '-' }}</view>
        </view>
      </view>

      <view class="pepoleinfo">
        <view class="flexrow">
          <view class="txt_gray">管理员：</view>
          <view class="txtclick">{{ detail.manager?.name || '-' }}</view>
        </view>
        <view class="flexrow">
          <view class="txt_gray">电话：</view>
          <view class="txtclick">{{ detail.manager?.phone || '-' }}</view>
        </view>
      </view>

      <view class="address flexrow">
        <view class="txt_gray">地址：</view>
        <view class="txtclick">{{ detail.address || '-' }}</view>
      </view>
      <view class="time flexrow">
        <view class="txt_gray">最近检查时间：</view>
        <view class="txt_gray_after">{{ detail.lastCheckTime || '-' }}</view>
      </view>
      <com-tag :taglist="tag"></com-tag>
    </view>

    <view class="body">
      <l-grid :inset="true">
        <l-grid-item @click="lgClick('a')" text="检查记录" badge="15" image="/static/venue/检查记录.png" />
        <l-grid-item @click="lgClick('b')" text="从业人员" image="/static/venue/人员信息.png" />
        <l-grid-item @click="lgClick('c')" text="档案" badge="5" image="/static/venue/档案.png" />
        <l-grid-item @click="lgClick('d')" text="关联警情" badge="New" image="/static/venue/关联警情.png" />
      </l-grid>
    </view>

    <view class="bottomlist">
      <browselist :list="list" v-show="currentTab === 'a'" @clickitem="clickitem"></browselist>
      <staffbrolist :list="stafflist" v-show="currentTab === 'b'" @clickitem="clickitem"></staffbrolist>
      <archivelist :list="archivelists" v-show="currentTab === 'c'" @clickitem="clickitem"></archivelist>
    </view>

    <view>
      <FloatPopupMenu
        :menuItems="customMenuItems"
        :disabled="false"
        buttonBgColor="linear-gradient(165deg, #FF6B6B 0%, #FFD166 100%)"
        activeButtonBgColor="linear-gradient(165deg, #FFD166 0%, #FF6B6B 100%)"
        iconColor="#333333"
        textColor="#333333"
        @menuClick="onMenuClick"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import { getVenueDetails, getVenueDetailById } from '@/common/database.js';
import FloatPopupMenu from '@/uni_modules/stars-Float-Popup-Menu/components/stars-Float-Popup-Menu/FloatPopupMenu.vue';

const barheight = ref(getStatusBarHeight());
const currentTab = ref('a');

const detailId = ref('');
const detail = ref({});
const tag = ref([]);
const list = ref([]);
const stafflist = ref([]);
const archivelists = ref([]);

function loadData() {
  const items = getVenueDetails();
  detail.value = detailId.value ? getVenueDetailById(detailId.value) || items[0] || {} : items[0] || {};
  tag.value = detail.value.tags || [];
  list.value = detail.value.checkRecords || [];
  stafflist.value = detail.value.staffList || [];
  archivelists.value = detail.value.archiveList || [];
}

function lgClick(e) {
  currentTab.value = e;
}

function clickitem() {}

const customMenuItems = [
  {
    icon: 'home',
    text: '检查',
    menuBgColor: 'linear-gradient(165deg, #2B5BDB 20%, #00C9FF 50%, #ffffff 100%)',
    textColor: '#fff',
    iconColor: '#fff',
  },
  {
    icon: 'staff',
    text: '修改',
    menuBgColor: 'linear-gradient(165deg, #2B5BDB 0%, #00C9FF 100%)',
    textColor: '#fff',
    iconColor: '#fff',
  },
  {
    icon: 'person',
    text: '新增',
    menuBgColor: 'linear-gradient(165deg, #FF6B6B 0%, #FFD166 100%)',
    textColor: '#333333',
    iconColor: '#333333',
  },
  {
    icon: 'scan',
    text: '识别',
    menuBgColor: 'linear-gradient(165deg, #2B5BDB 0%, #00C9FF 100%)',
    textColor: '#fff',
    iconColor: '#fff',
  },
];

const onMenuClick = (item) => {
  uni.showToast({
    title: `点击了${item.text}`,
    icon: 'none',
  });
};

watch(currentTab, (newVal) => {
  console.log('currentTab 最新值：', newVal);
});

onLoad((query) => {
  detailId.value = query.id || '';
});

onShow(loadData);
</script>

<style lang="scss" scoped>
@import url("../../common/style/common-style.scss");

.page {
  height: 100vh;
  width: 750rpx;
}

.head {
  border: 1px solid #eee;
  border-radius: 10rpx;
  box-shadow: 0 0 30rpx rgba(0, 0, 0, 0.15);
  background-color: white;
  margin: 10rpx 20rpx;
  padding: 10rpx;
}

.title {
  margin: 10rpx 10rpx;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.innum {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.pepoleinfo {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.flexrow {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.bottomlist {
  width: 100%;
}
</style>
