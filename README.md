# PartyMatch

> 共享訂閱群組媒合平台——讓找團、申請、付款、溝通全都在同一個地方完成。

支援 Netflix、Spotify、YouTube Premium、ChatGPT Plus 等 30 種服務，提供探索群組、快速配對、申請審核、付款追蹤、即時聊天室的完整流程。

---

## 為什麼做這個專案？

現實中共享訂閱的媒合大多發生在 Facebook、PTT 或 Discord，存在幾個明顯問題：

- 找合適的人很耗時，也難以確認對方信用
- 付款紀錄散落各處，容易有糾紛
- 沒有統一的審核機制，詐騙風險高

PartyMatch 的設計目標是：在一個平台上完整處理**媒合 → 申請 → 審核 → 付款確認 → 啟用服務**的全流程，同時讓團主與成員各有清楚的角色界面。

---

## 截圖

<!-- TODO: 替換為實際截圖 -->

| 首頁 | 探索群組 | 群組管理 | 訊息中心 |
|------|----------|----------|----------|
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |

---

## 功能總覽

### 訪客

| 功能 | 說明 |
|------|------|
| 探索群組 | 分類 pill 篩選（再點清除）；搜尋 Modal 含服務、價格、排序篩選；卡片點擊開啟詳情 Modal |
| 快速配對 | 輸入服務、方案、預算，系統推薦最符合的群組 |
| 群組詳情 | 查看方案、名額、規則、申請條件 |

### 會員（我的群組 → 我是成員）

| 功能 | 說明 |
|------|------|
| 申請加入 | 送出申請、等待審核；即時收到審核結果通知 |
| 訂閱管理 | 查看訂閱狀態（全部 / 處理中 / 啟用中 / 即將續訂 / 申請紀錄）、填寫帳號資訊、標記已付款 |
| 訊息中心 | 群組聊天室、私人 DM，REST API polling 同步 |
| 收藏 / 通知 / 帳號 | 收藏群組、查看個人通知、管理個人資料 |

### 團主（我的群組 → 我是團主）

| 功能 | 說明 |
|------|------|
| 建立群組 | 4 步驟表單：選服務 → 選方案 → 設定條件 → 確認送出 |
| 審核申請 | 待審核申請單獨列出，點右上角「審核紀錄」可滑入歷史紀錄（含篩選） |
| 移除成員 | 群組在 `recruiting` / `full` 期間可將已核准成員移出；進入收款階段後名單鎖定 |
| 收款管理 | 逐筆確認成員付款；可回報付款問題 |
| 啟用服務 | 全員付款確認後，填入收款帳號並啟用 |
| 續訂 / 結束 | 開始新一期收款，或結束群組 |

---

## 系統設計

### 架構分層

```
React 19 + React Router v7
          │
    Feature Modules (src/features/)     ← UI 與頁面
          │
    Shared Stores (src/shared/stores/)  ← 記憶體快取 + 業務邏輯
          │
    API Layer (src/shared/api/)         ← REST API 封裝（axios）
          │
  Express 後端 (server/src/)
          │
    MySQL（Prisma ORM）+ Redis（快取 / Session）
```

App 啟動時分兩階段初始化：
1. **公開資料**（不需 token）：auth、services、groups、notifications
2. **私人資料**（已登入才執行）：applications、subscriptions、members、favorites、payments、conversations

讀取走 Store（同步），寫入走 API（非同步）。

### 認證機制

- JWT accessToken + refreshToken 雙 token 設計
- accessToken 存於 `localStorage`，每次 request 自動帶入 `Authorization: Bearer` header
- 收到 401 且有 token 時自動導向 `/login`（session 過期）
- 未登入呼叫受保護端點的 401 靜默處理（不跳轉、不報錯）

### 群組狀態機

群組從建立到結束共六個主要狀態：

```
recruiting → full → pending_confirmation → pending_activation → active → ended
                                                                    │        ↑
                                                                    └────────┘
                                                                  active（續訂）
                                                                    │
                                                          paused / cancelled（異常結束）
```

每個狀態轉換都有對應的角色與觸發條件。

> `full` 時，團主點「啟用群組」並填寫收款帳號後確認，系統才會建立群組聊天室並推進至 `pending_confirmation`。

### 成員異動規則

`recruiting` / `full` 狀態下，成員可自行退出、團主可移除成員：後端刪除 member 記錄、將 application 標為 `left` / `removed`、subscription 一併刪除，名額釋出（`full` 退回 `recruiting`）；被移除或自行退出的申請狀態允許再次申請同一群組。進入 `pending_confirmation` 後成員名單不可再變動，前後端均設有狀態守衛。

### 導覽設計

- **桌機版**：左側 floating sidebar，收合為 64px icon bar，hover 展開至 224px 顯示文字標籤；sidebar 底部使用者按鈕上方顯示 PM 幣餘額（含加值按鈕），收合時隱藏、展開後顯示；頭像按鈕點擊開啟置中 Modal（帳號資訊、帳號設定、登出）；開啟 PM 儲值或使用者資訊 Modal 時，sidebar 自動收合（blur 移走焦點）。
- **手機版**：頂部 header + 底部 Dock；頂部右側以頭像取代漢堡選單，點擊展開 dropdown（頭像+名稱置中、帳號設定與登出左右並排）；未登入時顯示 UserCircle2 icon 點擊導向登入頁。底部 Dock 由左至右：搜尋、功能（dropdown：快速配對 + 建立群組）、探索（中央圓形主按鈕）、我的（dropdown：我的群組 + 我的收藏）、訊息。Dock 已整合搜尋入口，header 不再顯示搜尋按鈕。

### 帳號設定

帳號設定頁（`/account`）分頁包含：**個人資料**（基本資訊編輯）、**付款設定**（付款方式管理 + 交易紀錄）、**通知偏好**（開發中）、**安全驗證**（開發中）、**其他設定**（一般偏好、隱私設定、刪除帳號），管理員另有**管理員**分頁。付款方式最多儲存 2 種，存於後端 MySQL（`payment_methods` table）。PM 幣加值與交易紀錄整合於 TopupModal 的雙面板設計——主面板儲值、子面板查看交易紀錄，兩者以滑動動畫切換。桌機版為左右 sidebar 分頁佈局；手機版為 accordion 展開收合，登出按鈕獨立置於 accordion 最底部並做全寬顯示，不再收在「其他設定」分頁內（桌機版登出仍在「其他設定」分頁中）。

### 我的群組統計

`/my-groups` 頁面頂部顯示雙角色訂閱統計卡：**身為團主**（活躍群組、累計建立、月收 PM）與**身為成員**（活躍訂閱、累計訂閱、月支 PM），讓使用者一眼掌握兩種角色的概況。

### 探索篩選與搜尋

探索頁以 **URL query params 為唯一狀態來源**：`ExplorePage` 直接從 `useSearchParams()` 衍生篩選物件（無獨立 `filters` state），`handleFilterChange` 呼叫 `navigate(..., { replace: true })` 更新 URL。搜尋 Modal（`MobileSearch`）開啟時，服務分類固定重置為「全部」；桌機版分類 pills 左右各有箭頭按鈕可平滑捲動；兩元件共用 `src/features/explore/exploreConstants.js` 的篩選預設值與選項常數。

### 跨元件通訊

全域 Modal 透過 `window.dispatchEvent` 以 `pm:open-*` 事件驅動，避免 React props 層層傳遞，也解決 `location.state` 在同頁面不可靠的問題。成員異動事件（退出、被移除）透過 `pm:refresh-member-stores` 事件通知 App.jsx 同步所有相關 Store。

---

## 技術亮點

### 1. 雙角色設計

同一個使用者可以同時是某群組的團主，也是另一個群組的成員。`GroupViewModal` 為薄殼，依登入者是否為 `hostId` 決定渲染 `HostGroupView`（審核、收款、啟用）或 `MemberGroupView`（付款、退出）。

### 2. 完整端對端資料流

申請 → 審核 → 成員建立 → 訂閱建立 → 付款確認 → 啟用服務，每一步由 Store 封裝業務邏輯，API 層只做 REST CRUD，兩層職責清楚分離。審核通過時後端自動核算名額並推進群組至 `full` 狀態；被拒絕的申請可重新提出（`rejected → pending`），無需刪除重建。核准流程（餘額檢查、名額與招募狀態條件式更新、申請狀態變更、成員/訂閱建立、代幣代管扣款）整包在單一 Prisma `$transaction` 內執行；名額檢查採條件式 `updateMany`（`status: 'recruiting'` + `currentMembers < maxMembers`）而非先讀後寫，避免併發核准導致超額或核准到已非招募中的群組；餘額不足或名額已滿時全部回滾，避免申請卡在 `approved` 但成員/代管資料未建立的不一致狀態。`subscriptions` API 一律以登入者身分為授權範圍：`GET` 只回傳本人訂閱或本人主持群組內的訂閱、`DELETE` 僅限訂閱本人或該群組團主可操作；已移除原本可被任意使用者呼叫、繞過申請審核流程建立訂閱的 `POST /subscriptions`（訂閱一律由 `applications.js` 核准流程以 transaction 建立）。`members` API 的 `GET ?groupId=` 現會先驗證請求人是否為該群組成員或團主，非相關人員回傳 403。`notifications` API 的 `POST` 不再信任前端傳入的 `isPublic`（一律視為 false），且通知其他使用者時須驗證請求人與目標使用者皆與 `meta.groupId` 指定的群組有關聯（成員／團主／曾送出申請），避免任意使用者對其他人偽造通知。

### 3. 兩階段 App 啟動

未登入時只載入公開資料，避免受保護端點在未認證狀態下被呼叫。登入後才動態初始化私人 Store，並啟動通知 polling；登出時一律呼叫 `teardown()` 清除 polling 計時器與 Store 狀態，確保不會有殘留的 auth 請求。登出再登入（不重整頁面）時，`initPrivateStores` 會重新呼叫 `startPolling`，確保通知持續同步。

### 4. 通知驅動的即時資料同步

通知採用 REST polling（每 10 秒）。偵測到新 `new_application` 通知時自動 refresh 申請 Store，讓團主點擊通知時申請資料已是最新狀態；偵測到成員異動通知時廣播 `pm:refresh-member-stores` 事件，同步更新群組、成員、訂閱、申請四個 Store。

### 5. 訊息輪詢架構

聊天室採用 REST polling（每 5 秒），部署成本低、無需額外的長連線基礎設施，適合現階段規模。

### 6. 三層滑動 Panel

群組 Modal（`GroupModalShell`）採用 300% 寬度的滑動軌道，支援主面板 → 子面板 → 子子面板三層滑入動畫。申請管理子面板右上角的「審核紀錄」按鈕觸發第三層面板，保持一致的「翻書」視覺效果，不需要額外的 overlay Modal。

---

## 技術棧

| 類別 | 技術 |
|------|------|
| Frontend | React 19、Vite、React Router v7、Zustand |
| UI | Tailwind CSS v4（token 定義於 `index.css`）、lucide-react |
| Backend | Node.js、Express |
| 資料庫 | MySQL + Prisma ORM |
| 快取 | Redis |
| 認證 | JWT（accessToken + refreshToken） |
| 圖片上傳 | Imgbb API |
| Architecture | Feature-based、Store + API 雙層分離、事件驅動跨元件通訊、URL 驅動篩選狀態 |

`eslint.config.js` 依目錄分開設定：`src/**` 套用 browser globals + React hooks 規則，`server/**` 與根目錄設定檔套用 Node globals，避免後端程式碼被誤判為瀏覽器環境（例如 `process is not defined`）。`npm run lint` 目前為零錯誤。

---

## 快速開始

### 前置需求

- Node.js 18+
- MySQL 8+
- Redis 7+

### 啟動前端

```bash
npm install
npm run dev   # http://localhost:5173
```

複製 `.env.example` 並填入設定值：

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_IMGBB_API_KEY=你的 Imgbb API Key
```

### 啟動後端

```bash
cd server
npm install
npx prisma migrate dev   # 建立資料表
npm run dev              # http://localhost:3001
```

複製 `server/.env.example` 並填入設定值（DATABASE_URL、JWT_SECRET 等）。

### 查看資料庫

```bash
cd server
npx prisma studio   # http://localhost:5555
```

---

## 未來規劃

- [ ] 正式金流串接（ECPay / 綠界）
- [ ] 信用評分完整機制（扣 / 加分邏輯）
- [ ] 逾期付款排程通知
- [ ] WebSocket 取代輪詢（訊息即時性提升）
- [ ] TypeScript 型別覆蓋

---

## 文件

| 文件 | 內容 |
|------|------|
| [架構與資料層](docs/architecture.md) | 資料夾結構、Store 設計、主要檔案連動 |
| [操作流程](docs/user-flows.md) | 申請、付款、啟用等完整流程圖與群組狀態機 |
| [資料庫 Schema](docs/database-schema.md) | MySQL Table 設計、事件驅動清單、狀態流程 |
| [開發指南](docs/development.md) | 環境變數、指令、首次啟動流程、待完成項目 |
