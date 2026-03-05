import { hmacSha256Hex, randomNonce } from '@/utils/hmac.js';

// 开箱授权共享密钥（演示环境先写死；生产建议由后端短时下发）。
export const SHARED_KEY = 'dev_shared_key_change_me';
// RC522 当前实现仅支持单帧 ISO-DEP 响应，业务载荷建议控制在 59 字节以内。
export const NFC_PAYLOAD_MAX_BYTES = 59;
// 联调标记：STM32 屏幕会显示 payload 前 4 字节的十六进制，可用于快速确认是否读到 HCE 数据。
export const NFC_COMPARE_PREFIX = 'ID01';

// 统一生成“开箱授权 payload”。
// 说明：
// 1) usecar 页面提交后会先下发授权；
// 2) keyPickup 页面可复用同一生成规则，避免两处签名逻辑不一致。
export function buildOpenBoxPayload({ carId, logId, key = SHARED_KEY } = {}) {
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
    ts,
    nonce,
    sig,
  };
}

function toRefToken(value) {
  // 生成稳定短标识，用于在短载荷内保留车/日志的弱关联信息。
  const input = String(value || '');
  let hash = 0x811c9dc5; // FNV-1a 32bit
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).toUpperCase().padStart(8, '0').slice(-4);
}

export function buildOpenBoxNfcPayload(payload = {}) {
  // 紧凑格式：联调标记|车引用|日志引用|时间戳36进制|随机数|签名前缀
  // 例：ID01|1A2B|3C4D|MIZZ1W2|A1B2C3|89ABCDEF
  const ts36 = Number(payload.ts || Date.now()).toString(36).toUpperCase();
  const nonce = String(payload.nonce || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  const sig = String(payload.sig || '').replace(/[^A-Fa-f0-9]/g, '').toUpperCase().slice(0, 8);
  const carRef = toRefToken(payload.carId);
  const logRef = toRefToken(payload.logId);
  const compact = `${NFC_COMPARE_PREFIX}|${carRef}|${logRef}|${ts36}|${nonce || '000000'}|${sig || '00000000'}`;
  return compact.slice(0, NFC_PAYLOAD_MAX_BYTES);
}

