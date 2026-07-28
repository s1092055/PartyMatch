# 續訂流程

## 使用者目標
團主在群組服務期滿（`active` 狀態）後，決定是要開始下一期收款讓群組繼續運作，還是結束服務讓群組收尾。

## 流程圖

```mermaid
flowchart TD
    A[群組 active，顯示續訂管理入口] --> B[RenewalModal：顯示帳單日倒數]
    B --> C{團主選擇}
    C -->|開始新一期收款| D[POST /groups/:id/renew]
    D --> E{全員餘額 ≥ seatCost}
    E -->|否| F[400 INSUFFICIENT_BALANCE + memberIds]
    E -->|是| G[$transaction：條件式扣款全體成員\n清空 serviceInfo，寫入 TokenTransaction(escrow)]
    G --> H[群組 → pending_confirmation\nnextBillingDate 往後推一期]
    H --> I[回到填寫帳號資訊流程]
    C -->|結束服務| J[PATCH /groups/:id → ended]
```

## 入口
- `HostGroupView` 側邊欄「續訂管理」按鈕（只有 `group.status === 'active'` 時才會顯示），開啟 `RenewalModal`
- 也可以透過即將續訂的通知，讓成員端提前知道要扣款了（成員本身沒辦法操作續訂，只有團主能發起）

## 相關檔案

**前端**

| 路徑 | 說明 |
|------|------|
| `src/features/manage-groups/components/RenewalModal.jsx` | 續訂管理 Modal，顯示帳單日倒數與兩個選項（開始新一期／結束服務） |
| `src/features/manage-groups/components/HostGroupView.jsx` | 側邊欄「續訂管理」入口 |
| `src/features/manage-groups/hooks/useHostActions.js` | `handleStartRenewal`、`handleEndGroup` |
| `src/shared/stores/useGroupStore.js` | `startRenewalCycle`、`endGroup` |
| `src/shared/stores/useMemberStore.js` | `clearGroupServiceInfos`，本地清空成員帳號資訊，呼應後端重置 |
| `src/shared/utils/date.js` | 計算下一期帳單日、倒數天數的日期工具 |

**後端**

| 路徑 | 說明 |
|------|------|
| `server/src/routes/groups.js` | `POST /groups/:id/renew` |
| `server/src/utils/pricing.js` | `computeSeatCost` |
| `server/src/routes/subscriptions.js` | `notifyUpcomingRenewals`，距下次扣款日 7 天內會提醒 |

**資料表 / Model**

| Model | 用途 |
|-------|------|
| `Group` | `status`、`nextBillingDate`、`billingCycle`、`escrowTokens` |
| `Member` | 續訂時 `serviceInfo`/`serviceInfoIssueNote`/`confirmedAt` 全部清空，需要重新走一次填寫帳號流程 |
| `TokenTransaction` | 續訂收款會批次寫入多筆代管紀錄 |

## 使用技術
- **用一個交易包住整段續訂邏輯**：條件式扣款全體成員 → 批次建交易紀錄 → 清空成員帳號資訊 → 更新群組狀態與下次帳單日，全部包在同一個交易裡
- **條件式扣款避免扣成負數**：只在餘額足夠時才真的扣款，避免扣款當下餘額被其他請求變動而扣成負數
- 前端算出的下一期帳單日跟逾期天數只是給 Modal 顯示參考，實際帳單日還是以後端回傳的為準

## 流程步驟

**1. 開啟續訂管理**
- 群組進入 `active` 狀態後，側邊欄會顯示「續訂管理」，點擊開啟 `RenewalModal`
- Modal 依帳單日算出「距帳單日還有 N 天」或「帳單日已過 N 天」，並列出兩個選項

**2. 開始新一期收款**
- 後端先查出所有成員的餘額，只要有人餘額不夠，就直接回錯誤（附上是哪些成員），不會進入交易
- 通過預檢後才真的扣款：用條件式更新嘗試扣全體成員，只要成功筆數跟成員數對不上（代表扣款當下餘額被其他請求變動），就整批回滾
- 扣款成功後批次寫入交易紀錄，清空所有成員的帳號資訊，群組狀態改回「等待填寫帳號資訊」，下次帳單日依繳費週期往後推一期，並重新設定 `serviceInfoDeadline`（此刻起 + 24h），跟第一次鎖定群組一樣會顯示倒數
- 前端收到回應後同步清空本地的成員帳號資訊，在聊天室發系統訊息提醒重新填寫，並通知每位成員

**3. 結束服務**
- 點擊後把群組狀態改成已結束，通知所有成員，並在聊天室發系統訊息告知團主已結束這個群組

**4. 回到填寫帳號資訊流程**
- 續訂後群組回到等待填寫帳號資訊的狀態，後續走的流程跟第一次鎖定群組完全一樣：成員重新填寫帳號 → 全員填完自動推進到可啟用狀態 → 團主再次啟用服務 → 進入新一輪 48 小時確認期

**5. 續訂前的提前提醒**
- 距下次帳單日 7 天內，成員讀取自己的訂閱資料時，後端會檢查這期是不是已經發過提醒，沒有的話就建立一則通知，提醒成員先確認 PM幣餘額夠不夠

## 驗證重點
- 只有團主本人能操作續訂，而且群組必須是 `active` 狀態，其他狀態一律回錯誤並附上目前實際狀態
- 續訂扣款的預檢跟正式扣款是兩個獨立步驟：預檢只是先讀一次餘額判斷哪些人不夠，正式扣款仍然會在資料庫層再做一次條件式核對，兩邊都通過才不會有扣一半的情況
- 提前提醒的通知會用「這期的帳單日」來判斷是否已經發過，避免同一期帳單被重複通知；團主一旦開了新的一期，帳單日變了，就會針對新的日期重新發送
- 結束服務底層用的是通用的群組狀態更新，仍然受合法轉換規則限制，`active` 只能轉到確認期、已結束或等待確認幾個狀態，避免前端誤傳不合法的狀態值
