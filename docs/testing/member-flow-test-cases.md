# 成員視角測試案例

涵蓋：申請加入、撤回申請、查看我的群組、填寫服務帳號資訊、確認服務、申訴、退出群組。對應程式碼：`src/features/my-groups/member/components/MemberGroupView.jsx`、`server/src/routes/{applications,members,groups}.js`。

測試帳號見 [`test-accounts.md`](./test-accounts.md)。

---

### TC-101：申請加入群組

**前置條件**：demo1 登入，找一個 `recruiting` 狀態的群組（例如 seed 資料 G2 Notion）。

**步驟**：
1. 開啟群組詳情，點擊申請加入
2. 填寫留言、勾選同意
3. 送出

**預期結果**：
- 送出成功畫面顯示「申請已送出！等待團主審核後即可加入」
- `GET /applications` 可查到這筆 `status: 'pending'` 的申請

---

### TC-102：撤回審核中的申請

**前置條件**：延續 TC-101，demo1 有一筆 `pending` 申請。

**步驟**：
1. 在群組詳情或我的群組頁找到該筆申請，點擊「取消申請」並確認

**預期結果**（`DELETE /applications/:id`）：
- 僅申請人本人可撤回（`application.userId !== req.user.id` → 403）
- 僅能撤回 `pending` 狀態的申請（非 `pending` → 400「只能撤回審核中的申請」）
- 成功後狀態變為 `withdrawn`，`activeKey` 清空
- 撤回後可對同一群組重新申請（`applications.js` 第 62 行的白名單包含 `withdrawn`）

---

### TC-103：查看我的群組（成員視角）

**前置條件**：demo1 有多個不同狀態的群組成員身分（可用 seed 資料：G1 待審申請、G9 active 成員等）。

**步驟**：
1. 登入後前往 `/my-groups?view=member`
2. 依序點擊「全部 / 審核中 / 招募中 / 待鎖定 / 填寫資訊中 / 待啟用 / 確認期中 / 申訴中 / 服務中」分頁

**預期結果**：
- 每個分頁對應單一狀態（`FILTER_TABS`，`src/features/my-groups/member/utils/memberFilters.js`），不再像舊版把 `full`/`pending_confirmation`/`pending_activation`/`confirming`/`disputed` 全部混在同一個「處理中」分頁裡
- 「審核中」只顯示尚未核准的申請本身（還沒有 `Subscription` 記錄），其餘分頁顯示對應狀態的訂閱
- 「服務中」除了 `active` 狀態，也包含自己已經確認過服務、但群組仍在 `confirming` 等其他成員確認的訂閱（`subscriptionBucket`／`isEffectivelyActive` 判斷）
- 「已結束」／已取消的群組（`ended`/`cancelled`）**不會出現在任何分頁分類中**，只能透過側邊欄底部的「群組紀錄」按鈕開啟 `GroupHistoryModal` 查看；桌機版側邊欄現在有固定高度，「群組紀錄」按鈕位置不會隨分頁項目多寡而上下浮動
- 頂部統計卡「本月訂閱花費 / 平均每組 / 本月省下」隨切換分頁正確顯示（僅限成員視角，不含彩色左邊框標記狀態，一律用 badge/chip/icon）

---

### TC-104：填寫服務帳號資訊

**前置條件**：demo2 為 G4（Disney+）成員，群組狀態 `pending_confirmation`，`myMember.serviceInfo` 為 null。

**步驟**：
1. 開啟該群組（成員視角），側邊欄點擊「填寫帳號資訊」（`activePanel === 'fillInfo'`）
2. 輸入服務帳號 email 並送出

**預期結果**（`PATCH /members/:id`，`fillServiceInfo`）：
- `needsFillInfo` 條件（`sub` 存在 + `isPaymentRelevant`（非 `recruiting`/`full`）+ 尚未填寫 + 群組狀態為 `pending_confirmation`）觸發時，UI 應提示需要填寫
- 送出後 `member.serviceInfo.email` 被寫入，toast 顯示「帳號資訊已送出」
- 若填寫後全群組成員皆已完成，群組狀態自動推進為 `pending_activation`（見 [`core-flow-test-cases.md`](./core-flow-test-cases.md) TC-008）

---

### TC-105：確認服務正常

**前置條件**：demo1 為 G6（ChatGPT Team）成員，群組狀態 `confirming`，`myMember.confirmedAt` 為 null。

**步驟**：
1. 開啟該群組，點擊「確認服務」→ 確認對話框「確認服務正常」

**預期結果**（`POST /groups/:id/confirm`）：
- `myMember.confirmedAt` 被寫入
- 若為最後一位確認者（或全員已確認）：`released: true`，toast 顯示「確認完成，款項已撥付給團主！」，隨後觸發 `reviewPrompt` 提示留下評價
- 若仍有其他成員未確認：`released: false`，toast 顯示「已確認，等待其他成員確認中」，`myMember` 標記為已確認但群組狀態仍為 `confirming`
- 此操作一旦執行無法撤回（`ConfirmDialog` 訊息明確提示「此操作無法撤回」）

---

### TC-106：向平台申訴（含附件上傳）

**前置條件**：demo6 為 G7（ExpressVPN）成員，群組狀態 `confirming`（若 seed 資料已是 `disputed`，可另建一個 `confirming` 群組測試，或用 Prisma Studio 把狀態改回 `confirming` 並清空 `disputeDeadline`）。

**步驟**：
1. 在確認期 CTA 點擊「回報問題」，進入申訴表單
2. 至少勾選 1 項申訴原因（多選）
3. 選填補充說明
4. 選填上傳附件（圖片會顯示縮圖預覽，非圖片顯示檔案圖示；`uploadDisputeEvidence` 上傳失敗會 toast 錯誤，不會擋住表單其餘欄位）
5. 送出申訴

**預期結果**（`POST /groups/:id/dispute`）：
- 「送出申訴」按鈕在未勾選任何原因、或申訴/附件上傳進行中時停用
- 群組狀態變為 `disputed`，`disputeDeadline` 設為目前時間 +3 天
- 該成員的 `member.serviceInfoIssueNote` 寫入合併後的原因文字（多選原因以頓號合併 + 補充說明），若有附件則 `disputeEvidenceUrl` 一併寫入
- toast 顯示「申訴已送出，客服將在 3 天內裁定」，Modal 關閉
- 非 `confirming` 狀態的群組呼叫此 API 應回傳 400
- 非該群組成員呼叫應回傳 403「你不是此群組成員」

---

### TC-107：退出群組（招募期間）

**前置條件**：demo5 為某個 `recruiting` 或 `full` 狀態群組的成員（例如 seed 資料 G3 Spotify 的其中一位）。

**步驟**：
1. 開啟該群組，點擊「退出群組」並在確認對話框確認

**預期結果**（`DELETE /members/:id`，`isSelf`）：
- `canLeaveGroup` 僅在 `recruiting`/`full` 狀態顯示（`pending_confirmation` 之後名單鎖死，UI 不應顯示此按鈕）
- 成功後：`member`/`subscription` 記錄刪除，`group.currentMembers` -1，代管費用（`min(seatCost, escrowTokens)`）退還至 demo5 的 `tokenBalance`，寫入一筆 `type: 'refund'` 的 `tokenTransaction`
- 若群組原本是 `full`，退出後狀態退回 `recruiting`，名額釋出
- `application` 狀態標記為 `left`，`activeKey` 釋放，demo5 之後可重新申請同一群組
- 團主收到成員退出的通知

---

### TC-108：群組啟用後無法退出（異常路徑）

**前置條件**：demo1 為 G9（KKBOX，`active`）成員。

**步驟**：
1. 開啟該群組，檢查是否仍顯示「退出群組」按鈕

**預期結果**：
- UI 端 `canLeaveGroup` 為 false，不應顯示退出按鈕
- 若直接呼叫 `DELETE /members/:id`（API 測試），應回傳 400「群組啟用後無法變更成員名單」（`members.js` 第 136-138 行，僅 `recruiting`/`full` 允許）

---

### TC-109：確認服務後評價團主

**前置條件**：延續 TC-105，`released: true` 的情境。

**步驟**：
1. 確認服務完成後跳出的 `ReviewHostModal` 中，選擇星等並留言
2. 送出評價

**預期結果**（`POST /reviews`）：
- 同一群組同一人只能有一筆評價，重複送出視為更新（`upsert`，依 `groupId_authorId` unique）
- 不能評價自己的群組（若團主用同帳號嘗試會被擋，但一般 UI 流程中團主不會觸發此 Modal）
- 僅該群組成員（`member` 記錄存在）可評價，否則 403
- 送出後可在團主的整體評價頁（`GET /reviews/host/:hostId`）看到平均分數與筆數更新
