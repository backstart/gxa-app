# DevApp 项目交接文档（后端 API 对接前）

> 更新时间：2026-02-28  
> 目标读者：新接手前端/后端开发、联调人员

## 1. 项目概览

本项目是一个 **uni-app + Vue3 `<script setup>`** 的移动端警务业务应用，当前以前端本地数据（`uni.setStorageSync`）驱动为主，已覆盖以下核心业务：

- 警车调度（含 NFC/HCE 取钥匙）
- 工作台（全辖区态势 + 个人待办）
- 走访（人员/场所）
- 全辖区任务督导（zoneTasks）
- 交接班
- 休假、外出审批
- 值班、换班
- 会议通知（创建/参会确认）
- 重点场所、重点人员、任务指派、警情分析

当前阶段准备进入后端 API 化，对接时建议优先从“数据读写层”替换入手，保持页面层稳定。

---

## 2. 技术栈与运行方式

### 2.1 技术栈

- 框架：`uni-app` + `Vue3`
- 语法：`<script setup>`
- 样式：`scss`
- 图表：uCharts（警情分析/统计页）
- 本地存储：`uni.getStorageSync / uni.setStorageSync`

### 2.2 关键入口文件

- 应用入口：`main.js`
- 全局样式入口：`App.vue` -> `common/style/common-style.scss`
- 路由配置：`pages.json`
- 核心本地数据层：`common/database.js`

### 2.3 原生能力（Android）

- 已接入本地原生插件：`nativeplugins/GXA-NfcHce`
- `manifest.json` 已声明：
  - `app-plus.modules.GXA-NfcHce`
  - NFC/HCE 所需权限与 feature

> 注意：调试 NFC 功能需使用 **包含插件的自定义基座** 或自定义打包包体，普通基座会报插件缺失。

---

## 3. 目录结构（重点）

```txt
common/
  database.js               # 本地数据源与业务写入逻辑（最关键）
  routes/visit.js           # 走访路由映射工具

components/
  app/                      # 通用 UI 组件（AppPage/AppListItem 等）

pages/
  car/                      # 车辆/用车/NFC取钥匙
  work/                     # 工作台
  zoneTasks/                # 全辖区任务督导列表
  visit/                    # 走访
  meeting/                  # 会议通知
  handwork/                 # 交接班
  leave/, out/              # 休假/外出
  duty/                     # 值班/换班
  place/, person/           # 重点场所/重点人员
  dispatch/, task/, alarm/, revisit/, case/, analysis/

utils/
  hmac.js                   # 纯 JS HMAC-SHA256
  nfcPayload.js             # NFC 授权 payload 生成
  nfcHce.js                 # HCE 原生插件 JS 封装
  system.js

nativeplugins/
  GXA-NfcHce/               # Android HCE 插件源码

docs/
  nfc_box_sequence.md       # 手机-钥匙盒 NFC 时序文档
```

---

## 4. 路由模块概览（按业务）

以下为高频模块（完整路由见 `pages.json`）：

- 工作台：`pages/work/work`
- 警车：`pages/car/list` / `pages/car/usecar` / `pages/car/keyPickup`
- 走访：`pages/visit/index` / `pages/visit/session` / `pages/visit/unlinked`
- 全辖区任务：`pages/zoneTasks/list`
- 会议：`pages/meeting/list` / `create` / `detail` / `selectUsers`
- 交接班：`pages/handwork/*`
- 休假：`pages/leave/*`
- 外出：`pages/out/*`
- 值班：`pages/duty/*`

---

## 5. 本地数据层（`common/database.js`）

### 5.1 存储 Key（现状）

当前本地 key 统一由 `KEYS` 管理，核心包括：

- 车务：`db_cars`, `db_car_use_logs`
- 工作台：`db_metrics`, `db_todos`
- 重点场所/人员：`db_places`, `db_key_persons`, `db_place_visits`, `db_key_person_visits` 等
- 交接班：`db_handwork_records`
- 休假/外出：`db_leave_requests`, `db_out_requests`
- 值班：`db_duty_memos`, `db_duty_swaps`, `db_duty_overrides`
- 走访：`db_visit_records`, `db_visit_drafts`, `db_visit_queue`, `db_temp_visit_records`
- 会议：`db_meetings`

### 5.2 数据层职责

`common/database.js` 当前承担三类职责：

1. 默认 mock 数据初始化（`ensure`）
2. CRUD 封装（`getXxx/saveXxx/updateXxx`）
3. 业务规则（如队列重试、外出联动审批、车辆状态更新等）

> 后端对接时建议先拆分为 `api + store/service`，逐步减少页面直接依赖 `database.js` 的业务逻辑。

---

## 6. 关键业务流现状

### 6.1 警车调度 + NFC 取钥匙

- 用车登记成功后会进入取钥匙流程（`pages/car/keyPickup`）
- HCE 会话由 `utils/nfcHce.js` 统一封装
- payload 签名由 `utils/nfcPayload.js` + `utils/hmac.js` 生成
- 插件目录：`nativeplugins/GXA-NfcHce`

关键状态字段（车记录）：

- `usingInfo.keyPicked`
- `usingInfo.keyPickedAt`
- `usingInfo.boxTxnId`

### 6.2 全辖区督导列表（zoneTasks）

- 页面：`pages/zoneTasks/list.vue`
- 领导视角筛选 + 列表展示
- 支持未分配任务“指派民警”（本地回写）

### 6.3 走访

- 首页、会话页、草稿箱（原“待归档”）
- 支持本地草稿与失败队列
- 路由映射：`common/routes/visit.js`

### 6.4 会议通知（第一阶段）

- 会议列表/创建/详情/选择参会人员
- 已支持：
  - 创建会议
  - 多人参会确认
  - 主持人选择
  - 自定义时间选择弹层
- 目前为本地存储版本（`db_meetings`）

### 6.5 休假 / 外出审批

- 三段审批流数据结构已在本地实现
- 外出支持与休假关联同步逻辑（本地）

### 6.6 值班 / 换班

- 月历展示 + 备忘录 + 换班申请
- 仍为本地规则与本地存储

---

## 7. 后端 API 对接建议（优先级）

## 7.1 第一优先（建议先打通）

1. 用户与组织
   - 当前登录用户
   - 警员列表（选择执行人/主持人/参会人/指派）
   - 部门/辖区字典

2. 工作台聚合
   - 全辖区态势汇总
   - 个人待办分组（超期/紧急/一般）

3. zoneTasks 统一任务流
   - 列表查询（按 type）
   - 指派民警
   - 状态流转

4. 会议通知
   - 创建会议
   - 列表/详情
   - 参会确认

## 7.2 第二优先

- 走访记录（对象、草稿、队列、上报）
- 车辆调度（用车、结束、日志）
- 休假/外出审批
- 值班换班

---

## 8. 推荐 API 资源模型（建议）

为减少前后端反复，建议按“资源域”定义：

- `/api/users`, `/api/depts`, `/api/areas`
- `/api/workbench/zone-summary`, `/api/workbench/my-todos`
- `/api/zone-tasks`（支持 `type=alarm|visit|revisit|case`）
- `/api/meetings`
- `/api/visits`
- `/api/cars`, `/api/car-use-logs`
- `/api/leaves`, `/api/outings`
- `/api/duty/memos`, `/api/duty/swaps`

统一返回建议：

- 时间字段统一毫秒时间戳或 ISO（全项目保持一致）
- 列表统一分页结构：`{ list, total, pageNo, pageSize }`
- 状态枚举与前端映射保持稳定（避免多套字符串）

---

## 9. 前后端对接落地策略（建议）

### 9.1 低风险迁移步骤

1. 保留 `database.js`，新增 `api/*` 封装  
2. 页面层先改为调用 `service`（service 内按开关选择 mock/api）  
3. 联调通过后再逐步下线本地 mock 写入逻辑  

### 9.2 建议开关

- `USE_MOCK=true/false`（可放 `common/config`）
- 开发期支持“接口失败回退 mock”，保证演示可用

---

## 10. 当前已知注意事项

1. NFC/HCE 功能仅 Android 生效，且依赖自定义基座/包体。  
2. 部分页面使用 `navigationStyle: custom`，顶部安全区需严格处理。  
3. 数据字段历史兼容较多（如 `status`、`officerName` 空值等），后端上线前需统一枚举。  
4. 目前多个业务的“筛选/统计文案”已按移动端优化，接口字段建议保持语义清晰可映射。  

---

## 11. 新同事快速上手（1小时）

1. 先看 `pages.json`（模块与路由全图）  
2. 再看 `common/database.js`（数据结构与业务状态）  
3. 按模块看页面：
   - 工作台：`pages/work/work.vue`
   - 督导：`pages/zoneTasks/list.vue`
   - 会议：`pages/meeting/*`
   - 车辆/NFC：`pages/car/*` + `utils/nfc*.js` + `nativeplugins/GXA-NfcHce`
4. 看 `docs/nfc_box_sequence.md`（NFC链路）  
5. 开始 API 接口联调时，从“工作台聚合 + zoneTasks + 会议”三块先替换。  

---

## 12. 建议后续补充文档

- `API_CONTRACT.md`：接口字段、状态枚举、错误码  
- `DEPLOY_AND_BUILD.md`：云打包/自定义基座流程  
- `TEST_CASES.md`：核心流程回归清单（会议、走访、用车、审批）  

