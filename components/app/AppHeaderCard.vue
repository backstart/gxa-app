<template>
  <view class="card headerCard">
    <view class="headerMain">
      <image class="headerCover" src="/static/logo.png" mode="aspectFill"></image>
      <view class="headerPrimary">
        <view class="headerTitle clamp2">{{ title }}</view>
        <view v-if="subTitle" class="headerSub clamp1">{{ subTitle }}</view>
        <view class="headerKv">
          <view class="kvItem">
            <text class="kvLabel">{{ leftKv.label }}</text>
            <text class="kvValue">{{ leftKv.value }}</text>
          </view>
          <view class="kvItem">
            <text class="kvLabel">{{ rightKv.label }}</text>
            <text class="kvValue link" @click="callPhone(rightKv.value)">{{ rightKv.value }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="headerExtra" v-if="extraRows.length">
      <InfoRow
        v-for="(row, idx) in extraRows"
        :key="idx"
        :label="row.label"
        :value="row.value"
        :clickable="isClickable(row)"
        @click="handleRowClick(row)"
      />
    </view>

    <view class="headerTags" v-if="mappedTags.length">
      <com-tag :taglist="mappedTags" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import InfoRow from '@/components/app/InfoRow.vue';
import ComTag from '@/components/com-tag/com-tag.vue';

const props = defineProps({
  title: { type: String, default: '' },
  subTitle: { type: String, default: '' },
  infoRows: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
});

const leftKv = computed(() => {
  const row = props.infoRows?.[0] || {};
  return {
    label: row.label || '负责人',
    value: row.value || '—',
  };
});

const rightKv = computed(() => {
  const row = props.infoRows?.[1] || {};
  return {
    label: row.label || '电话',
    value: row.value || '—',
  };
});

const extraRows = computed(() => (props.infoRows || []).slice(2));

function callPhone(phone) {
  if (!phone || phone === '—') return;
  uni.makePhoneCall({ phoneNumber: String(phone) });
}

function isClickable(row) {
  if (!row) return false;
  return String(row.label || '').includes('电话');
}

function handleRowClick(row) {
  if (!row) return;
  if (String(row.label || '').includes('电话')) {
    callPhone(row.value);
  }
}

const mappedTags = computed(() => {
  const list = props.tags || [];
  return list
    .map((item) => {
      if (typeof item === 'string') {
        return { tag: item, type: tagType(item) };
      }
      if (item && typeof item === 'object') {
        return {
          tag: item.tag || '',
          type: item.type || tagType(item.tag || ''),
        };
      }
      return null;
    })
    .filter((item) => item && item.tag);
});

function tagType(tag) {
  const text = String(tag);
  if (/涉黄|涉毒|涉赌|未成年人|消防隐患|治安复杂|纠纷多发|精神障碍|暴力倾向|重点上访|肇事肇祸|高风险/.test(text)) return 'danger';
  if (/重点|管控|关注/.test(text)) return 'key';
  return 'normal';
}
</script>

<style lang="scss" scoped>
@import '@/common/styles/app-ui.scss';
.headerCard {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.headerCover {
  width: 104rpx;
  height: 104rpx;
  border-radius: 16rpx;
  background: #e9edf2;
  flex-shrink: 0;
}
.headerMain {
  display: flex;
  gap: 16rpx;
}
.headerPrimary {
  flex: 1;
  min-width: 0;
}
.headerTitle {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2b3a;
  line-height: 1.2;
}
.headerSub {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6e7a89;
}
.clamp2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.clamp1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.headerKv {
  margin-top: 10rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx 16rpx;
}
.kvItem {
  display: flex;
  flex-direction: column;
}
.kvLabel {
  font-size: 22rpx;
  color: #6b7785;
}
.kvValue {
  font-size: 24rpx;
  color: #1f2b3a;
}
.kvValue.link {
  color: #0f75ff;
}
.headerExtra {
  width: 100%;
}
.headerTags {
  width: 100%;
}
</style>
