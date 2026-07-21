# 架構總覽

## 架構分層

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

讀取走 Store（同步取用記憶體快取），寫入走 API（非同步打後端）。App 啟動時分兩階段初始化 Store，避免未登入狀態呼叫受保護端點，細節見 [前端架構](./frontend-architecture.md)。

## 技術棧與選型

| 層級 | 技術 | 為什麼選這個 |
|------|------|--------------|
| 前端框架 | React 19 + Vite | 開發體驗與建置速度優於 CRA，團隊也最熟悉 React 生態 |
| 路由 | React Router v7 | 專案規模不需要 Next.js 的 SSR/檔案路由，純 SPA 用 React Router 足夠且輕量 |
| 樣式 | Tailwind CSS v4 | 用 `@theme` 集中管理設計 token，避免元件各自硬寫顏色/間距數值 |
| 前端狀態 | Zustand | 比 Redux 樣板碼少，又比純 Context 更適合跨頁面共享的伺服器快取資料 |
| 後端框架 | Node.js + Express | 團隊熟悉，中介層模式（middleware chain）跟 REST 資源路由對應直觀 |
| ORM | Prisma | 型別安全的 schema-first 開發，`$transaction` API 對這個專案大量需要的併發控制很直接 |
| 資料庫 | MySQL 8 | 關聯式資料最符合群組/成員/申請這種強關聯的業務模型 |
| 快取 | Redis | 目前唯一用途是 refreshToken session store，見 [認證機制](./authentication.md) |
| 認證 | JWT（雙 token） | accessToken 短效 + refreshToken 長效，搭配 Redis 可以個別使某一台裝置的 session 失效 |

## 文件導覽

深入細節請看對應文件，這份總覽不重複列出：

| 文件 | 內容 |
|------|------|
| [前端架構](./frontend-architecture.md) | 資料夾結構原則、Store 層、API 層、Modal 管理、路由設計 |
| [後端架構](./backend-architecture.md) | Route 架構、Middleware、Prisma transaction 慣例、權限控管 |
| [資料庫 Schema](./database-schema.md) | Table 對應、群組/訂閱狀態、PM幣代管機制、事件驅動清單 |
| [API 總覽](./api-overview.md) | 完整端點清單與認證層級 |
| [認證機制](./authentication.md) | JWT 雙 token、多裝置 session、路由守衛 |
| [命名慣例](./naming-conventions.md) | 資料夾、元件、Store、API 模組的命名規則 |
| [使用者流程總覽](../flows/user-flows.md) | 群組狀態機與各角色的完整操作流程 |
| [專案亮點](../portfolio/project-highlights.md) | 面試 / 作品集適合深入講的技術決策 |
