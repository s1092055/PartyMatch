# PartyMatch

> 共享訂閱群組媒合平台——讓找團、申請、付款、溝通全都在同一個地方完成。

支援 Netflix、Spotify、YouTube Premium、ChatGPT Plus 等 30 種服務，提供探索群組、快速配對、申請審核、付款追蹤、即時聊天室的完整流程。

**[Live Demo](#)** &nbsp;|&nbsp; Demo 帳號：`demo@partymatch.tw` / `demo1234`

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
| 探索群組 | 分類、服務、價格篩選；卡片點擊開啟詳情 Modal |
| 快速配對 | 輸入服務、方案、預算，系統推薦最符合的群組 |
| 群組詳情 | 查看方案、名額、規則、申請條件 |

### 會員

| 功能 | 說明 |
|------|------|
| 申請加入 | 送出申請、等待審核；即時收到審核結果通知 |
| 我的訂閱 | 查看訂閱狀態、填寫帳號資訊、標記已付款 |
| 訊息中心 | 群組聊天室、私人 DM，Firestore 即時同步 |
| 收藏 / 通知 / 帳號 | 收藏群組、查看個人通知、管理個人資料 |

### 團主

| 功能 | 說明 |
|------|------|
| 建立群組 | 4 步驟表單：選服務 → 選方案 → 設定條件 → 確認送出 |
| 審核申請 | 核准 / 拒絕申請；支援狀態篩選 |
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
    Firestore API (src/shared/api/)     ← Firestore CRUD 封裝
          │
  Firebase Auth + Firestore
```

App 啟動時並行呼叫所有 Store 的 `init()`，將資料一次性載入記憶體。讀取走 Store（同步），寫入走 API（非同步，fire-and-forget 更新記憶體）。

### 群組狀態機

群組從建立到結束共六個主要狀態：

```
recruiting → full → pending_confirmation → pending_activation → active → ended
                                                                    ↑
                                                     active（續訂）─┘
```

每個狀態轉換都有對應的角色與觸發條件，詳見[操作流程文件](docs/user-flows.md)。

### 跨元件通訊

全域 Modal 透過 `window.dispatchEvent` 以 `pm:open-*` 事件驅動，避免 React props 層層傳遞，也解決 `location.state` 在同頁面不可靠的問題。

---

## 技術亮點

### 1. 雙角色設計

同一個使用者可以同時是某群組的團主，也是另一個群組的成員。`GroupViewModal` 為薄殼，依登入者是否為 `hostId` 決定渲染 `HostGroupView`（審核、收款、啟用）或 `MemberGroupView`（付款、退出）。

### 2. Firestore 即時聊天 + Safari 相容

訊息中心使用 Firestore `onSnapshot` 實現即時同步。Safari 在特定網路條件下 WebChannel 會靜默斷線，透過 `experimentalForceLongPolling` 強制使用 LongPolling 解決。

### 3. 完整端對端資料流

申請 → 審核 → 成員建立 → 訂閱建立 → 付款確認 → 啟用服務，每一步由 Store 封裝業務邏輯，API 層只做 Firestore CRUD，兩層職責清楚分離。

### 4. Demo / 正式環境隔離

Demo 資料與正式資料存放於完全獨立的 Firestore collection（`demo_groups` vs. `groups`），由 `VITE_DEMO_MODE` 環境變數控制，兩者 document 不互相污染。

---

## 技術棧

| 類別 | 技術 |
|------|------|
| Frontend | React 19、Vite、React Router v7 |
| UI | Tailwind CSS v4（token 定義於 `index.css`）、lucide-react |
| Backend | Firebase Auth、Firebase Firestore |
| Realtime | Firestore `onSnapshot`、`experimentalForceLongPolling` |
| Architecture | Feature-based、Store + API 雙層分離、事件驅動跨元件通訊 |

---

## 快速開始

```bash
npm install
npm run dev   # http://localhost:5173
```

複製 `.env.example` 並填入 Firebase 設定後即可啟動。詳見[開發指南](docs/development.md)。

---

## 未來規劃

- [ ] Firestore Security Rules 補全（目前僅前端 ProtectedRoute）
- [ ] 正式金流串接（ECPay / 綠界）
- [ ] 信用評分完整機制（扣 / 加分邏輯）
- [ ] 逾期付款排程通知（Cloud Functions）
- [ ] 狀態管理遷移 Zustand + TypeScript

---

## 文件

| 文件 | 內容 |
|------|------|
| [架構與資料層](docs/architecture.md) | 資料夾結構、Store 設計、主要檔案連動 |
| [操作流程](docs/user-flows.md) | 申請、付款、啟用等完整流程圖與群組狀態機 |
| [Firestore Schema](docs/firestore-schema.md) | Collection 設計、事件驅動清單、狀態流程 |
| [開發指南](docs/development.md) | 環境變數、指令、Demo 資料、打包 |
