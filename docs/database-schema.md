# 資料庫 Schema 與狀態流程

資料庫使用 **MySQL 8**，以 **Prisma ORM** 管理 schema 與 migration。完整定義見 `server/prisma/schema.prisma`。

## Table 對應

| Table | 說明 |
|-------|------|
| `users` | 使用者帳號、密碼 hash、手機號碼（`phone`，註冊必填）、Google ID、信用分數、`tokenBalance`（平台PM幣餘額，1:1 對應 TWD） |
| `refresh_tokens` | JWT refresh token，支援多裝置登入 |
| `payment_methods` | 使用者付款方式（`brand`、卡片末四碼、有效期限、是否為預設） |
| `services` | 30 種訂閱服務清單與方案（JSON 欄位） |
| `groups` | 群組主資料（狀態、名額、方案、`billingCycle`、`escrowTokens`（代管中PM幣總額）、`confirmDeadline`（`confirming` 狀態的確認截止時間，啟用時間 + 48h）、`disputeDeadline`（`disputed` 狀態的裁定截止時間，申訴提出時間 + 3 天）） |
| `applications` | 申請紀錄（`pending` / `approved` / `rejected` / `removed` / `left` / `withdrawn`）；`withdrawn` 為申請人在審核前自行取消；被拒絕、移除、退出或自行取消後可重新申請（建立新記錄，保留歷史） |
| `members` | 群組成員（`serviceInfo` 訂閱帳號資訊、`serviceInfoIssueNote`、`disputeEvidenceUrl`（僅申訴階段使用，成員提供的爭議佐證截圖）） |
| `subscriptions` | 成員訂閱（帳號資訊、訂閱狀態、下次扣款日、`lastPaidAt`） |
| `token_transactions` | PM幣交易審計日誌（`userId`、`type`、`amount`、`relatedGroupId`、`note`）；類型包含 `topup`（儲值）、`escrow`（凍結至代管）、`release`（撥款給團主）、`refund`（退還給成員） |
| `notifications` | 個人通知 + 系統公告（`isPublic: true` 為公告） |
| `favorites` | 收藏群組（`userId` + `groupId` 唯一索引） |
| `conversations` | 對話（群組聊天室 / DM / 系統通知）；`type` 為 `group`、`dm` 或 `system`；`participants`、`unreadCounts`、`lastReadAt`、`lastMessage` 為 JSON 欄位，`initiatorId` 記錄 DM 發起人（用於延遲曝光機制，見「專案亮點」）；`system` 類型的聊天室每位使用者僅有一間（`participants` 只有自己），註冊時自動建立，唯讀（成員無法回覆），由平台系統帳號發送公告或客服訊息 |
| `messages` | 訊息（屬於某個 conversation）；一般訊息 `type: 'text'`，系統訊息另有 `actionType`/`payload`（JSON）欄位供前端渲染操作型訊息 |
| `reviews` | 團主評價（`groupId`、`hostId`、`authorId`、`rating` 1-5、`comment`）；`(groupId, authorId)` 唯一索引，成員確認服務後可留言，同一群組同一人重複送出視為更新；評價依 `hostId` 彙總，是跨群組的團主整體評價，非單一群組評分 |

---

## 事件驅動清單

全域 Modal 以 `window.dispatchEvent` 驅動，不依賴 React props 層層傳遞。

| 事件 | 觸發者 | 接收者 |
|------|--------|--------|
| `pm:open-group` | 群組卡片 / Redirect | `GroupDetailModal` |
| `pm:open-notify` | AppNav 通知按鈕 | `FloatingMessages` |
| `pm:open-messages` | AppNav / 訂閱卡 / 群組操作 | `MessagesModal` |
| `pm:open-dm` | 聯絡團主 | `MessagesModal` 建立或取得 DM |
| `pm:open-host-group` | 通知點擊 / `FloatingMessages` / `ChatWindow` | `HostPage` 開啟指定群組 Modal（支援 `openLockGroup`、`openActivate`、`openApplications`、`openBilling` 旗標） |
| `pm:notif-changed` | `useNotificationStore` | `AppNav` 更新通知未讀 badge |
| `pm:convs-changed` | `useConversationStore` | `AppNav` 更新訊息未讀 badge；`MessagesModal` 重新讀取對話列表 |
| `pm:auth-changed` | `useAuthStore` | `AppNav` 重新讀取使用者狀態 |
| `pm:members-changed` | `useMemberStore` | `GroupDetailModal`、`ChatWindow`、`ExplorePage`、`HostPage` 重新讀取成員狀態 |
| `pm:applications-changed` | `useApplicationStore` | `GroupDetailModal`、`ExplorePage`、`MemberPage`、`HostPage` 重新讀取申請狀態 |

---

## 群組狀態

| 狀態 | 說明 | 主要操作 |
|------|------|----------|
| `recruiting` | 招募中 | 審核申請、查看成員 |
| `full` | 名額已滿，等待團主鎖定群組 | 點「鎖定群組」（同時設定所有成員訂閱的下次扣款日） |
| `pending_confirmation` | 帳號資訊填寫階段：成員填寫訂閱帳號資訊；**付款已在核准時代管完成，扣款日已在鎖定時設定，本階段無任何付款操作** | 全員填寫完成後自動推進 |
| `pending_activation` | 帳號資訊齊全，等待團主啟用服務 | 啟用服務 |
| `confirming` | 服務啟用後最長 2 天（48 小時）確認期倒數；成員主動確認則倒數立即結束並撥款；成員向平台申訴則進入 `disputed`；倒數結束未操作則自動撥款。**注意**：`group.status` 是全體共用的真實狀態，只有全員都確認（或倒數結束自動撥款）才會轉為 `active`；但已自行確認的成員在自己的畫面（群組卡片、群組詳情）會顯示為「啟用中」，這是前端依 `member.confirmedAt` 計算的個人化顯示，不代表群組真實狀態已改變 | 成員主動確認（即時結束）/ 向平台申訴 / 後端惰性自動撥款 |
| `disputed` | 有成員向平台正式申訴；`disputeDeadline` 設為申訴提出時間 + 3 天；代管金額凍結，由平台客服在期限內裁定並附說明；裁定只影響申訴的那位成員，其餘成員不受影響；**成員獲勝** → 退款給該成員並離開群組、群組回 `active`；**團主獲勝** → 代管撥款給團主、群組回 `active` | 平台客服裁定後手動推進 |
| `active` | 服務已啟用 | 開始新一期收款或結束服務 |
| `cancelled` | 團主在群組鎖定前（`recruiting` / `full`）解散群組；所有代管金額退還成員PM幣餘額 | 歷史狀態，唯讀 |
| `ended` | 服務到期後團主結束服務 | 歷史狀態，唯讀 |

---

## PM幣與代管機制

平台使用內部PM幣（1 PM幣 = 1 TWD）作為交易媒介，所有金流在平台內部流轉，**不涉及 LINE Pay、銀行轉帳或任何外部付款方式**。

### 交易流程

```
申請階段：系統檢查 user.tokenBalance 是否 ≥ 席位費用（不扣款）
     ↓
團主核准：user.tokenBalance -= 費用；group.escrowTokens += 費用；寫入 token_transaction（type: escrow）
     ↓
團主鎖定群組：設定各成員訂閱的 nextBillingDate
     ↓
全員填寫帳號資訊 → 團主啟用服務：群組進入 confirming，設定 confirmDeadline（啟用時間 + 48h）
     ↓
48h 窗口內
├── 成員主動確認服務正常 → 確認期立即結束，即時撥款給團主；token_transaction（type: release）
├── 成員向團主反應問題 → 透過群組聊天室溝通，狀態維持 confirming，計時持續
├── 成員向平台正式申訴 → 群組進入 disputed，代管凍結；成員可提供截圖佐證（disputeEvidenceUrl）；客服 3 天內裁定
└── 逾期未操作 → 後端惰性求值（讀取 group 時若 confirming + deadline 已過，自動撥款給團主）
```

### 儲值（模擬）

目前為模擬模式：使用者點擊「儲值」按鈕後，平台直接增加PM幣餘額，並記錄 `token_transaction（type: topup）`。已安裝 Stripe SDK，尚未串接實際扣款邏輯，為未來擴充項目。

---

## 訂閱狀態

`subscriptions.status` 欄位追蹤成員訂閱的生命週期：

| 狀態 | 說明 |
|------|------|
| `pending` | 帳號資訊尚未填寫完成（`pending_confirmation` 階段） |
| `active` | 訂閱已啟用，服務運作中 |
| `ended` | 訂閱已結束（群組 ended / cancelled / paused） |

`src/shared/utils/subscriptionStatus.js` 依訂閱狀態與群組狀態計算實際顯示文字。

---

## NotificationType 枚舉值

後端 Prisma schema 定義的完整通知類型：

`application_sent`、`new_application`、`application_approved`、`application_rejected`、`group_created`、`group_chat_opened`、`group_activated`、`group_full`、`group_ended`、`member_joined`、`member_removed`、`member_left`、`service_info_issue`、`token_topup`、`escrow_released`（成員主動確認或逾期自動撥款後發送）、`dispute_raised`、`system`

---

## 已知限制

| 類別 | 限制 |
|------|------|
| 認證 | Google OAuth 尚未實作（目前回傳 stub 錯誤） |
| 認證 | 重設密碼寄信尚未實作（目前回傳 stub 錯誤） |
| 認證 | 註冊手機號碼僅做格式驗證（`09xxxxxxxx`），尚未串接簡訊 OTP 驗證是否為本人持有 |
| 金流 | PM幣儲值為模擬模式（點擊即儲值），尚未串接正式金流 |
| 代管 | `confirming` 狀態的自動撥款採惰性求值（讀取 group 時觸發），非排程任務 |
| 即時性 | 訊息中心採用 5 秒 polling，非 WebSocket 即時推送 |
| 系統訊息 | 客服僅能透過 `POST /system-messages/broadcast`（全體）或 `/direct`（單一使用者）API 發送，尚無後台管理介面；系統聊天室對使用者為唯讀，無法回覆 |
