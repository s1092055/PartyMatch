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

## 技術內容

| 類別 | 技術 |
|------|------|
| Frontend | React 19、Vite、React Router v7、Zustand |
| UI | Tailwind CSS v4（token 定義於 `index.css`）、lucide-react |
| Backend | Node.js、Express |
| 資料庫 | MySQL + Prisma ORM |
| 快取 | Redis |
| 認證 | JWT（accessToken + refreshToken） |
| 圖片上傳 | Cloudflare R2（後端代理上傳，前端不需另外設定 API Key） |
| Architecture | Feature-based、Store + API 雙層分離、事件驅動跨元件通訊 |

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

複製 `server/.env.example` 並填入設定值（DATABASE_URL、JWT_ACCESS_SECRET 等）。

更完整的環境變數說明與常用指令請見 [開發指南](docs/development.md)。

---

## 技術文件

### 建議閱讀順序

1. **先懂產品在做什麼** → [產品總覽](docs/product/product-overview.md)，用來解釋這個平台在解決什麼問題、有哪些使用者角色
2. **再懂整體是怎麼組出來的** → [架構總覽](docs/architecture/architecture.md)，說明前端、後端、資料庫怎麼疊起來，以及為什麼選這些技術
3. **想知道某個功能實際怎麼運作** → [使用者流程](docs/flows/user-flows.md)，使用者的流程規劃（例如「申請加入群組時錢是怎麼扣的」）
4. **想深入技術細節** → 前端架構／後端架構／資料庫 Schema／API 總覽
5. **想知道這個專案做得好的地方** → [專案亮點](docs/portfolio/project-highlights.md)，專案精華與重點內容

以下依用途分類，完整索引如下：

### Product — 這個專案在做什麼

- [產品總覽](docs/product/product-overview.md) — 產品定位、解決的問題、角色設計、MVP 範圍
- [頁面地圖](docs/product/page-map.md) — 每個網址對應到哪個畫面
- [功能地圖](docs/product/feature-map.md) — 目前做了哪些功能的完整清單
- [服務定價查核紀錄](docs/product/service-pricing-audit.md) — 平台內 28 種訂閱服務的價格怎麼查到的、哪些還沒驗證過
- [各服務填寫帳號資訊需求調查](docs/product/service-info-requirements.md) — 28 種服務真實的共享機制分類（Apple/Google 家庭群組、email 邀請、邀請碼、共用帳密），現有表單只收 email 的落差在哪

### Flows — 各個功能實際怎麼運作

- [使用者流程總覽](docs/flows/user-flows.md) — 完整使用流程與群組狀態機，看這篇最快抓到全貌
- [群組狀態機](docs/flows/group-state-machine.md) — 一個群組會經過哪些狀態（招募中 → 額滿 → 啟用 → 結束…）
- [探索群組流程](docs/flows/explore-flow.md)
- [快速搜尋流程](docs/flows/quick-match-flow.md)
- [建立群組流程](docs/flows/create-group-flow.md)
- [申請加入流程](docs/flows/apply-join-flow.md)
- [團主審核流程](docs/flows/approval-flow.md)
- [PM幣代管與付款流程](docs/flows/payment-token-flow.md) — 平台內部貨幣「PM幣」怎麼儲值、代管、撥款、退款
- [我的群組（成員視角）流程](docs/flows/my-groups-member-flow.md)
- [我的群組（團主視角）流程](docs/flows/my-groups-host-flow.md)
- [續訂流程](docs/flows/renewal-flow.md)
- [申訴流程](docs/flows/dispute-flow.md)
- [訊息流程](docs/flows/messages-flow.md)
- [通知流程](docs/flows/notification-flow.md)

### Architecture — 程式碼是怎麼寫、怎麼組織的

- [架構總覽](docs/architecture/architecture.md) — 先看這篇，分層結構與技術棧選型理由
- [前端架構](docs/architecture/frontend-architecture.md) — React 這邊的程式碼怎麼分資料夾、怎麼管理畫面上的資料
- [後端架構](docs/architecture/backend-architecture.md) — Express 這邊的 API 怎麼寫、怎麼保護資料安全
- [資料庫 Schema](docs/architecture/database-schema.md) — 資料庫存了哪些表、彼此關係
- [API 總覽](docs/architecture/api-overview.md) — 每一支後端網址在做什麼、需不需要登入
- [認證機制](docs/architecture/authentication.md) — 使用者怎麼登入、系統怎麼記得你是誰
- [命名慣例](docs/architecture/naming-conventions.md) — 檔案跟變數的命名規則
- [開發指南](docs/development.md) — 環境變數與常用指令，想在自己電腦跑起來看這篇

### Testing — 怎麼確認功能是好的

- [手動測試計畫](docs/testing/manual-test-plan.md)
- [測試帳號](docs/testing/test-accounts.md)
- [核心流程測試案例](docs/testing/core-flow-test-cases.md) — 含 App 啟動失敗彙總 Toast、樂觀更新失敗回滾（`notifyError`）
- [成員流程測試案例](docs/testing/member-flow-test-cases.md)
- [團主流程測試案例](docs/testing/host-flow-test-cases.md)
- [訊息與通知測試案例](docs/testing/messaging-notification-test-cases.md) — 含撤回申請通知團主、通知額滿保護（`openGroupOrRedirect`）
- [RWD 測試案例](docs/testing/rwd-test-cases.md)
- [Bug 紀錄](docs/testing/bug-log.md)

### Portfolio — 給面試官或想認識這個專案的人

- [面試講稿筆記](docs/portfolio/interview-notes.md) — 常見面試問題的回答草稿
- [專案亮點](docs/portfolio/project-highlights.md) — 技術亮點與取捨原因，挑 2-3 個深入講就好
- [AI 協作說明](docs/portfolio/ai-collaboration-note.md) — 這個專案怎麼跟 AI 協作開發的
- [未來規劃](docs/portfolio/future-roadmap.md) — 開發狀態與後續規劃

---

## 注意事項

本專案為個人作品集用途，儲值、付款、代管撥款等流程皆為模擬邏輯，未串接正式金流。正式環境所需的 API key、JWT secret、資料庫連線資訊與第三方服務設定皆未包含於此 repository，執行前請依 [開發指南](docs/development.md) 自行設定環境變數。
