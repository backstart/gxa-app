import { hmacSha256Hex, randomNonce } from '@/utils/hmac.js';

// 开箱授权共享密钥（演示环境先写死；生产建议由后端短时下发）。
export const SHARED_KEY = 'dev_shared_key_change_me';
// RC522 当前实现仅支持单帧 ISO-DEP 响应，业务载荷建议控制在 59 字节以内。
export const NFC_PAYLOAD_MAX_BYTES = 59;
// 屏显载荷版本：ID02|P=<plate>|U=<user>
export const NFC_DISPLAY_PREFIX = 'ID02';

// 统一生成“开箱授权 payload”。
// 说明：
// 1) usecar 页面提交后会先下发授权；
// 2) keyPickup 页面可复用同一生成规则，避免两处签名逻辑不一致。
export function buildOpenBoxPayload({ carId, logId, plateNo = '', user = '', key = SHARED_KEY } = {}) {
  const ver = 1;
  const action = 'OPEN_BOX';
  const ts = Date.now();
  const nonce = randomNonce(8);
  const raw = `${ver}|${action}|${carId || ''}|${logId || ''}|${ts}|${nonce}`;
  // 取前 16 字节（32 位 hex）作为短签名，便于 STM32 端快速校验。
  const sig = hmacSha256Hex(String(key || SHARED_KEY), raw).slice(0, 32);
  return {
    ver,
    action,
    carId: carId || '',
    logId: logId || '',
    plateNo: String(plateNo || ''),
    user: String(user || ''),
    ts,
    nonce,
    sig,
  };
}

function utf8ByteLength(value) {
  const text = String(value || '');
  // 兼容 uni 环境：通过 URI 编码近似 UTF-8 字节长度。
  return unescape(encodeURIComponent(text)).length;
}

function sliceByUtf8Bytes(value, maxBytes) {
  const text = String(value || '');
  if (maxBytes <= 0) return '';
  let out = '';
  for (const ch of text) {
    const next = out + ch;
    if (utf8ByteLength(next) > maxBytes) break;
    out = next;
  }
  return out;
}

function normalizeField(value) {
  // 分隔符转义，避免破坏协议解析。
  return String(value || '')
    .replace(/\|/g, '/')
    .replace(/[\r\n]/g, ' ')
    .trim();
}

export function buildOpenBoxNfcPayload(payload = {}) {
  // 新格式：ID02|P=<车牌>|U=<使用人>
  // 示例：ID02|P=粤T0001警|U=李警官
  const head = `${NFC_DISPLAY_PREFIX}|P=`;
  const mid = '|U=';
  const fixedBytes = utf8ByteLength(head) + utf8ByteLength(mid);
  const maxContentBytes = Math.max(0, NFC_PAYLOAD_MAX_BYTES - fixedBytes);

  let plate = normalizeField(payload.plateNo || '--');
  let user = normalizeField(payload.user || '--');

  // 优先保证车牌完整，再把剩余空间给使用人。
  let plateBytesBudget = Math.min(24, maxContentBytes);
  plate = sliceByUtf8Bytes(plate, plateBytesBudget);

  let remainBytes = maxContentBytes - utf8ByteLength(plate);
  if (remainBytes < 4 && utf8ByteLength(plate) > 4) {
    plate = sliceByUtf8Bytes(plate, Math.max(4, maxContentBytes - 4));
    remainBytes = maxContentBytes - utf8ByteLength(plate);
  }
  user = sliceByUtf8Bytes(user, Math.max(0, remainBytes));

  const compact = `${head}${plate}${mid}${user}`;
  return sliceByUtf8Bytes(compact, NFC_PAYLOAD_MAX_BYTES);
}

