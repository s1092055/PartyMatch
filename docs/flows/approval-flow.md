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
- **Prisma interactive transaction**：核准申請、查名額上限、呼叫 `admitMemberIntoGroup`（餘額檢查、名額檢查、建立 member/subscription、扣款、寫交易紀錄、額滿推 full）全包在同一個 `$transaction` 裡，任何一步失敗整個回滾，不會出現「申請標成 approved 但成員沒建出來」這種半吊子狀態
- **條件式 `updateMany` 當樂觀鎖**：`tx.application.updateMany({ where: { id, status: 'pending' }, data: { status: 'approved' } })`，靠 `WHERE status = 'pending'` 確保只有第一個請求能把 `count` 變成 1；重複點擊或多分頁送出的第二個請求會拿到 `count === 0`，直接 409 中止，不會走到扣款
- **交易邏輯抽成共用函式**：`admitMemberIntoGroup(tx, {...})` 給 `applications.js`（核准申請）與 `members.js`（團主手動加人）共用，這組規則以後只需要改一處
- **名額防超賣也是條件式 `updateMany`**：`tx.group.updateMany({ where: { id: groupId, status: 'recruiting', currentMembers: { lt: maxMembers } }, data: { currentMembers: { increment: 1 }, escrowTokens: { increment: seatCost } } })`，`count === 0` 代表寫入瞬間名額已滿，409 擋下，避免兩筆申請同時核准超過 `maxMembers`
- 前端 `handleApprove` 送出前先做一次本地名額快照檢查，只是即時 UI 回饋，真正防線在後端 transaction；核准成功後 `await Promise.all([useMemberStore.init(), useSubscriptionStore.init()])` 重新拉真實資料，確保 store 拿到的是 transaction 建出來的真實 `Member`/`Subscription` id

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
- 權限：`PATCH /applications/:id` 要求 `application.group.hostId === req.user.id`，非團主一律 403
- 重複核准防護：條件式 `updateMany({ where: { status: 'pending' } })` 是唯一防線，重複點擊或網路重試發出兩個一樣的 PATCH，後到的拿 `count === 0` 整體回滾，不扣款不建 member
- 名額超賣防護：`admitMemberIntoGroup` 的條件式 `updateMany` 確保兩筆申請幾乎同時核准時只有一筆能把 `currentMembers` 加 1，另一筆 409，不會超過 `maxMembers`
- 核准當下二次查 `tokenBalance` 才扣款——申請與核准可能隔了好幾天，期間餘額可能已經被花掉
- 核准、扣款、建 `Member`/`Subscription`、寫 `TokenTransaction`、額滿推 `full` 全部在同一個 transaction，任何一步失敗就整包回滾，不會有「核准了但沒建成員」的中間狀態
- 拒絕不涉及金流：申請階段只預檢不預扣，拒絕就單純把狀態改 `rejected` 並清空 `activeKey`，允許之後重新申請
