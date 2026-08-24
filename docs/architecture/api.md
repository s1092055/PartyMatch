# API 總覽

後端提供一組 REST API，依資源分類（使用者、群組、申請、成員、訂閱、通知、對話、收藏、評價、服務目錄、PM 幣、檔案上傳、系統訊息、帳號留言、管理員後台），遵循標準資源導向命名慣例（GET/POST/PATCH/DELETE 對應查詢/建立/更新/刪除）。

## 認證層級

端點依需求分四種：**公開**（如服務目錄查詢）、**選擇性登入**（訪客可呼叫，登入後看到更多資料，如探索頁群組列表）、**需登入**、**需管理員**（如申訴裁定、系統公告發送）。認證 token 機制見 [認證機制](./authentication.md)。

## 設計原則

- 群組相關端點另外處理狀態機推進動作（啟用、確認、申訴、解散、續訂等），與一般 CRUD 分開
- 涉及金流的操作（申請、退款、撥款）在後端以交易方式保證原子性，前端不直接操作餘額
- 回傳「其他使用者」資料的端點會依對方的隱私設定遮罩敏感欄位

## 主要端點

| Method | Endpoint | Auth | 說明 |
|--------|----------|------|------|
| POST | `/auth/register`／`/auth/login` | 公開 | 註冊／登入，簽發 accessToken + refreshToken |
| POST | `/auth/refresh` | 公開（帶 Cookie） | 用 refreshToken 換發新 accessToken |
| GET | `/groups` | 選擇性登入 | 群組列表（探索頁），登入後可排除自己已加入的 |
| GET／POST／PATCH／DELETE | `/groups/:id` | 選擇性登入／需登入 | 群組 CRUD；金額/名額由後端依方案 derive，不採信前端傳值 |
| POST | `/groups/:id/lock` | 需登入（團主） | `full → pending_confirmation`，設定扣款日與帳號資訊填寫期限 |
| POST | `/groups/:id/activate` | 需登入（團主） | `pending_activation → confirming`，開始確認期 |
| POST | `/groups/:id/confirm` | 需登入（成員） | 成員確認服務，全員確認或期限到才撥款 |
| POST | `/groups/:id/dispute`／`/adjudicate` | 需登入／需管理員 | 成員申訴、管理員裁定勝方 |
| POST | `/groups/:id/renew` | 需登入（團主） | `active → pending_confirmation`，開始下一期 |
| GET | `/applications` | 需登入 | 與自己相關的申請（申請人或團主視角） |
| POST | `/applications` | 需登入 | 送出加入申請，代管扣款在這裡就發生 |
| PATCH | `/applications/:id` | 需登入（團主） | 審核（`approved`／`rejected`／`removed`） |
| DELETE | `/applications/:id` | 需登入（申請人） | 取消審核中的申請，退款 |
| GET／POST／PATCH／DELETE | `/members` | 需登入 | 群組成員與其服務帳號資訊 |
| GET | `/tokens` | 需登入 | PM 幣餘額與最近 50 筆交易紀錄 |
| POST | `/tokens/topup` | 需登入 | 模擬儲值 |

完整端點清單（含通知／對話／收藏／評價／服務目錄／管理員後台等）散落在 `server/src/routes/` 各檔案，未逐支列出。

## 範例：幾支關鍵端點

### 送出申請（`POST /applications`）

代管扣款在申請當下就發生，不是等團主接受才扣款。

```json
// Request
{ "groupId": "clx...", "message": "希望加入群組" }

// Response 201
{ "id": "cly...", "groupId": "clx...", "userId": "clz...", "status": "pending", "escrowAmount": 350, ... }
```

錯誤情況（皆為 400，除非另外標註）：

| code | 情境 |
|------|------|
| `INSUFFICIENT_BALANCE` | PM 幣餘額不足付席位費，回傳 `required` 欄位告知需要金額 |
| `CREDIT_SCORE_TOO_LOW` | 信用分數低於群組設定的 `minCreditScore` |
| `REAPPLY_COOLDOWN` | 逾期未填帳號資訊被自動移出後，24 小時內重新申請同一群組 |
| （無 code，409） | 已有一筆進行中的申請（`P2002` unique constraint） |

### 團主審核（`PATCH /applications/:id`）

```json
// Request
{ "status": "approved" }
```

接受時用條件式 `updateMany`（`WHERE status = 'pending'`）搶佔申請，若 `count === 0` 代表這筆申請已被別的請求處理過（例如同時雙擊、或另一個分頁已先審核），回傳 `409 此申請已被處理，請重新整理頁面`——這是實際會發生的併發情境，不是理論上的邊界案例。拒絕／移除則走條件式退款，避免重複退款。

### 鎖定群組（`POST /groups/:id/lock`）

```json
// Request（sharing method 為 shared_credentials 的服務才需要帶）
{ "sharedCredentials": "帳號：xxx／密碼：xxx" }
```

只有 `status === 'full'` 的群組能鎖定，否則 `400 群組狀態為 {status}，無法鎖定（需為 full）`；非團主呼叫回 `403 僅團主可操作`。`sharedCredentials` 落地前用 AES-256-GCM 加密（見[資料庫 Schema 文件](./database.md)）。

### 申訴裁定（`POST /groups/:id/adjudicate`，需管理員）

```json
// Request
{ "winner": "member", "reason": "團主未能提供有效帳號資訊" }
```

`winner` 只接受 `member`／`host`，其餘回 `400 winner 必須為 member 或 host`；群組必須是 `disputed` 狀態，否則 `400 群組狀態為 {status}，不在申訴期`。`winner: member` 退款給申訴成員並移出群組，`winner: host` 撥款給團主，皆包在單一 Prisma transaction 內，並用條件式搶佔避免跟團主同時自行協調解決（`resolve-dispute`）互相衝突。
