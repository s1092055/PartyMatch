# 申請加入群組

## 使用者目標
在群組詳情頁對一個 `recruiting` 狀態的群組送出加入申請，等待團主審核。

## 入口
- `GroupDetailModal`（透過 `pm:open-group` custom event 開啟，於探索頁 `ExploreGroupCard`、快速搜尋結果、收藏頁等處點擊群組卡片觸發）內的「申請加入」按鈕（`buildMobileFooter.jsx` 手機版底部欄或桌機版對應按鈕）開啟 `ApplyModal` 子彈窗

## 前端檔案
- `src/features/group/GroupDetailModal.jsx`（`canApply` 判斷、`handleApply`、`handleWithdraw`）
- `src/features/group/components/ApplyModal.jsx`（申請留言、同意條款、送出/成功畫面）
- `src/features/group/components/buildMobileFooter.jsx`（未登入時導向登入頁；已登入且 `canApply` 時顯示「申請加入」按鈕）
- `src/shared/stores/useApplicationStore.js`（`create`、`withdraw`）
- `src/shared/api/applicationsApi.js`（`insertApplication`、`deleteApplication`）
- `src/shared/utils/toast.js`（PM 幣不足時的錯誤提示，含「前往儲值」action）

## 後端檔案
- `server/src/routes/applications.js`（`POST /applications`、`DELETE /applications/:id`）
- `server/src/utils/pricing.js`（`computeSeatCost`，計算席位費用）

## 資料表 / Model
- `Application`（新建 / 撤回）
- `Group`（讀取 `status`、`hostId`、`monthlyFee`、`billingCycle`）
- `User`（讀取 `tokenBalance` 做餘額預檢）

## 使用技術
- 「等後端確認成功才寫入本地 store」而非樂觀更新：`useApplicationStore.create` 先 `await insertApplication(...)`，成功後才 `set` 加入 `applications` 陣列，註解說明是為了避免探索頁卡片上的「已申請」badge 在餘額不足等錯誤發生時「先出現又立刻回滾消失」的閃爍
- `activeKey` 欄位模擬 partial unique index：`Application` 表上 `@@unique([groupId, userId, activeKey])`，`activeKey` 只有 `pending`/`approved`（進行中）時為 `'active'` 字串，其餘狀態一律為 `null`；MySQL 的 unique index 允許多個 `null` 並存，藉此讓資料庫在併發送出申請時也能擋下重複的進行中申請（見下方驗證重點）
- 群組詳情頁的申請狀態直接從 store 即時讀取（`useApplicationStore.getState().getByUserAndGroup(...)`），不快取在 modal 自己的 state，避免審核結果送達期間本地 state 與 store 不同步

## 流程步驟
1. `GroupDetailModal` 計算 `app = useApplicationStore.getState().getByUserAndGroup(activeUserId, group.id)`，並依此推導 `hasActiveApp`（排除 `rejected`/`removed`/`left`/`withdrawn`，以及「已核准但已不是成員」的邊界情況）與 `isPendingApp`
2. `canApply = !isHost && !isMember && !hasActiveApp && !isFull && !!activeUserId`：全部成立才顯示「申請加入」入口；未登入時 `buildMobileFooter` 改顯示導向 `/login?redirectTo=/groups/:id` 的按鈕
3. 點擊「申請加入」→ `setShowApply(true)` 開啟 `ApplyModal`（隱藏後方群組詳情 modal），使用者填寫選填的申請留言（`applyMessage`）並勾選同意群組規則與付款條件（`applyAgreed`）
4. 「送出申請」按鈕在 `!applyAgreed` 時停用；點擊觸發 `handleApply` → `useApplicationStore.getState().create({ groupId, groupName, serviceId, serviceName, planName, hostId, hostName, hostAvatarInitial, hostAvatarColor, message: applyMessage }, activeUser)`
5. `useApplicationStore.create` 呼叫 `insertApplication({ groupId, message })` → `POST /applications`
6. 後端 `POST /applications`：
   - 併發查詢群組（`prisma.group.findUnique`）與申請人 `tokenBalance`
   - 檢查群組存在、`status === 'recruiting'`、`group.hostId !== req.user.id`（團主不能申請自己的群組）
   - 用 `computeSeatCost(group)` 計算席位費用，若 `applicant.tokenBalance < seatCost` 回傳 `400`，附 `code: 'INSUFFICIENT_BALANCE'` 與 `required` 金額（**此階段只檢查餘額，不預扣**）
   - 查詢該使用者對此群組最新一筆申請（`orderBy: createdAt desc`），若存在且狀態不屬於 `['rejected','removed','left','withdrawn']`，回傳 `409 你已有一筆進行中的申請`
   - 通過前述檢查後 `prisma.application.create({ data: { groupId, userId, message, activeKey: 'active' } })`；若資料庫層因 unique constraint 擋下（`err.code === 'P2002'`），同樣回傳 `409`
7. 成功後前端把新申請（覆蓋為後端回傳的真實 `id`）加入 `applications` store，並：
   - 呼叫 `notificationStore.create()` 即時寫入「申請已送出」通知給申請人自己（同時寫入本地 store 與 DB）
   - 呼叫 `insertNotification()` 只寫入 DB 通知團主（不即時推入團主 session 的 store，團主要刷新頁面才會看到）
8. `ApplyModal` 切換到 `applySubmitted` 成功畫面，顯示「申請已送出！等待團主審核後即可加入」
9. **撤回申請**：若 `isPendingApp` 為真，`GroupDetailModal` 提供「取消申請」操作（`handleWithdraw`），呼叫 `useApplicationStore.getState().withdraw(app.id)` → 前端樂觀把該筆狀態改為 `withdrawn` → `DELETE /applications/:id`；若後端失敗則呼叫 `get().init()` 重新拉取真實狀態並拋出錯誤
10. 後端 `DELETE /applications/:id`：檢查申請存在、`application.userId === req.user.id`（僅申請人可撤回）、`status === 'pending'`（只能撤回審核中的申請），符合則把 `status` 設為 `withdrawn` 並清空 `activeKey`（釋放名額讓使用者可重新申請同一群組）

## 驗證重點
- 餘額預檢但不預扣：申請當下只檢查 `tokenBalance >= seatCost`，實際扣款與代管（`escrow`）發生在團主核准的當下（見 `approval-flow.md`），若申請人在等待審核期間把餘額花光，核准時會在 `admitMemberIntoGroup` 內二次檢查並失敗
- 團主不能申請自己的群組（`group.hostId === req.user.id` → 400）
- 群組必須是 `recruiting` 狀態才能申請；`full`／已鎖定的群組會被擋下（400 `此群組目前不開放申請`）
- 重複申請防護是雙層的：應用層先用 `findFirst` 查詢最新一筆申請並依狀態判斷（一般情境下就會擋下），資料庫層再用 `(groupId, userId, activeKey)` 的 unique index 防止兩個併發請求都通過應用層檢查後同時 `create` 成功（第二筆會因 `P2002` 被擋下並回 409），這是註解中明確強調的併發安全設計
- 撤回申請只能撤回自己、且仍為 `pending` 的申請；已核准/已拒絕/已離開的申請無法撤回
- 撤回後 `activeKey` 被清空為 `null`，配合 unique index 的多 `null` 特性，允許使用者對同一群組重新送出新的申請
