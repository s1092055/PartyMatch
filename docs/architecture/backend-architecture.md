# 後端架構

## 技術基礎

Node.js + Express，`server/src/app.js` 為應用組裝入口，`server/src/server.js` 負責啟動監聽。全域 middleware 順序：`helmet()` → `cors()`（`origin` 讀 `CLIENT_ORIGIN`，預設 `http://localhost:5173`，`credentials: true`）→ `morgan()`（production 用 `combined`、其餘用 `dev`）→ `express.json({ limit: '10mb' })`，最後掛載各 route 與全域 `errorHandler`。

---

## Route 架構

`server/src/routes/` 底下每個檔案對應一個資源，統一以複數資源名命名，並在 `app.js` 掛載到對應的 `/api/<resource>` 前綴：

| 檔案 | 掛載路徑 | 負責資源 |
|------|---------|---------|
| `auth.js` | `/api/auth` | 註冊、登入、refresh、登出、`GET /me` |
| `groups.js` | `/api/groups` | 群組 CRUD、狀態機推進（activate/confirm/dispute/cancel/lock/adjudicate/renew）、交易紀錄 |
| `applications.js` | `/api/applications` | 申請建立、撤回、審核 |
| `subscriptions.js` | `/api/subscriptions` | 成員訂閱查詢、刪除、付款狀態更新 |
| `notifications.js` | `/api/notifications` | 個人通知與系統公告的建立／查詢／標記已讀 |
| `conversations.js` | `/api/conversations` | 對話列表、訊息收發、已讀狀態、參與者管理 |
| `favorites.js` | `/api/favorites` | 收藏群組 |
| `services.js` | `/api/services` | 服務目錄查詢（唯讀） |
| `users.js` | `/api/users` | 使用者公開資料、個人資料更新、帳號停用 |
| `upload.js` | `/api/upload` | 付款憑證／申訴佐證圖片上傳 |
| `members.js` | `/api/members` | 群組成員查詢、加入、更新、移除 |
| `tokens.js` | `/api/tokens` | PM幣餘額查詢、儲值 |
| `paymentMethods.js` | `/api/payment-methods` | 付款方式 CRUD |
| `reviews.js` | `/api/reviews` | 團主評價查詢與提交 |
| `systemMessages.js` | `/api/system-messages` | 管理員發送系統公告／私訊（`requireAdmin`） |

每個 route 檔案內部結構一致：`Router()` 實例 → 以 `zod` 定義的 request body schema → `router.<method>(path, [middleware...], async (req, res, next) => { try { ... } catch (err) { next(err) } })`，統一用 `try/catch` + `next(err)` 交給全域錯誤處理，不在各自 handler 內重複組裝錯誤回應格式。

---

## Middleware

### `server/src/middleware/auth.js`

三種驗證等級，皆解析 `Authorization: Bearer <token>` header：

- `requireAuth`：驗證 accessToken，失敗回 401；成功將 payload 寫入 `req.user`
- `requireAdmin`：先驗證 accessToken，再多查一次 `prisma.user.findUnique` 確認 `isAdmin`，非管理員回 403（用於 `groups.js` 的 `/adjudicate` 與 `systemMessages.js` 全部端點）
- `optionalAuth`：有合法 token 則填入 `req.user`，驗證失敗或無 token 都放行（不阻擋），供 `groups.js` 的 `GET /`、`GET /:id` 與 `notifications.js` 的 `GET /` 這類「訪客也能看，但登入後可看到更多」的端點使用

### `server/src/middleware/validate.js`

`validate(schema)` 回傳一個 middleware，用 `schema.safeParse(req.body)` 驗證，失敗回 `400 { message, errors }`（`errors` 為 `zod` 的 `flatten().fieldErrors`），成功則用解析後的 `result.data` 覆寫 `req.body`（會剝除 schema 未定義的多餘欄位）再放行。

### `server/src/middleware/errorHandler.js`

全域錯誤處理 middleware，掛在 `app.js` 所有 route 之後。讀取 `err.status ?? err.statusCode ?? 500`，回傳 `{ message: err.message ?? '伺服器發生錯誤，請稍後再試' }`。各 route handler 在需要回傳特定狀態碼的業務錯誤時，直接 `const err = new Error('...'); err.statusCode = 409; throw err`，交由 `next(err)`／`catch` 送到這裡統一序列化，不需要每個 handler 各自組裝 response。

---

## Prisma 使用方式

Schema 定義於 `server/prisma/schema.prisma`，`datasource` 為 MySQL 8，所有 route 透過 `server/src/lib/prisma.js` 匯出的單例 `PrismaClient` 存取資料庫。

### Transaction 使用場景

涉及「多個資料表需一起成功或一起失敗」的業務流程一律包在 `prisma.$transaction(async (tx) => { ... })` 內：

- **`applications.js` 的 `POST /`（送出申請）**：代管扣款發生在這裡，不是等團主核准——條件式 `updateMany` 扣款（`tokenBalance: { gte: seatCost }`）→ 建立 `Application`（含 `escrowAmount: seatCost`，記錄實際扣了多少錢）→ `group.escrowTokens` 增加 → 寫入 `TokenTransaction`；任一步驟失敗整包回滾。
- **`applications.js` 的 `PATCH /:id`（核准申請）**：條件式 `updateMany`（僅 `status: 'pending'` 才能轉 `approved`，避免併發重複核准）→ 檢查群組名額 → 呼叫 `finalizeApprovedApplication(tx, ...)`（`server/src/utils/membership.js`，只做名額與招募狀態更新、建立 member/subscription，因為代管扣款已在申請時完成，這裡完全不碰 `tokenBalance`/`escrowTokens`）。拒絕分支則先用條件式 `updateMany`（僅 `status: 'pending'` 才算數）決定要不要呼叫 `refundEscrow` 退款，但狀態轉換（`status`/`activeKey`）不論退款與否都會無條件寫入——早期版本曾經把狀態寫入也綁進這個條件式，導致跟團主移除已核准成員（該申請當下狀態是 `approved` 不是 `pending`）撞在一起時，狀態被誤判成不用處理而卡住，已修正為狀態轉換與退款是兩個各自獨立判斷的步驟。
- **`applications.js` 的 `DELETE /:id`（撤回申請）**：跟拒絕分支相同的退款邏輯，僅本人可對自己 `pending` 的申請操作。
- **`members.js` 的 `POST /`（團主手動加入成員）**：呼叫 `admitMemberIntoGroup(tx, ...)`（走完整扣款邏輯，因為這個路徑沒有經過「申請」步驟），與申請核准流程共用同一套名額邏輯，避免繞過上限。
- **`members.js` 的 `DELETE /:id`（移除成員／成員退出）**：刪除 member → 群組人數遞減 → 呼叫 `refundEscrow` 退款給使用者 → 對應 `Application` 狀態改為 `left`/`removed`，全部在同一 transaction 內完成。
- 上述三處退款（拒絕、撤回、成員移除/退出）都共用 `server/src/utils/membership.js` 的 `refundEscrow(tx, { userId, groupId, amount, note })`，退款金額一律由呼叫端算好（取當初 `escrowAmount` 與目前 `escrowTokens` 的 `Math.min`）再傳進去，避免三處各自重寫一次「加回餘額、扣代管、寫交易紀錄」且退款上限的夾法不一致。

非跨表寫入或不需要原子性的查詢（如各資源的 `GET`）則直接呼叫 `prisma.<model>.findMany`/`findUnique`，不包 transaction。

---

## JWT 認證機制（概述）

accessToken + refreshToken 雙 token 設計，refreshToken 存於 Redis（key 格式 `refresh:{userId}:{sessionId}`），支援同一帳號多裝置各自維護獨立 session。詳細流程（登入/註冊/refresh/登出、`sessionId` 設計、前端 `axiosClient` 的自動 retry）見 [認證機制](./authentication.md)。

---

## Redis 用途

透過 `server/src/lib/redis.js`（`ioredis`，`maxRetriesPerRequest: 3`、`enableReadyCheck: false`）存取，目前唯一用途是儲存 refreshToken session：

- `refresh:{userId}:{sessionId}` → refreshToken 字串，TTL 7 天（`60 * 60 * 24 * 7` 秒），對應 `JWT_REFRESH_EXPIRES`
- 帳號停用（`POST /users/me/deactivate`）時呼叫 `deleteAllUserSessions(userId)`（`auth.js` 匯出），用 `SCAN`（而非 `KEYS`，避免阻塞整個 Redis）掃出該使用者所有 session key 一次刪除，讓所有裝置立即登出
- 相容沒有 `sessionId` 後綴的舊格式 key（`refresh:{userId}`），refresh 一次後自動升級成新格式並清除舊 key

目前 Redis 沒有用於一般資料快取（例如群組/服務清單查詢快取），純粹作為 session store。

---

## 錯誤處理慣例

- 各 route handler 用 `try { ... } catch (err) { next(err) }` 包裹整個 async 邏輯
- 已知的業務錯誤（餘額不足、狀態不符、權限不足）直接 `return res.status(4xx).json({ message: '...' })`
- 需要在 `$transaction` 內拋出並讓外層 `catch` 接住的錯誤，用 `err.statusCode` 帶狀態碼（如 applications.js 核准流程的 409/404），而非直接在 transaction callback 內呼叫 `res`
- 未捕捉的例外一律落到 `errorHandler`，讀 `err.status ?? err.statusCode ?? 500`
- Prisma 已知錯誤碼會個別判斷後轉換成語意化訊息，例如 `applications.js` 的 `POST /` 捕捉 `err.code === 'P2002'`（unique constraint violation）轉成 `409 你已有一筆進行中的申請`

---

## 權限控管慣例

每個需要登入的 route 一律以 `req.user.id`（由 `requireAuth` 解出）收斂查詢範圍，常見模式：

- **只回傳與自己相關的資料**：`applications.js`／`subscriptions.js` 的 `GET /` 用 `OR: [{ userId: req.user.id }, { group: { hostId: req.user.id } }]`，同時涵蓋「我是申請人/訂閱者」與「我是團主」兩種身分
- **操作前先查一次資源確認擁有權**：`PATCH`/`DELETE` 類端點先 `findUnique` 讀出資源與其所屬 `group.hostId`，比對 `req.user.id` 是否為擁有者或該群組團主，不符回 403（`members.js`、`subscriptions.js` 皆採此模式）
- **查詢前驗證關聯性**：`members.js` 的 `GET /?groupId=` 先確認請求人是該群組成員或團主才放行，非相關人員回 403
- **不信任前端傳入的敏感欄位**：`notifications.js` 的 `POST /` 不採信前端傳入的 `isPublic`（一律視為 `false`），且發通知給他人時需驗證請求人與目標使用者皆與 `meta.groupId` 指定的群組有關聯（成員／團主／曾送出申請）
- **管理員限定操作**：`requireAdmin` 用於 `groups.js` 的 `/adjudicate`（申訴裁定）與 `systemMessages.js` 全部端點（廣播公告、發送私訊）

沒有開放 `POST /subscriptions`：訂閱一律透過 `applications.js` 的核准流程以 transaction 建立，避免使用者繞過審核直接建立。

完整 API 端點清單見 [API 總覽](./api-overview.md)。
