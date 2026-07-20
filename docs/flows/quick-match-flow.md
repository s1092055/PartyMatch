# 快速搜尋（Quick Match）

## 使用者目標
不需事先瀏覽整個探索頁，透過「選擇服務 → 設定方案與篩選條件 → 查看配對結果」三步驟，快速找到符合條件、依推薦分數排序的群組，免登入即可使用。

## 入口
- 首頁／導覽列的「快速搜尋」入口，導向 `/quick-match`
- `/quick-match` 是獨立於 `AppLayout` 之外的全螢幕步驟流程頁面（無 sidebar/dock），不需登入即可使用；只有在配對結果點擊「申請加入」時才會被導向登入頁

## 前端檔案
- `src/features/match/QuickMatchPage.jsx`（步驟容器與狀態機）
- `src/features/match/utils/matchGroups.js`（篩選 + 推薦分數排序）
- `src/features/match/components/steps/Step1Services.jsx`（步驟一：選擇服務）
- `src/features/match/components/steps/Step2PlansAndFilters.jsx`（步驟二外殼，內含方案與篩選兩個錨點區塊）
- `src/features/match/components/steps/Step2Plans.jsx`（步驟二：選擇方案）
- `src/features/match/components/steps/Step3Filters.jsx`（步驟二：篩選條件，如每人費用上限、團主評分下限、群組年齡）
- `src/features/match/components/steps/Step4Results.jsx`（步驟三：配對結果列表，前 3 名加金/銀/銅名次徽章）
- `src/features/match/components/MatchConditionBar.jsx`、`MatchSummaryPanel.jsx`（條件摘要顯示）
- `src/features/explore/components/ExploreGroupCard.jsx`（結果列表複用探索頁的群組卡片）

## 後端檔案
- 無獨立後端端點；配對邏輯完全在前端對 `useGroupStore` 已快取的群組資料進行運算

## 資料表 / Model
- `Group`（讀取快取，不寫入）
- `Member`（用來判斷結果卡片是否已是該群組成員）

## 使用技術
- 三步驟但 UI 上是 2 個可捲動內容頁 + 1 個結果頁：`step` state 為 1/2/3，`STEP_TITLES = ['選擇服務', '方案與條件', '配對結果']`，`Step2PlansAndFilters` 把「選擇方案」跟「篩選條件」合併在同一個可捲動容器內，用左側 sticky 導覽 + `smoothScrollTo` 錨點捲動模擬子步驟切換
- 條件狀態 `conditions`（`services`、`selectedPlans`、`maxPrice`、`minRating`、`groupAge`）跟結果 `results` 都是 `QuickMatchPage` 裡的 React state，離開頁面就消失，不寫入 store 或 `sessionStorage`
- 步驟切換用 `key={step}` 重新掛載內容區塊並套用 `animate-step-slide-up` 做進場動畫
- 配對分數一次性計算（`matchGroups` 的 `calcScore`），不是後端排序，也不是持久化欄位
- 免登入可用：`handleStartMatch` 讀 `useAuthStore.getState().user?.id`，未登入時 `activeUserId` 是 `undefined`，篩選照常跑，只是不排除任何人的群組

## 流程步驟
1. 進入頁面時 `conditions` 初始化為 `DEFAULT_CONDITIONS`（`services: []`、`selectedPlans: {}`、`maxPrice: 100`、`minRating: 70`、`groupAge: 'any'`），`step = 1`
2. **步驟一（選擇服務）**：`Step1Services` 用 `listServiceTypes()` 列出所有服務，依分類（`CategoryPills`）篩選顯示；點擊服務卡片呼叫 `toggleService(id)`，把 `id` 加入/移出 `conditions.services`；若取消勾選某服務，同時清掉 `selectedPlans[id]`；下一步按鈕需 `conditions.services.length > 0` 才可點擊
3. **步驟二（方案與條件）**：
   - `Step2Plans`：針對 `conditions.services` 中每個已選服務，讓使用者指定要比對的方案（或「不限方案」）
   - `Step3Filters`：設定 `maxPrice`（每人費用上限）、`minRating`（團主信用分數下限）、`groupAge`（群組成立時間：`new`/`established`/`veteran`/`any`）
   - 右側（桌機版）常駐 `MatchSummaryPanel` 即時顯示目前已選條件摘要
4. 點擊「開始查找」呼叫 `handleStartMatch`：讀取 `useGroupStore.getState().groups`，過濾掉 `hostId === activeUserId`（自己開的團）後傳入 `matchGroups(candidateGroups, conditions)`，結果存入 `results` state，`step` 設為 3
5. `matchGroups`（`src/features/match/utils/matchGroups.js`）依序過濾：`status === 'recruiting'`、`openSeats > 0`、服務需在 `conditions.services` 內（若有指定）、方案需符合 `selectedPlans[serviceId]`（若非 `any`）、`pricePerSeat <= maxPrice`、`hostRating >= minRating`、群組年齡（依 `createdAt` 換算月數）落在 `groupAge` 對應區間
6. 通過篩選的群組各自計算 `_score`（`calcScore`）：團主評分 ≥90 加 2 分／≥70 加 1 分；`openSeats >= 3` 加 1 分；距下次扣款日 `daysUntilBilling > 20` 加 1 分；`pricePerSeat < maxPrice * 0.75`（即單價顯著低於使用者上限）加 1 分。依 `_score` 降冪排序後移除該內部欄位回傳
7. **步驟三（配對結果）**：`Step4Results` 顯示 `MatchConditionBar`（唯讀摘要）與結果網格，前 3 名加金/銀/銅名次徽章；每張卡片沿用 `ExploreGroupCard`，點擊會開啟 `GroupDetailModal`（後續申請流程見 `apply-join-flow.md`），若未登入則在 modal 內點擊申請時導向登入頁
8. 「調整條件」返回步驟二；「重新查找」把 `conditions` 重設回 `DEFAULT_CONDITIONS`、清空 `results`、`step` 設回 1

## 驗證重點
- 前端表單唯一的硬性檢查：步驟一至少選一個服務（`canNext = step === 1 ? conditions.services.length > 0 : true`），步驟二沒有必填限制，可以直接用預設篩選值查找
- 配對結果只回傳 `status === 'recruiting'` 且 `openSeats > 0` 的群組，額滿或非招募中的不會出現
- 沒配對到結果時（`results.length === 0`）顯示空狀態並引導「探索所有群組」，不顯示錯誤訊息
- 全部運算基於前端已快取的 `groups`（可能是初次載入的快照），快速搜尋不會重新打 API 拿最新群組列表，配對結果可能跟資料庫當下狀態有些微落差
