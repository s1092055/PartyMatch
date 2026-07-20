# PM幣代管與撥款流程

## 使用者目標
使用者以「PM幣」作為平台內唯一的計價與支付單位：儲值取得 PM幣、申請加入群組時把席位費用交付平台代管、服務確認無誤後撥款給團主；若中途退出、群組解散或申訴成立則退款。

## 入口
- 儲值：桌機側欄／手機導覽列的「加值」按鈕、`TopupModal` 內的儲值面板；任何顯示「PM幣不足」toast 時的「前往儲值」動作按鈕（透過 `pm:open-topup` 事件開啟）
- 代管扣款：`GroupDetailModal` 申請加入群組（`ApplyModal` 送出申請）
- 撥款／退款：成員在 `MemberGroupView` 確認服務、申訴；團主在 `HostGroupView` 解散群組、移除成員、開始續訂；管理員在 `AdminTab` 裁定申訴
- 交易紀錄查詢：`TopupModal` 的交易紀錄子面板（個人）、`HostGroupView` 收款管理面板（`buildBillingPanel.jsx`，該群組全體成員）

## 前端檔案
- `src/shared/ui/TopupModal.jsx`：儲值 + 交易紀錄雙面板 Modal
- `src/shared/ui/TokenAmount.jsx`：`TokenBadge`／`TokenAmount` 金額顯示元件
- `src/features/account/components/tabs/TokenTab.jsx`：帳號中心 PM幣分頁
- `src/shared/api/tokensApi.js`：`fetchTokenBalance`、`topupTokens`
- `src/shared/stores/useAuthStore.js`：`topup(amount)` action（呼叫 API 後更新 `user.tokenBalance`）
- `src/features/group/GroupDetailModal.jsx`：申請加入時處理 `INSUFFICIENT_BALANCE` 錯誤碼
- `src/features/my-groups/host/components/hostGroupView/buildBillingPanel.jsx`：團主收款管理面板，依成員分組顯示 `escrow`/`refund`/`release` 交易明細
- `src/shared/api/groupsApi.js`：`fetchGroupTransactions`
- `src/features/my-groups/member/components/MemberGroupView.jsx`：確認服務（撥款）、申訴（凍結代管）
- `src/features/my-groups/host/hooks/useHostActions.js`：解散群組、移除成員、開始續訂等會觸發代管異動的操作
- `src/features/account/components/tabs/AdminTab.jsx`：申訴裁定表單

## 後端檔案
- `server/src/routes/tokens.js`：`GET /tokens`（餘額 + 近 50 筆交易）、`POST /tokens/topup`（模擬儲值）
- `server/src/utils/membership.js`：`admitMemberIntoGroup`，申請核准／團主手動加入成員共用的代管扣款邏輯
- `server/src/utils/pricing.js`：`computeSeatCost`（`billingCycle: 'yearly'` 時 `monthlyFee * 12`，否則等於 `monthlyFee`）
- `server/src/routes/applications.js`：`POST /applications`（餘額預檢，不預扣）、`PATCH /applications/:id`（核准時進入代管 transaction）
- `server/src/routes/members.js`：`DELETE /members/:id`（退出／被移除時退款）
- `server/src/routes/groups.js`：`GET /groups/:id`（惰性自動撥款）、`POST /groups/:id/confirm`（成員主動確認撥款）、`POST /groups/:id/dispute`（凍結）、`POST /groups/:id/cancel`（全額退款）、`POST /groups/:id/adjudicate`（裁定撥款或退款）、`POST /groups/:id/renew`（向全員收取下期代管費）、`GET /groups/:id/transactions`（團主查該群組所有代管紀錄）

## 資料表 / Model
- `User.tokenBalance`：個人 PM幣餘額
- `Group.escrowTokens`：該群組目前代管中的總額
- `TokenTransaction`：`type` 為 `topup`／`escrow`／`release`／`refund`，`amount` 正負號代表增減，`relatedGroupId` 可為 null（如儲值）

## 使用技術
- Prisma `$transaction`：核准申請、成員退出/移除、解散群組、裁定申訴、續訂收款都把「餘額檢查 → 扣款/退款 → 建立 `TokenTransaction`」包在同一交易內，保原子性
- 條件式 `updateMany`（樂觀鎖）：核准申請 `application.updateMany({ where: { status: 'pending' } })`、名額檢查 `group.updateMany({ where: { status: 'recruiting', currentMembers: { lt: maxMembers } } })`、續訂扣款 `user.updateMany({ where: { tokenBalance: { gte: seatCost } } })`，避免併發請求重複扣款或超額
- 惰性求值：`GET /groups/:id` 若群組處於 `confirming` 且 `confirmDeadline` 已過期，讀取當下才觸發自動撥款並回寫，不依賴排程任務
- 前端 toast 的 `action` 按鈕搭配 `window.dispatchEvent(new CustomEvent('pm:open-topup'))` 跨元件觸發儲值 Modal

## 流程步驟
1. **儲值**：使用者於 `TopupModal` 選擇金額 → `useAuthStore.topup(amount)` → `POST /tokens/topup` → 後端 `$transaction` 內同時 `user.tokenBalance` 遞增與 `tokenTransaction.create({ type: 'topup' })`，前端拿到最新餘額直接覆寫 `user.tokenBalance`（現階段為模擬儲值，點擊即入帳，未串接實際金流）
2. **申請時的餘額預檢**：`POST /applications` 用 `computeSeatCost(group)` 算出席位費用，若 `applicant.tokenBalance < seatCost` 回傳 400 + `code: INSUFFICIENT_BALANCE`；此階段只檢查、不扣款
3. **核准時代管扣款**：團主 `PATCH /applications/:id { status: 'approved' }` → 後端 `$transaction` 內：條件式 `updateMany` 搶佔申請（避免雙擊重複核准）→ 呼叫 `admitMemberIntoGroup`：條件式 `updateMany` 核對名額並遞增 `group.currentMembers`/`group.escrowTokens` → 建立 `Member`/`Subscription` → `user.tokenBalance` 遞減 seatCost → 寫入 `TokenTransaction { type: 'escrow', amount: -seatCost }` → 若額滿則群組狀態推進 `full`
4. **確認期撥款**：成員於 `MemberGroupView` 點「確認服務」→ `useGroupStore.confirmService(id)` → `POST /groups/:id/confirm`；若全員已確認或 `confirmDeadline` 已過，後端一次性 `$transaction`：群組 `status → active`、`escrowTokens → 0`、`host.tokenBalance` 遞增全額、寫入 `TokenTransaction { type: 'release' }`、全員 `Subscription.status → active`；未全員確認則僅標記該成員 `confirmedAt`，等待其他人或逾期
5. **逾期自動撥款**：任何人讀取 `GET /groups/:id` 時，若偵測到 `confirming` 且 `confirmDeadline` 已過，即觸發與步驟 4 相同的撥款邏輯（`callback` transaction 內先重查 `status` 確保冪等）
6. **成員退出／被移除退款**：`DELETE /members/:id`（僅 `recruiting`/`full` 期間可操作）→ 計算 `refundAmount = Math.min(seatCost, group.escrowTokens)` → `$transaction` 內刪除 `Member`、`group.currentMembers`/`escrowTokens` 遞減、`user.tokenBalance` 遞增 refundAmount、寫入 `TokenTransaction { type: 'refund' }`、`Application.status` 依身分改為 `left` 或 `removed`
7. **申訴凍結**：成員於 `confirming` 期間點「回報問題」→ 送出申訴表單（原因 + 選填附件）→ `POST /groups/:id/dispute` → 群組 `status → disputed`、`disputeDeadline = now + 3 天`，代管金額暫不異動（僅記錄 `serviceInfoIssueNote`/`disputeEvidenceUrl` 於該 `Member`）
8. **申訴裁定**：管理員於 `AdminTab` 選擇群組、裁定結果與說明 → `POST /groups/:id/adjudicate`；`winner: 'member'` 時退款給申訴成員並將其移出群組（其餘成員代管不動，群組回 `active`）；`winner: 'host'` 時全額撥款給團主、全員 `Subscription.status → active`
9. **團主解散群組**：僅 `recruiting`/`full` 狀態可解散 → `POST /groups/:id/cancel` → `$transaction` 內群組 `status → cancelled`、`escrowTokens → 0`，並對每位成員各自 `tokenBalance` 遞增 seatCost、各寫一筆 `TokenTransaction { type: 'refund' }`
10. **續訂收款**：團主於 `RenewalModal` 選「開始新一期收款」→ `POST /groups/:id/renew`（僅 `active` 可操作）→ 先以 `updateMany({ tokenBalance: { gte: seatCost } })` 條件式扣款全體成員，任何一人餘額不足則整批失敗並回傳 400 + `INSUFFICIENT_BALANCE` + `memberIds`；成功則批次寫入 `TokenTransaction { type: 'escrow' }`、清空所有成員 `serviceInfo`、群組 `status → pending_confirmation`

## 驗證重點
- 申請核准的 transaction 對 `Application.status` 用條件式 `updateMany`（只有 `status: 'pending'` 才轉 `approved`），不是先讀後寫，避免同一筆申請被雙擊或併發重複核准、重複扣款（`server/src/routes/applications.js:123`）
- `admitMemberIntoGroup` 對名額也用條件式 `updateMany`（`status: 'recruiting'` 且 `currentMembers < maxMembers`），併發核准時只有一筆成功，另一筆 409（`server/src/utils/membership.js:13`）
- 餘額不足時申請核准直接在 transaction 內 throw，觸發自動回滾，不會出現「已核准但成員/代管沒建立」的不一致狀態
- 續訂扣款用 `updateMany({ where: { tokenBalance: { gte: seatCost } } })`，不是「先查餘額、後扣款」兩步，避免檢查後、寫入前餘額被其他請求變動扣成負數；`charged.count !== memberIds.length` 就整批回滾回 409（`server/src/routes/groups.js:463`）
- 成員退款金額用 `Math.min(seatCost, group.escrowTokens)`，避免 `escrowTokens` 因先前已有退款而不足時扣成負數（`server/src/routes/members.js:142`）
- `confirm`/惰性撥款都在 transaction 內先重新查一次 `status`，確認仍為 `confirming` 才動作，避免同一群組被重複撥款（`server/src/routes/groups.js:97`）
- `GET /groups/:id/transactions` 僅團主本人可查看（`hostId !== req.user.id` 回 403）
