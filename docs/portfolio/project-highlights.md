# 專案亮點

面試或作品集介紹時，可以挑其中 2-3 個深入展開，而不是全部平鋪講一遍。每個亮點都附上「為什麼這樣做」跟「可以追問的技術細節」，方便被問到時延伸。

## 1. 交易安全性：Prisma transaction + 條件式 updateMany

**是什麼**：核准申請時，餘額檢查、名額更新、成員/訂閱建立、PM幣扣款全部包在單一 Prisma `$transaction` 內執行。名額檢查與申請狀態變更都採條件式 `updateMany`（例如 `status: 'recruiting'` + `currentMembers < maxMembers` 才允許寫入，`status: 'pending'` 才能轉 `approved`）而不是先讀後寫。

**為什麼這樣做**：先讀後寫在併發情境下有 race condition——兩個人同時申請最後一個名額、或同一筆申請被雙擊兩次，都可能導致超額或重複扣款。條件式 `updateMany` 把「檢查」跟「寫入」合成一個原子操作，靠資料庫層級的原子性避免這個問題。

**可追問細節**：為什麼不用 `SELECT ... FOR UPDATE` 悲觀鎖？（因為 MySQL + Prisma 的條件式 `updateMany` 已經足夠處理這個場景，且不需要額外管理鎖的生命週期）；為什麼不是每個檢查都做成 updateMany？（只有真正會被併發觸發的兩個關卡才需要，其餘用一般讀寫即可，過度使用反而增加複雜度）。

## 2. 事件驅動的全域 Modal 架構

**是什麼**：全域 Modal（訊息、通知、儲值等）不透過 React props 層層傳遞，而是用 `window.dispatchEvent(new CustomEvent('pm:open-xxx'))` 驅動，在 `AppLayout` 這一層統一監聽並開啟對應 Modal。

**為什麼這樣做**：這類全域互動（例如任何頁面的任何按鈕都可能觸發「PM幣不足，去儲值」的提示並開啟儲值 Modal）如果靠 props 傳遞，會需要把狀態一路往上拉到接近根節點，污染中間所有元件的 props。同時 React Router 的 `location.state` 在同一頁面內重複觸發時並不可靠（同一個 state 物件不會觸發變化），改用 window event 可以繞過這個限制。

**可追問細節**：這種模式的缺點是什麼？（型別安全性較弱、事件名稱是字串沒有編譯期檢查、多個監聽者疊加時要注意重複觸發）；怎麼避免濫用？（只用在真正跨頁面/跨元件樹的全域互動，同一元件樹內的狀態還是走一般 props/context）。

## 3. 多裝置登入 session（Redis）

**是什麼**：refreshToken 不存 MySQL，改存 Redis，key 格式 `refresh:{userId}:{sessionId}`，`sessionId` 是登入時產生的隨機值並內含於 JWT payload。同一帳號在多台裝置登入時，各自有獨立的 session，登出或 refresh 只影響當下這個裝置，不會互踢其他裝置。

**為什麼這樣做**：舊版設計沒有 sessionId，所有裝置共用同一把 refresh token，導致任何一台裝置登出或 refresh 都會讓其他裝置的登入失效。改成 per-session key 之後，帳號停用（軟刪除）時可以用 `SCAN` 找出該使用者所有 session 一次清除，同時保留向下相容（沒有 sessionId 的舊 token 仍可查詢，refresh 一次後自動升級成新格式）。

**可追問細節**：為什麼用 `SCAN` 而不是 `KEYS`？（`KEYS` 是阻塞式全 keyspace 掃描，會卡住整個 Redis，`SCAN` 是非阻塞游標式迭代）；舊版相容邏輯要保留多久？（refresh token 本身 7 天過期，理論上舊格式 key 一段時間後會自然消失，屬於一次性遷移邏輯）。

## 4. 群組狀態機

**是什麼**：群組有明確的狀態機：`recruiting → full → pending_confirmation → pending_activation → confirming → {active | disputed} → active`，另有 `paused`/`cancelled`/`ended` 分支。每個轉換都由後端特定 route 驅動，前端不做本地假設。

**為什麼這樣做**：共享訂閱媒合的核心複雜度就在這個狀態機——申請、審核、鎖定、填帳號、確認、啟用、續訂、結束，每個環節都牽動 PM幣代管與多方權限。把狀態機明確定義在 schema 層級（`GroupStatus` enum），並且前端在關鍵操作後一律重新拉取真實狀態而非本地推算，避免前後端狀態漂移。

**可追問細節**：狀態機裡最容易出錯的轉換是哪個？（`confirming → disputed` 的申訴分支，因為牽涉到雙方各自的截止時間與裁定邏輯）；有沒有考慮用 state machine library（如 XState）？（目前規模用 enum + route 層級檢查已足夠，state machine library 的價值在轉換規則更複雜、或需要視覺化除錯時才明顯）。

## 5. 大型元件重構

**是什麼**：專案過程中把多個 600 行以上的大型元件（如 `AppNav.jsx`、`HostGroupView.jsx`）拆分成 orchestrator + 子元件 / hook 的結構。

**為什麼這樣做**：單一元件同時處理版面、業務邏輯、多種裝置的 RWD 分支，會讓修改任何一小塊都要重新理解整份檔案。拆分後每個子元件職責單一，orchestrator 只負責組裝與資料傳遞。

**可追問細節**：怎麼判斷該不該拆？（不是行數到某個門檻就硬拆，而是看是否有清楚的職責邊界——例如「桌機 sidebar」跟「手機 dock」根本是兩套完全不同的 UI，拆開後各自可以獨立理解）；拆分後怎麼避免 props drilling？（狀態留在 orchestrator，子元件盡量做成 presentational，需要跨元件共用的邏輯才抽成 hook）。

## 6. shared/ui 依用途分類（primitives / group / 業務綁定元件）

**是什麼**：`shared/ui/` 原本 25 個元件平鋪在同一層，重新整理成 `primitives/`（不帶業務邏輯的通用元件，如 Button、Modal、Badge）、`group/`（群組詳情 Modal 家族，跨團主/成員視角共用）、其餘留在最外層（綁定特定業務概念但非群組專屬，如 ServiceLogo、TokenAmount）。

**為什麼這樣做**：這是規模到一定程度後才做的決定——不是一開始就先切好資料夾，而是等元件數量多到「找檔案要用 Ctrl+F」的程度，才依實際用途反推分類方式，避免過早抽象。

**可追問細節**：怎麼決定分類邊界？（先看元件本身是否帶業務知識——不知道「群組」「PM幣」這些概念的是 primitive；反過來，會用到這些概念但又不是專屬某個 Modal 家族的，留在最外層而不強行歸類，避免為了湊「乾淨」而製造模糊分類）。
