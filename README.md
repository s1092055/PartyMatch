# PartyMatch

## 專案介紹

PartyMatch 是一個共享訂閱媒合平台，讓使用者可以探索 Netflix、Spotify、YouTube Premium、Disney+ 等共享訂閱群組，也可以自己建立群組成為團主。

平台提供申請審核、付款代管與確認、群組聊天室、通知提醒與續訂流程，讓使用者從找夥伴到管理訂閱，都能在同一個地方完成，不再依賴私訊、表單或人工記帳。

---

## 解決的問題

現實中共享訂閱的媒合大多發生在 Facebook、PTT 或 Discord，靠私訊、表單跟人工記帳——找人耗時、難確認信用，付款紀錄散落各處容易有糾紛，沒有審核機制詐騙風險高，團主要手動追每一筆付款。PartyMatch 把**媒合 → 申請 → 審核 → 付款代管與確認 → 啟用服務**整條路徑收斂到同一個平台，團主與成員各有清楚的角色介面。

## 核心功能

一般使用者可以探索/快速搜尋群組、申請加入審核制群組、在「我的群組」雙視角管理訂閱與續訂、用聊天室溝通、管理 PM 幣與付款方式、申訴與評價團主。團主則可以建立群組、審核申請、管理成員名單與收款、鎖定群組並啟用服務、開始續訂或結束群組。

完整功能清單見 [產品總覽](docs/product/product-overview.md)、[功能地圖](docs/product/feature-map.md)。

---

## 使用流程

1. 使用者註冊 / 登入
2. 探索共享訂閱群組，或使用快速搜尋
3. 送出申請，等待團主審核
4. 團主審核通過，系統自動扣款進入代管
5. 名額額滿後，團主鎖定群組並建立聊天室
6. 成員填寫服務帳號資訊
7. 團主確認資訊齊全後啟用服務
8. 雙方透過平台管理續訂、付款狀態與溝通

完整的狀態機、PM幣代管流程與各角色詳細流程圖請見 [使用者流程文件](docs/flows/user-flows.md)。

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
| 圖片上傳 | Cloudinary（後端代理上傳，前端不需另外設定 API Key） |
| Architecture | Feature-based、Store + API 雙層分離、事件驅動跨元件通訊、URL 驅動篩選狀態 |

---

## 專案亮點

- **雙角色設計**：同一使用者可同時是某群組的團主、也是另一群組的成員，視角動態切換
- **交易安全性**：核准申請的餘額檢查、名額更新、成員/訂閱建立、PM幣扣款整包在單一 Prisma transaction 內執行，並以條件式 `updateMany` 防止併發核准超額
- **事件驅動跨元件通訊**：全域 Modal 透過 `window.dispatchEvent` 觸發，避免 props 層層傳遞
- **多裝置登入 session**：refreshToken 存 Redis 並以 sessionId 區分裝置，登出/refresh 互不影響
- **RWD**：支援桌機、平板與手機版面，桌機為 sidebar 導覽，手機為底部 Dock 導覽

完整技術亮點（含每項的取捨原因與可追問細節）見 [專案亮點](docs/portfolio/project-highlights.md)。

---

## 如何啟動專案

### 前置需求

- Node.js 22+
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
```

### 啟動後端

```bash
cd server
npm install
npm run db:push          # 建立資料表
npm run dev              # http://localhost:3001
```

複製 `server/.env.example` 並填入設定值（DATABASE_URL、JWT_SECRET 等）。

更完整的環境變數說明與常用指令請見 [開發指南](docs/development.md)。

---

## 技術文件

`docs/` 底下依用途分類，完整索引如下：

### Product

- [產品總覽](docs/product/product-overview.md)
- [頁面地圖](docs/product/page-map.md)
- [功能地圖](docs/product/feature-map.md)
- [服務定價查核紀錄](docs/product/service-pricing-audit.md)

### Flows

- [使用者流程總覽](docs/flows/user-flows.md)
- [群組狀態機](docs/flows/group-state-machine.md)
- [探索群組流程](docs/flows/explore-flow.md)
- [快速搜尋流程](docs/flows/quick-match-flow.md)
- [建立群組流程](docs/flows/create-group-flow.md)
- [申請加入流程](docs/flows/apply-join-flow.md)
- [團主審核流程](docs/flows/approval-flow.md)
- [PM幣代管與付款流程](docs/flows/payment-token-flow.md)
- [我的群組（成員視角）流程](docs/flows/my-groups-member-flow.md)
- [我的群組（團主視角）流程](docs/flows/my-groups-host-flow.md)
- [續訂流程](docs/flows/renewal-flow.md)
- [申訴流程](docs/flows/dispute-flow.md)
- [訊息流程](docs/flows/messages-flow.md)
- [通知流程](docs/flows/notification-flow.md)

### Architecture

- [架構總覽](docs/architecture/architecture.md)
- [前端架構](docs/architecture/frontend-architecture.md)
- [後端架構](docs/architecture/backend-architecture.md)
- [資料庫 Schema](docs/architecture/database-schema.md)
- [API 總覽](docs/architecture/api-overview.md)
- [認證機制](docs/architecture/auth-flow.md)
- [命名慣例](docs/architecture/naming-conventions.md)
- [開發指南](docs/development.md)

### Testing

- [手動測試計畫](docs/testing/manual-test-plan.md)
- [測試帳號](docs/testing/test-accounts.md)
- [核心流程測試案例](docs/testing/core-flow-test-cases.md)
- [成員流程測試案例](docs/testing/member-flow-test-cases.md)
- [團主流程測試案例](docs/testing/host-flow-test-cases.md)
- [訊息與通知測試案例](docs/testing/messaging-notification-test-cases.md)
- [RWD 測試案例](docs/testing/rwd-test-cases.md)
- [Bug 紀錄](docs/testing/bug-log.md)

### Portfolio

- [面試講稿筆記](docs/portfolio/interview-notes.md)
- [專案亮點](docs/portfolio/project-highlights.md)
- [AI 協作說明](docs/portfolio/ai-collaboration-note.md)
- [未來規劃](docs/portfolio/future-roadmap.md)

---

## 開發狀態與未來規劃

目前優先把內部功能（互評系統、信用分數動態調整、帳號恢復流程等）做完善，正式上線所需的外部串接（金流、寄信）排在之後。完整規劃見 [未來規劃](docs/portfolio/future-roadmap.md)。

---

## 注意事項

本專案為個人作品集用途，儲值、付款、代管撥款等流程皆為模擬邏輯，未串接正式金流。正式環境所需的 API key、JWT secret、資料庫連線資訊與第三方服務設定皆未包含於此 repository，執行前請依 [開發指南](docs/development.md) 自行設定環境變數。
