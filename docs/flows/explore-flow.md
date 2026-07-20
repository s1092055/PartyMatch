# 探索群組

## 使用者目標
瀏覽目前開放招募的群組，透過分類、服務、價格上限、關鍵字搜尋與排序，找到符合需求的合購群組。

## 入口
- 導覽列／首頁進入 `/explore`（`ExplorePage`）
- 快速搜尋結果頁（`Step4Results`）的「探索所有群組」按鈕也會導向 `/explore`

## 前端檔案
- `src/features/explore/ExplorePage.jsx`
- `src/features/explore/components/FilterBar.jsx`
- `src/features/explore/components/ExploreGroupCard.jsx`
- `src/shared/utils/searchUtils.js`（`applyFilters`）
- `src/shared/utils/serviceUtils.js`（`listServiceTypes`、`getServiceById`）
- `src/shared/stores/useGroupStore.js`、`useApplicationStore.js`、`useMemberStore.js`（讀取用）

## 後端檔案
- `server/src/routes/groups.js`（`GET /groups`，App 啟動時由 `useGroupStore.init()` 呼叫一次，探索頁本身不另外打 API）

## 資料表 / Model
- `Group`（含 `service` 關聯）
- `Application`（用來判斷「已申請」badge）
- `Member`（用來判斷「已加入」badge）

## 使用技術
- 篩選條件全部存在 URL query string（`useSearchParams`），不放 React state，重新整理或分享連結條件都會保留
- 關鍵字輸入用本地 state + 300ms debounce（`FilterBar` 的 `useEffect` + `setTimeout`），避免每個按鍵都觸發一次 URL `replace`
- 篩選/排序全在前端對 `useGroupStore` 已快取的群組陣列做 `Array.filter`/`Array.sort`（`applyFilters`），不會另外打搜尋 API
- `useMemo` 快取 `allGroups`（排除自己開的團）、`filtered`、已申請／已加入的 `Set`，避免每次 render 都重掃整個列表

## 流程步驟
1. `App.jsx` 於公開資料初始化階段呼叫 `useGroupStore.init({ status: 'recruiting' })`（未登入）或 `{ status: 'all' }`（已登入），取得群組快取，`ExplorePage` 之後都是純前端運算，不再打 API
2. 進入 `/explore` 時從 `useSearchParams` 讀出 `category`、`service`、`maxPrice`、`sortBy`、`q`，缺省時分別為 `all`/`all`/`any`/`recommended`/`''`
3. `allGroups = groups.filter(g => g.hostId !== activeUserId)`：排除自己身為團主的群組
4. 使用者操作 `FilterBar`（分類 pill、服務下拉、價格下拉、排序下拉、關鍵字輸入）時呼叫 `onChange(patch)` → `ExplorePage.handleFilterChange`，合併目前 filters 後把非預設值寫回 `URLSearchParams`，並以 `navigate(..., { replace: true })` 更新網址（不新增瀏覽紀錄）
5. `filtered = applyFilters(allGroups, filters)`（`useMemo`）依序套用：
   - 基礎條件：`status === 'recruiting' && openSeats > 0`
   - 分類：`category !== 'all' && service === 'all'` 時比對 `getServiceById(serviceId).category`
   - 服務：`service !== 'all'` 時精確比對 `serviceId`
   - 價格：`maxPrice !== 'any'` 時 `pricePerSeat <= Number(maxPrice)`
   - 關鍵字：`q` trim 後轉小寫，比對服務名稱或方案名稱是否包含關鍵字（`includes`，非全文檢索）
   - 排序：`rating`（依 `hostRating` 降冪）、`price_asc`（`pricePerSeat` 升冪）、`seats`（`openSeats` 升冪）、預設 `recommended` 同 `rating`
6. 計算 `appliedGroupIds`（該使用者 `status === 'pending'` 的申請對應群組）與 `memberGroupIds`（已是成員的群組），傳入 `ExploreGroupCard` 決定卡片上顯示「已申請」／「已加入」badge
7. 點擊卡片會觸發開啟 `GroupDetailModal`（透過 `pm:open-group` custom event，非路由跳轉），後續申請流程見 `apply-join-flow.md`

## 驗證重點
- 探索頁本身沒有寫入操作，也沒有表單驗證；篩選邏輯純前端運算，寫死在 `applyFilters`（`src/shared/utils/searchUtils.js`），沒特別防呆（例如 `maxPrice` 傳非數字字串時 `Number(maxPrice)` 是 `NaN`，比較恆 `false`，group 會被濾掉）
- 只顯示 `status === 'recruiting'` 且 `openSeats > 0` 的群組，額滿或非招募中的不會出現（即使已登入時 store 快取了所有狀態的群組）
- 關鍵字比對只用 `String.includes`，不是模糊比對也不是全文檢索；後端 `GET /groups` 的 `q`（`contains`）只在初次載入 store 時用得到，探索頁互動不會重新打 API
