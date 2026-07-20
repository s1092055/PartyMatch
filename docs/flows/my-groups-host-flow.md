# 我的群組（團主視角）

## 使用者目標
團主管理自己建立的群組：審核申請、鎖定群組開始收款、啟用服務、查看收款明細、回報成員帳號問題，以及在服務期間結束後續訂或結束群組。

## 入口
`/my-groups?view=host`（`MyGroupsPage` → `HostPage`）；也可透過通知點擊（`new_application`/`group_full`/`group_activated`/`member_left` 等）以 `navigate` + `pm:open-host-group` 事件直接開啟指定群組並自動展開對應面板

## 前端檔案
- `src/features/my-groups/host/HostPage.jsx`：頁面 orchestrator
- `src/features/my-groups/host/hooks/useHostActions.js`：所有團主操作的事件處理器（鎖定、啟用、移除成員、審核、續訂、解散等）與 `pm:open-host-group` 事件監聽
- `src/features/my-groups/host/components/HostGroupView.jsx`：團主視角群組詳情 Modal
- `src/features/my-groups/host/components/HostedGroupCard.jsx`：群組卡片
- `src/features/my-groups/host/components/ActivateServiceModal.jsx`：啟用服務前逐一勾選成員確認的 Modal
- `src/features/my-groups/host/components/ReportServiceIssueModal.jsx`：回報成員帳號問題
- `src/features/my-groups/host/components/RenewalModal.jsx`：續訂管理（見續訂流程文件）
- `src/features/my-groups/host/components/hostGroupView/buildMembersPanel.jsx`：成員名單子面板（含移除成員）
- `src/features/my-groups/host/components/hostGroupView/buildApplicationsPanel.jsx`：申請管理子面板（僅待審核）
- `src/features/my-groups/host/components/hostGroupView/ApplicationCard.jsx`：單筆申請卡片（核准／拒絕）
- `src/features/my-groups/host/components/hostGroupView/buildReviewHistoryPanel.jsx`：審核紀錄第三層面板（含篩選）
- `src/features/my-groups/host/components/hostGroupView/buildBillingPanel.jsx`：收款管理面板（見 PM幣代管流程文件）
- `src/features/my-groups/host/utils/hostFilters.js`：`STATUS_FILTER_TABS`、`matchesFilter`、`calcApprovalSeatPatch`
- `src/features/account/components/tabs/AdminTab.jsx`：管理員裁定申訴（跨群組，非團主本人操作）

## 後端檔案
- `server/src/routes/groups.js`：`POST /:id/lock`、`POST /:id/activate`、`POST /:id/cancel`、`POST /:id/renew`、`GET /:id/transactions`、`PATCH /:id`
- `server/src/routes/applications.js`：`PATCH /:id`（核准／拒絕）
- `server/src/routes/members.js`：`POST /`（團主手動加入成員）、`PATCH /:id`（回報帳號問題）、`DELETE /:id`（移除成員）
- `server/src/routes/conversations.js`：`POST /group`（鎖定群組時建立聊天室）
- `server/src/utils/membership.js`：`admitMemberIntoGroup`

## 資料表 / Model
- `Group`：`status`、`currentMembers`/`maxMembers`、`escrowTokens`、`nextBillingDate`
- `Application`：`status`（`pending`/`approved`/`rejected`）
- `Member`：`serviceInfoIssueNote`
- `TokenTransaction`：收款管理面板依 `relatedGroupId` 查詢

## 使用技術
- 自訂 hook 抽出頁面邏輯：`useHostActions` 把 `HostPage` 拆成純 UI + hook，訂閱 `useGroupStore`/`useApplicationStore`/`useMemberStore` 三個 store 切片，任一變動就透過 `useEffect` 重算 `hostData`
- `pm:open-host-group` window event：通知點擊、`location.state` 兩種路徑都呼叫同一個 `applyOpenHostGroup`，統一設定 `viewGroupId`／`autoOpenLockGroup`／`autoOpenActivate`／`autoOpenApplications`／`autoOpenBilling`
- `GroupModalShell` 三層滑動 Panel：申請管理（第二層）→ 審核紀錄（第三層，`subSubPanel`）
- 樂觀更新 + 背景同步：核准/拒絕申請、移除成員時先更新本地 `hostData`／`seatMap`，再背景呼叫對應 API 跟 `insertNotification`
- `CountdownConfirmDialog`：鎖定群組、解散群組、移除成員都要倒數確認

## 流程步驟
1. **建立群組後查看**：`HostPage` 依 `FilterTabsBar` 分頁與 `matchesFilter` 過濾 `allGroups`；統計卡顯示本月預估收入、平均每組、服務中成員數
2. **審核申請**（`recruiting`）：`HostGroupView` 側邊欄「申請管理」顯示待審核清單 → 團主點「核准」→ `handleApprove(appId)` 檢查名額是否足夠 → `updateApplicationStatus(appId, 'approved')` → `PATCH /applications/:id`（後端在 `$transaction` 內完成餘額檢查、代管扣款、建立 `Member`/`Subscription`）→ 前端等待完成後重新 `init` member/subscription store，再依 `calcApprovalSeatPatch` 更新本地名額，若額滿則額外對團主自己建立 `group_full` 通知；點「拒絕」則 `updateApplicationStatus(appId, 'rejected')` → `PATCH /applications/:id { status: 'rejected' }`，並對申請人寫入 `application_rejected` 通知
3. **移除已核准成員**（`recruiting`/`full` 期間）：`buildMembersPanel` 提供移除按鈕 → `CountdownConfirmDialog` 確認 → `handleRemoveMember(member)`：呼叫 `adjustCreditScore`（信用分數扣分）、`removeMember(member.id)` → `DELETE /members/:id`（後端退款、名額釋出、`Application.status → removed`），前端同步本地 `seatMap`、對成員寫入 `member_removed` 通知、若聊天室存在則發系統訊息並將該成員移出聊天室參與者
4. **鎖定群組**（`full → pending_confirmation`）：`handleLockGroup` 先呼叫 `POST /conversations/group` 建立群組聊天室（後端自動把團主 + 所有成員加入 `participants`）→ 再呼叫 `lockGroup(viewGroupId)`（`POST /groups/:id/lock`，後端同時設定所有成員 `Subscription.nextBillingDate`）→ 在聊天室發送 `fill_service_info` 類型的 action 訊息 → 對團主自己與所有成員各自建立 `group_chat_opened` 通知 → 樂觀把聊天室加入 `useConversationStore`
5. **啟用服務**（`pending_activation → confirming`）：`ActivateServiceModal` 要求逐一勾選確認每位成員帳號資訊無誤（`allMembersChecked`）才能按下最終確認 → `handleActivate` 呼叫 `activateService(viewGroupId)`（`POST /groups/:id/activate`，設定 `confirmDeadline = now + 48h`）→ 在聊天室發系統訊息、對團主與所有成員建立 `group_activated` 通知
6. **回報成員帳號問題**：`ReportServiceIssueModal` 填寫問題說明 → `handleReportServiceInfoIssue(member, note)`：`updateMember(member.id, { serviceInfoIssueNote: note })` → `PATCH /members/:id`；聊天室發系統訊息 + `request_service_resubmit` action 訊息、對該成員建立 `service_info_issue` 通知
7. **收款管理**（鎖定後）：`buildBillingPanel` 掛載時呼叫 `fetchGroupTransactions(group.id)`（`GET /groups/:id/transactions`，僅團主本人可查），依成員分組展開顯示 `escrow`/`refund`/`release` 明細，並在頂部彙總已撥款給團主的總額
8. **解散群組**（僅 `recruiting`/`full`，見 PM幣代管流程文件）：`handleCancelGroup` → `cancelGroup(viewGroupId)`（`POST /groups/:id/cancel`）→ 對所有成員建立 `group_cancelled` 通知
9. **續訂／結束服務**：見「續訂流程」文件（`RenewalModal`、`handleStartRenewal`/`handleEndGroup`）
10. **平台裁定申訴**：申訴群組不在團主自己的操作範圍內，改由平台管理員在 `AdminTab` 選擇 `disputed` 狀態群組並送出裁定（見申訴流程文件）

## 驗證重點
- 所有團主專屬 route（`lock`/`activate`/`cancel`/`renew`/`PATCH /groups/:id`/`GET /:id/transactions`）都檢查 `group.hostId !== req.user.id` 回 403
- `POST /groups/:id/lock` 僅允許 `status === 'full'`；`activate` 僅允許 `pending_activation`；`cancel` 僅允許 `recruiting`/`full`；`renew` 僅允許 `active`——都在 route 層用明確狀態檢查擋下不合法轉換，另有 `groups.js` 頂部 `ALLOWED_TRANSITIONS` 表供一般 `PATCH /groups/:id` 用
- `PATCH /applications/:id` 審核用條件式 `updateMany({ where: { status: 'pending' } })` 而非先讀後寫，避免同一筆申請被重複核准、重複扣款（`server/src/routes/applications.js:123`）
- `POST /members`（團主手動加人）僅允許 `group.status === 'recruiting'`，且跟申請核准共用 `admitMemberIntoGroup`，不會繞過名額上限跟代管帳務（`server/src/routes/members.js:69`）
- `DELETE /members/:id` 僅允許 `recruiting`/`full` 狀態操作，鎖定後（`pending_confirmation` 起）成員名單不可再變動，回 400
- `GET /groups/:id/transactions` 僅團主本人可查看，非團主回 403
- `insertNotification` 通知非自己的使用者時，後端會驗證請求人跟目標使用者都跟 `meta.groupId` 指的群組有關聯（成員／團主／曾送申請），避免任意使用者偽造通知（`server/src/routes/notifications.js:50`）
