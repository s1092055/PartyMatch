# 未來規劃

依優先順序分成三個階段。目前的方向是先把**平台內部功能**做完善，正式上線所需的外部串接（金流、寄信等）排在之後，避免同時分心兩條主線。

## P0：內部功能補完（目前主線）

這些是使用者可以在平台上實際操作、但目前還沒做完整的功能：

- **通知偏好、安全驗證分頁**：帳號設定頁目前這兩個分頁還是 `comingSoon` 佔位畫面，尚未實作
- **帳號恢復流程**：目前帳號軟刪除（停用）只能停用、不能自助恢復，需要後台或資料庫手動處理；未來要補一個恢復入口
- **收款管理面板主動功能**：目前收款面板是唯讀檢視真實交易紀錄，未來可以加「提醒繳費」之類的主動操作
- **管理員後台**：申訴裁定核心流程已完整可用（`AdminTab.jsx` 可選擇 `disputed` 狀態群組、選裁定結果、填寫原因並呼叫 `adjudicateGroup`，含逾期提醒排序），不是空殼。待補的是更多管理維度：裁定歷史記錄查詢、使用者管理、群組強制下架等
- **互評系統**：已是完整可用功能，不是空白——`Review` model、後端 `GET /reviews/host/:hostId`（彙總平均分+清單）與 `POST /reviews`（防重複評自己、僅成員可評、upsert）、前端 `ReviewHostModal.jsx`／`HostReviews.jsx`／`useReviewStore.js`／`reviewsApi.js` 均已串接。待確認的是彈出評價 modal 的觸發時機是否精準卡在交易完成節點
- **信用分數動態調整**：目前 `creditScore` 只是靜態欄位，沒有加扣點的歷史紀錄。未來要規劃：
  1. 加扣點觸發規則（爽約、準時付款、被申訴等對應多少分數變化）
  2. 對應的紀錄資料表（類似 `TokenTransaction` 的 `CreditScoreLog`）
  3. 觸發時機（群組結束、爽約、申訴結案等）
  4. 前端串接既有的「查看紀錄」Modal（目前是空狀態佔位）

## P1：正式上線所需（production-readiness）

- **正式金流串接**：已安裝 Stripe SDK，尚未接上實際扣款邏輯，目前儲值/付款/代管撥款都是平台內模擬邏輯
- **忘記密碼寄信**：目前忘記密碼流程尚未接上真實寄信服務
- **服務目錄價格複核**：`serviceCatalog.js` 部分服務因官網無法自動擷取內容，標記 `priceVerified: false`，需要人工複核（見 [服務定價查核紀錄](../product/service-pricing-audit.md)）
- **正式第三方登入**（如 Google OAuth）

## P2：技術債與體驗優化

- **WebSocket 取代輪詢**：目前訊息、通知都是 polling（訊息 5 秒、通知 10 秒），改成 WebSocket 可以降低延遲與請求量
- **TypeScript 型別覆蓋**：目前是純 JS，補上型別可以提升重構安全性
- **自動化測試**：目前主要靠手動測試（見 [手動測試計畫](../testing/manual-test-plan.md)），未來可以補上關鍵流程的整合測試（例如接受申請的併發安全性、狀態機轉換）
- **逾期付款排程通知**：目前沒有自動偵測逾期並通知的排程機制
- **`billingCycle` 可在任何群組狀態被 PATCH，跟已代管金額脫鉤**：`PATCH /groups/:id` 目前沒有限制 `billingCycle` 只能在 `recruiting` 階段修改；`Application` 有 `escrowAmount` 快照避免這類問題，但 `Member` 沒有對應的每人代管金額快照，理論上鎖定後若改了計費週期，退款/續訂金額會跟實際代管金額對不上。目前前端沒有任何地方會送出這個欄位，是潛在風險而非已發生的問題
- **群組結束/取消後，對應 `Subscription` 沒有一併同步狀態**：`POST /groups/:id/cancel` 與一般 `PATCH /groups/:id { status: 'ended' }` 都只更新 `Group.status`，沒有把該群組所有成員的 `Subscription.status` 一併改成 `ended`，殘留 `pending`/`active` 的訂閱資料掛在已結束的群組下；目前前端都是用 `groupStatus` 判斷所以不影響顯示，但直接查 `Subscription.status` 的地方會拿到過期資料
- **`useGroupStore.create()` 樂觀插入與伺服器回覆之間有競態窗口**：建立群組後、伺服器回應尚未回來前，如果這段時間又呼叫了 `update(id, patch)`，伺服器回應落地時會直接整筆覆蓋掉、蓋掉中間那次更新的樂觀 patch，窗口很窄但邏輯上是個真實的競態問題
- **團主評價超過 50 則時，單一群組的「成員評價」分頁統計可能不準**：`GET /reviews/host/:hostId` 只回傳最新 50 筆（`server/src/routes/reviews.js`），`HostReviews.jsx` 的 `groupId` 篩選是在這份已經被截斷的清單上做前端 filter，不是後端直接查詢該群組的評價；團主評價量夠大、且較舊的評價集中在某個群組時，該群組分頁可能顯示評價數/平均分偏低，跟團主整體評價（後端用 `aggregate` 算、不受 50 筆限制）對不上。要根治需要新增一個 `GET /reviews/group/:groupId` 端點，目前尚未實作

## 排序原則

之後討論「下一步做什麼」時，優先從 P0 挑選方向；只有明確要準備上線時，才轉向 P1 的外部串接項目。P2 屬於錦上添花，通常在 P0/P1 有餘裕時才處理。
