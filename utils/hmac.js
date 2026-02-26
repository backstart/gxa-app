// 轻量级 SHA-256/HMAC-SHA256 实现。
// 说明：用于车钥匙 NFC 授权签名，避免在 APP 端额外引入第三方加密库。

function rightRotate(value, amount) {
  // SHA-256 基础运算：无符号循环右移。
  return (value >>> amount) | (value << (32 - amount));
}

function toUtf8Bytes(str) {
  // 将 JS 字符串转为 UTF-8 字节数组，确保中文/特殊字符签名一致。
  const bytes = [];
  for (let i = 0; i < str.length; i += 1) {
    const codePoint = str.codePointAt(i);
    if (codePoint > 0xffff) i += 1;
    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >>> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >>> 12),
        0x80 | ((codePoint >>> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >>> 18),
        0x80 | ((codePoint >>> 12) & 0x3f),
        0x80 | ((codePoint >>> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    }
  }
  return bytes;
}

function toHex(bytes) {
  // 字节数组转 hex 字符串，便于网络传输与盒子端校验。
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function wordsToBytes(words) {
  // 32 位字数组按大端序展开为字节数组。
  const out = [];
  for (let i = 0; i < words.length; i += 1) {
    out.push((words[i] >>> 24) & 0xff);
    out.push((words[i] >>> 16) & 0xff);
    out.push((words[i] >>> 8) & 0xff);
    out.push(words[i] & 0xff);
  }
  return out;
}

export function sha256Bytes(messageBytes) {
  // 纯 JS SHA-256：输入字节数组，输出 32 字节摘要。
  // 说明：这里不依赖 WebCrypto，确保 uni-app APP-PLUS 环境也能跑。
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const msg = messageBytes.slice();
  const bitLen = msg.length * 8;
  msg.push(0x80);
  while ((msg.length % 64) !== 56) msg.push(0x00);
  const hi = Math.floor(bitLen / 0x100000000);
  const lo = bitLen >>> 0;
  msg.push((hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff);
  msg.push((lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff);

  const w = new Array(64).fill(0);
  for (let i = 0; i < msg.length; i += 64) {
    for (let t = 0; t < 16; t += 1) {
      const j = i + (t * 4);
      w[t] = ((msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t += 1) {
      const s0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    for (let t = 0; t < 64; t += 1) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return wordsToBytes(H);
}

export function hmacSha256Hex(key, message) {
  // HMAC-SHA256（RFC 2104）流程：
  // 1) 规范化 key 到 64 字节；
  // 2) iKeyPad 做 inner hash；
  // 3) oKeyPad 做 outer hash；
  // 4) 输出 hex 字符串。
  const blockSize = 64;
  let keyBytes = toUtf8Bytes(String(key || ''));
  if (keyBytes.length > blockSize) keyBytes = sha256Bytes(keyBytes);
  if (keyBytes.length < blockSize) {
    keyBytes = keyBytes.concat(new Array(blockSize - keyBytes.length).fill(0x00));
  }

  const oKeyPad = keyBytes.map((b) => b ^ 0x5c);
  const iKeyPad = keyBytes.map((b) => b ^ 0x36);
  const msgBytes = toUtf8Bytes(String(message || ''));

  // 先做 inner hash，再做 outer hash，这是标准 HMAC 流程。
  const inner = sha256Bytes(iKeyPad.concat(msgBytes));
  const outer = sha256Bytes(oKeyPad.concat(inner));
  return toHex(outer);
}

export function randomNonce(length = 8) {
  // 生成短随机串用于防重放；字符集仅使用数字字母，便于盒子端解析。
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
