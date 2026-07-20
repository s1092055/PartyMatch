# 專案亮點

面試或作品集介紹時，挑 2-3 個深入講就好，不用全部平鋪。

## 1. 交易安全性：Prisma transaction + 條件式 updateMany

核准申請時，餘額檢查、名額更新、成員/訂閱建立、PM幣扣款全部包在同一個 Prisma `$transaction` 裡。名額檢查跟申請狀態變更都用條件式 `updateMany`（例如要 `status: 'recruiting'` 且 `currentMembers < maxMembers` 才准寫入，要 `status: 'pending'` 才能轉成 `approved`），不是先讀一次再寫。

原因很直接：先讀後寫在併發下會出包——兩個人搶最後一個名額、或同一筆申請被雙擊兩次，都可能超額或重複扣款。條件式 `updateMany` 把檢查跟寫入合成一個原子操作，靠資料庫本身的原子性擋掉這個問題。

可以延伸講的：為什麼不用 `SELECT ... FOR UPDATE`？MySQL + Prisma 的條件式 `updateMany` 就夠用了，不用額外管鎖的生命週期。也不是每個檢查都要包成 updateMany，只有真的會被併發打到的兩個關卡才需要，其他地方硬套反而更複雜。

## 2. 事件驅動的全域 Modal

訊息、通知、儲值這類全域 Modal 不走 React props 一層層傳，而是用 `window.dispatchEvent(new CustomEvent('pm:open-xxx'))` 觸發，在 `AppLayout` 統一監聽開啟。

任何頁面的任何按鈕都可能要開同一個 Modal（例如 PM幣不足時跳儲值），props 硬傳的話狀態要一路拉到接近根節點，中間所有元件都得跟著傳。另外 React Router 的 `location.state` 同一頁面重複觸發時不會變化，不會重新觸發，用 window event 直接繞過這個限制。

缺點也要知道：事件名稱是字串，沒有型別檢查，多個監聽者疊加時要小心重複觸發。所以只用在真的跨頁面/跨元件樹的全域互動，同一棵元件樹裡的狀態還是走一般 props/context。

## 3. 多裝置登入 session（Redis）

refreshToken 不放 MySQL，改存 Redis，key 是 `refresh:{userId}:{sessionId}`，`sessionId` 登入時產生、內含在 JWT payload 裡。同一帳號在多台裝置登入各自有獨立 session，登出或 refresh 只影響那一台裝置，不會把別台踢掉。

舊版沒有 sessionId，所有裝置共用同一把 token，任何一台登出或 refresh 都會讓其他裝置一起失效。改成 per-session key 後，帳號停用時可以用 `SCAN` 找出這個使用者所有 session 一次清掉；沒有 sessionId 的舊格式 token 仍相容查詢，refresh 一次會自動升級。

用 `SCAN` 不用 `KEYS` 是因為 `KEYS` 會阻塞式掃整個 keyspace，卡住整個 Redis；`SCAN` 是非阻塞游標式迭代。舊格式相容邏輯不用特別清，refresh token 本身 7 天過期，舊 key 自然會消失。

## 4. 群組狀態機

群組狀態走 `recruiting → full → pending_confirmation → pending_activation → confirming → {active | disputed} → active`，另外有 `paused`/`cancelled`/`ended` 分支。每個轉換都由後端特定 route 驅動，前端不做本地假設。

這個狀態機是整個系統複雜度的核心——申請、審核、鎖定、填帳號、確認、啟用、續訂、結束，每一步都牽動 PM幣代管跟多方權限。狀態機定義在 schema 層（`GroupStatus` enum），前端關鍵操作後一律重新拉真實狀態，不本地推算，避免前後端狀態對不上。

最容易出錯的轉換是 `confirming → disputed` 的申訴分支，牽涉雙方各自的截止時間跟裁定邏輯。目前規模用 enum + route 層級檢查就夠，沒上 XState 這類 state machine library——轉換規則真的更複雜，或需要視覺化除錯時，那類工具的價值才會明顯。

## 5. 大型元件重構

把幾個 600 行以上的大型元件（`AppNav.jsx`、`HostGroupView.jsx`）拆成 orchestrator + 子元件/hook 的結構。

單一元件同時處理版面、業務邏輯、各種裝置的 RWD 分支，改任何一小塊都要重新讀懂整份檔案。拆開後每個子元件職責單一，orchestrator 只負責組裝跟傳資料。

判斷該不該拆不是看行數，是看有沒有清楚的職責邊界——像「桌機 sidebar」跟「手機 dock」根本是兩套完全不同的 UI，拆開後各自才看得懂。拆完要避免 props drilling，狀態留在 orchestrator，子元件盡量做成 presentational，真的要跨元件共用的邏輯才抽成 hook。

## 6. shared/ui 依用途分類

`shared/ui/` 分成 `primitives/`（不帶業務邏輯的通用元件，Button、Modal、Badge 這類）、`group/`（群組詳情 Modal 家族，團主跟成員視角共用）、其餘留在最外層（會用到業務概念但不專屬某個 Modal 家族的，例如 ServiceLogo、TokenAmount）。

分類邊界看元件本身知不知道「群組」「PM幣」這些業務概念——不知道的算 primitive；知道但又不專屬某個 Modal 家族的，留在最外層，不硬塞進去湊乾淨。
