# 建立群組

## 使用者目標
以團主身分，透過 4 步驟表單（選擇服務 → 選擇方案 → 群組設定 → 最後確認）建立一個開放招募的合購群組。

## 入口
- 首頁／導覽列的「建立群組」按鈕，導向 `/create-group`
- `/create-group` 是獨立於 `AppLayout` 之外的全螢幕步驟流程頁面，由頂層 `ProtectedRoute` 包裹，需先登入才能進入

## 前端檔案
- `src/features/create/CreateGroupPage.jsx`（步驟容器、表單 state、送出邏輯）
- `src/features/create/components/steps/Step1Service.jsx`（選擇服務）
- `src/features/create/components/steps/Step2Plan.jsx`（選擇方案，含月繳/年繳拆分為獨立卡片）
- `src/features/create/components/steps/Step3Settings.jsx`（剩餘名額、最低信用分數門檻、帳號需求、群組規則）
- `src/features/create/components/steps/Step4Preview.jsx`（最後確認頁，含服務條款勾選）
- `src/features/create/components/steps/Field.jsx`（表單欄位外殼元件）
- `src/features/create/components/LivePreviewPanel.jsx`（桌機常駐 / 手機彈窗的即時預覽卡片，複用探索頁卡片樣式）
- `src/features/create/utils/previewGroupId.js`
- `src/shared/stores/useGroupStore.js`（`create` action）
- `src/shared/api/groupsApi.js`（`insertGroup`）
- `src/shared/utils/serviceUtils.js`（`getServiceById`，讀取 `src/shared/data/serviceCatalog.js` 的服務/方案資料）
- `src/shared/utils/pricingUtils.js`（`calcPricePerSeat`、`calcDisplayPrice`）

## 後端檔案
- `server/src/routes/groups.js`（`POST /groups`）

## 資料表 / Model
- `Group`（新建）
- `Service`（讀取，決定方案選項與定價）

## 使用技術
- 表單狀態集中在 `CreateGroupPage` 的單一 `form` state（`INITIAL_FORM`），子步驟都是受控元件，透過 `onChange(key, value)` 回寫
- 樂觀更新：送出時先組好完整 `Group` 物件塞進 `useGroupStore`，非同步打 `POST /groups`；成功用後端回傳的真實 `id` 覆蓋暫時物件，失敗就從 store 移除並記錄 `error`（見 `useGroupStore.create`）
- 逐步驗證：`getStepErrors(step, form)` 算目前步驟的錯誤訊息；送出前 `getFirstInvalidStep(form)` 重新掃過步驟 1–3，有錯就把 `step` 導回第一個出錯的步驟，防止瀏覽器返回之類的操作繞過驗證直接送出
- 步驟切換用 `key={step}` 搭配 `animate-step-slide-up` 做進場動畫；`ScrollHint`／`useScrollEdge` 處理內容過長時的捲動提示
- 後端 `createGroupSchema`（zod）用 `.transform()` 同時吃前端命名（`totalSeats`/`pricePerSeat`）跟資料庫命名（`maxMembers`/`monthlyFee`），`data.rules` 是陣列時 join 成字串存

## 流程步驟
1. **步驟一（選擇服務）**：`Step1Service` 依分類（`CategoryPills`）列出 `listServiceTypes()`，點擊卡片呼叫 `onChange('serviceId', id)`；切換服務時連動重置 `planName`、`pricePerSeat`、`totalSeats`
2. **步驟二（選擇方案）**：`Step2Plan` 只列出 `plan.maxSeats > 1`（可合購）的方案；首次進入該服務時自動選第一個方案（`useEffect` 依 `form.serviceId` 觸發）；選擇方案時同步設定 `totalSeats = plan.maxSeats`、`billingCycle = plan.billingCycle`、`pricePerSeat = calcPricePerSeat(plan, plan.maxSeats)`
3. **步驟三（群組設定）**：`Step3Settings` 設定：
   - 「剩餘名額」（`totalSeats - 1`，即不含團主自己）：加減按鈕操作 `totalSeats`，範圍 `[2, maxSeats]`；每次變動重新呼叫 `calcPricePerSeat(plan, totalSeats)` 更新每人單價（人數越多分攤越便宜）
   - 「信用分數」門檻：`minCreditScore` 四選一（不限/90/70/50 分以上）
   - 「帳號需求」：選填文字說明（`requirements`，上限 120 字）
   - 「群組規則」：最多 5 條，每條上限 80 字
4. **步驟四（最後確認）**：`Step4Preview` 顯示團主、服務/方案、每位價格、剩餘名額、信用分數、建立日期、帳號需求、群組規則的唯讀摘要，並要求勾選「已閱讀並同意服務條款與隱私政策」（`agreedToTerms`）才能啟用「確認建立」按鈕；手機版另有「查看預覽」按鈕開啟 `LivePreviewPanel` 彈窗
5. 點擊「確認建立」呼叫 `handleSubmit`：先用 `getFirstInvalidStep(form)` 重新驗證步驟 1–3，有誤則導回該步驟；否則 `mapFormToGroup(form)` 組出符合 `Group` 資料形狀的物件（含 `usedSeats: 1`、`openSeats: totalSeats - 1`、`joinMode: 'approval'`、`status: 'recruiting'`、依方案 tags 與服務分類去重後的 `tags`）
6. 呼叫 `useGroupStore.getState().create(groupData, host)`：前端立即產生本地 `id`（`createId`）與樂觀物件並塞入 store，同時非同步呼叫 `insertGroup` → `POST /groups`
7. 後端 `POST /groups`：`requireAuth` 取得 `req.user.id` 作為 `hostId`；`validate(createGroupSchema)` 做欄位轉換與型別檢查後，過濾出 Prisma schema 認得的欄位（`allowed` 白名單），呼叫 `prisma.group.create`，回傳 201 與建立好的群組（含 `service`、`host` 關聯）
8. 建立成功後，`useNotificationStore.create()` 寫入一筆 `group_created` 通知給團主自己，並 `window.dispatchEvent('pm:group-created')`；`step` 切到 5（成功頁），提供「返回首頁」與「前往群組管理」兩個出口

## 驗證重點
- 前端逐步驗證（`getStepErrors`）：
  - 步驟一：`serviceId` 必填
  - 步驟二：`planName` 必填；該服務沒有任何 `maxSeats > 1` 方案時 banner 提示「此服務無合購方案，請返回上一步選擇其他服務」，但不會硬擋下一步，靠使用者自己返回
  - 步驟三：`totalSeats` 需是 2 到方案 `maxSeats` 間的整數，否則報「開放名額需介於 1 至 N 位」；`rules` 去空白後不得超過 5 條，每條不超過 80 字
- 送出前 `getFirstInvalidStep` 重新掃過步驟 1–3，導回第一個仍有錯的步驟，防止繞過瀏覽器前進/後退送出不合法資料
- 「確認建立」在 `agreedToTerms` 為 false 時停用，沒勾服務條款無法送出
- 後端 `createGroupSchema`（zod）：`maxMembers`/`totalSeats` 限制 `int().min(2).max(10)`；`minCreditScore`、`minGroupAge` 非負整數；`billingCycle` 只吃 `'monthly'|'yearly'`；驗證沒過直接 400，不寫入資料庫
- 建立失敗時樂觀新增會被回滾：`useGroupStore.create` 的 `.catch()` 把該筆從 `groups` 移除，避免畫面上留一筆伺服器端根本不存在的假群組
