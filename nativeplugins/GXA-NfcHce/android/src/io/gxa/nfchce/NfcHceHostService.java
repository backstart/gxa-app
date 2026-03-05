package io.gxa.nfchce;

import android.nfc.cardemulation.HostApduService;
import android.os.Bundle;

/**
 * Android HCE APDU 服务。
 * 协议约定：
 * 1) SELECT AID：00A40400 + AID
 * 2) READ DATA ：00B0000000
 */
public class NfcHceHostService extends HostApduService {
    private static final String AID = "F0010203040506";
    private static final String SELECT_APDU_HEADER = "00A40400";
    private static final byte[] SW_SUCCESS = hexToBytes("9000");
    private static final byte[] SW_INS_NOT_SUPPORTED = hexToBytes("6D00");
    private static final byte[] SW_CONDITION_NOT_SATISFIED = hexToBytes("6985");

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        // 未识别指令直接返回不支持状态字，避免异常崩溃。
        if (commandApdu == null || commandApdu.length == 0) {
            return SW_INS_NOT_SUPPORTED;
        }
        NfcHceModule.emitFromService("APDU", briefHex(commandApdu));

        if (isSelectAidApdu(commandApdu)) {
            // 盒子先 SELECT AID：
            // 仅当会话有效（未超时、未使用）才允许进入读取阶段。
            if (!NfcHceStore.isSessionValid()) {
                NfcHceModule.emitFromService("ERROR", "SELECT_DENIED_SESSION_INVALID");
                return SW_CONDITION_NOT_SATISFIED;
            }
            NfcHceModule.emitFromService("TAG_READ", "SELECT_AID");
            return SW_SUCCESS;
        }

        if (isReadApdu(commandApdu)) {
            // READ DATA 前必须检查会话有效期（防重放、超时防护）。
            if (!NfcHceStore.isSessionValid()) {
                NfcHceModule.emitFromService("ERROR", "SESSION_TIMEOUT_OR_INVALID");
                return SW_CONDITION_NOT_SATISFIED;
            }
            NfcHceModule.emitFromService("TAG_READ", "READ_DATA");
            byte[] payload = NfcHceStore.getPayloadBytes();
            byte[] out = concat(payload, SW_SUCCESS);
            // 一次读取即视为成功：标记 used=true，后续读取会返回 6985。
            NfcHceStore.markSuccess();
            NfcHceModule.emitFromService("SUCCESS", "PAYLOAD_SENT");
            return out;
        }

        NfcHceModule.emitFromService("ERROR", "UNSUPPORTED_APDU_" + briefHex(commandApdu));
        return SW_INS_NOT_SUPPORTED;
    }

    @Override
    public void onDeactivated(int reason) {
        // reason 可能为链路丢失或 AID 切换，这里不直接视为失败，仅记录事件。
        NfcHceModule.emitFromService("TAG_READ", "DEACTIVATED_" + reason);
    }

    private static boolean isSelectAidApdu(byte[] apdu) {
        // 组装标准 SELECT AID 指令模板：00A40400 + Lc + AID。
        String apduHex = toHex(apdu);
        String target = SELECT_APDU_HEADER + String.format("%02X", AID.length() / 2) + AID;
        return apduHex.startsWith(target);
    }

    private static boolean isReadApdu(byte[] apdu) {
        // 兼容读取指令：00B0xxxx[Le]，允许不同偏移/长度。
        if (apdu == null || apdu.length < 4) return false;
        return (apdu[0] == (byte) 0x00) && (apdu[1] == (byte) 0xB0);
    }

    private static String briefHex(byte[] data) {
        String hex = toHex(data);
        if (hex.length() <= 32) return hex;
        return hex.substring(0, 32);
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] out = new byte[a.length + b.length];
        System.arraycopy(a, 0, out, 0, a.length);
        System.arraycopy(b, 0, out, a.length, b.length);
        return out;
    }

    private static byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }

    private static String toHex(byte[] data) {
        StringBuilder sb = new StringBuilder();
        for (byte b : data) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }
}
