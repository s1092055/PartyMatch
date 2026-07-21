# API 總覽

所有端點均掛載於 `/api` 前綴下（見 `server/src/app.js`）。認證欄位標示：`公開` 無需 token；`optionalAuth` 有 token 則帶出更多資料，無 token 也可呼叫；`需登入` 必須帶合法 accessToken；`需管理員` 需 `isAdmin: true`。完整 request/response schema 請直接參考對應 route 檔案內的 `zod` schema。

## Auth（`server/src/routes/auth.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| POST | `/auth/register` | 公開 | 註冊帳號，回傳 `user` + `accessToken` + `refreshToken` |
| POST | `/auth/login` | 公開 | 登入 |
| POST | `/auth/refresh` | 公開（帶 `refreshToken`） | 換發新的 accessToken／refreshToken（rotate） |
| POST | `/auth/logout` | 需登入 | 登出目前這台裝置的 session |
| GET | `/auth/me` | 需登入 | 取得目前登入者資料 |

## Users（`server/src/routes/users.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/users/:id` | 公開 | 使用者公開資料（姓名、頭像、信用分數） |
| PATCH | `/users/me` | 需登入 | 更新個人資料 |
| POST | `/users/me/deactivate` | 需登入 | 軟刪除帳號（需再次輸入密碼） |

## Groups（`server/src/routes/groups.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/groups` | optionalAuth | 探索群組列表 |
| GET | `/groups/:id` | optionalAuth | 群組詳情 |
| POST | `/groups` | 需登入 | 建立群組 |
| PATCH | `/groups/:id` | 需登入 | 更新群組設定 |
| POST | `/groups/:id/activate` | 需登入 | `pending_activation → confirming`，開始 48h 確認期 |
| POST | `/groups/:id/confirm` | 需登入 | 成員確認服務正常 |
| POST | `/groups/:id/dispute` | 需登入 | 成員申訴（`confirming → disputed`） |
| POST | `/groups/:id/cancel` | 需登入 | 解散群組（啟用前），退還所有代管 PM 幣 |
| POST | `/groups/:id/lock` | 需登入 | `full → pending_confirmation` |
| POST | `/groups/:id/adjudicate` | 需管理員 | 裁定申訴，`winner: 'member' \| 'host'` |
| POST | `/groups/:id/renew` | 需登入 | `active → pending_confirmation`，向每位成員收取本期代管費用 |
| GET | `/groups/:id/transactions` | 需登入 | 團主查看該群組所有 PM 幣代管/撥款/退款紀錄 |
| DELETE | `/groups/:id` | 需登入 | 僅能刪除尚無成員的招募中群組 |

## Applications（`server/src/routes/applications.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/applications` | 需登入 | 與目前用戶相關的申請（申請人或團主視角） |
| POST | `/applications` | 需登入 | 送出申請 |
| DELETE | `/applications/:id` | 需登入 | 申請人撤回自己 `pending` 的申請 |
| PATCH | `/applications/:id` | 需登入 | 團主審核（`approved`/`rejected`/`removed`） |

## Members（`server/src/routes/members.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/members` `?groupId=` | 需登入 | 與目前用戶相關的成員（所在群組全部成員 + 主持群組的成員） |
| POST | `/members` | 需登入 | 團主手動加入成員 |
| PATCH | `/members/:id` | 需登入 | 成員本人或團主更新（如填寫訂閱帳號資訊） |
| DELETE | `/members/:id` | 需登入 | 團主移除成員，或成員本人退出 |

## Subscriptions（`server/src/routes/subscriptions.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/subscriptions` `?groupId=` | 需登入 | 自己的訂閱，或自己主持群組內的所有訂閱 |
| DELETE | `/subscriptions/:id` | 需登入 | 訂閱本人或該群組團主可刪除 |
| PATCH | `/subscriptions/:id` | 需登入 | 成員標記付款 / 團主確認 |

## Notifications（`server/src/routes/notifications.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/notifications` | optionalAuth | 個人通知 + 系統公告 |
| POST | `/notifications` | 需登入 | 建立通知（不採信前端傳入的 `isPublic`） |
| PATCH | `/notifications/read-all` | 需登入 | 全部標記已讀（須定義在 `/:id/read` 之前，避免被攔截） |
| PATCH | `/notifications/:id/read` | 需登入 | 單筆標記已讀 |

## Conversations / Messages（`server/src/routes/conversations.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/conversations` | 需登入 | 我的所有對話（含群組服務資訊、DM 參與者資訊） |
| POST | `/conversations/group` | 需登入 | 建立或取得群組聊天室 |
| POST | `/conversations/dm` | 需登入 | 建立或取得 DM |
| GET | `/conversations/:id/messages` | 需登入 | 該對話的訊息列表 |
| POST | `/conversations/:id/messages` | 需登入 | 發送訊息 |
| PATCH | `/conversations/:id/participants` | 需登入 | 加入或退出對話 |
| PATCH | `/conversations/:id/read` | 需登入 | 標記該對話已讀 |

## Favorites（`server/src/routes/favorites.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/favorites` | 需登入 | 我的收藏群組 |
| POST | `/favorites/:groupId` | 需登入 | 收藏／取消收藏（toggle） |

## Reviews（`server/src/routes/reviews.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/reviews/host/:hostId` | 公開 | 某位使用者作為團主的整體評價（跨群組彙總） |
| POST | `/reviews` | 需登入 | 對群組團主留下評價（同一群組同一人重複送出視為更新） |

## Services（`server/src/routes/services.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/services` | 公開 | 服務目錄列表 |
| GET | `/services/:id` | 公開 | 單一服務詳情 |

## Payment Methods（`server/src/routes/paymentMethods.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/payment-methods` | 需登入 | 我的付款方式列表 |
| POST | `/payment-methods` | 需登入 | 新增付款方式（上限 2 筆） |
| PATCH | `/payment-methods/:id/default` | 需登入 | 設為預設付款方式 |
| DELETE | `/payment-methods/:id` | 需登入 | 刪除付款方式 |

## Tokens（PM 幣，`server/src/routes/tokens.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/tokens` | 需登入 | 目前 PM 幣餘額與最近 50 筆交易 |
| POST | `/tokens/topup` | 需登入 | 模擬儲值 |

## Upload（`server/src/routes/upload.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| POST | `/upload/payment-proof` | 需登入 | 上傳付款憑證（base64 data URL） |
| POST | `/upload/dispute-evidence` | 需登入 | 上傳申訴佐證檔案（圖片或一般檔案） |

## System Messages（`server/src/routes/systemMessages.js`）

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| POST | `/system-messages/broadcast` | 需管理員 | 對全平台使用者的系統聊天室發送同一則訊息 |
| POST | `/system-messages/direct` | 需管理員 | 對單一使用者的系統聊天室發送訊息 |

---

各端點的權限收斂邏輯（如何限定查詢範圍到登入者本人）見 [後端架構文件](./backend-architecture.md#權限控管慣例)；認證 token 機制見 [認證機制](./authentication.md)。
