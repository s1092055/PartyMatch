# 團主視角測試案例

涵蓋：建立群組、審核申請（接受/拒絕）、移除成員、鎖定群組、啟用服務、續訂、結束群組、收款管理面板。對應程式碼：`src/features/my-groups/host/components/HostGroupView.jsx`、`server/src/routes/{groups,applications,members}.js`。

測試帳號見 [`test-accounts.md`](./test-accounts.md)。

---

### TC-201：建立群組（4 步驟）

**前置條件**：demo4 登入，PM幣餘額不影響建立群組（建立不需付款）。

**步驟**：
1. `/create-group` Step1 選服務
2. Step2 選方案並選定收費週期（月繳或年繳，兩者為獨立方案卡片）
3. Step3 設定名額（2-10 人，`totalSeats` 由 zod schema 限制範圍）、規則、加入條件（信用分數/群齡門檻）
4. Step4 確認畫面（桌機有即時預覽）送出

**預期結果**：
- `POST /groups` 成功建立，`status: 'recruiting'`，`hostId` 為 demo4
- 名額超出 2-10 範圍應被 zod 擋下（若透過 API 直接測試邊界值）
- 建立完成後導向成功畫面，可在團主視角「我的群組」看到新群組

---

### TC-202：審核申請 — 接受

**前置條件**：demo4 為某群組團主，有 1 筆 `pending` 申請（例如 seed 資料 G2 Notion 若尚有待審申請，或用 TC-201 建立的新群組先請他人送出申請）。

**步驟**：
1. 開啟群組詳情（團主視角），側邊欄「申請管理」（僅 `recruiting`/`full` 狀態顯示此分頁）
2. 查看申請者的信用分數與留言
3. 點擊「接受」

**預期結果**：見 [`core-flow-test-cases.md`](./core-flow-test-cases.md) TC-004（同一段後端邏輯）。UI 上接受後該筆申請從待審清單移除，側邊欄「申請管理」badge 數字（`pendingApps.length`）減少。

---

### TC-203：審核申請 — 拒絕

**前置條件**：同 TC-202，另有 1 筆 `pending` 申請。

**步驟**：
1. 在申請管理點擊「拒絕」

**預期結果**（`PATCH /applications/:id`，`status: 'rejected'`）：
- 申請狀態變為 `rejected`，`activeKey` 清空
- 代管退款：申請人 `tokenBalance` 加回席位費用，群組 `escrowTokens` 減少同額，寫入一筆 `tokenTransaction`（`type: 'refund'`）——因為代管扣款已在申請當下完成，見 [`core-flow-test-cases.md`](./core-flow-test-cases.md) TC-004b
- 申請人收到 `application_rejected` 通知
- 申請人可對同一群組重新申請（`applications.js` 白名單包含 `rejected`）
- 拒絕後的申請紀錄可在「申請管理」的「審核紀錄」第三層 panel 中查看（只列已接受/已拒絕，已退出/已移除不算審核結果，不會出現在這裡）

---

### TC-204：重複接受同一筆申請被擋下（併發安全，異常路徑）

**前置條件**：一筆 `pending` 申請。

**步驟**：
1. 快速連續點擊「接受」兩次（或用 API 工具同時發送兩個 `PATCH .../approved` 請求）

**預期結果**（`applications.js` 第 122-131 行）：
- 條件式 `updateMany`（`where: { status: 'pending' }`）確保只有第一個請求成功
- 第二個請求應收到 409「此申請已被處理，請重新整理頁面」
- 不會造成同一位申請人被扣款兩次或建立重複的 member/subscription

---

### TC-205：移除成員（招募期間）

**前置條件**：demo4 主揪 G2（Notion，`recruiting`），demo5 已是接受成員。

**步驟**：
1. 開啟群組詳情 → 群組名單 → 點擊 demo5 旁的移除圖示
2. 確認對話框需倒數 5 秒才可點擊「移除」（`CountdownConfirmDialog`）

**預期結果**（`DELETE /members/:id`，`isHost`）：
- 代管費用（`min(seatCost, escrowTokens)`）退還給 demo5
- `currentMembers` -1，若原本是 `full` 則退回 `recruiting`
- `application` 狀態標記為 `removed`，`activeKey` 釋放，demo5 之後可重新申請
- demo5 收到 `member_removed` 通知，並立即失去聊天室存取權限
- 寫入一筆 `note: '被團主移除，代管退款'` 的 `tokenTransaction`

---

### TC-206：群組啟用後無法移除成員（異常路徑）

**前置條件**：demo7 主揪 G8（Google One，`active`）。

**步驟**：
1. 開啟群組名單，檢查移除按鈕是否仍可操作

**預期結果**：
- `pending_confirmation` 之後成員名單鎖死，UI 不應顯示移除入口，或呼叫 API 應回傳 400「群組啟用後無法變更成員名單」

---

### TC-207：鎖定群組

**前置條件**：延續某個已額滿（`full`）的群組（例如 seed G3 Spotify，或自行走完 TC-201～204 湊滿名額）。

**步驟**：
1. 開啟群組詳情，點擊「鎖定群組」→ 確認鎖定

**預期結果**：見 [`core-flow-test-cases.md`](./core-flow-test-cases.md) TC-007。UI 上原本「申請管理」分頁改為「收款管理」+「續訂管理」（僅 `active` 顯示）+「群組訊息」。

---

### TC-208：啟用服務

**前置條件**：群組狀態 `pending_activation`（例如 seed G5 HBO Max）。

**步驟**：
1. 開啟群組詳情，出現「所有成員已完成填寫服務帳號，可以啟用服務了」banner（代管費用早在申請被接受當下就已扣款完成，這個階段不是在等付款，文案已修正避免誤導）
2. 點擊「啟用服務」，在 `ActivateServiceModal` 逐一勾選確認每位成員的服務帳號資訊，最後勾選最終確認
3. 送出

**預期結果**：見 [`core-flow-test-cases.md`](./core-flow-test-cases.md) TC-009。`allMembersChecked` 為 true 才能送出最終確認（所有成員 checkbox 皆勾選）。

---

### TC-209：回報成員服務帳號問題

**前置條件**：群組 `pending_activation`，`ActivateServiceModal` 開啟中。

**步驟**：
1. 在某位成員項目點擊「回報問題」，開啟 `ReportServiceIssueModal`
2. 輸入問題說明並送出

**預期結果**：
- `member.serviceInfoIssueNote` 被寫入
- 該成員的 `hasServiceInfo` 判斷式（`MemberGroupView.jsx` 第 64-65 行）因 `hasServiceInfoIssue` 為 true 而視為未完成，需重新填寫
- 成員視角應能看到此問題說明並重新提交

---

### TC-210：開始新一期收款（續訂）

**前置條件**：demo7 主揪 G8（Google One，`active`），3 位成員PM幣餘額皆充足。

**步驟**：
1. 側邊欄點擊「續訂管理」
2. 確認開始新一期

**預期結果**（`POST /groups/:id/renew`）：
- 向每位成員收取本期代管費用（條件式 `updateMany` with `tokenBalance: { gte: seatCost }`，避免扣成負數）
- 若有成員餘額不足，回傳 400，`code: 'INSUFFICIENT_BALANCE'`，附上不足的 `memberIds`，**整批不執行**（不會部分成員扣款、部分不扣）
- 成功後：所有成員 `serviceInfo`/`serviceInfoIssueNote`/`confirmedAt` 清空，需重新填寫
- 群組狀態回到 `pending_confirmation`，`nextBillingDate` 往後推一個計費週期，`escrowTokens` 增加 `seatCost * 人數`
- 僅 `active` 狀態可續訂，其他狀態呼叫應回傳 400

---

### TC-211：結束群組

**前置條件**：demo7 主揪某個 `active` 群組（例如 G8 Google One）。

**步驟**：
1. 側邊欄或群組操作選單選擇「結束服務」（`PATCH /groups/:id`，`status: 'ended'`）

**預期結果**：
- `ALLOWED_TRANSITIONS.active` 包含 `ended`，允許此轉換
- 群組狀態變為 `ended`，出現在「群組紀錄」而非一般分頁列表中
- `ended` 是終態，`ALLOWED_TRANSITIONS.ended` 為空陣列，之後不可再轉換

---

### TC-212：解散群組（鎖定前）

**前置條件**：demo6 主揪 G12（Canva，`recruiting`，目前無成員）；或另建一個有成員的 `recruiting`/`full` 群組。

**步驟**：
1. 開啟群組詳情，側邊欄右下角固定顯示「解散群組」（`recruiting`/`full` 時跟鎖定後的「群組訊息」互斥，共用同一個位置），點擊並在倒數確認對話框確認

**預期結果**（`POST /groups/:id/cancel`）：
- 僅 `recruiting`/`full` 可解散，`pending_confirmation` 之後應回傳 400「群組已鎖定，無法解散」
- 群組狀態變為 `cancelled`，`escrowTokens` 歸零
- 所有成員的代管費用（`seatCost`，非 `min` 退款上限，因尚未進入收款鎖定期）全額退還至各自 `tokenBalance`，各寫入一筆 `type: 'refund'` 的 `tokenTransaction`
- 所有成員收到 `group_ended` 通知

---

### TC-213：收款管理面板

**前置條件**：demo7 主揪的任一群組（不限招募中或鎖定後，「收款管理」分頁只在 `cancelled` 已解散時不顯示）。

**步驟**：
1. 側邊欄點擊「收款管理」

**預期結果**（`GET /groups/:id/transactions`）：
- 僅團主本人可查看（403 若非本人）
- 面板不會列出完整交易歷史，只依每位成員最新一筆 `escrow` 交易顯示「目前」代管狀態（撤回重新申請等留下的舊代管/退款紀錄不在這裡處理）
- 頂部彙總卡：`group.escrowTokens > 0` 時顯示「目前費用由平台代管中，尚未撥款」；已撥款給團主的 `release` 型交易加總 > 0 時顯示「已撥款給你的代管總額」
- 每一列附上成員頭像、姓名、最新一筆代管金額（`Math.abs`，交易在 DB 裡存負值），沒有代管紀錄的成員顯示「尚無代管紀錄」；顯示的「代管入帳」時間是 `Member.joinedAt`（團主按下「接受」的那一刻），不是 `TokenTransaction.createdAt`（實際扣款發生在申請送出當下，比接受時間早）

---

### TC-214：刪除尚無成員的招募中群組

**前置條件**：demo4 建立一個全新群組，尚無任何成員加入（`currentMembers: 0`，`status: 'recruiting'`）。

**步驟**：
1. 呼叫刪除群組操作（`DELETE /groups/:id`，若 UI 未提供入口可用 API 直接測試）

**預期結果**：
- 僅 `recruiting` 且 `currentMembers === 0` 的群組可被硬刪除（`groups.js` 第 526-528 行）
- 已有成員加入或已鎖定的群組呼叫應回傳 400，提示改用解散群組功能

---

### TC-215：平台管理員裁定申訴

**前置條件**：以 `demo-admin@partymatch.test` 登入（seed 資料唯一 `isAdmin: true` 的帳號）；G7（ExpressVPN）處於 `disputed`，demo6 是申訴成員。

**步驟**：
1. 前往帳號中心「管理員」分頁（`AccountPage` → `AdminTab`，一般帳號應看不到這個分頁）
2. 若 `disputeDeadline` 已過期，G7 應排在清單最前面並標示「已逾期」
3. 選擇 G7，裁定結果選「成員獲勝」，填寫裁定說明後送出

**預期結果**（`POST /groups/:id/adjudicate`，`requireAdmin` 保護）：
- 非 `isAdmin` 帳號呼叫應回傳 403
- 群組狀態改為 `active`，`disputeDeadline` 清空
- demo6 的 `tokenBalance` 加回其席位費用，`escrowTokens` 對應扣除，寫入 `type: 'refund'` 的 `tokenTransaction`
- demo6 的 `Member` 記錄被刪除、`Subscription` 設為 `cancelled`，其餘成員的代管與訂閱不受影響
- 前端整包重新 `init` 群組/成員/訂閱 store，不依賴樂觀更新
- 逾期案件本身不會自動裁定，只有管理員實際送出裁定才會處理代管金額（見 [申訴流程](../flows/dispute-flow.md)）
