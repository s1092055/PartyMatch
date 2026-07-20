# 申訴流程

## 使用者目標
成員在確認期（`confirming`）內若發現服務未正常啟用或有其他問題，可向平台正式申訴，凍結代管款項並等待客服裁定，而不必單方面信任團主的說法。

## 入口
`MemberGroupView` 確認期畫面的「回報問題」按鈕（`canConfirm` 為真時，與「確認服務」按鈕並列）→ 開啟申訴表單 `subPanel`；裁定端入口為帳號中心「管理員」分頁（`AdminTab`，僅 `isAdmin` 使用者可見）

## 前端檔案
- `src/features/my-groups/member/components/MemberGroupView.jsx`：申訴表單（`activePanel === 'dispute'`）、`handleDisputeSubmit`、`handleEvidenceSelect`
- `src/shared/api/storageApi.js`：`uploadDisputeEvidence`（附件上傳）
- `src/shared/stores/useGroupStore.js`：`disputeGroup`、`adjudicateGroup`
- `src/shared/api/groupsApi.js`：`disputeGroupApi`、`adjudicateGroupApi`
- `src/features/account/components/tabs/AdminTab.jsx`：申訴裁定表單（選擇群組、裁定結果、裁定說明）

## 後端檔案
- `server/src/routes/groups.js`：`POST /groups/:id/dispute`（成員送出申訴）、`POST /groups/:id/adjudicate`（管理員裁定，`requireAdmin` 保護）
- `server/src/middleware/auth.js`：`requireAdmin`
- `server/src/utils/pricing.js`：`computeSeatCost`

## 資料表 / Model
- `Group`：`status`（`confirming → disputed → active`）、`disputeDeadline`（申訴提出時間 + 3 天）、`escrowTokens`
- `Member`：`serviceInfoIssueNote`（申訴原因與補充說明合併存放）、`disputeEvidenceUrl`（選填附件 URL）
- `TokenTransaction`：裁定結果依 `winner` 寫入 `refund`（成員獲勝）或 `release`（團主獲勝）

## 使用技術
- Prisma `$transaction`（陣列形式）：送出申訴與裁定皆把群組狀態變更與 `Member` 欄位更新（或代管金額異動）包在同一交易
- 前端多選 checkbox + 自由文字合併：`DISPUTE_REASON_OPTIONS` 固定選項可複選，與補充說明用 `\n` 串接後整包寫入單一 `reason` 字串欄位（後端 `serviceInfoIssueNote` 沒有結構化多欄位）
- 附件上傳與表單送出分離：`handleEvidenceSelect` 先呼叫 `uploadDisputeEvidence` 取得 URL 並存在 state，送出申訴時才一併帶入 `POST /groups/:id/dispute`
- `NotificationType` enum 定義了 `dispute_raised`／`escrow_released` 兩個類型，但目前程式碼中沒有任何地方建立這兩種通知——裁定結果不會主動通知申訴成員或團主，僅管理員自己在 `AdminTab` 看到 toast

## 流程步驟
1. 群組進入 `confirming`（服務已啟用，48 小時確認期）後，成員在 `MemberGroupView` 看到「確認服務」與「回報問題」兩個按鈕（`canConfirm`）
2. 點擊「回報問題」→ `setActivePanel('dispute')`，重置 `disputeReasons`/`disputeDetail`/`evidenceUrl`/`evidenceName`
3. 使用者從 6 個固定選項中複選申訴原因（服務帳號未提供或有誤／服務尚未啟用／服務品質與描述不符／團主已讀不回無法聯繫／帳號被團主收回或更改密碼／其他），可選填補充說明文字
4. 選填上傳附件（截圖佐證）：`handleEvidenceSelect` 呼叫 `uploadDisputeEvidence(file)` 上傳並取得 URL，上傳中禁用送出按鈕（`evidenceUploading`）
5. 送出申訴：`handleDisputeSubmit` 組合 `reason = [複選原因.join('、'), 補充說明].filter(Boolean).join('\n')` → `disputeGroup(group.id, { reason, evidenceUrl })` → `POST /groups/:id/dispute`
6. 後端驗證請求人為該群組成員且群組確實處於 `confirming`，通過後於同一 `$transaction` 內：群組 `status → disputed`、`disputeDeadline = now + 3 天`；該成員的 `Member` 記錄寫入 `serviceInfoIssueNote`（申訴原因）與 `disputeEvidenceUrl`（若有上傳）
7. 前端收到成功回應後關閉表單、toast「申訴已送出，客服將在 3 天內裁定」、關閉整個群組 Modal；此時代管金額（`escrowTokens`）在資料庫層仍原封不動，僅群組狀態鎖在 `disputed`，等同凍結（`confirm`/`activate` 等其餘 route 皆要求特定前置狀態，`disputed` 狀態下無法再被觸發）
8. 管理員於 `AdminTab` 看到所有 `status === 'disputed'` 的群組，選擇群組、裁定結果（「團主獲勝（撥款）」或「成員獲勝（退款）」）與裁定說明後送出 → `adjudicateGroup(groupId, { winner, reason })` → `POST /groups/:id/adjudicate`
9. 後端先找出「有 `serviceInfoIssueNote` 的成員」作為申訴人（`group.members.find(m => m.serviceInfoIssueNote)`），若找不到回 400
10. `winner === 'member'`：`$transaction` 內群組 `status → active`、`disputeDeadline → null`、`escrowTokens` 遞減該成員的 `seatCost`；該成員 `tokenBalance` 遞增同額退款、寫入 `TokenTransaction { type: 'refund' }`；刪除該 `Member` 記錄、其 `Subscription.status → cancelled`（其餘成員的代管與訂閱不受影響）
11. `winner === 'host'`：`$transaction` 內群組 `status → active`、`disputeDeadline → null`、`escrowTokens → 0`；團主 `tokenBalance` 遞增全額 `escrowTokens`、寫入 `TokenTransaction { type: 'release' }`；全體成員 `Subscription.status → active`
12. 前端 `adjudicateGroup` 收到結果後不直接套用回傳值，而是重新 `init({ all: true })` 群組 store 並重新 `init()` member/subscription store，確保裁定連動的多筆資料變更（成員名單、代管餘額、訂閱狀態）都取得資料庫最新真實狀態

## 驗證重點
- `POST /groups/:id/dispute` 檢查群組必須處於 `confirming`（否則 400）、請求人必須是該群組 `Member`（否則 403）
- `POST /groups/:id/adjudicate` 用 `requireAdmin` 中介層保護，僅管理員帳號可呼叫；並檢查群組必須處於 `disputed`（否則 400）、`winner` 必須為 `member`/`host` 其一、`reason` 不可為空
- 裁定成員獲勝時，僅該申訴成員被移出群組並退款，其餘成員的 `Member`/`Subscription`/代管餘額完全不受影響——裁定的影響範圍精準限定在單一成員，不會波及整個群組
- 裁定操作沒有樂觀本地更新，前端刻意選擇「裁定完成後整包重新 `init`」而非手動拼湊本地 state，理由是裁定牽動多張表且分支邏輯複雜，直接信任資料庫回傳可避免前端邏輯與後端 transaction 邏輯不同步
- 目前後端與前端都沒有為裁定結果建立任何 `Notification` 記錄（`dispute_raised`/`escrow_released` 這兩個 enum 值定義了但未被使用），申訴成員與團主需自行重新整理頁面才會看到群組狀態已變回 `active`
