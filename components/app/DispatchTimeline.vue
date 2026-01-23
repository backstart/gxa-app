<template>
  <view class="timeline">
    <view v-if="!grouped.length" class="timeline-empty">暂无处警节点</view>

    <view v-for="group in grouped" :key="group.key" class="timeline-group">
      <view class="group-label">{{ group.label }}</view>

      <view v-for="(item, idx) in group.items" :key="item.id" class="timeline-item">
        <view class="timeline-left">
          <view class="timeline-time">{{ formatHHMM(item._ts) }}</view>
          <view :class="['timeline-dot', dotClass(item)]"></view>
          <view v-if="!isLast(group, idx)" class="timeline-line"></view>
        </view>

        <view class="timeline-card" :class="mode === 'compact' ? 'compact' : ''">
          <view class="timeline-top">
            <view class="timeline-type">{{ item.type || '节点' }}</view>
            <view class="timeline-ts">{{ formatMDHM(item._ts) }}</view>
          </view>
          <view v-if="item.note" class="timeline-note">{{ item.note }}</view>
          <view class="timeline-actor">{{ item.actor || '—' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  mode: { type: String, default: 'full' }, // full | compact
});

function toTs(value) {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();

  const str = String(value).trim();

  // Try native parse first
  const native = Date.parse(str.replace(/\./g, '-'));
  if (!Number.isNaN(native)) return native;

  // Support formats like "08-21 10:00" or "2025-08-21 10:00"
  const m = str.match(/^(?:(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\s*)?(?:(\d{1,2})[-\/](\d{1,2})\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const now = new Date();
    let year = m[1] ? Number(m[1]) : now.getFullYear();

    // If with year-month-day
    if (m[2] && m[3]) {
      const month = Number(m[2]) - 1;
      const day = Number(m[3]);
      const hh = Number(m[6]);
      const mm = Number(m[7]);
      const ss = m[8] ? Number(m[8]) : 0;
      return new Date(year, month, day, hh, mm, ss).getTime();
    }

    // If with month-day only
    if (m[4] && m[5]) {
      const month = Number(m[4]) - 1;
      const day = Number(m[5]);
      const hh = Number(m[6]);
      const mm = Number(m[7]);
      const ss = m[8] ? Number(m[8]) : 0;
      return new Date(year, month, day, hh, mm, ss).getTime();
    }
  }

  // Fallback: try extract HH:mm and use today
  const hm = str.match(/(\d{1,2}):(\d{2})/);
  if (hm) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hm[1]), Number(hm[2]), 0).getTime();
  }

  return NaN;
}

const normalized = computed(() => {
  const list = Array.isArray(props.items) ? props.items : [];
  return list
    .map((it) => {
      const ts = toTs(it.time);
      return { ...it, _ts: ts, id: it.id || `tl-${Math.random().toString(16).slice(2)}` };
    })
    .filter((it) => !Number.isNaN(it._ts));
});

const sorted = computed(() => {
  const arr = [...normalized.value];
  arr.sort((a, b) => a._ts - b._ts); // ascending
  return arr;
});

function dayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const todayKey = dayKey(today.getTime());
  const yKey = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).getTime());
  const key = dayKey(ts);

  if (key === todayKey) return '今天';
  if (key === yKey) return '昨天';

  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}`;
}

const grouped = computed(() => {
  const map = new Map();
  for (const it of sorted.value) {
    const key = dayKey(it._ts);
    if (!map.has(key)) map.set(key, { key, label: dayLabel(it._ts), items: [] });
    map.get(key).items.push(it);
  }
  return Array.from(map.values());
});

function isLast(group, idx) {
  const gIndex = grouped.value.findIndex((g) => g.key === group.key);
  if (gIndex < 0) return true;
  if (gIndex !== grouped.value.length - 1) return false;
  return idx === group.items.length - 1;
}

function formatHHMM(ts) {
  if (!ts || Number.isNaN(ts)) return '--:--';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatMDHM(ts) {
  if (!ts || Number.isNaN(ts)) return '';
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${hh}:${mm}`;
}

function dotClass(item) {
  const type = String(item?.type || '');
  if (/结束|结警|完成/.test(type)) return 'dot-success';
  if (/增援|报警|冲突|升级/.test(type)) return 'dot-warn';
  if (/到场|出警|联系|预计/.test(type)) return 'dot-primary';
  return 'dot-default';
}
</script>

<style lang="scss" scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.timeline-empty {
  padding: 16rpx;
  background: #f6f8fb;
  border-radius: 12rpx;
  color: #97a1ad;
  font-size: 24rpx;
}

.timeline-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.group-label {
  font-size: 24rpx;
  color: #6e7a89;
  padding-left: 12rpx;
}

.timeline-item {
  display: flex;
  gap: 12rpx;
  align-items: flex-start;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 82rpx;
  position: relative;
}

.timeline-time {
  font-size: 22rpx;
  color: #6e7a89;
  margin-bottom: 6rpx;
}

.timeline-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #c9d3df;
}

.dot-default {
  background: #c9d3df;
}

.dot-primary {
  background: #2f7bff;
}

.dot-warn {
  background: #f5a524;
}

.dot-success {
  background: #41c16b;
}

.timeline-line {
  width: 2rpx;
  flex: 1;
  background: #e3e8ef;
  margin-top: 6rpx;
}

.timeline-card {
  flex: 1;
  background: #ffffff;
  border-radius: 12rpx;
  padding: 14rpx 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(16, 24, 40, 0.06);
  border: 1rpx solid #edf0f5;
}

.timeline-card.compact {
  padding: 10rpx 12rpx;
}

.timeline-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12rpx;
}

.timeline-type {
  font-size: 28rpx;
  font-weight: 700;
  color: #2f7bff;
}

.timeline-ts {
  font-size: 22rpx;
  color: #97a1ad;
}

.timeline-note {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #2b3440;
}

.timeline-actor {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #6e7a89;
}
</style>
