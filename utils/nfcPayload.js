import { hmacSha256Hex, randomNonce } from '@/utils/hmac.js';

// 开箱授权共享密钥（演示环境先写死；生产建议由后端短时下发）。
export const SHARED_KEY = 'dev_shared_key_change_me';

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

