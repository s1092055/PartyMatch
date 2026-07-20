# 通知流程

## 使用者目標
使用者希望即時知道跟自己有關的動態（申請結果、群組狀態變化、成員異動等），並能一鍵點擊直接跳到對應的畫面，不用自己在各頁面裡找。

## 入口
- `AppNav` 的通知按鈕（`window.dispatchEvent(new CustomEvent('pm:open-notify'))`）
- `FloatingMessages`（全域監聽 `pm:open-notify`，渲染通知面板）

## 前端檔案
- `src/shared/layout/FloatingMessages.jsx`（通知面板 UI + 點擊後的導向邏輯）
- `src/shared/layout/AppNav.jsx`（觸發開啟）
- `src/shared/stores/useNotificationStore.js`
- `src/shared/api/notificationsApi.js`

## 後端檔案
- `server/src/routes/notifications.js`

## 資料表 / Model
- `Notification`（個人通知 + 系統公告，`isPublic: true` 為公告；`meta` 存放 `groupId` 等關聯資訊供前端導向使用）

## 使用技術
- Polling：`useNotificationStore` 每 10 秒輪詢（`POLL_INTERVAL_MS = 10000`），共用 `src/shared/utils/poller.js` 的 `startPolling`
- 事件驅動導向：點擊通知後不是單純 `navigate()`，而是 `navigate(...)` + `window.dispatchEvent(new CustomEvent('pm:open-xxx', { detail }))` 雙重觸發——因為同一頁面內 `location.state` 重複給同一個 groupId 不會觸發變化，改用 window event 確保 Modal 一定會被觸發開啟
- 去重保險：`dedupeById` 依 `id` 過濾，避免 init 與 poll 交錯的競態情況讓同一筆通知在陣列中出現兩次

## 流程步驟
1. 後端各業務 route（申請核准、成員移除、群組額滿等）在觸發事件時呼叫 `POST /notifications` 建立通知，帶上 `type` 與 `meta.groupId`
2. `optionalAuth` 保護的 `GET /notifications` 讓未登入使用者也能看到公開系統公告（`isPublic: true`），登入後額外看到個人通知
3. 前端 `useNotificationStore` 輪詢取得通知列表，`FloatingMessages` 依 `isRead` 計算未讀數並顯示於按鈕上
4. 使用者點擊通知：
   - 先呼叫 `markRead(notification.id)`（`PATCH /notifications/:id/read`）
   - 依 `notification.type` 決定要 `navigate()` 到哪個路由、要 dispatch 哪個 `pm:open-*` 事件——每種通知類型的導向邏輯都不同，例如 `new_application` 會先 `await applicationStore.init()` 確保資料已更新才開 Modal；`application_sent`／`application_approved` 會先查詢使用者是否已有對應訂閱，決定要開「成員視角」還是「探索視角」
5. 「全部標為已讀」呼叫 `PATCH /notifications/read-all`

## 驗證重點
- `POST /notifications` 不信任前端傳入的 `isPublic`（一律視為 false），避免任何使用者能偽造公開公告
- 通知其他使用者時，後端需驗證請求人與目標使用者皆與 `meta.groupId` 指定的群組有關聯（成員／團主／曾送出申請），避免任意使用者對其他人偽造通知
- `member_removed`／`member_left` 點擊後會先廣播 `pm:refresh-member-stores` 再導向，確保 Store 資料同步更新後畫面才切換，避免顯示過期的成員名單
