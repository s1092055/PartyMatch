# 專案亮點

面試或作品集介紹時，挑 2-3 個深入講就好，不用全部平鋪。

## 1. 交易安全性：Prisma transaction + 條件式 updateMany

代管扣款發生在使用者「送出申請」的當下（不是等團主接受才扣），餘額檢查、扣款、寫入交易紀錄一樣包在 Prisma `$transaction` 裡；接受時只需要建立成員/訂閱、更新名額，不用再扣一次錢。名額檢查跟申請狀態變更都用條件式 `updateMany`（例如要 `status: 'recruiting'` 且 `currentMembers < maxMembers` 才准寫入，要 `status: 'pending'` 才能轉成 `approved`/`rejected`），不是先讀一次再寫。

原因很直接：先讀後寫在併發下會出包——兩個人搶最後一個名額、或同一筆申請被雙擊兩次，都可能超額或重複扣款。條件式 `updateMany` 把檢查跟寫入合成一個原子操作，靠資料庫本身的原子性擋掉這個問題。

可以延伸講的：為什麼不用 `SELECT ... FOR UPDATE`？MySQL + Prisma 的條件式 `updateMany` 就夠用了，不用額外管鎖的生命週期。也不是每個檢查都要包成 updateMany，只有真的會被併發打到的兩個關卡才需要，其他地方硬套反而更複雜。

## 2. 事件驅動的全域 Modal

訊息、通知、儲值這類全域 Modal 不走 React props 一層層傳，而是用 `window.dispatchEvent(new CustomEvent('pm:open-xxx'))` 觸發，在 `AppLayout` 統一監聽開啟。

任何頁面的任何按鈕都可能要開同一個 Modal（例如 PM幣不足時跳儲值），props 硬傳的話狀態要一路拉到接近根節點，中間所有元件都得跟著傳。另外 React Router 的 `location.state` 同一頁面重複觸發時不會變化，不會重新觸發，用 window event 直接繞過這個限制。

缺點也要知道：事件名稱是字串，沒有型別檢查，多個監聽者疊加時要小心重複觸發。所以只用在真的跨頁面/跨元件樹的全域互動，同一棵元件樹裡的狀態還是走一般 props/context。

## 3. 多裝置登入 session（Redis）

refreshToken 不放 MySQL，改存 Redis，key 是 `refresh:{userId}:{sessionId}`，`sessionId` 登入時產生、內含在 JWT payload 裡。同一帳號在多台裝置登入各自有獨立 session，登出或 refresh 只影響那一台裝置，不會把別台踢掉；帳號停用時可以用 `SCAN` 找出這個使用者所有 session 一次清掉。

用 `SCAN` 不用 `KEYS` 是因為 `KEYS` 會阻塞式掃整個 keyspace，卡住整個 Redis；`SCAN` 是非阻塞游標式迭代。

## 4. 群組狀態機

群組狀態走 `recruiting → full → pending_confirmation → pending_activation → confirming → {active | disputed} → active`，另外有 `cancelled`/`ended` 分支。每個轉換都由後端特定 route 驅動，前端不做本地假設。

這個狀態機是整個系統複雜度的核心——申請、審核、鎖定、填帳號、確認、啟用、續訂、結束，每一步都牽動 PM幣代管跟多方權限。狀態機定義在 schema 層（`GroupStatus` enum），前端關鍵操作後一律重新拉真實狀態，不本地推算，避免前後端狀態對不上。

最容易出錯的轉換是 `confirming → disputed` 的申訴分支，牽涉雙方各自的截止時間跟裁定邏輯。目前規模用 enum + route 層級檢查就夠，沒上 XState 這類 state machine library——轉換規則真的更複雜，或需要視覺化除錯時，那類工具的價值才會明顯。

## 5. 大型元件重構

把幾個 600 行以上的大型元件（`AppNav.jsx`、`HostGroupView.jsx`）拆成 orchestrator + 子元件/hook 的結構。

單一元件同時處理版面、業務邏輯、各種裝置的 RWD 分支，改任何一小塊都要重新讀懂整份檔案。拆開後每個子元件職責單一，orchestrator 只負責組裝跟傳資料。

判斷該不該拆不是看行數，是看有沒有清楚的職責邊界——像「桌機 sidebar」跟「手機 dock」根本是兩套完全不同的 UI，拆開後各自才看得懂。拆完要避免 props drilling，狀態留在 orchestrator，子元件盡量做成 presentational，真的要跨元件共用的邏輯才抽成 hook。

## 6. 為什麼用 Polling 不是 WebSocket

訊息中心（5 秒）、通知（10 秒）都是前端定時打 REST API，不是 WebSocket 即時推送。

這不是「還沒做」，是評估過現階段成本效益後的選擇：WebSocket 要多維護一條持久連線的生命週期（心跳、斷線偵測、重連），身分驗證要另外設計一套（不能直接沿用 `axiosClient` 的 token/refresh 機制），而且一旦後端未來水平擴展成多實例，兩個使用者的連線可能落在不同機器上，得再加一層 pub/sub（例如用現有的 Redis 做 `PUBLISH`/`SUBSCRIBE`）才能互通訊息。polling 完全沒有這些問題——每次都是一個獨立、無狀態的 HTTP request，跟其他 REST 呼叫共用同一套驗證跟錯誤處理，天生就跟現有架構相容。

延遲也是關鍵考量：這是群組合購媒合的聊天室，不是股票報價或多人協作編輯，5-10 秒的延遲對使用體驗影響很小，用複雜度換這點延遲不划算。真的該考慮換成 WebSocket 的時機點是：使用者規模大到 polling 請求量本身變成後端負擔（每個在線使用者固定頻率打 API，人數一多會線性堆疊出大量無效請求），或情境變成真的需要低延遲（例如客服即時對話）——這兩個條件目前都還沒發生。

三處輪詢（訊息列表、單一對話訊息、通知）共用同一個 `poller.js` 的 `startPolling(pollOnce, intervalMs)` helper，內部把 `isActive()` 傳給 callback，讓輪詢邏輯自己判斷「這次拿到的結果現在還要不要寫回畫面」——避免使用者中途登出，前一次還沒回來的請求把過期資料寫進已經清空的畫面。

## 7. shared/ui 依用途分類

`shared/ui/` 分成 `primitives/`（不帶業務邏輯的通用元件，Button、Modal、Badge 這類）、`group/`（群組詳情 Modal 家族，團主跟成員視角共用）、其餘留在最外層（會用到業務概念但不專屬某個 Modal 家族的，例如 ServiceLogo、TokenAmount）。

分類邊界看元件本身知不知道「群組」「PM幣」這些業務概念——不知道的算 primitive；知道但又不專屬某個 Modal 家族的，留在最外層，不硬塞進去湊乾淨。
