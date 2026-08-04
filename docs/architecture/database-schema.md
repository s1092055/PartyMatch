# 資料庫 Schema 與狀態流程

資料庫使用 **MySQL 8**，以 **Prisma ORM** 管理 schema 與 migration。完整定義見 `server/prisma/schema.prisma`。

## Table 對應

| Table | 說明 |
|-------|------|
| `users` | 使用者帳號、密碼 hash、手機號碼（`phone`，註冊必填，E.164 格式如 `+886912345678`，前端拆成國碼下拉＋本地號碼兩欄輸入，方便之後擴充其他國家）、`bio`（個人簡介，選填，上限 500 字，群組詳情的團主介紹與成員名單都會顯示，讓同群組的人彼此看得到）、Google ID、`creditScore`（信用分數，預設／滿分 100，目前僅為靜態欄位，尚未有動態調整或上限保護機制，新增寫入時需自行確保不超過 100）、`tokenBalance`（平台PM幣餘額，1:1 對應 TWD）、`deactivatedAt`（非 null 代表帳號已軟刪除停用，登入/refresh 一律拒絕，保留資料供日後申請恢復）、`showAvatar`（`Boolean`，預設 `true`；隱私設定「顯示自己的大頭照」，帳號中心「其他設定」切換；為 `false` 時，後端會在回傳給「別人」看的資料裡把該使用者的 `avatarInitial`/`avatarColor` 遮罩成 `null`，見下方〈大頭照隱私遮罩〉）、`presenceStatus`（`PresenceStatus` 列舉 `online`／`busy`／`offline`，預設 `online`；使用者在帳號中心手動選擇的線上狀態，非自動偵測，不受 `showAvatar` 影響、一律照實回傳） |
| `payment_methods` | 使用者付款方式（`brand`、卡片末四碼、有效期限、是否為預設） |
| `services` | 28 種訂閱服務清單與方案（JSON 欄位） |
| `groups` | 群組主資料（狀態、名額、方案、`billingCycle`、`escrowTokens`（代管中PM幣總額）、`serviceInfoDeadline`（`pending_confirmation` 狀態的填寫帳號資訊截止時間，鎖定時間 + 24h，僅供前端顯示倒數）、`confirmDeadline`（`confirming` 狀態的確認截止時間，啟用時間 + 48h）、`disputeDeadline`（`disputed` 狀態的裁定截止時間，申訴提出時間 + 48 小時，跟確認期 `confirmDeadline` 同一套節奏）、`sharedCredentials`（無官方多人邀請機制的服務，團主鎖定群組時提供的帳號密碼，讓成員填寫服務帳號畫面能直接顯示，不用回頭翻聊天室訊息，僅存在前端 `sharingMethod: shared_credentials` 分類會用到，後端不知道這個分類本身，單純是有傳就存）） |
| `applications` | 申請紀錄（`pending` / `approved` / `rejected` / `removed` / `left` / `withdrawn`）；`withdrawn` 為申請人在審核前自行取消；被拒絕、移除、退出或自行取消後可重新申請（建立新記錄，保留歷史）；`escrowAmount` 記錄送出申請當下實際代管扣款的金額，撤回/拒絕退款要用這個值而非即時價格重算，避免群組價格事後變動導致退款金額對不上；`activeKey` 只在 `pending`/`approved`（進行中）時為 `'active'`，其餘狀態為 `null`，搭配 `@@unique([groupId, userId, activeKey])`（MySQL unique index 允許多個 null 並存）模擬「同一使用者對同一群組最多一筆進行中申請」的 partial unique index，避免併發送出申請造成重複 pending 申請 |
| `members` | 群組成員（`serviceInfo` 訂閱帳號資訊、`serviceInfoIssueNote`、`disputeEvidenceUrl`（僅申訴階段使用，成員提供的爭議佐證截圖）） |
| `subscriptions` | 成員訂閱（帳號資訊、訂閱狀態、下次扣款日、`lastPaidAt`） |
| `token_transactions` | PM幣交易審計日誌（`userId`、`type`、`amount`、`relatedGroupId`、`note`）；類型包含 `topup`（儲值）、`escrow`（凍結至代管）、`release`（撥款給團主）、`refund`（退還給成員） |
| `notifications` | 個人通知 + 系統公告（`isPublic: true` 為公告） |
| `favorites` | 收藏群組（`userId` + `groupId` 唯一索引） |
| `conversations` | 對話（群組聊天室 / DM / 系統通知）；`type` 為 `group`、`dm` 或 `system`；`participants`、`unreadCounts`、`lastReadAt`、`lastMessage` 為 JSON 欄位，`initiatorId` 記錄 DM 發起人（僅供除錯/分析用，延遲曝光機制實際只依 `lastMessage` 是否為 null 判斷，不分是不是發起人自己，見「專案亮點」）；`system` 類型的聊天室每位使用者僅有一間（`participants` 只有自己），註冊時自動建立，唯讀（成員無法回覆），由平台系統帳號發送公告或客服訊息 |
| `messages` | 訊息（屬於某個 conversation）；一般訊息 `type: 'text'`，系統訊息另有 `actionType`/`payload`（JSON）欄位供前端渲染操作型訊息 |
| `reviews` | 團主評價（`groupId`、`hostId`、`authorId`、`rating` 1-5、`comment`）；`(groupId, authorId)` 唯一索引，成員確認服務後可留言，同一群組同一人重複送出視為更新；評價依 `hostId` 彙總，是跨群組的團主整體評價，非單一群組評分 |

---

## 大頭照隱私遮罩

`server/src/lib/avatarVisibility.js` 匯出 `maskAvatar(user)`：使用者關閉「顯示自己的大頭照」（`showAvatar: false`）時，把要回傳給「別人」看的使用者資料裡的 `avatarInitial`/`avatarColor` 蓋成 `null`（前端 `Avatar` 元件遇到 `initial` 為空會 fallback 成 PartyMatch logo），並拿掉 `showAvatar` 欄位本身，不讓其他使用者知道對方的開關狀態。所有會把使用者資料回傳給「別人」看的 route 都套用這層遮罩：群組詳情/列表的 `host`／成員 `user`（`groups/crud.js`、`groups/lifecycle.js`）、`members.js`、`applications.js`、對話參與者與訊息寄件者（`conversations.js`）、評價作者（`reviews.js`）、群組交易紀錄的使用者（`groups/crud.js` 的 `GET /:id/transactions`）、`GET /users/:id`。**自己看自己**的端點（`GET /auth/me`、`PATCH /users/me`）不套用遮罩，一律回傳真實值。`presenceStatus`（線上狀態點）不受這層遮罩影響，加在跟 `avatarInitial`/`avatarColor` 相同的 select 清單裡，但一律照實回傳，不會被 `maskAvatar` 蓋掉。

---

## 事件驅動清單

全域 Modal 以 `window.dispatchEvent` 驅動，不依賴 React props 層層傳遞。

| 事件 | 觸發者 | 接收者 |
|------|--------|--------|
| `pm:open-group` | 群組卡片 / Redirect | `GroupDetailModal` |
| `pm:open-notify` | AppNav 通知按鈕 | `FloatingMessages` |
| `pm:open-messages` | AppNav / 訂閱卡 / 群組操作 | `MessagesModal` |
| `pm:close-messages` | `MessageBubble` 內的操作型訊息按鈕（例如點「填寫服務帳號」導頁前） | `MessagesModal` 關閉自己 |
| `pm:open-dm` | 聯絡團主 | `MessagesModal` 建立或取得 DM |
| `pm:open-host-group` | 通知點擊 / `FloatingMessages` / `ChatWindow` | `ManageGroupsPage.jsx` 開啟指定群組 Modal（支援 `openLockGroup`、`openActivate`、`openApplications`、`openBilling` 旗標） |
| `pm:open-topup` | `GroupDetailModal`「PM幣不足」Toast 的「前往儲值」按鈕 | `AppNav` 開啟儲值 Modal |
| `pm:refresh-member-stores` | `useNotificationStore` 輪詢偵測到 `member_left`/`member_removed`；`FloatingMessages` 點擊同類通知 | `App.jsx` 重新 `init()` 成員與訂閱 store |
| `pm:refresh-application-store` | `useNotificationStore` 輪詢偵測到 `new_application`/`application_withdrawn` | `App.jsx` 重新 `init()` 申請 store |

---

## 群組狀態

| 狀態 | 說明 | 主要操作 |
|------|------|----------|
| `recruiting` | 招募中 | 審核申請、查看成員 |
| `full` | 名額已滿，等待團主鎖定群組 | 點「鎖定群組」（同時設定所有成員訂閱的下次扣款日） |
| `pending_confirmation` | 帳號資訊填寫階段：成員填寫訂閱帳號資訊；**付款已在申請當下代管完成，扣款日已在鎖定時設定，本階段無任何付款操作**；`serviceInfoDeadline`（鎖定時間 + 24h）僅在團主與成員的群組詳情頁顯示倒數提醒，逾期不會自動處理 | 全員填寫完成後自動推進 |
| `pending_activation` | 帳號資訊齊全，等待團主啟用服務 | 啟用服務 |
| `confirming` | 服務啟用後最長 2 天（48 小時）確認期倒數；成員主動確認則倒數立即結束並撥款；成員向平台申訴則進入 `disputed`；倒數結束未操作則自動撥款。**注意**：`group.status` 是全體共用的真實狀態，只有全員都確認（或倒數結束自動撥款）才會轉為 `active`；但已自行確認的成員在自己的畫面（群組卡片、群組詳情）會顯示為「服務中」，這是前端依 `member.confirmedAt` 計算的個人化顯示，不代表群組真實狀態已改變 | 成員主動確認（即時結束）/ 向平台申訴 / 後端惰性自動撥款 |
| `disputed` | 有成員向平台正式申訴；`disputeDeadline` 設為申訴提出時間 + 48 小時；代管金額凍結，由平台客服在期限內裁定並附說明；裁定只影響申訴的那位成員，其餘成員不受影響；**成員獲勝** → 退款給該成員並離開群組、群組回 `active`；**團主獲勝** → 代管撥款給團主、群組回 `active` | 平台客服裁定後手動推進 |
| `active` | 服務已啟用 | 開始新一期收款或結束服務 |
| `cancelled` | 團主在群組鎖定前（`recruiting` / `full`）解散群組；所有代管金額退還成員PM幣餘額 | 歷史狀態，唯讀 |
| `ended` | 服務到期後團主結束服務 | 歷史狀態，唯讀 |

---

## PM幣與代管機制

平台使用內部PM幣（1 PM幣 = 1 TWD）作為交易媒介，所有金流在平台內部流轉，**不涉及 LINE Pay、銀行轉帳或任何外部付款方式**。

### 交易流程

```
申請階段：user.tokenBalance -= 席位費用；group.escrowTokens += 費用；寫入 token_transaction（type: escrow）
     ↓
團主接受：僅建立 member/subscription、名額 +1，代管金額已在申請時扣款，這裡不再重複扣款
     ↓
團主拒絕 / 申請人撤回：group.escrowTokens -= 費用；user.tokenBalance += 費用；寫入 token_transaction（type: refund）
     ↓
團主鎖定群組：設定各成員訂閱的 nextBillingDate，並設定 serviceInfoDeadline（鎖定時間 + 24h，前端顯示倒數，逾期不自動處理）
     ↓
全員填寫帳號資訊 → 團主啟用服務：群組進入 confirming，設定 confirmDeadline（啟用時間 + 48h）
     ↓
48h 窗口內
├── 成員主動確認服務正常 → 確認期立即結束，即時撥款給團主；token_transaction（type: release）
├── 成員向團主反應問題 → 透過群組聊天室溝通，狀態維持 confirming，計時持續
├── 成員向平台正式申訴 → 群組進入 disputed，代管凍結；成員可提供截圖佐證（disputeEvidenceUrl）；客服 48 小時內裁定
└── 逾期未操作 → 後端惰性求值（讀取 group 時若 confirming + deadline 已過，自動撥款給團主）
```

### 續訂收款

`active` 群組由團主觸發「開始新一期收款」（`POST /groups/:id/renew`）時，會比照初次入群的代管邏輯，向每位成員的 `tokenBalance` 扣除本期席位費用並計入 `escrowTokens`（若任一成員餘額不足則整批拒絕，回傳 400 `INSUFFICIENT_BALANCE`），同時清空成員的服務帳號資訊、將群組狀態轉回 `pending_confirmation`，走完整的 帳號填寫 → 啟用 → 確認期 流程。

### 儲值（模擬）

目前為模擬模式：使用者點擊「儲值」按鈕後，平台直接增加PM幣餘額，並記錄 `token_transaction（type: topup）`。尚未安裝任何金流 SDK，串接真實金流服務為未來擴充項目。

---

## 訂閱狀態

`subscriptions.status` 欄位追蹤成員訂閱的生命週期：

| 狀態 | 說明 |
|------|------|
| `pending` | 帳號資訊尚未填寫完成（`pending_confirmation` 階段） |
| `active` | 訂閱已啟用，服務運作中 |
| `ended` | 訂閱已結束（群組 ended / cancelled） |

---

## NotificationType 枚舉值

後端 Prisma schema 定義的完整通知類型：

`application_sent`、`new_application`、`application_approved`、`application_rejected`、`application_withdrawn`、`group_created`、`group_chat_opened`、`fill_service_info`（鎖定群組同一時機發給成員，跟發給團主自己的 `group_chat_opened` 內容分開，直接提醒要做的事而不是單純告知聊天室開了）、`service_info_filled`（成員送出服務帳號資訊時發給團主，由前端 `useMemberStore.fillServiceInfo` 直接呼叫 `insertNotification`，不是後端主動發送；驅動團主端「成員資料」分頁的未讀數字 badge）、`group_activated`、`group_full`、`group_ended`、`group_cancelled`、`group_renewal`、`member_removed`、`member_left`、`service_info_issue`、`escrow_released`（成員主動確認、確認期逾期惰性撥款、或申訴裁定團主獲勝時發送）、`dispute_raised`、`dispute_resolved`（申訴裁定結果，通知申訴成員與團主雙方）、`upcoming_renewal`（距 `nextBillingDate` 7 天內、於成員讀取自己訂閱列表時惰性補發一次，見 `GET /subscriptions`）、`system`

`member_joined`、`token_topup` 是從未使用過的死值，已從 enum 移除（見 [歷史異動](../history/flows-history.md)）

---

## 已知限制

| 類別 | 限制 |
|------|------|
| 認證 | Google OAuth 尚未實作（前端按鈕直接 `disabled` 並標示「即將推出」，沒有對應後端 route） |
| 認證 | 重設密碼寄信尚未實作（前端表單直接 `disabled` 並標示「即將推出」，沒有對應後端 route） |
| 認證 | 手機號碼採 E.164 格式儲存（如 `+886912345678`）；註冊頁信箱／手機號碼已有前端驗證碼 Modal 攔住表單送出，但驗證碼目前固定為 `123456`，後端尚未串接真實信箱/簡訊發送服務 |
| 金流 | PM幣儲值為模擬模式（點擊即儲值），尚未串接正式金流 |
| 代管 | `confirming` 狀態的自動撥款採惰性求值（讀取 group 時觸發），非排程任務 |
| 即時性 | 訊息中心採用 5 秒 polling，非 WebSocket 即時推送 |
| 系統訊息 | 客服僅能透過 `POST /system-messages/broadcast`（全體）或 `/direct`（單一使用者）API 發送，尚無後台管理介面；系統聊天室對使用者為唯讀，無法回覆 |
