# Bug Log

使用下面的格式記錄手動測試時發現的問題。優先記錄 P0/P1（會影響主線交易流程或資料正確性的問題），P2 視情況記錄。

## 範本

```md
### BUG-001：{標題}
- **功能**：{屬於哪個功能，可連結對應的 flows/ 文件}
- **嚴重度**：P0 / P1 / P2
- **測試帳號**：{見 test-accounts.md}
- **操作步驟**：
  1. ...
  2. ...
- **預期結果**：...
- **實際結果**：...
- **推測原因**：{可附檔案/行號}
- **修正狀態**：未修 / 已修（附 commit）
```

---

## 已記錄的 Bug

依發現時間排序，最新在上。下面前 7 筆是跑 `/code-review` 靜態審查時找到（非手動測試流程觸發），標註來源以區別於未來手動測試時記錄的項目；之後手動測試找到的新 bug 補在這幾筆之上即可。

### BUG-008：申訴裁定「成員獲勝」一定會 500，從未真正成功執行過
- **功能**：[申訴流程](../flows/dispute-flow.md)，`POST /groups/:id/adjudicate`
- **嚴重度**：P0（核心交易流程功能完全無法使用）
- **測試帳號**：`demo-admin@partymatch.test`（見 test-accounts.md）
- **操作步驟**：
  1. 群組處於 `disputed` 狀態，有一位成員已申訴
  2. 管理員在 `AdminTab` 選擇該群組，裁定結果選「成員獲勝」，填寫說明後送出
- **預期結果**：申訴成員退款並移出群組，群組狀態回到 `active`
- **實際結果**：API 回傳 500，整個交易回滾，裁定完全沒有生效
- **推測原因**：`server/src/routes/groups.js` 的 `winner === 'member'` 分支裡，`prisma.subscription.updateMany` 把該成員的 `Subscription.status` 設成 `'cancelled'`，但 `SubscriptionStatus` enum（`schema.prisma`）只定義了 `pending`/`active`/`ended` 三種值，沒有 `cancelled`，Prisma 執行時直接拋出驗證錯誤。這條路徑先前只有靜態程式碼審查看過，從未真的被任何測試（手動或自動）呼叫過一次，才會一直沒被發現
- **如何發現**：把 `server/prisma/seedDemo.js` 從直接寫資料庫改成透過真實 REST API 驅動每個情境後，第一次真正呼叫這支端點就立刻重現
- **修正狀態**：已修（本次連同 seed 腳本重寫一起提交）——`Subscription.status` 改設為 `'ended'`

### BUG-007：搜尋框 debounce echo 吃掉使用者輸入的尾隨空白
- **功能**：[探索群組流程](../flows/explore-flow.md)
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：在探索頁關鍵字輸入框打字，尾端刻意留一個空白（例如「netflix 」）並暫停超過 300ms
- **預期結果**：使用者輸入的空白應保留在輸入框裡，直到自己刪除或繼續輸入
- **實際結果**：debounce 觸發送出後，URL 端會 `trim()` 掉空白，這個 trim 過的值又同步回本地輸入框，尾隨空白被悄悄吃掉；若使用者在這個時間點前後緊接著輸入下一個字，可能導致關鍵字缺一個空白
- **推測原因**：`FilterBar.jsx` 用兩個 state（`keyword`/`syncedQ`）手動模擬「render 期間同步外部 prop」，沒有區分「這是外部真正的變化」還是「自己剛送出的 echo」
- **修正狀態**：已修（`7d80c08`）——改用 `keyword.trim() !== filters.q` 判斷是否為外部真正變化，是 echo 就不覆寫本地輸入

### BUG-006：`Badge.jsx` 的 `full` 狀態從設計 token 退步成寫死色值
- **功能**：全站狀態徽章顯示
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：檢視群組狀態為 `full`（已滿員）時的 Badge 樣式
- **預期結果**：應使用 `@theme` 宣告的設計 token（例如 `bg-raised text-ink-2`），日後切換主題色/深色模式時才會一起變動
- **實際結果**：某次重構把 `full` 狀態的 class 改回寫死的 `bg-slate-100 text-slate-500`，脫離 token 系統
- **推測原因**：把分散在兩個檔案的 `STATUS_BADGE_CLASS` 對照表合併進 `Badge.jsx` 時，直接搬字過紙保留了舊的寫死色值
- **修正狀態**：已修（`7d80c08`）——改回 `bg-raised text-ink-2`

### BUG-005：`docs/architecture.md` 混入簡體字
- **功能**：文件內容（非程式功能）
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：檢視架構文件「已結束」分類 tab 說明段落
- **預期結果**：全篇應為繁體中文
- **實際結果**：一處寫成「供两处共用」，「两处」為簡體字
- **推測原因**：手動編輯時誤植
- **修正狀態**：已修（`7d80c08`）——改為「供兩處共用」

### BUG-004：`server/prisma/clearProd.js` 殘留呼叫已移除的 `RefreshToken` model
- **功能**：正式環境資料清空腳本（`npm run db:clear`）
- **嚴重度**：P0
- **來源**：code review（非手動測試觸發）
- **重現方式**：`schema.prisma` 移除 `RefreshToken` model（refresh token 改存 Redis）後，直接執行 `npm run db:clear`
- **預期結果**：完整清空 messages/conversations/.../groups/users，並成功結束
- **實際結果**：腳本執行到 `prisma.refreshToken.deleteMany()` 這行會因為 `prisma.refreshToken` 是 `undefined` 而拋出 `TypeError`，此時 groups 等資料已被刪除、users 還沒刪除，留下不一致的殘留資料
- **推測原因**：schema 變更後沒有同步檢查依賴該 model 的維運腳本
- **修正狀態**：已修（`7d80c08`）——移除該行呼叫

### BUG-003：`DELETE /groups/:id` 名額判斷 off-by-one，已有成員的群組仍可被直接刪除
- **功能**：[我的群組（團主視角）流程](../flows/my-groups-host-flow.md)
- **嚴重度**：P0
- **來源**：code review（非手動測試觸發；此路由目前前端未串接，僅可透過直接呼叫 API 觸發）
- **重現方式**：群組已有 1 名成員申請並被核准加入（該成員的 PM幣已扣款進代管），此時對該群組呼叫 `DELETE /groups/:id`
- **預期結果**：僅能刪除「尚無成員加入」的招募中群組，已有成員應拒絕並提示改用解散群組（`/cancel`，含退款）
- **實際結果**：判斷式寫成 `currentMembers > 1`，代表恰有 1 位成員時仍會判定為「可刪除」，直接執行硬刪除；`Application`/`Member`/`Subscription` 會被級聯刪除，但不會走 `/cancel` 的退款邏輯，該成員已扣除的 PM幣代管款項永久消失
- **推測原因**：`currentMembers` 語意上不含團主本人（0 代表尚無其他成員加入），註解寫對了但條件式的門檻值寫錯
- **修正狀態**：已修（`7d80c08`）——改為 `currentMembers > 0`

### BUG-002：核准申請缺少狀態鎖，併發/雙擊可能導致重複扣款、重複入群
- **功能**：[團主審核流程](../flows/approval-flow.md)
- **嚴重度**：P0
- **來源**：code review（非手動測試觸發）
- **重現方式**：對同一筆 `pending` 申請，幾乎同時送出兩個 `PATCH /applications/:id`（核准）請求（例如團主手滑雙擊、或網路延遲下重試）
- **預期結果**：只有一個請求成功核准，另一個應被拒絕（例如回 409）
- **實際結果**：兩個請求各自查到申請仍是 `pending`，各自通過 `admitMemberIntoGroup` 內的名額/餘額檢查（只要群組還有 ≥2 名額），導致該申請人被重複扣款、`currentMembers` 被重複遞增、產生兩筆重複的 `TokenTransaction`
- **推測原因**：名額檢查已經用條件式 `updateMany` 做了併發防護，但「申請狀態本身要不要允許被處理」這個判斷還停留在先讀後寫
- **修正狀態**：已修（`7d80c08`）——在同一個 transaction 內，先用條件式 `updateMany`（`status: 'pending'` 才能轉 `approved`）鎖定申請狀態，寫入 0 筆就代表已被處理過，直接回 409

### BUG-001：`useGroupStore.getByHostId` 等處排序邏輯與抽出的共用 helper 不一致
- **功能**：跨頁面群組列表排序（新到舊）
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：檢視 `useGroupStore.js` 的 `getByHostId` selector
- **預期結果**：全站列表排序邏輯應統一呼叫共用的 `byNewest`（`src/shared/utils/date.js`）
- **實際結果**：這處仍是逐字重複的 inline 版本 `(b.createdAt ?? '').localeCompare(a.createdAt ?? '')`，跟已抽出的共用函式重複
- **推測原因**：抽出 `byNewest` 共用函式時漏改這一處呼叫端
- **修正狀態**：已修（`7d80c08`）——改用 `.sort(byNewest)`
