# PartyMatch

## 專案介紹

PartyMatch 是一個共享訂閱媒合平台，讓使用者可以探索或建立 Netflix、Spotify、YouTube Premium、Disney+ 等共享訂閱群組，從找夥伴、申請審核、付款代管到續訂都在同一個平台完成。

完整的產品定位、解決的問題與功能說明見下方[技術文件](#技術文件)。

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

- [產品總覽](docs/product/product-overview.md) — 產品定位、解決的問題、角色設計、MVP 範圍
- [頁面地圖](docs/product/page-map.md) — 路由與頁面對照
- [功能地圖](docs/product/feature-map.md) — 完整功能清單
- [服務定價查核紀錄](docs/product/service-pricing-audit.md)

### Flows

- [使用者流程總覽](docs/flows/user-flows.md) — 完整使用流程與狀態機
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

- [架構總覽](docs/architecture/architecture.md) — 分層結構、技術棧取捨
- [前端架構](docs/architecture/frontend-architecture.md)
- [後端架構](docs/architecture/backend-architecture.md)
- [資料庫 Schema](docs/architecture/database-schema.md)
- [API 總覽](docs/architecture/api-overview.md)
- [認證機制](docs/architecture/auth-flow.md)
- [命名慣例](docs/architecture/naming-conventions.md)
- [開發指南](docs/development.md) — 環境變數與常用指令

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
- [專案亮點](docs/portfolio/project-highlights.md) — 技術亮點與取捨原因
- [AI 協作說明](docs/portfolio/ai-collaboration-note.md)
- [未來規劃](docs/portfolio/future-roadmap.md) — 開發狀態與後續規劃

---

## 注意事項

本專案為個人作品集用途，儲值、付款、代管撥款等流程皆為模擬邏輯，未串接正式金流。正式環境所需的 API key、JWT secret、資料庫連線資訊與第三方服務設定皆未包含於此 repository，執行前請依 [開發指南](docs/development.md) 自行設定環境變數。
