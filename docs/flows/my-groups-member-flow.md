# 我的群組（成員視角）

## 使用者目標
成員在申請通過後追蹤自己的訂閱進度：填寫服務帳號、確認服務是否正常啟用、有問題時申訴，或在鎖定前退出群組。

## 入口
`/my-groups?view=member`（`MyGroupsPage` → `MemberPage`）；也可透過通知點擊（`pm:open-group`／`navigate('/my-groups?view=member', { state: { openGroupId } })`）或 `TopupModal` 交易紀錄列點擊（`pm:open-group`）間接開啟特定群組的 `MemberGroupView`

## 前端檔案
- `src/features/my-groups/member/MemberPage.jsx`：頁面 orchestrator，串接 `FilterTabsBar` 分頁與訂閱卡片 grid
- `src/features/my-groups/member/components/SubscriptionCard.jsx`：單一訂閱卡片
- `src/features/my-groups/member/components/MemberGroupView.jsx`：成員視角群組詳情 Modal（填寫帳號、確認服務、申訴、退出、審視成員名單）
- `src/features/my-groups/member/components/ReviewHostModal.jsx`：確認服務完成後的團主評價彈窗
- `src/features/my-groups/member/utils/memberFilters.js`：分頁篩選邏輯、`isHistorySubscription`
- `src/shared/ui/group/GroupViewModal.jsx`：依 `isHost` 決定渲染 `HostGroupView` 或 `MemberGroupView` 的薄殼
- `src/shared/ui/group/GroupModalShell.jsx`：三層滑動 Panel 共用殼
- `src/shared/utils/groupStatus.js`：`isEffectivelyActive`（成員自行確認服務後個人視角視為已啟用）

## 後端檔案
- `server/src/routes/members.js`：`GET /members`、`PATCH /members/:id`（填寫 `serviceInfo`）、`DELETE /members/:id`（退出）
- `server/src/routes/groups.js`：`POST /groups/:id/confirm`（確認服務）、`POST /groups/:id/dispute`（申訴）
- `server/src/routes/subscriptions.js`：`GET /subscriptions`（含 `notifyUpcomingRenewals` 副作用）
- `server/src/utils/pricing.js`：`computeSeatCost`

## 資料表 / Model
- `Member`：`serviceInfo`（JSON，帳號資訊）、`serviceInfoIssueNote`、`disputeEvidenceUrl`、`confirmedAt`
- `Subscription`：`status`（`pending`/`active`/`ended`）、`nextBillingDate`
- `Group`：`status`、`confirmDeadline`、`disputeDeadline`、`escrowTokens`
- `Review`：確認服務完成後可對團主留下評價

## 使用技術
- Zustand store 樂觀更新：`useMemberStore.fillServiceInfo` 先寫入本地 state，`PATCH` 失敗則回滾至送出前的值（而非清空）
- `GroupModalShell` 三層滑動 Panel：`overview → subPanel`（填寫帳號 / 申訴 / 成員名單），`activePanel` 控制當前顯示層
- `CountdownConfirmDialog`：確認服務、退出群組皆需倒數數秒才可按下確認鍵，避免誤觸不可逆操作
- `uploadDisputeEvidence`（`src/shared/api/storageApi.js`）：申訴附件上傳至 Imgbb，取得 URL 後隨 `POST /groups/:id/dispute` 一併送出
- `window.dispatchEvent('pm:open-messages'/'pm:open-dm')`：從群組概覽或成員名單直接開啟群組聊天室或私訊團主

## 流程步驟
1. **查看訂閱列表**：`MemberPage` 依 `FilterTabsBar` 分頁（全部／處理中／啟用中／已結束）過濾 `useSubscriptionStore`/`useMemberStore` 中屬於自己的資料，`isHistorySubscription` 判斷是否為已結束/已取消而排除出一般分頁
2. **填寫服務帳號**（`pending_confirmation`）：`MemberGroupView` 依 `needsFillInfo`（`!hasServiceInfo && group.status === 'pending_confirmation'`）顯示「填寫帳號」側邊按鈕 → 開啟 `subPanel` 表單，輸入 email → `fillServiceInfo(myMember.id, group.id, { email })` → `PATCH /members/:id { serviceInfo }`；後端檢查群組內是否全員已填寫，若是則自動將 `Group.status` 從 `pending_confirmation` 推進至 `pending_activation`，回傳中帶 `_groupAdvanced`，前端據此呼叫 `useGroupStore.setGroupStatus` 本地同步
3. **帳號問題修正**：若團主回報問題（`serviceInfoIssueNote` 非空），`MemberGroupView` 顯示警示 banner 並允許重新填寫（`showFillBtn = needsFillInfo || hasServiceInfoIssue`）
4. **確認服務**（`confirming`）：`canConfirm = group.status === 'confirming' && !myMember.confirmedAt` 時顯示「確認服務」/「回報問題」按鈕 → 點擊「確認服務」彈出 `CountdownConfirmDialog` → 確認後 `useGroupStore.confirmService(group.id)` → `POST /groups/:id/confirm`；若後端判斷全員已確認則立即撥款並回傳 `released: true`，前端 toast「款項已撥付」並重新 `init` 訂閱 store；否則僅本地 `markConfirmed(myMember.id)` 並提示「等待其他成員確認中」
5. **確認後邀請評價**：確認服務送出後一律開啟 `ReviewHostModal`（`reviewPrompt`），若已撥款（`res.released`）評價視窗關閉時一併關閉群組 Modal
6. **申訴**（`confirming` 期間）：點擊「回報問題」→ 進入 `subPanel` 申訴表單（可複選申訴原因、選填說明與附件）→ 附件經 `uploadDisputeEvidence` 上傳取得 URL → 送出 `disputeGroup(group.id, { reason, evidenceUrl })` → `POST /groups/:id/dispute`，成功後群組進入 `disputed`，關閉 Modal 並提示「客服將在 3 天內裁定」
7. **退出群組**（`recruiting`/`full`）：`canLeaveGroup` 判斷是否可退出 → 點擊後 `CountdownConfirmDialog` 確認 → `onLeaveGroup` 呼叫 `finalizeLeaveGroup(groupId, user)`（`src/features/group/utils/leaveGroupFlow.js`）：送出系統訊息並退出聊天室、移除本地 `Member`/`Subscription`、將 `Application` 標為 `left`、群組名額本地回補，並建立 `member_left` 通知給團主
8. **成員名單／聯絡團主**：`activePanel === 'members'` 顯示團主與其他成員，點擊個別成員的訊息 icon 觸發 `pm:open-dm` 開啟私訊

## 驗證重點
- `PATCH /members/:id` 僅本人（`isOwner`）或該群組團主（`isHost`）可操作，否則回 403（`server/src/routes/members.js:95`）
- `DELETE /members/:id`（退出）僅允許 `recruiting`/`full` 狀態，`pending_confirmation` 之後成員名單不可再變動，回 400（`server/src/routes/members.js:136`）
- `POST /groups/:id/confirm`／`/dispute` 皆檢查請求人是否為該群組成員（`group.members.find(m => m.userId === req.user.id)`），非成員回 403；群組狀態非 `confirming` 回 400
- 確認服務時後端在同一個 `$transaction` 內同時更新群組狀態、撥款、清空 `escrowTokens`、寫入 `TokenTransaction`、將全員 `Subscription.status` 設為 `active`，避免部分寫入失敗導致狀態不一致
- 前端 `fillServiceInfo` 若 `PATCH` 失敗會將本地 `serviceInfo` 回滾至送出前的值，而非清空，避免使用者原本已填的資料無故消失
- `MemberGroupView` 的 `isEffectivelyActive(group.status, myMember?.confirmedAt)` 讓「我已確認、但其他人還沒確認」時的個人視角提前顯示為已啟用狀態
