<template>
  <view class="card headerCard">
    <view class="headerMain">
      <image class="headerCover" src="/static/logo.png" mode="aspectFill"></image>
      <view class="headerPrimary">
        <view class="headerTitle clamp2">{{ title }}</view>
        <view v-if="subTitle" class="headerSub clamp1">{{ subTitle }}</view>
        <view class="headerKv">
          <view class="kvLine">
            <text class="kvLabel">{{ leftKv.label }} </text>
            <text class="kvValue">{{ leftKv.value }}</text>
          </view>
          <view class="kvLine">
            <text class="kvLabel">{{ rightKv.label }} </text>
            <text class="kvValue link" @click="callPhone(rightKv.value)">{{ rightKv.value }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="headerExtraGrid" v-if="displayExtraRows.length">
      <!-- 扩展信息改为智能双列：长字段跨两列，奇数项自动补齐，减少右侧空白 -->
      <view
        v-for="(row, idx) in displayExtraRows"
        :key="idx"
        :class="['extraCell', isSpan2(row) ? 'span2' : '', isClickable(row) ? 'clickable' : '']"
        @tap="handleRowClick(row)"
      >
        <text class="extraLabel">{{ row.label }} </text>
        <text :class="['extraValue', isAddressLike(row) ? 'nowrap' : '', rowValue(row) ? '' : 'empty']">
          {{ rowValue(row) || '—' }}
        </text>
      </view>
    </view>

    <view class="headerTags" v-if="mappedTags.length">
      <com-tag :taglist="mappedTags" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
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

const displayExtraRows = computed(() => {
  // 将除前两项外的字段做“智能双列”排布，减少头卡右侧大片空白
  const rows = (props.infoRows || []).slice(2).map((row) => ({ ...row, __span2: false }));
  if (!rows.length) return rows;

  const normalIndexes = [];
  rows.forEach((row, index) => {
    if (needSpan2(row)) {
      row.__span2 = true;
    } else {
      normalIndexes.push(index);
    }
  });

  // 普通字段数量为奇数时，将最后一项设为跨两列，避免出现“左有内容右空白”的半行
  if (normalIndexes.length % 2 === 1) {
    const lastIndex = normalIndexes[normalIndexes.length - 1];
    rows[lastIndex].__span2 = true;
  }
  return rows;
});

function callPhone(phone) {
  // 电话字段只在存在有效号码时触发拨号，避免误触空值
  if (!phone || phone === '—' || phone === '--') return;
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

function rowValue(row) {
  // 统一处理空值，避免模板里重复写空值判断
  if (!row) return '';
  const value = row.value;
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isAddressLike(row) {
  // 住址/地址统一单行省略，避免头卡被地址字段撑高
  const label = String(row?.label || '');
  return /地址|住址/.test(label);
}

function needSpan2(row) {
  // 长字段跨两列，优先覆盖身份证/地址/备注类字段
  const label = String(row?.label || '');
  return /地址|住址|身份证|证件|户籍|备注|事由/.test(label);
}

function isSpan2(row) {
  // 模板中通过该标记控制格子是否跨两列
  return !!row?.__span2;
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
  align-items: flex-start;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 12rpx;
}
.kvLine {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 4rpx 0;
  background: transparent;
}
/* 右侧电话行右对齐，优先占用头卡右上区域，减少视觉空白 */
.headerKv .kvLine:last-child {
  justify-content: flex-end;
}
.kvLabel {
  font-size: 22rpx;
  color: #6b7785;
  flex-shrink: 0;
  white-space: nowrap;
}
.kvValue {
  min-width: 0;
  font-size: 24rpx;
  color: #1f2b3a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kvValue.link {
  color: #0f75ff;
}

.headerExtraGrid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8rpx;
}
.extraCell {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 4rpx 0;
  box-sizing: border-box;
}
.extraCell.span2 {
  grid-column: 1 / -1;
}
.extraCell.clickable .extraValue {
  color: #0f75ff;
}
.extraLabel {
  font-size: 22rpx;
  color: #6b7785;
  line-height: 1.3;
  flex-shrink: 0;
  margin-right: 8rpx;
  white-space: nowrap;
}
.extraValue {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #1f2b3a;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.extraValue.nowrap {
  white-space: nowrap;
}
.extraValue.empty {
  color: #9aa3af;
}
.headerTags {
  width: 100%;
}
</style>
