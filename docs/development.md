# 開發指南

## 環境需求

- Node.js 18+
- MySQL 8+
- Redis 7+（Mac 用 `brew install redis`）

---

## 環境變數

### 前端（根目錄 `.env`）

```bash
# REST API 位址
VITE_API_BASE_URL=http://localhost:3001/api

# Imgbb 圖片上傳（https://api.imgbb.com）
VITE_IMGBB_API_KEY=
```

### 後端（`server/.env`）

```bash
# MySQL 連線字串
DATABASE_URL="mysql://root:password@localhost:3306/partymatch"

# Redis 連線字串
REDIS_URL="redis://localhost:6379"

# JWT 簽名金鑰（隨機長字串）
JWT_SECRET=
JWT_REFRESH_SECRET=

# 伺服器 port（預設 3001）
PORT=3001
```

不要把 `.env` 檔案 commit 到 Git。

---

## 常用指令

### 前端

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動 Vite 開發伺服器（http://localhost:5173） |
| `npm run build` | 建置 production bundle |
| `npm run lint` | 執行 ESLint |
| `npm run preview` | 本地預覽 production build |

### 後端（在 `server/` 目錄執行）

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動 Express 開發伺服器（http://localhost:3001） |
| `npx prisma migrate dev` | 執行 migration 並同步資料庫 schema |
| `npx prisma studio` | 開啟資料庫視覺化介面（http://localhost:5555） |
| `npx prisma generate` | 重新產生 Prisma Client |

---

## 首次啟動流程

```bash
# 1. 確認 MySQL 和 Redis 正在執行
brew services start mysql
brew services start redis

# 2. 前端依賴
npm install

# 3. 後端依賴與資料庫初始化
cd server
npm install
npx prisma migrate dev

# 4. 開兩個 terminal 分別啟動前後端
# Terminal 1（根目錄）
npm run dev

# Terminal 2（server/）
npm run dev
```

---

## 打包專案

```bash
zip -r partymatch.zip . \
  --exclude "*/node_modules/*" \
  --exclude "*/dist/*" \
  --exclude "*/.git/*" \
  --exclude "*/.DS_Store" \
  --exclude "*/.env"
```

---

## 待完成項目

### 高優先度

| 項目 | 說明 | 相關檔案 |
|------|------|----------|
| Google OAuth | 目前 `loginGoogle()` 回傳 stub 錯誤，需實作後端 OAuth 流程 | `useAuthStore.js`、`server/src/routes/auth.js` |
| 重設密碼寄信 | 目前 `resetPassword()` 回傳 stub 錯誤，需串接 email 服務 | `useAuthStore.js`、`server/src/routes/auth.js` |
| 資料一致性 guard | 核准申請時確保 subscription + member 同時建立 | `useApplicationStore.js` |
| 信用評分完整機制 | 扣 / 加分邏輯尚未串通完整流程 | `useAuthStore.js`、`useMemberStore.js` |

### 中優先度

| 項目 | 說明 | 相關檔案 |
|------|------|----------|
| RenewalModal 完整實作 | 「開始新一期收款」與「結束服務」為雛形，需完整測試 | `RenewalModal.jsx`、`useGroupStore.js` |
| GroupHistoryModal 入口補強 | 元件已存在，群組卡片缺少明確入口 | `GroupHistoryModal.jsx`、`HostedGroupCard.jsx` |
| 逾期付款提醒流程 | `overdue` 狀態可識別但未自動觸發通知 | `useSubscriptionStore.js`、`useNotificationStore.js` |
| 即將續訂通知 | 接近 `nextBillingDate` 時未自動提醒 | `useSubscriptionStore.js` |

### 低優先度

| 項目 | 說明 |
|------|------|
| 正式金流串接 | ECPay / 綠界或其他金流 API |
| WebSocket 取代輪詢 | 訊息中心目前每 5 秒 polling，WebSocket 可降低延遲 |
| 探索頁篩選條件 URL 分享 | 目前存於 sessionStorage |
| 快速配對結果分頁 | 資料量大時需分頁或虛擬捲動 |
| TypeScript 型別覆蓋 | 目前全為 JavaScript |
