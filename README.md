# PartyMatch

## 專案介紹

PartyMatch 是一個共享訂閱媒合平台，讓使用者可以探索 Netflix、Spotify、YouTube Premium、Disney+ 等共享訂閱群組，也可以自己建立群組成為團主。

平台提供申請審核、付款代管與確認、群組聊天室、通知提醒與續訂流程，讓使用者從找夥伴到管理訂閱，都能在同一個地方完成，不再依賴私訊、表單或人工記帳。

---

## 解決的問題

現實中共享訂閱的媒合大多發生在 Facebook、PTT 或 Discord，存在幾個明顯問題：

- 找合適的人很耗時，也難以確認對方信用
- 付款紀錄散落各處，容易有糾紛
- 沒有統一的審核機制，詐騙風險高
- 團主需要手動確認每一筆付款，成員也不清楚自己的付款與續訂狀態

PartyMatch 的設計目標是：在一個平台上完整處理**媒合 → 申請 → 審核 → 付款代管與確認 → 啟用服務**的全流程，同時讓團主與成員各有清楚的角色界面。

---

## 核心功能

### 一般使用者

- 探索共享訂閱群組（分類篩選、關鍵字搜尋、價格與排序條件）
- 快速配對：輸入服務、方案、預算，系統推薦最符合的群組
- 申請加入審核制群組，即時收到審核結果通知
- 查看我的訂閱狀態、填寫服務帳號資訊、追蹤付款與續訂
- 收藏感興趣的群組
- 使用聊天室與團主或其他成員溝通（群組聊天室 + 私人 DM）
- 管理個人資料、付款方式與代幣餘額

### 團主

- 建立共享訂閱群組（3 步驟表單：選服務 → 方案與設定 → 確認送出），可設定最低信用分數門檻篩選申請者
- 審核加入申請，查看申請者信用分數與留言
- 管理成員名單（招募期間可移除成員，進入收款階段後名單鎖定）
- 查看收款管理面板、回報成員服務帳號問題
- 鎖定群組、啟用服務
- 開始新一期續訂，或結束群組

---

## 使用流程

1. 使用者註冊 / 登入
2. 探索共享訂閱群組，或使用快速配對
3. 送出申請，等待團主審核
4. 團主審核通過，系統自動扣款進入代管
5. 名額額滿後，團主鎖定群組並建立聊天室
6. 成員填寫服務帳號資訊
7. 團主確認資訊齊全後啟用服務
8. 雙方透過平台管理續訂、付款狀態與溝通

完整的狀態機、代幣代管流程與各角色詳細流程圖請見 [使用者流程文件](docs/user-flows.md)。

---

## 畫面展示

<!-- TODO: 替換為實際截圖 -->

| 首頁 | 探索群組 | 群組管理 | 訊息中心 |
|------|----------|----------|----------|
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |

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

---

## 專案亮點

- **雙角色設計**：同一使用者可同時是某群組的團主、也是另一群組的成員，`GroupViewModal` 依身分動態渲染對應視角
- **完整端對端資料流**：申請 → 審核 → 成員建立 → 訂閱建立 → 付款確認 → 啟用服務，Store 封裝業務邏輯、API 層只做 REST CRUD，職責分離清楚
- **交易安全性**：核准申請的餘額檢查、名額更新、成員/訂閱建立、代幣扣款整包在單一 Prisma transaction 內執行，並以條件式 `updateMany` 防止併發核准導致超額
- **權限收斂**：訂閱、成員、通知等 API 皆以登入者身分收斂查詢範圍與寫入權限，避免越權存取或偽造資料
- **兩階段 App 啟動**：未登入僅載入公開資料，登入後才初始化私人 Store 並啟動通知輪詢，登出即清除
- **事件驅動跨元件通訊**：全域 Modal 透過 `window.dispatchEvent` 觸發，避免 props 層層傳遞、解決同頁面路由 state 不可靠的問題
- **獨立步驟流程頁**：建立群組、快速配對為多步驟全螢幕頁面（非 Modal），脫離主要導覽（sidebar / Dock）避免視覺干擾；快速配對沿用 `SlideTrack` 元件做步驟間水平滑動，建立群組則改為 `key={step}` 重新掛載搭配 CSS 垂直 slide-up 動畫，並以 `ResizeObserver` + `MutationObserver` 動態偵測內容是否溢出，僅在確定不會裁切內容時才置中顯示
- **對話延遲曝光**：DM 由某一方主動開啟聯絡後，對話只會出現在發起人自己的訊息列表；對方要等到發起人真的送出第一則訊息才會在自己的列表中看到這個對話（後端以 `initiatorId` + `lastMessage` 判斷，非以輪詢時機控制）
- **大型元件重構**：將 5 個 600 行以上的大型元件拆分為 orchestrator + 子元件 / hook 的結構，提升可維護性（細節見 [架構文件](docs/architecture.md)）
- **RWD**：支援桌機、平板與手機版面，桌機為 sidebar 導覽，手機為底部 Dock 導覽

---

## 如何啟動專案

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
npx prisma db push       # 建立資料表
npm run dev              # http://localhost:3001
```

複製 `server/.env.example` 並填入設定值（DATABASE_URL、JWT_SECRET 等）。

更完整的環境變數說明與常用指令請見 [開發指南](docs/development.md)。

---

## 技術文件

更完整的技術設計與開發文件請參考：

| 文件 | 內容 |
|------|------|
| [架構與資料層](docs/architecture.md) | 資料夾結構、Store 設計、主要檔案連動、元件拆分、認證機制、導覽設計等前端技術細節 |
| [操作流程](docs/user-flows.md) | 申請、付款、啟用等完整流程圖與群組狀態機 |
| [資料庫 Schema](docs/database-schema.md) | MySQL Table 設計、事件驅動清單、代幣異動規則 |
| [開發指南](docs/development.md) | 環境變數、指令、首次啟動流程、待完成項目 |

---

## 開發狀態與未來規劃

- [ ] 正式金流串接（ECPay / 綠界）
- [ ] 信用評分完整機制（扣 / 加分邏輯）
- [ ] 逾期付款排程通知
- [ ] WebSocket 取代輪詢（訊息即時性提升）
- [ ] TypeScript 型別覆蓋

更詳細的待完成項目（依優先度分類）見 [開發指南](docs/development.md#待完成項目)。

---

## 注意事項

本專案為個人作品集用途，儲值、付款、代管撥款等流程皆為模擬邏輯，未串接正式金流。正式環境所需的 API key、JWT secret、資料庫連線資訊與第三方服務設定皆未包含於此 repository，執行前請依 [開發指南](docs/development.md) 自行設定環境變數。
