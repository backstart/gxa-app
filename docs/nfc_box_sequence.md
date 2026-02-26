# 手机-盒子-NFC 开箱完整时序图

> 说明：本图对应 `usecar -> keyPickup -> Android HCE -> 钥匙盒` 的完整链路，包含成功、超时与手动撤销三种分支。

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant A as 手机App(uni-app)
    participant H as Android HCE服务
    participant B as 钥匙盒(STM32+NFC读卡器)

    U->>A: 用车登记提交
    A->>A: 生成 payload(ver/action/carId/logId/ts/nonce/sig)
    A->>H: setPayload(payload)
    A->>H: startSession(300s)
    H-->>A: READY
    A-->>U: 提示“5分钟内可刷，离开页面仍有效”

    alt 5分钟内靠近钥匙盒
        U->>B: 手机贴近感应区
        B->>H: SELECT AID
        alt 会话有效且未使用
            H-->>B: 9000
            B->>H: READ DATA
            H-->>B: payload + 9000
            H-->>A: SUCCESS
            B->>B: 验签/验时效通过 -> 开箱
            A->>A: 标记 keyPicked=true, keyPickedAt=now
            A->>H: stopSession() (或 used=true 立即失效)
            A-->>U: 提示“开箱成功，可取钥匙”
        else 会话失效/已使用
            H-->>B: 6985
            H-->>A: ERROR(SESSION_TIMEOUT_OR_INVALID)
        end
    else 超过300秒未感应
        H-->>A: ERROR(TIMEOUT)
        B->>H: SELECT/READ
        H-->>B: 6985
        A-->>U: 提示“授权超时，请重新开始”
    else 用户主动撤销授权
        U->>A: 点击“撤销授权”
        A->>H: stopSession()
        H-->>A: STOPPED
        B->>H: SELECT/READ
        H-->>B: 6985
        A-->>U: 返回上一页
    end
```

## 关键约束

- 授权有效期：`300s`（5分钟）。
- 授权单次有效：盒子读取成功一次后立即失效（`used=true` 或 `stopSession`）。
- 页面退出不自动 `stopSession`：满足“退出取钥匙页/锁屏后台仍可刷”的现场需求。
- 手动撤销优先级最高：撤销后必须立即返回 `6985`。
