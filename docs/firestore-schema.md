# Firestore Schema 與狀態流程

## Collection 對應

| Collection | 說明 |
|------------|------|
| `users` | Firebase Auth 帳號 + 個人資料（信用分數、付款方式偏好等） |
| `services` | 30 種訂閱服務清單與方案價格 |
| `groups` | 群組主資料（狀態、名額、方案、收款帳號等） |
| `applications` | 申請紀錄（`pending` / `approved` / `rejected` / `removed`） |
| `members` | 群組成員（`hostId` / `userId` / 付款狀態） |
| `subscriptions` | 成員訂閱（帳號資訊、付款狀態、下次扣款日） |
| `paymentRecords` | 付款紀錄（統計用） |
| `notifications` | 個人通知 + 系統公告（`isPublic: true` 為公告） |
| `favorites` | 收藏群組（`userId` + `groupId`） |
| `conversations` | 對話（群組聊天室 / DM）；子集合 `messages` 存訊息 |

Demo 模式下讀寫對應的 `demo_*` collection（例如 `demo_groups`），兩者完全隔離。

---

## 事件驅動清單

全域 Modal 以 `window.dispatchEvent` 驅動，不依賴 React props 層層傳遞。

| 事件 | 觸發者 | 接收者 |
|------|--------|--------|
| `pm:open-search` | AppNav / MobileSearch | `MobileSearch` |
| `pm:open-match` | 首頁 CTA / AppNav / Redirect | `QuickMatchModal` |
| `pm:open-create` | 首頁 CTA / AppNav / Redirect | `CreateGroupModal` |
| `pm:open-group` | 群組卡片 / Redirect | `GroupDetailModal` |
| `pm:open-notify` | AppNav 通知按鈕 | `FloatingMessages` |
| `pm:open-messages` | AppNav / 訂閱卡 / 群組操作 | `MessagesModal` |
| `pm:open-dm` | 聯絡團主 | `MessagesModal` 建立或取得 DM |
| `pm:open-manage-group` | 通知點擊 / 跨頁導覽 | `ManagePage` 開啟指定群組 Modal（支援 `openActivateGroup`、`openApplications`、`openBilling` 旗標） |
| `pm:notif-changed` | `notificationStore` | `AppNav` 更新通知未讀 badge |
| `pm:convs-changed` | `conversationStore` | `AppNav` 更新訊息未讀 badge；`MessagesModal` 重新讀取對話列表 |
| `pm:auth-changed` | `authStore` | `AppNav` 重新讀取使用者狀態 |
| `pm:members-changed` | `memberStore` | `GroupDetailModal`、`SubscriptionsPage` 更新 CTA |
| `pm:applications-changed` | `applicationStore` | `GroupDetailModal`、`SubscriptionsPage` 更新申請 CTA |

---

## 群組狀態

| 狀態 | 說明 | 主要操作 |
|------|------|----------|
| `recruiting` | 招募中 | 審核申請、查看成員 |
| `full` | 名額已滿，等待團主啟用群組 | 點「啟用群組」並填寫收款帳號 |
| `pending_confirmation` | 收款階段：成員填帳號、標記付款；團主逐筆確認 | 逐筆確認付款 |
| `pending_activation` | 款項全員確認，等待啟用 | 啟用服務 |
| `active` | 服務已啟用 | 開始新一期收款或結束服務 |
| `paused` / `cancelled` / `ended` | 已結束或暫停 | 歷史狀態，唯讀 |

---

## 付款狀態

| 狀態 | 成員端含義 | 團主端含義 |
|------|------------|------------|
| `pending` | 尚未標記付款 | 等待成員付款 |
| `markedPaid` | 已標記付款，等待團主確認 | 待確認收款；收款管理顯示 badge |
| `payment_failed` | 付款被回報問題，需重新上傳憑證 | 已回報問題，等待成員補件 |
| `confirmed` | 團主已確認 | 已完成確認 |
| `paid` | 舊格式，視為已付款 | 舊格式，視為已確認 |
| `overdue` | 已逾期，需補繳 | 可提醒成員付款 |
| `waiting_activation` | 款項已確認，等待團主啟用 | 等待啟用服務 |

`src/shared/utils/subscriptionStatus.js` 依訂閱付款狀態、群組狀態與日期計算實際顯示狀態。

---

## 已知限制

| 類別 | 限制 |
|------|------|
| 安全性 | Firestore Security Rules 尚未補全，正式上線前需建立 `firestore.rules` |
| 資料一致性 | 若只有 subscription 無對應 member，團主端成員狀態可能無法同步；需在核准申請時確保兩筆同時建立 |
| 前端驗證 | 前端已有 ProtectedRoute 與 UI 鎖定，但後端 Rules 未設置 |
| 金流 | 付款流程為展示用途（標記即可），尚未串接正式金流 |
