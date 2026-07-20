# 團主審核申請

## 使用者目標
團主檢視收到的加入申請，核准或拒絕；核准時系統要自動扣款、建立成員與訂閱、更新名額，且必須在高併發下保證不會超額或重複扣款。

## 入口
- `/my-groups?view=host`（`HostPage`）→ 開啟某個群組的 `HostGroupView` → 「申請管理」分頁（`buildApplicationsPanel`），列出所有 `pending` 申請
- 也可透過通知中心點擊「收到新的加入申請」通知，經 `pm:open-host-group` custom event（`{ openApplications: true }`）直接導向該群組的申請管理分頁

## 前端檔案
- `src/features/my-groups/host/HostPage.jsx`
- `src/features/my-groups/host/components/HostGroupView.jsx`
- `src/features/my-groups/host/components/hostGroupView/buildApplicationsPanel.jsx`
- `src/features/my-groups/host/components/hostGroupView/ApplicationCard.jsx`（核准/拒絕按鈕、審核中/已核准/已拒絕/已移除/已退出的狀態 badge）
- `src/features/my-groups/host/hooks/useHostActions.js`（`handleApprove`、`handleReject`）
- `src/features/my-groups/host/utils/hostFilters.js`（`calcApprovalSeatPatch`，前端本地名額計算）
- `src/shared/stores/useApplicationStore.js`（`updateStatus`）
- `src/shared/api/applicationsApi.js`（`patchApplication`）

## 後端檔案
- `server/src/routes/applications.js`（`PATCH /applications/:id`）
- `server/src/utils/membership.js`（`admitMemberIntoGroup`，核准申請與團主直接加人共用的入群交易邏輯）
- `server/src/utils/pricing.js`（`computeSeatCost`）

## 資料表 / Model
- `Application`（狀態變更：`pending → approved/rejected`）
- `Group`（`currentMembers`、`status`、`escrowTokens` 更新）
- `Member`（核准時 `upsert` 建立）
- `Subscription`（核准時 `upsert` 建立，狀態預設 `pending`）
- `User`（扣除申請人 `tokenBalance`）
- `TokenTransaction`（寫入 `type: 'escrow'` 紀錄）

## 使用技術
- **Prisma interactive transaction**（`prisma.$transaction(async (tx) => {...})`）：把「條件式核准申請」「查詢群組名額上限」「呼叫 `admitMemberIntoGroup`（餘額檢查、名額檢查、建立 member/subscription、扣款、寫入交易紀錄、額滿自動推進 full）」全部包在同一個 transaction 裡，任何一步失敗都會整體回滾，避免出現「申請已標記 approved 但成員/訂閱沒建立成功」的資料不一致
- **條件式 `updateMany` 作為樂觀鎖**：核准時不是直接 `update`，而是 `tx.application.updateMany({ where: { id, status: 'pending' }, data: { status: 'approved' } })`，靠 `WHERE status = 'pending'` 確保只有第一個抵達的請求能把 `claimed.count` 變成 1；第二個併發請求（例如重複點擊、或另一個瀏覽器分頁）會拿到 `claimed.count === 0`，直接拋出 409 中止整個 transaction，不會走到扣款與建立成員的步驟
- **共用交易邏輯抽成獨立函式**：`admitMemberIntoGroup(tx, {...})` 被 `applications.js`（核准申請）與 `members.js`（團主手動加人）共用，註解明確說明是為了讓「餘額檢查、併發安全的名額檢查、建立成員/訂閱、代管扣款、額滿自動推進 full」這組規則未來只需要改一處
- **名額超額防護同樣用條件式 `updateMany`**：`admitMemberIntoGroup` 內用 `tx.group.updateMany({ where: { id: groupId, status: 'recruiting', currentMembers: { lt: maxMembers } }, data: { currentMembers: { increment: 1 }, escrowTokens: { increment: seatCost } } })`，`capacity.count === 0` 代表在寫入的瞬間名額已滿或群組已非招募中，直接拋出 409，避免兩筆申請同時被核准導致成員數超過 `maxMembers`
- 前端 `handleApprove` 在呼叫 API 前先做一次本地名額快照檢查（`seats.openSeats <= 0` 直接顯示錯誤、不送出請求），這只是即時 UI 回饋，真正的防線在後端 transaction；核准成功後才 `await Promise.all([useMemberStore.init(), useSubscriptionStore.init()])` 重新拉取真實 DB 資料，確保 store 持有後端 transaction 建立的真實 `Member`/`Subscription` id

## 流程步驟
1. 團主在「申請管理」分頁看到 `pendingApps`（`app.status === 'pending'`），`ApplicationCard` 顯示申請人姓名、信用分數 badge、相對時間、可展開的申請留言
2. 點擊「核准」→ `ApplicationCard` 呼叫 `onApprove(app.id)` → `buildApplicationsPanel` 包了一層：先執行核准，成功後 `setActivePanel(null)`（收合面板）
3. `useHostActions.handleApprove(appId)`：
   - 找到該申請、確認仍為 `pending`
   - 找到對應群組；若群組不存在則設定錯誤訊息並中止
   - 本地檢查：`alreadyMember`（是否已經是成員，避免重複核准造成的邊界情況）與 `seats.openSeats <= 0`（已額滿則顯示「此群組已額滿，無法核准」並中止，不呼叫 API）
   - 呼叫 `updateApplicationStatus(appId, 'approved')` → `useApplicationStore.updateStatus` 先樂觀把本地 `applications` 該筆改為 `approved`（同時把團主自己「收到新申請」的相關通知標記已讀），再呼叫 `patchApplication(id, { status: 'approved' })` → `PATCH /applications/:id`
4. 後端 `PATCH /applications/:id`：
   - 查詢申請並帶出 `group.hostId`/`monthlyFee`/`billingCycle`；確認 `application.group.hostId === req.user.id`（僅團主可審核），否則 403
   - `status !== 'approved'`（即拒絕）：直接 `update` 成 `rejected`/`removed`，並清空 `activeKey`，讓申請人可重新申請；不進 transaction，因為不涉及金流
   - `status === 'approved'`：計算 `seatCost = computeSeatCost(application.group)`，進入 `$transaction`：
     1. 條件式 `updateMany({ where: { id, status: 'pending' } })` 核准申請，`count === 0` 則丟出 409（「此申請已被處理，請重新整理頁面」）
     2. 查詢群組 `maxMembers`，不存在則丟出 404
     3. 呼叫 `admitMemberIntoGroup(tx, { groupId, userId, seatCost, maxMembers, note })`（見下方展開）
     4. 回傳更新後的 `Application`
5. `admitMemberIntoGroup`（`server/src/utils/membership.js`）：
   - 查詢申請人 `tokenBalance`，若不足 `seatCost` 丟出 400（「PM幣餘額不足，無法加入」）——這是核准當下的**二次**餘額檢查（申請當下只做過一次預檢，期間餘額可能已被花掉）
   - 條件式 `updateMany` 檢查並鎖定名額（見上方「使用技術」），失敗丟出 409
   - 平行執行：`Member.upsert`、`Subscription.upsert`（`upsert` 是為了讓「團主直接加人」與「申請核准」共用同一段邏輯時，即使該使用者已有殘留記錄也不會報錯）、扣除申請人 `tokenBalance`、寫入 `TokenTransaction(type: 'escrow', amount: -seatCost)`
   - 重新查詢群組 `currentMembers`/`maxMembers`，若 `currentMembers >= maxMembers` 則把群組狀態推進為 `full`
6. 前端核准成功後：`await Promise.all([useMemberStore.init(), useSubscriptionStore.init()])` 重新拉取真實資料；用 `calcApprovalSeatPatch(seats, alreadyMember)` 計算本地 `usedSeats`/`openSeats`（若剛好額滿則附帶 `status: 'full'`）並樂觀更新群組；`insertNotification()` 只寫 DB 通知申請人「申請已通過」；若剛好額滿，額外即時通知團主自己「群組名額已滿，可以點擊鎖定群組了」
7. 點擊「拒絕」→ `handleReject(appId)`：檢查仍為 `pending` → `updateApplicationStatus(appId, 'rejected')` → 後端如步驟 4 的非核准分支，直接更新狀態並清空 `activeKey` → 前端寫入「申請未通過」通知給申請人（只寫 DB）

## 驗證重點
- **權限檢查**：`PATCH /applications/:id` 要求 `application.group.hostId === req.user.id`，非該群組團主一律 403
- **重複核准防護**：條件式 `updateMany({ where: { status: 'pending' } })` 是唯一防線，確保同一筆申請不會被核准兩次、扣款兩次；即使前端因重複點擊或網路重試發出兩個一模一樣的 PATCH 請求，後到的那個會拿到 `claimed.count === 0` 並整體回滾（不會扣款、不會建立 member）
- **名額超賣防護**：`admitMemberIntoGroup` 內的條件式 `updateMany({ where: { status: 'recruiting', currentMembers: { lt: maxMembers } } })` 確保即使兩筆申請幾乎同時被核准，也只有一筆能成功把 `currentMembers` 加 1；另一筆會在寫入瞬間發現名額已被佔滿而失敗（409），不會出現 `currentMembers > maxMembers` 的資料
- **核准當下的餘額二次檢查**：即使申請送出時已經檢查過餘額，`admitMemberIntoGroup` 在真正扣款前仍會重新查一次 `tokenBalance`，因為申請與核准之間可能間隔數天，期間餘額可能已被其他交易花掉
- **金流與成員建立的原子性**：核准申請、扣款、建立 `Member`/`Subscription`、寫入 `TokenTransaction`、額滿推進 `full` 全部在同一個 Prisma transaction 內完成，任何一步（例如名額檢查失敗）都會讓整個 transaction 回滾，不會出現「申請已核准但沒建立成員」或「扣了款但沒建立訂閱」的中間狀態
- **拒絕操作沒有金流**：因為申請階段只做預檢不預扣，拒絕不需要退款，只是單純把狀態改成 `rejected` 並清空 `activeKey`（允許申請人日後重新申請）
