# 續訂流程

## 使用者目標
團主在群組服務期滿（`active` 狀態）後，決定是要開始下一期收款讓群組繼續運作，還是結束服務讓群組收尾。

## 入口
`HostGroupView` 側邊欄「續訂管理」按鈕（僅 `group.status === 'active'` 時顯示）→ 開啟 `RenewalModal`；亦可透過 `upcoming_renewal`／`group_renewal` 通知點擊 `navigate('/my-groups?view=member', { state: { openGroupId } })` 讓成員端提前得知即將扣款（成員本身無法操作續訂，僅團主可發起）

## 前端檔案
- `src/features/my-groups/host/components/RenewalModal.jsx`：續訂管理 Modal，顯示帳單日倒數與兩個選項（開始新一期／結束服務）
- `src/features/my-groups/host/components/HostGroupView.jsx`：側邊欄「續訂管理」入口（`onOpenRenewal` prop）
- `src/features/my-groups/host/hooks/useHostActions.js`：`renewalModalGroupId`、`handleStartRenewal`、`handleEndGroup`
- `src/shared/stores/useGroupStore.js`：`startRenewalCycle`、`endGroup`
- `src/shared/stores/useMemberStore.js`：`clearGroupServiceInfos`（本地清空成員帳號資訊，呼應後端重置）
- `src/shared/utils/date.js`：`advanceByCycle`、`daysUntil`、`toISODate`（計算下一期帳單日、倒數天數）

## 後端檔案
- `server/src/routes/groups.js`：`POST /groups/:id/renew`
- `server/src/utils/pricing.js`：`computeSeatCost`
- `server/src/routes/subscriptions.js`：`notifyUpcomingRenewals`（`GET /subscriptions` 副作用，距下次扣款日 7 天內提醒）

## 資料表 / Model
- `Group`：`status`、`nextBillingDate`、`billingCycle`、`escrowTokens`
- `Member`：續訂時 `serviceInfo`/`serviceInfoIssueNote`/`confirmedAt` 全部清空為 `null`，需重新走一次填寫帳號流程
- `TokenTransaction`：續訂收款批次寫入多筆 `type: 'escrow'`

## 使用技術
- Prisma `$transaction`（callback 形式）：後端在單一交易內完成「條件式扣款全體成員 → 批次建交易紀錄 → 清空成員帳號資訊 → 更新群組狀態與下次帳單日」
- 條件式 `updateMany`（`tokenBalance: { gte: seatCost }`）：避免扣款當下餘額被其他請求變動扣成負數
- 前端 `advanceByCycle`／`daysUntil` 純函式算下一期帳單日跟逾期天數，只供 Modal 顯示，實際帳單日還是以後端回傳為準

## 流程步驟
1. 群組進入 `active` 狀態後，`HostGroupView` 側邊欄顯示「續訂管理」，點擊呼叫 `onOpenRenewal()` → `HostPage`／`useHostActions` 設定 `renewalModalGroupId`，開啟 `RenewalModal`
2. `RenewalModal` 依 `group.nextBillingDate` 與 `group.billingCycle` 計算 `daysUntil` 顯示「距帳單日還有 N 天」或「帳單日已過 N 天」，並列出兩個選項卡片
3. **開始新一期收款**：點擊 → `handleStartRenewal()` → `startRenewalCycle(renewalModalGroupId)` → `POST /groups/:id/renew`：
   - 後端先查出所有成員與其 `tokenBalance`，若有人餘額不足 `computeSeatCost(group)` 直接回 400（`code: INSUFFICIENT_BALANCE`，附 `memberIds`），不進入 transaction
   - 通過預檢後進入 `$transaction`：以 `updateMany({ where: { tokenBalance: { gte: seatCost } } })` 條件式扣款全體成員；若成功筆數與成員數不符（代表扣款當下餘額被其他請求變動）則整批回滾並回 409
   - 批次寫入每位成員一筆 `TokenTransaction { type: 'escrow', amount: -seatCost }`
   - 清空所有成員的 `serviceInfo`/`serviceInfoIssueNote`/`confirmedAt`
   - 群組 `status → pending_confirmation`、`nextBillingDate` 依 `billingCycle` 往後推一期、`escrowTokens` 遞增 `seatCost * 成員數`
   - 前端收到回應後呼叫 `clearMemberServiceInfos(renewalModalGroupId)` 本地同步清空帳號資訊、於聊天室發系統訊息「新一期已開始，請重新填寫訂閱帳號資訊」、對每位成員建立 `group_renewal` 通知，關閉 Modal 並 `refreshGroups()`
4. **結束服務**：點擊 → `handleEndGroup()` → `endGroup(renewalModalGroupId)`（`useGroupStore.endGroup` 內部呼叫通用的 `update(id, { status: 'ended' })`，走 `PATCH /groups/:id`）→ 對所有成員建立 `group_ended` 通知、聊天室發系統訊息「團主已結束「X」群組」，關閉 Modal 並 `refreshGroups()`
5. 續訂後群組回到 `pending_confirmation`，後續流程與初次鎖定群組相同：成員需重新填寫帳號資訊 → 全員填完自動推進 `pending_activation` → 團主再次啟用服務 → 進入新一輪 48 小時確認期
6. 距下次帳單日 7 天內，成員每次讀取 `GET /subscriptions` 時後端 `notifyUpcomingRenewals` 會檢查是否已發過同一期的提醒（以 `meta.nextBillingDate` 比對），未發過則建立 `upcoming_renewal` 通知，提醒成員確認 PM幣餘額是否充足

## 驗證重點
- `POST /groups/:id/renew` 僅團主本人可操作（`group.hostId !== req.user.id` 回 403），且僅允許 `status === 'active'`（其餘狀態回 400，訊息附目前實際狀態）
- 續訂扣款預檢跟正式扣款是兩個獨立步驟：預檢用讀到的 `tokenBalance` 快照判斷並回傳哪些成員餘額不足；正式扣款仍用資料庫層條件式 `updateMany` 二次核對，兩邊都失敗才不會產生半套扣款
- `notifyUpcomingRenewals` 用 `meta?.groupId` + `meta?.nextBillingDate` 是否相符判斷這期是否已發過提醒，避免同一期帳單重複通知；團主開新一期（`nextBillingDate` 變了）就會針對新帳單日重新發送
- `PATCH /groups/:id`（`endGroup` 底層用的通用更新）仍受 `ALLOWED_TRANSITIONS` 限制，`active` 只能轉到 `confirming`/`ended`/`pending_confirmation`，避免前端誤傳非法狀態值
