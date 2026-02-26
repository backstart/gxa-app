package io.gxa.nfchce;

import java.nio.charset.StandardCharsets;

/**
 * HCE 共享内存仓库。
 * 说明：UniModule 与 HostApduService 运行在同进程中，这里用静态变量共享 payload 与会话状态。
 */
public class NfcHceStore {
    private static String payload = "{}";
    private static boolean sessionActive = false;
    private static long expireAtMs = 0L;
    private static boolean used = false;

    private NfcHceStore() {}

    public static synchronized void setPayload(String value) {
        // 空值兜底，避免 Service 返回 null 导致字节转换异常。
        payload = value == null ? "{}" : value;
    }

    public static synchronized byte[] getPayloadBytes() {
        // 统一使用 UTF-8 编码，确保盒子端按 UTF-8 解析一致。
        return payload.getBytes(StandardCharsets.UTF_8);
    }

    public static synchronized void startSession(int timeoutSeconds) {
        // 会话启用时记录过期时间戳，并将“是否已使用”重置为 false。
        // 这样可支持“5分钟内可刷一次”，成功读取后立即失效。
        int safeTimeout = timeoutSeconds > 0 ? timeoutSeconds : 300;
        sessionActive = true;
        expireAtMs = System.currentTimeMillis() + safeTimeout * 1000L;
        used = false;
    }

    public static synchronized void stopSession() {
        // 会话停止后清空所有状态，后续 SELECT/READ 都会返回 6985。
        sessionActive = false;
        expireAtMs = 0L;
        payload = "{}";
        used = false;
    }

    public static synchronized boolean isSessionValid() {
        // 会话有效条件：
        // 1) 已启动；
        // 2) 未超时；
        // 3) 未被读取使用过；
        // 4) payload 非空。
        if (!sessionActive) return false;
        if (System.currentTimeMillis() > expireAtMs) return false;
        if (used) return false;
        return payload != null && payload.length() > 0;
    }

    public static synchronized void markSuccess() {
        // 读取成功后标记为“已使用”。
        // 这里不立即 stop，便于前端查询状态并展示“已刷成功”；
        // 但 used=true 后再次读取会直接返回 6985。
        used = true;
    }

    public static synchronized boolean isActive() {
        return sessionActive;
    }

    public static synchronized boolean isUsed() {
        return used;
    }

    public static synchronized int getRemainingSeconds() {
        // 返回剩余秒数，最小为 0，供 JS 页面展示倒计时与会话恢复。
        if (!sessionActive) return 0;
        long remain = expireAtMs - System.currentTimeMillis();
        if (remain <= 0) return 0;
        return (int) (remain / 1000L);
    }
}
