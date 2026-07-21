# 核心主線測試案例

涵蓋：建立群組 → 申請加入（代管扣款） → 團主審核 → 額滿鎖定 → 填服務資訊 → 團主啟用 → 成員確認。對應程式碼：`server/src/routes/{groups,applications,members}.js`、`server/src/utils/membership.js`、`server/src/utils/pricing.js`。

測試帳號見 [`test-accounts.md`](./test-accounts.md)。建議用一組全新建立的群組（而非 seed 資料）跑完整主線，因為 seed 群組多半已卡在流程中間某個狀態。

---

### TC-001：團主建立群組成功

**前置條件**：以 demo4（張雅婷）登入，PM幣餘額 3000。

**步驟**：
1. 前往 `/create-group`
2. Step1 選擇服務（例如 Netflix）
3. Step2 選擇方案並選定收費週期（月繳）
4. Step3 設定名額（例如 2 人）、規則、信用分數門檻（可留 0）
5. Step4 確認資訊後送出

**預期結果**：
- 後端 `POST /groups` 成功，回傳 `status: 'recruiting'`、`currentMembers: 0`
- `maxMembers` 等於 Step3 設定的名額（2）
- 群組出現在探索頁招募中列表（`GET /groups?status=recruiting`）
- 團主（demo4）本人可在「我的群組」團主視角看到此群組

---

### TC-002：一般成員申請加入（餘額充足，代管扣款）

**前置條件**：延續 TC-001 建立的群組（席位費用假設為 X PM，可從群組詳情頁確認）；以 demo5（李冠宇）登入，確認目前PM幣餘額（帳號中心可查看，seed 完成後約 1700+）≥ X。

**步驟**：
1. 探索頁找到該群組，開啟群組詳情
2. 點擊申請加入，進入 `subPanel` 翻書畫面
3. 填寫申請留言（選填）並勾選同意規則與付款條件
4. 送出申請

**預期結果**：
- `POST /applications` 回傳 201，`status: 'pending'`
- **代管扣款發生在這一步，不是等團主核准**：demo5 的 `tokenBalance` 立即減少 X PM
- 群組 `escrowTokens` 增加 X PM
- 寫入一筆 `tokenTransaction`（`type: 'escrow'`，`amount: -X`）
- 團主（demo4）收到 `new_application` 通知
- demo5 收到 `application_sent` 通知
- demo5 無法對同一群組再送出第二筆進行中申請（`POST /applications` 應回傳 409「你已有一筆進行中的申請」，依 `activeKey` unique index 保護）

---

### TC-002b：申請人撤回申請（退款）

**前置條件**：延續 TC-002，demo5 有 1 筆 `pending` 申請，`tokenBalance` 已扣除 X PM。

**步驟**：
1. demo5 在群組詳情頁點擊「取消申請」

**預期結果**（`DELETE /applications/:id`）：
- 申請狀態變為 `withdrawn`，`activeKey` 清空
- demo5 的 `tokenBalance` 加回 X PM，回到扣款前的餘額
- 群組 `escrowTokens` 減少 X PM
- 寫入一筆 `tokenTransaction`（`type: 'refund'`）
- demo5 可對同一群組重新申請

---

### TC-003：PM幣餘額不足時申請被擋下（異常路徑）

**前置條件**：以 demo6（黃詩涵，seed 完成後餘額約 200～300，刻意維持低額）登入；找一個席位費用高於餘額的群組（例如 seed 資料中的 G6 ChatGPT Team，每人約 800 PM；或 G13 Cursor，每人約 2560 PM，或自建一個高單價群組）。

**步驟**：
1. 開啟該群組詳情
2. 點擊申請加入

**預期結果**：
- 前端／後端 `POST /applications` 回傳 400，`code: 'INSUFFICIENT_BALANCE'`，訊息包含所需金額與目前餘額（`server/src/routes/applications.js` 第 52-56 行）
- UI 應提示前往儲值（依 `docs/flows/apply-join-flow.md` 流程圖，餘額不足時 `toast「前往儲值」`）
- 不會建立任何 application 記錄

---

### TC-004：團主審核核准（不再重複扣款）

**前置條件**：延續 TC-002，demo4 為團主，demo5 有 1 筆 `pending` 申請（已在申請時扣款 X PM 進代管），席位費用 X PM。

**步驟**：
1. demo4 登入，開啟「我的群組」團主視角 → 該群組 → 申請管理
2. 找到 demo5 的申請，點擊「核准」

**預期結果**（`applications.js` PATCH `/:id`，呼叫 `finalizeApprovedApplication`）：
- 申請狀態條件式更新為 `approved`（僅 `pending` 才能轉換，防止重複核准）
- 建立 `member` 與 `subscription` 記錄（`status: 'pending'`）
- 群組 `currentMembers` +1
- **demo5 的 `tokenBalance` 與群組 `escrowTokens` 都不再變動**（代管扣款已在 TC-002 申請時完成），也不會多寫一筆 `tokenTransaction`
- 若核准後 `currentMembers >= maxMembers`，群組狀態自動推進為 `full`；否則維持 `recruiting`
- demo5 收到 `application_approved` 通知

---

### TC-004b：團主審核拒絕（代管退款）

**前置條件**：另建一筆 `pending` 申請（例如 demo3 對同一群組或另一群組送出申請），已在申請時扣款 Y PM 進代管。

**步驟**：
1. demo4 開啟申請管理，找到該筆申請，點擊「拒絕」

**預期結果**（`applications.js` PATCH `/:id`，非 approved 分支）：
- 申請狀態條件式更新為 `rejected`（僅 `pending` 才處理，避免重複退款）
- 申請人的 `tokenBalance` 加回 Y PM
- 群組 `escrowTokens` 減少 Y PM
- 寫入一筆 `tokenTransaction`（`type: 'refund'`）
- 申請人收到 `application_rejected` 通知，並可重新申請同一群組

---

### TC-005：最後一位核准後群組自動推進為 full

**前置條件**：延續 TC-004 情境，群組名額為 2，目前 `currentMembers: 1`；另一位成員（demo3）也已送出 `pending` 申請。

**步驟**：
1. demo4 核准 demo3 的申請

**預期結果**：
- `currentMembers` 變為 2（等於 `maxMembers`）
- 群組狀態自動由 `recruiting` 變為 `full`（`finalizeApprovedApplication` 最後一段邏輯）
- 群組詳情頁團主視角出現「招募完成，請點擊鎖定群組」banner 與「鎖定群組」CTA（`HostGroupView.jsx` 的 `lockGroupBanner`/`lockGroupCta`，僅在 `status === 'full'` 顯示）
- `recruiting` 狀態時可用的「申請管理」分頁改為顯示「收款管理」分頁（`isRecruiting` 判斷已為 false）

---

### TC-006：名額已滿時無法再申請（異常路徑）

**前置條件**：延續 TC-005，群組狀態已為 `full`。

**步驟**：
1. 用另一個帳號（例如 demo1）嘗試對此群組送出申請

**預期結果**：
- `POST /applications` 回傳 400「此群組目前不開放申請」（`group.status !== 'recruiting'` 檢查，`applications.js` 第 49 行）
- 探索頁一般只顯示 `status=recruiting` 的群組，`full` 狀態群組理論上不會出現在預設探索列表中（除非直接帶群組連結）

---

### TC-007：團主鎖定群組（full → pending_confirmation）

**前置條件**：延續 TC-005，群組狀態為 `full`。

**步驟**：
1. demo4 在群組詳情點擊「鎖定群組」並在確認對話框點「確認鎖定」

**預期結果**（`POST /groups/:id/lock`）：
- 群組狀態變為 `pending_confirmation`
- 所有成員的 `subscription.nextBillingDate` 被設定為「今天起算一個計費週期」（月繳 +1 個月，年繳 +1 年）
- 系統自動建立群組聊天室（`POST /conversations/group`，成員 = 團主 + 所有 member）
- 所有成員收到「群組聊天室已開啟」通知，並可開始填寫服務帳號資訊
- 群組 `serviceInfoDeadline` 被設定為「鎖定時間 + 24h」
- 團主與成員兩側的群組詳情頁都會出現倒數橫幅（剩餘時間每秒更新，格式 `HH:MM:SS`），24h 過後橫幅顯示「已逾期」，但不會有任何自動處理
- 成員名單自此鎖死：`DELETE /members/:id` 應回傳 400「群組啟用後無法變更成員名單」（僅 `recruiting`/`full` 可變動名單）

---

### TC-008：成員填寫服務帳號資訊

**前置條件**：延續 TC-007，群組 `pending_confirmation`，成員 demo5、demo3 皆尚未填寫。

**步驟**：
1. demo5 在「我的群組」成員視角開啟該群組，填寫服務帳號資訊（例如 email）並送出

**預期結果**（`PATCH /members/:id`，`serviceInfo` 更新）：
- demo5 的 `member.serviceInfo` 被寫入
- 因為 demo3 尚未填寫，`allFilled` 為 false，群組狀態維持 `pending_confirmation`

**後續步驟**：
2. demo3 也完成填寫

**預期結果**：
- 全員 `serviceInfo` 皆非 null，群組狀態自動推進為 `pending_activation`（`members.js` 第 104-116 行）
- 團主收到「全員已完成填寫」通知，看到「啟用服務」CTA

---

### TC-008b：填寫服務帳號資訊表單依 sharingMethod 動態顯示欄位

**前置條件**：seed 資料已包含 3 個涵蓋不同 `sharingMethod` 的 `pending_confirmation` 群組（見 [`test-accounts.md`](./test-accounts.md)）：G14（Apple Music，`apple_family`）、G15（Google One，`google_family`）、G16（friDay影音，`invite_code`）。另可用 G4（Disney+，`shared_credentials`）、G9（KKBOX，`email_invite_with_address`）對照一般 `email_invite` 服務（例如 G1 Netflix）。

**步驟與預期結果**（`src/shared/utils/serviceInfoFields.js`）：
1. demo2 開啟 G14（Apple Music），點「填寫帳號」→ 表單只有一個「Apple ID」欄位（type=email），上方顯示家庭共享提醒文案（一年僅能異動一次成員、會共用購買紀錄）
2. demo3 開啟 G15（Google One）→ 表單只有一個「Google 帳戶 Email」欄位，提醒文案為 Google 家庭群組版本
3. demo5 開啟 G16（friDay影音）→ 表單只有一個「邀請碼」欄位（非 email），提醒文案說明要先在 friDay App 內產生邀請碼、綁定方向與其他服務相反
4. 開啟 G9（KKBOX，已全員填完）的團主收款/成員名單畫面 → 顯示的摘要應同時包含 email 與地址兩個值（`getServiceInfoSummary` 用全形空格分隔多欄位）
5. 開啟 G4（Disney+）→ 表單只有一個確認勾選框「我已透過群組聊天室取得帳號密碼」，勾選後才能送出，提醒文案說明官方無多人邀請機制的風險
6. 上述任一表單填寫送出後，`hasFilledServiceInfo` 判斷應正確依該服務的欄位組合認定「已填寫」，不會因為欄位不是 `email` 而誤判成尚未填寫（可在聊天室的 `fill_service_info` 訊息卡片、`ActivateServiceModal` 成員清單同步確認顯示狀態一致）

---

### TC-009：團主啟用服務（confirming 開始 48h 確認期）

**前置條件**：延續 TC-008，群組狀態為 `pending_activation`。

**步驟**：
1. demo4 點擊「啟用服務」，在 `ActivateServiceModal` 勾選所有成員確認後最終確認

**預期結果**（`POST /groups/:id/activate`）：
- 群組狀態變為 `confirming`
- `confirmDeadline` 設為目前時間 +48 小時
- 所有成員收到 `group_activated` 通知
- 成員視角出現「確認服務」CTA（`canConfirm = group.status === 'confirming' && !myMember.confirmedAt`）
- 團主與成員兩側的群組詳情頁都會出現「確認期進行中，剩餘 HH:MM:SS」倒數橫幅，讀 `group.confirmDeadline`

---

### TC-010：成員主動確認服務正常（立即撥款）

**前置條件**：延續 TC-009，群組僅 1 位成員尚未確認（其餘已確認，或群組僅 1 位成員）。

**步驟**：
1. demo5 點擊「確認服務」→ 確認對話框點「確認服務正常」

**預期結果**（`POST /groups/:id/confirm`）：
- demo5 的 `member.confirmedAt` 被寫入目前時間
- 若確認後全員皆已確認（或已過 `confirmDeadline`）：群組狀態變為 `active`，`confirmDeadline` 清空，`escrowTokens` 全數撥入團主 `tokenBalance`，寫入一筆 `type: 'release'` 的 `tokenTransaction`，所有 `subscription.status` 更新為 `active`
- 若尚有其他成員未確認：回傳 `{ group: null, released: false }`，群組狀態維持 `confirming`

---

### TC-011：確認期逾期未操作，自動撥款（惰性求值）

**前置條件**：群組處於 `confirming`，`confirmDeadline` 已過期（可用 Prisma Studio 手動把某群組的 `confirmDeadline` 改為過去時間來加速測試，無需真的等 48 小時）。

**步驟**：
1. 任一使用者觸發 `GET /groups/:id`（例如重新整理群組詳情頁）

**預期結果**（`groups.js` GET `/:id` 第 94-107 行，惰性撥款）：
- 偵測到 `confirming` 且 `confirmDeadline <= now`，自動在 transaction 內把群組狀態改為 `active`，`escrowTokens` 撥給團主並歸零，所有 `subscription` 改為 `active`
- 回傳的群組物件已是更新後的 `active` 狀態（不需額外重新整理）
- 此邏輯以 `status` 重查保持冪等，多次觸發不會重複撥款

---

## 補充：年繳計費路徑

seed 資料中的 G1（Netflix，`billingCycle: 'yearly'`）可用來驗證 `computeSeatCost`：年繳群組的席位費用 = `monthlyFee * 12`（四捨五入），而非月繳的 `monthlyFee`。核准申請、退款、續訂等所有涉及金額計算的動作都應套用此公式（`server/src/utils/pricing.js`）。
